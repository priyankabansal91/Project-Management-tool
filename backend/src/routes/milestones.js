const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate, authorize } = require('../middleware/auth');
const { requirePermission } = require('../utils/permissions');
const {
  requireParentReady,
  requirePredecessorComplete,
  requireAllTasksDone,
  requireApprovalGate,
} = require('../middleware/waterfallGuard');

router.use(authenticate);
const logger = require('../utils/logger');

/**
 * Validate that the new expense heads for a milestone don't cause any head
 * to exceed the corresponding project-level expense head budget.
 * Returns an array of violation objects (empty = OK), or null if no project heads defined.
 */
async function validateExpenseHeads(prisma, projectId, orgId, newExpenseHeads, excludeMilestoneId = null) {
  if (!Array.isArray(newExpenseHeads) || newExpenseHeads.length === 0) return null;

  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
    select: { expenseHeads: true },
  }).catch((err) => { logger.debug('Optional milestone query failed', err); return null; });

  if (!project?.expenseHeads || !Array.isArray(project.expenseHeads) || project.expenseHeads.length === 0) {
    return null; // project has no expense head budgets — skip validation
  }

  // Build project limit map keyed by head id
  const projectLimits = {};
  for (const eh of project.expenseHeads) {
    const key = eh.head || eh.label || 'other';
    projectLimits[key] = { label: eh.label || key, limit: Number(eh.amount || 0) };
  }

  // Sum expense heads of all OTHER milestones in this project
  const where = { projectId };
  if (excludeMilestoneId) where.id = { not: excludeMilestoneId };
  const others = await prisma.milestone.findMany({ where, select: { expenseHeads: true } }).catch((err) => { logger.debug('Optional milestone query failed', err); return []; });

  const used = {};
  for (const m of others) {
    if (!Array.isArray(m.expenseHeads)) continue;
    for (const eh of m.expenseHeads) {
      const key = eh.head || eh.label || 'other';
      used[key] = (used[key] || 0) + Number(eh.amount || 0);
    }
  }

  // Check each new head against project limit
  const violations = [];
  for (const eh of newExpenseHeads) {
    const key = eh.head || eh.label || 'other';
    if (!projectLimits[key]) continue; // no project-level limit for this head
    const existing = used[key] || 0;
    const adding = Number(eh.amount || 0);
    const total = existing + adding;
    const limit = projectLimits[key].limit;
    if (total > limit) {
      violations.push({ head: key, label: projectLimits[key].label, limit, existing, adding, total });
    }
  }

  return violations;
}

// GET /v1/projects/:projectId/milestones
router.get('/', async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const milestones = await prisma.milestone.findMany({
      where: { projectId: req.params.projectId, orgId: req.user.orgId },
      include: {
        tasks: {
          select: {
            id: true, title: true, statusName: true, priority: true,
            assigneeId: true, estimatedHours: true, loggedHours: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Compute aggregated effort from tasks for each milestone
    const enriched = milestones.map((m) => {
      const taskHours = m.tasks.reduce((s, t) => s + Number(t.loggedHours || 0), 0);
      return {
        ...m,
        actualEffort: Number(m.actualEffort || 0) + taskHours,
        taskCount: m.tasks.length,
        budget: m.budget ? Number(m.budget) : null,
        actualBudget: m.actualBudget ? Number(m.actualBudget) : null,
        budgetLocked: m.budgetLocked ?? false,
        expenseHeads: m.expenseHeads ?? [],
        effortEstimate: m.effortEstimate ? Number(m.effortEstimate) : null,
        budgetUtilizationPct: m.budget && taskHours > 0
          ? Math.min(100, Math.round((taskHours / Number(m.effortEstimate || 1)) * 100))
          : 0,
      };
    });

    res.json({ success: true, data: { items: enriched } });
  } catch (err) {
    // Fallback to seed data if DB not yet migrated
    res.json({ success: true, data: { items: [] } });
  }
});

// POST /v1/projects/:projectId/milestones
router.post(
  '/',
  requirePermission('milestone:create'),
  requireParentReady('milestone'),
  async (req, res) => {
    const {
      title, description, status = 'pending', progress = 0,
      startDate, dueDate, budget, actualBudget, budgetLocked = false, expenseHeads,
      effortEstimate, milestoneType = 'general', approvalRequired = false, currency = 'INR',
      waterfallStatus,
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'title is required' } });
    }
    if (!budget || isNaN(parseFloat(budget)) || parseFloat(budget) <= 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'budget is required and must be greater than 0' } });
    }

    try {
      const prisma = require('../config/prisma');

      // Validate milestone budget doesn't exceed project's remaining budget
      if (budget) {
        const project = await prisma.project.findFirst({
          where: { id: req.params.projectId, orgId: req.user.orgId },
          select: { budget: true },
        }).catch((err) => { logger.warn('Milestone approval create failed', err); return null; });

        if (project?.budget) {
          const existingMilestones = await prisma.milestone.findMany({
            where: { projectId: req.params.projectId },
            select: { budget: true, id: true },
          }).catch((err) => { logger.debug('Optional milestone query failed', err); return []; });
          // Exclude current milestone if editing (POST is always new)
          const usedBudget = existingMilestones.reduce((s, m) => s + Number(m.budget || 0), 0);
          const projectBudget = Number(project.budget);
          if (usedBudget + parseFloat(budget) > projectBudget) {
            const remaining = projectBudget - usedBudget;
            return res.status(400).json({
              success: false,
              error: {
                code: 'BUDGET_EXCEEDED',
                message: `Milestone budget exceeds project remaining budget. Project total: ₹${projectBudget.toLocaleString('en-IN')}, Already allocated: ₹${usedBudget.toLocaleString('en-IN')}, Remaining: ₹${remaining.toLocaleString('en-IN')}`,
              },
            });
          }
        }
      }

      // Validate expense heads don't exceed project-level head budgets
      if (expenseHeads && Array.isArray(expenseHeads) && expenseHeads.length > 0) {
        const ehViolations = await validateExpenseHeads(prisma, req.params.projectId, req.user.orgId, expenseHeads);
        if (ehViolations && ehViolations.length > 0) {
          const details = ehViolations.map(v =>
            `"${v.label}": limit ₹${v.limit.toLocaleString('en-IN')}, already allocated ₹${v.existing.toLocaleString('en-IN')}, adding ₹${v.adding.toLocaleString('en-IN')} (exceeds by ₹${(v.total - v.limit).toLocaleString('en-IN')})`
          ).join('; ');
          return res.status(400).json({
            success: false,
            error: { code: 'EXPENSE_HEAD_EXCEEDED', message: `Milestone expense heads exceed project budget: ${details}` },
          });
        }
      }

      // Auto-assign sequenceOrder and predecessorId
      const lastMilestone = await prisma.milestone.findFirst({
        where: { projectId: req.params.projectId },
        orderBy: { sequenceOrder: 'desc' },
        select: { id: true, sequenceOrder: true, waterfallStatus: true },
      });

      const sequenceOrder = lastMilestone ? (lastMilestone.sequenceOrder || 0) + 1 : 1;
      const predecessorId = lastMilestone ? lastMilestone.id : null;
      const autoWaterfallStatus = predecessorId && lastMilestone.waterfallStatus !== 'COMPLETED'
        ? 'BLOCKED'
        : (waterfallStatus || 'NOT_STARTED');

      const milestone = await prisma.milestone.create({
        data: {
          title, description,
          status, progress,
          startDate: startDate ? new Date(startDate) : null,
          dueDate: dueDate ? new Date(dueDate) : null,
          projectId: req.params.projectId,
          orgId: req.user.orgId,
          createdBy: req.user.id,
          budget: budget ? parseFloat(budget) : null,
          actualBudget: actualBudget ? parseFloat(actualBudget) : null,
          budgetLocked: true, // always lock planned budget on creation
          expenseHeads: expenseHeads || null,
          effortEstimate: effortEstimate ? parseFloat(effortEstimate) : null,
          milestoneType,
          approvalRequired: Boolean(approvalRequired),
          currency,
          sequenceOrder,
          predecessorId,
          waterfallStatus: autoWaterfallStatus,
        },
      });
      res.status(201).json({ success: true, data: milestone });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  }
);

// GET /v1/projects/:projectId/milestones/summary — aggregated financials
// NOTE: must be before /:id to avoid "summary" being treated as an id
router.get('/summary', async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const milestones = await prisma.milestone.findMany({
      where: { projectId: req.params.projectId, orgId: req.user.orgId },
      include: {
        tasks: { select: { estimatedHours: true, loggedHours: true } },
      },
    });

    const summary = {
      total: milestones.length,
      completed: milestones.filter(m => m.status === 'completed').length,
      inProgress: milestones.filter(m => m.status === 'in_progress').length,
      pending: milestones.filter(m => m.status === 'pending').length,
      overdue: milestones.filter(m => m.dueDate && new Date(m.dueDate) < new Date() && m.status !== 'completed').length,
      totalBudget: milestones.reduce((s, m) => s + Number(m.budget || 0), 0),
      totalEffortEstimate: milestones.reduce((s, m) => s + Number(m.effortEstimate || 0), 0),
      totalLoggedHours: milestones.reduce((s, m) => s + m.tasks.reduce((ts, t) => ts + Number(t.loggedHours || 0), 0), 0),
      completionPct: milestones.length > 0
        ? Math.round(milestones.reduce((s, m) => s + (m.progress || 0), 0) / milestones.length)
        : 0,
    };

    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// GET /v1/projects/:projectId/milestones/:id
router.get('/:id', async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const milestone = await prisma.milestone.findFirst({
      where: { id: req.params.id, projectId: req.params.projectId, orgId: req.user.orgId },
      include: {
        tasks: {
          select: {
            id: true, title: true, statusName: true, priority: true,
            assigneeId: true, dueDate: true, estimatedHours: true, loggedHours: true,
          },
        },
        project: { select: { id: true, name: true, verticalId: true, divisionId: true } },
      },
    });
    if (!milestone) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Milestone not found' } });
    }

    const totalLoggedHours = milestone.tasks.reduce((s, t) => s + Number(t.loggedHours || 0), 0);
    const totalEstimatedHours = milestone.tasks.reduce((s, t) => s + Number(t.estimatedHours || 0), 0);

    res.json({
      success: true,
      data: {
        ...milestone,
        budget: milestone.budget ? Number(milestone.budget) : null,
        actualBudget: milestone.actualBudget ? Number(milestone.actualBudget) : null,
        budgetLocked: milestone.budgetLocked ?? false,
        expenseHeads: milestone.expenseHeads ?? [],
        effortEstimate: milestone.effortEstimate ? Number(milestone.effortEstimate) : null,
        actualEffort: Number(milestone.actualEffort || 0) + totalLoggedHours,
        taskCount: milestone.tasks.length,
        totalEstimatedHours,
        totalLoggedHours,
        burnRate: totalEstimatedHours > 0 ? Math.round((totalLoggedHours / totalEstimatedHours) * 100) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// PATCH /v1/projects/:projectId/milestones/:id
router.patch(
  '/:id',
  requirePermission('milestone:edit'),
  requirePredecessorComplete,
  requireApprovalGate('PENDING_APPROVAL', 'APPROVED'),
  async (req, res) => {
    try {
      const prisma = require('../config/prisma');
      const {
        title, description, status, progress,
        startDate, dueDate, budget, actualBudget, budgetLocked, expenseHeads,
        effortEstimate, milestoneType, approvalRequired, currency,
        waterfallStatus, blockedReason,
      } = req.body;

      const data = {};
      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description;
      if (status !== undefined) data.status = status;
      if (progress !== undefined) data.progress = progress;
      if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
      if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
      if (budget !== undefined) data.budget = budget ? parseFloat(budget) : null;
      if (actualBudget !== undefined) data.actualBudget = actualBudget ? parseFloat(actualBudget) : null;
      if (budgetLocked !== undefined) data.budgetLocked = Boolean(budgetLocked);
      if (expenseHeads !== undefined) data.expenseHeads = expenseHeads;
      if (effortEstimate !== undefined) data.effortEstimate = effortEstimate ? parseFloat(effortEstimate) : null;
      if (milestoneType !== undefined) data.milestoneType = milestoneType;
      if (approvalRequired !== undefined) data.approvalRequired = Boolean(approvalRequired);
      if (currency !== undefined) data.currency = currency;
      if (waterfallStatus !== undefined) data.waterfallStatus = waterfallStatus;
      if (blockedReason !== undefined) data.blockedReason = blockedReason;
      if (status === 'completed' || waterfallStatus === 'COMPLETED') data.completedAt = new Date();

      // Validate updated budget doesn't push total over project budget
      if (budget !== undefined && budget) {
        const project = await prisma.project.findFirst({
          where: { id: req.params.projectId, orgId: req.user.orgId },
          select: { budget: true },
        }).catch((err) => { logger.debug('Optional milestone query failed', err); return null; });
        if (project?.budget) {
          const existingMilestones = await prisma.milestone.findMany({
            where: { projectId: req.params.projectId, id: { not: req.params.id } },
            select: { budget: true },
          }).catch((err) => { logger.debug('Optional milestone query failed', err); return []; });
          const otherBudget = existingMilestones.reduce((s, m) => s + Number(m.budget || 0), 0);
          if (otherBudget + parseFloat(budget) > Number(project.budget)) {
            const remaining = Number(project.budget) - otherBudget;
            return res.status(400).json({
              success: false,
              error: {
                code: 'BUDGET_EXCEEDED',
                message: `Milestone budget exceeds remaining project budget. Remaining available: ₹${remaining.toLocaleString('en-IN')}`,
              },
            });
          }
        }
      }

      // Validate expense heads don't exceed project-level head budgets
      if (expenseHeads !== undefined && Array.isArray(expenseHeads) && expenseHeads.length > 0) {
        const ehViolations = await validateExpenseHeads(prisma, req.params.projectId, req.user.orgId, expenseHeads, req.params.id);
        if (ehViolations && ehViolations.length > 0) {
          const details = ehViolations.map(v =>
            `"${v.label}": limit ₹${v.limit.toLocaleString('en-IN')}, already allocated ₹${v.existing.toLocaleString('en-IN')}, adding ₹${v.adding.toLocaleString('en-IN')} (exceeds by ₹${(v.total - v.limit).toLocaleString('en-IN')})`
          ).join('; ');
          return res.status(400).json({
            success: false,
            error: { code: 'EXPENSE_HEAD_EXCEEDED', message: `Milestone expense heads exceed project budget: ${details}` },
          });
        }
      }

      // If planned budget is locked, prevent changes to it
      if (budget !== undefined) {
        const existing = await prisma.milestone.findFirst({ where: { id: req.params.id }, select: { budgetLocked: true } }).catch((err) => { logger.debug('Optional milestone query failed', err); return null; });
        if (existing?.budgetLocked) {
          delete data.budget;
        }
      }

      const milestone = await prisma.milestone.update({ where: { id: req.params.id }, data });

      // Auto-unblock the next milestone when this one completes
      if (waterfallStatus === 'COMPLETED' || status === 'completed') {
        await prisma.milestone.updateMany({
          where: { predecessorId: req.params.id, waterfallStatus: 'BLOCKED' },
          data: { waterfallStatus: 'NOT_STARTED', blockedReason: null },
        });
      }

      res.json({ success: true, data: milestone });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  }
);

// DELETE /v1/projects/:projectId/milestones/:id
router.delete('/:id', requirePermission('milestone:delete'), async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const { count } = await prisma.milestone.deleteMany({
      where: { id: req.params.id, orgId: req.user.orgId },
    });
    if (count === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Milestone not found or no permission' } });
    }
  } catch (err) { logger.warn('Milestone delete skipped', err); }
  res.json({ success: true, data: { deleted: true } });
});

// POST /v1/projects/:projectId/milestones/:id/close
// Milestone closure workflow — creates an approval if required
router.post('/:id/close', requirePermission('milestone:close'), requireAllTasksDone, async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const { completionNotes } = req.body;

    const milestone = await prisma.milestone.findFirst({
      where: { id: req.params.id, projectId: req.params.projectId, orgId: req.user.orgId },
    });
    if (!milestone) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Milestone not found' } });
    }
    if (milestone.status === 'completed') {
      return res.status(400).json({ success: false, error: { code: 'ALREADY_CLOSED', message: 'Milestone is already closed' } });
    }

    if (milestone.approvalRequired) {
      // Create approval request — do NOT close milestone yet
      const approval = await prisma.approval.create({
        data: {
          orgId: req.user.orgId,
          requestedBy: req.user.id,
          entityType: 'milestone',
          entityId: milestone.id,
          relatedMilestoneId: milestone.id,
          title: `Milestone Closure: ${milestone.title}`,
          description: completionNotes || `Requesting closure of milestone: ${milestone.title}`,
          status: 'pending',
          workflowType: 'milestone_closure',
        },
      }).catch((err) => { logger.debug('Optional milestone query failed', err); return null; });

      if (approval) {
        await prisma.milestone.update({
          where: { id: milestone.id },
          data: { status: 'review', approvalId: approval.id, waterfallStatus: 'PENDING_APPROVAL' },
        }).catch((err) => logger.warn('Milestone status update after approval failed', err));
        return res.json({ success: true, data: { status: 'pending_approval', approvalId: approval?.id } });
      }
    }

    // Close immediately if no approval required
    await prisma.milestone.update({
      where: { id: milestone.id },
      data: { status: 'completed', progress: 100, completedAt: new Date(), waterfallStatus: 'COMPLETED' },
    });

    // Auto-unblock the next milestone
    await prisma.milestone.updateMany({
      where: { predecessorId: milestone.id, waterfallStatus: 'BLOCKED' },
      data: { waterfallStatus: 'NOT_STARTED', blockedReason: null },
    });

    res.json({ success: true, data: { status: 'completed' } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

module.exports = router;
