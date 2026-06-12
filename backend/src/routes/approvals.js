const { Router } = require('express');
const approvalService = require('../services/approvalService');
const { authenticate, authorize } = require('../middleware/auth');
const { createApprovalSchema, approveStepSchema, rejectStepSchema } = require('../validators/approvals');

const router = Router();

router.use(authenticate);

/**
 * Create an approval request
 * POST /v1/approvals
 */
router.post('/', authorize('org_admin', 'division_admin', 'vertical_head', 'project_manager'), async (req, res, next) => {
  try {
    let data;
    try {
      data = createApprovalSchema.parse(req.body);
    } catch (err) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
    }

    const approval = await approvalService.createApproval(req.user.orgId, req.user.id, {
      workflow_id: data.workflow_id,
      title: data.title,
      description: data.description,
      content: req.body.content,
      related_task_id: req.body.related_task_id,
      related_project_id: data.related_project_id,
    });

    res.status(201).json({ success: true, data: approval });
  } catch (err) {
    next(err);
  }
});

/**
 * Get pending approvals for current user
 * GET /v1/approvals/pending
 */
router.get('/pending', async (req, res, next) => {
  try {
    const { page, page_size } = req.query;
    const result = await approvalService.listPendingApprovals(req.user.orgId, req.user.id, {
      page: parseInt(page) || 1,
      page_size: parseInt(page_size) || 20,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Get all approvals
 * GET /v1/approvals
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, page, page_size } = req.query;
    const result = await approvalService.listApprovals(req.user.orgId, req.user.id, {
      status,
      page: parseInt(page) || 1,
      page_size: parseInt(page_size) || 20,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Get approval by ID
 * GET /v1/approvals/:approvalId
 */
router.get('/:approvalId', async (req, res, next) => {
  try {
    const approval = await approvalService.getApprovalById(req.user.orgId, req.params.approvalId);
    res.json({ success: true, data: approval });
  } catch (err) {
    next(err);
  }
});

/**
 * Approve an approval step
 * POST /v1/approvals/:approvalId/approve
 */
router.post('/:approvalId/approve', authorize('org_admin', 'division_admin', 'hod', 'vertical_head', 'project_manager'), async (req, res, next) => {
  try {
    let data;
    try {
      data = approveStepSchema.parse(req.body);
    } catch (err) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
    }
    const approval = await approvalService.approveStep(req.user.orgId, req.user.id, req.params.approvalId, {
      reason: data.comment,
      step_id: data.step_id,
    });

    res.json({ success: true, data: approval });
  } catch (err) {
    next(err);
  }
});

/**
 * Reject an approval step
 * POST /v1/approvals/:approvalId/reject
 */
router.post('/:approvalId/reject', authorize('org_admin', 'division_admin', 'hod', 'vertical_head', 'project_manager'), async (req, res, next) => {
  try {
    let data;
    try {
      data = rejectStepSchema.parse(req.body);
    } catch (err) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
    }
    const approval = await approvalService.rejectStep(req.user.orgId, req.user.id, req.params.approvalId, {
      reason: data.reason,
      step_id: data.step_id,
    });

    res.json({ success: true, data: approval });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
