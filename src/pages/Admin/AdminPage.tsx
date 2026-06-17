import { useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { usersApi, worksApi } from '../../api';
import { analyticsApi } from '../../api';
import { ROLE_LABELS, WORK_STATUS_LABELS } from '../../utils/constants';
import { useDebounce } from '../../hooks';
import { StatusFilter, type User, type DashboardData, type Work } from '../../types';
import styles from './Admin.module.css';

function getRoleClass(role: string): string {
  if (role === 'ADMIN') return styles.roleAdmin;
  if (role === 'SUPERVISOR') return styles.roleSupervisor;
  if (role === 'STUDENT') return styles.roleStudent;
  return styles.roleDefault;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminPage(): ReactNode {
  const [users, setUsers] = useState<User[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [workSearchQuery, setWorkSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isWorksExpanded, setIsWorksExpanded] = useState(false);
  const [isUsersExpanded, setIsUsersExpanded] = useState(true);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);
  const [deletingWorkId, setDeletingWorkId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const debouncedWorkSearch = useDebounce(workSearchQuery, 300);
  const debouncedUserSearch = useDebounce(userSearchQuery, 300);

  useEffect(() => {
    void (async (): Promise<void> => {
      try {
        const [usersData, worksData, dashData] = await Promise.all([
          usersApi.getAll().catch(() => [] as User[]),
          worksApi.getAll({ statusFilter: StatusFilter.ALL, limit: 1000 }).then((r) => r.data).catch(() => [] as Work[]),
          analyticsApi.getDashboard().catch(() => null),
        ]);
        setUsers(usersData);
        setWorks(worksData);
        setDashboard(dashData);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const globalQuery = debouncedSearch.trim().toLowerCase();
  const userQuery = debouncedUserSearch.trim().toLowerCase();
  const workQuery = debouncedWorkSearch.trim().toLowerCase();

  const matchesUser = (user: User, query: string): boolean => {
    if (!query) return true;
    return (
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (ROLE_LABELS[user.role] ?? user.role).toLowerCase().includes(query)
    );
  };

  const matchesWork = (work: Work, query: string): boolean => {
    if (!query) return true;
    return (
      work.title.toLowerCase().includes(query) ||
      work.author.fullName.toLowerCase().includes(query) ||
      (work.supervisor?.fullName.toLowerCase().includes(query) ?? false) ||
      (WORK_STATUS_LABELS[work.status] ?? work.status).toLowerCase().includes(query)
    );
  };

  const filteredUsers = users.filter((user) => matchesUser(user, globalQuery) && matchesUser(user, userQuery));
  const filteredWorks = works.filter((work) => matchesWork(work, globalQuery) && matchesWork(work, workQuery));

  const statusRows = (dashboard?.statusRows?.length
    ? dashboard.statusRows
    : Object.entries(
        works.reduce<Record<string, number>>((acc, work) => {
          acc[work.status] = (acc[work.status] ?? 0) + 1;
          return acc;
        }, {}),
      ).map(([status, count]) => ({ status, count }))).filter(
        (row) => row.status !== 'ARCHIVED',
      );

  const studentsWithoutWorkRows = dashboard?.studentsWithoutWorkRows?.length
    ? dashboard.studentsWithoutWorkRows
    : users
        .filter((user) => user.role === 'STUDENT' && !works.some((work) => work.authorId === user.id))
        .map((user) => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          group: user.group,
        }));

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

  const handleExportReport = async (format: 'csv' | 'pdf'): Promise<void> => {
    setExporting(format);
    try {
      const blob =
        format === 'csv'
          ? await analyticsApi.exportDepartmentCsv()
          : await analyticsApi.exportDepartmentPdf();
      const stamp = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `department-report-${stamp}.${format}`);
    } finally {
      setExporting(null);
    }
  };

  const handleDeleteWork = async (work: Work): Promise<void> => {
    const confirmed = window.confirm(`Удалить работу «${work.title}»? Действие нельзя отменить.`);
    if (!confirmed) return;

    setDeletingWorkId(work.id);
    try {
      await worksApi.delete(work.id);
      setWorks((prev) => prev.filter((item) => item.id !== work.id));
      setDashboard((prev) =>
        prev ? { ...prev, totalWorks: Math.max(0, prev.totalWorks - 1) } : prev,
      );
    } finally {
      setDeletingWorkId(null);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Панель управления</h1>
          <p className={styles.subtitle}>Управление пользователями и системными настройками</p>
        </div>
        <div className={styles.reportActions}>
          <button
            type="button"
            className={styles.reportBtn}
            disabled={exporting !== null}
            onClick={() => void handleExportReport('csv')}
          >
            {exporting === 'csv' ? 'Формирование...' : 'Экспорт Excel'}
          </button>
          <button
            type="button"
            className={styles.reportBtnPrimary}
            disabled={exporting !== null}
            onClick={() => void handleExportReport('pdf')}
          >
            {exporting === 'pdf' ? 'Формирование...' : 'Экспорт PDF'}
          </button>
        </div>
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
            <div className={styles.statLabel}>Преподавателей</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{String(dashboard.recentWorks)}</div>
            <div className={styles.statLabel}>Новых за месяц</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{String(dashboard.studentsWithoutWorks ?? studentsWithoutWorkRows.length)}</div>
            <div className={styles.statLabel}>Без работы</div>
          </div>
        </div>
      )}

      <div className={styles.summaryGrid}>
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <div className={styles.tableTitle}>Работы по статусам</div>
          </div>
          {statusRows.length === 0 ? (
            <div className={styles.empty}>Статистика пока недоступна</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Статус</th>
                  <th>Количество</th>
                </tr>
              </thead>
              <tbody>
                {statusRows.map((row) => (
                  <tr key={row.status}>
                    <td>{WORK_STATUS_LABELS[row.status] ?? row.status}</td>
                    <td>{String(row.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <div className={styles.tableTitle}>
              Студенты без работы ({String(studentsWithoutWorkRows.length)})
            </div>
          </div>
          {studentsWithoutWorkRows.length === 0 ? (
            <div className={styles.empty}>У всех студентов есть рабочее пространство</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Студент</th>
                  <th>Группа</th>
                </tr>
              </thead>
              <tbody>
                {studentsWithoutWorkRows.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div>{student.fullName}</div>
                      <div className={styles.mutedText}>{student.email}</div>
                    </td>
                    <td>{student.group ?? 'Не указана'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

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
          placeholder="Поиск по работам и пользователям..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>
            Работы ({String(filteredWorks.length)})
          </div>
          <button
            type="button"
            className={styles.sectionToggle}
            onClick={() => setIsWorksExpanded((value) => !value)}
            aria-expanded={isWorksExpanded}
          >
            {isWorksExpanded ? 'Свернуть' : 'Развернуть'}
            <svg
              className={`${styles.chevron} ${isWorksExpanded ? styles.chevronOpen : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
        {isWorksExpanded && (
          <>
            <div className={styles.sectionSearch}>
              <input
                type="text"
                className={styles.searchInputPlain}
                placeholder="Поиск по названию, студенту или преподавателю..."
                value={workSearchQuery}
                onChange={(e) => setWorkSearchQuery(e.target.value)}
              />
            </div>

            {filteredWorks.length === 0 ? (
              <div className={styles.empty}>Работы не найдены</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Студент</th>
                    <th>Преподаватель</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorks.map((work) => (
                    <tr key={work.id}>
                      <td>
                        <Link to={`/dashboard/works/${work.id}/workspace`} className={styles.workLink}>
                          {work.title}
                        </Link>
                      </td>
                      <td>{work.author.fullName}</td>
                      <td>{work.supervisor?.fullName ?? 'Не назначен'}</td>
                      <td>
                        <span className={styles.workStatus}>
                          {WORK_STATUS_LABELS[work.status] ?? work.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.actionBtnDanger}
                          disabled={deletingWorkId === work.id}
                          onClick={() => void handleDeleteWork(work)}
                        >
                          {deletingWorkId === work.id ? 'Удаление...' : 'Удалить'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {/* Users Table */}
      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>
            Пользователи ({String(filteredUsers.length)})
          </div>
          <button
            type="button"
            className={styles.sectionToggle}
            onClick={() => setIsUsersExpanded((value) => !value)}
            aria-expanded={isUsersExpanded}
          >
            {isUsersExpanded ? 'Свернуть' : 'Развернуть'}
            <svg
              className={`${styles.chevron} ${isUsersExpanded ? styles.chevronOpen : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
        {isUsersExpanded && (
          <>
            <div className={styles.sectionSearch}>
              <input
                type="text"
                className={styles.searchInputPlain}
                placeholder="Поиск по имени или email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />
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
          </>
        )}
      </div>
    </div>
  );
}
