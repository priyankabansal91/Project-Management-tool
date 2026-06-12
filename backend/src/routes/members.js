const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const ApiError = require('../utils/ApiError');
const memberService = require('../services/memberService');
const { inviteMemberSchema, createDirectMemberSchema, updateRoleSchema, updateStatusSchema } = require('../validators/members');

const router = Router();
router.use(authenticate);

const VALID_ROLES = new Set(['org_admin', 'division_admin', 'hod', 'vertical_head', 'project_manager', 'team_lead', 'member', 'viewer', 'executive']);

// List members
router.get('/', async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const page_size = Math.min(Math.max(1, parseInt(req.query.page_size, 10) || 20), 500);

    const result = await memberService.list(req.user.orgId, { role, search, page, page_size });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// List pending invites
router.get('/invites', authorize('org_admin', 'division_admin'), async (req, res, next) => {
  try {
    const invites = await memberService.listInvites(req.user.orgId);
    res.json({ success: true, data: invites });
  } catch (err) { next(err); }
});

// Cancel invite
router.delete('/invites/:inviteId', authorize('org_admin'), async (req, res, next) => {
  try {
    await memberService.cancelInvite(req.user.orgId, req.params.inviteId);
    res.status(204).end();
  } catch (err) { next(err); }
});

// Invite member — sends real email via Gmail SMTP
router.post('/invite', authorize('org_admin', 'division_admin', 'vertical_head'), async (req, res, next) => {
  try {
    let data;
    try {
      data = inviteMemberSchema.parse(req.body);
    } catch (err) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
    }

    const invite = await memberService.invite(req.user.orgId, req.user.id, { email: data.email, role: data.role });
    res.status(201).json({ success: true, data: invite });
  } catch (err) { next(err); }
});

// Create member directly (no email required — admin sets password)
router.post('/create-direct', authorize('org_admin'), async (req, res, next) => {
  try {
    // Normalize snake_case fields to camelCase before validation
    const normalized = {
      ...req.body,
      firstName: req.body.firstName || req.body.first_name,
      lastName: req.body.lastName || req.body.last_name,
    };
    let data;
    try {
      data = createDirectMemberSchema.parse(normalized);
    } catch (err) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
    }
    const member = await memberService.createDirect(req.user.orgId, {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
      role: data.role,
    });
    res.status(201).json({ success: true, data: member });
  } catch (err) { next(err); }
});

// Update member role
router.patch('/:userId/role', authorize('org_admin'), async (req, res, next) => {
  try {
    let data;
    try {
      data = updateRoleSchema.parse(req.body);
    } catch (err) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
    }
    const member = await memberService.updateRole(req.user.orgId, req.params.userId, data.role);
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
});

// Update member status (suspend/reactivate)
router.patch('/:userId/status', authorize('org_admin'), async (req, res, next) => {
  try {
    let data;
    try {
      data = updateStatusSchema.parse(req.body);
    } catch (err) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
    }
    const member = await memberService.updateStatus(req.user.orgId, req.params.userId, data.status);
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
});

// Remove member
router.delete('/:userId', authorize('org_admin'), async (req, res, next) => {
  try {
    await memberService.remove(req.user.orgId, req.user.id, req.params.userId);
    res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
