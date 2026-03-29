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
import { SupervisorsPage } from './pages/Supervisors/SupervisorsPage';
import { SupervisorDetailPage } from './pages/Supervisors/SupervisorDetailPage';
import { ColleaguesPage } from './pages/Supervisors/ColleaguesPage';
import { WorkspacePage } from './pages/Dashboard/WorkspacePage';
import { InfoPage } from './pages/Info/InfoPage';
import { TopicsPage } from './pages/Topics/TopicsPage';
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
            <Route path="/supervisors/:id" element={<SupervisorDetailPage />} />
            <Route path="/colleagues" element={<ColleaguesPage />} />
            <Route path="/info" element={<InfoPage />} />
            <Route path="/topics" element={<TopicsPage />} />

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
