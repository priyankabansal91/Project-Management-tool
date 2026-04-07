// ─── Outlook Calendar Sync Service ───────────────────────
// Syncs task due dates and sprint timelines to Outlook calendar.
// Maintains a bidirectional mapping in user_integrations.calendar_mapping.

const graphClient = require('./graphClient');
const prisma = require('../../config/prisma');
const logger = require('../../config/logger');

class CalendarSyncService {
  // ─── Task → Calendar Event ────────────────────────────

  /**
   * Create or update an Outlook calendar event for a task
   */
  async syncTaskToCalendar(userId, task, project) {
    try {
      const accessToken = await graphClient.getValidToken(userId);
      if (!accessToken) return null;

      const integration = await prisma.userIntegration.findFirst({
        where: { userId, provider: 'microsoft', revokedAt: null },
      });

      if (!integration?.settings?.sync_calendar) {
        logger.debug(`Calendar sync disabled for user ${userId}`);
        return null;
      }

      const mapping = integration.calendarMapping || {};
      const existingEventId = mapping[task.id];

      if (!task.dueDate && !task.due_date) {
        // No due date → delete existing event if any
        if (existingEventId) {
          await this.deleteCalendarEvent(userId, accessToken, task.id, integration);
        }
        return null;
      }

      const dueDate = task.dueDate || task.due_date;
      const eventData = this.buildTaskEvent(task, project, dueDate);

      let event;
      if (existingEventId) {
        // Update existing event
        try {
          event = await graphClient.updateCalendarEvent(accessToken, existingEventId, eventData);
          logger.info(`Updated Outlook calendar event for task ${task.id}`);
        } catch (err) {
          // Event may have been deleted in Outlook — create new
          event = await graphClient.createCalendarEvent(accessToken, eventData);
          mapping[task.id] = event.id;
        }
      } else {
        // Create new event
        event = await graphClient.createCalendarEvent(accessToken, eventData);
        mapping[task.id] = event.id;
        logger.info(`Created Outlook calendar event for task ${task.id}`);
      }

      // Save updated mapping
      await prisma.userIntegration.update({
        where: { id: integration.id },
        data: { calendarMapping: mapping },
      });

      return event;
    } catch (err) {
      logger.error(`Calendar sync failed for task ${task.id}: ${err.message}`);
      return null;
    }
  }

  /**
   * Delete an Outlook calendar event when task is deleted or due date removed
   */
  async deleteCalendarEvent(userId, accessToken, taskId, integration) {
    try {
      const mapping = integration.calendarMapping || {};
      const eventId = mapping[taskId];
      if (!eventId) return;

      await graphClient.deleteCalendarEvent(accessToken, eventId);
      delete mapping[taskId];

      await prisma.userIntegration.update({
        where: { id: integration.id },
        data: { calendarMapping: mapping },
      });

      logger.info(`Deleted Outlook calendar event for task ${taskId}`);
    } catch (err) {
      logger.warn(`Failed to delete calendar event: ${err.message}`);
    }
  }

  /**
   * Build Outlook calendar event payload from task data
   */
  buildTaskEvent(task, project, dueDate) {
    const taskKey = task.task_key || `${project.key}-${task.seqNumber || task.seq_number}`;
    const taskUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks/${task.id}`;

    const priorityEmoji = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
      none: '⚪',
    };

    const emoji = priorityEmoji[task.priority] || '⚪';
    const dueDateObj = new Date(dueDate);

    return {
      subject: `${emoji} [${taskKey}] ${task.title}`,
      body: `<p><strong>Project:</strong> ${project.name}</p>
<p><strong>Priority:</strong> ${task.priority}</p>
<p><strong>Status:</strong> ${task.statusName || task.status_name || 'N/A'}</p>
${task.description ? `<p><strong>Description:</strong> ${task.description.substring(0, 300)}</p>` : ''}
<p><a href="${taskUrl}">Open in ProjectFlow</a></p>`,
      start: dueDateObj.toISOString(),
      end: new Date(dueDateObj.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
      isAllDay: false,
    };
  }

  // ─── Sprint → Calendar Events ─────────────────────────

  /**
   * Sync sprint start/end dates as calendar events for all sprint members
   */
  async syncSprintToCalendar(userId, sprint, project) {
    try {
      const accessToken = await graphClient.getValidToken(userId);
      if (!accessToken) return null;

      const integration = await prisma.userIntegration.findFirst({
        where: { userId, provider: 'microsoft', revokedAt: null },
      });

      if (!integration?.settings?.sync_calendar) return null;

      if (!sprint.startDate || !sprint.endDate) return null;

      const mapping = integration.calendarMapping || {};
      const sprintKey = `sprint_${sprint.id}`;
      const existingEventId = mapping[sprintKey];

      const eventData = {
        subject: `🏃 Sprint: ${sprint.name} (${project.key})`,
        body: `<p><strong>Project:</strong> ${project.name}</p>
<p><strong>Goal:</strong> ${sprint.goal || 'No goal set'}</p>
<p><strong>Status:</strong> ${sprint.status}</p>`,
        start: new Date(sprint.startDate).toISOString(),
        end: new Date(sprint.endDate).toISOString(),
        isAllDay: true,
      };

      let event;
      if (existingEventId) {
        try {
          event = await graphClient.updateCalendarEvent(accessToken, existingEventId, eventData);
        } catch {
          event = await graphClient.createCalendarEvent(accessToken, eventData);
          mapping[sprintKey] = event.id;
        }
      } else {
        event = await graphClient.createCalendarEvent(accessToken, eventData);
        mapping[sprintKey] = event.id;
      }

      await prisma.userIntegration.update({
        where: { id: integration.id },
        data: { calendarMapping: mapping },
      });

      logger.info(`Synced sprint ${sprint.id} to Outlook calendar for user ${userId}`);
      return event;
    } catch (err) {
      logger.error(`Sprint calendar sync failed: ${err.message}`);
      return null;
    }
  }

  // ─── Bulk Sync ────────────────────────────────────────

  /**
   * Sync all task due dates for a user to their Outlook calendar
   */
  async bulkSyncTasks(userId, orgId) {
    const accessToken = await graphClient.getValidToken(userId);
    if (!accessToken) throw new Error('Microsoft account not connected');

    const tasks = await prisma.task.findMany({
      where: {
        orgId,
        assigneeId: userId,
        deletedAt: null,
        completedAt: null,
        dueDate: { not: null },
      },
      include: {
        project: { select: { id: true, name: true, key: true } },
      },
    });

    let synced = 0;
    for (const task of tasks) {
      const result = await this.syncTaskToCalendar(userId, task, task.project);
      if (result) synced++;
    }

    logger.info(`Bulk synced ${synced}/${tasks.length} tasks to Outlook for user ${userId}`);
    return { total: tasks.length, synced };
  }
}

module.exports = new CalendarSyncService();
