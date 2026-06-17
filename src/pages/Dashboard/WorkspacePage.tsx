import { useState, useEffect, useRef, useMemo, type ReactNode, type SyntheticEvent, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { FilePreviewModal } from '../../components/FilePreviewModal/FilePreviewModal';
import { useConfirmDialog } from '../../components/ConfirmDialog';
import { StyledSelect } from '../../components/StyledSelect';
import { WorkMetaEditor } from '../../components/WorkMetaEditor/WorkMetaEditor';
import { worksApi, filesApi, reviewsApi, reviewCriteriaApi } from '../../api';
import { useAuth, useWorkChat } from '../../hooks';
import {
  FileType,
  Role,
  WorkStatus,
  type FileVersionCompareResult,
  type Review,
  type ReviewCriteriaConfig,
  type Work,
  type WorkFile,
} from '../../types';
import { WORK_STATUS_LABELS } from '../../utils/constants';
import styles from './Workspace.module.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const STATUS_STEPS: WorkStatus[] = [
  WorkStatus.TOPIC_SELECTED,
  WorkStatus.APPROVED,
  WorkStatus.IN_PROGRESS,
  WorkStatus.REVIEW,
  WorkStatus.NEEDS_REVISION,
  WorkStatus.DEFENSE,
  WorkStatus.PUBLISHED,
];

const NEXT_STATUS_OPTIONS: Partial<Record<WorkStatus, WorkStatus[]>> = {
  [WorkStatus.DRAFT]: [WorkStatus.TOPIC_SELECTED],
  [WorkStatus.TOPIC_SELECTED]: [WorkStatus.APPROVED],
  [WorkStatus.APPROVED]: [WorkStatus.IN_PROGRESS],
  [WorkStatus.IN_PROGRESS]: [WorkStatus.REVIEW],
  [WorkStatus.REVIEW]: [WorkStatus.NEEDS_REVISION, WorkStatus.DEFENSE],
  [WorkStatus.NEEDS_REVISION]: [WorkStatus.REVIEW],
  [WorkStatus.DEFENSE]: [WorkStatus.PUBLISHED],
  [WorkStatus.PUBLISHED]: [],
};

const FILE_UPLOAD_ENABLED_STATUSES = new Set<WorkStatus>([
  WorkStatus.DRAFT,
  WorkStatus.TOPIC_SELECTED,
  WorkStatus.APPROVED,
  WorkStatus.IN_PROGRESS,
  WorkStatus.NEEDS_REVISION,
]);

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatBytes(size?: number): string {
  if (!size || size <= 0) return 'размер не указан';
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;
  return `${(size / 1024 / 1024).toFixed(1)} МБ`;
}

function FileIcon({ type }: { type: string }): ReactNode {
  if (type === 'PDF') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      </svg>
    );
  }
  if (type === 'PRESENTATION') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h20" />
        <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
        <path d="m7 21 5-5 5 5" />
      </svg>
    );
  }
  if (type === 'VIDEO') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
        <rect x="2" y="6" width="14" height="12" rx="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function getFileFormat(file: WorkFile): string {
  const ext = file.originalName.split('.').pop()?.trim();
  if (ext && ext.length <= 6 && ext !== file.originalName) {
    return ext.toUpperCase();
  }

  if (file.type === 'PRESENTATION') return 'PPTX';
  if (file.type === 'VIDEO') return 'MP4';
  if (file.type === 'PDF') return 'PDF';
  return 'FILE';
}

function sortFileVersions(files?: WorkFile[]): WorkFile[] {
  return [...(files ?? [])].sort((a, b) => {
    const byVersion = (b.version ?? 0) - (a.version ?? 0);
    if (byVersion !== 0) return byVersion;
    return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
  });
}

function formatDiffValue(changeField: string, value: string | null): string {
  if (!value) return '—';
  if (changeField === 'createdAt') return formatTime(value);
  if (changeField === 'size') return formatBytes(Number(value));
  return value;
}

interface PdfDiffModalProps {
  diff: FileVersionCompareResult | null;
  onClose: () => void;
}

type PdfDiffHighlightType = 'added' | 'removed';

interface PdfHighlightRect {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  text: string;
  type: PdfDiffHighlightType;
}

interface PdfRenderedPage {
  pageNumber: number;
  page: PDFPageProxy;
  width: number;
  height: number;
  highlights: PdfHighlightRect[];
}

interface PdfTextLine {
  text: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  baseline: number;
}

function normalizePdfDiffText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getDiffNeedles(diff: FileVersionCompareResult, type: PdfDiffHighlightType): string[] {
  return diff.textDiff.items
    .filter((item) => item.type === type)
    .map((item) => normalizePdfDiffText(item.text))
    .filter((text) => text.length >= 8)
    .sort((a, b) => b.length - a.length);
}

async function getPageTextLines(page: PDFPageProxy, viewport: ReturnType<PDFPageProxy['getViewport']>): Promise<PdfTextLine[]> {
  const textContent = await page.getTextContent();
  const lines: Array<PdfTextLine & { parts: Array<{ left: number; text: string }> }> = [];

  textContent.items.forEach((rawItem) => {
    if (!('str' in rawItem) || !rawItem.str.trim()) return;
    const item = rawItem as { str: string; transform: number[]; width: number; height: number };
    const transform = pdfjsLib.Util.transform(viewport.transform, item.transform);
    const left = transform[4];
    const baseline = transform[5];
    const height = Math.max(Math.abs(transform[3]), item.height * viewport.scale, 8);
    const width = Math.max(item.width * viewport.scale, item.str.length * height * 0.38, 4);
    const top = baseline - height;
    const bottom = baseline + Math.max(height * 0.18, 2);
    const existing = lines.find((line) => Math.abs(line.baseline - baseline) <= Math.max(height * 0.45, 5));

    if (existing) {
      existing.left = Math.min(existing.left, left);
      existing.top = Math.min(existing.top, top);
      existing.right = Math.max(existing.right, left + width);
      existing.bottom = Math.max(existing.bottom, bottom);
      existing.parts.push({ left, text: item.str });
      return;
    }

    lines.push({
      text: item.str,
      left,
      top,
      right: left + width,
      bottom,
      baseline,
      parts: [{ left, text: item.str }],
    });
  });

  return lines
    .map((line) => ({
      ...line,
      text: line.parts
        .sort((a, b) => a.left - b.left)
        .map((part) => part.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
    }))
    .filter((line) => line.text.length > 0)
    .sort((a, b) => a.top - b.top || a.left - b.left);
}

function buildPageHighlights(lines: PdfTextLine[], needles: string[], type: PdfDiffHighlightType, pageNumber: number): PdfHighlightRect[] {
  const used = new Set<number>();
  const highlights: PdfHighlightRect[] = [];

  needles.forEach((needle, needleIndex) => {
    const lineIndex = lines.findIndex((line, index) => {
      if (used.has(index)) return false;
      const lineText = normalizePdfDiffText(line.text);
      return lineText.includes(needle) || needle.includes(lineText);
    });

    if (lineIndex === -1) return;
    const line = lines[lineIndex];
    used.add(lineIndex);
    highlights.push({
      id: `${type}-${String(pageNumber)}-${String(needleIndex)}`,
      left: Math.max(line.left - 4, 0),
      top: Math.max(line.top - 3, 0),
      width: Math.max(line.right - line.left + 8, 16),
      height: Math.max(line.bottom - line.top + 6, 12),
      text: line.text,
      type,
    });
  });

  return highlights;
}

interface PdfDiffDocumentProps {
  data: ArrayBuffer | null;
  diff: FileVersionCompareResult;
  type: PdfDiffHighlightType;
}

function PdfDiffDocument({ data, diff, type }: PdfDiffDocumentProps): ReactNode {
  const [pages, setPages] = useState<PdfRenderedPage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const needles = useMemo(() => getDiffNeedles(diff, type), [diff, type]);

  useEffect(() => {
    if (!data) {
      setPages([]);
      return;
    }

    let cancelled = false;
    let pdfDocument: PDFDocumentProxy | null = null;
    setPages([]);
    setError(null);

    void (async (): Promise<void> => {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: data.slice(0) });
        pdfDocument = await loadingTask.promise;
        const nextPages: PdfRenderedPage[] = [];

        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
          if (cancelled) return;
          const page = await pdfDocument.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.35 });
          const lines = await getPageTextLines(page, viewport);
          nextPages.push({
            pageNumber,
            page,
            width: viewport.width,
            height: viewport.height,
            highlights: buildPageHighlights(lines, needles, type, pageNumber),
          });
        }

        if (!cancelled) setPages(nextPages);
      } catch {
        if (!cancelled) setError('Не удалось отрисовать PDF для diff.');
      }
    })();

    return () => {
      cancelled = true;
      void pdfDocument?.destroy();
    };
  }, [data, diff, type, needles]);

  if (!data) return <div className={styles.pdfDiffCentered}>Загрузка...</div>;
  if (error) return <div className={styles.pdfDiffCentered}>{error}</div>;
  if (pages.length === 0) return <div className={styles.pdfDiffCentered}>Подготовка страниц...</div>;

  return (
    <div className={styles.pdfDiffDocument}>
      {pages.map((page) => (
        <PdfDiffPage key={page.pageNumber} pageData={page} />
      ))}
    </div>
  );
}

function PdfDiffPage({ pageData }: { pageData: PdfRenderedPage }): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const viewport = pageData.page.getViewport({ scale: 1.35 });
    const outputScale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

    const renderTask = pageData.page.render({ canvas, canvasContext: context, viewport });
    return () => {
      renderTask.cancel();
    };
  }, [pageData]);

  return (
    <div className={styles.pdfDiffPage} style={{ width: pageData.width, height: pageData.height }}>
      <canvas ref={canvasRef} className={styles.pdfDiffCanvas} />
      <div className={styles.pdfDiffHighlightLayer}>
        {pageData.highlights.map((highlight) => (
          <div
            key={highlight.id}
            className={highlight.type === 'added' ? styles.pdfDiffHighlightAdded : styles.pdfDiffHighlightRemoved}
            style={{
              left: highlight.left,
              top: highlight.top,
              width: highlight.width,
              height: highlight.height,
            }}
            title={`${highlight.type === 'added' ? '+' : '-'} ${highlight.text}`}
          >
            <span>{highlight.type === 'added' ? '+' : '-'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PdfDiffModal({ diff, onClose }: PdfDiffModalProps): ReactNode {
  const [fromData, setFromData] = useState<ArrayBuffer | null>(null);
  const [toData, setToData] = useState<ArrayBuffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!diff) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setFromData(null);
    setToData(null);

    Promise.all([filesApi.getBlob(diff.from.id), filesApi.getBlob(diff.to.id)])
      .then(([fromBlob, toBlob]) => {
        if (cancelled) return;
        return Promise.all([fromBlob.arrayBuffer(), toBlob.arrayBuffer()]);
      })
      .then((buffers) => {
        if (cancelled || !buffers) return;
        setFromData(buffers[0]);
        setToData(buffers[1]);
      })
      .catch(() => {
        if (!cancelled) setError('Не удалось загрузить PDF-файлы для сравнения.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [diff]);

  useEffect(() => {
    if (!diff) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [diff, onClose]);

  if (!diff) return null;

  const handleBackdrop = (e: MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) onClose();
  };

  const changedMetadata = diff.metadataChanges.filter((change) => change.changed);

  return createPortal(
    <div className={styles.pdfDiffOverlay} role="dialog" aria-modal="true" aria-labelledby="pdf-diff-title" onMouseDown={handleBackdrop}>
      <div className={styles.pdfDiffPanel}>
        <div className={styles.pdfDiffToolbar}>
          <div className={styles.pdfDiffTitleBlock}>
            <h2 id="pdf-diff-title" className={styles.pdfDiffTitle}>
              PDF diff: v{String(diff.from.version)} -&gt; v{String(diff.to.version)}
            </h2>
            <div className={styles.pdfDiffSubtitle}>
              {diff.from.originalName} -&gt; {diff.to.originalName}
            </div>
          </div>
          <div className={styles.pdfDiffStats}>
            <span className={styles.pdfDiffAddStat}>+{diff.textDiff.addedCount}</span>
            <span className={styles.pdfDiffRemoveStat}>-{diff.textDiff.removedCount}</span>
          </div>
          <button type="button" className={styles.pdfDiffClose} onClick={onClose} aria-label="Закрыть сравнение">
            ×
          </button>
        </div>

        {changedMetadata.length > 0 && (
          <div className={styles.pdfDiffMetaBar}>
            {changedMetadata.map((change) => (
              <span key={change.field} className={styles.pdfDiffMetaItem}>
                {change.label}: {formatDiffValue(change.field, change.before)} -&gt; {formatDiffValue(change.field, change.after)}
              </span>
            ))}
          </div>
        )}

        <div className={styles.pdfDiffBody}>
          <div className={styles.pdfDiffPane}>
            <div className={styles.pdfDiffPaneHeader}>
              <span>Старая версия</span>
              <strong>v{String(diff.from.version)}</strong>
            </div>
            {loading && <div className={styles.pdfDiffCentered}>Загрузка...</div>}
            {error && !loading && <div className={styles.pdfDiffCentered}>{error}</div>}
            {!loading && !error && (
              <PdfDiffDocument data={fromData} diff={diff} type="removed" />
            )}
          </div>
          <div className={styles.pdfDiffPane}>
            <div className={styles.pdfDiffPaneHeader}>
              <span>Новая версия</span>
              <strong>v{String(diff.to.version)}</strong>
            </div>
            {loading && <div className={styles.pdfDiffCentered}>Загрузка...</div>}
            {error && !loading && <div className={styles.pdfDiffCentered}>{error}</div>}
            {!loading && !error && (
              <PdfDiffDocument data={toData} diff={diff} type="added" />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function WorkspacePage(): ReactNode {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requestConfirmation, showMessage } = useConfirmDialog();

  const [work, setWork] = useState<Work | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [newStatus, setNewStatus] = useState<WorkStatus | ''>('');
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [isVersionUploading, setIsVersionUploading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [criteria, setCriteria] = useState<ReviewCriteriaConfig[]>([]);
  const [isReviewLoading, setIsReviewLoading] = useState(true);
  const [reviewScores, setReviewScores] = useState<Record<string, number>>({});
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewSaveError, setReviewSaveError] = useState('');
  const [previewFile, setPreviewFile] = useState<WorkFile | null>(null);
  const [compareFromId, setCompareFromId] = useState('');
  const [compareToId, setCompareToId] = useState('');
  const [versionDiff, setVersionDiff] = useState<FileVersionCompareResult | null>(null);
  const [isComparingVersions, setIsComparingVersions] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isChatFileUploading, setIsChatFileUploading] = useState(false);
  const versionFileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, setMessages, connected, sendMessage } = useWorkChat(id ?? '');

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    void Promise.all([
      worksApi.getById(id),
      worksApi.getMessages(id),
      reviewsApi.getByWork(id),
      reviewCriteriaApi.getAll(),
    ])
      .then(([workData, msgs, reviewData, criteriaData]) => {
        if (!workData) { void navigate('/dashboard'); return; }
        setWork(workData);
        setMessages(msgs);
        setReviews(reviewData);
        setCriteria(criteriaData);
      })
      .catch(() => void navigate('/dashboard'))
      .finally(() => {
        setIsLoading(false);
        setIsReviewLoading(false);
      });
  }, [id, navigate, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const versions = sortFileVersions(work?.files).filter((file) => file.type === FileType.PDF);
    if (versions.length < 2) return;
    const ids = new Set(versions.map((file) => file.id));
    if (!compareToId || !ids.has(compareToId)) {
      setCompareToId(versions[0].id);
    }
    if (!compareFromId || !ids.has(compareFromId) || compareFromId === compareToId) {
      setCompareFromId(versions[1].id);
    }
  }, [work?.files, compareFromId, compareToId]);

  const isSupervisor = user?.role === Role.SUPERVISOR && user.id === work?.supervisorId;
  const isAuthor = user?.id === work?.authorId;
  const canAccess = isSupervisor || isAuthor;
  const topicIsLocked = work ? STATUS_STEPS.indexOf(work.status) >= STATUS_STEPS.indexOf(WorkStatus.APPROVED) : false;
  const canEditWorkInfo = isSupervisor || (isAuthor && !topicIsLocked);
  const canUploadFiles = Boolean(work && FILE_UPLOAD_ENABLED_STATUSES.has(work.status));
  const canUploadFinalFile = (isSupervisor || isAuthor) && canUploadFiles;
  const availableStatusOptions = work ? NEXT_STATUS_OPTIONS[work.status] ?? [] : [];
  const canManageStatus =
    isSupervisor && availableStatusOptions.length > 0 && work?.status !== WorkStatus.PUBLISHED;
  const canManageSupervisorReview = isSupervisor && work?.status === WorkStatus.DEFENSE;
  const supervisorReview = reviews.find((review) => review.reviewerId === work?.supervisorId) ?? null;
  const isSupervisorReviewComplete =
    Boolean(supervisorReview?.isFinalized) &&
    criteria.length > 0 &&
    criteria.every((criterion) => typeof supervisorReview?.criteria[criterion.id] === 'number');

  useEffect(() => {
    if (criteria.length === 0) return;
    const nextScores: Record<string, number> = {};
    criteria.forEach((criterion) => {
      nextScores[criterion.id] = supervisorReview?.criteria[criterion.id] ?? Math.round(criterion.maxScore / 2);
    });
    setReviewScores(nextScores);
    setReviewComment(supervisorReview?.comment ?? '');
  }, [criteria, supervisorReview]);

  const handleSendMessage = (e: SyntheticEvent): void => {
    e.preventDefault();
    if ((!messageText.trim() && !attachedFile) || !id || !connected || isChatFileUploading) return;
    void (async (): Promise<void> => {
      setIsChatFileUploading(true);
      try {
        const uploaded = attachedFile
          ? await filesApi.upload(id, attachedFile, 'Файл из чата')
          : null;
        if (uploaded) {
          setWork((prev) =>
            prev ? { ...prev, files: [uploaded, ...(prev.files ?? [])] } : prev,
          );
        }
        sendMessage(messageText.trim() || 'Файл', uploaded?.id);
        setMessageText('');
        setAttachedFile(null);
      } finally {
        setIsChatFileUploading(false);
      }
    })();
  };

  const handleStatusUpdate = async (nextStatus = newStatus): Promise<void> => {
    if (!nextStatus || !id) return;
    if (nextStatus === work?.status) {
      setNewStatus('');
      return;
    }
    if (nextStatus === WorkStatus.PUBLISHED) {
      if (!isSupervisorReviewComplete) {
        await showMessage({
          title: 'Публикация недоступна',
          message: 'Перед публикацией заполните все критерии оценки и финализируйте оценку преподавателя.',
          variant: 'warning',
        });
        return;
      }
      const confirmed = await requestConfirmation({
        title: 'Опубликовать работу в каталоге?',
        message: 'После завершения работа станет видна всем пользователям каталога.',
        confirmLabel: 'Завершить',
        variant: 'warning',
      });
      if (!confirmed) {
        return;
      }
    }
    setIsStatusUpdating(true);
    try {
      const updated = await worksApi.updateStatus(id, nextStatus);
      setWork(updated);
      setNewStatus('');
    } catch {
      // ignore
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handleFinalFileUploaded = (file: WorkFile): void => {
    setWork((prev) =>
      prev ? { ...prev, files: [file, ...(prev.files ?? [])] } : prev,
    );
    setVersionDiff(null);
  };

  const handleVersionFileUpload = async (file: File): Promise<void> => {
    if (!id || !canUploadFiles) return;
    setIsVersionUploading(true);
    try {
      const uploaded = await filesApi.upload(id, file, 'Версия файла');
      setWork((prev) =>
        prev ? { ...prev, files: [uploaded, ...(prev.files ?? [])] } : prev,
      );
      setVersionDiff(null);
    } catch {
      // ignore
    } finally {
      setIsVersionUploading(false);
    }
  };

  const handleCompareVersions = async (): Promise<void> => {
    if (!id || !compareFromId || !compareToId || compareFromId === compareToId) return;
    setIsComparingVersions(true);
    try {
      const diff = await filesApi.compareVersions(id, compareFromId, compareToId);
      setVersionDiff(diff);
    } catch {
      setVersionDiff(null);
    } finally {
      setIsComparingVersions(false);
    }
  };

  const calculateReviewTotal = (): number => {
    let weightedSum = 0;
    let weightTotal = 0;
    criteria.forEach((criterion) => {
      const score = reviewScores[criterion.id] ?? Math.round(criterion.maxScore / 2);
      weightedSum += score * criterion.weight;
      weightTotal += criterion.maxScore * criterion.weight;
    });
    if (weightTotal === 0) return 0;
    return Math.round((weightedSum / weightTotal) * 100 * 100) / 100;
  };

  const buildReviewPayload = (): { criteria: Record<string, number>; weights: Record<string, number>; comment?: string } => {
    const criteriaPayload: Record<string, number> = {};
    const weightsPayload: Record<string, number> = {};
    criteria.forEach((criterion) => {
      criteriaPayload[criterion.id] = reviewScores[criterion.id] ?? Math.round(criterion.maxScore / 2);
      weightsPayload[criterion.id] = criterion.weight;
    });
    return {
      criteria: criteriaPayload,
      weights: weightsPayload,
      comment: reviewComment.trim() || undefined,
    };
  };

  const refreshReviewsAndWork = async (): Promise<void> => {
    if (!id) return;
    const [updatedReviews, updatedWork] = await Promise.all([
      reviewsApi.getByWork(id),
      worksApi.getById(id),
    ]);
    setReviews(updatedReviews);
    setWork(updatedWork);
  };

  const handleSaveSupervisorReview = async (): Promise<void> => {
    if (!id || !isSupervisor || criteria.length === 0) return;
    setIsReviewSubmitting(true);
    setReviewSaveError('');
    try {
      const savedReview = supervisorReview
        ? await reviewsApi.update(supervisorReview.id, buildReviewPayload())
        : await reviewsApi.create(id, buildReviewPayload());
      if (!savedReview.isFinalized) {
        await reviewsApi.finalize(savedReview.id);
      }
      await refreshReviewsAndWork();
      setIsReviewModalOpen(false);
    } catch {
      setReviewSaveError('Не удалось сохранить оценку. Проверьте подключение и попробуйте ещё раз.');
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  if (isLoading) return <div className={styles.loading}>Загрузка...</div>;
  if (!work || !canAccess) return <div className={styles.loading}>Нет доступа</div>;

  const currentStatusIdx = STATUS_STEPS.indexOf(work.status);
  const isPublished = work.status === WorkStatus.PUBLISHED;
  const fileVersions = sortFileVersions(work.files);
  const pdfFileVersions = fileVersions.filter((file) => file.type === FileType.PDF);

  return (
    <div className={styles.page}>
      <div className={styles.backLink}>
        <Link to="/dashboard">← Личный кабинет</Link>
        {isPublished && (
          <Link to={`/catalog/${work.id}`} style={{ marginLeft: '1rem' }}>
            Смотреть в каталоге →
          </Link>
        )}
      </div>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{work.title}</h1>
          <div className={styles.meta}>
            <span className={styles.statusBadge}>{WORK_STATUS_LABELS[work.status] ?? work.status}</span>
            {work.author && <span>{work.author.fullName}</span>}
            {work.supervisor && <span>Преподаватель: {work.supervisor.fullName}</span>}
            <span className={connected ? styles.connectedBadge : styles.disconnectedBadge}>
              {connected ? '● онлайн' : '○ оффлайн'}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.workMetaBlock}>
        {(canEditWorkInfo || canUploadFinalFile) && (
          <WorkMetaEditor
            work={work}
            onSaved={(w) => { setWork(w); }}
            canEditMeta={canEditWorkInfo}
            canUploadFinalFile={canUploadFinalFile}
            onFileUploaded={handleFinalFileUploaded}
          />
        )}
        {work.description?.trim() && (
          <div className={styles.textBlock}>
            <h3 className={styles.textBlockTitle}>Описание</h3>
            <p className={styles.textBlockBody}>{work.description}</p>
          </div>
        )}
        <div className={styles.textBlock}>
          <h3 className={styles.textBlockTitle}>Аннотация</h3>
          {work.annotation?.trim() ? (
            <p className={styles.textBlockBody}>{work.annotation}</p>
          ) : (
            <p className={styles.textBlockMuted}>Аннотация не заполнена — укажите её в форме редактирования выше.</p>
          )}
        </div>
      </div>

      {/* Progress */}
      {!isPublished && (
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Прогресс работы</span>
          </div>
          <div className={styles.statusSteps}>
            {STATUS_STEPS.map((s, idx) => (
              <div key={s} className={`${styles.statusStep} ${idx <= currentStatusIdx ? styles.statusStepDone : ''}`}>
                <div className={styles.statusStepDot} />
                <span>{WORK_STATUS_LABELS[s] ?? s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.content}>
        {/* Stages + Files Panel */}
        <div className={styles.stagesPanel}>
          {/* Files */}
          <div className={styles.filesSection}>
            <div className={styles.filesSectionHeader}>
              <h3 className={styles.filesSectionTitle}>
                Версии файлов ({fileVersions.length})
              </h3>
              <input
                ref={versionFileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleVersionFileUpload(file);
                  e.target.value = '';
                }}
              />
              {canUploadFiles && (
                <button
                  type="button"
                  className={styles.attachVersionBtn}
                  disabled={isVersionUploading}
                  onClick={() => { versionFileInputRef.current?.click(); }}
                >
                  {isVersionUploading ? 'Загрузка...' : 'Прикрепить версию'}
                </button>
              )}
            </div>
            {fileVersions.length > 0 && (
              <div className={styles.filesList}>
                {fileVersions.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`${styles.fileItem} ${styles.fileItemBtn}`}
                    onClick={() => { setPreviewFile(f); }}
                    aria-label={`Открыть предпросмотр: ${f.originalName}`}
                  >
                    <span className={styles.fileIcon} aria-hidden>
                      <FileIcon type={f.type} />
                    </span>
                    <div className={styles.fileMeta}>
                      <span className={styles.fileName}>
                        v{String(f.version ?? 1)} · {f.originalName}
                      </span>
                      <span className={styles.fileDetails}>
                        {formatTime(f.createdAt)} · {formatBytes(f.size)}
                      </span>
                      {f.comment && (
                        <span className={styles.fileComment}>{f.comment}</span>
                      )}
                    </div>
                    <span className={styles.fileTypeBadge}>{getFileFormat(f)}</span>
                    <span className={styles.fileOpenHint}>
                      <span className={styles.fileOpenText}>Просмотр</span>
                      <span className={styles.fileOpenArrow} aria-hidden>→</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {fileVersions.length === 0 && (
              <div className={styles.versionEmpty}>Файлы ещё не загружены</div>
            )}

            {isSupervisor && pdfFileVersions.length >= 2 && (
              <div className={styles.versionCompare}>
                <h3 className={styles.versionCompareTitle}>Сравнение PDF-версий</h3>
                <div className={styles.versionCompareControls}>
                  <StyledSelect
                    className={styles.versionSelect}
                    value={compareFromId}
                    onChange={setCompareFromId}
                    options={pdfFileVersions.map((file) => ({
                      value: file.id,
                      label: `v${String(file.version)} · ${file.originalName}`,
                    }))}
                    ariaLabel="Версия для сравнения от"
                  />
                  <StyledSelect
                    className={styles.versionSelect}
                    value={compareToId}
                    onChange={setCompareToId}
                    options={pdfFileVersions.map((file) => ({
                      value: file.id,
                      label: `v${String(file.version)} · ${file.originalName}`,
                    }))}
                    ariaLabel="Версия для сравнения до"
                  />
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    disabled={!compareFromId || !compareToId || compareFromId === compareToId || isComparingVersions}
                    onClick={() => void handleCompareVersions()}
                  >
                    {isComparingVersions ? '...' : 'Открыть diff'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {(canManageSupervisorReview || canManageStatus) && (
            <>
            {canManageSupervisorReview && (
              <div className={styles.supervisorReviewSection}>
                <div className={styles.reviewHeader}>
                  <div>
                    <h3 className={styles.reviewTitle}>Оценка преподавателя</h3>
                    <p className={styles.reviewHint}>
                      Заполняется после допуска к защите перед завершением работы.
                    </p>
                  </div>
                  <span className={isSupervisorReviewComplete ? styles.reviewReadyBadge : styles.reviewDraftBadge}>
                    {isSupervisorReviewComplete ? 'Готово' : 'Нужно заполнить'}
                  </span>
                </div>

                {isReviewLoading && (
                  <div className={styles.reviewEmpty}>Загрузка критериев...</div>
                )}

                {!isReviewLoading && criteria.length === 0 && (
                  <div className={styles.reviewEmpty}>Критерии оценки не настроены</div>
                )}

                {!isReviewLoading && criteria.length > 0 && (
                  <div className={styles.reviewCompact}>
                    <div className={styles.reviewCompactScore}>
                      <span>Итоговая оценка</span>
                      <strong>{supervisorReview ? `${supervisorReview.totalScore}%` : 'не выставлена'}</strong>
                    </div>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => {
                        setReviewSaveError('');
                        setIsReviewModalOpen(true);
                      }}
                    >
                      {supervisorReview ? 'Редактировать оценку' : 'Выставить оценку'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {canManageStatus && (
              <div className={styles.statusUpdateSection}>
                <h3 className={styles.statusUpdateTitle}>Следующий статус</h3>
                <div className={styles.statusActionList}>
                  {availableStatusOptions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={styles.btnPrimary}
                      disabled={isStatusUpdating || (status === WorkStatus.PUBLISHED && !isSupervisorReviewComplete)}
                      onClick={() => {
                        setNewStatus(status);
                        void handleStatusUpdate(status);
                      }}
                    >
                      {isStatusUpdating ? '...' : WORK_STATUS_LABELS[status] ?? status}
                    </button>
                  ))}
                </div>
                {availableStatusOptions.includes(WorkStatus.PUBLISHED) && !isSupervisorReviewComplete && (
                  <p className={styles.publishHint}>
                    Завершение станет доступно после финализации оценки преподавателя.
                  </p>
                )}
              </div>
            )}
            </>
          )}
        </div>

        {/* Chat Panel */}
        <div className={styles.chatPanel}>
          <h2 className={styles.panelTitle}>
            Чат с {isSupervisor ? 'студентом' : 'преподавателем'}
          </h2>
          <div className={styles.chatMessages}>
            {messages.length === 0 && (
              <div className={styles.chatEmpty}>Сообщений пока нет. Начните общение!</div>
            )}
            {messages.map((msg) => {
              const isMyMsg = msg.authorId === user?.id;
              return (
                <div key={msg.id} className={`${styles.chatMsg} ${isMyMsg ? styles.chatMsgMy : styles.chatMsgOther}`}>
                  <div className={styles.chatMsgAuthor}>{msg.author.fullName}</div>
                  <div className={styles.chatMsgText}>{msg.text}</div>
                  {msg.file && (
                    <button
                      type="button"
                      className={styles.chatFileCard}
                      onClick={() => { setPreviewFile(msg.file); }}
                    >
                      <span className={styles.chatFileIcon} aria-hidden>📄</span>
                      <span className={styles.chatFileInfo}>
                        <span className={styles.chatFileName}>{msg.file.originalName}</span>
                        <span className={styles.chatFileMeta}>v{String(msg.file.version)} · {formatBytes(msg.file.size)}</span>
                      </span>
                    </button>
                  )}
                  <div className={styles.chatMsgTime}>{formatTime(msg.createdAt)}</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <form className={styles.chatForm} onSubmit={handleSendMessage}>
            <div className={styles.chatComposerMain}>
              {attachedFile && (
                <div className={styles.attachedFilePreview}>
                  <span>{attachedFile.name}</span>
                  <button type="button" onClick={() => { setAttachedFile(null); }}>×</button>
                </div>
              )}
              <textarea
                className={styles.chatInput}
                placeholder="Сообщение... (Enter для отправки)"
                value={messageText}
                onChange={(e) => { setMessageText(e.target.value); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                rows={2}
              />
            </div>
            <input
              ref={chatFileInputRef}
              type="file"
              hidden
              onChange={(e) => {
                setAttachedFile(e.target.files?.[0] ?? null);
                e.target.value = '';
              }}
            />
            {canUploadFiles && (
              <button
                type="button"
                className={styles.btnAttach}
                onClick={() => { chatFileInputRef.current?.click(); }}
                disabled={isChatFileUploading}
              >
                Прикрепить
              </button>
            )}
            <button
              type="submit"
              className={styles.btnSend}
              disabled={(!messageText.trim() && !attachedFile) || !connected || isChatFileUploading}
            >
              {isChatFileUploading ? 'Загрузка...' : 'Отправить'}
            </button>
          </form>
        </div>
      </div>

      <FilePreviewModal
        file={
          previewFile
            ? { id: previewFile.id, originalName: previewFile.originalName, type: previewFile.type }
            : null
        }
        onClose={() => { setPreviewFile(null); }}
      />
      <PdfDiffModal diff={versionDiff} onClose={() => { setVersionDiff(null); }} />
      {isReviewModalOpen && createPortal(
        <div
          className={styles.reviewModalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsReviewModalOpen(false);
          }}
        >
          <div className={styles.reviewModal}>
            <div className={styles.reviewModalHeader}>
              <div>
                <h2 id="review-modal-title" className={styles.reviewModalTitle}>
                  {supervisorReview ? 'Редактирование оценки' : 'Оценка преподавателя'}
                </h2>
                <p className={styles.reviewModalHint}>
                  Заполните критерии и сохраните оценку перед публикацией.
                </p>
              </div>
              <button
                type="button"
                className={styles.reviewModalClose}
                onClick={() => { setIsReviewModalOpen(false); }}
                aria-label="Закрыть оценку"
              >
                ×
              </button>
            </div>

            <div className={styles.reviewCriteriaList}>
              {criteria.map((criterion) => (
                <div key={criterion.id} className={styles.reviewCriterion}>
                  <div className={styles.reviewCriterionHeader}>
                    <span className={styles.reviewCriterionName}>{criterion.name}</span>
                    <strong className={styles.reviewCriterionScore}>
                      {reviewScores[criterion.id] ?? Math.round(criterion.maxScore / 2)}/{criterion.maxScore}
                    </strong>
                  </div>
                  {criterion.description && (
                    <div className={styles.reviewCriterionDescription}>
                      {criterion.description}
                    </div>
                  )}
                  <input
                    type="range"
                    min={0}
                    max={criterion.maxScore}
                    step={1}
                    value={reviewScores[criterion.id] ?? Math.round(criterion.maxScore / 2)}
                    disabled={isReviewSubmitting}
                    onChange={(e) => {
                      setReviewScores((prev) => ({
                        ...prev,
                        [criterion.id]: parseInt(e.target.value, 10),
                      }));
                    }}
                    className={styles.reviewRange}
                  />
                </div>
              ))}
            </div>

            <label className={styles.reviewCommentLabel}>
              Комментарий
              <textarea
                value={reviewComment}
                onChange={(e) => { setReviewComment(e.target.value); }}
                className={styles.reviewComment}
                placeholder="Краткий вывод по работе"
                disabled={isReviewSubmitting}
              />
            </label>

            <div className={styles.reviewTotal}>
              <span>Итоговая оценка</span>
              <strong>{calculateReviewTotal()}%</strong>
            </div>

            {reviewSaveError && (
              <div className={styles.reviewError}>{reviewSaveError}</div>
            )}

            <div className={styles.reviewActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                disabled={isReviewSubmitting}
                onClick={() => { setIsReviewModalOpen(false); }}
              >
                Отмена
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={isReviewSubmitting}
                onClick={() => { void handleSaveSupervisorReview(); }}
              >
                {isReviewSubmitting ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
