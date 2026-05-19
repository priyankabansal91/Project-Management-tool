import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage, ResetPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { InviteAcceptPage } from '@/pages/auth/InviteAcceptPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { MicrosoftCallbackPage } from '@/pages/auth/MicrosoftCallbackPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProjectListPage } from '@/pages/pm/ProjectListPage';
import { KanbanBoardPage } from '@/pages/pm/KanbanBoardPage';
import { MilestonesPage } from '@/pages/pm/MilestonesPage';
import { MilestonesOverviewPage } from '@/pages/pm/MilestonesOverviewPage';
import { MyTasksPage } from '@/pages/user/MyTasksPage';
import { TaskDetailPage } from '@/pages/user/TaskDetailPage';
import { ProfilePage } from '@/pages/user/ProfilePage';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';
import { WorkflowsPage } from '@/pages/admin/WorkflowsPage';
import { CustomFieldsPage } from '@/pages/admin/CustomFieldsPage';
import { OrgSettingsPage } from '@/pages/admin/OrgSettingsPage';
import { AuditLogPage } from '@/pages/admin/AuditLogPage';
import { IssueTypesPage } from '@/pages/admin/IssueTypesPage';
import { TaskTemplatesPage } from '@/pages/admin/TaskTemplatesPage';
import { ReportsPage } from '@/pages/pm/ReportsPage';
import { ReportsAdvancedPage } from '@/pages/pm/ReportsAdvancedPage';
import { SprintManagementPage } from '@/pages/pm/SprintManagementPage';
import { TimeLoggingPage } from '@/pages/pm/TimeLoggingPage';
import { CalendarViewPage } from '@/pages/pm/CalendarViewPage';
import { ProjectTrackingPage } from '@/pages/pm/ProjectTrackingPage';
import { AIFeaturesPage } from '@/components/shared/AIFeatures';
import { OutlookIntegrationPage } from '@/pages/admin/integrations/OutlookIntegrationPage';
import { ExecutiveDashboardPage } from '@/pages/executive/ExecutiveDashboardPage';
import { RoadmapPage } from '@/pages/executive/RoadmapPage';
import { StatusReportsPage } from '@/pages/executive/StatusReportsPage';
import { RiskRegisterPage } from '@/pages/executive/RiskRegisterPage';
import { ResourceDashboardPage } from '@/pages/executive/ResourceDashboardPage';
import { FinancialDashboardPage } from '@/pages/executive/FinancialDashboardPage';
import { DivisionsPage } from '@/pages/admin/DivisionsPage';
import { HierarchyPage } from '@/pages/admin/HierarchyPage';
import { CustomRolesPage } from '@/pages/admin/CustomRolesPage';
import { ExternalUsersPage } from '@/pages/admin/ExternalUsersPage';
import { VersioningPage } from '@/pages/admin/VersioningPage';
import { ExportsPage } from '@/pages/admin/ExportsPage';
import { ApprovalInboxPage } from '@/pages/admin/ApprovalInboxPage';
import { FormsPage } from '@/pages/admin/FormsPage';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { DivisionConfigPage } from '@/pages/admin/DivisionConfigPage';
import { AdminHandoffPage } from '@/pages/admin/AdminHandoffPage';
import { PortfolioDashboardPage } from '@/pages/executive/PortfolioDashboardPage';
import { CapacityPlanningPage } from '@/pages/pm/CapacityPlanningPage';
import { GanttPage } from '@/pages/pm/GanttPage';
import { FeatureFlagsPage } from '@/pages/admin/FeatureFlagsPage';
import { OnboardingWizardPage } from '@/pages/admin/OnboardingWizardPage';
import { DivisionMISPage } from '@/pages/admin/DivisionMISPage';
import { VerticalsPage } from '@/pages/admin/VerticalsPage';
import { PermissionMatrixPage } from '@/pages/admin/PermissionMatrixPage';
import { NotificationsPage } from '@/pages/user/NotificationsPage';
import { WorkflowMonitoringPage } from '@/pages/workflow/WorkflowMonitoringPage';
import { WorkflowGovernancePage } from '@/pages/workflow/WorkflowGovernancePage';
import { WorkflowTrainingPage } from '@/pages/workflow/WorkflowTrainingPage';
import { GovernanceDashboardPage } from '@/pages/governance/GovernanceDashboardPage';
import { ProjectClosurePage } from '@/pages/governance/ProjectClosurePage';

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

function AcceptInviteRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/invite${search}`} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/invite" element={<InviteAcceptPage />} />
      <Route path="/accept-invite" element={<AcceptInviteRedirect />} />
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
        <Route path="/milestones" element={<MilestonesOverviewPage />} />
        <Route path="/projects/:projectId/milestones" element={<MilestonesPage />} />
        <Route path="/projects/:projectId/calendar" element={<CalendarViewPage />} />
        <Route path="/projects/:projectId/gantt" element={<GanttPage />} />
        <Route path="/gantt" element={<GanttPage />} />
        <Route path="/my-tasks" element={<MyTasksPage />} />
        <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* PM Views */}
        <Route path="/sprints" element={<SprintManagementPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/project-tracking" element={<ProjectTrackingPage />} />
        <Route path="/executive" element={<ExecutiveDashboardPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/status-reports" element={<StatusReportsPage />} />
        <Route path="/risk-register" element={<RiskRegisterPage />} />
        <Route path="/executive/resources" element={<ResourceDashboardPage />} />
        <Route path="/executive/financial" element={<FinancialDashboardPage />} />
        <Route path="/time-tracking" element={<TimeLoggingPage />} />
        <Route path="/calendar" element={<CalendarViewPage />} />
        <Route path="/team" element={<UserManagementPage />} />
        <Route path="/portfolio" element={<PortfolioDashboardPage />} />
        <Route path="/capacity" element={<CapacityPlanningPage />} />

        {/* AI */}
        <Route path="/ai" element={<AIFeaturesPage />} />

        {/* Admin */}
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/admin/workflows" element={<WorkflowsPage />} />
        <Route path="/admin/custom-fields" element={<CustomFieldsPage />} />
        <Route path="/admin/issue-types" element={<IssueTypesPage />} />
        <Route path="/admin/templates" element={<TaskTemplatesPage />} />
        <Route path="/admin/audit-log" element={<AuditLogPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/divisions" element={<DivisionsPage />} />
        <Route path="/admin/hierarchy" element={<HierarchyPage />} />
        <Route path="/admin/division-config" element={<DivisionConfigPage />} />
        <Route path="/admin/handoff" element={<AdminHandoffPage />} />
        <Route path="/admin/roles" element={<CustomRolesPage />} />
        <Route path="/admin/external-users" element={<ExternalUsersPage />} />
        <Route path="/admin/versioning" element={<VersioningPage />} />
        <Route path="/admin/exports" element={<ExportsPage />} />
        <Route path="/admin/approvals" element={<ApprovalInboxPage />} />
        <Route path="/admin/forms" element={<FormsPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/feature-flags" element={<FeatureFlagsPage />} />
        <Route path="/admin/onboarding" element={<OnboardingWizardPage />} />
        <Route path="/reports/advanced" element={<ReportsAdvancedPage />} />
        <Route path="/settings" element={<OrgSettingsPage />} />
        <Route path="/settings/integrations" element={<OutlookIntegrationPage />} />
        <Route path="/admin/integrations" element={<OutlookIntegrationPage />} />
        <Route path="/admin/division-mis" element={<DivisionMISPage />} />
        <Route path="/admin/verticals" element={<VerticalsPage />} />
        <Route path="/admin/permissions" element={<PermissionMatrixPage />} />

        {/* Workflow operational layer */}
        <Route path="/workflow/monitor" element={<WorkflowMonitoringPage />} />
        <Route path="/workflow/governance" element={<WorkflowGovernancePage />} />
        <Route path="/workflow/training" element={<WorkflowTrainingPage />} />

        {/* Governance */}
        <Route path="/governance" element={<GovernanceDashboardPage />} />
        <Route path="/governance/closure" element={<ProjectClosurePage />} />

      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
