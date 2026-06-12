const prisma = require('../config/prisma');
const logger = require('../utils/logger');

/**
 * Validate that the new expense heads for a milestone don't cause any head
 * to exceed the corresponding project-level expense head budget.
 * Returns an array of violation objects (empty = OK), or null if no project heads defined.
 */
async function validateExpenseHeads(projectId, orgId, newExpenseHeads, excludeMilestoneId = null) {
  if (!Array.isArray(newExpenseHeads) || newExpenseHeads.length === 0) return null;

  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
    select: { expenseHeads: true },
  }).catch((err) => { logger.debug('Optional project query failed', err); return null; });

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
  const others = await prisma.milestone.findMany({ where, select: { expenseHeads: true } })
    .catch((err) => { logger.debug('Optional milestone query failed', err); return []; });

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

/**
 * List milestones for a project with aggregated effort/task counts.
 */
async function list(orgId, projectId) {
  const milestones = await prisma.milestone.findMany({
    where: { projectId, orgId },
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

  return milestones.map((m) => {
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
}

/**
 * Fetch a single milestone with full task/project details.
 */
async function getById(orgId, projectId, milestoneId) {
  const milestone = await prisma.milestone.findFirst({
    where: { id: milestoneId, projectId, orgId },
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
    const err = new Error('Milestone not found');
    err.statusCode = 404;
    throw err;
  }

  const totalLoggedHours = milestone.tasks.reduce((s, t) => s + Number(t.loggedHours || 0), 0);
  const totalEstimatedHours = milestone.tasks.reduce((s, t) => s + Number(t.estimatedHours || 0), 0);

  return {
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
  };
}

/**
 * Create a milestone, validate budget against project, validate expense heads.
 * Throws with statusCode on validation errors.
 */
async function create(orgId, userId, projectId, data) {
  const {
    title, description, status = 'pending', progress = 0,
    startDate, dueDate, budget, actualBudget, budgetLocked = false, expenseHeads,
    effortEstimate, milestoneType = 'general', approvalRequired = false, currency = 'INR',
    waterfallStatus,
  } = data;

  if (!title) {
    const err = new Error('title is required');
    err.statusCode = 400;
    err.code = 'VALIDATION';
    throw err;
  }
  if (!budget || isNaN(parseFloat(budget)) || parseFloat(budget) <= 0) {
    const err = new Error('budget is required and must be greater than 0');
    err.statusCode = 400;
    err.code = 'VALIDATION';
    throw err;
  }

  // Validate milestone budget doesn't exceed project's remaining budget
  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId },
    select: { budget: true },
  }).catch((err) => { logger.warn('Project budget query failed', err); return null; });

  if (project?.budget) {
    const existingMilestones = await prisma.milestone.findMany({
      where: { projectId },
      select: { budget: true, id: true },
    }).catch((err) => { logger.debug('Optional milestone query failed', err); return []; });
    const usedBudget = existingMilestones.reduce((s, m) => s + Number(m.budget || 0), 0);
    const projectBudget = Number(project.budget);
    if (usedBudget + parseFloat(budget) > projectBudget) {
      const remaining = projectBudget - usedBudget;
      const err = new Error(
        `Milestone budget exceeds project remaining budget. Project total: ₹${projectBudget.toLocaleString('en-IN')}, Already allocated: ₹${usedBudget.toLocaleString('en-IN')}, Remaining: ₹${remaining.toLocaleString('en-IN')}`
      );
      err.statusCode = 400;
      err.code = 'BUDGET_EXCEEDED';
      throw err;
    }
  }

  // Validate expense heads don't exceed project-level head budgets
  if (expenseHeads && Array.isArray(expenseHeads) && expenseHeads.length > 0) {
    const ehViolations = await validateExpenseHeads(projectId, orgId, expenseHeads);
    if (ehViolations && ehViolations.length > 0) {
      const details = ehViolations.map(v =>
        `"${v.label}": limit ₹${v.limit.toLocaleString('en-IN')}, already allocated ₹${v.existing.toLocaleString('en-IN')}, adding ₹${v.adding.toLocaleString('en-IN')} (exceeds by ₹${(v.total - v.limit).toLocaleString('en-IN')})`
      ).join('; ');
      const err = new Error(`Milestone expense heads exceed project budget: ${details}`);
      err.statusCode = 400;
      err.code = 'EXPENSE_HEAD_EXCEEDED';
      throw err;
    }
  }

  // Auto-assign sequenceOrder and predecessorId
  const lastMilestone = await prisma.milestone.findFirst({
    where: { projectId },
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
      projectId,
      orgId,
      createdBy: userId,
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

  return milestone;
}

/**
 * Update a milestone, re-validating budget and expense heads if changed.
 * Throws with statusCode on validation errors.
 */
async function update(orgId, projectId, milestoneId, data) {
  const {
    title, description, status, progress,
    startDate, dueDate, budget, actualBudget, budgetLocked, expenseHeads,
    effortEstimate, milestoneType, approvalRequired, currency,
    waterfallStatus, blockedReason,
  } = data;

  const patch = {};
  if (title !== undefined) patch.title = title;
  if (description !== undefined) patch.description = description;
  if (status !== undefined) patch.status = status;
  if (progress !== undefined) patch.progress = progress;
  if (startDate !== undefined) patch.startDate = startDate ? new Date(startDate) : null;
  if (dueDate !== undefined) patch.dueDate = dueDate ? new Date(dueDate) : null;
  if (budget !== undefined) patch.budget = budget ? parseFloat(budget) : null;
  if (actualBudget !== undefined) patch.actualBudget = actualBudget ? parseFloat(actualBudget) : null;
  if (budgetLocked !== undefined) patch.budgetLocked = Boolean(budgetLocked);
  if (expenseHeads !== undefined) patch.expenseHeads = expenseHeads;
  if (effortEstimate !== undefined) patch.effortEstimate = effortEstimate ? parseFloat(effortEstimate) : null;
  if (milestoneType !== undefined) patch.milestoneType = milestoneType;
  if (approvalRequired !== undefined) patch.approvalRequired = Boolean(approvalRequired);
  if (currency !== undefined) patch.currency = currency;
  if (waterfallStatus !== undefined) patch.waterfallStatus = waterfallStatus;
  if (blockedReason !== undefined) patch.blockedReason = blockedReason;
  if (status === 'completed' || waterfallStatus === 'COMPLETED') patch.completedAt = new Date();

  // Validate updated budget doesn't push total over project budget
  if (budget !== undefined && budget) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, orgId },
      select: { budget: true },
    }).catch((err) => { logger.debug('Optional project query failed', err); return null; });
    if (project?.budget) {
      const existingMilestones = await prisma.milestone.findMany({
        where: { projectId, id: { not: milestoneId } },
        select: { budget: true },
      }).catch((err) => { logger.debug('Optional milestone query failed', err); return []; });
      const otherBudget = existingMilestones.reduce((s, m) => s + Number(m.budget || 0), 0);
      if (otherBudget + parseFloat(budget) > Number(project.budget)) {
        const remaining = Number(project.budget) - otherBudget;
        const err = new Error(`Milestone budget exceeds remaining project budget. Remaining available: ₹${remaining.toLocaleString('en-IN')}`);
        err.statusCode = 400;
        err.code = 'BUDGET_EXCEEDED';
        throw err;
      }
    }
  }

  // Validate expense heads don't exceed project-level head budgets
  if (expenseHeads !== undefined && Array.isArray(expenseHeads) && expenseHeads.length > 0) {
    const ehViolations = await validateExpenseHeads(projectId, orgId, expenseHeads, milestoneId);
    if (ehViolations && ehViolations.length > 0) {
      const details = ehViolations.map(v =>
        `"${v.label}": limit ₹${v.limit.toLocaleString('en-IN')}, already allocated ₹${v.existing.toLocaleString('en-IN')}, adding ₹${v.adding.toLocaleString('en-IN')} (exceeds by ₹${(v.total - v.limit).toLocaleString('en-IN')})`
      ).join('; ');
      const err = new Error(`Milestone expense heads exceed project budget: ${details}`);
      err.statusCode = 400;
      err.code = 'EXPENSE_HEAD_EXCEEDED';
      throw err;
    }
  }

  // If planned budget is locked, prevent changes to it
  if (budget !== undefined) {
    const existing = await prisma.milestone.findFirst({
      where: { id: milestoneId },
      select: { budgetLocked: true },
    }).catch((err) => { logger.debug('Optional milestone query failed', err); return null; });
    if (existing?.budgetLocked) {
      delete patch.budget;
    }
  }

  const milestone = await prisma.milestone.update({ where: { id: milestoneId }, data: patch });

  // Auto-unblock the next milestone when this one completes
  if (waterfallStatus === 'COMPLETED' || status === 'completed') {
    await prisma.milestone.updateMany({
      where: { predecessorId: milestoneId, waterfallStatus: 'BLOCKED' },
      data: { waterfallStatus: 'NOT_STARTED', blockedReason: null },
    });
  }

  return milestone;
}

/**
 * Delete a milestone.
 */
async function remove(orgId, milestoneId) {
  const { count } = await prisma.milestone.deleteMany({
    where: { id: milestoneId, orgId },
  });
  if (count === 0) {
    const err = new Error('Milestone not found or no permission');
    err.statusCode = 404;
    throw err;
  }
  return { deleted: true };
}

/**
 * Close a milestone — creates an approval request if required, else closes immediately.
 */
async function close(orgId, projectId, milestoneId, userId, data) {
  const { completionNotes } = data || {};

  const milestone = await prisma.milestone.findFirst({
    where: { id: milestoneId, projectId, orgId },
  });
  if (!milestone) {
    const err = new Error('Milestone not found');
    err.statusCode = 404;
    throw err;
  }
  if (milestone.status === 'completed') {
    const err = new Error('Milestone is already closed');
    err.statusCode = 400;
    err.code = 'ALREADY_CLOSED';
    throw err;
  }

  if (milestone.approvalRequired) {
    // Create approval request — do NOT close milestone yet
    const approval = await prisma.approval.create({
      data: {
        orgId,
        requestedBy: userId,
        entityType: 'milestone',
        entityId: milestone.id,
        relatedMilestoneId: milestone.id,
        title: `Milestone Closure: ${milestone.title}`,
        description: completionNotes || `Requesting closure of milestone: ${milestone.title}`,
        status: 'pending',
        workflowType: 'milestone_closure',
      },
    }).catch((err) => { logger.debug('Optional approval create failed', err); return null; });

    if (approval) {
      await prisma.milestone.update({
        where: { id: milestone.id },
        data: { status: 'review', approvalId: approval.id, waterfallStatus: 'PENDING_APPROVAL' },
      }).catch((err) => logger.warn('Milestone status update after approval failed', err));
      return { status: 'pending_approval', approvalId: approval?.id };
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

  return { status: 'completed' };
}

module.exports = { list, getById, create, update, remove, close, validateExpenseHeads };
