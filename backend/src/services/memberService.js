const crypto = require('crypto');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const { sendInviteEmail } = require('./emailService');

function fmtMember(om) {
  const u = om.user;
  return {
    id: u.id,
    email: u.email,
    first_name: u.firstName,
    last_name: u.lastName,
    avatar_url: u.avatarUrl || null,
    role: om.role,
    is_owner: om.isOwner,
    status: u.status,
    joined_at: om.joinedAt,
    last_login_at: u.lastLoginAt || null,
  };
}

class MemberService {
  async list(orgId, { role, search, page = 1, page_size = 20 } = {}) {
    page = parseInt(page) || 1;
    page_size = parseInt(page_size) || 20;
    const where = { orgId };
    if (role) where.role = role;
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName:  { contains: search, mode: 'insensitive' } },
          { email:     { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [total, items] = await Promise.all([
      prisma.orgMember.count({ where }),
      prisma.orgMember.findMany({
        where,
        include: { user: true },
        orderBy: { joinedAt: 'asc' },
        skip: (page - 1) * page_size,
        take: page_size,
      }),
    ]);

    return {
      items: items.map(fmtMember),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  async invite(orgId, invitedBy, { email, role }) {
    const existingMember = await prisma.orgMember.findFirst({
      where: { orgId, user: { email: { equals: email, mode: 'insensitive' } } },
    });
    if (existingMember) throw ApiError.badRequest('User with this email is already a member');

    const existingInvite = await prisma.invitation.findFirst({
      where: { orgId, email: { equals: email, mode: 'insensitive' }, acceptedAt: null, expiresAt: { gt: new Date() } },
    });
    if (existingInvite) throw ApiError.badRequest('An invitation has already been sent to this email');

    const rawToken  = crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await prisma.invitation.create({
      data: { orgId, email, role: role || 'member', tokenHash, invitedBy, expiresAt },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink  = `${frontendUrl}/accept-invite?token=${rawToken}`;

    const inviter = await prisma.user.findUnique({ where: { id: invitedBy }, select: { firstName: true, lastName: true } });
    const inviterName = inviter ? `${inviter.firstName} ${inviter.lastName}` : 'An admin';

    await sendInviteEmail({ to: email, inviterName, role: invite.role, inviteLink, orgName: 'Quality Council of India', expiresAt })
      .catch((err) => logger.error(`[EMAIL ERROR] ${err.message}`));

    return { id: invite.id, email, role: invite.role, expires_at: expiresAt, invite_link: inviteLink };
  }

  async listInvites(orgId) {
    const invites = await prisma.invitation.findMany({
      where: { orgId, acceptedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    const inviterIds = [...new Set(invites.map((i) => i.invitedBy))];
    const inviters   = await prisma.user.findMany({ where: { id: { in: inviterIds } }, select: { id: true, firstName: true, lastName: true } });
    const inviterMap = Object.fromEntries(inviters.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));

    return invites.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      invited_by: inviterMap[i.invitedBy] || 'Admin',
      expires_at: i.expiresAt,
      created_at: i.createdAt,
    }));
  }

  async cancelInvite(orgId, inviteId) {
    const invite = await prisma.invitation.findFirst({ where: { id: inviteId, orgId } });
    if (!invite) throw ApiError.notFound('Invite not found');
    await prisma.invitation.delete({ where: { id: inviteId } });
    return { success: true };
  }

  async updateRole(orgId, userId, role) {
    const member = await prisma.orgMember.findFirst({ where: { orgId, userId }, include: { user: true } });
    if (!member) throw ApiError.notFound('Member not found');
    if (member.isOwner) throw ApiError.badRequest('Cannot change role of organization owner');

    const updated = await prisma.orgMember.update({
      where: { orgId_userId: { orgId, userId } },
      data: { role },
      include: { user: true },
    });
    return fmtMember(updated);
  }

  async updateStatus(orgId, userId, status) {
    const member = await prisma.orgMember.findFirst({ where: { orgId, userId }, include: { user: true } });
    if (!member) throw ApiError.notFound('Member not found');

    await prisma.user.update({ where: { id: userId }, data: { status } });
    const refreshed = await prisma.orgMember.findUnique({ where: { orgId_userId: { orgId, userId } }, include: { user: true } });
    return fmtMember(refreshed);
  }

  async remove(orgId, requesterId, userId) {
    if (requesterId === userId) throw ApiError.badRequest('Cannot remove yourself');
    const member = await prisma.orgMember.findFirst({ where: { orgId, userId }, include: { user: true } });
    if (!member) throw ApiError.notFound('Member not found');
    if (member.isOwner) throw ApiError.badRequest('Cannot remove the organization owner');
    await prisma.orgMember.delete({ where: { orgId_userId: { orgId, userId } } });
    return { success: true };
  }
}

module.exports = new MemberService();
