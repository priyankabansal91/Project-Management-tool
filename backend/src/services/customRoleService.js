const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

// Available permissions that can be assigned
const AVAILABLE_PERMISSIONS = {
  // Project permissions
  'project:create': 'Create projects',
  'project:read': 'View projects',
  'project:update': 'Edit projects',
  'project:delete': 'Delete projects',
  'project:manage_members': 'Manage project members',

  // Task permissions
  'task:create': 'Create tasks',
  'task:read': 'View tasks',
  'task:update': 'Edit tasks',
  'task:delete': 'Delete tasks',
  'task:assign': 'Assign tasks',
  'task:comment': 'Comment on tasks',

  // Workflow permissions
  'workflow:create': 'Create workflows',
  'workflow:read': 'View workflows',
  'workflow:update': 'Edit workflows',
  'workflow:delete': 'Delete workflows',

  // Approval permissions
  'approval:create': 'Create approvals',
  'approval:approve': 'Approve requests',
  'approval:reject': 'Reject requests',

  // Division permissions
  'division:create': 'Create divisions',
  'division:read': 'View divisions',
  'division:update': 'Edit divisions',
  'division:delete': 'Delete divisions',
  'division:manage_members': 'Manage division members',

  // Admin permissions
  'admin:manage_roles': 'Manage custom roles',
  'admin:manage_users': 'Manage users',
  'admin:manage_settings': 'Manage organization settings',
  'admin:view_audit': 'View audit logs',
};

const PERMISSION_CATEGORIES = [
  { key: 'project', label: 'Projects', permissions: ['project:create','project:read','project:update','project:delete','project:manage_members'] },
  { key: 'task', label: 'Tasks', permissions: ['task:create','task:read','task:update','task:delete','task:assign','task:comment'] },
  { key: 'workflow', label: 'Workflows', permissions: ['workflow:create','workflow:read','workflow:update','workflow:delete'] },
  { key: 'approval', label: 'Approvals', permissions: ['approval:create','approval:approve','approval:reject'] },
  { key: 'division', label: 'Divisions', permissions: ['division:create','division:read','division:update','division:delete','division:manage_members'] },
  { key: 'admin', label: 'Administration', permissions: ['admin:manage_roles','admin:manage_users','admin:manage_settings','admin:view_audit'] },
];

const SYSTEM_ROLE_PERMISSIONS = {
  org_admin: Object.keys(AVAILABLE_PERMISSIONS),
  division_admin: [
    'project:create','project:read','project:update','project:delete','project:manage_members',
    'task:create','task:read','task:update','task:delete','task:assign','task:comment',
    'workflow:create','workflow:read','workflow:update',
    'approval:create','approval:approve','approval:reject',
    'division:read','division:update','division:manage_members',
    'admin:view_audit',
  ],
  project_manager: [
    'project:create','project:read','project:update','project:manage_members',
    'task:create','task:read','task:update','task:delete','task:assign','task:comment',
    'workflow:create','workflow:read','workflow:update',
    'approval:create','approval:approve','approval:reject',
    'division:read',
    'admin:view_audit',
  ],
  member: [
    'project:read',
    'task:create','task:read','task:update','task:comment',
    'workflow:read',
    'approval:create',
    'division:read',
  ],
  viewer: [
    'project:read',
    'task:read',
    'workflow:read',
    'division:read',
  ],
  executive: [
    'project:read',
    'task:read',
    'workflow:read',
    'division:read',
    'admin:view_audit',
  ],
};

class CustomRoleService {
  /**
   * Create a custom role
   */
  async create(orgId, userId, data) {
    const { name, description, permissions, color } = data;

    // Validate permissions
    this._validatePermissions(permissions);

    // Check name uniqueness
    const existing = await prisma.customRole.findFirst({
      where: { orgId, name, isSystem: false },
    });

    if (existing) throw ApiError.badRequest(`Role "${name}" already exists`);

    const role = await prisma.customRole.create({
      data: {
        orgId,
        name,
        description,
        color,
        permissions: JSON.stringify(permissions),
        createdBy: userId,
      },
    });

    return this._formatRole(role);
  }

  /**
   * Get role by ID
   */
  async getById(orgId, roleId) {
    const role = await prisma.customRole.findFirst({
      where: { id: roleId, orgId },
      include: {
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
      },
    });

    if (!role) throw ApiError.notFound('Role not found');
    return this._formatRole(role);
  }

  /**
   * List roles
   */
  async list(orgId, { search, page = 1, page_size = 20 } = {}) {
    page = parseInt(page) || 1;
    page_size = parseInt(page_size) || 20;
    const where = {
      orgId,
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    };

    const [items, total] = await Promise.all([
      prisma.customRole.findMany({
        where,
        include: { _count: { select: { members: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * page_size,
        take: page_size,
      }),
      prisma.customRole.count({ where }),
    ]);

    return {
      items: items.map((r) => this._formatRole(r)),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  /**
   * Update role
   */
  async update(orgId, roleId, data) {
    const role = await prisma.customRole.findFirst({
      where: { id: roleId, orgId },
    });

    if (!role) throw ApiError.notFound('Role not found');
    if (role.isSystem) throw ApiError.badRequest('Cannot modify system roles');

    if (data.permissions) {
      this._validatePermissions(data.permissions);
    }

    const updated = await prisma.customRole.update({
      where: { id: roleId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.color && { color: data.color }),
        ...(data.permissions && { permissions: JSON.stringify(data.permissions) }),
      },
    });

    return this._formatRole(updated);
  }

  /**
   * Delete role
   */
  async delete(orgId, roleId) {
    const role = await prisma.customRole.findFirst({
      where: { id: roleId, orgId },
    });

    if (!role) throw ApiError.notFound('Role not found');
    if (role.isSystem) throw ApiError.badRequest('Cannot delete system roles');

    // Check if role has members
    const memberCount = await prisma.customRoleMember.count({
      where: { roleId },
    });

    if (memberCount > 0) {
      throw ApiError.badRequest('Cannot delete role with assigned members');
    }

    await prisma.customRole.delete({
      where: { id: roleId },
    });

    return { success: true };
  }

  /**
   * Assign role to user
   */
  async assignToUser(orgId, roleId, userId, scope = 'org', scopeId = null) {
    const role = await prisma.customRole.findFirst({
      where: { id: roleId, orgId },
    });

    if (!role) throw ApiError.notFound('Role not found');

    const member = await prisma.customRoleMember.create({
      data: {
        roleId,
        userId,
        scope,
        scopeId,
        assignedBy: userId,
      },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    return member;
  }

  /**
   * Remove role from user
   */
  async removeFromUser(orgId, roleId, userId) {
    const member = await prisma.customRoleMember.findFirst({
      where: { roleId, userId },
    });

    if (!member) throw ApiError.notFound('User does not have this role');

    await prisma.customRoleMember.delete({
      where: { id: member.id },
    });

    return { success: true };
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(orgId, userId) {
    const roles = await prisma.customRoleMember.findMany({
      where: { userId },
      include: { role: true },
    });

    const permissions = new Set();

    roles.forEach((rm) => {
      const rolePerms = JSON.parse(rm.role.permissions || '[]');
      rolePerms.forEach((p) => permissions.add(p));
    });

    return Array.from(permissions);
  }

  /**
   * Check if user has permission
   */
  async hasPermission(orgId, userId, permission) {
    const permissions = await this.getUserPermissions(orgId, userId);
    return permissions.includes(permission);
  }

  /**
   * Get available permissions
   */
  getAvailablePermissions() {
    return Object.entries(AVAILABLE_PERMISSIONS).map(([key, description]) => ({
      id: key,
      name: description,
    }));
  }

  /**
   * Get system role permissions matrix
   */
  getSystemRoleMatrix() {
    return {
      roles: ['org_admin', 'division_admin', 'project_manager', 'member', 'viewer', 'executive'],
      permissions: SYSTEM_ROLE_PERMISSIONS,
      categories: PERMISSION_CATEGORIES,
    };
  }

  /**
   * Update system role permissions (in-memory for this session)
   */
  updateSystemRolePermissions(role, permissions) {
    if (!SYSTEM_ROLE_PERMISSIONS[role]) {
      throw ApiError.badRequest(`Invalid system role: ${role}`);
    }
    this._validatePermissions(permissions);
    SYSTEM_ROLE_PERMISSIONS[role] = permissions;
    return this.getSystemRoleMatrix();
  }

  /**
   * List org members with their system roles
   */
  async listMembersWithRoles(orgId) {
    try {
      const members = await prisma.orgMember.findMany({
        where: { orgId },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, status: true } } },
        orderBy: { createdAt: 'asc' },
      });
      return members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        email: m.user.email,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        status: m.user.status,
        joinedAt: m.createdAt,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Update a member's system role
   */
  async updateMemberRole(orgId, userId, role) {
    const validRoles = ['org_admin', 'division_admin', 'project_manager', 'member', 'viewer', 'executive'];
    if (!validRoles.includes(role)) throw ApiError.badRequest(`Invalid role: ${role}`);
    try {
      const member = await prisma.orgMember.update({
        where: { orgId_userId: { orgId, userId } },
        data: { role },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      });
      return { userId: member.userId, role: member.role, email: member.user.email };
    } catch {
      return { userId, role };
    }
  }

  /**
   * Validate permissions
   */
  _validatePermissions(permissions) {
    if (!Array.isArray(permissions)) {
      throw ApiError.badRequest('Permissions must be an array');
    }

    const validPerms = Object.keys(AVAILABLE_PERMISSIONS);
    const invalid = permissions.filter((p) => !validPerms.includes(p));

    if (invalid.length > 0) {
      throw ApiError.badRequest(`Invalid permissions: ${invalid.join(', ')}`);
    }
  }

  /**
   * Format role for response
   */
  _formatRole(role) {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      color: role.color,
      permissions: JSON.parse(role.permissions || '[]'),
      is_system: role.isSystem,
      member_count: role._count?.members,
      created_at: role.createdAt,
      updated_at: role.updatedAt,
    };
  }
}

module.exports = new CustomRoleService();
