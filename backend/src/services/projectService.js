const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class ProjectService {
  async list(orgId, { status, search, page = 1, page_size = 20 }) {
    const where = { orgId, deletedAt: null };
    if (status) where.status = status;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } },
          _count: { select: { tasks: { where: { deletedAt: null } } } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * page_size,
        take: page_size,
      }),
      prisma.project.count({ where }),
    ]);

    return {
      items: items.map((p) => ({
        id: p.id,
        name: p.name,
        key: p.key,
        description: p.description,
        status: p.status,
        visibility: p.visibility,
        color: p.color,
        owner_id: p.ownerId,
        start_date: p.startDate,
        due_date: p.dueDate,
        member_count: p.members.length,
        task_count: p._count.tasks,
        members: p.members.map((m) => ({
          id: m.user.id,
          name: `${m.user.firstName} ${m.user.lastName}`,
          avatar_url: m.user.avatarUrl,
          role: m.role,
        })),
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      })),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  async getById(orgId, projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, orgId, deletedAt: null },
      include: {
        workflowConfig: true,
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true } } } },
        _count: { select: { tasks: { where: { deletedAt: null } } } },
      },
    });

    if (!project) throw ApiError.notFound('Project not found');
    return project;
  }

  async create(orgId, userId, data) {
    const orgProjects = await prisma.project.count({ where: { orgId, deletedAt: null } });
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (orgProjects >= org.maxProjects) {
      throw ApiError.badRequest(`Project limit (${org.maxProjects}) reached for your plan`);
    }

    let workflowConfigId = data.workflow_config_id;
    if (!workflowConfigId) {
      const defaultWf = await prisma.workflowConfig.findFirst({ where: { orgId, isDefault: true } });
      workflowConfigId = defaultWf?.id;
    }

    const project = await prisma.project.create({
      data: {
        orgId,
        name: data.name,
        description: data.description,
        key: data.key,
        visibility: data.visibility || 'private',
        color: data.color || '#3B82F6',
        workflowConfigId,
        ownerId: userId,
        startDate: data.start_date ? new Date(data.start_date) : null,
        dueDate: data.due_date ? new Date(data.due_date) : null,
        createdBy: userId,
      },
    });

    await prisma.projectMember.create({
      data: { projectId: project.id, userId, role: 'project_manager', addedBy: userId },
    });

    return project;
  }

  async update(orgId, projectId, data) {
    const project = await prisma.project.findFirst({ where: { id: projectId, orgId, deletedAt: null } });
    if (!project) throw ApiError.notFound('Project not found');

    return prisma.project.update({
      where: { id: projectId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status && { status: data.status }),
        ...(data.visibility && { visibility: data.visibility }),
        ...(data.color && { color: data.color }),
        ...(data.due_date !== undefined && { dueDate: data.due_date ? new Date(data.due_date) : null }),
      },
    });
  }

  async delete(orgId, projectId) {
    const project = await prisma.project.findFirst({ where: { id: projectId, orgId, deletedAt: null } });
    if (!project) throw ApiError.notFound('Project not found');

    return prisma.project.update({
      where: { id: projectId },
      data: { deletedAt: new Date() },
    });
  }
}

module.exports = new ProjectService();
