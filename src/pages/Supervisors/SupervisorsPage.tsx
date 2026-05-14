import { useState, useEffect, type ReactNode, type SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';
import { usersApi, topicRequestsApi } from '../../api';
import { useAuth } from '../../hooks';
import type { User } from '../../types';
import styles from './Supervisors.module.css';

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

interface TopicRequestModalProps {
  supervisor: User;
  onClose: () => void;
  onSuccess: () => void;
}

function TopicRequestModal({ supervisor, onClose, onSuccess }: TopicRequestModalProps): ReactNode {
  const [topic, setTopic] = useState('');
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: SyntheticEvent): Promise<void> => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      await topicRequestsApi.create({
        proposedTopic: topic.trim(),
        justification: justification.trim() || undefined,
        supervisorId: supervisor.id,
      });
      onSuccess();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Не удалось отправить заявку. Попробуйте позже.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Заявка на тему дипломной работы</span>
          <button type="button" className={styles.modalClose} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.supervisorInfo}>
            <div className={styles.supervisorInfoAvatar}>
              {getInitials(supervisor.fullName)}
            </div>
            <div>
              <div className={styles.supervisorInfoName}>{supervisor.fullName}</div>
              {supervisor.specialization && (
                <div className={styles.supervisorInfoSpec}>{supervisor.specialization}</div>
              )}
            </div>
          </div>

          {error && <div className={styles.modalError}>{error}</div>}

          <form onSubmit={(e) => void handleSubmit(e)}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="modal-topic">
                Предлагаемая тема <span className={styles.required}>*</span>
              </label>
              <input
                id="modal-topic"
                type="text"
                className={styles.input}
                placeholder="Например: Влияние стресса на академическую успеваемость"
                value={topic}
                onChange={(e) => { setTopic(e.target.value); }}
                required
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="modal-justification">
                Обоснование
              </label>
              <textarea
                id="modal-justification"
                className={styles.textarea}
                placeholder="Почему вы хотите изучить именно эту тему? Каковы её актуальность и практическая значимость?"
                value={justification}
                onChange={(e) => { setJustification(e.target.value); }}
              />
              <span className={styles.hint}>Необязательно, но повышает шансы на одобрение</span>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnGhost} onClick={onClose}>
                Отмена
              </button>
              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={isSubmitting || !topic.trim()}
              >
                {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface SuccessBannerProps {
  supervisorName: string;
  onClose: () => void;
}

function SuccessBanner({ supervisorName, onClose }: SuccessBannerProps): ReactNode {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => { e.stopPropagation(); }}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Заявка отправлена!</span>
          <button type="button" className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
            Ваша заявка успешно направлена руководителю <strong>{supervisorName}</strong>.
            Вы получите уведомление, когда он рассмотрит её. Следить за статусом можно в{' '}
            <Link to="/dashboard" style={{ color: 'var(--accent)' }} onClick={onClose}>
              личном кабинете
            </Link>{' '}
            во вкладке «Заявки».
          </p>
        </div>
        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnPrimary} onClick={onClose}>
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}

export function SupervisorsPage(): ReactNode {
  const { isAuthenticated } = useAuth();
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSupervisor, setSelectedSupervisor] = useState<User | null>(null);
  const [successSupervisor, setSuccessSupervisor] = useState('');

  useEffect(() => {
    void usersApi
      .getSupervisors()
      .then((data) => { setSupervisors(data); })
      .catch(() => {})
      .finally(() => { setIsLoading(false); });
  }, []);

  const handleSuccess = (): void => {
    const name = selectedSupervisor?.fullName ?? '';
    setSelectedSupervisor(null);
    setSuccessSupervisor(name);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Научные руководители</h1>
        <p className={styles.subtitle}>Преподаватели кафедры психологии</p>
      </div>

      {isLoading ? (
        <div className={styles.empty}>Загрузка...</div>
      ) : supervisors.length === 0 ? (
        <div className={styles.empty}>Руководители не найдены</div>
      ) : (
        <div className={styles.grid}>
          {supervisors.map((sup) => (
            <Link to={`/supervisors/${sup.id}`} className={styles.card} key={sup.id} style={{ textDecoration: 'none', display: 'block' }}>
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>
                  {getInitials(sup.fullName)}
                </div>
                <div>
                  <div className={styles.cardName}>{sup.fullName}</div>
                  {sup.specialization && (
                    <div className={styles.cardSpec}>{sup.specialization}</div>
                  )}
                </div>
              </div>
              {sup.bio && (
                <div className={styles.cardBio}>{sup.bio}</div>
              )}
              <div className={styles.cardFooter}>
                <span className={styles.cardEmail}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  {sup.email}
                </span>
                <span className={styles.requestBtn} style={{ pointerEvents: 'none' }}>
                  Подробнее →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isAuthenticated && (
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <Link to="/login" style={{ color: 'var(--accent)' }}>Войдите</Link>, чтобы подать заявку на тему
        </p>
      )}

      {selectedSupervisor && (
        <TopicRequestModal
          supervisor={selectedSupervisor}
          onClose={() => { setSelectedSupervisor(null); }}
          onSuccess={handleSuccess}
        />
      )}

      {successSupervisor && (
        <SuccessBanner
          supervisorName={successSupervisor}
          onClose={() => { setSuccessSupervisor(''); }}
        />
      )}
    </div>
  );
}
