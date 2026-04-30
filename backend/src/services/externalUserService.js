const ApiError = require('../utils/ApiError');

// In-memory storage for development (until database is set up)
const externalUsersStore = new Map();
const guestAccessStore = new Map();

class ExternalUserService {
  /**
   * Invite external user
   */
  async invite(orgId, userId, data) {
    const { email, firstName, lastName, accessLevel, expiresAt, permissions } = data;

    // Check if already invited
    const existing = Array.from(externalUsersStore.values()).find(u => u.orgId === orgId && u.email === email);
    if (existing) throw ApiError.badRequest('User already invited');

    const externalUserId = `ext_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const externalUser = {
      id: externalUserId,
      orgId,
      email,
      firstName,
      lastName,
      avatarUrl: null,
      accessLevel: accessLevel || 'viewer',
      permissions: permissions || [],
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      invitedBy: userId,
      invitedAt: new Date(),
      acceptedAt: null,
      lastAccessAt: null,
      isActive: true,
    };

    externalUsersStore.set(externalUserId, externalUser);
    return this._formatExternalUser(externalUser);
  }

  /**
   * Get external user by ID
   */
  async getById(orgId, externalUserId) {
    const user = externalUsersStore.get(externalUserId);

    if (!user || user.orgId !== orgId) {
      throw ApiError.notFound('External user not found');
    }

    return this._formatExternalUser(user);
  }

  /**
   * List external users
   */
  async list(orgId, { search, accessLevel, page = 1, page_size = 20 } = {}) {
    page = parseInt(page) || 1;
    page_size = parseInt(page_size) || 20;
    let items = Array.from(externalUsersStore.values())
      .filter(u => u.orgId === orgId);

    if (search) {
      items = items.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));
    }

    if (accessLevel) {
      items = items.filter(u => u.accessLevel === accessLevel);
    }

    items.sort((a, b) => b.invitedAt - a.invitedAt);

    const total = items.length;
    const paginatedItems = items.slice((page - 1) * page_size, page * page_size);

    return {
      items: paginatedItems.map((u) => this._formatExternalUser(u)),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  /**
   * Update external user
   */
  async update(orgId, externalUserId, data) {
    const user = externalUsersStore.get(externalUserId);

    if (!user || user.orgId !== orgId) {
      throw ApiError.notFound('External user not found');
    }

    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName) user.lastName = data.lastName;
    if (data.accessLevel) user.accessLevel = data.accessLevel;
    if (data.permissions) user.permissions = data.permissions;
    if (data.expiresAt !== undefined) user.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    if (data.isActive !== undefined) user.isActive = data.isActive;

    externalUsersStore.set(externalUserId, user);
    return this._formatExternalUser(user);
  }

  /**
   * Revoke external user access
   */
  async revoke(orgId, externalUserId) {
    const user = externalUsersStore.get(externalUserId);

    if (!user || user.orgId !== orgId) {
      throw ApiError.notFound('External user not found');
    }

    user.isActive = false;
    externalUsersStore.set(externalUserId, user);
    return this._formatExternalUser(user);
  }

  /**
   * Grant access to resource
   */
  async grantAccess(orgId, externalUserId, resourceType, resourceId, accessLevel, userId) {
    const user = externalUsersStore.get(externalUserId);

    if (!user || user.orgId !== orgId) {
      throw ApiError.notFound('External user not found');
    }

    const accessId = `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const access = {
      id: accessId,
      externalUserId,
      resourceType,
      resourceId,
      accessLevel,
      grantedBy: userId,
      grantedAt: new Date(),
      expiresAt: null,
    };

    guestAccessStore.set(accessId, access);
    return access;
  }

  /**
   * Revoke resource access
   */
  async revokeAccess(orgId, externalUserId, resourceType, resourceId) {
    const access = Array.from(guestAccessStore.values()).find(a =>
      a.externalUserId === externalUserId && a.resourceType === resourceType && a.resourceId === resourceId
    );

    if (!access) throw ApiError.notFound('Access not found');

    guestAccessStore.delete(access.id);
    return { success: true };
  }

  /**
   * Get user's resource access
   */
  async getUserAccess(externalUserId) {
    const access = Array.from(guestAccessStore.values())
      .filter(a => a.externalUserId === externalUserId)
      .sort((a, b) => b.grantedAt - a.grantedAt);

    return access;
  }

  /**
   * Check if external user has access to resource
   */
  async hasAccess(externalUserId, resourceType, resourceId) {
    const access = Array.from(guestAccessStore.values()).find(a =>
      a.externalUserId === externalUserId && a.resourceType === resourceType && a.resourceId === resourceId
    );

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
    const resourceCount = Array.from(guestAccessStore.values()).filter(a => a.externalUserId === user.id).length;

    return {
      id: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      avatar_url: user.avatarUrl,
      access_level: user.accessLevel,
      permissions: user.permissions || [],
      expires_at: user.expiresAt,
      is_active: user.isActive,
      invited_at: user.invitedAt,
      accepted_at: user.acceptedAt,
      last_access_at: user.lastAccessAt,
      resource_count: resourceCount,
    };
  }
}

module.exports = new ExternalUserService();
