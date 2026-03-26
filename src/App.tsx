import { type ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';
import { Role } from './types';

// Pages
import { HomePage } from './pages/Home/HomePage';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { CatalogPage } from './pages/Catalog/CatalogPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { SupervisorsPage } from './pages/Supervisors/SupervisorsPage';

function App(): ReactNode {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/supervisors" element={<SupervisorsPage />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Analytics — supervisor/admin only */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute roles={[Role.SUPERVISOR, Role.ADMIN]}>
                  <div style={{ padding: '2rem', color: '#e2e8f0' }}>
                    <h1>Аналитика</h1>
                    <p style={{ color: '#64748b', marginTop: '1rem' }}>
                      Дашборд аналитики (подключить Recharts)
                    </p>
                  </div>
                </ProtectedRoute>
              }
            />

            {/* Admin — admin only */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute roles={[Role.ADMIN]}>
                  <div style={{ padding: '2rem', color: '#e2e8f0' }}>
                    <h1>Панель администратора</h1>
                    <p style={{ color: '#64748b', marginTop: '1rem' }}>
                      Управление пользователями и настройками
                    </p>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
