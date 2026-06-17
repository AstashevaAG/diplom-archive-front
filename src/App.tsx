import { type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout/Layout';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute/ProtectedRoute';
import { ConfirmDialogProvider } from './components/ConfirmDialog';
import { Role } from './types';

// Pages
import { HomePage } from './pages/Home/HomePage';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { CatalogPage } from './pages/Catalog/CatalogPage';
import { WorkDetailPage } from './pages/Catalog/WorkDetailPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { CreateWorkPage } from './pages/Dashboard/CreateWorkPage';
import { SupervisorsPage } from './pages/Supervisors/SupervisorsPage';
import { SupervisorDetailPage } from './pages/Supervisors/SupervisorDetailPage';
import { ColleaguesPage } from './pages/Supervisors/ColleaguesPage';
import { WorkspacePage } from './pages/Dashboard/WorkspacePage';
import { InfoPage } from './pages/Info/InfoPage';
import { FAQPage } from './pages/FAQ/FAQPage';
import { TopicsPage } from './pages/Topics/TopicsPage';
import { AnalyticsPage } from './pages/Analytics/AnalyticsPage';
import { AdminPage } from './pages/Admin/AdminPage';

function App(): ReactNode {
  const studentRoles = [Role.STUDENT];
  const supervisorRoles = [Role.SUPERVISOR, Role.ADMIN];
  const supervisorProfileRoles = [Role.STUDENT, Role.SUPERVISOR, Role.ADMIN];

  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfirmDialogProvider>
          <Layout>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<PublicOnlyRoute><HomePage /></PublicOnlyRoute>} />
            <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
            <Route path="/catalog" element={<ProtectedRoute><CatalogPage /></ProtectedRoute>} />
            <Route path="/catalog/:id" element={<ProtectedRoute><WorkDetailPage /></ProtectedRoute>} />
            <Route path="/supervisors" element={<ProtectedRoute roles={studentRoles}><SupervisorsPage /></ProtectedRoute>} />
            <Route path="/supervisors/:id" element={<ProtectedRoute roles={supervisorProfileRoles}><SupervisorDetailPage /></ProtectedRoute>} />
            <Route path="/colleagues" element={<ProtectedRoute roles={supervisorRoles}><ColleaguesPage /></ProtectedRoute>} />
            <Route path="/info" element={<ProtectedRoute><InfoPage /></ProtectedRoute>} />
            <Route path="/faq" element={<ProtectedRoute><FAQPage /></ProtectedRoute>} />
            <Route path="/topics" element={<ProtectedRoute><TopicsPage /></ProtectedRoute>} />

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
                <ProtectedRoute roles={studentRoles}>
                  <CreateWorkPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/works/:id/workspace"
              element={
                <ProtectedRoute>
                  <WorkspacePage />
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
                <ProtectedRoute roles={supervisorRoles}>
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
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Layout>
        </ConfirmDialogProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
