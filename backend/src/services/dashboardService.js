const prisma = require('../config/prisma');

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
        detail: a.newValue,
        at: a.createdAt,
      })),
      team_workload: teamWorkload,
    };
  }
}

module.exports = new DashboardService();
