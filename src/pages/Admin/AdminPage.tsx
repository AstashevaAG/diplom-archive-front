import { useState, useEffect, type ReactNode } from 'react';
import { usersApi } from '../../api';
import { analyticsApi } from '../../api';
import { ROLE_LABELS } from '../../utils/constants';
import { useDebounce } from '../../hooks';
import type { User, DashboardData } from '../../types';
import styles from './Admin.module.css';

function getRoleClass(role: string): string {
  if (role === 'ADMIN') return styles.roleAdmin;
  if (role === 'SUPERVISOR') return styles.roleSupervisor;
  if (role === 'STUDENT') return styles.roleStudent;
  return styles.roleDefault;
}

export function AdminPage(): ReactNode {
  const [users, setUsers] = useState<User[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    void (async (): Promise<void> => {
      try {
        const [usersData, dashData] = await Promise.all([
          usersApi.getAll().catch(() => [] as User[]),
          analyticsApi.getDashboard().catch(() => null),
        ]);
        setUsers(usersData);
        setDashboard(dashData);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filteredUsers = debouncedSearch
    ? users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
    : users;

  const handleBlock = async (userId: string, block: boolean): Promise<void> => {
    try {
      await usersApi.blockUser(userId, block);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isBlocked: block } : u)),
      );
    } catch {
      // ignore
    }
  };

  const handleApprove = async (userId: string): Promise<void> => {
    try {
      await usersApi.approveUser(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isApproved: true } : u)),
      );
    } catch {
      // ignore
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Панель управления</h1>
        <p className={styles.subtitle}>Управление пользователями и системными настройками</p>
      </div>

      {/* Stats */}
      {dashboard && (
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{String(dashboard.totalWorks)}</div>
            <div className={styles.statLabel}>Работ</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{String(dashboard.totalUsers)}</div>
            <div className={styles.statLabel}>Пользователей</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{String(dashboard.totalSupervisors)}</div>
            <div className={styles.statLabel}>Руководителей</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{String(dashboard.recentWorks)}</div>
            <div className={styles.statLabel}>Новых за месяц</div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className={styles.searchBar}>
        <span className={styles.searchIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Поиск по имени или email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>
            Пользователи ({String(filteredUsers.length)})
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className={styles.empty}>Пользователи не найдены</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Имя</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={getRoleClass(user.role)}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        !user.isApproved
                          ? styles.statusPending
                          : user.isBlocked
                            ? styles.statusBlocked
                            : styles.statusActive
                      }
                    >
                      {!user.isApproved
                        ? 'Ожидает подтверждения'
                        : user.isBlocked ? 'Заблокирован' : 'Активен'}
                    </span>
                  </td>
                  <td>
                    {!user.isApproved && (
                      <button
                        type="button"
                        className={styles.actionBtnApprove}
                        onClick={() => void handleApprove(user.id)}
                      >
                        Одобрить
                      </button>
                    )}
                    <button
                      type="button"
                      className={user.isBlocked ? styles.actionBtn : styles.actionBtnDanger}
                      onClick={() => void handleBlock(user.id, !user.isBlocked)}
                    >
                      {user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
