const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

function fmtUser(u) {
  if (!u) return null;
  return { id: u.id, name: `${u.firstName} ${u.lastName}`, email: u.email };
}

function fmtDivision(d) {
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    code: d.code,
    icon: d.icon,
    color: d.color,
    parent_id: d.parentId || null,
    manager: fmtUser(d.manager),
    budget: d.budget ? Number(d.budget) : null,
    head_count: d.headCount,
    is_active: d.isActive,
    display_order: d.displayOrder,
    settings: d.settings,
    member_count: d._count?.members ?? 0,
    project_count: d._count?.projects ?? 0,
    children: (d.children || []).map((c) => ({ id: c.id, name: c.name, code: c.code })),
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  };
}

const DIV_INCLUDE = {
  manager: { select: { id: true, firstName: true, lastName: true, email: true } },
  children: { where: { deletedAt: null }, select: { id: true, name: true, code: true } },
  _count: { select: { members: true, projects: { where: { deletedAt: null } } } },
};

class DivisionService {
  async list(orgId) {
    const divs = await prisma.division.findMany({
      where: { orgId, deletedAt: null },
      include: DIV_INCLUDE,
      orderBy: { displayOrder: 'asc' },
    });
    return divs.map(fmtDivision);
  }

  async getById(orgId, divisionId) {
    const d = await prisma.division.findFirst({
      where: { id: divisionId, orgId, deletedAt: null },
      include: DIV_INCLUDE,
    });
    if (!d) throw ApiError.notFound('Division not found');
    return fmtDivision(d);
  }

  async create(orgId, userId, data) {
    const { name, description, code, parent_id, manager_id, budget, head_count, color, icon } = data;

    const codeConflict = await prisma.division.findFirst({ where: { orgId, code, deletedAt: null } });
    if (codeConflict) throw ApiError.badRequest(`Division code "${code}" is already in use`);

    const count = await prisma.division.count({ where: { orgId, deletedAt: null } });
    const d = await prisma.division.create({
      data: {
        orgId, name, description: description || null, code, color: color || '#3B82F6',
        icon: icon || null, parentId: parent_id || null, managerId: manager_id || null,
        budget: budget || null, headCount: head_count || null, displayOrder: count + 1,
        createdBy: userId, isActive: true,
      },
      include: DIV_INCLUDE,
    });
    return fmtDivision(d);
  }

  async update(orgId, divisionId, data) {
    await this.getById(orgId, divisionId);
    const d = await prisma.division.update({
      where: { id: divisionId },
      data: {
        ...(data.name        !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.color       !== undefined && { color: data.color }),
        ...(data.icon        !== undefined && { icon: data.icon }),
        ...(data.manager_id  !== undefined && { managerId: data.manager_id }),
        ...(data.budget      !== undefined && { budget: data.budget }),
        ...(data.head_count  !== undefined && { headCount: data.head_count }),
        ...(data.is_active   !== undefined && { isActive: data.is_active }),
      },
      include: DIV_INCLUDE,
    });
    return fmtDivision(d);
  }

  async delete(orgId, divisionId) {
    await this.getById(orgId, divisionId);
    const hasProjects = await prisma.project.count({ where: { divisionId, deletedAt: null } });
    if (hasProjects) throw ApiError.badRequest('Cannot delete a division with active projects');
    await prisma.division.update({ where: { id: divisionId }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  async listMembers(orgId, divisionId) {
    await this.getById(orgId, divisionId);
    const members = await prisma.divisionMember.findMany({
      where: { divisionId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return members.map((m) => ({
      id: m.user.id,
      name: `${m.user.firstName} ${m.user.lastName}`,
      email: m.user.email,
      avatar_url: m.user.avatarUrl || null,
      role: m.role,
      added_at: m.createdAt,
    }));
  }

  async addMember(orgId, divisionId, userId, role = 'member') {
    await this.getById(orgId, divisionId);
    await prisma.divisionMember.upsert({
      where: { divisionId_userId: { divisionId, userId } },
      update: { role },
      create: { divisionId, userId, role },
    });
    return { success: true };
  }

  async removeMember(orgId, divisionId, userId) {
    await this.getById(orgId, divisionId);
    const m = await prisma.divisionMember.findUnique({ where: { divisionId_userId: { divisionId, userId } } });
    if (!m) throw ApiError.notFound('Member not in this division');
    await prisma.divisionMember.delete({ where: { divisionId_userId: { divisionId, userId } } });
    return { success: true };
  }

  async getHierarchy(orgId, userId, role) {
    let where = { orgId, deletedAt: null };

    if (role === 'division_admin') {
      const myDivs = await prisma.divisionMember.findMany({
        where: { userId },
        select: { divisionId: true },
      });
      const ids = myDivs.map((m) => m.divisionId);
      where = { id: { in: ids }, orgId, deletedAt: null };
    }

    const all = await prisma.division.findMany({
      where,
      include: DIV_INCLUDE,
      orderBy: { displayOrder: 'asc' },
    });
    const map = Object.fromEntries(all.map((d) => [d.id, { ...fmtDivision(d), children: [] }]));
    const roots = [];
    all.forEach((d) => {
      if (d.parentId && map[d.parentId]) map[d.parentId].children.push(map[d.id]);
      else roots.push(map[d.id]);
    });
    return roots;
  }
}

module.exports = new DivisionService();
