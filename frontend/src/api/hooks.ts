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
