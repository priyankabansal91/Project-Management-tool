// ─── Outlook / Microsoft 365 Integration Routes ─────────
const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const graphClient = require('../../services/outlook/graphClient');
const microsoftSSO = require('../../services/outlook/microsoftSSO');
const calendarSync = require('../../services/outlook/calendarSync');
const emailService = require('../../services/outlook/emailService');
const prisma = require('../../config/prisma');
const config = require('../../config');
const logger = require('../../config/logger');

const router = Router();

// ─── Microsoft SSO (Public) ─────────────────────────────

/**
 * GET /integrations/outlook/login
 * Redirect to Microsoft login page
 */
router.get('/login', (req, res) => {
  const url = microsoftSSO.getLoginUrl('login');
  res.redirect(url);
});

/**
 * GET /integrations/outlook/callback
 * OAuth2 callback from Microsoft
 */
router.get('/callback', async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      logger.error('Microsoft OAuth error', { error, description: req.query.error_description });
      return res.redirect(`${config.frontendUrl}/login?error=microsoft_auth_failed`);
    }

    if (!code) {
      return res.redirect(`${config.frontendUrl}/login?error=no_code`);
    }

    const result = await microsoftSSO.handleCallback(code, state);

    // Decode state to determine mode
    let stateData = {};
    if (state) {
      try {
        stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
      } catch {}
    }

    if (stateData.mode === 'connect') {
      // Redirect back to settings page
      return res.redirect(`${config.frontendUrl}/settings/integrations?connected=microsoft`);
    }

    // Login/register mode — redirect with token
    const params = new URLSearchParams({
      token: result.access_token,
      new_user: result.is_new_user ? '1' : '0',
    });

    res.redirect(`${config.frontendUrl}/auth/microsoft-callback?${params.toString()}`);
  } catch (err) {
    logger.error('Microsoft callback error', { error: err.message });
    res.redirect(`${config.frontendUrl}/login?error=auth_failed`);
  }
});

// ─── Connect/Disconnect (Authenticated) ─────────────────

/**
 * GET /integrations/outlook/connect
 * Start OAuth flow to connect Microsoft account to existing user
 */
router.get('/connect', authenticate, (req, res) => {
  const url = microsoftSSO.getLoginUrl('connect', req.user.id);
  res.json({ success: true, data: { auth_url: url } });
});

/**
 * POST /integrations/outlook/disconnect
 * Disconnect Microsoft account
 */
router.post('/disconnect', authenticate, async (req, res, next) => {
  try {
    await microsoftSSO.disconnect(req.user.id);
    res.json({ success: true, data: { message: 'Microsoft account disconnected' } });
  } catch (err) {
    next(err);
  }
});

// ─── Integration Status ─────────────────────────────────

/**
 * GET /integrations/outlook/status
 * Check if user has connected Microsoft account
 */
router.get('/status', authenticate, async (req, res, next) => {
  try {
    const integration = await prisma.userIntegration.findFirst({
      where: { userId: req.user.id, provider: 'microsoft', revokedAt: null },
    });

    if (!integration) {
      return res.json({
        success: true,
        data: { connected: false, settings: null },
      });
    }

    res.json({
      success: true,
      data: {
        connected: true,
        microsoft_email: integration.providerEmail,
        connected_at: integration.connectedAt,
        settings: integration.settings,
        synced_events: Object.keys(integration.calendarMapping || {}).length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Settings ───────────────────────────────────────────

/**
 * PATCH /integrations/outlook/settings
 * Update Outlook integration settings
 */
router.patch('/settings', authenticate, async (req, res, next) => {
  try {
    const { email_notifications, sync_calendar, ai_email_summaries } = req.body;

    const integration = await prisma.userIntegration.findFirst({
      where: { userId: req.user.id, provider: 'microsoft', revokedAt: null },
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Microsoft account not connected' },
      });
    }

    const currentSettings = integration.settings || {};
    const updatedSettings = {
      ...currentSettings,
      ...(email_notifications !== undefined && { email_notifications }),
      ...(sync_calendar !== undefined && { sync_calendar }),
      ...(ai_email_summaries !== undefined && { ai_email_summaries }),
    };

    await prisma.userIntegration.update({
      where: { id: integration.id },
      data: { settings: updatedSettings },
    });

    res.json({ success: true, data: { settings: updatedSettings } });
  } catch (err) {
    next(err);
  }
});

// ─── Calendar Sync ──────────────────────────────────────

/**
 * POST /integrations/outlook/sync-calendar
 * Bulk sync all task due dates to Outlook calendar
 */
router.post('/sync-calendar', authenticate, async (req, res, next) => {
  try {
    const result = await calendarSync.bulkSyncTasks(req.user.id, req.user.orgId);
    res.json({
      success: true,
      data: {
        message: `Synced ${result.synced} of ${result.total} tasks to Outlook calendar`,
        ...result,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Email Test ─────────────────────────────────────────

/**
 * POST /integrations/outlook/test-email
 * Send a test email via Outlook
 */
router.post('/test-email', authenticate, async (req, res, next) => {
  try {
    const accessToken = await graphClient.getValidToken(req.user.id);
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: { code: 'NOT_CONNECTED', message: 'Microsoft account not connected or token expired' },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { email: true, firstName: true },
    });

    await graphClient.sendEmail(accessToken, {
      to: user.email,
      subject: '[ProjectFlow] Test Email — Integration Working!',
      body: emailService.wrapInEmailTemplate(
        `<p>Hi ${user.firstName},</p>
        <p>This is a test email from ProjectFlow. Your Outlook integration is working correctly!</p>
        <p>You will now receive:</p>
        <ul>
          <li>Task assignment notifications</li>
          <li>Due date reminders</li>
          <li>Comment notifications</li>
          <li>AI-generated project summaries</li>
        </ul>`,
        'Test Email'
      ),
      isHtml: true,
    });

    res.json({ success: true, data: { message: `Test email sent to ${user.email}` } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
