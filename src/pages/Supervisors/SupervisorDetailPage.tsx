import { useState, useEffect, type ReactNode } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usersApi, supervisorTopicsApi, topicRequestsApi } from '../../api';
import { useAuth } from '../../hooks';
import { Role, type User, type Work, type SupervisorTopic } from '../../types';
import styles from './SupervisorDetail.module.css';

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

export function SupervisorDetailPage(): ReactNode {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, hasRole } = useAuth();

  const [supervisor, setSupervisor] = useState<User | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [topics, setTopics] = useState<SupervisorTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestModal, setRequestModal] = useState(false);
  const [requestTopic, setRequestTopic] = useState('');
  const [requestJustification, setRequestJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const canRequest = isAuthenticated && hasRole(Role.STUDENT);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    void Promise.all([
      usersApi.getById(id),
      usersApi.getSupervisorWorks(id),
      supervisorTopicsApi.getAll({ supervisorId: id }),
    ])
      .then(([user, worksData, topicsData]) => {
        setSupervisor(user);
        setWorks(worksData);
        setTopics(topicsData);
      })
      .catch(() => navigate('/supervisors'))
      .finally(() => setIsLoading(false));
  }, [id, navigate]);

  const handleRequestSubmit = async (): Promise<void> => {
    if (!requestTopic.trim() || !id) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await topicRequestsApi.create({
        proposedTopic: requestTopic.trim(),
        justification: requestJustification.trim() || undefined,
        supervisorId: id,
      });
      setSubmitSuccess(true);
      setRequestModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не удалось отправить заявку';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  if (!supervisor) {
    return <div className={styles.loading}>Преподаватель не найден</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.backLink}>
        <Link to="/supervisors">← Все преподаватели</Link>
      </div>

      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>{getInitials(supervisor.fullName)}</div>
          <div className={styles.profileInfo}>
            <h1 className={styles.name}>{supervisor.fullName}</h1>
            {supervisor.specialization && (
              <div className={styles.specialization}>{supervisor.specialization}</div>
            )}
            <div className={styles.email}>{supervisor.email}</div>
          </div>
          {canRequest && (
            <button
              type="button"
              className={styles.requestBtn}
              onClick={() => setRequestModal(true)}
            >
              Подать заявку
            </button>
          )}
        </div>
        {supervisor.bio && (
          <div className={styles.bio}>{supervisor.bio}</div>
        )}
      </div>

      {submitSuccess && (
        <div className={styles.successBanner}>
          Заявка отправлена! Следите за статусом в{' '}
          <Link to="/dashboard">личном кабинете</Link>.
        </div>
      )}

      {topics.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Предлагаемые темы</h2>
          <div className={styles.topicsGrid}>
            {topics.map((topic) => (
              <div key={topic.id} className={styles.topicCard}>
                <div className={styles.topicTitle}>{topic.title}</div>
                {topic.area && (
                  <div className={styles.topicArea}>{topic.area}</div>
                )}
                {topic.description && (
                  <div className={styles.topicDesc}>{topic.description}</div>
                )}
                {canRequest && (
                  <button
                    type="button"
                    className={styles.respondBtn}
                    onClick={() => {
                      setRequestTopic(topic.title);
                      setRequestModal(true);
                    }}
                  >
                    Откликнуться на тему
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Научные работы{works.length > 0 ? ` (${works.length})` : ''}
        </h2>
        {works.length === 0 ? (
          <div className={styles.empty}>Опубликованных работ пока нет</div>
        ) : (
          <div className={styles.worksGrid}>
            {works.map((work) => (
              <Link key={work.id} to={`/catalog/${work.id}`} className={styles.workCard}>
                <div className={styles.workTitle}>{work.title}</div>
                {work.annotation && (
                  <div className={styles.workAnnotation}>{work.annotation}</div>
                )}
                <div className={styles.workMeta}>
                  <span>{work.author.fullName}</span>
                  {work.year && <span>{work.year}</span>}
                  {work.qualityScore !== null && (
                    <span className={styles.workScore}>{work.qualityScore}%</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {requestModal && (
        <div className={styles.overlay} onClick={() => setRequestModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span>Заявка на тему дипломной работы</span>
              <button type="button" onClick={() => setRequestModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {submitError && <div className={styles.modalError}>{submitError}</div>}
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="req-topic">Тема *</label>
                <input
                  id="req-topic"
                  type="text"
                  className={styles.input}
                  value={requestTopic}
                  onChange={(e) => setRequestTopic(e.target.value)}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="req-just">Обоснование</label>
                <textarea
                  id="req-just"
                  className={styles.textarea}
                  placeholder="Почему вас интересует эта тема?"
                  value={requestJustification}
                  onChange={(e) => setRequestJustification(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnGhost} onClick={() => setRequestModal(false)}>Отмена</button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={isSubmitting || !requestTopic.trim()}
                onClick={() => void handleRequestSubmit()}
              >
                {isSubmitting ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
