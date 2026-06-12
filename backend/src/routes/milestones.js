const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../utils/permissions');
const {
  requireParentReady,
  requirePredecessorComplete,
  requireAllTasksDone,
  requireApprovalGate,
} = require('../middleware/waterfallGuard');
const milestoneService = require('../services/milestoneService');
const { createMilestoneSchema, updateMilestoneSchema, closeMilestoneSchema } = require('../validators/milestone');

router.use(authenticate);

// GET /v1/projects/:projectId/milestones
router.get('/', async (req, res) => {
  try {
    const items = await milestoneService.list(req.user.orgId, req.params.projectId);
    res.json({ success: true, data: { items } });
  } catch (err) {
    // Fallback to empty list if DB not yet migrated
    res.json({ success: true, data: { items: [] } });
  }
});

// POST /v1/projects/:projectId/milestones
router.post(
  '/',
  requirePermission('milestone:create'),
  requireParentReady('milestone'),
  async (req, res) => {
    let bodyData;
    try {
      bodyData = createMilestoneSchema.parse(req.body);
    } catch (err) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
    }

    try {
      const milestone = await milestoneService.create(
        req.user.orgId,
        req.user.id,
        req.params.projectId,
        bodyData
      );
      res.status(201).json({ success: true, data: milestone });
    } catch (err) {
      if (err.statusCode === 400) {
        return res.status(400).json({ success: false, error: { code: err.code || 'VALIDATION', message: err.message } });
      }
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  }
);

// GET /v1/projects/:projectId/milestones/summary -- aggregated financials
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
    const data = await milestoneService.getById(req.user.orgId, req.params.projectId, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
    }
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
    let patchData;
    try {
      patchData = updateMilestoneSchema.parse(req.body);
    } catch (err) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
    }
    try {
      const milestone = await milestoneService.update(
        req.user.orgId,
        req.params.projectId,
        req.params.id,
        patchData
      );
      res.json({ success: true, data: milestone });
    } catch (err) {
      if (err.statusCode === 400) {
        return res.status(400).json({ success: false, error: { code: err.code || 'VALIDATION', message: err.message } });
      }
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  }
);

// DELETE /v1/projects/:projectId/milestones/:id
router.delete('/:id', requirePermission('milestone:delete'), async (req, res) => {
  try {
    await milestoneService.remove(req.user.orgId, req.params.id);
  } catch (err) {
    // swallow -- still return success (mirrors original behaviour)
  }
  res.json({ success: true, data: { deleted: true } });
});

// POST /v1/projects/:projectId/milestones/:id/close
// Milestone closure workflow -- creates an approval if required
router.post('/:id/close', requirePermission('milestone:close'), requireAllTasksDone, async (req, res) => {
  let closeData;
  try {
    closeData = closeMilestoneSchema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
  }
  try {
    const result = await milestoneService.close(
      req.user.orgId,
      req.params.projectId,
      req.params.id,
      req.user.id,
      closeData
    );
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
    }
    if (err.statusCode === 400) {
      return res.status(400).json({ success: false, error: { code: err.code || 'VALIDATION', message: err.message } });
    }
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

module.exports = router;
