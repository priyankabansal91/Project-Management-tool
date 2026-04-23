const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const { sendInviteEmail } = require('./emailService');

const membersStore = new Map();
const invitesStore = new Map(); // pending invites

// Seed dev org members
const seedMembers = [
  { id: 'dev-org_admin-id',       orgId: 'dev-org-id', email: 'admin@example.local',      firstName: 'Priya',   lastName: 'Sharma',  role: 'org_admin',       isOwner: true,  status: 'active', joinedAt: new Date('2026-01-01'), lastLoginAt: new Date('2026-04-22') },
  { id: 'dev-division_admin-id',  orgId: 'dev-org-id', email: 'div-admin@example.local',  firstName: 'Vikram',  lastName: 'Mehta',   role: 'division_admin',  isOwner: false, status: 'active', joinedAt: new Date('2026-01-05'), lastLoginAt: new Date('2026-04-20') },
  { id: 'dev-project_manager-id', orgId: 'dev-org-id', email: 'pm@example.local',         firstName: 'Anjali',  lastName: 'Singh',   role: 'project_manager', isOwner: false, status: 'active', joinedAt: new Date('2026-01-10'), lastLoginAt: new Date('2026-04-21') },
  { id: 'dev-member-id',          orgId: 'dev-org-id', email: 'member@example.local',     firstName: 'Ravi',    lastName: 'Kumar',   role: 'member',          isOwner: false, status: 'active', joinedAt: new Date('2026-01-15'), lastLoginAt: new Date('2026-04-22') },
  { id: 'dev-executive-id',       orgId: 'dev-org-id', email: 'executive@example.local',  firstName: 'Sunita',  lastName: 'Reddy',   role: 'executive',       isOwner: false, status: 'active', joinedAt: new Date('2026-01-20'), lastLoginAt: new Date('2026-04-18') },
  { id: 'dev-viewer-id',          orgId: 'dev-org-id', email: 'viewer@example.local',     firstName: 'Arjun',   lastName: 'Patel',   role: 'viewer',          isOwner: false, status: 'active', joinedAt: new Date('2026-02-01'), lastLoginAt: null },
];

seedMembers.forEach((m) => membersStore.set(`${m.orgId}:${m.id}`, m));

function formatMember(m) {
  return {
    id: m.id,
    email: m.email,
    first_name: m.firstName,
    last_name: m.lastName,
    avatar_url: m.avatarUrl || null,
    role: m.role,
    is_owner: m.isOwner,
    status: m.status,
    joined_at: m.joinedAt,
    last_login_at: m.lastLoginAt || null,
  };
}

class MemberService {
  list(orgId, { role, search, page = 1, page_size = 20 } = {}) {
    let items = [...membersStore.values()].filter((m) => m.orgId === orgId);

    if (role) items = items.filter((m) => m.role === role);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((m) =>
        `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(q)
      );
    }

    items.sort((a, b) => a.joinedAt - b.joinedAt);
    const total = items.length;
    const paged = items.slice((page - 1) * page_size, page * page_size);

    return {
      items: paged.map(formatMember),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  async invite(orgId, invitedBy, { email, role }) {
    // Check if already a member
    const existing = [...membersStore.values()].find(
      (m) => m.orgId === orgId && m.email.toLowerCase() === email.toLowerCase()
    );
    if (existing) throw ApiError.badRequest('User with this email is already a member');

    // Check if already invited
    const alreadyInvited = [...invitesStore.values()].find(
      (i) => i.orgId === orgId && i.email.toLowerCase() === email.toLowerCase() && !i.acceptedAt
    );
    if (alreadyInvited) throw ApiError.badRequest('An invitation has already been sent to this email');

    const inviteToken = require('crypto').randomBytes(24).toString('hex');
    const invite = {
      id: `inv_${Date.now()}`,
      orgId,
      email,
      role: role || 'member',
      invitedBy,
      token: inviteToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      acceptedAt: null,
    };
    invitesStore.set(invite.id, invite);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/accept-invite?token=${inviteToken}`;

    // Send real email (falls back to console log if SMTP not configured)
    const inviterName = DEV_USERS[invitedBy]?.name || 'An admin';
    await sendInviteEmail({
      to: email,
      inviterName,
      role: invite.role,
      inviteLink,
      orgName: 'Quality Council of India',
      expiresAt: invite.expiresAt,
    }).catch((err) => logger.error(`[EMAIL ERROR] ${err.message}`));

    return {
      id: invite.id,
      email,
      role: invite.role,
      expires_at: invite.expiresAt,
      invite_link: inviteLink,
    };
  }

  listInvites(orgId) {
    return [...invitesStore.values()]
      .filter((i) => i.orgId === orgId && !i.acceptedAt)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        invited_by: DEV_USERS[i.invitedBy]?.name || 'Admin',
        expires_at: i.expiresAt,
        created_at: i.createdAt,
      }));
  }

  cancelInvite(orgId, inviteId) {
    const invite = invitesStore.get(inviteId);
    if (!invite || invite.orgId !== orgId) throw ApiError.notFound('Invite not found');
    invitesStore.delete(inviteId);
    return { success: true };
  }

  updateRole(orgId, userId, role) {
    const key = `${orgId}:${userId}`;
    const member = membersStore.get(key);
    if (!member) throw ApiError.notFound('Member not found');
    if (member.isOwner) throw ApiError.badRequest('Cannot change role of organization owner');

    member.role = role;
    membersStore.set(key, member);
    return formatMember(member);
  }

  updateStatus(orgId, userId, status) {
    const key = `${orgId}:${userId}`;
    const member = membersStore.get(key);
    if (!member) throw ApiError.notFound('Member not found');

    member.status = status;
    membersStore.set(key, member);
    return formatMember(member);
  }

  remove(orgId, requesterId, userId) {
    if (requesterId === userId) throw ApiError.badRequest('Cannot remove yourself');
    const key = `${orgId}:${userId}`;
    const member = membersStore.get(key);
    if (!member) throw ApiError.notFound('Member not found');
    if (member.isOwner) throw ApiError.badRequest('Cannot remove the organization owner');
    membersStore.delete(key);
    return { success: true };
  }
}

module.exports = new MemberService();
