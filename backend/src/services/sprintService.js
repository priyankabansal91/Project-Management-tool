const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

const TASK_INCLUDE = {
  project: { select: { key: true, name: true, color: true } },
  assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
  reporter: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
  _count: { select: { comments: { where: { deletedAt: null } }, subtasks: true } },
};

function fmtUser(u) {
  if (!u) return null;
  return { id: u.id, name: `${u.firstName} ${u.lastName}`, avatar_url: u.avatarUrl || null };
}

function fmtTask(t) {
  return {
    id: t.id,
    seq_number: t.seqNumber,
    task_key: `${t.project?.key ?? '?'}-${t.seqNumber}`,
    title: t.title,
    description: t.description,
    status_id: t.statusId,
    status_name: t.statusName,
    priority: t.priority,
    assignee: fmtUser(t.assignee),
    reporter: fmtUser(t.reporter),
    due_date: t.dueDate,
    estimated_hours: t.estimatedHours ? Number(t.estimatedHours) : null,
    logged_hours: Number(t.loggedHours ?? 0),
    sprint_id: t.sprintId,
    completed_at: t.completedAt,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  };
}

function fmtSprint(sprint) {
  const tasks = sprint.tasks || [];
  return {
    id: sprint.id,
    project_id: sprint.projectId,
    name: sprint.name,
    goal: sprint.goal,
    status: sprint.status,
    start_date: sprint.startDate,
    end_date: sprint.endDate,
    tasks: tasks.map(fmtTask),
    task_count: tasks.length,
    completed_tasks: tasks.filter((t) => t.completedAt).length,
    created_at: sprint.createdAt,
    updated_at: sprint.updatedAt,
  };
}

const SPRINT_INCLUDE = {
  tasks: {
    where: { deletedAt: null, isArchived: false },
    include: TASK_INCLUDE,
    orderBy: { position: 'asc' },
  },
};

class SprintService {
  async listByProject(orgId, projectId) {
    const sprints = await prisma.sprint.findMany({
      where: { orgId, projectId },
      include: SPRINT_INCLUDE,
      orderBy: { startDate: 'asc' },
    });
    return sprints.map(fmtSprint);
  }

  async getBacklog(orgId, projectId) {
    const tasks = await prisma.task.findMany({
      where: { orgId, projectId, sprintId: null, deletedAt: null, isArchived: false },
      include: TASK_INCLUDE,
      orderBy: { position: 'asc' },
    });
    return tasks.map(fmtTask);
  }

  async create(orgId, projectId, userId, data) {
    const sprint = await prisma.sprint.create({
      data: {
        orgId,
        projectId,
        name: data.name,
        goal: data.goal || null,
        status: 'planned',
        startDate: data.start_date ? new Date(data.start_date) : null,
        endDate: data.end_date ? new Date(data.end_date) : null,
        createdBy: userId,
      },
      include: SPRINT_INCLUDE,
    });
    return fmtSprint(sprint);
  }

  async update(orgId, sprintId, data) {
    const existing = await prisma.sprint.findFirst({ where: { id: sprintId, orgId } });
    if (!existing) throw ApiError.notFound('Sprint not found');

    if (data.status === 'active') {
      await prisma.sprint.updateMany({
        where: { orgId, projectId: existing.projectId, status: 'active', id: { not: sprintId } },
        data: { status: 'completed' },
      });
    }

    const sprint = await prisma.sprint.update({
      where: { id: sprintId },
      data: {
        ...(data.name       !== undefined && { name: data.name }),
        ...(data.goal       !== undefined && { goal: data.goal }),
        ...(data.status     !== undefined && { status: data.status }),
        ...(data.start_date !== undefined && { startDate: data.start_date ? new Date(data.start_date) : null }),
        ...(data.end_date   !== undefined && { endDate: data.end_date ? new Date(data.end_date) : null }),
      },
      include: SPRINT_INCLUDE,
    });
    return fmtSprint(sprint);
  }

  async delete(orgId, sprintId) {
    const existing = await prisma.sprint.findFirst({ where: { id: sprintId, orgId } });
    if (!existing) throw ApiError.notFound('Sprint not found');
    await prisma.task.updateMany({ where: { sprintId }, data: { sprintId: null } });
    await prisma.sprint.delete({ where: { id: sprintId } });
    return { success: true };
  }

  async addTask(orgId, sprintId, taskId) {
    const sprint = await prisma.sprint.findFirst({ where: { id: sprintId, orgId } });
    if (!sprint) throw ApiError.notFound('Sprint not found');

    const task = await prisma.task.findFirst({ where: { id: taskId, orgId } });
    if (!task) throw ApiError.notFound('Task not found');

    await prisma.task.update({ where: { id: taskId }, data: { sprintId } });

    const updated = await prisma.sprint.findUnique({ where: { id: sprintId }, include: SPRINT_INCLUDE });
    return fmtSprint(updated);
  }

  async removeTask(orgId, sprintId, taskId) {
    const sprint = await prisma.sprint.findFirst({ where: { id: sprintId, orgId } });
    if (!sprint) throw ApiError.notFound('Sprint not found');

    await prisma.task.update({ where: { id: taskId }, data: { sprintId: null } });

    const updated = await prisma.sprint.findUnique({ where: { id: sprintId }, include: SPRINT_INCLUDE });
    return fmtSprint(updated);
  }
}

module.exports = new SprintService();
