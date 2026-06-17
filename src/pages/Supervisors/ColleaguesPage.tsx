import { useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { usersApi } from '../../api';
import { type User } from '../../types';
import styles from './Supervisors.module.css';

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

export function ColleaguesPage(): ReactNode {
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void usersApi.getSupervisors()
      .then(setSupervisors)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Коллеги</h1>
        <p className={styles.subtitle}>Преподаватели кафедры</p>
      </div>

      {isLoading ? (
        <div className={styles.empty}>Загрузка...</div>
      ) : supervisors.length === 0 ? (
        <div className={styles.empty}>Нет данных</div>
      ) : (
        <div className={styles.grid}>
          {supervisors.map((sup) => (
            <Link to={`/supervisors/${sup.id}`} className={styles.card} key={sup.id} style={{ textDecoration: 'none', display: 'block' }}>
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>{getInitials(sup.fullName)}</div>
                <div>
                  <div className={styles.cardName}>{sup.fullName}</div>
                  {sup.specialization && (
                    <div className={styles.cardSpec}>{sup.specialization}</div>
                  )}
                </div>
              </div>
              {sup.bio && <div className={styles.cardBio}>{sup.bio}</div>}
              <div className={styles.cardFooter}>
                <span className={styles.cardEmail}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  {sup.email}
                </span>
                <span className={styles.requestBtn} style={{ pointerEvents: 'none' }}>
                  Профиль →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
