const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const ApiError = require('../utils/ApiError');
const memberService = require('../services/memberService');

const router = Router();
router.use(authenticate);

const VALID_ROLES = new Set(['org_admin', 'division_admin', 'project_manager', 'member', 'viewer', 'executive']);

// List members
router.get('/', async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const page_size = Math.min(Math.max(1, parseInt(req.query.page_size, 10) || 20), 100);

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
router.post('/invite', authorize('org_admin', 'division_admin'), async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'email is required' } });
    if (role && !VALID_ROLES.has(role)) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid role' } });

    const invite = await memberService.invite(req.user.orgId, req.user.id, { email, role });
    res.status(201).json({ success: true, data: invite });
  } catch (err) { next(err); }
});

// Update member role
router.patch('/:userId/role', authorize('org_admin'), async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role || !VALID_ROLES.has(role)) throw ApiError.badRequest('Invalid role');
    const member = await memberService.updateRole(req.user.orgId, req.params.userId, role);
    res.json({ success: true, data: member });
  } catch (err) { next(err); }
});

// Update member status (suspend/reactivate)
router.patch('/:userId/status', authorize('org_admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'inactive'].includes(status)) throw ApiError.badRequest('Invalid status');
    const member = await memberService.updateStatus(req.user.orgId, req.params.userId, status);
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
