const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class ExternalUserService {
  /**
   * Invite external user
   */
  async invite(orgId, userId, data) {
    const { email, firstName, lastName, accessLevel, expiresAt, permissions } = data;

    // Check if already invited
    const existing = await prisma.externalUser.findFirst({
      where: { orgId, email },
    });

    if (existing) throw ApiError.badRequest('User already invited');

    const externalUser = await prisma.externalUser.create({
      data: {
        orgId,
        email,
        firstName,
        lastName,
        accessLevel: accessLevel || 'viewer',
        permissions: JSON.stringify(permissions || []),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        invitedBy: userId,
      },
    });

    return this._formatExternalUser(externalUser);
  }

  /**
   * Get external user by ID
   */
  async getById(orgId, externalUserId) {
    const user = await prisma.externalUser.findFirst({
      where: { id: externalUserId, orgId },
      include: {
        guestAccess: true,
      },
    });

    if (!user) throw ApiError.notFound('External user not found');
    return this._formatExternalUser(user);
  }

  /**
   * List external users
   */
  async list(orgId, { search, accessLevel, page = 1, page_size = 20 } = {}) {
    const where = {
      orgId,
      ...(search && { email: { contains: search, mode: 'insensitive' } }),
      ...(accessLevel && { accessLevel }),
    };

    const [items, total] = await Promise.all([
      prisma.externalUser.findMany({
        where,
        include: { _count: { select: { guestAccess: true } } },
        orderBy: { invitedAt: 'desc' },
        skip: (page - 1) * page_size,
        take: page_size,
      }),
      prisma.externalUser.count({ where }),
    ]);

    return {
      items: items.map((u) => this._formatExternalUser(u)),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  /**
   * Update external user
   */
  async update(orgId, externalUserId, data) {
    const user = await prisma.externalUser.findFirst({
      where: { id: externalUserId, orgId },
    });

    if (!user) throw ApiError.notFound('External user not found');

    const updated = await prisma.externalUser.update({
      where: { id: externalUserId },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.accessLevel && { accessLevel: data.accessLevel }),
        ...(data.permissions && { permissions: JSON.stringify(data.permissions) }),
        ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return this._formatExternalUser(updated);
  }

  /**
   * Revoke external user access
   */
  async revoke(orgId, externalUserId) {
    const user = await prisma.externalUser.findFirst({
      where: { id: externalUserId, orgId },
    });

    if (!user) throw ApiError.notFound('External user not found');

    const updated = await prisma.externalUser.update({
      where: { id: externalUserId },
      data: { isActive: false },
    });

    return this._formatExternalUser(updated);
  }

  /**
   * Grant access to resource
   */
  async grantAccess(orgId, externalUserId, resourceType, resourceId, accessLevel, userId) {
    const user = await prisma.externalUser.findFirst({
      where: { id: externalUserId, orgId },
    });

    if (!user) throw ApiError.notFound('External user not found');

    const access = await prisma.guestAccess.create({
      data: {
        externalUserId,
        resourceType,
        resourceId,
        accessLevel,
        grantedBy: userId,
      },
    });

    return access;
  }

  /**
   * Revoke resource access
   */
  async revokeAccess(orgId, externalUserId, resourceType, resourceId) {
    const access = await prisma.guestAccess.findFirst({
      where: {
        externalUserId,
        resourceType,
        resourceId,
      },
    });

    if (!access) throw ApiError.notFound('Access not found');

    await prisma.guestAccess.delete({
      where: { id: access.id },
    });

    return { success: true };
  }

  /**
   * Get user's resource access
   */
  async getUserAccess(externalUserId) {
    const access = await prisma.guestAccess.findMany({
      where: { externalUserId },
      orderBy: { grantedAt: 'desc' },
    });

    return access;
  }

  /**
   * Check if external user has access to resource
   */
  async hasAccess(externalUserId, resourceType, resourceId) {
    const access = await prisma.guestAccess.findFirst({
      where: {
        externalUserId,
        resourceType,
        resourceId,
      },
    });

    if (!access) return false;

    // Check if access has expired
    if (access.expiresAt && access.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Format external user for response
   */
  _formatExternalUser(user) {
    return {
      id: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      avatar_url: user.avatarUrl,
      access_level: user.accessLevel,
      permissions: JSON.parse(user.permissions || '[]'),
      expires_at: user.expiresAt,
      is_active: user.isActive,
      invited_at: user.invitedAt,
      accepted_at: user.acceptedAt,
      last_access_at: user.lastAccessAt,
      resource_count: user._count?.guestAccess,
    };
  }
}

module.exports = new ExternalUserService();
