import { type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { Role } from '../../types';
import { ROLE_LABELS } from '../../utils/constants';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps): ReactNode {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate('/');
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
          <NavLink to="/supervisors" className={getNavLinkClass}>
            Руководители
          </NavLink>

          {isAuthenticated && (
            <NavLink to="/dashboard" className={getNavLinkClass}>
              Кабинет
            </NavLink>
          )}

          {hasRole(Role.SUPERVISOR, Role.ADMIN) && (
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
              <div className={styles.userMeta}>
                <div className={styles.userName}>{user.fullName}</div>
                <div className={styles.userRole}>
                  {ROLE_LABELS[user.role] ?? user.role}
                </div>
              </div>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={() => void handleLogout()}
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
