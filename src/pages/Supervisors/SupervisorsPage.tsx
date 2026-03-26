import { useState, useEffect, type ReactNode } from 'react';
import { usersApi } from '../../api';
import type { User } from '../../types';
import styles from '../Catalog/Catalog.module.css';

export function SupervisorsPage(): ReactNode {
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void usersApi
      .getSupervisors()
      .then(setSupervisors)
      .catch(() => {
        /* ignore */
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Научные руководители</h1>
      </div>

      {isLoading ? (
        <div className={styles.empty}>Загрузка...</div>
      ) : supervisors.length === 0 ? (
        <div className={styles.empty}>Руководители не найдены</div>
      ) : (
        <div className={styles.grid}>
          {supervisors.map((sup) => (
            <div className={styles.card} key={sup.id}>
              <div className={styles.cardTitle}>{sup.fullName}</div>
              {sup.specialization && (
                <div className={styles.cardAnnotation}>
                  Специализация: {sup.specialization}
                </div>
              )}
              {sup.bio && (
                <div className={styles.cardAnnotation}>{sup.bio}</div>
              )}
              <div className={styles.cardMeta}>
                <span>📧 {sup.email}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
