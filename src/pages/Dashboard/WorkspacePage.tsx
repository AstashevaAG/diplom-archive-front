import { useState, useEffect, useRef, type ReactNode, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FilePreviewModal } from '../../components/FilePreviewModal/FilePreviewModal';
import { WorkMetaEditor } from '../../components/WorkMetaEditor/WorkMetaEditor';
import { worksApi, stagesApi, filesApi } from '../../api';
import { useAuth, useWorkChat } from '../../hooks';
import {
  WorkStatus,
  type FileVersionCompareResult,
  type Work,
  type WorkFile,
  type WorkStage,
} from '../../types';
import { WORK_STATUS_LABELS } from '../../utils/constants';
import styles from './Workspace.module.css';

const STATUS_STEPS: WorkStatus[] = [
  WorkStatus.TOPIC_SELECTED,
  WorkStatus.APPROVED,
  WorkStatus.IN_PROGRESS,
  WorkStatus.REVIEW,
  WorkStatus.DEFENSE,
  WorkStatus.PUBLISHED,
];

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

export function WorkspacePage(): ReactNode {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [work, setWork] = useState<Work | null>(null);
  const [stages, setStages] = useState<WorkStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [newStatus, setNewStatus] = useState<WorkStatus | ''>('');
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [isChatFileUploading, setIsChatFileUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<WorkFile | null>(null);
  const [compareFromId, setCompareFromId] = useState('');
  const [compareToId, setCompareToId] = useState('');
  const [versionDiff, setVersionDiff] = useState<FileVersionCompareResult | null>(null);
  const [isComparingVersions, setIsComparingVersions] = useState(false);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, setMessages, connected, sendMessage } = useWorkChat(id ?? '');

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    void Promise.all([
      worksApi.getById(id),
      worksApi.getMessages(id),
      stagesApi.getByWork(id),
    ])
      .then(([workData, msgs, stagesData]) => {
        if (!workData) { void navigate('/dashboard'); return; }
        setWork(workData);
        setMessages(msgs);
        setStages(stagesData);
      })
      .catch(() => void navigate('/dashboard'))
      .finally(() => setIsLoading(false));
  }, [id, navigate, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const versions = sortFileVersions(work?.files);
    if (versions.length < 2) return;
    const ids = new Set(versions.map((file) => file.id));
    if (!compareToId || !ids.has(compareToId)) {
      setCompareToId(versions[0].id);
    }
    if (!compareFromId || !ids.has(compareFromId) || compareFromId === compareToId) {
      setCompareFromId(versions[1].id);
    }
  }, [work?.files, compareFromId, compareToId]);

  const isSupervisor = user?.id === work?.supervisorId;
  const isAuthor = user?.id === work?.authorId;
  const canAccess = isSupervisor || isAuthor;
  const canEditWorkInfo = isSupervisor;
  const canUploadFinalFile = isSupervisor || isAuthor;

  const handleSendMessage = (e: FormEvent): void => {
    e.preventDefault();
    if ((!messageText.trim() && !attachedFile) || !id || !connected || isChatFileUploading) return;
    void (async (): Promise<void> => {
      setIsChatFileUploading(true);
      try {
        let fileId: string | undefined;
        if (attachedFile) {
          const uploaded = await filesApi.upload(
            id,
            attachedFile,
            messageText.trim() ? `Файл из чата: ${messageText.trim()}` : 'Файл из чата',
          );
          fileId = uploaded.id;
          setWork((prev) =>
            prev ? { ...prev, files: [uploaded, ...(prev.files ?? [])] } : prev,
          );
          setVersionDiff(null);
        }

        const text = messageText.trim() || `Прикреплён файл: ${attachedFile?.name ?? 'файл'}`;
        sendMessage(text, fileId);
        setMessageText('');
        setAttachedFile(null);
      } catch {
        // ignore
      } finally {
        setIsChatFileUploading(false);
      }
    })();
  };

  const handleStageToggle = async (stageId: string, completed: boolean): Promise<void> => {
    if (!id) return;
    try {
      const updated = await stagesApi.update(id, stageId, { isCompleted: completed });
      setStages((prev) => prev.map((s) => s.id === stageId ? updated : s));
    } catch {
      // ignore
    }
  };

  const handleStatusUpdate = async (): Promise<void> => {
    if (!newStatus || !id) return;
    if (newStatus === work?.status) {
      setNewStatus('');
      return;
    }
    if (newStatus === WorkStatus.PUBLISHED && !confirm('Опубликовать работу в каталоге? После этого она станет видна всем.')) {
      return;
    }
    setIsStatusUpdating(true);
    try {
      const updated = await worksApi.updateStatus(id, newStatus);
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

  if (isLoading) return <div className={styles.loading}>Загрузка...</div>;
  if (!work || !canAccess) return <div className={styles.loading}>Нет доступа</div>;

  const completedCount = stages.filter((s) => s.isCompleted).length;
  const progressPct = stages.length ? Math.round((completedCount / stages.length) * 100) : 0;
  const currentStatusIdx = STATUS_STEPS.indexOf(work.status);
  const isPublished = work.status === WorkStatus.PUBLISHED;
  const fileVersions = sortFileVersions(work.files);

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
            {work.supervisor && <span>Руководитель: {work.supervisor.fullName}</span>}
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
            onSaved={(w) => setWork(w)}
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
            <span className={styles.progressPct}>{progressPct}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
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
          {!isPublished && (
            <>
              <h2 className={styles.panelTitle}>Этапы</h2>
              <div className={styles.stagesList}>
                {stages.map((stage) => (
                  <label key={stage.id} className={styles.stageItem}>
                    <input
                      type="checkbox"
                      checked={stage.isCompleted}
                      onChange={(e) => void handleStageToggle(stage.id, e.target.checked)}
                      className={styles.stageCheck}
                    />
                    <span className={`${styles.stageName} ${stage.isCompleted ? styles.stageNameDone : ''}`}>
                      {stage.name}
                    </span>
                    {stage.isCompleted && stage.completedAt && (
                      <span className={styles.stageDate}>{formatTime(stage.completedAt)}</span>
                    )}
                  </label>
                ))}
              </div>
            </>
          )}

          {/* Files */}
          <div className={styles.filesSection}>
            <h3 className={styles.filesSectionTitle}>
              Версии файлов ({fileVersions.length})
            </h3>
            {fileVersions.length > 0 && (
              <div className={styles.filesList}>
                {fileVersions.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`${styles.fileItem} ${styles.fileItemBtn}`}
                    onClick={() => setPreviewFile(f)}
                    aria-label={`Открыть предпросмотр: ${f.originalName}`}
                  >
                    <span className={styles.fileIcon} aria-hidden>📄</span>
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
                      <span className={styles.fileTypeBadge}>{f.type}</span>
                    </div>
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

            {isSupervisor && fileVersions.length >= 2 && (
              <div className={styles.versionCompare}>
                <h3 className={styles.versionCompareTitle}>Сравнение версий</h3>
                <div className={styles.versionCompareControls}>
                  <select
                    className={styles.versionSelect}
                    value={compareFromId}
                    onChange={(e) => setCompareFromId(e.target.value)}
                  >
                    {fileVersions.map((file) => (
                      <option key={file.id} value={file.id}>
                        v{String(file.version)} · {formatTime(file.createdAt)}
                      </option>
                    ))}
                  </select>
                  <select
                    className={styles.versionSelect}
                    value={compareToId}
                    onChange={(e) => setCompareToId(e.target.value)}
                  >
                    {fileVersions.map((file) => (
                      <option key={file.id} value={file.id}>
                        v{String(file.version)} · {formatTime(file.createdAt)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    disabled={!compareFromId || !compareToId || compareFromId === compareToId || isComparingVersions}
                    onClick={() => void handleCompareVersions()}
                  >
                    {isComparingVersions ? '...' : 'Сравнить'}
                  </button>
                </div>

                {versionDiff && (
                  <div className={styles.versionDiff}>
                    <div className={styles.versionDiffSummary}>
                      v{String(versionDiff.from.version)} → v{String(versionDiff.to.version)}
                    </div>
                    <div className={styles.metadataDiffList}>
                      {versionDiff.metadataChanges.map((change) => (
                        <div
                          key={change.field}
                          className={`${styles.metadataDiffItem} ${change.changed ? styles.metadataDiffChanged : ''}`}
                        >
                          <span>{change.label}</span>
                          <strong>
                            {formatDiffValue(change.field, change.before)} → {formatDiffValue(change.field, change.after)}
                          </strong>
                        </div>
                      ))}
                    </div>
                    {versionDiff.textDiff.available ? (
                      <div className={styles.textDiffBlock}>
                        <div className={styles.textDiffStats}>
                          +{versionDiff.textDiff.addedCount} / -{versionDiff.textDiff.removedCount}
                        </div>
                        <div className={styles.textDiffList}>
                          {versionDiff.textDiff.items
                            .filter((item) => item.type !== 'unchanged')
                            .slice(0, 12)
                            .map((item, index) => (
                              <div
                                key={`${item.type}-${String(index)}`}
                                className={item.type === 'added' ? styles.diffAdded : styles.diffRemoved}
                              >
                                {item.type === 'added' ? '+ ' : '- '}
                                {item.text}
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className={styles.textDiffUnavailable}>
                        {versionDiff.textDiff.message}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {isSupervisor && !isPublished && (
            <div className={styles.statusUpdateSection}>
              <h3 className={styles.statusUpdateTitle}>Статус работы</h3>
              <div className={styles.statusUpdateRow}>
                <select
                  className={styles.statusSelect}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as WorkStatus)}
                >
                  <option value="">Выберите статус</option>
                  {STATUS_STEPS.map((s) => (
                    <option key={s} value={s}>{WORK_STATUS_LABELS[s] ?? s}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={!newStatus || newStatus === work.status || isStatusUpdating}
                  onClick={() => void handleStatusUpdate()}
                >
                  {isStatusUpdating ? '...' : 'Применить'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Chat Panel */}
        <div className={styles.chatPanel}>
          <h2 className={styles.panelTitle}>
            Чат с {isSupervisor ? 'студентом' : 'руководителем'}
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
                      onClick={() => setPreviewFile(msg.file)}
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
                  <button type="button" onClick={() => setAttachedFile(null)}>×</button>
                </div>
              )}
              <textarea
                className={styles.chatInput}
                placeholder="Сообщение... (Enter для отправки)"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
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
            <button
              type="button"
              className={styles.btnAttach}
              onClick={() => chatFileInputRef.current?.click()}
              disabled={isChatFileUploading}
            >
              Прикрепить
            </button>
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
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}
