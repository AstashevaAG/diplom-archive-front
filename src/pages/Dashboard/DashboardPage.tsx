import { useState, useEffect, type ReactNode, type SyntheticEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { worksApi, topicRequestsApi, supervisorTopicsApi, usersApi, portfolioApi, usersApi as _usersApi } from '../../api';
import {
  Role,
  TopicRequestStatus,
  TopicResponseStatus,
  PORTFOLIO_TYPE_LABELS,
  PortfolioItemType,
  type Work,
  type TopicRequest,
  type SupervisorTopic,
  type TopicResponse,
  type StudentPortfolioItem,
  type CreatePortfolioItemData,
} from '../../types';
import { WORK_STATUS_LABELS, formatDate } from '../../utils/constants';
import styles from './Dashboard.module.css';

// ===== Portfolio Modal =====

interface PortfolioModalProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

function PortfolioModal({ studentId, studentName, onClose }: PortfolioModalProps): ReactNode {
  const [items, setItems] = useState<StudentPortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void usersApi.getPortfolio(studentId)
      .then(setItems)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [studentId]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }} onClick={onClose}>
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '520px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: '0.9375rem', color: 'var(--text-primary)' }}>Портфолио: {studentName}</strong>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
        </div>
        <div style={{ padding: '1rem 1.25rem', overflowY: 'auto', flex: 1 }}>
          {isLoading ? <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Загрузка...</p> :
           items.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>Студент ещё не добавил прошлые работы</p> :
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
             {items.map((item) => (
               <div key={item.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '0.875rem 1rem' }}>
                 <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{item.title}</div>
                 <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                   <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', background: 'var(--accent-muted)', color: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}>{PORTFOLIO_TYPE_LABELS[item.type]}</span>
                   {item.year && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.year}</span>}
                   {item.grade && <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>{item.grade}</span>}
                 </div>
                 {item.description && <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '0.375rem' }}>{item.description}</div>}
               </div>
             ))}
           </div>}
        </div>
      </div>
    </div>
  );
}

// ===== Student: My Requests Tab =====

function StudentRequestsTab(): ReactNode {
  const [requests, setRequests] = useState<TopicRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void topicRequestsApi.getMy().then(setRequests).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  const statusConfig: Record<TopicRequestStatus, { label: string; cls: string }> = {
    [TopicRequestStatus.PENDING]: { label: 'На рассмотрении', cls: styles.statusPending },
    [TopicRequestStatus.APPROVED]: { label: 'Одобрена', cls: styles.statusApproved },
    [TopicRequestStatus.REJECTED]: { label: 'Отклонена', cls: styles.statusRejected },
  };

  if (isLoading) return <div className={styles.empty}>Загрузка...</div>;

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Мои заявки на тему</h2>
        <Link to="/supervisors" className={styles.addBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Новая заявка
        </Link>
      </div>
      {requests.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyText}>Вы ещё не подавали заявки</div>
          <Link to="/supervisors" className={styles.addBtn}>Выбрать руководителя</Link>
        </div>
      ) : (
        <div className={styles.requestList}>
          {requests.map((req) => {
            const cfg = statusConfig[req.status];
            return (
              <div key={req.id} className={styles.requestCard}>
                <div className={styles.requestTop}>
                  <div className={styles.requestTopic}>{req.proposedTopic}</div>
                  <span className={`${styles.requestStatus} ${cfg.cls}`}>{cfg.label}</span>
                </div>
                {req.supervisor && <div className={styles.requestMeta}>{req.supervisor.fullName}{req.supervisor.specialization && <><span className={styles.requestMetaSep}>·</span>{req.supervisor.specialization}</>}</div>}
                {req.justification && <div className={styles.requestJustification}>{req.justification}</div>}
                {req.status === TopicRequestStatus.REJECTED && req.rejectReason && <div className={styles.rejectReason}><strong>Причина отказа:</strong> {req.rejectReason}</div>}
                {req.status === TopicRequestStatus.APPROVED && <div className={styles.approvedNote}>Работа создана — перейдите во вкладку «Работы»</div>}
                <div className={styles.requestDate}>{formatDate(req.createdAt)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== Supervisor: Inbox Tab =====

function SupervisorInboxTab(): ReactNode {
  const [requests, setRequests] = useState<TopicRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [portfolioStudent, setPortfolioStudent] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    void topicRequestsApi.getInbox().then(setRequests).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  const handleApprove = async (id: string): Promise<void> => {
    setActionLoading(id);
    try {
      await topicRequestsApi.approve(id);
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: TopicRequestStatus.APPROVED } : r));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async (e: SyntheticEvent, id: string): Promise<void> => {
    e.preventDefault();
    setActionLoading(id);
    try {
      await topicRequestsApi.reject(id, rejectReason || undefined);
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: TopicRequestStatus.REJECTED, rejectReason: rejectReason || null } : r));
      setRejectingId(null);
      setRejectReason('');
    } finally {
      setActionLoading(null);
    }
  };

  const pending = requests.filter((r) => r.status === TopicRequestStatus.PENDING);
  const processed = requests.filter((r) => r.status !== TopicRequestStatus.PENDING);

  if (isLoading) return <div className={styles.empty}>Загрузка...</div>;

  return (
    <>
      {portfolioStudent && <PortfolioModal studentId={portfolioStudent.id} studentName={portfolioStudent.name} onClose={() => setPortfolioStudent(null)} />}
      <div>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Входящие заявки{pending.length > 0 && <span className={styles.inboxBadge}>{pending.length}</span>}</h2>
        </div>
        {requests.length === 0 ? (
          <div className={styles.empty}><div className={styles.emptyText}>Входящих заявок нет</div></div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className={styles.inboxSection}>
                <div className={styles.inboxSectionLabel}>Ожидают рассмотрения</div>
                <div className={styles.requestList}>
                  {pending.map((req) => (
                    <div key={req.id} className={styles.requestCard}>
                      <div className={styles.requestTop}>
                        <div className={styles.requestTopic}>{req.proposedTopic}</div>
                        <span className={`${styles.requestStatus} ${styles.statusPending}`}>На рассмотрении</span>
                      </div>
                      {req.student && (
                        <div className={styles.requestMeta}>
                          {req.student.fullName}{req.student.group && <><span className={styles.requestMetaSep}>·</span>{req.student.group}</>}
                          <span className={styles.requestMetaSep}>·</span>{req.student.email}
                        </div>
                      )}
                      {req.justification && <div className={styles.requestJustification}>{req.justification}</div>}
                      <div className={styles.requestDate}>{formatDate(req.createdAt)}</div>
                      {req.student && (
                        <button type="button" className={styles.btnGhost} style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', marginBottom: '0.5rem' }}
                          onClick={() => setPortfolioStudent({ id: req.student!.id, name: req.student!.fullName })}>
                          Портфолио студента
                        </button>
                      )}
                      {rejectingId === req.id ? (
                        <form className={styles.rejectForm} onSubmit={(e) => void handleRejectSubmit(e, req.id)}>
                          <textarea className={styles.rejectInput} placeholder="Укажите причину (необязательно)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                          <div className={styles.rejectActions}>
                            <button type="submit" className={styles.btnDanger} disabled={actionLoading === req.id}>{actionLoading === req.id ? '...' : 'Подтвердить отказ'}</button>
                            <button type="button" className={styles.btnGhost} onClick={() => { setRejectingId(null); setRejectReason(''); }}>Отмена</button>
                          </div>
                        </form>
                      ) : (
                        <div className={styles.requestActions}>
                          <button type="button" className={styles.btnApprove} onClick={() => void handleApprove(req.id)} disabled={actionLoading === req.id}>{actionLoading === req.id ? '...' : 'Одобрить'}</button>
                          <button type="button" className={styles.btnReject} onClick={() => { setRejectingId(req.id); setRejectReason(''); }}>Отклонить</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {processed.length > 0 && (
              <div className={styles.inboxSection}>
                <div className={styles.inboxSectionLabel}>Обработанные</div>
                <div className={styles.requestList}>
                  {processed.map((req) => (
                    <div key={req.id} className={`${styles.requestCard} ${styles.requestCardProcessed}`}>
                      <div className={styles.requestTop}>
                        <div className={styles.requestTopic}>{req.proposedTopic}</div>
                        <span className={`${styles.requestStatus} ${req.status === TopicRequestStatus.APPROVED ? styles.statusApproved : styles.statusRejected}`}>
                          {req.status === TopicRequestStatus.APPROVED ? 'Одобрена' : 'Отклонена'}
                        </span>
                      </div>
                      {req.student && <div className={styles.requestMeta}>{req.student.fullName}{req.student.group && <><span className={styles.requestMetaSep}>·</span>{req.student.group}</>}</div>}
                      {req.rejectReason && <div className={styles.rejectReason}><strong>Причина:</strong> {req.rejectReason}</div>}
                      <div className={styles.requestDate}>{formatDate(req.updatedAt)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ===== Works Tab =====

interface WorksTabProps {
  isSupervisor: boolean;
}

function WorksTab({ isSupervisor }: WorksTabProps): ReactNode {
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = isSupervisor ? worksApi.getSupervised : worksApi.getMy;
    void fetch().then(setWorks).catch(() => {}).finally(() => setIsLoading(false));
  }, [isSupervisor]);

  if (isLoading) return <div className={styles.empty}>Загрузка...</div>;

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{isSupervisor ? 'Работы студентов' : 'Мои работы'}</h2>
        {!isSupervisor && (
          <Link to="/dashboard/works/new" className={styles.addBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Новая работа
          </Link>
        )}
      </div>
      {works.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyText}>{isSupervisor ? 'Нет работ под вашим руководством' : 'У вас пока нет работ'}</div>
          {!isSupervisor && <Link to="/dashboard/works/new" className={styles.addBtn}>Создать работу</Link>}
        </div>
      ) : (
        <div className={styles.grid}>
          {works.map((work) => {
            const isPublished = work.status === 'PUBLISHED';
            const workspaceLink = `/dashboard/works/${work.id}/workspace`;
            const catalogLink = `/catalog/${work.id}`;
            return (
              <div key={work.id} className={styles.card}>
                <div className={styles.cardTitle}>{work.title}</div>
                {work.annotation && <div className={styles.cardAnnotation}>{work.annotation}</div>}
                <div className={styles.cardMeta}>
                  <span className={styles.badge}>{WORK_STATUS_LABELS[work.status] ?? work.status}</span>
                  {isSupervisor && <span>{work.author.fullName}</span>}
                  {work.qualityScore !== null && <span>{String(work.qualityScore)}%</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <Link to={workspaceLink} className={styles.addBtn} style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}>
                    Рабочее пространство
                  </Link>
                  {isPublished && (
                    <Link to={catalogLink} className={styles.btnGhost} style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}>
                      В каталоге
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== Messages Tab =====

function MessagesTab(): ReactNode {
  const [works, setWorks] = useState<Work[]>([]);
  const { user, hasRole } = useAuth();
  const isSupervisor = hasRole(Role.SUPERVISOR);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = isSupervisor ? worksApi.getSupervised : worksApi.getMy;
    void fetch().then(setWorks).catch(() => {}).finally(() => setIsLoading(false));
  }, [isSupervisor]);

  const activeWorks = works.filter((w) => w.status !== 'PUBLISHED' && w.status !== 'ARCHIVED');

  if (isLoading) return <div className={styles.empty}>Загрузка...</div>;

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Коммуникации</h2>
      </div>
      {activeWorks.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyText}>Нет активных рабочих пространств</div>
        </div>
      ) : (
        <div className={styles.requestList}>
          {activeWorks.map((work) => {
            const otherPerson = isSupervisor ? work.author : work.supervisor;
            return (
              <Link key={work.id} to={`/dashboard/works/${work.id}/workspace`} className={styles.requestCard} style={{ textDecoration: 'none', display: 'block' }}>
                <div className={styles.requestTop}>
                  <div className={styles.requestTopic}>{work.title}</div>
                  <span className={`${styles.requestStatus} ${styles.statusPending}`}>{WORK_STATUS_LABELS[work.status] ?? work.status}</span>
                </div>
                {otherPerson && (
                  <div className={styles.requestMeta}>
                    {isSupervisor ? 'Студент' : 'Руководитель'}: {otherPerson.fullName}
                  </div>
                )}
                <div className={styles.requestDate} style={{ marginTop: '0.5rem', color: 'var(--accent)', fontSize: '0.75rem' }}>
                  Открыть чат →
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== Student Topics Tab =====

function StudentTopicsTab(): ReactNode {
  const [topics, setTopics] = useState<SupervisorTopic[]>([]);
  const [myResponses, setMyResponses] = useState<TopicResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<SupervisorTopic | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void Promise.all([supervisorTopicsApi.getAll(), supervisorTopicsApi.getMyResponses()])
      .then(([t, r]) => { setTopics(t); setMyResponses(r); })
      .catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  const respondedIds = new Set(myResponses.map((r) => r.topicId));

  const handleRespond = async (): Promise<void> => {
    if (!respondingTo) return;
    setIsSubmitting(true);
    try {
      const res = await supervisorTopicsApi.respond(respondingTo.id, responseMessage.trim() || undefined);
      setMyResponses((prev) => [...prev, res]);
      setRespondingTo(null);
      setResponseMessage('');
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className={styles.empty}>Загрузка...</div>;

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Темы от преподавателей</h2>
        <Link to="/topics" className={styles.addBtn}>Все темы</Link>
      </div>
      {myResponses.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div className={styles.inboxSectionLabel} style={{ marginBottom: '0.625rem' }}>Мои отклики</div>
          <div className={styles.requestList}>
            {myResponses.map((r) => (
              <div key={r.id} className={styles.requestCard}>
                <div className={styles.requestTop}>
                  <div className={styles.requestTopic}>{r.topic?.title ?? '...'}</div>
                  <span className={`${styles.requestStatus} ${r.status === TopicResponseStatus.ACCEPTED ? styles.statusApproved : r.status === TopicResponseStatus.REJECTED ? styles.statusRejected : styles.statusPending}`}>
                    {r.status === TopicResponseStatus.ACCEPTED ? 'Принят' : r.status === TopicResponseStatus.REJECTED ? 'Отклонён' : 'Ожидает'}
                  </span>
                </div>
                {r.topic?.supervisor && <div className={styles.requestMeta}>{r.topic.supervisor.fullName}</div>}
                <div className={styles.requestDate}>{formatDate(r.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {topics.length === 0 ? (
        <div className={styles.empty}><div className={styles.emptyText}>Преподаватели ещё не предлагали темы</div></div>
      ) : (
        <div className={styles.grid}>
          {topics.map((topic) => {
            const responded = respondedIds.has(topic.id);
            return (
              <div key={topic.id} className={styles.card} style={{ cursor: 'default' }}>
                <div className={styles.cardTitle}>{topic.title}</div>
                {topic.area && <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 500, marginBottom: '0.375rem' }}>{topic.area}</div>}
                {topic.description && <div className={styles.cardAnnotation}>{topic.description}</div>}
                <div className={styles.cardMeta}>{topic.supervisor && <span>{topic.supervisor.fullName}</span>}</div>
                {!responded ? (
                  <button type="button" style={{ marginTop: '0.75rem', padding: '0.375rem 0.875rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    onClick={() => { setRespondingTo(topic); }}>
                    Откликнуться
                  </button>
                ) : (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--success)', fontWeight: 500 }}>Вы откликнулись</div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {respondingTo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }} onClick={() => setRespondingTo(null)}>
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '480px', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Отклик на тему</strong>
              <button type="button" onClick={() => setRespondingTo(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{respondingTo.title}</div>
              <textarea style={{ padding: '0.625rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem', minHeight: '80px', resize: 'vertical', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}
                placeholder="Сопроводительное сообщение (необязательно)" value={responseMessage} onChange={(e) => setResponseMessage(e.target.value)} />
            </div>
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={() => setRespondingTo(null)} className={styles.btnGhost}>Отмена</button>
              <button type="button" disabled={isSubmitting} className={styles.btnApprove} onClick={() => void handleRespond()}>{isSubmitting ? 'Отправка...' : 'Откликнуться'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Supervisor: My Topics Tab =====

function SupervisorTopicsTab(): ReactNode {
  const [topics, setTopics] = useState<SupervisorTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newArea, setNewArea] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [topicResponses, setTopicResponses] = useState<Record<string, TopicResponse[]>>({});

  useEffect(() => {
    void supervisorTopicsApi.getMy().then(setTopics).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  const handleCreate = async (): Promise<void> => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const t = await supervisorTopicsApi.create({ title: newTitle.trim(), description: newDesc.trim() || undefined, area: newArea.trim() || undefined });
      setTopics((prev) => [t, ...prev]);
      setNewTitle(''); setNewDesc(''); setNewArea('');
      setShowForm(false);
    } finally {
      setIsCreating(false);
    }
  };

  const loadResponses = async (topicId: string): Promise<void> => {
    if (topicResponses[topicId]) { setExpandedId(expandedId === topicId ? null : topicId); return; }
    const res = await supervisorTopicsApi.getResponses(topicId);
    setTopicResponses((prev) => ({ ...prev, [topicId]: res }));
    setExpandedId(topicId);
  };

  const handleAccept = async (topicId: string, responseId: string): Promise<void> => {
    await supervisorTopicsApi.acceptResponse(topicId, responseId);
    setTopicResponses((prev) => ({ ...prev, [topicId]: (prev[topicId] ?? []).map((r) => r.id === responseId ? { ...r, status: TopicResponseStatus.ACCEPTED } : r) }));
  };

  const handleReject = async (topicId: string, responseId: string): Promise<void> => {
    await supervisorTopicsApi.rejectResponse(topicId, responseId);
    setTopicResponses((prev) => ({ ...prev, [topicId]: (prev[topicId] ?? []).map((r) => r.id === responseId ? { ...r, status: TopicResponseStatus.REJECTED } : r) }));
  };

  if (isLoading) return <div className={styles.empty}>Загрузка...</div>;

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Мои предложенные темы</h2>
        <button type="button" className={styles.addBtn} onClick={() => setShowForm(!showForm)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Предложить тему
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input type="text" placeholder="Название темы *" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
            style={{ padding: '0.625rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }} />
          <input type="text" placeholder="Предметная область" value={newArea} onChange={(e) => setNewArea(e.target.value)}
            style={{ padding: '0.625rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }} />
          <textarea placeholder="Описание темы" value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
            style={{ padding: '0.625rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" disabled={isCreating || !newTitle.trim()} className={styles.btnApprove} onClick={() => void handleCreate()}>{isCreating ? '...' : 'Создать'}</button>
            <button type="button" className={styles.btnGhost} onClick={() => setShowForm(false)}>Отмена</button>
          </div>
        </div>
      )}

      {topics.length === 0 ? (
        <div className={styles.empty}><div className={styles.emptyText}>Вы ещё не предлагали темы</div></div>
      ) : (
        <div className={styles.requestList}>
          {topics.map((topic) => (
            <div key={topic.id} className={styles.requestCard}>
              <div className={styles.requestTop}>
                <div className={styles.requestTopic}>{topic.title}</div>
                <span className={`${styles.requestStatus} ${topic.isActive ? styles.statusApproved : styles.statusRejected}`}>{topic.isActive ? 'Активна' : 'Закрыта'}</span>
              </div>
              {topic.area && <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginBottom: '0.25rem' }}>{topic.area}</div>}
              {topic.description && <div className={styles.requestJustification}>{topic.description}</div>}
              <button type="button" className={styles.btnGhost} style={{ marginTop: '0.75rem', fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                onClick={() => void loadResponses(topic.id)}>
                Отклики {topic._count ? `(${topic._count.responses})` : ''}
              </button>
              {expandedId === topic.id && topicResponses[topic.id] && (
                <div style={{ marginTop: '0.875rem', borderTop: '1px solid var(--border)', paddingTop: '0.875rem' }}>
                  {(topicResponses[topic.id] ?? []).length === 0 ? (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Откликов пока нет</div>
                  ) : (
                    topicResponses[topic.id]?.map((resp) => (
                      <div key={resp.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{resp.student?.fullName}</strong>
                          <span style={{ fontSize: '0.6875rem', padding: '0.125rem 0.375rem', borderRadius: 'var(--radius-sm)', background: resp.status === TopicResponseStatus.ACCEPTED ? 'var(--success-muted)' : resp.status === TopicResponseStatus.REJECTED ? 'var(--danger-muted)' : 'var(--accent-muted)', color: resp.status === TopicResponseStatus.ACCEPTED ? 'var(--success)' : resp.status === TopicResponseStatus.REJECTED ? '#FCA5A5' : 'var(--accent)' }}>
                            {resp.status === TopicResponseStatus.ACCEPTED ? 'Принят' : resp.status === TopicResponseStatus.REJECTED ? 'Отклонён' : 'Ожидает'}
                          </span>
                        </div>
                        {resp.student?.group && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{resp.student.group}</div>}
                        {resp.message && <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '0.25rem' }}>{resp.message}</div>}
                        {resp.status === TopicResponseStatus.PENDING && (
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button type="button" className={styles.btnApprove} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={() => void handleAccept(topic.id, resp.id)}>Принять</button>
                            <button type="button" className={styles.btnReject} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={() => void handleReject(topic.id, resp.id)}>Отклонить</button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Profile Tab =====

function ProfileTab(): ReactNode {
  const { user, hasRole } = useAuth();
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [group, setGroup] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [portfolioItems, setPortfolioItems] = useState<StudentPortfolioItem[]>([]);
  const [pfTitle, setPfTitle] = useState('');
  const [pfType, setPfType] = useState<PortfolioItemType>(PortfolioItemType.COURSEWORK);
  const [pfDesc, setPfDesc] = useState('');
  const [pfYear, setPfYear] = useState('');
  const [pfGrade, setPfGrade] = useState('');
  const [pfAdding, setPfAdding] = useState(false);

  useEffect(() => {
    if (user) { setFullName(user.fullName); setBio(user.bio ?? ''); setGroup(user.group ?? ''); setSpecialization(user.specialization ?? ''); }
  }, [user]);

  useEffect(() => {
    if (hasRole(Role.STUDENT)) {
      void portfolioApi.getMy().then(setPortfolioItems).catch(() => {});
    }
  }, [hasRole]);

  const handleSave = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await usersApi.updateMe({ fullName: fullName.trim(), bio: bio.trim() || undefined, group: group.trim() || undefined, specialization: specialization.trim() || undefined });
      setSuccessMsg('Профиль обновлён');
      setTimeout(() => setSuccessMsg(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPortfolio = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!pfTitle.trim()) return;
    setPfAdding(true);
    try {
      const data: CreatePortfolioItemData = { title: pfTitle.trim(), type: pfType, description: pfDesc.trim() || undefined, year: pfYear ? parseInt(pfYear, 10) : undefined, grade: pfGrade.trim() || undefined };
      const item = await portfolioApi.create(data);
      setPortfolioItems((prev) => [item, ...prev]);
      setPfTitle(''); setPfDesc(''); setPfYear(''); setPfGrade('');
    } finally {
      setPfAdding(false);
    }
  };

  if (!user) return <div className={styles.empty}>Загрузка...</div>;

  const initials = user.fullName.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase();

  return (
    <div>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 56, height: 56, background: 'var(--accent-muted)', borderRadius: 'var(--radius-xl)', color: 'var(--accent-hover)', fontWeight: 700, fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials}</div>
          <div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.fullName}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{user.email}</div>
          </div>
        </div>
        {successMsg && <div style={{ padding: '0.625rem 1.5rem', background: 'var(--success-muted)', color: 'var(--success)', fontSize: '0.8125rem' }}>{successMsg}</div>}
        <form style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} onSubmit={(e) => void handleSave(e)}>
          <div><label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>ФИО</label>
            <input type="text" className={styles.input ?? ''} value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ width: '100%', padding: '0.625rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div><label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>О себе</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Расскажите о себе..."
              style={{ width: '100%', padding: '0.625rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          {hasRole(Role.STUDENT) && (
            <div><label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>Группа</label>
              <input type="text" value={group} onChange={(e) => setGroup(e.target.value)} placeholder="221-322"
                style={{ width: '100%', padding: '0.625rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}
          {hasRole(Role.SUPERVISOR) && (
            <div><label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.375rem' }}>Специализация</label>
              <input type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="Клиническая психология"
                style={{ width: '100%', padding: '0.625rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}
          <button type="submit" disabled={isSaving}
            style={{ padding: '0.625rem 1.5rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: isSaving ? 0.5 : 1, alignSelf: 'flex-start' }}>
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      </div>

      {hasRole(Role.STUDENT) && (
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Мои прошлые работы</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
            Добавьте курсовые и личные проекты — преподаватель сможет ознакомиться при рассмотрении вашей заявки.
          </p>
          <form style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.25rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
            onSubmit={(e) => void handleAddPortfolio(e)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input type="text" placeholder="Название *" value={pfTitle} onChange={(e) => setPfTitle(e.target.value)} required
                style={{ padding: '0.625rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }} />
              <select value={pfType} onChange={(e) => setPfType(e.target.value as PortfolioItemType)}
                style={{ padding: '0.625rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}>
                {Object.values(PortfolioItemType).map((t) => <option key={t} value={t}>{PORTFOLIO_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <textarea placeholder="Описание (необязательно)" value={pfDesc} onChange={(e) => setPfDesc(e.target.value)}
              style={{ padding: '0.625rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem', minHeight: '60px', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input type="number" placeholder="Год" value={pfYear} onChange={(e) => setPfYear(e.target.value)} min={1950} max={2100}
                style={{ padding: '0.625rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }} />
              <input type="text" placeholder="Оценка (5 / Отлично / A)" value={pfGrade} onChange={(e) => setPfGrade(e.target.value)}
                style={{ padding: '0.625rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }} />
            </div>
            <button type="submit" disabled={pfAdding || !pfTitle.trim()}
              style={{ padding: '0.5rem 1.25rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start', opacity: pfAdding ? 0.5 : 1 }}>
              {pfAdding ? 'Добавление...' : 'Добавить'}
            </button>
          </form>
          {portfolioItems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {portfolioItems.map((item) => (
                <div key={item.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{item.title}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', background: 'var(--accent-muted)', color: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}>{PORTFOLIO_TYPE_LABELS[item.type]}</span>
                      {item.year && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.year}</span>}
                      {item.grade && <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>{item.grade}</span>}
                    </div>
                    {item.description && <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.375rem' }}>{item.description}</div>}
                  </div>
                  <button type="button" onClick={() => { void portfolioApi.delete(item.id).then(() => setPortfolioItems((p) => p.filter((i) => i.id !== item.id))); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.125rem', cursor: 'pointer', padding: '0 0.25rem', lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Main Dashboard =====

type TabKey = 'works' | 'requests' | 'inbox' | 'topics' | 'my-topics' | 'messages' | 'profile';

export function DashboardPage(): ReactNode {
  const { user, hasRole } = useAuth();
  const isSupervisor = hasRole(Role.SUPERVISOR);
  const isStudent = hasRole(Role.STUDENT);
  const [activeTab, setActiveTab] = useState<TabKey>('works');

  const tabs: { key: TabKey; label: string; show: boolean }[] = [
    { key: 'works', label: isSupervisor ? 'Мои студенты' : 'Работы', show: true },
    { key: 'requests', label: 'Заявки', show: isStudent },
    { key: 'topics', label: 'Темы преподавателей', show: isStudent },
    { key: 'inbox', label: 'Входящие', show: isSupervisor },
    { key: 'my-topics', label: 'Мои темы', show: isSupervisor },
    { key: 'messages', label: 'Сообщения', show: true },
    { key: 'profile', label: 'Профиль', show: true },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{isSupervisor ? 'Кабинет руководителя' : 'Личный кабинет'}</h1>
        {user && (
          <div className={styles.userChip}>
            <div className={styles.userChipAvatar}>{user.fullName.charAt(0).toUpperCase()}</div>
            <div>
              <div className={styles.userChipName}>{user.fullName}</div>
              {user.group && <div className={styles.userChipMeta}>{user.group}</div>}
            </div>
          </div>
        )}
      </div>

      <div className={styles.tabs}>
        {tabs.filter((t) => t.show).map((t) => (
          <button
            key={t.key}
            type="button"
            className={activeTab === t.key ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'works' && <WorksTab isSupervisor={isSupervisor} />}
      {activeTab === 'requests' && isStudent && <StudentRequestsTab />}
      {activeTab === 'topics' && isStudent && <StudentTopicsTab />}
      {activeTab === 'inbox' && isSupervisor && <SupervisorInboxTab />}
      {activeTab === 'my-topics' && isSupervisor && <SupervisorTopicsTab />}
      {activeTab === 'messages' && <MessagesTab />}
      {activeTab === 'profile' && <ProfileTab />}
    </div>
  );
}
