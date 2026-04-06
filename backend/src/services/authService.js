const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class AuthService {
  async register({ first_name, last_name, email, password, org_name, org_slug }) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw ApiError.conflict('Email already registered');

    const existingOrg = await prisma.organization.findUnique({ where: { slug: org_slug } });
    if (existingOrg) throw ApiError.conflict('Organization slug already taken');

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          firstName: first_name,
          lastName: last_name,
          passwordHash,
          status: 'active',
          emailVerifiedAt: new Date(),
        },
      });

      const org = await tx.organization.create({
        data: {
          name: org_name,
          slug: org_slug,
          plan: 'free',
          settings: { theme: 'light', timezone: 'UTC', date_format: 'YYYY-MM-DD' },
        },
      });

      await tx.orgMember.create({
        data: { orgId: org.id, userId: user.id, role: 'org_admin', isOwner: true },
      });

      // Create default workflow
      await tx.workflowConfig.create({
        data: {
          orgId: org.id,
          name: 'Default Kanban',
          isDefault: true,
          statuses: JSON.stringify([
            { id: 's1', name: 'Backlog', color: '#6B7280', is_initial: true, is_final: false, order: 1 },
            { id: 's2', name: 'To Do', color: '#3B82F6', is_initial: false, is_final: false, order: 2 },
            { id: 's3', name: 'In Progress', color: '#F59E0B', is_initial: false, is_final: false, order: 3 },
            { id: 's4', name: 'In Review', color: '#8B5CF6', is_initial: false, is_final: false, order: 4 },
            { id: 's5', name: 'Done', color: '#10B981', is_initial: false, is_final: true, order: 5 },
          ]),
          transitions: JSON.stringify([
            { from: 's1', to: ['s2'] },
            { from: 's2', to: ['s3'] },
            { from: 's3', to: ['s2', 's4'] },
            { from: 's4', to: ['s3', 's5'] },
            { from: 's5', to: ['s3'] },
          ]),
          createdBy: user.id,
        },
      });

      return { user, org };
    });

    const accessToken = this.generateAccessToken(result.user, result.org);
    const refreshToken = await this.generateRefreshToken(result.user.id, result.org.id);

    return {
      user: { id: result.user.id, email: result.user.email, first_name: result.user.firstName, last_name: result.user.lastName },
      organization: { id: result.org.id, name: result.org.name, slug: result.org.slug, plan: result.org.plan },
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 900,
      refresh_token: refreshToken,
    };
  }

  async login({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { orgMembers: { include: { organization: true } } },
    });

    if (!user || !user.passwordHash) throw ApiError.unauthorized('Invalid credentials');
    if (user.status !== 'active') throw ApiError.unauthorized('Account is not active');
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw ApiError.unauthorized('Account temporarily locked');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: { increment: 1 },
          ...(user.failedLoginCount >= 4 ? { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) } : {}),
        },
      });
      throw ApiError.unauthorized('Invalid credentials');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const primaryOrg = user.orgMembers[0];
    if (!primaryOrg) throw ApiError.unauthorized('No organization membership');

    const accessToken = this.generateAccessToken(user, primaryOrg.organization, primaryOrg.role);
    const refreshToken = await this.generateRefreshToken(user.id, primaryOrg.orgId);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 900,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        avatar_url: user.avatarUrl,
      },
      organizations: user.orgMembers.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
      })),
    };
  }

  async refreshAccessToken(refreshTokenValue) {
    const hash = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    const membership = await prisma.orgMember.findFirst({
      where: { userId: stored.userId, orgId: stored.orgId },
      include: { organization: true },
    });

    if (!user || !membership) throw ApiError.unauthorized('Invalid session');

    const accessToken = this.generateAccessToken(user, membership.organization, membership.role);
    return { access_token: accessToken, expires_in: 900 };
  }

  async logout(userId) {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  generateAccessToken(user, org, role = 'org_admin') {
    return jwt.sign(
      { sub: user.id, org_id: org.id, role, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  async generateRefreshToken(userId, orgId) {
    const token = crypto.randomBytes(64).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: { userId, tokenHash: hash, orgId, expiresAt },
    });

    return token;
  }
}

module.exports = new AuthService();
