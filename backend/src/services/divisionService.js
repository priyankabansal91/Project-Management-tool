const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class DivisionService {
  /**
   * Create a division
   */
  async create(orgId, userId, data) {
    const { name, description, code, parent_id, manager_id, budget, head_count } = data;

    // Validate code uniqueness
    const existing = await prisma.division.findFirst({
      where: { orgId, code, deletedAt: null },
    });

    if (existing) throw ApiError.badRequest(`Division code "${code}" already exists`);

    // Validate parent division exists if provided
    if (parent_id) {
      const parent = await prisma.division.findFirst({
        where: { id: parent_id, orgId, deletedAt: null },
      });
      if (!parent) throw ApiError.notFound('Parent division not found');
    }

    const division = await prisma.division.create({
      data: {
        orgId,
        name,
        description,
        code,
        parentId: parent_id,
        managerId: manager_id,
        budget: budget ? parseFloat(budget) : null,
        headCount: head_count,
        createdBy: userId,
      },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        parent: { select: { id: true, name: true, code: true } },
      },
    });

    return this._formatDivision(division);
  }

  /**
   * Get division by ID
   */
  async getById(orgId, divisionId) {
    const division = await prisma.division.findFirst({
      where: { id: divisionId, orgId, deletedAt: null },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        parent: { select: { id: true, name: true, code: true } },
        children: { select: { id: true, name: true, code: true } },
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
        projects: { select: { id: true, name: true, key: true } },
      },
    });

    if (!division) throw ApiError.notFound('Division not found');
    return this._formatDivision(division);
  }

  /**
   * List divisions with hierarchy
   */
  async list(orgId, { search, parent_id, page = 1, page_size = 20 } = {}) {
    const where = {
      orgId,
      deletedAt: null,
      ...(parent_id ? { parentId: parent_id } : { parentId: null }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    };

    const [items, total] = await Promise.all([
      prisma.division.findMany({
        where,
        include: {
          manager: { select: { id: true, firstName: true, lastName: true, email: true } },
          children: { select: { id: true, name: true, code: true } },
          _count: { select: { members: true, projects: true } },
        },
        orderBy: { displayOrder: 'asc' },
        skip: (page - 1) * page_size,
        take: page_size,
      }),
      prisma.division.count({ where }),
    ]);

    return {
      items: items.map((d) => this._formatDivision(d)),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  /**
   * Update division
   */
  async update(orgId, divisionId, data) {
    const division = await prisma.division.findFirst({
      where: { id: divisionId, orgId, deletedAt: null },
    });

    if (!division) throw ApiError.notFound('Division not found');

    const updated = await prisma.division.update({
      where: { id: divisionId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.manager_id !== undefined && { managerId: data.manager_id }),
        ...(data.budget !== undefined && { budget: data.budget ? parseFloat(data.budget) : null }),
        ...(data.head_count !== undefined && { headCount: data.head_count }),
        ...(data.settings && { settings: data.settings }),
      },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        parent: { select: { id: true, name: true, code: true } },
      },
    });

    return this._formatDivision(updated);
  }

  /**
   * Delete division
   */
  async delete(orgId, divisionId) {
    const division = await prisma.division.findFirst({
      where: { id: divisionId, orgId, deletedAt: null },
    });

    if (!division) throw ApiError.notFound('Division not found');

    // Check if division has children
    const childCount = await prisma.division.count({
      where: { parentId: divisionId, deletedAt: null },
    });

    if (childCount > 0) {
      throw ApiError.badRequest('Cannot delete division with child divisions');
    }

    return prisma.division.update({
      where: { id: divisionId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Add member to division
   */
  async addMember(orgId, divisionId, userId, role) {
    const division = await prisma.division.findFirst({
      where: { id: divisionId, orgId, deletedAt: null },
    });

    if (!division) throw ApiError.notFound('Division not found');

    const member = await prisma.divisionMember.create({
      data: {
        divisionId,
        userId,
        role,
      },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    return member;
  }

  /**
   * Remove member from division
   */
  async removeMember(orgId, divisionId, userId) {
    const member = await prisma.divisionMember.findFirst({
      where: { divisionId, userId },
    });

    if (!member) throw ApiError.notFound('Member not found in division');

    await prisma.divisionMember.delete({
      where: { id: member.id },
    });

    return { success: true };
  }

  /**
   * Get division hierarchy tree
   */
  async getHierarchy(orgId) {
    const divisions = await prisma.division.findMany({
      where: { orgId, deletedAt: null },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { members: true, projects: true } },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return this._buildHierarchyTree(divisions);
  }

  /**
   * Build hierarchy tree from flat list
   */
  _buildHierarchyTree(divisions) {
    const map = {};
    const roots = [];

    // Create map
    divisions.forEach((d) => {
      map[d.id] = { ...this._formatDivision(d), children: [] };
    });

    // Build tree
    divisions.forEach((d) => {
      if (d.parentId && map[d.parentId]) {
        map[d.parentId].children.push(map[d.id]);
      } else {
        roots.push(map[d.id]);
      }
    });

    return roots;
  }

  /**
   * Format division for response
   */
  _formatDivision(division) {
    return {
      id: division.id,
      name: division.name,
      description: division.description,
      code: division.code,
      icon: division.icon,
      color: division.color,
      parent_id: division.parentId,
      manager: division.manager,
      budget: division.budget,
      head_count: division.headCount,
      is_active: division.isActive,
      display_order: division.displayOrder,
      settings: division.settings,
      member_count: division._count?.members,
      project_count: division._count?.projects,
      children: division.children,
      created_at: division.createdAt,
      updated_at: division.updatedAt,
    };
  }
}

module.exports = new DivisionService();
