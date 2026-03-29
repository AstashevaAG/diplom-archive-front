import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { notificationsApi } from '../../api';
import { Role, type Notification } from '../../types';
import { ROLE_LABELS, formatDateTime } from '../../utils/constants';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

function NotificationBell(): ReactNode {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void notificationsApi.getUnreadCount().then((r) => { setUnreadCount(r.count); }).catch(() => {});
    const interval = setInterval(() => {
      void notificationsApi.getUnreadCount().then((r) => { setUnreadCount(r.count); }).catch(() => {});
    }, 30000);
    return () => { clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void notificationsApi.getAll().then((data) => { setNotifications(data); }).catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  const handleOpen = (): void => {
    setIsOpen((v) => !v);
  };

  const handleMarkAll = (): void => {
    void (async (): Promise<void> => {
      await notificationsApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    })();
  };

  const handleMarkOne = (id: string): void => {
    void (async (): Promise<void> => {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    })();
  };

  return (
    <div className={styles.notifBellWrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.notifBell}
        onClick={handleOpen}
        aria-label="Уведомления"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className={styles.notifBadge}>
            {unreadCount > 99 ? '99+' : String(unreadCount)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.notifDropdown}>
          <div className={styles.notifDropdownHeader}>
            <span className={styles.notifDropdownTitle}>Уведомления</span>
            {unreadCount > 0 && (
        <button
          type="button"
          className={styles.notifMarkAll}
          onClick={handleMarkAll}
        >
                Прочитать все
              </button>
            )}
          </div>
          <div className={styles.notifList}>
            {notifications.length === 0 ? (
              <div className={styles.notifEmpty}>Нет уведомлений</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`${styles.notifItem} ${!n.isRead ? styles.notifItemUnread : ''}`}
                  onClick={() => { if (!n.isRead) handleMarkOne(n.id); }}
                >
                  <span className={`${styles.notifDot} ${n.isRead ? styles.notifDotRead : ''}`} />
                  <div className={styles.notifContent}>
                    <div className={styles.notifTitle}>{n.title}</div>
                    <div className={styles.notifMessage}>{n.message}</div>
                    <div className={styles.notifTime}>{formatDateTime(n.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Layout({ children }: LayoutProps): ReactNode {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    await logout();
    void navigate('/');
  };

  const getNavLinkClass = ({ isActive }: { isActive: boolean }): string =>
    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`;

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
            </svg>
          </span>
          Архив ВКР
        </Link>

        <nav className={styles.nav}>
          <NavLink to="/catalog" className={getNavLinkClass}>
            Каталог
          </NavLink>

          <NavLink to="/info" className={getNavLinkClass}>
            Гид
          </NavLink>

          <NavLink to="/topics" className={getNavLinkClass}>
            Темы
          </NavLink>

          {/* Students see supervisors list; supervisors see colleagues */}
          {!hasRole(Role.SUPERVISOR) && !hasRole(Role.ADMIN) && (
            <NavLink to="/supervisors" className={getNavLinkClass}>
              Руководители
            </NavLink>
          )}

          {(hasRole(Role.SUPERVISOR) || hasRole(Role.ADMIN)) && (
            <NavLink to="/colleagues" className={getNavLinkClass}>
              Коллеги
            </NavLink>
          )}

          {isAuthenticated && (
            <NavLink to="/dashboard" className={getNavLinkClass}>
              Кабинет
            </NavLink>
          )}

          {(hasRole(Role.SUPERVISOR) || hasRole(Role.ADMIN)) && (
            <NavLink to="/analytics" className={getNavLinkClass}>
              Аналитика
            </NavLink>
          )}

          {hasRole(Role.ADMIN) && (
            <NavLink to="/admin" className={getNavLinkClass}>
              Управление
            </NavLink>
          )}
        </nav>

        <div className={styles.headerActions}>
          {isAuthenticated && user ? (
            <div className={styles.userInfo}>
              <NotificationBell />
              <div className={styles.userMeta}>
                <div className={styles.userName}>{user.fullName}</div>
                <div className={styles.userRole}>
                  {ROLE_LABELS[user.role] ?? user.role}
                </div>
              </div>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={() => { void handleLogout(); }}
              >
                Выйти
              </button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`}>
                  Войти
                </button>
              </Link>
              <Link to="/register">
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`}>
                  Регистрация
                </button>
              </Link>
            </>
          )}
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerText}>
            © {String(new Date().getFullYear())} Университет практической психологии
          </span>
          <div className={styles.footerLinks}>
            <Link to="/catalog" className={styles.footerLink}>Каталог</Link>
            <Link to="/supervisors" className={styles.footerLink}>Руководители</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
