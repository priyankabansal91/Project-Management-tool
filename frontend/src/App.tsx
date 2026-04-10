import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage, ResetPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { InviteAcceptPage } from '@/pages/auth/InviteAcceptPage';
import { MicrosoftCallbackPage } from '@/pages/auth/MicrosoftCallbackPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProjectListPage } from '@/pages/pm/ProjectListPage';
import { KanbanBoardPage } from '@/pages/pm/KanbanBoardPage';
import { MyTasksPage } from '@/pages/user/MyTasksPage';
import { TaskDetailPage } from '@/pages/user/TaskDetailPage';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';
import { WorkflowsPage } from '@/pages/admin/WorkflowsPage';
import { CustomFieldsPage } from '@/pages/admin/CustomFieldsPage';
import { OrgSettingsPage } from '@/pages/admin/OrgSettingsPage';
import { AuditLogPage } from '@/pages/admin/AuditLogPage';
import { ReportsPage } from '@/pages/pm/ReportsPage';
import { SprintManagementPage } from '@/pages/pm/SprintManagementPage';
import { TimeLoggingPage } from '@/pages/pm/TimeLoggingPage';
import { CalendarViewPage } from '@/pages/pm/CalendarViewPage';
import { AIFeaturesPage } from '@/components/shared/AIFeatures';
import { OutlookIntegrationPage } from '@/pages/admin/integrations/OutlookIntegrationPage';

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
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/invite" element={<InviteAcceptPage />} />
      <Route path="/auth/microsoft-callback" element={<MicrosoftCallbackPage />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        {/* Core */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectListPage />} />
        <Route path="/projects/:projectId/board" element={<KanbanBoardPage />} />
        <Route path="/projects/:projectId/calendar" element={<CalendarViewPage />} />
        <Route path="/my-tasks" element={<MyTasksPage />} />
        <Route path="/tasks/:taskId" element={<TaskDetailPage />} />

        {/* PM Views */}
        <Route path="/sprints" element={<SprintManagementPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/time-tracking" element={<TimeLoggingPage />} />
        <Route path="/calendar" element={<CalendarViewPage />} />
        <Route path="/team" element={<UserManagementPage />} />

        {/* AI */}
        <Route path="/ai" element={<AIFeaturesPage />} />

        {/* Admin */}
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/admin/workflows" element={<WorkflowsPage />} />
        <Route path="/admin/custom-fields" element={<CustomFieldsPage />} />
        <Route path="/admin/audit-log" element={<AuditLogPage />} />
        <Route path="/settings" element={<OrgSettingsPage />} />
        <Route path="/settings/integrations" element={<OutlookIntegrationPage />} />
        <Route path="/admin/integrations" element={<OutlookIntegrationPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
