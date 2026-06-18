const { Router } = require('express');
const approvalService = require('../services/approvalService');
const { authenticate, authorize } = require('../middleware/auth');
const { createApprovalSchema, approveStepSchema, rejectStepSchema } = require('../validators/approvals');
const { sendApprovalRequestEmail, sendApprovalOutcomeEmail } = require('../services/emailService');
const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const FRONT = process.env.FRONTEND_URL || 'https://testmk.qci.org.in';

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

    // Fire-and-forget: notify approvers
    prisma.user.findUnique({ where: { id: req.user.id }, select: { firstName: true, lastName: true } })
      .then((requester) => {
        const requesterName = requester ? `${requester.firstName} ${requester.lastName}` : 'Someone';
        const approverRoles = ['org_admin', 'division_admin', 'vertical_head'];
        prisma.orgMember.findMany({
          where: { orgId: req.user.orgId, role: { in: approverRoles }, status: 'active' },
          include: { user: { select: { email: true, firstName: true, lastName: true } } },
          take: 10,
        }).then((members) => {
          members.forEach(({ user }) => {
            if (!user.email) return;
            sendApprovalRequestEmail({
              to: user.email,
              recipientName: `${user.firstName} ${user.lastName}`,
              title: data.title,
              requestedBy: requesterName,
              description: data.description,
              approvalUrl: `${FRONT}/admin/approvals`,
            }).catch((e) => logger.warn('Approval request email failed', e));
          });
        }).catch(() => {});
      }).catch(() => {});
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

    // Fire-and-forget: notify requester of approval
    prisma.approval.findUnique({ where: { id: req.params.approvalId }, include: { requester: { select: { email: true, firstName: true, lastName: true } } } })
      .then((appr) => {
        if (!appr?.requester?.email) return;
        prisma.user.findUnique({ where: { id: req.user.id }, select: { firstName: true, lastName: true } }).then((approver) => {
          sendApprovalOutcomeEmail({
            to: appr.requester.email,
            recipientName: `${appr.requester.firstName} ${appr.requester.lastName}`,
            title: appr.title,
            outcome: 'approved',
            approvedBy: approver ? `${approver.firstName} ${approver.lastName}` : 'A reviewer',
            comment: data.comment,
            projectUrl: `${FRONT}/admin/approvals`,
          }).catch((e) => logger.warn('Approval outcome email failed', e));
        }).catch(() => {});
      }).catch(() => {});
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

    // Fire-and-forget: notify requester of rejection
    prisma.approval.findUnique({ where: { id: req.params.approvalId }, include: { requester: { select: { email: true, firstName: true, lastName: true } } } })
      .then((appr) => {
        if (!appr?.requester?.email) return;
        prisma.user.findUnique({ where: { id: req.user.id }, select: { firstName: true, lastName: true } }).then((rejecter) => {
          sendApprovalOutcomeEmail({
            to: appr.requester.email,
            recipientName: `${appr.requester.firstName} ${appr.requester.lastName}`,
            title: appr.title,
            outcome: 'rejected',
            approvedBy: rejecter ? `${rejecter.firstName} ${rejecter.lastName}` : 'A reviewer',
            comment: data.reason,
            projectUrl: `${FRONT}/admin/approvals`,
          }).catch((e) => logger.warn('Approval rejection email failed', e));
        }).catch(() => {});
      }).catch(() => {});
  } catch (err) {
    next(err);
  }
});

module.exports = router;
