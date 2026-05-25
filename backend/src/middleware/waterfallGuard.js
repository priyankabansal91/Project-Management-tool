const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function requireParentReady(entityType) {
  return async (req, res, next) => {
    try {
      if (entityType === 'vertical') {
        const divisionId = req.body.divisionId || req.body.division_id;
        if (!divisionId) return next();
        const division = await prisma.division.findUnique({ where: { id: divisionId } });
        if (!division) return res.status(404).json({ error: 'Division not found' });
        if (division.setupStatus !== 'ACTIVE') {
          return res.status(403).json({
            error: 'Parent division is not active',
            code: 'PARENT_NOT_READY',
            details: { divisionId, setupStatus: division.setupStatus }
          });
        }
      } else if (entityType === 'project') {
        const verticalId = req.body.verticalId || req.body.vertical_id;
        if (!verticalId) return next();
        const vertical = await prisma.vertical.findUnique({ where: { id: verticalId } });
        if (!vertical) return res.status(404).json({ error: 'Vertical not found' });
        if (vertical.lifecycleStatus !== 'ACTIVE') {
          return res.status(403).json({
            error: 'Parent vertical is not active',
            code: 'PARENT_NOT_READY',
            details: { verticalId, lifecycleStatus: vertical.lifecycleStatus }
          });
        }
      } else if (entityType === 'milestone') {
        const projectId = req.params.projectId || req.body.projectId || req.body.project_id;
        if (!projectId) return next();
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (project.phase !== 'ACTIVE') {
          return res.status(403).json({
            error: 'Parent project is not in ACTIVE phase',
            code: 'PARENT_NOT_READY',
            details: { projectId, phase: project.phase }
          });
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

async function requirePredecessorComplete(req, res, next) {
  try {
    const milestoneId = req.params.id || req.params.milestoneId;
    if (!milestoneId) return next();

    // Only applies when starting a milestone (waterfallStatus → IN_PROGRESS)
    const requestedStatus = req.body.waterfallStatus;
    if (requestedStatus !== 'IN_PROGRESS') return next();

    const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!milestone || !milestone.predecessorId) return next();

    const predecessor = await prisma.milestone.findUnique({ where: { id: milestone.predecessorId } });
    if (predecessor && predecessor.waterfallStatus !== 'COMPLETED') {
      return res.status(403).json({
        error: 'Predecessor milestone must be COMPLETED before this milestone can start',
        code: 'PREDECESSOR_NOT_COMPLETE',
        details: { predecessorId: milestone.predecessorId, predecessorStatus: predecessor.waterfallStatus }
      });
    }
    next();
  } catch (err) {
    next(err);
  }
}

async function requireAllTasksDone(req, res, next) {
  try {
    const milestoneId = req.params.id || req.params.milestoneId;
    if (!milestoneId) return next();

    const incompleteTasks = await prisma.task.count({
      where: {
        milestoneId,
        statusName: { notIn: ['done', 'completed', 'closed', 'Done', 'Completed', 'Closed'] },
        isArchived: false,
        deletedAt: null
      }
    });

    if (incompleteTasks > 0) {
      return res.status(403).json({
        error: `Cannot close milestone: ${incompleteTasks} task(s) not yet completed`,
        code: 'TASKS_INCOMPLETE',
        details: { incompleteTasks }
      });
    }
    next();
  } catch (err) {
    next(err);
  }
}

function requireApprovalGate(fromStatus, toStatus) {
  return async (req, res, next) => {
    try {
      const milestoneId = req.params.id || req.params.milestoneId;
      const requestedStatus = req.body.waterfallStatus;
      if (requestedStatus !== toStatus) return next();

      const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
      if (!milestone || milestone.waterfallStatus !== fromStatus) return next();

      const approvedApproval = await prisma.approval.findFirst({
        where: { relatedMilestoneId: milestoneId, status: 'approved' }
      });

      if (!approvedApproval) {
        return res.status(403).json({
          error: `Approval required to advance milestone from ${fromStatus} to ${toStatus}`,
          code: 'APPROVAL_REQUIRED',
          details: { milestoneId, fromStatus, toStatus }
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireParentReady, requirePredecessorComplete, requireAllTasksDone, requireApprovalGate };
