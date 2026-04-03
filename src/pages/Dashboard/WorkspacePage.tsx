import { useState, useEffect, useRef, type ReactNode, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FilePreviewModal } from '../../components/FilePreviewModal/FilePreviewModal';
import { worksApi, stagesApi, filesApi } from '../../api';
import { useAuth, useWorkChat } from '../../hooks';
import { WorkStatus, type Work, type WorkFile, type WorkStage } from '../../types';
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

export function WorkspacePage(): ReactNode {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [work, setWork] = useState<Work | null>(null);
  const [stages, setStages] = useState<WorkStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [newStatus, setNewStatus] = useState<WorkStatus | ''>('');
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [previewFile, setPreviewFile] = useState<WorkFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const isSupervisor = user?.id === work?.supervisorId;
  const isAuthor = user?.id === work?.authorId;
  const canAccess = isSupervisor || isAuthor;

  const handleSendMessage = (e: FormEvent): void => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendMessage(messageText.trim());
    setMessageText('');
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

  const handlePublish = async (): Promise<void> => {
    if (!id || !isSupervisor) return;
    if (!confirm('Опубликовать работу в каталоге? После этого она станет видна всем.')) return;
    setIsStatusUpdating(true);
    try {
      const updated = await worksApi.updateStatus(id, WorkStatus.PUBLISHED);
      setWork(updated);
    } catch {
      // ignore
    } finally {
      setIsStatusUpdating(false);
    }
  };

  if (isLoading) return <div className={styles.loading}>Загрузка...</div>;
  if (!work || !canAccess) return <div className={styles.loading}>Нет доступа</div>;

  const completedCount = stages.filter((s) => s.isCompleted).length;
  const progressPct = stages.length ? Math.round((completedCount / stages.length) * 100) : 0;
  const currentStatusIdx = STATUS_STEPS.indexOf(work.status);
  const isPublished = work.status === WorkStatus.PUBLISHED;

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
        {isSupervisor && !isPublished && (
          <button
            type="button"
            className={styles.publishBtn}
            disabled={isStatusUpdating}
            onClick={() => void handlePublish()}
          >
            Опубликовать в каталоге
          </button>
        )}
      </div>

      {/* Progress */}
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

      <div className={styles.content}>
        {/* Stages + Files Panel */}
        <div className={styles.stagesPanel}>
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

          {/* Files */}
          <div className={styles.filesSection}>
            <h3 className={styles.filesSectionTitle}>
              Файлы работы ({work.files?.length ?? 0})
            </h3>
            {work.files && work.files.length > 0 && (
              <div className={styles.filesList}>
                {work.files.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`${styles.fileItem} ${styles.fileItemBtn}`}
                    onClick={() => setPreviewFile(f)}
                    aria-label={`Открыть предпросмотр: ${f.originalName}`}
                  >
                    <span className={styles.fileIcon} aria-hidden>📄</span>
                    <div className={styles.fileMeta}>
                      <span className={styles.fileName}>{f.originalName}</span>
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
            >
              {isUploadingFile ? 'Загрузка...' : '+ Прикрепить файл'}
            </button>
          </div>

          {isSupervisor && (
            <div className={styles.statusUpdateSection}>
              <h3 className={styles.statusUpdateTitle}>Обновить статус</h3>
              <div className={styles.statusUpdateRow}>
                <select
                  className={styles.statusSelect}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as WorkStatus)}
                >
                  <option value="">Выберите статус</option>
                  {STATUS_STEPS.filter((s) => s !== WorkStatus.PUBLISHED).map((s) => (
                    <option key={s} value={s}>{WORK_STATUS_LABELS[s] ?? s}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={!newStatus || isStatusUpdating}
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
                  <div className={styles.chatMsgTime}>{formatTime(msg.createdAt)}</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <form className={styles.chatForm} onSubmit={handleSendMessage}>
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
            <button
              type="submit"
              className={styles.btnSend}
              disabled={!messageText.trim() || !connected}
            >
              Отправить
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
