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

async function sendOtpEmail({ to, code, purpose, expiresMinutes }) {
  const purposeLabel = {
    verify_email: 'Email Verification',
    change_email: 'Email Change Confirmation',
    password_reset: 'Password Reset',
  }[purpose] || 'Verification';

  const subject = `Your Q-Flow ${purposeLabel} Code: ${code}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:32px;">
  <div style="max-width:440px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <div style="background:#3b82f6;padding:28px 32px 20px;">
      <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">Q-Flow ${purposeLabel}</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 8px;color:#374151;font-size:15px;">Use this one-time code to verify your email address:</p>
      <div style="margin:20px 0;text-align:center;">
        <span style="display:inline-block;font-size:36px;font-weight:800;letter-spacing:10px;color:#1d4ed8;background:#eff6ff;padding:16px 28px;border-radius:10px;font-family:monospace;">${code}</span>
      </div>
      <p style="margin:0 0 16px;color:#6b7280;font-size:13px;">
        This code expires in <strong>${expiresMinutes} minutes</strong>.<br>
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `Your Q-Flow ${purposeLabel} code is: ${code}\n\nExpires in ${expiresMinutes} minutes.`;
  return sendMail({ to, subject, html, text });
}

// ── Shared HTML shell ────────────────────────────────────────────────────────
function baseTemplate({ title, preheader, body }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f3f4f6;margin:0;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,0.08);">
    <div style="background:#1e40af;padding:28px 32px 20px;">
      <p style="margin:0;color:#93c5fd;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Q-Flow · Project Management</p>
      <h1 style="color:#fff;margin:8px 0 0;font-size:20px;font-weight:700;">${title}</h1>
      ${preheader ? `<p style="color:#bfdbfe;margin:6px 0 0;font-size:13px;">${preheader}</p>` : ''}
    </div>
    <div style="padding:28px 32px;">${body}</div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:11px;">This is an automated notification from Q-Flow. Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
}

const BTN = (href, label) =>
  `<a href="${href}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:11px 24px;border-radius:8px;font-weight:600;font-size:14px;margin:16px 0 8px;">${label}</a>`;

const ROW = (label, value) =>
  `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;width:130px;">${label}</td><td style="padding:6px 0;color:#111827;font-size:13px;font-weight:500;">${value || '—'}</td></tr>`;

const TABLE = (rows) =>
  `<table style="width:100%;border-collapse:collapse;margin:16px 0;">${rows}</table>`;

const FRONT = process.env.FRONTEND_URL || 'https://testmk.qci.org.in';

// ── Project notifications ─────────────────────────────────────────────────────

async function sendProjectCreatedEmail({ to, recipientName, projectName, projectKey, createdBy, dueDate, projectUrl }) {
  const subject = `New project created: ${projectName}`;
  return sendMail({
    to,
    subject,
    html: baseTemplate({
      title: 'New Project Created',
      preheader: `${createdBy} has created "${projectName}"`,
      body: `
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi ${recipientName || 'there'},</p>
        <p style="margin:0 0 16px;color:#374151;font-size:14px;">A new project has been created and you've been added as a member.</p>
        ${TABLE(
          ROW('Project', projectName) +
          ROW('Code', projectKey) +
          ROW('Created by', createdBy) +
          ROW('Due date', dueDate || '—')
        )}
        ${BTN(projectUrl || FRONT, 'View Project')}
      `,
    }),
    text: `New project "${projectName}" (${projectKey}) created by ${createdBy}.\nDue: ${dueDate || '—'}\n\nView: ${projectUrl || FRONT}`,
  });
}

async function sendProjectUpdatedEmail({ to, recipientName, projectName, updatedBy, changes, projectUrl }) {
  const subject = `Project updated: ${projectName}`;
  const changeList = Array.isArray(changes) && changes.length
    ? `<ul style="margin:8px 0 16px;padding-left:20px;color:#374151;font-size:14px;">${changes.map((c) => `<li>${c}</li>`).join('')}</ul>`
    : '';
  return sendMail({
    to,
    subject,
    html: baseTemplate({
      title: 'Project Updated',
      preheader: `Changes made to "${projectName}"`,
      body: `
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi ${recipientName || 'there'},</p>
        <p style="margin:0 0 8px;color:#374151;font-size:14px;"><strong>${updatedBy}</strong> updated the project <strong>${projectName}</strong>.</p>
        ${changeList}
        ${BTN(projectUrl || FRONT, 'View Project')}
      `,
    }),
    text: `"${projectName}" was updated by ${updatedBy}.\n${changes?.join('\n') || ''}\n\nView: ${projectUrl || FRONT}`,
  });
}

// ── Member notifications ──────────────────────────────────────────────────────

async function sendMemberAddedEmail({ to, recipientName, projectName, role, addedBy, projectUrl }) {
  const roleFriendly = (role || 'member').replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const subject = `You've been added to project: ${projectName}`;
  return sendMail({
    to,
    subject,
    html: baseTemplate({
      title: "You've Been Added to a Project",
      preheader: `${addedBy} added you to "${projectName}"`,
      body: `
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi ${recipientName || 'there'},</p>
        <p style="margin:0 0 16px;color:#374151;font-size:14px;"><strong>${addedBy}</strong> has added you to the project <strong>${projectName}</strong> as a <strong>${roleFriendly}</strong>.</p>
        ${BTN(projectUrl || FRONT, 'Open Project')}
      `,
    }),
    text: `You've been added to "${projectName}" as ${roleFriendly} by ${addedBy}.\n\nOpen: ${projectUrl || FRONT}`,
  });
}

async function sendMemberRemovedEmail({ to, recipientName, projectName, removedBy }) {
  const subject = `You've been removed from project: ${projectName}`;
  return sendMail({
    to,
    subject,
    html: baseTemplate({
      title: 'Removed from Project',
      preheader: `Access to "${projectName}" has been revoked`,
      body: `
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi ${recipientName || 'there'},</p>
        <p style="margin:0;color:#374151;font-size:14px;"><strong>${removedBy}</strong> has removed you from the project <strong>${projectName}</strong>. You will no longer have access to this project.</p>
      `,
    }),
    text: `You've been removed from "${projectName}" by ${removedBy}.`,
  });
}

// ── Task notifications ────────────────────────────────────────────────────────

async function sendTaskAssignedEmail({ to, recipientName, taskTitle, taskKey, projectName, assignedBy, dueDate, priority, taskUrl }) {
  const subject = `Task assigned to you: ${taskTitle}`;
  const priorityColors = { critical: '#dc2626', high: '#ea580c', medium: '#d97706', low: '#16a34a', none: '#6b7280' };
  const priorityColor = priorityColors[priority] || '#6b7280';
  return sendMail({
    to,
    subject,
    html: baseTemplate({
      title: 'Task Assigned to You',
      preheader: `${assignedBy} assigned "${taskTitle}"`,
      body: `
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi ${recipientName || 'there'},</p>
        <p style="margin:0 0 16px;color:#374151;font-size:14px;"><strong>${assignedBy}</strong> has assigned you a task.</p>
        ${TABLE(
          ROW('Task', taskKey ? `[${taskKey}] ${taskTitle}` : taskTitle) +
          ROW('Project', projectName) +
          ROW('Priority', `<span style="color:${priorityColor};font-weight:600;">${(priority || 'medium').toUpperCase()}</span>`) +
          ROW('Due date', dueDate || '—')
        )}
        ${BTN(taskUrl || FRONT, 'View Task')}
      `,
    }),
    text: `Task "${taskTitle}" assigned to you by ${assignedBy} in project "${projectName}".\nPriority: ${priority || 'medium'}\nDue: ${dueDate || '—'}\n\nView: ${taskUrl || FRONT}`,
  });
}

// ── Milestone notifications ───────────────────────────────────────────────────

async function sendMilestoneCreatedEmail({ to, recipientName, milestoneTitle, projectName, createdBy, dueDate, projectUrl }) {
  const subject = `New milestone added: ${milestoneTitle}`;
  return sendMail({
    to,
    subject,
    html: baseTemplate({
      title: 'New Milestone Created',
      preheader: `"${milestoneTitle}" added to ${projectName}`,
      body: `
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi ${recipientName || 'there'},</p>
        <p style="margin:0 0 16px;color:#374151;font-size:14px;"><strong>${createdBy}</strong> added a new milestone to <strong>${projectName}</strong>.</p>
        ${TABLE(
          ROW('Milestone', milestoneTitle) +
          ROW('Project', projectName) +
          ROW('Due date', dueDate || '—')
        )}
        ${BTN(projectUrl || FRONT, 'View Project')}
      `,
    }),
    text: `Milestone "${milestoneTitle}" added to "${projectName}" by ${createdBy}.\nDue: ${dueDate || '—'}\n\nView: ${projectUrl || FRONT}`,
  });
}

// ── Approval notifications ────────────────────────────────────────────────────

async function sendApprovalRequestEmail({ to, recipientName, title, requestedBy, description, approvalUrl }) {
  const subject = `Approval required: ${title}`;
  return sendMail({
    to,
    subject,
    html: baseTemplate({
      title: 'Approval Required',
      preheader: `${requestedBy} needs your approval`,
      body: `
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi ${recipientName || 'there'},</p>
        <p style="margin:0 0 16px;color:#374151;font-size:14px;"><strong>${requestedBy}</strong> has submitted a request that requires your approval.</p>
        ${TABLE(
          ROW('Request', title) +
          ROW('Details', description || '—')
        )}
        ${BTN(approvalUrl || `${FRONT}/admin/approvals`, 'Review & Approve')}
      `,
    }),
    text: `Approval required: "${title}" submitted by ${requestedBy}.\n${description || ''}\n\nReview: ${approvalUrl || `${FRONT}/admin/approvals`}`,
  });
}

async function sendApprovalOutcomeEmail({ to, recipientName, title, outcome, approvedBy, comment, projectUrl }) {
  const approved = outcome === 'approved';
  const subject = `${approved ? '✓ Approved' : '✗ Rejected'}: ${title}`;
  return sendMail({
    to,
    subject,
    html: baseTemplate({
      title: approved ? 'Request Approved' : 'Request Rejected',
      preheader: `${title} has been ${outcome}`,
      body: `
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi ${recipientName || 'there'},</p>
        <p style="margin:0 0 16px;color:#374151;font-size:14px;">
          Your request <strong>${title}</strong> has been
          <strong style="color:${approved ? '#16a34a' : '#dc2626'};">${outcome}</strong>
          by <strong>${approvedBy}</strong>.
        </p>
        ${comment ? `<div style="background:#f9fafb;border-left:3px solid #e5e7eb;padding:12px 16px;margin:0 0 16px;font-size:13px;color:#374151;">${comment}</div>` : ''}
        ${BTN(projectUrl || FRONT, 'View Details')}
      `,
    }),
    text: `Your request "${title}" was ${outcome} by ${approvedBy}.\n${comment || ''}\n\nView: ${projectUrl || FRONT}`,
  });
}

module.exports = {
  sendMail,
  sendInviteEmail,
  sendOtpEmail,
  sendProjectCreatedEmail,
  sendProjectUpdatedEmail,
  sendMemberAddedEmail,
  sendMemberRemovedEmail,
  sendTaskAssignedEmail,
  sendMilestoneCreatedEmail,
  sendApprovalRequestEmail,
  sendApprovalOutcomeEmail,
};
