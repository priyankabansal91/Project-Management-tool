const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_USER || !SMTP_PASS || SMTP_PASS === 'your-gmail-app-password-here') {
    logger.warn('[EMAIL] SMTP credentials not configured — emails will be logged only');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(SMTP_PORT) || 587,
    secure: false, // STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false },
  });

  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@example.com';
  const t = getTransporter();

  if (!t) {
    // Dev fallback — log the full email to console
    logger.info(`[EMAIL PREVIEW]\nTo: ${to}\nSubject: ${subject}\n---\n${text || html}`);
    return { simulated: true };
  }

  const info = await t.sendMail({ from: `"PM Tool" <${from}>`, to, subject, html, text });
  logger.info(`[EMAIL SENT] To: ${to} | MessageId: ${info.messageId}`);
  return info;
}

async function sendInviteEmail({ to, inviterName, role, inviteLink, orgName, expiresAt }) {
  const subject = `You've been invited to join ${orgName} on PM Tool`;

  const roleFriendly = role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const expiry = new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f9fafb; margin:0; padding:32px;">
  <div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <div style="background:#3b82f6; padding:32px 32px 24px;">
      <h1 style="color:#fff; margin:0; font-size:22px; font-weight:700;">You're invited!</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px; color:#374151; font-size:15px;">
        <strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> as a <strong>${roleFriendly}</strong>.
      </p>
      <a href="${inviteLink}"
         style="display:inline-block; background:#3b82f6; color:#fff; text-decoration:none;
                padding:12px 28px; border-radius:8px; font-weight:600; font-size:15px; margin:8px 0 24px;">
        Accept Invitation
      </a>
      <p style="margin:0; color:#6b7280; font-size:13px;">
        This link expires on <strong>${expiry}</strong>.<br>
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `You've been invited to join ${orgName} as ${roleFriendly}.\n\nAccept here: ${inviteLink}\n\nExpires: ${expiry}`;

  return sendMail({ to, subject, html, text });
}

module.exports = { sendMail, sendInviteEmail };
