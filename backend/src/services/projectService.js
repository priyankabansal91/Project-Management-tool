const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

function fmt(p) {
  const tasks = p.tasks || [];
  return {
    id: p.id,
    name: p.name,
    key: p.key,
    description: p.description,
    status: p.status,
    phase: p.phase || 'ACTIVE',
    visibility: p.visibility,
    color: p.color,
    owner_id: p.ownerId,
    division_id: p.divisionId || null,
    vertical_id: p.verticalId || null,
    start_date: p.startDate,
    due_date: p.dueDate,
    budget: p.budget ? Number(p.budget) : null,
    member_count: p.members?.length ?? 0,
    task_count: tasks.length,
    completed: tasks.filter((t) => t.completedAt).length,
    members: (p.members || []).map((m) => ({
      id: m.user.id,
      name: `${m.user.firstName} ${m.user.lastName}`,
      avatar_url: m.user.avatarUrl || null,
      role: m.role,
    })),
    workflow_statuses: Array.isArray(p.workflowConfig?.statuses) && p.workflowConfig.statuses.length > 0
      ? p.workflowConfig.statuses
      : null,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

const TASK_INCLUDE = {
  tasks: { where: { deletedAt: null }, select: { id: true, completedAt: true } },
};

const MEMBER_INCLUDE = {
  members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } },
};

const WORKFLOW_INCLUDE = {
  workflowConfig: { select: { statuses: true } },
};

class ProjectService {
  async list(orgId, { status, search, page = 1, page_size = 20 } = {}, divisionScope = {}) {
    page = parseInt(page) || 1;
    page_size = parseInt(page_size) || 20;
    const where = { orgId, deletedAt: null };
    if (status) where.status = status;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const { isScopeAll, divisionId, userDivisions, userVerticals } = divisionScope;
    if (!isScopeAll) {
      if (userVerticals?.length) where.verticalId = { in: userVerticals };
      else if (divisionId) where.divisionId = divisionId;
      else if (userDivisions?.length) where.divisionId = { in: userDivisions };
    }

    const [total, items] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        include: { ...TASK_INCLUDE, ...MEMBER_INCLUDE },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * page_size,
        take: page_size,
      }),
    ]);

    return {
      items: items.map(fmt),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  async getById(orgId, projectId) {
    const p = await prisma.project.findFirst({
      where: { id: projectId, orgId, deletedAt: null },
      include: { ...TASK_INCLUDE, ...MEMBER_INCLUDE, ...WORKFLOW_INCLUDE },
    });
    if (!p) throw ApiError.notFound('Project not found');
    return fmt(p);
  }

  async create(orgId, userId, data) {
    let key = (data.key || data.name.substring(0, 4).toUpperCase().replace(/\s/g, ''))
      .toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);

    // Check active projects for user-facing conflict message
    const activeConflict = await prisma.project.findFirst({ where: { orgId, key, deletedAt: null } });
    if (activeConflict) throw ApiError.badRequest(`Project key "${key}" already in use`);

    // Soft-deleted records still hold the DB unique slot — append suffix when needed
    if (!data.key) {
      const anyConflict = await prisma.project.findFirst({ where: { orgId, key } });
      if (anyConflict) {
        key = (key.substring(0, 4) + (Date.now() % 9999).toString().padStart(4, '0')).substring(0, 6);
      }
    }

    const p = await prisma.project.create({
      data: {
        orgId,
        name: data.name,
        key,
        description: data.description || null,
        divisionId: data.division_id || null,
        verticalId: data.vertical_id || null,
        status: 'active',
        visibility: data.visibility || 'private',
        color: data.color || '#3B82F6',
        ownerId: userId,
        startDate: data.start_date ? new Date(data.start_date) : null,
        dueDate: data.due_date ? new Date(data.due_date) : null,
        createdBy: userId,
        members: { create: { userId, role: 'project_manager' } },
      },
      include: { ...TASK_INCLUDE, ...MEMBER_INCLUDE },
    });
    return fmt(p);
  }

  async update(orgId, projectId, data) {
    await this.getById(orgId, projectId);
    const p = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(data.name         !== undefined && { name: data.name }),
        ...(data.description  !== undefined && { description: data.description }),
        ...(data.status       !== undefined && { status: data.status }),
        ...(data.visibility   !== undefined && { visibility: data.visibility }),
        ...(data.color        !== undefined && { color: data.color }),
        ...(data.due_date     !== undefined && { dueDate: data.due_date ? new Date(data.due_date) : null }),
        ...(data.start_date   !== undefined && { startDate: data.start_date ? new Date(data.start_date) : null }),
        ...(data.division_id  !== undefined && { divisionId: data.division_id || null }),
        ...(data.vertical_id  !== undefined && { verticalId: data.vertical_id || null }),
        ...(data.phase        !== undefined && { phase: data.phase }),
        ...(data.budget       !== undefined && { budget: data.budget ? Number(data.budget) : null }),
      },
      include: { ...TASK_INCLUDE, ...MEMBER_INCLUDE },
    });
    return fmt(p);
  }

  async delete(orgId, projectId) {
    await this.getById(orgId, projectId);
    await prisma.project.update({ where: { id: projectId }, data: { deletedAt: new Date() } });
    return { success: true };
  }
}

module.exports = new ProjectService();
