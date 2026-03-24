import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, Role, AuthResponse, RegisterData, LoginData } from '../types';
import { authApi } from '../api/authApi';
import { usersApi } from '../api/usersApi';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async (): Promise<void> => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await usersApi.getMe();
      setUser(userData);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const handleAuthResponse = useCallback((response: AuthResponse): void => {
    localStorage.setItem('accessToken', response.tokens.accessToken);
    localStorage.setItem('refreshToken', response.tokens.refreshToken);
    // Load the full user profile
    void usersApi.getMe().then((userData) => {
      setUser(userData);
    });
  }, []);

  const login = useCallback(
    async (data: LoginData): Promise<void> => {
      const response = await authApi.login(data);
      handleAuthResponse(response);
    },
    [handleAuthResponse],
  );

  const register = useCallback(
    async (data: RegisterData): Promise<void> => {
      const response = await authApi.register(data);
      handleAuthResponse(response);
    },
    [handleAuthResponse],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles: Role[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    register,
    logout,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
