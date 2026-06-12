'use strict';

// ─── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('../config/prisma', () => ({
  orgMember: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  invitation: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
}));

// Mock logger to silence output in tests
jest.mock('../config/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

// Mock email service so no real email is sent
jest.mock('../services/emailService', () => ({
  sendInviteEmail: jest.fn().mockResolvedValue(undefined),
}));

// ─── Setup ───────────────────────────────────────────────────────────────────

const prisma = require('../config/prisma');
const { sendInviteEmail } = require('../services/emailService');
const memberService = require('../services/memberService');

beforeEach(() => jest.clearAllMocks());

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeUser(overrides = {}) {
  return {
    id: 'u1',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    avatarUrl: null,
    status: 'active',
    lastLoginAt: null,
    ...overrides,
  };
}

function makeOrgMember(overrides = {}) {
  return {
    id: 'om-1',
    orgId: 'org-1',
    userId: 'u1',
    role: 'member',
    isOwner: false,
    joinedAt: new Date('2024-01-01'),
    user: makeUser(),
    ...overrides,
  };
}

// ─── list() ──────────────────────────────────────────────────────────────────

describe('memberService.list()', () => {
  it('returns paginated members with formatted fields', async () => {
    prisma.orgMember.count.mockResolvedValue(1);
    prisma.orgMember.findMany.mockResolvedValue([makeOrgMember()]);

    const result = await memberService.list('org-1');

    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('pagination');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 'u1',
      email: 'jane@example.com',
      first_name: 'Jane',
      last_name: 'Doe',
      role: 'member',
      is_owner: false,
    });
  });

  it('returns empty items when no members exist', async () => {
    prisma.orgMember.count.mockResolvedValue(0);
    prisma.orgMember.findMany.mockResolvedValue([]);

    const result = await memberService.list('org-1');

    expect(result.items).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });

  it('filters by role when role param is provided', async () => {
    prisma.orgMember.count.mockResolvedValue(0);
    prisma.orgMember.findMany.mockResolvedValue([]);

    await memberService.list('org-1', { role: 'org_admin' });

    const countCall = prisma.orgMember.count.mock.calls[0][0];
    expect(countCall.where.role).toBe('org_admin');
  });

  it('applies case-insensitive search across firstName, lastName, email', async () => {
    prisma.orgMember.count.mockResolvedValue(0);
    prisma.orgMember.findMany.mockResolvedValue([]);

    await memberService.list('org-1', { search: 'jane' });

    const countCall = prisma.orgMember.count.mock.calls[0][0];
    expect(countCall.where.user).toHaveProperty('OR');
    const orConditions = countCall.where.user.OR;
    expect(orConditions).toContainEqual(expect.objectContaining({
      firstName: expect.objectContaining({ contains: 'jane', mode: 'insensitive' }),
    }));
  });

  it('paginates correctly with page and page_size', async () => {
    prisma.orgMember.count.mockResolvedValue(50);
    prisma.orgMember.findMany.mockResolvedValue([]);

    const result = await memberService.list('org-1', { page: 2, page_size: 10 });

    const findManyCall = prisma.orgMember.findMany.mock.calls[0][0];
    expect(findManyCall.skip).toBe(10);
    expect(findManyCall.take).toBe(10);
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.total_pages).toBe(5);
  });

  it('caps page_size at 500', async () => {
    prisma.orgMember.count.mockResolvedValue(0);
    prisma.orgMember.findMany.mockResolvedValue([]);

    await memberService.list('org-1', { page_size: 9999 });

    const findManyCall = prisma.orgMember.findMany.mock.calls[0][0];
    expect(findManyCall.take).toBe(500);
  });
});

// ─── invite() ────────────────────────────────────────────────────────────────

describe('memberService.invite()', () => {
  function setupInviteMocks() {
    prisma.orgMember.findFirst.mockResolvedValue(null);    // not already a member
    prisma.invitation.findFirst.mockResolvedValue(null);  // no pending invite
    prisma.invitation.create.mockResolvedValue({
      id: 'inv-1',
      email: 'invitee@example.com',
      role: 'member',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    prisma.user.findUnique.mockResolvedValue(makeUser({ firstName: 'Admin', lastName: 'User' }));
  }

  it('creates invitation and returns invite details', async () => {
    setupInviteMocks();

    const result = await memberService.invite('org-1', 'u1', {
      email: 'invitee@example.com',
      role: 'member',
    });

    expect(result).toHaveProperty('id', 'inv-1');
    expect(result).toHaveProperty('email', 'invitee@example.com');
    expect(result).toHaveProperty('role', 'member');
    expect(result).toHaveProperty('invite_link');
    expect(result).toHaveProperty('expires_at');
  });

  it('calls sendInviteEmail with correct parameters', async () => {
    setupInviteMocks();

    await memberService.invite('org-1', 'u1', {
      email: 'invitee@example.com',
      role: 'member',
    });

    expect(sendInviteEmail).toHaveBeenCalledTimes(1);
    const emailArgs = sendInviteEmail.mock.calls[0][0];
    expect(emailArgs.to).toBe('invitee@example.com');
    expect(emailArgs.role).toBe('member');
    expect(emailArgs.inviteLink).toContain('/invite?token=');
  });

  it('throws 400 when user with that email is already a member', async () => {
    prisma.orgMember.findFirst.mockResolvedValue(makeOrgMember());

    await expect(
      memberService.invite('org-1', 'u1', { email: 'jane@example.com', role: 'member' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 when a pending invitation already exists for the email', async () => {
    prisma.orgMember.findFirst.mockResolvedValue(null);
    prisma.invitation.findFirst.mockResolvedValue({
      id: 'existing-inv',
      email: 'invitee@example.com',
      acceptedAt: null,
      expiresAt: new Date(Date.now() + 3600000),
    });

    await expect(
      memberService.invite('org-1', 'u1', { email: 'invitee@example.com', role: 'member' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('stores a hashed token, not the raw token', async () => {
    setupInviteMocks();

    await memberService.invite('org-1', 'u1', { email: 'invitee@example.com', role: 'member' });

    const createCall = prisma.invitation.create.mock.calls[0][0];
    // tokenHash should be a hex string (SHA-256 = 64 hex chars)
    expect(createCall.data.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    // The raw token must NOT be stored directly
    expect(createCall.data).not.toHaveProperty('token');
  });
});

// ─── updateRole() ────────────────────────────────────────────────────────────

describe('memberService.updateRole()', () => {
  it('updates the member role and returns formatted member', async () => {
    prisma.orgMember.findFirst.mockResolvedValue(makeOrgMember({ isOwner: false }));
    prisma.orgMember.update.mockResolvedValue(makeOrgMember({ role: 'org_admin' }));

    const result = await memberService.updateRole('org-1', 'u1', 'org_admin');

    expect(result.role).toBe('org_admin');
    expect(prisma.orgMember.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orgId_userId: { orgId: 'org-1', userId: 'u1' } },
        data: { role: 'org_admin' },
      })
    );
  });

  it('throws 404 when member is not found', async () => {
    prisma.orgMember.findFirst.mockResolvedValue(null);

    await expect(memberService.updateRole('org-1', 'ghost', 'member')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 when attempting to change the owner\'s role', async () => {
    prisma.orgMember.findFirst.mockResolvedValue(makeOrgMember({ isOwner: true }));

    await expect(memberService.updateRole('org-1', 'u1', 'member')).rejects.toMatchObject({ statusCode: 400 });
    expect(prisma.orgMember.update).not.toHaveBeenCalled();
  });
});

// ─── updateStatus() ──────────────────────────────────────────────────────────

describe('memberService.updateStatus()', () => {
  it('suspends an active member', async () => {
    const suspendedUser = makeUser({ status: 'suspended' });
    const refreshedMember = makeOrgMember({ user: suspendedUser });

    prisma.orgMember.findFirst.mockResolvedValue(makeOrgMember());
    prisma.user.update.mockResolvedValue(suspendedUser);
    prisma.orgMember.findUnique.mockResolvedValue(refreshedMember);

    const result = await memberService.updateStatus('org-1', 'u1', 'suspended');

    expect(result.status).toBe('suspended');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { status: 'suspended' },
    });
  });

  it('reactivates a suspended member', async () => {
    const activeUser = makeUser({ status: 'active' });
    const refreshedMember = makeOrgMember({ user: activeUser });

    prisma.orgMember.findFirst.mockResolvedValue(makeOrgMember({ user: makeUser({ status: 'suspended' }) }));
    prisma.user.update.mockResolvedValue(activeUser);
    prisma.orgMember.findUnique.mockResolvedValue(refreshedMember);

    const result = await memberService.updateStatus('org-1', 'u1', 'active');

    expect(result.status).toBe('active');
  });

  it('throws 404 when member is not found', async () => {
    prisma.orgMember.findFirst.mockResolvedValue(null);

    await expect(memberService.updateStatus('org-1', 'ghost', 'suspended')).rejects.toMatchObject({ statusCode: 404 });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('queries the refreshed member using orgId_userId composite key', async () => {
    prisma.orgMember.findFirst.mockResolvedValue(makeOrgMember());
    prisma.user.update.mockResolvedValue(makeUser({ status: 'suspended' }));
    prisma.orgMember.findUnique.mockResolvedValue(makeOrgMember({ user: makeUser({ status: 'suspended' }) }));

    await memberService.updateStatus('org-1', 'u1', 'suspended');

    expect(prisma.orgMember.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orgId_userId: { orgId: 'org-1', userId: 'u1' } },
      })
    );
  });
});
