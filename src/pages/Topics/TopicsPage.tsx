import { useState, useEffect, useMemo, type ReactNode, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { supervisorTopicsApi } from '../../api';
import { useAuth } from '../../hooks';
import { Role, TopicResponseStatus, type SupervisorTopic, type TopicResponse } from '../../types';
import styles from './Topics.module.css';

export function TopicsPage(): ReactNode {
  const { isAuthenticated, hasRole, user } = useAuth();
  const [topics, setTopics] = useState<SupervisorTopic[]>([]);
  const [myResponses, setMyResponses] = useState<TopicResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [areaFilter, setAreaFilter] = useState('');
  const [areaQuery, setAreaQuery] = useState('');
  const [respondingTo, setRespondingTo] = useState<SupervisorTopic | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [viewTopic, setViewTopic] = useState<SupervisorTopic | null>(null);
  const [editTopic, setEditTopic] = useState<SupervisorTopic | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editSaving, setEditSaving] = useState(false);

  const isStudent = isAuthenticated && hasRole(Role.STUDENT);
  const isSupervisor = isAuthenticated && hasRole(Role.SUPERVISOR);

  useEffect(() => {
    void Promise.all([
      supervisorTopicsApi.getAll(),
      isStudent ? supervisorTopicsApi.getMyResponses() : Promise.resolve([]),
    ])
      .then(([t, r]) => { setTopics(t); setMyResponses(r); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isStudent]);

  const areas = useMemo(
    () => [...new Set(topics.map((t) => t.area).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'ru')),
    [topics],
  );

  const filteredAreas = useMemo(() => {
    const q = areaQuery.trim().toLowerCase();
    if (!q) return areas;
    return areas.filter((a) => a.toLowerCase().includes(q));
  }, [areas, areaQuery]);

  const filtered = areaFilter ? topics.filter((t) => t.area === areaFilter) : topics;

  const respondedIds = new Set(myResponses.map((r) => r.topicId));

  const openEdit = (t: SupervisorTopic): void => {
    setEditTitle(t.title);
    setEditArea(t.area ?? '');
    setEditDescription(t.description ?? '');
    setEditActive(t.isActive);
    setEditTopic(t);
  };

  const handleSaveEdit = async (): Promise<void> => {
    if (!editTopic) return;
    setEditSaving(true);
    try {
      const updated = await supervisorTopicsApi.update(editTopic.id, {
        title: editTitle.trim() || editTopic.title,
        area: editArea.trim() || undefined,
        description: editDescription.trim() || undefined,
        isActive: editActive,
      });
      setTopics((prev) =>
        prev.map((x) =>
          x.id === updated.id
            ? { ...x, ...updated, supervisor: x.supervisor, _count: x._count }
            : x,
        ),
      );
      setEditTopic(null);
    } catch {
      // ignore
    } finally {
      setEditSaving(false);
    }
  };

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

  const isOwnTopic = (t: SupervisorTopic): boolean =>
    Boolean(user?.id && t.supervisorId === user.id);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Темы дипломных работ</h1>
          <p className={styles.subtitle}>Темы, предложенные научными руководителями</p>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.areaFilterBox}>
          <label className={styles.areaFilterLabel} htmlFor="area-search">
            Область
          </label>
          <input
            id="area-search"
            type="search"
            className={styles.areaSearchInput}
            placeholder="Поиск по списку областей…"
            value={areaQuery}
            onChange={(e) => setAreaQuery(e.target.value)}
            autoComplete="off"
          />
          <div className={styles.areaChips} role="listbox" aria-label="Фильтр по области">
            <button
              type="button"
              className={`${styles.areaChip} ${areaFilter === '' ? styles.areaChipActive : ''}`}
              onClick={() => setAreaFilter('')}
            >
              Все области
            </button>
            {filteredAreas.map((a) => (
              <button
                key={a}
                type="button"
                className={`${styles.areaChip} ${areaFilter === a ? styles.areaChipActive : ''}`}
                onClick={() => setAreaFilter(a)}
              >
                {a}
              </button>
            ))}
          </div>
          {areaQuery.trim() && filteredAreas.length === 0 && (
            <p className={styles.areaEmpty}>Нет областей по запросу</p>
          )}
        </div>
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
                <div
                  role="button"
                  tabIndex={0}
                  className={styles.cardBody}
                  onClick={() => setViewTopic(topic)}
                  onKeyDown={(e: KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setViewTopic(topic);
                    }
                  }}
                >
                  <h2 className={styles.cardTitle}>{topic.title}</h2>
                  {topic.area && <div className={styles.cardArea}>{topic.area}</div>}
                  {topic.description && <p className={styles.cardDesc}>{topic.description}</p>}
                  {topic.supervisor && (
                    <Link
                      to={`/supervisors/${topic.supervisor.id}`}
                      className={styles.supervisorLink}
                      onClick={(e) => e.stopPropagation()}
                    >
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
                  <span className={styles.cardHint}>Подробнее</span>
                </div>
                <div className={styles.cardFooter}>
                  {topic._count && (
                    <span className={styles.responseCount}>{topic._count.responses} откликов</span>
                  )}
                  {isSupervisor && isOwnTopic(topic) && (
                    <button
                      type="button"
                      className={styles.editMiniBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(topic);
                      }}
                    >
                      Изменить
                    </button>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setRespondingTo(topic);
                          setResponseMessage('');
                        }}
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

      {viewTopic && (
        <div
          className={styles.overlay}
          onClick={() => setViewTopic(null)}
        >
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span>Тема</span>
              <button type="button" onClick={() => setViewTopic(null)} className={styles.modalClose}>×</button>
            </div>
            <div className={`${styles.modalBody} ${styles.detailModalBody}`}>
              <h2 className={styles.detailTitle}>{viewTopic.title}</h2>
              {viewTopic.area && (
                <div className={styles.detailBlock}>
                  <div className={styles.detailLabel}>Предметная область</div>
                  <div className={styles.detailValue}>{viewTopic.area}</div>
                </div>
              )}
              <div className={styles.detailBlock}>
                <div className={styles.detailLabel}>Описание</div>
                <div className={styles.detailDescription}>
                  {viewTopic.description?.trim() ? viewTopic.description : 'Описание не указано.'}
                </div>
              </div>
              {viewTopic.supervisor && (
                <Link to={`/supervisors/${viewTopic.supervisor.id}`} className={styles.supervisorLink}>
                  <div className={styles.supervisorAvatar}>
                    {viewTopic.supervisor.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className={styles.supervisorName}>{viewTopic.supervisor.fullName}</div>
                    {viewTopic.supervisor.specialization && (
                      <div className={styles.supervisorSpec}>{viewTopic.supervisor.specialization}</div>
                    )}
                  </div>
                </Link>
              )}
              {viewTopic._count && (
                <div className={styles.detailMeta}>{viewTopic._count.responses} откликов</div>
              )}
            </div>
            <div className={styles.modalFooter}>
              {isSupervisor && isOwnTopic(viewTopic) && (
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => {
                    openEdit(viewTopic);
                    setViewTopic(null);
                  }}
                >
                  Редактировать
                </button>
              )}
              {isStudent && !respondedIds.has(viewTopic.id) && (
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => {
                    setRespondingTo(viewTopic);
                    setViewTopic(null);
                    setResponseMessage('');
                  }}
                >
                  Откликнуться
                </button>
              )}
              <button type="button" className={styles.btnGhost} onClick={() => setViewTopic(null)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {editTopic && (
        <div className={styles.overlay} onClick={() => setEditTopic(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <strong>Редактирование темы</strong>
              <button type="button" onClick={() => setEditTopic(null)} className={styles.modalClose}>×</button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.label} htmlFor="edit-title">Название</label>
              <input
                id="edit-title"
                className={styles.editInput}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
              <label className={styles.label} htmlFor="edit-area">Область</label>
              <input
                id="edit-area"
                className={styles.editInput}
                value={editArea}
                onChange={(e) => setEditArea(e.target.value)}
                placeholder="Например: машинное обучение"
              />
              <label className={styles.label} htmlFor="edit-desc">Описание</label>
              <textarea
                id="edit-desc"
                className={styles.textarea}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={5}
              />
              <label className={styles.editCheck}>
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                />
                Тема активна (видна студентам)
              </label>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnGhost} onClick={() => setEditTopic(null)}>Отмена</button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={editSaving || !editTitle.trim()}
                onClick={() => void handleSaveEdit()}
              >
                {editSaving ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </div>
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
