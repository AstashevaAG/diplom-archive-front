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
          <span className={styles.logoIcon}>🎓</span>
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
              Админ
            </NavLink>
          )}
        </nav>

        <div className={styles.headerActions}>
          {isAuthenticated && user ? (
            <div className={styles.userInfo}>
              <div>
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
    </div>
  );
}
