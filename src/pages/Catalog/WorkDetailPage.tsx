import { useState, useEffect, useRef, type ReactNode, type SyntheticEvent, type KeyboardEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { worksApi, commentsApi, stagesApi, reviewsApi, reviewCriteriaApi, filesApi } from '../../api';
import { useAuth } from '../../hooks';
import { FilePreviewModal } from '../../components/FilePreviewModal/FilePreviewModal';
import { WorkMetaEditor } from '../../components/WorkMetaEditor/WorkMetaEditor';
import { Role, WorkStatus, type Work, type WorkFile, type Comment, type WorkStage, type Review, type ReviewCriteriaConfig } from '../../types';
import { WORK_STATUS_LABELS, formatDate, formatDateTime } from '../../utils/constants';
import styles from './WorkDetailPage.module.css';

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

function getScoreClass(score: number | null): string {
  if (score === null) return '';
  if (score >= 70) return styles.scoreHigh;
  if (score >= 40) return styles.scoreMedium;
  return styles.scoreLow;
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

function formatBytes(size?: number): string {
  if (!size || size <= 0) return 'размер не указан';
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;
  return `${(size / 1024 / 1024).toFixed(1)} МБ`;
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

function getFinalWorkFiles(files?: WorkFile[]): WorkFile[] {
  const latestByType = new Map<string, WorkFile>();

  for (const file of sortFileVersions(files)) {
    if (!latestByType.has(file.type)) {
      latestByType.set(file.type, file);
    }
  }

  const typeOrder = ['PDF', 'PRESENTATION', 'VIDEO', 'OTHER'];
  return [...latestByType.values()].sort((a, b) => {
    const byType = typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
    if (byType !== 0) return byType;
    return a.originalName.localeCompare(b.originalName, 'ru');
  });
}

// ===== Work Stages Component =====

interface StagesProps {
  workId: string;
  canEdit: boolean;
}

function WorkStagesSection({ workId, canEdit }: StagesProps): ReactNode {
  const [stages, setStages] = useState<WorkStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    void stagesApi.getStages(workId)
      .then((data) => { setStages(data); })
      .catch(() => {})
      .finally(() => { setIsLoading(false); });
  }, [workId]);

  const handleToggle = async (stage: WorkStage): Promise<void> => {
    setTogglingId(stage.id);
    try {
      const updated = await stagesApi.updateStage(workId, stage.id, !stage.isCompleted);
      setStages((prev) => prev.map((s) => s.id === stage.id ? updated : s));
    } catch {
      // ignore
    } finally {
      setTogglingId(null);
    }
  };

  if (isLoading) return <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Загрузка этапов...</div>;
  if (stages.length === 0) return null;

  const completedCount = stages.filter((s) => s.isCompleted).length;

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>
        Этапы работы ({completedCount}/{stages.length})
      </h2>
      <div className={styles.stageList}>
        {stages.map((stage) => (
          <div key={stage.id} className={styles.stageItem}>
            <div className={`${styles.stageDot} ${stage.isCompleted ? styles.stageDotDone : ''}`}>
              {stage.isCompleted && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className={`${styles.stageName} ${stage.isCompleted ? styles.stageNameDone : ''}`}>
              {stage.name}
            </span>
            {stage.isCompleted && stage.completedAt && (
              <span className={styles.stageDate}>
                {formatDateTime(stage.completedAt)}
              </span>
            )}
            {canEdit && (
              <button
                type="button"
                className={styles.stageToggleBtn}
                onClick={() => { void handleToggle(stage); }}
                disabled={togglingId === stage.id}
              >
                {stage.isCompleted ? 'Отменить' : 'Выполнено'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== Comments Component =====

interface CommentsProps {
  workId: string;
}

function CommentsSection({ workId }: CommentsProps): ReactNode {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    void commentsApi.getByWork(workId)
      .then((data) => { setComments(data); })
      .catch(() => {})
      .finally(() => { setIsLoading(false); });
  }, [workId]);

  const handleSubmit = async (e: SyntheticEvent): Promise<void> => {
    e.preventDefault();
    if (!text.trim()) return;
    setIsSending(true);
    try {
      const comment = await commentsApi.create(workId, text.trim());
      setComments((prev) => [...prev, comment]);
      setText('');
    } catch {
      // ignore
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e as unknown as SyntheticEvent);
    }
  };

  const handleDelete = async (commentId: string): Promise<void> => {
    try {
      await commentsApi.delete(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // ignore
    }
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>
        Комментарии ({String(comments.length)})
      </h2>

      {isLoading ? (
        <div className={styles.noComments}>Загрузка...</div>
      ) : comments.length === 0 ? (
        <div className={styles.noComments}>Комментариев пока нет</div>
      ) : (
        <div className={styles.commentList}>
          {comments.map((c) => (
            <div key={c.id} className={styles.commentItem}>
              <div className={styles.commentAvatar}>
                {c.author ? getInitials(c.author.fullName) : '?'}
              </div>
              <div className={styles.commentBody}>
                <div className={styles.commentHeader}>
                  <span className={styles.commentAuthor}>
                    {c.author?.fullName ?? 'Неизвестный'}
                  </span>
                  <span className={styles.commentTime}>{formatDateTime(c.createdAt)}</span>
                  {user && (user.id === c.authorId || user.role === Role.ADMIN) && (
                    <button
                      type="button"
                      onClick={() => { void handleDelete(c.id); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-subtle)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        padding: '0 4px',
                        marginLeft: 'auto',
                      }}
                      title="Удалить комментарий"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className={styles.commentText}>{c.text}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAuthenticated ? (
        <form className={styles.commentForm} onSubmit={(e) => void handleSubmit(e)}>
          <textarea
            className={styles.commentInput}
            placeholder="Напишите комментарий... (Enter для отправки, Shift+Enter — новая строка)"
            value={text}
            onChange={(e) => { setText(e.target.value); }}
            onKeyDown={handleKeyDown}
            rows={2}
          />
          <button
            type="submit"
            className={styles.commentSubmit}
            disabled={isSending || !text.trim()}
          >
            {isSending ? 'Отправка...' : 'Отправить'}
          </button>
        </form>
      ) : (
        <div className={styles.loginHint}>
          <Link to="/login">Войдите</Link>, чтобы оставить комментарий
        </div>
      )}
    </div>
  );
}

// ===== Review Section =====

interface ReviewSectionProps {
  workId: string;
  isSupervisor: boolean;
  currentUser: { id: string; role: Role } | null;
  onWorkUpdated: (work: Work) => void;
}

function ReviewSection({ workId, isSupervisor, currentUser, onWorkUpdated }: ReviewSectionProps): ReactNode {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [criteria, setCriteria] = useState<ReviewCriteriaConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    void Promise.all([
      reviewsApi.getByWork(workId),
      reviewCriteriaApi.getAll(),
    ]).then(([revs, crit]) => {
      setReviews(revs);
      setCriteria(crit);
      const initScores: Record<string, number> = {};
      crit.forEach((c) => { initScores[c.id] = 5; });
      setScores(initScores);
    }).catch(() => {}).finally(() => setIsLoading(false));
  }, [workId]);

  const refreshReviewData = async (): Promise<void> => {
    const [updatedReviews, updatedWork] = await Promise.all([
      reviewsApi.getByWork(workId),
      worksApi.getById(workId),
    ]);
    setReviews(updatedReviews);
    onWorkUpdated(updatedWork);
  };

  const buildReviewPayload = (): { criteria: Record<string, number>; weights: Record<string, number>; comment?: string } => {
    const criteriaObj: Record<string, number> = {};
    const weightsObj: Record<string, number> = {};
    criteria.forEach((c) => {
      criteriaObj[c.id] = scores[c.id] ?? 5;
      weightsObj[c.id] = c.weight;
    });
    return {
      criteria: criteriaObj,
      weights: weightsObj,
      comment: comment.trim() || undefined,
    };
  };

  const resetReviewForm = (): void => {
    const initScores: Record<string, number> = {};
    criteria.forEach((c) => { initScores[c.id] = 5; });
    setScores(initScores);
    setComment('');
    setEditingReview(null);
    setShowForm(false);
  };

  const startCreateReview = (): void => {
    resetReviewForm();
    setShowForm(true);
  };

  const startEditReview = (review: Review): void => {
    const editScores: Record<string, number> = {};
    criteria.forEach((c) => {
      editScores[c.id] = review.criteria[c.id] ?? 5;
    });
    setScores(editScores);
    setComment(review.comment ?? '');
    setEditingReview(review);
    setShowForm(true);
  };

  const totalScore = (): number => {
    let weightedSum = 0;
    let weightTotal = 0;
    criteria.forEach((c) => {
      const score = scores[c.id] ?? 5;
      weightedSum += score * c.weight;
      weightTotal += c.maxScore * c.weight;
    });
    if (weightTotal === 0) return 0;
    return Math.round((weightedSum / weightTotal) * 100 * 100) / 100;
  };

  const handleSubmitReview = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      if (editingReview) {
        await reviewsApi.update(editingReview.id, buildReviewPayload());
      } else {
        await reviewsApi.create(workId, buildReviewPayload());
      }
      await refreshReviewData();
      resetReviewForm();
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (): Promise<void> => {
    if (!reviewToDelete) return;
    setIsDeleting(true);
    try {
      await reviewsApi.delete(reviewToDelete.id);
      await refreshReviewData();
      setReviewToDelete(null);
    } catch {
      // ignore
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className={styles.section}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 className={styles.sectionTitle}>Рецензии ({reviews.length})</h2>
        {isSupervisor && !showForm && (
          <button type="button" onClick={startCreateReview}
            style={{ padding: '0.375rem 0.875rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Добавить рецензию
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            {editingReview ? 'Редактирование рецензии' : 'Оценка работы'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1rem' }}>
            {criteria.map((c) => (
              <div key={c.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</span>
                    {c.description && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                        (вес: {c.weight})
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {scores[c.id] ?? 5}/{c.maxScore}
                  </span>
                </div>
                {c.description && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>{c.description}</div>
                )}
                <input
                  type="range"
                  min={0}
                  max={c.maxScore}
                  step={1}
                  value={scores[c.id] ?? 5}
                  onChange={(e) => setScores((prev) => ({ ...prev, [c.id]: parseInt(e.target.value, 10) }))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
              </div>
            ))}
          </div>
          <div style={{ padding: '0.75rem 1rem', background: 'var(--accent-muted)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Итоговая оценка</span>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--accent)' }}>{totalScore()}%</span>
          </div>
          <textarea
            placeholder="Общий комментарий к рецензии (необязательно)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ width: '100%', padding: '0.625rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem', minHeight: '80px', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '1rem' }}
          />
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" disabled={isSubmitting} onClick={() => void handleSubmitReview()}
              style={{ padding: '0.5rem 1.25rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: isSubmitting ? 0.5 : 1 }}>
              {isSubmitting ? 'Сохранение...' : 'Сохранить рецензию'}
            </button>
            <button type="button" onClick={resetReviewForm}
              style={{ padding: '0.5rem 1.25rem', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {reviews.length === 0 && !showForm && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
          Рецензий пока нет
        </div>
      )}

      {reviews.some((r) => r.isCommissionReview) && (
        <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Рецензия комиссии показывается отдельно от внешних рецензий.
        </div>
      )}

      {reviews.map((r) => (
        <div key={r.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {r.reviewer?.fullName ?? 'Рецензент'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {currentUser?.id === r.reviewerId && (
                <button type="button" onClick={() => startEditReview(r)}
                  style={{ padding: '0.25rem 0.5rem', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Редактировать
                </button>
              )}
              {(currentUser?.id === r.reviewerId || currentUser?.role === Role.ADMIN) && (
                <button type="button" onClick={() => setReviewToDelete(r)}
                  style={{ padding: '0.25rem 0.5rem', background: 'none', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Удалить
                </button>
              )}
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)' }}>
                {r.totalScore}%
              </span>
            </div>
          </div>
          {r.isCommissionReview && (
            <div style={{ marginBottom: '0.375rem', fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>
              Рецензия комиссии
            </div>
          )}
          {r.comment && (
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.comment}</div>
          )}
          {r.isFinalized && (
            <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--success)', fontWeight: 500 }}>Финализирована</div>
          )}
        </div>
      ))}

      {reviewToDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0, 0, 0, 0.45)' }}>
          <div role="dialog" aria-modal="true" aria-labelledby="delete-review-title" style={{ width: '100%', maxWidth: '420px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.25rem', boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)' }}>
            <h3 id="delete-review-title" style={{ margin: 0, marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
              Точно ли Вы хотите удалить?
            </h3>
            <p style={{ margin: 0, marginBottom: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Рецензия будет удалена, а средний балл пересчитается сразу.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" disabled={isDeleting} onClick={() => setReviewToDelete(null)}
                style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                Отмена
              </button>
              <button type="button" disabled={isDeleting} onClick={() => void handleDeleteReview()}
                style={{ padding: '0.5rem 1rem', background: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', color: 'white', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: isDeleting ? 0.6 : 1 }}>
                {isDeleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Main Page =====

export function WorkDetailPage(): ReactNode {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const [work, setWork] = useState<Work | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [previewFile, setPreviewFile] = useState<WorkFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    void (async (): Promise<void> => {
      try {
        const data = await worksApi.getById(id);
        setWork(data);
      } catch {
        setError('Работа не найдена');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  if (error || !work) {
    return (
      <div className={styles.page}>
        <Link to="/catalog" className={styles.backLink}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Назад к каталогу
        </Link>
        <div className={styles.error}>{error || 'Работа не найдена'}</div>
      </div>
    );
  }

  const isPublished = work.status === WorkStatus.PUBLISHED;
  const showsFinalFilesOnly = work.status === WorkStatus.PUBLISHED || work.status === WorkStatus.ARCHIVED;
  const isParticipant =
    isAuthenticated &&
    user !== null &&
    (user.id === work.authorId || user.id === work.supervisorId);
  const displayedFiles = showsFinalFilesOnly ? getFinalWorkFiles(work.files) : sortFileVersions(work.files);
  const canEditWorkInfo =
    isAuthenticated &&
    user !== null &&
    (
      user.role === Role.ADMIN ||
      (user.role === Role.SUPERVISOR && user.id === work.supervisorId)
    );
  const canEditStages =
    !isPublished &&
    isAuthenticated &&
    user !== null &&
    (user.id === work.authorId || user.id === work.supervisorId || user.role === Role.ADMIN);
  const canViewStages = !isPublished && (isParticipant || canEditStages);

  const handleFileUpload = async (file: File): Promise<void> => {
    if (!id) return;
    setIsUploadingFile(true);
    try {
      await filesApi.upload(id, file);
      const updated = await worksApi.getById(id);
      setWork(updated);
    } catch {
      // ignore
    } finally {
      setIsUploadingFile(false);
    }
  };

  return (
    <div className={styles.page}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to="/catalog" className={styles.backLink} style={{ margin: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Назад к каталогу
        </Link>
        {isParticipant && (
          <Link
            to={`/dashboard/works/${work.id}/workspace`}
            style={{ fontSize: '0.8125rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
          >
            Рабочее пространство →
          </Link>
        )}
      </div>

      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{work.title}</h1>
          <span className={styles.statusBadge}>
            {WORK_STATUS_LABELS[work.status] ?? work.status}
          </span>
        </div>

        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {work.author.fullName}
          </span>
          {work.supervisor && (
            <span className={styles.metaItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
              </svg>
              {work.supervisor.fullName}
            </span>
          )}
          {work.year && (
            <span className={styles.metaItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              {String(work.year)}
            </span>
          )}
          {work.category && (
            <span className={styles.metaItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
              </svg>
              {work.category}
            </span>
          )}
        </div>

        {work.tags.length > 0 && (
          <div className={styles.tags}>
            {work.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      {canEditWorkInfo && (
        <WorkMetaEditor work={work} onSaved={(w) => setWork(w)} />
      )}

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{String(work.viewCount)}</span>
          <span className={styles.statLabel}>Просмотров</span>
        </div>
        <div className={styles.stat}>
          <span className={`${styles.statValue} ${getScoreClass(work.commissionReviewScore)}`}>
            {work.commissionReviewScore !== null ? `${String(work.commissionReviewScore)}%` : '—'}
          </span>
          <span className={styles.statLabel}>Комиссия</span>
        </div>
        <div className={styles.stat}>
          <span className={`${styles.statValue} ${getScoreClass(work.externalReviewScore)}`}>
            {work.externalReviewScore !== null ? `${String(work.externalReviewScore)}%` : '—'}
          </span>
          <span className={styles.statLabel}>Внешние</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{String(work._count?.reviews ?? 0)}</span>
          <span className={styles.statLabel}>Рецензий</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{String(work._count?.comments ?? 0)}</span>
          <span className={styles.statLabel}>Комментариев</span>
        </div>
      </div>

      {work.description?.trim() && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Описание</h2>
          <p className={styles.annotation}>{work.description}</p>
        </div>
      )}

      {(work.annotation?.trim() || canEditWorkInfo) && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Аннотация</h2>
          {work.annotation?.trim() ? (
            <p className={styles.annotation}>{work.annotation}</p>
          ) : (
            canEditWorkInfo && (
              <p className={styles.annotationMuted}>Аннотация пока не заполнена — добавьте её в блоке редактирования выше.</p>
            )
          )}
        </div>
      )}

      {/* Files */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Файлы работы ({String(displayedFiles.length)})
        </h2>
        {displayedFiles.length > 0 ? (
          <div className={styles.filesList}>
            {displayedFiles.map((file) => (
              <button
                key={file.id}
                type="button"
                className={`${styles.fileItem} ${styles.fileItemBtn}`}
                onClick={() => setPreviewFile(file)}
                aria-label={`Открыть предпросмотр: ${file.originalName}`}
              >
                <span className={styles.fileIcon}>
                  <FileIcon type={file.type} />
                </span>
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>
                    {file.originalName}
                  </div>
                  <span className={styles.fileVersionMeta}>
                    {file.createdAt ? formatDate(file.createdAt) : 'дата не указана'} · {formatBytes(file.size)}
                  </span>
                  {file.comment && (
                    <span className={styles.fileVersionComment}>{file.comment}</span>
                  )}
                  <span className={styles.fileTypeBadge}>{getFileFormat(file)}</span>
                </div>
                <span className={styles.fileAction}>
                  <span className={styles.fileActionText}>Просмотр</span>
                  <span className={styles.fileActionArrow} aria-hidden>→</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.noFiles}>Файлы ещё не загружены</div>
        )}
        {isParticipant && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileUpload(file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              className={styles.uploadBtn}
              disabled={isUploadingFile}
              onClick={() => fileInputRef.current?.click()}
              style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', background: 'none', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', width: '100%' }}
            >
              {isUploadingFile ? 'Загрузка...' : '+ Прикрепить файл'}
            </button>
          </>
        )}
      </div>

      {/* Stages are part of the in-progress workspace and are hidden after publication. */}
      {canViewStages && id && (
        <WorkStagesSection workId={id} canEdit={canEditStages} />
      )}

      {/* Reviews with 10-criteria form */}
      {id && (
        <ReviewSection
          workId={id}
          isSupervisor={isAuthenticated && user?.role === Role.SUPERVISOR}
          currentUser={user ? { id: user.id, role: user.role } : null}
          onWorkUpdated={setWork}
        />
      )}

      {/* Comments */}
      {id && <CommentsSection workId={id} />}

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
