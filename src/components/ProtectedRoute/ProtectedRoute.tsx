import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { type Role } from '../../types';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: Role[];
}

interface PublicOnlyRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps): ReactNode {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && !hasRole(...roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps): ReactNode {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#4C6F86' }}>Загрузка...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
