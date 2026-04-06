const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class TaskService {
  async listByProject(orgId, projectId, { status_id, assignee_id, priority, search, view, page = 1, page_size = 50 }) {
    const where = { orgId, projectId, deletedAt: null, isArchived: false };
    if (status_id) where.statusId = status_id;
    if (assignee_id) where.assigneeId = assignee_id;
    if (priority) where.priority = priority;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          reporter: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { comments: { where: { deletedAt: null } }, subtasks: { where: { deletedAt: null } } } },
        },
        orderBy: view === 'kanban' ? { position: 'asc' } : { createdAt: 'desc' },
        skip: (page - 1) * page_size,
        take: page_size,
      }),
      prisma.task.count({ where }),
    ]);

    const mapped = items.map((t) => this.formatTask(t));

    if (view === 'kanban') {
      const project = await prisma.project.findFirst({
        where: { id: projectId, orgId },
        include: { workflowConfig: true },
      });
      const statuses = project?.workflowConfig?.statuses || [];
      const parsedStatuses = typeof statuses === 'string' ? JSON.parse(statuses) : statuses;

      const columns = parsedStatuses.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        tasks: mapped.filter((t) => t.status_id === s.id),
      }));

      return { columns, pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) } };
    }

    return { items: mapped, pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) } };
  }

  async getMyTasks(orgId, userId, { status, priority, page = 1, page_size = 20 }) {
    const where = { orgId, assigneeId: userId, deletedAt: null };
    if (status === 'overdue') {
      where.dueDate = { lt: new Date() };
      where.completedAt = null;
    } else if (status === 'completed') {
      where.completedAt = { not: null };
    } else if (status === 'open') {
      where.completedAt = null;
    }
    if (priority) where.priority = priority;

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: { select: { id: true, name: true, key: true, color: true } },
          assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          _count: { select: { comments: { where: { deletedAt: null } } } },
        },
        orderBy: { dueDate: 'asc' },
        skip: (page - 1) * page_size,
        take: page_size,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      items: items.map((t) => ({ ...this.formatTask(t), project: t.project })),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  async getById(orgId, taskId) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, orgId, deletedAt: null },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true } },
        reporter: { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, name: true, key: true, color: true } },
        subtasks: { where: { deletedAt: null }, orderBy: { position: 'asc' } },
        comments: {
          where: { deletedAt: null, parentId: null },
          include: {
            author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            replies: {
              where: { deletedAt: null },
              include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { comments: { where: { deletedAt: null } } } },
      },
    });

    if (!task) throw ApiError.notFound('Task not found');
    return task;
  }

  async create(orgId, projectId, userId, data) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, orgId, deletedAt: null },
    });
    if (!project) throw ApiError.notFound('Project not found');

    // Get next sequence number
    const lastTask = await prisma.task.findFirst({
      where: { projectId },
      orderBy: { seqNumber: 'desc' },
    });
    const seqNumber = (lastTask?.seqNumber || 0) + 1;

    // Get max position for ordering
    const lastPosition = await prisma.task.findFirst({
      where: { projectId, statusId: data.status_id, deletedAt: null },
      orderBy: { position: 'desc' },
    });
    const position = (lastPosition?.position?.toNumber() || 0) + 10;

    // Resolve status name from workflow
    let statusName = null;
    if (data.status_id && project.workflowConfigId) {
      const wf = await prisma.workflowConfig.findUnique({ where: { id: project.workflowConfigId } });
      const statuses = typeof wf.statuses === 'string' ? JSON.parse(wf.statuses) : wf.statuses;
      const found = statuses.find((s) => s.id === data.status_id);
      statusName = found?.name || null;
    }

    const task = await prisma.task.create({
      data: {
        orgId,
        projectId,
        seqNumber,
        title: data.title,
        description: data.description || null,
        statusId: data.status_id || null,
        statusName,
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
        createdBy: userId,
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        project: { select: { key: true } },
      },
    });

    return { ...task, task_key: `${task.project.key}-${task.seqNumber}` };
  }

  async update(orgId, taskId, data) {
    const task = await prisma.task.findFirst({ where: { id: taskId, orgId, deletedAt: null } });
    if (!task) throw ApiError.notFound('Task not found');

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.assignee_id !== undefined) updateData.assigneeId = data.assignee_id;
    if (data.due_date !== undefined) updateData.dueDate = data.due_date ? new Date(data.due_date) : null;
    if (data.start_date !== undefined) updateData.startDate = data.start_date ? new Date(data.start_date) : null;
    if (data.estimated_hours !== undefined) updateData.estimatedHours = data.estimated_hours;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.custom_fields !== undefined) updateData.customFields = data.custom_fields;
    if (data.status_id !== undefined) {
      updateData.statusId = data.status_id;
      updateData.statusName = data.status_name || null;
    }

    return prisma.task.update({ where: { id: taskId }, data: updateData });
  }

  async moveTask(orgId, taskId, { status_id, status_name, position }) {
    const task = await prisma.task.findFirst({ where: { id: taskId, orgId, deletedAt: null } });
    if (!task) throw ApiError.notFound('Task not found');

    const isFinal = status_name?.toLowerCase() === 'done' || status_name?.toLowerCase() === 'accepted';

    return prisma.task.update({
      where: { id: taskId },
      data: {
        statusId: status_id,
        statusName: status_name,
        position,
        ...(isFinal ? { completedAt: new Date() } : { completedAt: null }),
      },
    });
  }

  async delete(orgId, taskId) {
    const task = await prisma.task.findFirst({ where: { id: taskId, orgId, deletedAt: null } });
    if (!task) throw ApiError.notFound('Task not found');

    return prisma.task.update({ where: { id: taskId }, data: { deletedAt: new Date() } });
  }

  formatTask(t) {
    return {
      id: t.id,
      seq_number: t.seqNumber,
      task_key: t.project ? `${t.project.key}-${t.seqNumber}` : null,
      title: t.title,
      description: t.description,
      status_id: t.statusId,
      status_name: t.statusName,
      priority: t.priority,
      assignee: t.assignee ? { id: t.assignee.id, name: `${t.assignee.firstName} ${t.assignee.lastName}`, avatar_url: t.assignee.avatarUrl } : null,
      reporter: t.reporter ? { id: t.reporter.id, name: `${t.reporter.firstName} ${t.reporter.lastName}` } : null,
      due_date: t.dueDate,
      start_date: t.startDate,
      estimated_hours: t.estimatedHours ? Number(t.estimatedHours) : null,
      logged_hours: Number(t.loggedHours),
      tags: t.tags,
      custom_fields: t.customFields,
      position: Number(t.position),
      comment_count: t._count?.comments || 0,
      subtask_count: t._count?.subtasks || 0,
      is_archived: t.isArchived,
      completed_at: t.completedAt,
      created_at: t.createdAt,
      updated_at: t.updatedAt,
    };
  }
}

module.exports = new TaskService();
