import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProjectListPage } from '@/pages/pm/ProjectListPage';
import { KanbanBoardPage } from '@/pages/pm/KanbanBoardPage';
import { MyTasksPage } from '@/pages/user/MyTasksPage';
import { TaskDetailPage } from '@/pages/user/TaskDetailPage';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';
import { WorkflowsPage } from '@/pages/admin/WorkflowsPage';
import { OutlookIntegrationPage } from '@/pages/admin/integrations/OutlookIntegrationPage';
import { MicrosoftCallbackPage } from '@/pages/auth/MicrosoftCallbackPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuthStore();
  if (accessToken) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/auth/microsoft-callback" element={<MicrosoftCallbackPage />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectListPage />} />
        <Route path="/projects/:projectId/board" element={<KanbanBoardPage />} />
        <Route path="/my-tasks" element={<MyTasksPage />} />
        <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
        <Route path="/team" element={<UserManagementPage />} />
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/admin/workflows" element={<WorkflowsPage />} />
        <Route path="/admin/custom-fields" element={<WorkflowsPage />} />
        <Route path="/reports" element={<DashboardPage />} />
        <Route path="/settings" element={<UserManagementPage />} />
        <Route path="/settings/integrations" element={<OutlookIntegrationPage />} />
        <Route path="/admin/integrations" element={<OutlookIntegrationPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
