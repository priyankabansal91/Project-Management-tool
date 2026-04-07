// ─── Microsoft SSO Service ───────────────────────────────
// Handles "Login with Microsoft" flow using Azure AD OAuth2.
// Creates or links user accounts based on Microsoft profile.

const graphClient = require('./graphClient');
const prisma = require('../../config/prisma');
const logger = require('../../config/logger');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const crypto = require('crypto');

class MicrosoftSSOService {
  /**
   * Generate the OAuth2 login URL for Microsoft SSO
   * @param {string} mode - 'login' | 'connect' (connect links to existing account)
   * @param {string} userId - required if mode is 'connect'
   */
  getLoginUrl(mode = 'login', userId = null) {
    const state = JSON.stringify({
      mode,
      userId,
      nonce: crypto.randomBytes(16).toString('hex'),
    });

    const encodedState = Buffer.from(state).toString('base64url');
    return graphClient.getAuthUrl(encodedState);
  }

  /**
   * Handle the OAuth2 callback from Microsoft
   * Returns { user, accessToken, isNewUser }
   */
  async handleCallback(code, stateParam) {
    // Exchange code for tokens
    const tokens = await graphClient.exchangeCodeForTokens(code);

    // Get Microsoft profile
    const msProfile = await graphClient.getProfile(tokens.access_token);

    // Decode state
    let state = {};
    if (stateParam) {
      try {
        state = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
      } catch {
        state = {};
      }
    }

    const tokenData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    };

    // MODE: Connect — link Microsoft to existing ProjectFlow account
    if (state.mode === 'connect' && state.userId) {
      return this.connectAccount(state.userId, msProfile, tokenData);
    }

    // MODE: Login — find or create user
    return this.loginOrRegister(msProfile, tokenData);
  }

  /**
   * Login with Microsoft — find existing user or create new one
   */
  async loginOrRegister(msProfile, tokenData) {
    const email = msProfile.mail || msProfile.userPrincipalName;

    // Check if user exists by email
    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;

    if (user) {
      // Existing user — update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date(), avatarUrl: user.avatarUrl || null },
      });
    } else {
      // New user — create account
      isNewUser = true;

      // Extract domain for potential org matching
      const domain = email.split('@')[1];

      // Check if an org exists with this domain
      const existingOrg = await prisma.organization.findFirst({
        where: { domain, isActive: true, deletedAt: null },
      });

      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            firstName: msProfile.givenName || email.split('@')[0],
            lastName: msProfile.surname || '',
            avatarUrl: null,
            status: 'active',
            emailVerifiedAt: new Date(), // Microsoft already verified
          },
        });

        if (existingOrg) {
          // Join existing org as member
          await tx.orgMember.create({
            data: { orgId: existingOrg.id, userId: newUser.id, role: 'member' },
          });
        } else {
          // Create personal org
          const slug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-');
          const org = await tx.organization.create({
            data: {
              name: `${msProfile.givenName || 'My'}'s Workspace`,
              slug: `${slug}-${Date.now().toString(36)}`,
              domain,
              plan: 'free',
            },
          });

          await tx.orgMember.create({
            data: { orgId: org.id, userId: newUser.id, role: 'org_admin', isOwner: true },
          });
        }

        return newUser;
      });
    }

    // Save/update Microsoft integration
    await prisma.userIntegration.upsert({
      where: { userId_provider: { userId: user.id, provider: 'microsoft' } },
      create: {
        userId: user.id,
        provider: 'microsoft',
        providerUserId: msProfile.id,
        providerEmail: email,
        tokenData,
        settings: {
          email_notifications: true,
          sync_calendar: true,
          ai_email_summaries: true,
        },
      },
      update: {
        providerUserId: msProfile.id,
        providerEmail: email,
        tokenData,
        revokedAt: null, // Re-enable if previously revoked
      },
    });

    // Get org membership for JWT
    const membership = await prisma.orgMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    // Generate JWT
    const accessToken = jwt.sign(
      {
        sub: user.id,
        org_id: membership?.orgId,
        role: membership?.role || 'member',
        email: user.email,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    logger.info(`Microsoft SSO ${isNewUser ? 'registration' : 'login'}: ${email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
      },
      organization: membership ? {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        role: membership.role,
      } : null,
      access_token: accessToken,
      is_new_user: isNewUser,
    };
  }

  /**
   * Connect Microsoft account to existing ProjectFlow user
   */
  async connectAccount(userId, msProfile, tokenData) {
    const email = msProfile.mail || msProfile.userPrincipalName;

    await prisma.userIntegration.upsert({
      where: { userId_provider: { userId, provider: 'microsoft' } },
      create: {
        userId,
        provider: 'microsoft',
        providerUserId: msProfile.id,
        providerEmail: email,
        tokenData,
        settings: {
          email_notifications: true,
          sync_calendar: true,
          ai_email_summaries: true,
        },
      },
      update: {
        providerUserId: msProfile.id,
        providerEmail: email,
        tokenData,
        revokedAt: null,
      },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });

    logger.info(`Microsoft account connected for user ${userId}: ${email}`);

    return {
      user: { id: user.id, email: user.email, first_name: user.firstName, last_name: user.lastName },
      connected: true,
      microsoft_email: email,
    };
  }

  /**
   * Disconnect Microsoft account
   */
  async disconnect(userId) {
    await prisma.userIntegration.updateMany({
      where: { userId, provider: 'microsoft' },
      data: { revokedAt: new Date() },
    });

    logger.info(`Microsoft account disconnected for user ${userId}`);
  }
}

module.exports = new MicrosoftSSOService();
