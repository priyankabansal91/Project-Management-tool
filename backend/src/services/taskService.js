const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const USER_SELECT = { id: true, firstName: true, lastName: true, avatarUrl: true };

function fmtUser(u) {
  if (!u) return null;
  return { id: u.id, name: `${u.firstName} ${u.lastName}`, avatar_url: u.avatarUrl || null };
}

function formatTask(t) {
  return {
    id: t.id,
    seq_number: t.seqNumber,
    task_key: `${t.project?.key ?? '?'}-${t.seqNumber}`,
    title: t.title,
    description: t.description,
    status_id: t.statusId,
    status_name: t.statusName ?? (t.completedAt ? 'Done' : 'Backlog'),
    priority: t.priority,
    assignee: fmtUser(t.assignee),
    reporter: fmtUser(t.reporter),
    due_date: t.dueDate,
    start_date: t.startDate,
    estimated_hours: t.estimatedHours ? Number(t.estimatedHours) : null,
    logged_hours: Number(t.loggedHours ?? 0),
    tags: t.tags ?? [],
    custom_fields: t.customFields ?? {},
    position: Number(t.position ?? 0),
    comment_count: t._count?.comments ?? 0,
    subtask_count: t._count?.subtasks ?? 0,
    sprint_id: t.sprintId ?? null,
    milestone_id: t.milestoneId ?? null,
    depends_on_id: t.dependsOnId ?? null,
    blocked_reason: t.blockedReason ?? null,
    depends_on: t.dependsOn ? {
      id: t.dependsOn.id,
      task_key: `${t.dependsOn.project?.key ?? '?'}-${t.dependsOn.seqNumber}`,
      title: t.dependsOn.title,
      status_name: t.dependsOn.statusName,
      is_done: !!t.dependsOn.completedAt,
    } : null,
    dependents_count: t._count?.dependents ?? 0,
    is_archived: t.isArchived,
    completed_at: t.completedAt,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  };
}

const TASK_INCLUDE = {
  project: { select: { key: true, name: true, color: true, id: true } },
  assignee: { select: USER_SELECT },
  reporter: { select: USER_SELECT },
  dependsOn: { select: { id: true, seqNumber: true, title: true, statusName: true, completedAt: true, project: { select: { key: true } } } },
  _count: { select: { comments: { where: { deletedAt: null } }, subtasks: true, dependents: true } },
};

class TaskService {
  async listByProject(orgId, projectId, { status_id, assignee_id, priority, search, view, page = 1, page_size = 50 } = {}) {
    page = parseInt(page) || 1;
    page_size = parseInt(page_size) || 50;
    const where = { orgId, projectId, deletedAt: null, isArchived: false };
    if (status_id)   where.statusId   = status_id;
    if (assignee_id) where.assigneeId = assignee_id;
    if (priority)    where.priority   = priority;
    if (search)      where.title      = { contains: search, mode: 'insensitive' };

    const tasks = await prisma.task.findMany({
      where,
      include: TASK_INCLUDE,
      orderBy: view === 'kanban' ? { position: 'asc' } : { createdAt: 'desc' },
      skip: (page - 1) * page_size,
      take: page_size,
    });

    const total = await prisma.task.count({ where });
    const mapped = tasks.map(formatTask);

    if (view === 'kanban') {
      // Build columns from workflow statuses so all columns appear even when empty
      const DEFAULT_STATUSES = [
        { id: 'backlog',     name: 'Backlog',     color: '#6B7280', order: 1 },
        { id: 'todo',        name: 'To Do',        color: '#3B82F6', order: 2 },
        { id: 'in_progress', name: 'In Progress',  color: '#F59E0B', order: 3 },
        { id: 'in_review',   name: 'In Review',    color: '#8B5CF6', order: 4 },
        { id: 'done',        name: 'Done',          color: '#10B981', order: 5 },
      ];

      // Fetch project workflow statuses
      let workflowStatuses = null;
      const proj = await prisma.project.findFirst({
        where: { id: projectId, orgId },
        include: { workflowConfig: { select: { statuses: true } } },
      });
      if (proj?.workflowConfig?.statuses && Array.isArray(proj.workflowConfig.statuses) && proj.workflowConfig.statuses.length > 0) {
        workflowStatuses = proj.workflowConfig.statuses;
      } else {
        const defWf = await prisma.workflowConfig.findFirst({ where: { orgId, isDefault: true }, select: { statuses: true } });
        if (defWf?.statuses && Array.isArray(defWf.statuses) && defWf.statuses.length > 0) {
          workflowStatuses = defWf.statuses;
        }
      }
      const statusDefs = workflowStatuses ?? DEFAULT_STATUSES;
      const sorted = [...statusDefs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      // Initialise all columns
      const columns = {};
      sorted.forEach((s) => { columns[s.id] = { id: s.id, name: s.name, color: s.color || '#6B7280', tasks: [] }; });

      // Place tasks — fall back to first column if status_id is missing/unknown
      const firstColId = sorted[0]?.id;
      mapped.forEach((t) => {
        const colId = t.status_id && columns[t.status_id] ? t.status_id : firstColId;
        if (colId) columns[colId].tasks.push(t);
      });

      return { columns: Object.values(columns), pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) } };
    }

    return { items: mapped, pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) } };
  }

  async getMyTasks(orgId, userId, { status, priority, search, page = 1, page_size = 20 } = {}) {
    page = parseInt(page) || 1;
    page_size = parseInt(page_size) || 20;
    const where = { orgId, assigneeId: userId, deletedAt: null };
    if (priority) where.priority = priority;
    if (search)   where.title    = { contains: search, mode: 'insensitive' };

    if (status === 'overdue')   { where.dueDate = { lt: new Date() }; where.completedAt = null; }
    else if (status === 'done') { where.completedAt = { not: null }; }
    else if (status === 'open') { where.completedAt = null; }

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        include: TASK_INCLUDE,
        orderBy: [{ dueDate: 'asc' }, { priority: 'asc' }],
        skip: (page - 1) * page_size,
        take: page_size,
      }),
    ]);

    return {
      items: tasks.map((t) => ({
        ...formatTask(t),
        project: { id: t.projectId, name: t.project?.name, key: t.project?.key, color: t.project?.color },
      })),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  async getById(orgId, taskId) {
    const t = await prisma.task.findFirst({
      where: { id: taskId, orgId, deletedAt: null },
      include: TASK_INCLUDE,
    });
    if (!t) throw ApiError.notFound('Task not found');
    return t;
  }

  async create(orgId, projectId, userId, data) {
    const agg = await prisma.task.aggregate({ where: { projectId }, _max: { seqNumber: true } });
    const seqNumber = (agg._max.seqNumber ?? 0) + 1;

    const countInStatus = await prisma.task.count({ where: { projectId, statusId: data.status_id, deletedAt: null } });
    const position = (countInStatus + 1) * 10;

    const t = await prisma.task.create({
      data: {
        orgId,
        projectId,
        seqNumber,
        title: data.title,
        description: data.description || null,
        statusId: data.status_id || 'backlog',
        statusName: data.status_name || 'Backlog',
        priority: data.priority || 'medium',
        assigneeId: data.assignee_id || null,
        reporterId: userId,
        dueDate: data.due_date ? new Date(data.due_date) : null,
        startDate: data.start_date ? new Date(data.start_date) : null,
        estimatedHours: data.estimated_hours || null,
        tags: data.tags || [],
        customFields: data.custom_fields || {},
        milestoneId: data.milestone_id || null,
        parentTaskId: data.parent_task_id || null,
        position,
        createdBy: userId,
      },
      include: TASK_INCLUDE,
    });
    return formatTask(t);
  }

  async update(orgId, taskId, data) {
    await this.getById(orgId, taskId);
    const t = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title            !== undefined && { title: data.title }),
        ...(data.description      !== undefined && { description: data.description }),
        ...(data.priority         !== undefined && { priority: data.priority }),
        ...(data.assignee_id      !== undefined && { assigneeId: data.assignee_id }),
        ...(data.due_date         !== undefined && { dueDate: data.due_date ? new Date(data.due_date) : null }),
        ...(data.start_date       !== undefined && { startDate: data.start_date ? new Date(data.start_date) : null }),
        ...(data.estimated_hours  !== undefined && { estimatedHours: data.estimated_hours }),
        ...(data.tags             !== undefined && { tags: data.tags }),
        ...(data.custom_fields    !== undefined && { customFields: data.custom_fields }),
        ...(data.status_id        !== undefined && { statusId: data.status_id, statusName: data.status_name || null }),
        ...(data.status_id        === undefined && data.status_name !== undefined && { statusName: data.status_name }),
        ...(data.completed_at     !== undefined && { completedAt: data.completed_at ? new Date(data.completed_at) : null }),
        ...(data.depends_on_id    !== undefined && { dependsOnId: data.depends_on_id }),
        ...(data.blocked_reason   !== undefined && { blockedReason: data.blocked_reason }),
        ...(data.milestone_id     !== undefined && { milestoneId: data.milestone_id }),
      },
      include: TASK_INCLUDE,
    });
    return formatTask(t);
  }

  async moveTask(orgId, taskId, { status_id, status_name, position }) {
    const existing = await this.getById(orgId, taskId);
    const isFinal = status_name?.toLowerCase() === 'done' || status_name?.toLowerCase() === 'accepted';
    const wasCompleted = !!existing.completedAt;

    const t = await prisma.task.update({
      where: { id: taskId },
      data: {
        statusId: status_id,
        statusName: status_name,
        position,
        completedAt: isFinal && !wasCompleted ? new Date() : (!isFinal && wasCompleted ? null : undefined),
      },
      include: TASK_INCLUDE,
    });
    return formatTask(t);
  }

  async delete(orgId, taskId) {
    await this.getById(orgId, taskId);
    await prisma.task.update({ where: { id: taskId }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  async listAllForProject(orgId, projectId) {
    const tasks = await prisma.task.findMany({
      where: { orgId, projectId, deletedAt: null, isArchived: false },
      include: TASK_INCLUDE,
      orderBy: { position: 'asc' },
    });
    return tasks.map(formatTask);
  }

  formatTask(t) { return formatTask(t); }
}

module.exports = new TaskService();
