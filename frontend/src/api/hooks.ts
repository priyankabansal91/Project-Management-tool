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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
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
