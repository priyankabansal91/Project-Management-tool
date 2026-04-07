// ─── Microsoft Graph API Client ─────────────────────────
// Handles OAuth2 token management and provides methods for
// interacting with Microsoft Graph API (Outlook mail, calendar, users)
//
// Setup: Register an app in Azure AD Portal:
//   1. Go to https://portal.azure.com → Azure Active Directory → App registrations
//   2. New registration → Set redirect URI to {BACKEND_URL}/v1/integrations/outlook/callback
//   3. API Permissions: Mail.Send, Calendars.ReadWrite, User.Read, offline_access
//   4. Create a client secret
//   5. Set env vars: MS_CLIENT_ID, MS_CLIENT_SECRET, MS_TENANT_ID

const crypto = require('crypto');
const config = require('../../config');
const prisma = require('../../config/prisma');
const logger = require('../../config/logger');

const MS_AUTH_URL = 'https://login.microsoftonline.com';
const MS_GRAPH_URL = 'https://graph.microsoft.com/v1.0';

const SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'User.Read',
  'Mail.Send',
  'Calendars.ReadWrite',
].join(' ');

class MicrosoftGraphClient {
  constructor() {
    this.clientId = process.env.MS_CLIENT_ID || '';
    this.clientSecret = process.env.MS_CLIENT_SECRET || '';
    this.tenantId = process.env.MS_TENANT_ID || 'common'; // 'common' for multi-tenant
    this.redirectUri = `${process.env.BACKEND_URL || 'http://localhost:4000'}/v1/integrations/outlook/callback`;
  }

  // ─── OAuth2 Flow ──────────────────────────────────────

  /**
   * Generate the Microsoft OAuth2 authorization URL
   */
  getAuthUrl(state) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: SCOPES,
      response_mode: 'query',
      state: state,
      prompt: 'consent',
    });

    return `${MS_AUTH_URL}/${this.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access + refresh tokens
   */
  async exchangeCodeForTokens(code) {
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
      scope: SCOPES,
    });

    const response = await fetch(`${MS_AUTH_URL}/${this.tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error('Microsoft token exchange failed', error);
      throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
    }

    return response.json();
  }

  /**
   * Refresh an expired access token
   */
  async refreshAccessToken(refreshToken) {
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: SCOPES,
    });

    const response = await fetch(`${MS_AUTH_URL}/${this.tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh failed: ${error.error_description}`);
    }

    return response.json();
  }

  /**
   * Get a valid access token for a user (auto-refresh if expired)
   */
  async getValidToken(userId) {
    const integration = await prisma.userIntegration.findFirst({
      where: { userId, provider: 'microsoft', revokedAt: null },
    });

    if (!integration) return null;

    // Check if token is expired (with 5-min buffer)
    const tokenData = integration.tokenData;
    const expiresAt = new Date(tokenData.expires_at);

    if (expiresAt <= new Date(Date.now() + 5 * 60 * 1000)) {
      // Refresh the token
      const newTokens = await this.refreshAccessToken(tokenData.refresh_token);
      const updatedData = {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || tokenData.refresh_token,
        expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
      };

      await prisma.userIntegration.update({
        where: { id: integration.id },
        data: { tokenData: updatedData },
      });

      return newTokens.access_token;
    }

    return tokenData.access_token;
  }

  // ─── Graph API Calls ──────────────────────────────────

  /**
   * Make an authenticated request to Microsoft Graph
   */
  async graphRequest(accessToken, method, endpoint, body = null) {
    const options = {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${MS_GRAPH_URL}${endpoint}`, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      logger.error(`Graph API error: ${method} ${endpoint}`, error);
      throw new Error(`Graph API error: ${response.status} - ${error?.error?.message || 'Unknown'}`);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  /**
   * Get the authenticated user's Microsoft profile
   */
  async getProfile(accessToken) {
    return this.graphRequest(accessToken, 'GET', '/me');
  }

  /**
   * Send an email via Outlook
   */
  async sendEmail(accessToken, { to, subject, body, isHtml = true }) {
    const toRecipients = Array.isArray(to) ? to : [to];

    return this.graphRequest(accessToken, 'POST', '/me/sendMail', {
      message: {
        subject,
        body: {
          contentType: isHtml ? 'HTML' : 'Text',
          content: body,
        },
        toRecipients: toRecipients.map((email) => ({
          emailAddress: { address: email },
        })),
      },
    });
  }

  /**
   * Create a calendar event in Outlook
   */
  async createCalendarEvent(accessToken, { subject, body, start, end, location, attendees, isAllDay = false }) {
    const event = {
      subject,
      body: body ? { contentType: 'HTML', content: body } : undefined,
      start: {
        dateTime: start,
        timeZone: 'UTC',
      },
      end: {
        dateTime: end || new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: 'UTC',
      },
      isAllDay,
    };

    if (location) event.location = { displayName: location };
    if (attendees) {
      event.attendees = attendees.map((email) => ({
        emailAddress: { address: email },
        type: 'required',
      }));
    }

    return this.graphRequest(accessToken, 'POST', '/me/events', event);
  }

  /**
   * Update a calendar event
   */
  async updateCalendarEvent(accessToken, eventId, updates) {
    return this.graphRequest(accessToken, 'PATCH', `/me/events/${eventId}`, updates);
  }

  /**
   * Delete a calendar event
   */
  async deleteCalendarEvent(accessToken, eventId) {
    return this.graphRequest(accessToken, 'DELETE', `/me/events/${eventId}`);
  }

  /**
   * List calendar events in a date range
   */
  async listCalendarEvents(accessToken, startDate, endDate) {
    const params = new URLSearchParams({
      startDateTime: startDate,
      endDateTime: endDate,
      $orderby: 'start/dateTime',
      $top: '50',
    });

    return this.graphRequest(accessToken, 'GET', `/me/calendarView?${params.toString()}`);
  }
}

module.exports = new MicrosoftGraphClient();
