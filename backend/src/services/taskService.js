const ApiError = require('../utils/ApiError');
const projectService = require('./projectService');

const DEV_USER_NAMES = {
  'dev-org_admin-id':       'Priya Sharma',
  'dev-division_admin-id':  'Vikram Mehta',
  'dev-project_manager-id': 'Anjali Singh',
  'dev-member-id':          'Ravi Kumar',
  'dev-executive-id':       'Sunita Reddy',
  'dev-viewer-id':          'Arjun Patel',
};

function resolveUser(id) {
  if (!id) return null;
  return { id, name: DEV_USER_NAMES[id] || 'Team Member', avatar_url: null };
}

// In-memory storage for development (until database is set up)
const tasksStore = new Map();
let taskSequenceCounter = {};

// Seed tasks so My Tasks / Kanban aren't empty on first load
const seedTasks = [
  {
    id: 't1', orgId: 'dev-org-id', projectId: 'proj_default_1',
    projectName: 'Sample Project', projectKey: 'SAMPLE', projectColor: '#3B82F6',
    seqNumber: 1, title: 'Design new navigation component',
    description: 'Redesign the top navigation bar with improved UX and mobile support.',
    statusId: 'in-progress', statusName: 'In Progress', priority: 'high',
    assigneeId: 'dev-member-id', reporterId: 'dev-project_manager-id',
    dueDate: new Date('2026-05-10'), startDate: null, estimatedHours: 8,
    tags: ['frontend', 'design'], customFields: {}, parentTaskId: null,
    position: 10, isArchived: false, deletedAt: null, completedAt: null,
    createdBy: 'dev-project_manager-id', createdAt: new Date('2026-04-01'), updatedAt: new Date('2026-04-10'),
  },
  {
    id: 't2', orgId: 'dev-org-id', projectId: 'proj_default_1',
    projectName: 'Sample Project', projectKey: 'SAMPLE', projectColor: '#3B82F6',
    seqNumber: 2, title: 'Implement authentication flow',
    description: 'Set up JWT-based auth with refresh token rotation.',
    statusId: 'todo', statusName: 'To Do', priority: 'critical',
    assigneeId: 'dev-project_manager-id', reporterId: 'dev-org_admin-id',
    dueDate: new Date('2026-05-15'), startDate: null, estimatedHours: 16,
    tags: ['backend', 'security'], customFields: {}, parentTaskId: null,
    position: 20, isArchived: false, deletedAt: null, completedAt: null,
    createdBy: 'dev-org_admin-id', createdAt: new Date('2026-04-01'), updatedAt: new Date('2026-04-01'),
  },
  {
    id: 't3', orgId: 'dev-org-id', projectId: 'proj_default_1',
    projectName: 'Sample Project', projectKey: 'SAMPLE', projectColor: '#3B82F6',
    seqNumber: 3, title: 'Customer dashboard wireframes',
    description: 'Create detailed wireframes for the analytics dashboard.',
    statusId: 'done', statusName: 'Done', priority: 'medium',
    assigneeId: 'dev-member-id', reporterId: 'dev-project_manager-id',
    dueDate: new Date('2026-04-01'), startDate: null, estimatedHours: 4,
    tags: ['design'], customFields: {}, parentTaskId: null,
    position: 30, isArchived: false, deletedAt: null, completedAt: new Date('2026-03-30'),
    createdBy: 'dev-project_manager-id', createdAt: new Date('2026-03-15'), updatedAt: new Date('2026-03-30'),
  },
  {
    id: 't4', orgId: 'dev-org-id', projectId: 'proj_default_1',
    projectName: 'Sample Project', projectKey: 'SAMPLE', projectColor: '#3B82F6',
    seqNumber: 4, title: 'Set up CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing and deployment.',
    statusId: 'in-review', statusName: 'In Review', priority: 'high',
    assigneeId: 'dev-project_manager-id', reporterId: 'dev-org_admin-id',
    dueDate: new Date('2026-05-05'), startDate: null, estimatedHours: 6,
    tags: ['devops'], customFields: {}, parentTaskId: null,
    position: 40, isArchived: false, deletedAt: null, completedAt: null,
    createdBy: 'dev-org_admin-id', createdAt: new Date('2026-04-05'), updatedAt: new Date('2026-04-15'),
  },
  {
    id: 't5', orgId: 'dev-org-id', projectId: 'proj_eng_2',
    projectName: 'API Platform v3', projectKey: 'APIV3', projectColor: '#8B5CF6',
    seqNumber: 1, title: 'Define OpenAPI 3.1 specification',
    description: 'Draft the full OpenAPI spec for all v3 endpoints.',
    statusId: 'in-progress', statusName: 'In Progress', priority: 'high',
    assigneeId: 'dev-member-id', reporterId: 'dev-project_manager-id',
    dueDate: new Date('2026-05-20'), startDate: null, estimatedHours: 12,
    tags: ['api', 'documentation'], customFields: {}, parentTaskId: null,
    position: 10, isArchived: false, deletedAt: null, completedAt: null,
    createdBy: 'dev-project_manager-id', createdAt: new Date('2026-04-10'), updatedAt: new Date('2026-04-10'),
  },
  {
    id: 't6', orgId: 'dev-org-id', projectId: 'proj_eng_2',
    projectName: 'API Platform v3', projectKey: 'APIV3', projectColor: '#8B5CF6',
    seqNumber: 2, title: 'Implement rate limiting middleware',
    description: 'Add configurable rate limiting per API key and endpoint.',
    statusId: 'todo', statusName: 'To Do', priority: 'medium',
    assigneeId: 'dev-member-id', reporterId: 'dev-project_manager-id',
    dueDate: new Date('2026-06-01'), startDate: null, estimatedHours: 8,
    tags: ['backend', 'security'], customFields: {}, parentTaskId: null,
    position: 20, isArchived: false, deletedAt: null, completedAt: null,
    createdBy: 'dev-project_manager-id', createdAt: new Date('2026-04-10'), updatedAt: new Date('2026-04-10'),
  },
];

seedTasks.forEach((t) => tasksStore.set(t.id, t));
// Sync sequence counters
taskSequenceCounter['dev-org-id-proj_default_1'] = 4;
taskSequenceCounter['dev-org-id-proj_eng_2'] = 2;

class TaskService {
  async listByProject(orgId, projectId, { status_id, assignee_id, priority, search, view, page = 1, page_size = 50 }) {
    let items = Array.from(tasksStore.values())
      .filter(t => t.orgId === orgId && t.projectId === projectId && !t.deletedAt && !t.isArchived);

    if (status_id) items = items.filter(t => t.statusId === status_id);
    if (assignee_id) items = items.filter(t => t.assigneeId === assignee_id);
    if (priority) items = items.filter(t => t.priority === priority);
    if (search) items = items.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

    items.sort((a, b) => view === 'kanban' ? a.position - b.position : b.createdAt - a.createdAt);

    const total = items.length;
    const paginatedItems = items.slice((page - 1) * page_size, page * page_size);
    const mapped = paginatedItems.map((t) => this.formatTask(t));

    if (view === 'kanban') {
      // Group by status
      const columns = {};
      mapped.forEach(t => {
        if (!columns[t.status_id]) {
          columns[t.status_id] = { id: t.status_id, name: t.status_name, color: '#999', tasks: [] };
        }
        columns[t.status_id].tasks.push(t);
      });

      return { columns: Object.values(columns), pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) } };
    }

    return { items: mapped, pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) } };
  }

  async getMyTasks(orgId, userId, { status, priority, page = 1, page_size = 20 }) {
    let items = Array.from(tasksStore.values())
      .filter(t => t.orgId === orgId && t.assigneeId === userId && !t.deletedAt);

    if (status === 'overdue') {
      items = items.filter(t => t.dueDate && t.dueDate < new Date() && !t.completedAt);
    } else if (status === 'completed') {
      items = items.filter(t => t.completedAt);
    } else if (status === 'open') {
      items = items.filter(t => !t.completedAt);
    }
    if (priority) items = items.filter(t => t.priority === priority);

    items.sort((a, b) => (a.dueDate || new Date(9999, 0)) - (b.dueDate || new Date(9999, 0)));

    const total = items.length;
    const paginatedItems = items.slice((page - 1) * page_size, page * page_size);

    return {
      items: paginatedItems.map((t) => ({ ...this.formatTask(t), project: { id: t.projectId, name: t.projectName, key: t.projectKey, color: t.projectColor } })),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  async getById(orgId, taskId) {
    const task = tasksStore.get(taskId);
    if (!task || task.orgId !== orgId || task.deletedAt) {
      throw ApiError.notFound('Task not found');
    }
    return task;
  }

  async create(orgId, projectId, userId, data) {
    // Get next sequence number
    const key = `${orgId}-${projectId}`;
    taskSequenceCounter[key] = (taskSequenceCounter[key] || 0) + 1;
    const seqNumber = taskSequenceCounter[key];

    // Get max position for ordering
    const projectTasks = Array.from(tasksStore.values())
      .filter(t => t.projectId === projectId && t.statusId === data.status_id && !t.deletedAt);
    const position = projectTasks.length > 0 ? Math.max(...projectTasks.map(t => t.position)) + 10 : 10;

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const task = {
      id: taskId,
      orgId,
      projectId,
      projectName: 'Project',
      projectKey: 'PRJ',
      projectColor: '#3b82f6',
      seqNumber,
      title: data.title,
      description: data.description || null,
      statusId: data.status_id || null,
      statusName: data.status_name || 'Backlog',
      priority: data.priority || 'medium',
      assigneeId: data.assignee_id || null,
      reporterId: userId,
      dueDate: data.due_date ? new Date(data.due_date) : null,
      startDate: data.start_date ? new Date(data.start_date) : null,
      estimatedHours: data.estimated_hours || null,
      tags: data.tags || [],
      customFields: data.custom_fields || {},
      parentTaskId: data.parent_task_id || null,
      position,
      isArchived: false,
      deletedAt: null,
      completedAt: null,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    tasksStore.set(taskId, task);
    projectService.incrementTaskCount(orgId, projectId);
    return { ...task, task_key: `PRJ-${seqNumber}` };
  }

  async update(orgId, taskId, data) {
    const task = tasksStore.get(taskId);
    if (!task || task.orgId !== orgId || task.deletedAt) {
      throw ApiError.notFound('Task not found');
    }

    if (data.title !== undefined) task.title = data.title;
    if (data.description !== undefined) task.description = data.description;
    if (data.priority !== undefined) task.priority = data.priority;
    if (data.assignee_id !== undefined) task.assigneeId = data.assignee_id;
    if (data.due_date !== undefined) task.dueDate = data.due_date ? new Date(data.due_date) : null;
    if (data.start_date !== undefined) task.startDate = data.start_date ? new Date(data.start_date) : null;
    if (data.estimated_hours !== undefined) task.estimatedHours = data.estimated_hours;
    if (data.tags !== undefined) task.tags = data.tags;
    if (data.custom_fields !== undefined) task.customFields = data.custom_fields;
    if (data.status_id !== undefined) {
      task.statusId = data.status_id;
      task.statusName = data.status_name || null;
    }
    task.updatedAt = new Date();

    tasksStore.set(taskId, task);
    return this.formatTask(task);
  }

  async moveTask(orgId, taskId, { status_id, status_name, position }) {
    const task = tasksStore.get(taskId);
    if (!task || task.orgId !== orgId || task.deletedAt) {
      throw ApiError.notFound('Task not found');
    }

    const isFinal = status_name?.toLowerCase() === 'done' || status_name?.toLowerCase() === 'accepted';
    const wasCompleted = !!task.completedAt;

    task.statusId = status_id;
    task.statusName = status_name;
    task.position = position;
    if (isFinal && !wasCompleted) {
      task.completedAt = new Date();
      projectService.updateCompletedCount(task.orgId, task.projectId, 1);
    } else if (!isFinal && wasCompleted) {
      task.completedAt = null;
      projectService.updateCompletedCount(task.orgId, task.projectId, -1);
    }
    task.updatedAt = new Date();

    tasksStore.set(taskId, task);
    return this.formatTask(task);
  }

  async delete(orgId, taskId) {
    const task = tasksStore.get(taskId);
    if (!task || task.orgId !== orgId || task.deletedAt) {
      throw ApiError.notFound('Task not found');
    }

    task.deletedAt = new Date();
    tasksStore.set(taskId, task);
    projectService.decrementTaskCount(orgId, task.projectId);
    if (task.completedAt) {
      projectService.updateCompletedCount(orgId, task.projectId, -1);
    }
    return { success: true };
  }

  listAllForProject(orgId, projectId) {
    return Array.from(tasksStore.values())
      .filter(t => t.orgId === orgId && t.projectId === projectId && !t.deletedAt && !t.isArchived)
      .map(t => this.formatTask(t));
  }

  formatTask(t) {
    return {
      id: t.id,
      seq_number: t.seqNumber,
      task_key: `${t.projectKey}-${t.seqNumber}`,
      title: t.title,
      description: t.description,
      status_id: t.statusId,
      status_name: t.statusName,
      priority: t.priority,
      assignee: resolveUser(t.assigneeId),
      reporter: resolveUser(t.reporterId) || { id: t.reporterId, name: 'Reporter' },
      due_date: t.dueDate,
      start_date: t.startDate,
      estimated_hours: t.estimatedHours ? Number(t.estimatedHours) : null,
      logged_hours: 0,
      tags: t.tags,
      custom_fields: t.customFields,
      position: Number(t.position),
      comment_count: 0,
      subtask_count: 0,
      is_archived: t.isArchived,
      completed_at: t.completedAt,
      created_at: t.createdAt,
      updated_at: t.updatedAt,
    };
  }
}

module.exports = new TaskService();
