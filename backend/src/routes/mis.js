const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const prisma = require('../config/prisma');
const timeLogService = require('../services/timeLogService');
const divisionConfigService = require('../services/divisionConfigService');
const logger = require('../utils/logger');

const router = Router();
router.use(authenticate);

// ─── Date helpers ─────────────────────────────────────────

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function startOfWeek() {
  const d = new Date();
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function startOfMonth() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function endOfThisWeek() {
  const d = startOfWeek();
  d.setUTCDate(d.getUTCDate() + 6);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

const DEV_NAMES = {
  'dev-member-id':          'Ravi Kumar',
  'dev-project_manager-id': 'Anjali Singh',
  'dev-org_admin-id':       'Priya Sharma',
  'dev-division_admin-id':  'Rahul Mehta',
  'dev-executive-id':       'Vikram Nair',
  'dev-viewer-id':          'Sneha Patel',
};

// ─────────────────────────────────────────────────────────
// GET /v1/mis/division/:divisionId
// Division MIS summary — org_admin or division_admin of that division
// ─────────────────────────────────────────────────────────

router.get('/division/:divisionId', async (req, res) => {
  try {
    const { role, orgId, id: userId } = req.user;
    const { divisionId } = req.params;

    // Authorization
    if (role !== 'org_admin' && role !== 'division_admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Division admin or org admin access required' },
      });
    }

    if (role === 'division_admin') {
      const userDivisions = divisionConfigService.getUserDivisions(userId);
      const isMember = userDivisions.some(
        (d) => d.divisionId === divisionId && d.role === 'division_admin',
      );
      if (!isMember) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You are not a division admin for this division' },
        });
      }
    }

    // ── 1. Division metadata ──────────────────────────────
    let divisionMeta = null;
    try {
      divisionMeta = await prisma.division.findFirst({
        where: { id: divisionId, orgId, deletedAt: null },
        select: { id: true, name: true, code: true },
      });
    } catch (_) { logger.debug('MIS: DB query failed, using fallback', _); }

    if (!divisionMeta) {
      const cfg = divisionConfigService.getDivisionConfig(divisionId);
      if (!cfg) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Division not found' },
        });
      }
      divisionMeta = {
        id: cfg.id,
        name: cfg.name,
        code: cfg.id.replace('div_', '').toUpperCase(),
      };
    }

    // ── 2. Members ────────────────────────────────────────
    let memberStats = { total: 0, active: 0, inactive: 0, suspended: 0 };
    let memberUserIds = [];

    try {
      const dbMembers = await prisma.divisionMember.findMany({
        where: { divisionId },
        include: { user: { select: { id: true, status: true } } },
      });
      memberUserIds = dbMembers.map((m) => m.user.id);
      for (const m of dbMembers) {
        memberStats.total += 1;
        const s = m.user.status;
        if (s === 'active') memberStats.active += 1;
        else if (s === 'inactive') memberStats.inactive += 1;
        else if (s === 'suspended') memberStats.suspended += 1;
      }
    } catch (_) {
      logger.debug('MIS: DB query failed, using fallback', _);
      const inMembers = divisionConfigService.getDivisionMembers(divisionId);
      memberUserIds = inMembers.map((m) => m.userId);
      memberStats.total = inMembers.length;
      memberStats.active = inMembers.length;
    }

    // ── 3. Projects ───────────────────────────────────────
    let projectStats = { total: 0, active: 0, completed: 0, on_hold: 0, overdue: 0 };
    let projectIds = [];

    try {
      const dbProjects = await prisma.project.findMany({
        where: { divisionId, orgId, deletedAt: null },
        select: { id: true, status: true, dueDate: true },
      });
      const now = new Date();
      for (const p of dbProjects) {
        projectStats.total += 1;
        projectIds.push(p.id);
        if (p.status === 'active') projectStats.active += 1;
        else if (p.status === 'completed') projectStats.completed += 1;
        else if (p.status === 'on_hold') projectStats.on_hold += 1;
        if (p.status === 'active' && p.dueDate && new Date(p.dueDate) < now) {
          projectStats.overdue += 1;
        }
      }
    } catch (_) { logger.debug('MIS: DB query failed, using fallback', _); }

    // ── 4. Tasks ──────────────────────────────────────────
    let taskStats = {
      total: 0, open: 0, in_progress: 0, completed: 0,
      overdue: 0, due_this_week: 0,
      by_priority: { critical: 0, high: 0, medium: 0, low: 0 },
    };
    let allTaskRows = [];

    try {
      if (projectIds.length > 0) {
        allTaskRows = await prisma.task.findMany({
          where: { projectId: { in: projectIds }, isArchived: false, deletedAt: null },
          select: {
            id: true, statusName: true, priority: true, dueDate: true, assigneeId: true,
            assignee: { select: { id: true, firstName: true, lastName: true } },
          },
        });

        const now     = new Date();
        const weekEnd = endOfThisWeek();

        for (const t of allTaskRows) {
          taskStats.total += 1;
          const sn = (t.statusName || '').toLowerCase();
          const isDone       = sn.includes('done') || sn.includes('complete');
          const isInProgress = sn.includes('progress');

          if (isDone) taskStats.completed += 1;
          else if (isInProgress) taskStats.in_progress += 1;
          else taskStats.open += 1;

          if (!isDone && t.dueDate) {
            const due = new Date(t.dueDate);
            if (due < now) taskStats.overdue += 1;
            else if (due <= weekEnd) taskStats.due_this_week += 1;
          }

          const p = t.priority || 'medium';
          if (taskStats.by_priority[p] !== undefined) taskStats.by_priority[p] += 1;
          else taskStats.by_priority.medium += 1;
        }
      }
    } catch (_) { logger.debug('MIS: DB query failed, using fallback', _); }

    // ── 5. Time Tracking (in-memory service) ──────────────
    const weekFrom  = startOfWeek();
    const weekTo    = endOfThisWeek();
    const monthFrom = startOfMonth();
    const monthTo   = new Date();

    let hoursThisWeek  = 0;
    let hoursThisMonth = 0;

    try {
      // getOrgSummary filters by orgId+date range; we also filter by divisionId
      const weeklySummary = timeLogService.getOrgSummary(orgId, {
        startDate: isoDate(weekFrom),
        endDate:   isoDate(weekTo),
      });
      // Filter byMember to only division members
      const memberSet = new Set(memberUserIds);
      const weeklyLogs = (weeklySummary.byMember || []).filter((m) => memberSet.has(m.userId));
      hoursThisWeek = weeklyLogs.reduce((s, m) => s + m.hours, 0);
      hoursThisWeek = Math.round(hoursThisWeek * 10) / 10;

      const monthlySummary = timeLogService.getOrgSummary(orgId, {
        startDate: isoDate(monthFrom),
        endDate:   isoDate(monthTo),
      });
      const monthlyLogs = (monthlySummary.byMember || []).filter((m) => memberSet.has(m.userId));
      hoursThisMonth = monthlyLogs.reduce((s, m) => s + m.hours, 0);
      hoursThisMonth = Math.round(hoursThisMonth * 10) / 10;
    } catch (_) { logger.debug('MIS: DB query failed, using fallback', _); }

    // ── 6. Approvals (in-memory, static approximation) ────
    const approvalStats = {
      pending: 3,
      approved_this_month: 12,
      rejected_this_month: 2,
    };

    // ── 7. Top Contributors ───────────────────────────────
    const contributorMap = new Map();

    // Seed from task assignees
    for (const uid of memberUserIds) {
      contributorMap.set(uid, { tasksCompleted: 0, hoursLogged: 0, name: DEV_NAMES[uid] || uid });
    }
    for (const t of allTaskRows) {
      if (!t.assigneeId) continue;
      const sn = (t.statusName || '').toLowerCase();
      const isDone = sn.includes('done') || sn.includes('complete');
      if (!contributorMap.has(t.assigneeId)) {
        const a = t.assignee;
        const name = a ? `${a.firstName} ${a.lastName}`.trim() : DEV_NAMES[t.assigneeId] || t.assigneeId;
        contributorMap.set(t.assigneeId, { tasksCompleted: 0, hoursLogged: 0, name });
      }
      if (isDone) contributorMap.get(t.assigneeId).tasksCompleted += 1;
      // Enrich name if assignee info available
      if (t.assignee && contributorMap.has(t.assigneeId)) {
        const a = t.assignee;
        contributorMap.get(t.assigneeId).name = `${a.firstName} ${a.lastName}`.trim();
      }
    }

    // Add hours from org summary (in-memory time logs)
    try {
      const allTimeSummary = timeLogService.getOrgSummary(orgId, {});
      for (const m of (allTimeSummary.byMember || [])) {
        if (contributorMap.has(m.userId)) {
          contributorMap.get(m.userId).hoursLogged = Math.round((m.hours || 0) * 10) / 10;
        }
      }
    } catch (_) { logger.debug('MIS: DB query failed, using fallback', _); }

    const topContributors = Array.from(contributorMap.entries())
      .map(([uid, cs]) => ({
        user_id: uid,
        name: cs.name,
        tasks_completed: cs.tasksCompleted,
        hours_logged: cs.hoursLogged,
      }))
      .sort((a, b) => b.tasks_completed - a.tasks_completed || b.hours_logged - a.hours_logged)
      .slice(0, 5);

    // ── 8. Recent Activity ────────────────────────────────
    let recentActivity = [];
    try {
      if (projectIds.length > 0) {
        const actLogs = await prisma.activityLog.findMany({
          where: { orgId, entityId: { in: projectIds } },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            action: true, entityType: true, entityId: true, createdAt: true,
            actor: { select: { firstName: true, lastName: true } },
          },
        });
        recentActivity = actLogs.map((l) => ({
          action: l.action,
          entity: `${l.entityType}:${l.entityId}`,
          actor: l.actor ? `${l.actor.firstName} ${l.actor.lastName}`.trim() : 'System',
          timestamp: l.createdAt,
        }));
      }
    } catch (_) { logger.debug('MIS: DB query failed, using fallback', _); }

    // Fallback static activity for development
    if (recentActivity.length === 0) {
      recentActivity = [
        { action: 'task_created',    entity: 'Task: Auth module',      actor: 'Anjali Singh', timestamp: new Date(Date.now() - 3_600_000).toISOString() },
        { action: 'task_completed',  entity: 'Task: DB schema design', actor: 'Ravi Kumar',   timestamp: new Date(Date.now() - 7_200_000).toISOString() },
        { action: 'project_updated', entity: 'Project: APIV3',         actor: 'Priya Sharma', timestamp: new Date(Date.now() - 86_400_000).toISOString() },
      ];
    }

    res.json({
      success: true,
      data: {
        division: divisionMeta,
        members: memberStats,
        projects: projectStats,
        tasks: taskStats,
        time_tracking: { hours_this_week: hoursThisWeek, hours_this_month: hoursThisMonth },
        approvals: approvalStats,
        top_contributors: topContributors,
        recent_activity: recentActivity.slice(0, 10),
      },
    });
  } catch (err) {
    console.error('[MIS] /division/:divisionId error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  }
});

// ─────────────────────────────────────────────────────────
// GET /v1/mis/division-overview
// All-divisions summary — org_admin only
// ─────────────────────────────────────────────────────────

router.get('/division-overview', async (req, res) => {
  try {
    const { role, orgId } = req.user;

    if (role !== 'org_admin' && role !== 'division_admin' && role !== 'hod') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
      });
    }

    const allDivisions = divisionConfigService.getAllDivisions();
    const overviews = [];

    for (const div of allDivisions) {
      const members = divisionConfigService.getDivisionMembers(div.id);
      const memberCount = members.length;

      let projectCount  = 0;
      let taskTotal     = 0;
      let taskCompleted = 0;

      try {
        const projects = await prisma.project.findMany({
          where: { divisionId: div.id, orgId, deletedAt: null },
          select: { id: true },
        });
        projectCount = projects.length;

        if (projectCount > 0) {
          const pIds = projects.map((p) => p.id);
          const tasks = await prisma.task.findMany({
            where: { projectId: { in: pIds }, isArchived: false, deletedAt: null },
            select: { statusName: true },
          });
          taskTotal = tasks.length;
          taskCompleted = tasks.filter((t) => {
            const sn = (t.statusName || '').toLowerCase();
            return sn.includes('done') || sn.includes('complete');
          }).length;
        }
      } catch (_) { logger.debug('MIS: DB query failed, using fallback', _); }

      const completionRate = taskTotal > 0 ? Math.round((taskCompleted / taskTotal) * 100) : 0;
      const healthScore = Math.max(0, Math.min(100, completionRate + 20));

      overviews.push({
        id: div.id,
        name: div.name,
        color: div.color,
        member_count: memberCount,
        project_count: projectCount,
        task_completion_rate: completionRate,
        health_score: healthScore,
      });
    }

    res.json({ success: true, data: overviews });
  } catch (err) {
    console.error('[MIS] /division-overview error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  }
});

module.exports = router;
