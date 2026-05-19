const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { can } = require('../utils/permissions');

const router = Router();
router.use(authenticate);

/**
 * GET /v1/dashboard/v2/overview
 * Returns data appropriate to the user's role.
 */
router.get('/overview', async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const { role, orgId, id: userId } = req.user;
    const now = new Date();

    // Base project filter by role
    let projectWhere = { orgId, deletedAt: null };
    if (role === 'member' || role === 'team_lead' || role === 'viewer') {
      // Limit to projects the user is a member of
      const memberOf = await prisma.projectMember.findMany({
        where: { userId },
        select: { projectId: true },
      });
      projectWhere.id = { in: memberOf.map(m => m.projectId) };
    } else if (role === 'project_manager') {
      const memberOf = await prisma.projectMember.findMany({
        where: { userId },
        select: { projectId: true },
      });
      projectWhere.id = { in: memberOf.map(m => m.projectId) };
    }

    const [projects, tasks, milestones] = await Promise.all([
      prisma.project.findMany({
        where: projectWhere,
        select: {
          id: true, name: true, status: true,
          _count: { select: { tasks: { where: { deletedAt: null } } } },
        },
      }),
      prisma.task.findMany({
        where: {
          orgId,
          deletedAt: null,
          ...(role === 'member' || role === 'team_lead' ? { assigneeId: userId } : {}),
        },
        select: {
          id: true, priority: true, statusName: true,
          dueDate: true, assigneeId: true, projectId: true,
        },
      }),
      prisma.milestone.findMany({
        where: {
          orgId,
          ...(projectWhere.id ? { projectId: { in: [...(projectWhere.id.in || [])] } } : {}),
        },
        select: {
          id: true, title: true, status: true, progress: true,
          dueDate: true, budget: true, effortEstimate: true, projectId: true,
        },
      }),
    ]);

    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.statusName !== 'done');
    const overdueMilestones = milestones.filter(m => m.dueDate && new Date(m.dueDate) < now && m.status !== 'completed');
    const totalBudget = milestones.reduce((s, m) => s + Number(m.budget || 0), 0);
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;

    // Pending approvals for approvers
    let pendingApprovals = 0;
    if (can(req.user, 'approval:action')) {
      try {
        pendingApprovals = await prisma.approval.count({ where: { orgId, status: 'pending' } });
      } catch { pendingApprovals = 0; }
    }

    const overview = {
      role,
      projects: { total: projects.length, active: projects.filter(p => p.status === 'active').length },
      tasks: {
        total: tasks.length,
        overdue: overdueTasks.length,
        dueToday: tasks.filter(t => {
          if (!t.dueDate) return false;
          const d = new Date(t.dueDate);
          return d.toDateString() === now.toDateString();
        }).length,
        myTasks: tasks.filter(t => t.assigneeId === userId).length,
      },
      milestones: {
        total: milestones.length,
        completed: completedMilestones,
        overdue: overdueMilestones.length,
        completionPct: milestones.length > 0
          ? Math.round(milestones.reduce((s, m) => s + (m.progress || 0), 0) / milestones.length)
          : 0,
      },
      financial: can(req.user, 'milestone:budget:view') ? {
        totalBudget,
        milestoneCount: milestones.length,
      } : null,
      pendingApprovals,
    };

    // Division-level stats for division_admin / org_admin / executive
    if (can(req.user, 'division:view')) {
      try {
        const divisions = await prisma.division.findMany({
          where: { orgId, deletedAt: null },
          select: {
            id: true, name: true, code: true,
            _count: { select: { projects: { where: { deletedAt: null } } } },
          },
        });
        overview.divisions = divisions.map(d => ({
          id: d.id, name: d.name, code: d.code,
          projectCount: d._count.projects,
        }));
      } catch { /* skip */ }
    }

    res.json({ success: true, data: overview });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

/**
 * GET /v1/dashboard/v2/milestone-burn
 * Milestone burn-down chart data (for project managers and above)
 */
router.get('/milestone-burn', async (req, res) => {
  if (!can(req.user, 'report:view:project')) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN' } });
  }
  try {
    const prisma = require('../config/prisma');
    const { projectId } = req.query;

    const where = { orgId: req.user.orgId };
    if (projectId) where.projectId = projectId;

    const milestones = await prisma.milestone.findMany({
      where,
      include: {
        tasks: {
          select: { estimatedHours: true, loggedHours: true, statusName: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const burnData = milestones.map(m => {
      const logged = m.tasks.reduce((s, t) => s + Number(t.loggedHours || 0), 0);
      const estimated = Number(m.effortEstimate || 0) || m.tasks.reduce((s, t) => s + Number(t.estimatedHours || 0), 0);
      return {
        id: m.id,
        title: m.title,
        status: m.status,
        progress: m.progress,
        dueDate: m.dueDate,
        budget: m.budget ? Number(m.budget) : null,
        effortEstimate: estimated,
        actualEffort: logged,
        burnRate: estimated > 0 ? Math.round((logged / estimated) * 100) : 0,
        isOverdue: m.dueDate && new Date(m.dueDate) < new Date() && m.status !== 'completed',
        taskCount: m.tasks.length,
        completedTasks: m.tasks.filter(t => t.statusName === 'done' || t.statusName === 'completed').length,
      };
    });

    res.json({ success: true, data: { milestones: burnData } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

module.exports = router;
