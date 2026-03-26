import { useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { worksApi } from '../../api';
import { Role, type Work } from '../../types';
import { WORK_STATUS_LABELS } from '../../utils/constants';
import styles from '../Catalog/Catalog.module.css';

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
          <Link to="/dashboard/works/new" className={styles.pageBtn}>
            + Новая работа
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className={styles.empty}>Загрузка...</div>
      ) : works.length === 0 ? (
        <div className={styles.empty}>
          {hasRole(Role.STUDENT)
            ? 'У вас пока нет работ. Создайте первую!'
            : 'Нет работ под вашим руководством'}
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
                  <span>👤 {work.author.fullName}</span>
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
