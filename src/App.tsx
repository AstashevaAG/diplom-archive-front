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
import { WorkDetailPage } from './pages/Catalog/WorkDetailPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { CreateWorkPage } from './pages/Dashboard/CreateWorkPage';
import { ProfilePage } from './pages/Dashboard/ProfilePage';
import { SupervisorsPage } from './pages/Supervisors/SupervisorsPage';
import { AnalyticsPage } from './pages/Analytics/AnalyticsPage';
import { AdminPage } from './pages/Admin/AdminPage';

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
            <Route path="/catalog/:id" element={<WorkDetailPage />} />
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
              path="/dashboard/works/new"
              element={
                <ProtectedRoute>
                  <CreateWorkPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
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
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin — admin only */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={[Role.ADMIN]}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute roles={[Role.ADMIN]}>
                  <AdminPage />
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
