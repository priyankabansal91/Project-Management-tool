'use strict';

// ─── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('../config/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  organization: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  orgMember: {
    create: jest.fn(),
    findFirst: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  },
  workflowConfig: {
    create: jest.fn(),
    findFirst: jest.fn(),
  },
  invitation: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_access_token'),
  verify: jest.fn(),
}));

jest.mock('../config', () => ({
  jwt: { secret: 'test-secret', expiresIn: '15m' },
}));

// ─── Setup ───────────────────────────────────────────────────────────────────

const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');

beforeEach(() => jest.clearAllMocks());

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeUser(overrides = {}) {
  return {
    id: 'u1',
    email: 'test@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    passwordHash: 'hashed_password',
    avatarUrl: null,
    status: 'active',
    lockedUntil: null,
    failedLoginCount: 0,
    orgMembers: [],
    ...overrides,
  };
}

function makeOrg(overrides = {}) {
  return {
    id: 'org-1',
    name: 'Test Org',
    slug: 'test-org',
    plan: 'free',
    ...overrides,
  };
}

function makeOrgMember(overrides = {}) {
  return {
    id: 'om-1',
    orgId: 'org-1',
    userId: 'u1',
    role: 'org_admin',
    isOwner: true,
    joinedAt: new Date('2024-01-01'),
    organization: makeOrg(),
    user: {
      id: 'u1',
      email: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      avatarUrl: null,
      status: 'active',
      lastLoginAt: null,
    },
    ...overrides,
  };
}

// ─── register() ──────────────────────────────────────────────────────────────

describe('authService.register()', () => {
  function setupRegisterMocks({ orgExists = false } = {}) {
    const user = makeUser({ status: 'pending_verification' });
    const org = makeOrg();

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.organization.findUnique.mockResolvedValue(orgExists ? makeOrg() : null);

    prisma.$transaction.mockImplementation(async (fn) =>
      fn({
        user: { create: jest.fn().mockResolvedValue(user) },
        organization: { create: jest.fn().mockResolvedValue(org) },
        orgMember: { create: jest.fn().mockResolvedValue({ role: 'org_admin' }) },
        workflowConfig: { create: jest.fn().mockResolvedValue({ id: 'wf-1' }) },
      })
    );

    prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });
    return { user, org };
  }

  it('creates user + org inside a transaction and returns tokens', async () => {
    setupRegisterMocks();

    const result = await authService.register({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'test@example.com',
      password: 'Pass1234!',
      org_name: 'Test Org',
      org_slug: 'test-org',
    });

    expect(result).toHaveProperty('access_token');
    expect(result).toHaveProperty('refresh_token');
    expect(result.token_type).toBe('Bearer');
    expect(result.expires_in).toBe(900);
    expect(result.user).toHaveProperty('email', 'test@example.com');
    expect(result.organization).toHaveProperty('name', 'Test Org');
  });

  it('hashes the password with bcrypt before storing', async () => {
    setupRegisterMocks();

    await authService.register({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'test@example.com',
      password: 'Pass1234!',
      org_name: 'Test Org',
      org_slug: 'test-org',
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('Pass1234!', 12);
  });

  it('throws 409 when email is already registered', async () => {
    prisma.user.findUnique.mockResolvedValue(makeUser());
    prisma.organization.findUnique.mockResolvedValue(null);

    await expect(
      authService.register({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'taken@example.com',
        password: 'Pass1234!',
        org_name: 'Test Org',
        org_slug: 'test-org',
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('throws 409 when org slug is already taken', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.organization.findUnique.mockResolvedValue(makeOrg());

    await expect(
      authService.register({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'new@example.com',
        password: 'Pass1234!',
        org_name: 'Test Org',
        org_slug: 'taken-slug',
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('generates and persists a refresh token', async () => {
    setupRegisterMocks();

    await authService.register({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'test@example.com',
      password: 'Pass1234!',
      org_name: 'Test Org',
      org_slug: 'test-org',
    });

    expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
    const call = prisma.refreshToken.create.mock.calls[0][0];
    expect(call.data).toHaveProperty('tokenHash');
    expect(call.data).toHaveProperty('expiresAt');
  });
});

// ─── login() ─────────────────────────────────────────────────────────────────

describe('authService.login()', () => {
  function makeLoginUser(overrides = {}) {
    return makeUser({
      orgMembers: [makeOrgMember()],
      ...overrides,
    });
  }

  it('returns tokens and user info on valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(makeLoginUser());
    prisma.user.update.mockResolvedValue({});
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });
    bcrypt.compare.mockResolvedValue(true);

    const result = await authService.login({ email: 'test@example.com', password: 'Pass1234!' });

    expect(result).toHaveProperty('access_token');
    expect(result).toHaveProperty('refresh_token');
    expect(result.user).toHaveProperty('email', 'test@example.com');
    expect(Array.isArray(result.organizations)).toBe(true);
  });

  it('throws 401 when user is not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'nobody@example.com', password: 'Pass1234!' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 when account status is not active', async () => {
    prisma.user.findUnique.mockResolvedValue(makeLoginUser({ status: 'suspended' }));

    await expect(
      authService.login({ email: 'test@example.com', password: 'Pass1234!' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 on wrong password and increments failedLoginCount', async () => {
    prisma.user.findUnique.mockResolvedValue(makeLoginUser({ failedLoginCount: 0 }));
    prisma.user.update.mockResolvedValue({});
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.login({ email: 'test@example.com', password: 'wrong' })
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ failedLoginCount: { increment: 1 } }),
      })
    );
  });

  it('throws 401 when account is temporarily locked', async () => {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000);
    prisma.user.findUnique.mockResolvedValue(makeLoginUser({ lockedUntil: futureDate }));

    await expect(
      authService.login({ email: 'test@example.com', password: 'Pass1234!' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 when user has no org membership', async () => {
    prisma.user.findUnique.mockResolvedValue(makeLoginUser({ orgMembers: [] }));
    prisma.user.update.mockResolvedValue({});
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });
    bcrypt.compare.mockResolvedValue(true);

    await expect(
      authService.login({ email: 'test@example.com', password: 'Pass1234!' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('resets failedLoginCount to 0 on successful login', async () => {
    prisma.user.findUnique.mockResolvedValue(makeLoginUser({ failedLoginCount: 2 }));
    prisma.user.update.mockResolvedValue({});
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });
    bcrypt.compare.mockResolvedValue(true);

    await authService.login({ email: 'test@example.com', password: 'Pass1234!' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ failedLoginCount: 0, lockedUntil: null }),
      })
    );
  });
});

// ─── refreshAccessToken() ────────────────────────────────────────────────────

describe('authService.refreshAccessToken()', () => {
  const rawToken = 'a'.repeat(128);

  it('returns a new access_token when refresh token is valid', async () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId: 'u1',
      orgId: 'org-1',
      revokedAt: null,
      expiresAt: futureDate,
    });
    prisma.user.findUnique.mockResolvedValue(makeUser());
    prisma.orgMember.findFirst.mockResolvedValue(makeOrgMember());

    const result = await authService.refreshAccessToken(rawToken);

    expect(result).toHaveProperty('access_token');
    expect(result.expires_in).toBe(900);
  });

  it('throws 401 when the refresh token is not found', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(null);

    await expect(authService.refreshAccessToken(rawToken)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 when the refresh token has been revoked', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId: 'u1',
      orgId: 'org-1',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
    });

    await expect(authService.refreshAccessToken(rawToken)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 when the refresh token is expired', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId: 'u1',
      orgId: 'org-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1000), // already expired
    });

    await expect(authService.refreshAccessToken(rawToken)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 when user or membership cannot be found', async () => {
    const futureDate = new Date(Date.now() + 3600000);
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId: 'u1',
      orgId: 'org-1',
      revokedAt: null,
      expiresAt: futureDate,
    });
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.orgMember.findFirst.mockResolvedValue(null);

    await expect(authService.refreshAccessToken(rawToken)).rejects.toMatchObject({ statusCode: 401 });
  });
});

// ─── logout() ────────────────────────────────────────────────────────────────

describe('authService.logout()', () => {
  it('revokes all active refresh tokens for the user', async () => {
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

    await authService.logout('u1');

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('completes without error even when no tokens exist', async () => {
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(authService.logout('u-no-tokens')).resolves.toBeUndefined();
  });
});

// ─── acceptInvite() ──────────────────────────────────────────────────────────

describe('authService.acceptInvite()', () => {
  function makeInvite(overrides = {}) {
    return {
      id: 'inv-1',
      email: 'invitee@example.com',
      orgId: 'org-1',
      role: 'member',
      tokenHash: 'some-hash',
      acceptedAt: null,
      expiresAt: new Date(Date.now() + 3600000),
      organization: makeOrg(),
      ...overrides,
    };
  }

  it('throws 400 on invalid or expired token', async () => {
    prisma.invitation.findFirst.mockResolvedValue(null);

    await expect(
      authService.acceptInvite({ token: 'invalid', first_name: 'John', last_name: 'Smith', password: 'Pass1234!' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('creates new user + orgMember when user does not already exist', async () => {
    prisma.invitation.findFirst.mockResolvedValue(makeInvite());
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(makeUser({ email: 'invitee@example.com', status: 'active' }));
    prisma.orgMember.create.mockResolvedValue(makeOrgMember({ role: 'member' }));
    prisma.invitation.update.mockResolvedValue({});
    prisma.orgMember.findFirst.mockResolvedValue(makeOrgMember({ role: 'member' }));
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

    const result = await authService.acceptInvite({
      token: 'valid-raw-token',
      first_name: 'John',
      last_name: 'Smith',
      password: 'Pass1234!',
    });

    expect(result).toHaveProperty('access_token');
    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    expect(prisma.orgMember.create).toHaveBeenCalledTimes(1);
  });

  it('re-uses existing user and adds to org when user already registered', async () => {
    const existingUser = makeUser({ email: 'invitee@example.com' });
    prisma.invitation.findFirst.mockResolvedValue(makeInvite());
    prisma.user.findUnique.mockResolvedValue(existingUser);
    prisma.orgMember.findFirst
      .mockResolvedValueOnce(null)               // check for existing membership → not a member yet
      .mockResolvedValueOnce(makeOrgMember());    // final membership lookup
    prisma.orgMember.create.mockResolvedValue(makeOrgMember({ role: 'member' }));
    prisma.invitation.update.mockResolvedValue({});
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

    const result = await authService.acceptInvite({
      token: 'valid-raw-token',
      first_name: 'John',
      last_name: 'Smith',
      password: 'Pass1234!',
    });

    expect(result).toHaveProperty('access_token');
    // Should NOT create a new user record
    expect(prisma.user.create).not.toHaveBeenCalled();
    // Should add org membership
    expect(prisma.orgMember.create).toHaveBeenCalledTimes(1);
  });

  it('marks the invitation as accepted', async () => {
    prisma.invitation.findFirst.mockResolvedValue(makeInvite());
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(makeUser({ email: 'invitee@example.com', status: 'active' }));
    prisma.orgMember.create.mockResolvedValue(makeOrgMember({ role: 'member' }));
    prisma.invitation.update.mockResolvedValue({});
    prisma.orgMember.findFirst.mockResolvedValue(makeOrgMember({ role: 'member' }));
    prisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

    await authService.acceptInvite({
      token: 'valid-raw-token',
      first_name: 'John',
      last_name: 'Smith',
      password: 'Pass1234!',
    });

    expect(prisma.invitation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ acceptedAt: expect.any(Date) }) })
    );
  });
});
