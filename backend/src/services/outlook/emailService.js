// ─── Outlook Email Notification Service ──────────────────
// Uses Claude AI to generate smart email summaries, then sends
// them via Microsoft Graph API (Outlook) or falls back to SMTP.

const graphClient = require('./graphClient');
const prisma = require('../../config/prisma');
const logger = require('../../config/logger');

// Claude AI integration for generating email content
let Anthropic;
try {
  Anthropic = require('@anthropic-ai/sdk');
} catch (err) {
  logger.debug('Anthropic SDK not available', err);
}

class OutlookEmailService {
  constructor() {
    this.anthropic = process.env.ANTHROPIC_API_KEY
      ? new (Anthropic || function() {})({ apiKey: process.env.ANTHROPIC_API_KEY })
      : null;
  }

  // ─── Claude AI Email Generation ───────────────────────

  /**
   * Generate a smart email summary using Claude for a task event
   */
  async generateEmailContent(eventType, taskData, projectData, recipientName) {
    if (!this.anthropic) {
      return this.getStaticEmailContent(eventType, taskData, projectData, recipientName);
    }

    try {
      const prompt = this.buildPrompt(eventType, taskData, projectData, recipientName);

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: `You are an email assistant for a project management tool called ProjectFlow.
Generate concise, professional email body content in HTML format.
Use a clean style with short paragraphs. Include relevant details but keep it brief.
Do NOT include subject line, greeting, or signature — just the body content.
Use <p>, <strong>, <ul>/<li> tags for formatting.`,
        messages: [{ role: 'user', content: prompt }],
      });

      return response.content[0].text;
    } catch (err) {
      logger.warn('Claude AI email generation failed, using static template', { error: err.message });
      return this.getStaticEmailContent(eventType, taskData, projectData, recipientName);
    }
  }

  buildPrompt(eventType, task, project, recipientName) {
    const context = `
Project: ${project.name} (${project.key})
Task: ${task.task_key || task.title} — "${task.title}"
Priority: ${task.priority}
Status: ${task.status_name || 'N/A'}
Due: ${task.due_date || 'No due date'}
Assignee: ${task.assignee?.name || 'Unassigned'}`;

    const prompts = {
      task_assigned: `Generate a brief email body notifying ${recipientName} that they have been assigned this task:\n${context}`,
      task_updated: `Generate a brief email body notifying ${recipientName} that this task was updated:\n${context}\nChanges: Status changed, priority updated.`,
      task_commented: `Generate a brief email body notifying ${recipientName} that someone commented on this task:\n${context}`,
      due_date_reminder: `Generate a brief email body reminding ${recipientName} that this task is due soon:\n${context}`,
      task_completed: `Generate a brief email body notifying ${recipientName} that this task has been completed:\n${context}`,
      weekly_digest: `Generate a brief weekly digest email body for ${recipientName} summarizing activity on project:\n${context}\nCompleted: 3 tasks. In Progress: 5 tasks. Overdue: 1 task.`,
    };

    return prompts[eventType] || prompts.task_updated;
  }

  // ─── Static Email Templates (fallback) ────────────────

  getStaticEmailContent(eventType, task, project, recipientName) {
    const taskUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks/${task.id}`;
    const projectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/projects/${project.id}/board`;

    const templates = {
      task_assigned: `
        <p>Hi ${recipientName},</p>
        <p>You've been assigned a new task in <strong><a href="${projectUrl}">${project.name}</a></strong>:</p>
        <ul>
          <li><strong>Task:</strong> <a href="${taskUrl}">${task.task_key} — ${task.title}</a></li>
          <li><strong>Priority:</strong> ${task.priority}</li>
          <li><strong>Due:</strong> ${task.due_date || 'No due date'}</li>
        </ul>
        <p><a href="${taskUrl}" style="background:#3B82F6;color:white;padding:8px 16px;border-radius:6px;text-decoration:none;display:inline-block;">View Task</a></p>`,

      task_updated: `
        <p>Hi ${recipientName},</p>
        <p>A task you're watching was updated in <strong>${project.name}</strong>:</p>
        <ul>
          <li><strong>Task:</strong> <a href="${taskUrl}">${task.task_key} — ${task.title}</a></li>
          <li><strong>Status:</strong> ${task.status_name || 'Updated'}</li>
          <li><strong>Priority:</strong> ${task.priority}</li>
        </ul>
        <p><a href="${taskUrl}" style="background:#3B82F6;color:white;padding:8px 16px;border-radius:6px;text-decoration:none;display:inline-block;">View Task</a></p>`,

      task_commented: `
        <p>Hi ${recipientName},</p>
        <p>New comment on <strong><a href="${taskUrl}">${task.task_key} — ${task.title}</a></strong> in ${project.name}.</p>
        <p><a href="${taskUrl}" style="background:#3B82F6;color:white;padding:8px 16px;border-radius:6px;text-decoration:none;display:inline-block;">View Comment</a></p>`,

      due_date_reminder: `
        <p>Hi ${recipientName},</p>
        <p><strong>Reminder:</strong> Your task is due soon!</p>
        <ul>
          <li><strong>Task:</strong> <a href="${taskUrl}">${task.task_key} — ${task.title}</a></li>
          <li><strong>Due:</strong> ${task.due_date}</li>
          <li><strong>Project:</strong> ${project.name}</li>
        </ul>
        <p><a href="${taskUrl}" style="background:#F59E0B;color:white;padding:8px 16px;border-radius:6px;text-decoration:none;display:inline-block;">View Task</a></p>`,

      task_completed: `
        <p>Hi ${recipientName},</p>
        <p><strong>${task.task_key} — ${task.title}</strong> has been marked as complete in ${project.name}.</p>
        <p><a href="${taskUrl}" style="background:#10B981;color:white;padding:8px 16px;border-radius:6px;text-decoration:none;display:inline-block;">View Task</a></p>`,
    };

    return templates[eventType] || templates.task_updated;
  }

  // ─── Send Methods ─────────────────────────────────────

  /**
   * Send task notification email via Outlook (Graph API)
   * Falls back to the user's integration token
   */
  async sendTaskNotification(userId, eventType, task, project) {
    try {
      // Get user's Microsoft integration
      const accessToken = await graphClient.getValidToken(userId);

      // Get recipient info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true },
      });

      if (!user) return;

      const recipientName = `${user.firstName} ${user.lastName}`;

      // Check if user has email notifications enabled
      const integration = await prisma.userIntegration.findFirst({
        where: { userId, provider: 'microsoft', revokedAt: null },
      });

      if (!integration?.settings?.email_notifications) {
        logger.debug(`Email notifications disabled for user ${userId}`);
        return;
      }

      // Generate email content (AI or static)
      const useAI = integration.settings?.ai_email_summaries !== false;
      const body = useAI
        ? await this.generateEmailContent(eventType, task, project, recipientName)
        : this.getStaticEmailContent(eventType, task, project, recipientName);

      const subjectMap = {
        task_assigned: `[${project.key}] Task assigned: ${task.title}`,
        task_updated: `[${project.key}] Task updated: ${task.title}`,
        task_commented: `[${project.key}] New comment on: ${task.title}`,
        due_date_reminder: `[${project.key}] Due soon: ${task.title}`,
        task_completed: `[${project.key}] Completed: ${task.title}`,
        weekly_digest: `[${project.key}] Weekly Project Summary`,
      };

      const subject = subjectMap[eventType] || `[${project.key}] ${task.title}`;

      const wrappedBody = this.wrapInEmailTemplate(body, subject);

      if (accessToken) {
        // Send via Microsoft Graph (Outlook)
        await graphClient.sendEmail(accessToken, {
          to: user.email,
          subject,
          body: wrappedBody,
          isHtml: true,
        });
        logger.info(`Sent Outlook email to ${user.email}: ${eventType}`);
      } else {
        logger.info(`No Microsoft token for user ${userId}, email skipped (would use SMTP fallback)`);
      }
    } catch (err) {
      logger.error(`Failed to send email notification: ${err.message}`, { userId, eventType });
    }
  }

  /**
   * Wrap email body in a styled HTML template
   */
  wrapInEmailTemplate(bodyContent, subject) {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr><td style="background:#3B82F6;padding:20px 24px;">
          <table width="100%"><tr>
            <td style="color:white;font-size:20px;font-weight:700;">ProjectFlow</td>
            <td align="right" style="color:rgba(255,255,255,0.8);font-size:12px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
          </tr></table>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:24px;font-size:14px;line-height:1.6;color:#374151;">
          ${bodyContent}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center;">
          This email was sent by ProjectFlow. <a href="${process.env.FRONTEND_URL || '#'}/settings" style="color:#3B82F6;">Manage notification preferences</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}

module.exports = new OutlookEmailService();
