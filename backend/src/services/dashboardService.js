const prisma = require('../config/prisma');

function formatActivityDetail(action, newValue) {
  if (!newValue) {
    const labels = {
      created: 'created this item',
      deleted: 'deleted this item',
      commented: 'added a comment',
      assigned: 'was assigned',
      approved: 'approved',
      rejected: 'rejected',
    };
    return labels[action] || action;
  }

  // newValue is already a plain string
  if (typeof newValue === 'string') return newValue;

  // Object with from/to → "changed X from A → B"
  if (newValue.from !== undefined && newValue.to !== undefined) {
    return `${newValue.from} → ${newValue.to}`;
  }

  // Object with a single "value" key
  if (newValue.value !== undefined) return String(newValue.value);

  // Object with a "name" key (e.g. assigned to user)
  if (newValue.name) return `assigned to ${newValue.name}`;

  // Object with "status"
  if (newValue.status) return `status set to ${newValue.status}`;

  // Object with "title"
  if (newValue.title) return newValue.title;

  // Last resort: flatten key-value pairs into readable text
  return Object.entries(newValue)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
}

class DashboardService {
  async getOverview(orgId, userId, role) {
    const [projects, totalTasks, completedTasks, overdueTasks, myOpenTasks] = await Promise.all([
      prisma.project.findMany({ where: { orgId, deletedAt: null, status: 'active' }, select: { id: true, name: true, key: true, color: true } }),
      prisma.task.count({ where: { orgId, deletedAt: null } }),
      prisma.task.count({ where: { orgId, deletedAt: null, completedAt: { not: null } } }),
      prisma.task.count({ where: { orgId, deletedAt: null, completedAt: null, dueDate: { lt: new Date() } } }),
      prisma.task.count({ where: { orgId, deletedAt: null, completedAt: null, assigneeId: userId } }),
    ]);

    // Project progress
    const projectProgress = await Promise.all(
      projects.map(async (p) => {
        const [total, completed] = await Promise.all([
          prisma.task.count({ where: { projectId: p.id, deletedAt: null } }),
          prisma.task.count({ where: { projectId: p.id, deletedAt: null, completedAt: { not: null } } }),
        ]);
        return {
          project_id: p.id,
          name: p.name,
          key: p.key,
          color: p.color,
          total_tasks: total,
          completed_tasks: completed,
          completion_pct: total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0,
        };
      })
    );

    // Recent activity
    const recentActivity = await prisma.activityLog.findMany({
      where: { orgId },
      include: { actor: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Team workload
    const members = await prisma.orgMember.findMany({
      where: { orgId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            assignedTasks: {
              where: { orgId, deletedAt: null, completedAt: null },
              select: { id: true, priority: true, dueDate: true, estimatedHours: true },
            },
          },
        },
      },
    });

    const teamWorkload = members.map((m) => ({
      user_id: m.user.id,
      name: `${m.user.firstName} ${m.user.lastName}`,
      avatar_url: m.user.avatarUrl,
      role: m.role,
      open_tasks: m.user.assignedTasks.length,
      high_priority: m.user.assignedTasks.filter((t) => t.priority === 'critical' || t.priority === 'high').length,
      overdue_tasks: m.user.assignedTasks.filter((t) => t.dueDate && t.dueDate < new Date()).length,
      estimated_hours: m.user.assignedTasks.reduce((sum, t) => sum + (t.estimatedHours ? Number(t.estimatedHours) : 0), 0),
    }));

    return {
      stats: {
        total_projects: projects.length,
        active_projects: projects.length,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        overdue_tasks: overdueTasks,
        my_open_tasks: myOpenTasks,
      },
      project_progress: projectProgress,
      recent_activity: recentActivity.map((a) => ({
        actor: a.actor ? `${a.actor.firstName} ${a.actor.lastName}` : 'System',
        action: a.action,
        entity_type: a.entityType,
        entity_id: a.entityId,
        detail: formatActivityDetail(a.action, a.newValue),
        at: a.createdAt,
      })),
      team_workload: teamWorkload,
    };
  }
}

module.exports = new DashboardService();
