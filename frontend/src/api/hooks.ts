import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { ApiResponse, Project, Task, KanbanColumn, DashboardData, OrgMemberItem, WorkflowConfig, Comment, Pagination } from '@/types';

// ─── Dashboard ──────────────────────────────────────────

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DashboardData>>('/dashboard/overview');
      return data.data;
    },
  });
}

// ─── Projects ───────────────────────────────────────────

export function useProjects(params?: { status?: string; search?: string; page?: number }) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ items: Project[]; pagination: Pagination }>>('/projects', { params });
      return data.data;
    },
    staleTime: 0,
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Project>>(`/projects/${projectId}`);
      return data.data;
    },
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post('/projects', body);
      return data.data;
    },
    onSuccess: () => qc.refetchQueries({ queryKey: ['projects'] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { data } = await api.delete(`/projects/${projectId}`);
      return data.data;
    },
    onSuccess: () => qc.refetchQueries({ queryKey: ['projects'] }),
  });
}

// ─── Tasks ──────────────────────────────────────────────

export function useProjectTasks(projectId: string, params?: { view?: string; status_id?: string; assignee_id?: string; priority?: string; search?: string }) {
  return useQuery({
    queryKey: ['tasks', projectId, params],
    queryFn: async () => {
      const { data } = await api.get(`/tasks/project/${projectId}`, { params });
      return data.data;
    },
    enabled: !!projectId,
  });
}

export function useKanbanTasks(projectId: string) {
  return useQuery({
    queryKey: ['kanban', projectId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ columns: KanbanColumn[] }>>(`/tasks/project/${projectId}`, { params: { view: 'kanban', page_size: 200 } });
      return data.data;
    },
    enabled: !!projectId,
  });
}

export function useMyTasks(params?: { status?: string; priority?: string; page?: number }) {
  return useQuery({
    queryKey: ['myTasks', params],
    queryFn: async () => {
      const { data } = await api.get('/tasks/my', { params });
      return data.data;
    },
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const { data } = await api.get(`/tasks/${taskId}`);
      return data.data;
    },
    enabled: !!taskId,
  });
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post(`/tasks/project/${projectId}`, body);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      qc.invalidateQueries({ queryKey: ['kanban', projectId] });
      qc.invalidateQueries({ queryKey: ['myTasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.refetchQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, ...body }: { taskId: string } & Record<string, unknown>) => {
      const { data } = await api.patch(`/tasks/${taskId}`, body);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['kanban'] });
      qc.invalidateQueries({ queryKey: ['myTasks'] });
      qc.invalidateQueries({ queryKey: ['task'] });
    },
  });
}

export function useMoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, ...body }: { taskId: string; status_id: string; status_name: string; position: number }) => {
      const { data } = await api.post(`/tasks/${taskId}/move`, body);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanban'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['kanban'] });
      qc.invalidateQueries({ queryKey: ['myTasks'] });
    },
  });
}

// ─── Comments ───────────────────────────────────────────

export function useComments(taskId: string) {
  return useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      const { data } = await api.get(`/comments/task/${taskId}`);
      return data.data;
    },
    enabled: !!taskId,
  });
}

export function useCreateComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { body: string; parent_id?: string }) => {
      const { data } = await api.post(`/comments/task/${taskId}`, body);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] });
      qc.invalidateQueries({ queryKey: ['task', taskId] });
    },
  });
}

// ─── Members ────────────────────────────────────────────

export function useMembers(params?: { role?: string; search?: string }) {
  return useQuery({
    queryKey: ['members', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ items: OrgMemberItem[]; pagination: Pagination }>>('/members', { params });
      return data.data;
    },
    staleTime: 0,
  });
}

export function usePendingInvites() {
  return useQuery({
    queryKey: ['pendingInvites'],
    queryFn: async () => {
      const { data } = await api.get('/members/invites');
      return data.data as { id: string; email: string; role: string; invited_by: string; expires_at: string; created_at: string }[];
    },
    staleTime: 0,
  });
}

export function useCancelInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: string) => {
      await api.delete(`/members/invites/${inviteId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pendingInvites'] }),
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { email: string; role: string }) => {
      const { data } = await api.post('/members/invite', body);
      return data.data as { id: string; email: string; role: string; expires_at: string; invite_link: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useUpdateMemberStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { data } = await api.patch(`/members/${userId}/status`, { status });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/members/${userId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

// ─── Workflows ──────────────────────────────────────────

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<WorkflowConfig[]>>('/workflows');
      return data.data;
    },
  });
}

export function useWorkflow(workflowId: string) {
  return useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<WorkflowConfig>>(`/workflows/${workflowId}`);
      return data.data;
    },
    enabled: !!workflowId,
  });
}

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post('/workflows', body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  });
}

export function useUpdateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflowId, ...body }: { workflowId: string } & Record<string, unknown>) => {
      const { data } = await api.patch(`/workflows/${workflowId}`, body);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] });
      qc.invalidateQueries({ queryKey: ['workflow'] });
    },
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (workflowId: string) => {
      await api.delete(`/workflows/${workflowId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  });
}

// ─── Approvals ──────────────────────────────────────────

export function usePendingApprovals(params?: { page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['pendingApprovals', params],
    queryFn: async () => {
      const { data } = await api.get('/approvals/pending', { params });
      return data.data;
    },
  });
}

export function useApprovals(params?: { status?: string; page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['approvals', params],
    queryFn: async () => {
      const { data } = await api.get('/approvals', { params });
      return data.data;
    },
  });
}

export function useApproval(approvalId: string) {
  return useQuery({
    queryKey: ['approval', approvalId],
    queryFn: async () => {
      const { data } = await api.get(`/approvals/${approvalId}`);
      return data.data;
    },
    enabled: !!approvalId,
  });
}

export function useCreateApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post('/approvals', body);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
      qc.invalidateQueries({ queryKey: ['pendingApprovals'] });
    },
  });
}

export function useApproveStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ approvalId, ...body }: { approvalId: string } & Record<string, unknown>) => {
      const { data } = await api.post(`/approvals/${approvalId}/approve`, body);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
      qc.invalidateQueries({ queryKey: ['pendingApprovals'] });
      qc.invalidateQueries({ queryKey: ['approval'] });
    },
  });
}

export function useRejectStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ approvalId, ...body }: { approvalId: string } & Record<string, unknown>) => {
      const { data } = await api.post(`/approvals/${approvalId}/reject`, body);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
      qc.invalidateQueries({ queryKey: ['pendingApprovals'] });
      qc.invalidateQueries({ queryKey: ['approval'] });
    },
  });
}

// ─── Forms ──────────────────────────────────────────────

export function useFormTemplates() {
  return useQuery({
    queryKey: ['formTemplates'],
    queryFn: async () => {
      const { data } = await api.get('/forms/templates');
      return data.data;
    },
  });
}

export function useFormTemplate(formId: string) {
  return useQuery({
    queryKey: ['formTemplate', formId],
    queryFn: async () => {
      const { data } = await api.get(`/forms/templates/${formId}`);
      return data.data;
    },
    enabled: !!formId,
  });
}

export function useSubmitForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ formId, ...body }: { formId: string } & Record<string, unknown>) => {
      const { data } = await api.post(`/forms/submit/${formId}`, body);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['formSubmissions'] });
      qc.invalidateQueries({ queryKey: ['myTasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useFormSubmissions(params?: { form_id?: string; status?: string; page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['formSubmissions', params],
    queryFn: async () => {
      const { data } = await api.get('/forms/submissions', { params });
      return data.data;
    },
  });
}

// ─── Divisions ──────────────────────────────────────────

export function useDivisions(params?: { search?: string; parent_id?: string; page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['divisions', params],
    queryFn: async () => {
      const { data } = await api.get('/divisions', { params });
      return data.data;
    },
  });
}

export function useDivisionHierarchy() {
  return useQuery({
    queryKey: ['divisionHierarchy'],
    queryFn: async () => {
      const { data } = await api.get('/divisions/hierarchy');
      return data.data;
    },
  });
}

export function useDivision(divisionId: string) {
  return useQuery({
    queryKey: ['division', divisionId],
    queryFn: async () => {
      const { data } = await api.get(`/divisions/${divisionId}`);
      return data.data;
    },
    enabled: !!divisionId,
  });
}

export function useCreateDivision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post('/divisions', body);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['divisions'] });
      qc.invalidateQueries({ queryKey: ['divisionHierarchy'] });
    },
  });
}

export function useUpdateDivision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ divisionId, ...body }: { divisionId: string } & Record<string, unknown>) => {
      const { data } = await api.patch(`/divisions/${divisionId}`, body);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['divisions'] });
      qc.invalidateQueries({ queryKey: ['divisionHierarchy'] });
      qc.invalidateQueries({ queryKey: ['division'] });
    },
  });
}

export function useDeleteDivision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (divisionId: string) => {
      await api.delete(`/divisions/${divisionId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['divisions'] });
      qc.invalidateQueries({ queryKey: ['divisionHierarchy'] });
    },
  });
}

// ─── Custom Roles ───────────────────────────────────────

export function useAvailablePermissions() {
  return useQuery({
    queryKey: ['availablePermissions'],
    queryFn: async () => {
      const { data } = await api.get('/roles/permissions');
      return data.data;
    },
  });
}

export function useCustomRoles(params?: { search?: string; page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['customRoles', params],
    queryFn: async () => {
      const { data } = await api.get('/roles', { params });
      return data.data;
    },
  });
}

export function useCustomRole(roleId: string) {
  return useQuery({
    queryKey: ['customRole', roleId],
    queryFn: async () => {
      const { data } = await api.get(`/roles/${roleId}`);
      return data.data;
    },
    enabled: !!roleId,
  });
}

export function useCreateCustomRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post('/roles', body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customRoles'] }),
  });
}

export function useUpdateCustomRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ roleId, ...body }: { roleId: string } & Record<string, unknown>) => {
      const { data } = await api.patch(`/roles/${roleId}`, body);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customRoles'] });
      qc.invalidateQueries({ queryKey: ['customRole'] });
    },
  });
}

export function useDeleteCustomRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (roleId: string) => {
      await api.delete(`/roles/${roleId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customRoles'] }),
  });
}

export function useSystemRoleMatrix() {
  return useQuery({
    queryKey: ['systemRoleMatrix'],
    queryFn: async () => {
      const { data } = await api.get('/roles/system-matrix');
      return data.data;
    },
  });
}

export function useUpdateSystemRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ role, permissions }: { role: string; permissions: string[] }) => {
      const { data } = await api.patch('/roles/system-matrix', { role, permissions });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['systemRoleMatrix'] }),
  });
}

export function useOrgMembers() {
  return useQuery({
    queryKey: ['orgMembers'],
    queryFn: async () => {
      const { data } = await api.get('/roles/members');
      return data.data as any[];
    },
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data } = await api.patch(`/roles/members/${userId}`, { role });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orgMembers'] }),
  });
}

// ─── External Users ─────────────────────────────────────

export function useExternalUsers(params?: { search?: string; accessLevel?: string; page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['externalUsers', params],
    queryFn: async () => {
      const { data } = await api.get('/external-users', { params });
      return data.data;
    },
  });
}

export function useExternalUser(externalUserId: string) {
  return useQuery({
    queryKey: ['externalUser', externalUserId],
    queryFn: async () => {
      const { data } = await api.get(`/external-users/${externalUserId}`);
      return data.data;
    },
    enabled: !!externalUserId,
  });
}

export function useInviteExternalUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post('/external-users', body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['externalUsers'] }),
  });
}

export function useUpdateExternalUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ externalUserId, ...body }: { externalUserId: string } & Record<string, unknown>) => {
      const { data } = await api.patch(`/external-users/${externalUserId}`, body);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['externalUsers'] });
      qc.invalidateQueries({ queryKey: ['externalUser'] });
    },
  });
}

export function useRevokeExternalUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (externalUserId: string) => {
      const { data } = await api.post(`/external-users/${externalUserId}/revoke`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['externalUsers'] }),
  });
}

// ─── Versioning ─────────────────────────────────────────

export function useEntityHistory(entityType: string, entityId: string, params?: { page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['entityHistory', entityType, entityId, params],
    queryFn: async () => {
      const { data } = await api.get(`/versioning/${entityType}/${entityId}/history`, { params });
      return data.data;
    },
    enabled: !!entityType && !!entityId,
  });
}

export function useSnapshots(params?: { snapshotType?: string; page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['snapshots', params],
    queryFn: async () => {
      const { data } = await api.get('/versioning/snapshots', { params });
      return data.data;
    },
  });
}

export function useCreateSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post('/versioning/snapshots', body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['snapshots'] }),
  });
}

// ─── Exports ────────────────────────────────────────────

export function useExports(params?: { exportType?: string; status?: string; page?: number; page_size?: number }) {
  return useQuery({
    queryKey: ['exports', params],
    queryFn: async () => {
      const { data } = await api.get('/exports', { params });
      return data.data;
    },
  });
}

export function useExport(exportId: string) {
  return useQuery({
    queryKey: ['export', exportId],
    queryFn: async () => {
      const { data } = await api.get(`/exports/${exportId}`);
      return data.data;
    },
    enabled: !!exportId,
  });
}

export function useExportTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post('/exports/tasks', body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exports'] }),
  });
}

export function useExportProjects() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post('/exports/projects', body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exports'] }),
  });
}

// ─── Division Config ─────────────────────────────────────

export function useMyDivisions() {
  return useQuery({
    queryKey: ['myDivisions'],
    queryFn: async () => {
      const { data } = await api.get('/division-config/my');
      return data.data as { divisionId: string; divisionName: string; role: string; color: string; description: string }[];
    },
  });
}

export function useAllDivisionConfigs() {
  return useQuery({
    queryKey: ['allDivisionConfigs'],
    queryFn: async () => {
      const { data } = await api.get('/division-config');
      return data.data as any[];
    },
  });
}

export function useDivisionConfig(divisionId: string | null) {
  return useQuery({
    queryKey: ['divisionConfig', divisionId],
    queryFn: async () => {
      const { data } = await api.get(`/division-config/${divisionId}`);
      return data.data;
    },
    enabled: !!divisionId,
  });
}

export function useUpdateDivisionConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ divisionId, config }: { divisionId: string; config: any }) => {
      const { data } = await api.patch(`/division-config/${divisionId}`, config);
      return data.data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['divisionConfig', vars.divisionId] });
      qc.invalidateQueries({ queryKey: ['allDivisionConfigs'] });
    },
  });
}

export function useDivisionMembers(divisionId: string | null) {
  return useQuery({
    queryKey: ['divisionMembers', divisionId],
    queryFn: async () => {
      const { data } = await api.get(`/division-config/${divisionId}/members`);
      return data.data as any[];
    },
    enabled: !!divisionId,
  });
}

export function useAddDivisionMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ divisionId, userId, role }: { divisionId: string; userId: string; role: string }) => {
      const { data } = await api.post(`/division-config/${divisionId}/members`, { userId, role });
      return data.data;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['divisionMembers', vars.divisionId] }),
  });
}

export function useRemoveDivisionMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ divisionId, userId }: { divisionId: string; userId: string }) => {
      await api.delete(`/division-config/${divisionId}/members/${userId}`);
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['divisionMembers', vars.divisionId] }),
  });
}

/**
 * useDivisionModules — fetches enabled_modules for a specific division.
 * Returns { modules: string[], isLoading, isEnabled: (moduleId: string) => boolean }
 */
export function useDivisionModules(divisionId: string | null) {
  const query = useDivisionConfig(divisionId);
  const modules: string[] = query.data?.enabled_modules ?? [];
  return {
    ...query,
    modules,
    isEnabled: (moduleId: string) => modules.includes(moduleId),
  };
}

/**
 * useMyDivisionModules — fetches enabled modules for the first division
 * the current user belongs to (used for PermissionGate checks).
 */
export function useMyDivisionModules() {
  const myDivisions = useMyDivisions();
  const firstDivisionId = myDivisions.data?.[0]?.divisionId ?? null;
  return useDivisionModules(firstDivisionId);
}

// ─── Executive Rollup ────────────────────────────────────

export function useExecutiveRollup() {
  return useQuery({
    queryKey: ['executiveRollup'],
    queryFn: async () => {
      const { data } = await api.get('/executive/rollup');
      return data.data as {
        scorecards: any[];
        orgSummary: { divisionsCount: number; totalProjects: number; activeProjects: number; totalMembers: number; totalBudget: number; totalTasks: number; completedTasks: number; overdueTasks: number; greenDivisions: number; amberDivisions: number; redDivisions: number; completionPct: number };
        velocityComparison: any[];
        budgetComparison: any[];
        alerts: { divisionId: string; division: string; severity: string; message: string }[];
      };
    },
  });
}

export function useExecutiveScorecards() {
  return useQuery({
    queryKey: ['executiveScorecards'],
    queryFn: async () => {
      const { data } = await api.get('/executive/scorecards');
      return data.data as any[];
    },
  });
}

// ─── OKRs ────────────────────────────────────────────────

export function useOKRs(params?: { level?: string; quarter?: string; year?: string }) {
  return useQuery({
    queryKey: ['okrs', params],
    queryFn: async () => {
      const { data } = await api.get('/okrs', { params });
      return data.data;
    },
  });
}

export function useUpdateOKR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.patch(`/okrs/${id}`, body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['okrs'] }),
  });
}

// ─── Resources ───────────────────────────────────────────

export function useResources(params?: { type?: string; department?: string; status?: string }) {
  return useQuery({
    queryKey: ['resources', params],
    queryFn: async () => {
      const { data } = await api.get('/resources', { params });
      return data.data;
    },
  });
}

export function useResourceCapacityHeatmap() {
  return useQuery({
    queryKey: ['resourceCapacity'],
    queryFn: async () => {
      const { data } = await api.get('/resources/capacity/heatmap');
      return data.data;
    },
  });
}

export function useResourceDashboard() {
  return useQuery({
    queryKey: ['resourceDashboard'],
    queryFn: async () => {
      const { data } = await api.get('/resources/dashboard');
      return data.data;
    },
  });
}

export function useAllHandoffStatuses() {
  return useQuery({
    queryKey: ['handoffStatuses'],
    queryFn: async () => {
      const { data } = await api.get('/division-config/handoff/all');
      return data.data as { divisionId: string; name: string; checks: Record<string, boolean>; readyScore: number; totalChecks: number; isReady: boolean; workflowTemplate: string | null }[];
    },
  });
}

export function useDivisionHandoffStatus(divisionId: string | null) {
  return useQuery({
    queryKey: ['handoffStatus', divisionId],
    queryFn: async () => {
      const { data } = await api.get(`/division-config/${divisionId}/handoff-status`);
      return data.data;
    },
    enabled: !!divisionId,
  });
}

// ─── Time Logs ───────────────────────────────────────────

export function useMyTimeLogs(params?: { weekStart?: string; projectId?: string }) {
  return useQuery({
    queryKey: ['myTimeLogs', params],
    queryFn: async () => {
      const queryParams: Record<string, string> = {};
      if (params?.weekStart) {
        queryParams.startDate = params.weekStart;
        const end = new Date(params.weekStart + 'T00:00:00Z');
        end.setUTCDate(end.getUTCDate() + 6);
        queryParams.endDate = end.toISOString().slice(0, 10);
      }
      if (params?.projectId) queryParams.projectId = params.projectId;
      const { data } = await api.get('/time-logs/my', { params: queryParams });
      return (data.data?.items ?? data.data ?? []) as any[];
    },
  });
}

export function useWeeklySummary(weekStart?: string) {
  return useQuery({
    queryKey: ['weeklySummary', weekStart],
    queryFn: async () => {
      const { data } = await api.get('/time-logs/summary/weekly', { params: weekStart ? { weekStart } : {} });
      return data.data as {
        weekStart: string; weekEnd: string; totalHours: number; targetHours: number;
        byDay: Record<string, number>;
        byProject: { projectKey: string; projectName: string; hours: number; days: number }[];
        timesheetStatus: string | null;
      };
    },
  });
}

export function useOrgTimeSummary() {
  return useQuery({
    queryKey: ['orgTimeSummary'],
    queryFn: async () => {
      const { data } = await api.get('/time-logs/summary/org');
      return data.data as any;
    },
  });
}

export function useTimesheets(params?: { status?: string }) {
  return useQuery({
    queryKey: ['timesheets', params],
    queryFn: async () => {
      const { data } = await api.get('/time-logs/timesheets', { params });
      return data.data as any[];
    },
  });
}

export function useLogTime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { projectId?: string; taskId?: string; hours: number; description?: string; loggedDate?: string }) => {
      const { data } = await api.post('/time-logs', body);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myTimeLogs'] });
      qc.invalidateQueries({ queryKey: ['weeklySummary'] });
    },
  });
}

export function useUpdateTimeLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.patch(`/time-logs/${id}`, body);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myTimeLogs'] });
      qc.invalidateQueries({ queryKey: ['weeklySummary'] });
    },
  });
}

export function useDeleteTimeLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/time-logs/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myTimeLogs'] });
      qc.invalidateQueries({ queryKey: ['weeklySummary'] });
    },
  });
}

export function useSubmitTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { weekStart: string; note?: string }) => {
      const { data } = await api.post('/time-logs/timesheets/submit', body);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timesheets'] });
      qc.invalidateQueries({ queryKey: ['weeklySummary'] });
    },
  });
}

export function useApproveTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ timesheetId, note }: { timesheetId: string; note?: string }) => {
      const { data } = await api.patch(`/time-logs/timesheets/${timesheetId}/approve`, { note });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timesheets'] }),
  });
}

export function useRejectTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ timesheetId, note }: { timesheetId: string; note: string }) => {
      const { data } = await api.patch(`/time-logs/timesheets/${timesheetId}/reject`, { note });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timesheets'] }),
  });
}

// ─── Notifications ───────────────────────────────────────

export function useNotifications(params?: { unread_only?: boolean; page?: number }) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const { data } = await api.get('/notifications', { params });
      return data.data as { items: any[]; total: number; unreadCount: number };
    },
    refetchInterval: 30000, // poll every 30s
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notifications/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

// ─── Search ──────────────────────────────────────────────

export function useSearch(q: string, types = 'tasks,projects') {
  return useQuery({
    queryKey: ['search', q, types],
    queryFn: async () => {
      const { data } = await api.get('/search', { params: { q, types, page_size: 20 } });
      return data.data as { results: any[]; total: number; took: number };
    },
    enabled: q.length >= 2,
    staleTime: 10000,
  });
}

// ─── Bulk Task Actions ────────────────────────────────────

export function useBulkTaskAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { taskIds: string[]; operation: 'status' | 'priority' | 'assignee' | 'delete'; value?: string }) => {
      const { data } = await api.patch('/tasks/bulk', body);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['kanban'] });
      qc.invalidateQueries({ queryKey: ['myTasks'] });
    },
  });
}

// ── Portfolio ─────────────────────────────────────────────
export const usePortfolioSummary = () =>
  useQuery({ queryKey: ['portfolio'], queryFn: () => api.get('/portfolio').then(r => r.data.data), staleTime: 60_000 });

export const usePortfolioCapacity = (weeks = 4) =>
  useQuery({ queryKey: ['portfolio-capacity', weeks], queryFn: () => api.get(`/portfolio/capacity?weeks=${weeks}`).then(r => r.data.data), staleTime: 60_000 });

export const usePortfolioDependencies = () =>
  useQuery({ queryKey: ['portfolio-dependencies'], queryFn: () => api.get('/portfolio/dependencies').then(r => r.data.data), staleTime: 120_000 });

// ─── Sprints ─────────────────────────────────────────────

export function useSprints(projectId: string) {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      const { data } = await api.get('/sprints', { params: { project_id: projectId } });
      return data.data as Sprint[];
    },
    enabled: !!projectId,
    staleTime: 0,
  });
}

export function useSprintBacklog(projectId: string) {
  return useQuery({
    queryKey: ['sprintBacklog', projectId],
    queryFn: async () => {
      const { data } = await api.get('/sprints/backlog', { params: { project_id: projectId } });
      return data.data as Task[];
    },
    enabled: !!projectId,
    staleTime: 0,
  });
}

export function useCreateSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; goal?: string; start_date?: string; end_date?: string }) => {
      const { data } = await api.post('/sprints', body, { params: { project_id: projectId } });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints', projectId] }),
  });
}

export function useUpdateSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sprintId, ...body }: { sprintId: string; name?: string; goal?: string; start_date?: string; end_date?: string; status?: string }) => {
      const { data } = await api.patch(`/sprints/${sprintId}`, body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sprints', projectId] }),
  });
}

export function useDeleteSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sprintId: string) => {
      await api.delete(`/sprints/${sprintId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints', projectId] });
      qc.invalidateQueries({ queryKey: ['sprintBacklog', projectId] });
    },
  });
}

export function useAddTaskToSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sprintId, taskId }: { sprintId: string; taskId: string }) => {
      const { data } = await api.post(`/sprints/${sprintId}/tasks`, { task_id: taskId });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints', projectId] });
      qc.invalidateQueries({ queryKey: ['sprintBacklog', projectId] });
    },
  });
}

export function useRemoveTaskFromSprint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sprintId, taskId }: { sprintId: string; taskId: string }) => {
      const { data } = await api.delete(`/sprints/${sprintId}/tasks/${taskId}`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints', projectId] });
      qc.invalidateQueries({ queryKey: ['sprintBacklog', projectId] });
    },
  });
}

interface Sprint {
  id: string;
  project_id: string;
  name: string;
  goal: string;
  status: 'planned' | 'active' | 'completed';
  start_date: string | null;
  end_date: string | null;
  tasks: Task[];
  task_count: number;
  completed_tasks: number;
}

// ─── Audit Logs ──────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value: unknown;
  new_value: unknown;
  diff: unknown;
  ip_address: string | null;
  created_at: string;
  actor: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

export interface AuditLogParams {
  page?: number;
  page_size?: number;
  entity_type?: string;
  action?: string;
  actor_id?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

export function useAuditLogs(params?: AuditLogParams) {
  return useQuery({
    queryKey: ['auditLogs', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ items: AuditLogEntry[]; pagination: Pagination }>>(
        '/audit-logs',
        { params }
      );
      return data.data;
    },
    staleTime: 30000,
  });
}

// ─── Division MIS ─────────────────────────────────────────

export interface DivisionMISData {
  division: { id: string; name: string; code: string };
  members: { total: number; active: number; inactive: number; suspended: number };
  projects: { total: number; active: number; completed: number; on_hold: number; overdue: number };
  tasks: {
    total: number; open: number; in_progress: number; completed: number;
    overdue: number; due_this_week: number;
    by_priority: { critical: number; high: number; medium: number; low: number };
  };
  time_tracking: { hours_this_week: number; hours_this_month: number };
  approvals: { pending: number; approved_this_month: number; rejected_this_month: number };
  top_contributors: { user_id: string; name: string; tasks_completed: number; hours_logged: number }[];
  recent_activity: { action: string; entity: string; actor: string; timestamp: string }[];
}

export interface DivisionOverviewMISItem {
  id: string;
  name: string;
  color: string;
  member_count: number;
  project_count: number;
  task_completion_rate: number;
  health_score: number;
}

export function useDivisionMIS(divisionId: string) {
  return useQuery({
    queryKey: ['divisionMIS', divisionId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DivisionMISData>>(`/mis/division/${divisionId}`);
      return data.data;
    },
    enabled: !!divisionId,
    staleTime: 30_000,
  });
}

export function useDivisionOverviewMIS() {
  return useQuery({
    queryKey: ['divisionOverviewMIS'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DivisionOverviewMISItem[]>>('/mis/division-overview');
      return data.data;
    },
    staleTime: 30_000,
  });
}

