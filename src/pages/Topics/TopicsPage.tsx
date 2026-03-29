import { useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { supervisorTopicsApi } from '../../api';
import { useAuth } from '../../hooks';
import { Role, TopicResponseStatus, type SupervisorTopic, type TopicResponse } from '../../types';
import styles from './Topics.module.css';

export function TopicsPage(): ReactNode {
  const { isAuthenticated, hasRole } = useAuth();
  const [topics, setTopics] = useState<SupervisorTopic[]>([]);
  const [myResponses, setMyResponses] = useState<TopicResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [areaFilter, setAreaFilter] = useState('');
  const [respondingTo, setRespondingTo] = useState<SupervisorTopic | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const isStudent = isAuthenticated && hasRole(Role.STUDENT);

  useEffect(() => {
    void Promise.all([
      supervisorTopicsApi.getAll(),
      isStudent ? supervisorTopicsApi.getMyResponses() : Promise.resolve([]),
    ])
      .then(([t, r]) => { setTopics(t); setMyResponses(r); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isStudent]);

  const areas = [...new Set(topics.map((t) => t.area).filter(Boolean) as string[])];
  const filtered = areaFilter ? topics.filter((t) => t.area === areaFilter) : topics;

  const respondedIds = new Set(myResponses.map((r) => r.topicId));

  const handleRespond = async (): Promise<void> => {
    if (!respondingTo) return;
    setIsSubmitting(true);
    try {
      const res = await supervisorTopicsApi.respond(respondingTo.id, responseMessage.trim() || undefined);
      setMyResponses((prev) => [...prev, res]);
      setSuccessId(respondingTo.id);
      setRespondingTo(null);
      setResponseMessage('');
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Темы дипломных работ</h1>
          <p className={styles.subtitle}>Темы, предложенные научными руководителями</p>
        </div>
      </div>

      <div className={styles.filters}>
        <select
          className={styles.filterSelect}
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
        >
          <option value="">Все области</option>
          {areas.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <span className={styles.filterCount}>{filtered.length} тем</span>
      </div>

      {!isAuthenticated && (
        <div className={styles.loginHint}>
          <Link to="/login">Войдите</Link>, чтобы откликнуться на тему
        </div>
      )}

      {isLoading ? (
        <div className={styles.empty}>Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>Тем пока нет</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((topic) => {
            const responded = respondedIds.has(topic.id);
            const responseStatus = myResponses.find((r) => r.topicId === topic.id)?.status;
            return (
              <div key={topic.id} className={styles.card}>
                <div className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>{topic.title}</h2>
                  {topic.area && <div className={styles.cardArea}>{topic.area}</div>}
                  {topic.description && <p className={styles.cardDesc}>{topic.description}</p>}
                  {topic.supervisor && (
                    <Link to={`/supervisors/${topic.supervisor.id}`} className={styles.supervisorLink}>
                      <div className={styles.supervisorAvatar}>
                        {topic.supervisor.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.supervisorName}>{topic.supervisor.fullName}</div>
                        {topic.supervisor.specialization && (
                          <div className={styles.supervisorSpec}>{topic.supervisor.specialization}</div>
                        )}
                      </div>
                    </Link>
                  )}
                </div>
                <div className={styles.cardFooter}>
                  {topic._count && (
                    <span className={styles.responseCount}>{topic._count.responses} откликов</span>
                  )}
                  {isStudent && (
                    responded ? (
                      <span className={`${styles.respondedBadge} ${
                        responseStatus === TopicResponseStatus.ACCEPTED ? styles.accepted :
                        responseStatus === TopicResponseStatus.REJECTED ? styles.rejected : ''
                      }`}>
                        {responseStatus === TopicResponseStatus.ACCEPTED ? '✓ Принят' :
                         responseStatus === TopicResponseStatus.REJECTED ? '✗ Отклонён' : 'Отклик отправлен'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className={styles.respondBtn}
                        onClick={() => { setRespondingTo(topic); setResponseMessage(''); }}
                      >
                        Откликнуться
                      </button>
                    )
                  )}
                  {successId === topic.id && !responded && (
                    <span className={styles.respondedBadge}>Отклик отправлен</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {respondingTo && (
        <div
          className={styles.overlay}
          onClick={() => setRespondingTo(null)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <strong>Отклик на тему</strong>
              <button type="button" onClick={() => setRespondingTo(null)} className={styles.modalClose}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalTopicTitle}>{respondingTo.title}</div>
              {respondingTo.supervisor && (
                <div className={styles.modalSupervisor}>Руководитель: {respondingTo.supervisor.fullName}</div>
              )}
              <label className={styles.label} htmlFor="resp-msg">Сопроводительное сообщение</label>
              <textarea
                id="resp-msg"
                className={styles.textarea}
                placeholder="Расскажите, почему вас интересует эта тема..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={4}
              />
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnGhost} onClick={() => setRespondingTo(null)}>Отмена</button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={isSubmitting}
                onClick={() => void handleRespond()}
              >
                {isSubmitting ? 'Отправка...' : 'Откликнуться'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
