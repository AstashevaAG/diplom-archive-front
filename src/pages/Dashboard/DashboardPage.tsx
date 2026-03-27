import { useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { worksApi } from '../../api';
import { Role, type Work } from '../../types';
import { WORK_STATUS_LABELS } from '../../utils/constants';
import styles from './Dashboard.module.css';

export function DashboardPage(): ReactNode {
  const { user, hasRole } = useAuth();
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async (): Promise<void> => {
      try {
        if (hasRole(Role.SUPERVISOR)) {
          const data = await worksApi.getSupervised();
          setWorks(data);
        } else {
          const data = await worksApi.getMy();
          setWorks(data);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, [hasRole]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {hasRole(Role.SUPERVISOR) ? 'Мои подопечные' : 'Мои работы'}
        </h1>
        {hasRole(Role.STUDENT) && (
          <Link to="/dashboard/works/new" className={styles.addBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Новая работа
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <Link to="/dashboard" className={styles.tabActive}>
          {hasRole(Role.SUPERVISOR) ? 'Подопечные' : 'Работы'}
        </Link>
        <Link to="/dashboard/profile" className={styles.tab}>
          Профиль
        </Link>
      </div>

      {isLoading ? (
        <div className={styles.empty}>Загрузка...</div>
      ) : works.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            </svg>
          </div>
          <div className={styles.emptyText}>
            {hasRole(Role.STUDENT)
              ? 'У вас пока нет работ. Создайте первую!'
              : 'Нет работ под вашим руководством'}
          </div>
          {hasRole(Role.STUDENT) && (
            <Link to="/dashboard/works/new" className={styles.addBtn}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Создать работу
            </Link>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {works.map((work) => (
            <Link to={`/catalog/${work.id}`} className={styles.card} key={work.id}>
              <div className={styles.cardTitle}>{work.title}</div>
              {work.annotation && (
                <div className={styles.cardAnnotation}>{work.annotation}</div>
              )}
              <div className={styles.cardMeta}>
                <span className={styles.badge}>
                  {WORK_STATUS_LABELS[work.status] ?? work.status}
                </span>
                {hasRole(Role.SUPERVISOR) && (
                  <span>{work.author.fullName}</span>
                )}
                {work.qualityScore !== null && (
                  <span>{String(work.qualityScore)}%</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
