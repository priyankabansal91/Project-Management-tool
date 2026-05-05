const { Router } = require('express');
const svc = require('../services/approvalGroupService');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();
router.use(authenticate);

// ── Groups ────────────────────────────────────────────────────────────────────

/**
 * GET /v1/approval-groups
 * List all groups for the org (with members + step count)
 */
router.get('/', async (req, res, next) => {
  try {
    const groups = await svc.listGroups(req.user.orgId);
    res.json({ success: true, data: groups });
  } catch (err) { next(err); }
});

/**
 * POST /v1/approval-groups
 * Create a new group — org_admin only
 */
router.post('/', authorize('org_admin'), async (req, res, next) => {
  try {
    const { name, description, approvalType, quorumCount, slaHours } = req.body;
    const group = await svc.createGroup(req.user.orgId, req.user.id, { name, description, approvalType, quorumCount, slaHours });
    res.status(201).json({ success: true, data: group });
  } catch (err) { next(err); }
});

/**
 * PATCH /v1/approval-groups/:groupId
 * Update group settings — org_admin only
 */
router.patch('/:groupId', authorize('org_admin'), async (req, res, next) => {
  try {
    const group = await svc.updateGroup(req.user.orgId, req.user.id, req.params.groupId, req.body);
    res.json({ success: true, data: group });
  } catch (err) { next(err); }
});

/**
 * DELETE /v1/approval-groups/:groupId
 * Delete group — org_admin only (blocked if assigned to active steps)
 */
router.delete('/:groupId', authorize('org_admin'), async (req, res, next) => {
  try {
    await svc.deleteGroup(req.user.orgId, req.user.id, req.params.groupId);
    res.json({ success: true, data: { deleted: true } });
  } catch (err) { next(err); }
});

// ── Members ───────────────────────────────────────────────────────────────────

/**
 * POST /v1/approval-groups/:groupId/members
 * Add a member to a group — org_admin only
 */
router.post('/:groupId/members', authorize('org_admin'), async (req, res, next) => {
  try {
    const { userId, title, orgRole } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });
    const member = await svc.addMember(req.user.orgId, req.user.id, req.params.groupId, { userId, title, orgRole });
    res.status(201).json({ success: true, data: member });
  } catch (err) { next(err); }
});

/**
 * DELETE /v1/approval-groups/:groupId/members/:userId
 * Remove a member from a group — org_admin only
 */
router.delete('/:groupId/members/:userId', authorize('org_admin'), async (req, res, next) => {
  try {
    await svc.removeMember(req.user.orgId, req.user.id, req.params.groupId, req.params.userId);
    res.json({ success: true, data: { removed: true } });
  } catch (err) { next(err); }
});

// ── Workflow Steps (configuration) ────────────────────────────────────────────

/**
 * GET /v1/approval-groups/steps
 * List all workflow steps (ordered)
 */
router.get('/steps', async (req, res, next) => {
  try {
    const steps = await svc.listSteps(req.user.orgId);
    res.json({ success: true, data: steps });
  } catch (err) { next(err); }
});

/**
 * PUT /v1/approval-groups/steps
 * Create or update a workflow step — org_admin only
 */
router.put('/steps', authorize('org_admin'), async (req, res, next) => {
  try {
    const step = await svc.upsertStep(req.user.orgId, req.user.id, req.body);
    res.json({ success: true, data: step });
  } catch (err) { next(err); }
});

/**
 * DELETE /v1/approval-groups/steps/:stepId
 * Delete a workflow step — org_admin only
 */
router.delete('/steps/:stepId', authorize('org_admin'), async (req, res, next) => {
  try {
    await svc.deleteStep(req.user.orgId, req.user.id, req.params.stepId);
    res.json({ success: true, data: { deleted: true } });
  } catch (err) { next(err); }
});

// ── Instances ─────────────────────────────────────────────────────────────────

/**
 * GET /v1/approval-groups/queue
 * Pending workflow instances for the current user (across their groups)
 */
router.get('/queue', async (req, res, next) => {
  try {
    const items = await svc.listPendingForUser(req.user.orgId, req.user.id);
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
});

/**
 * POST /v1/approval-groups/instances
 * Start a new workflow instance — org_admin / project_manager
 */
router.post('/instances', authorize('org_admin', 'project_manager'), async (req, res, next) => {
  try {
    const { entityId, entityType, entityName } = req.body;
    if (!entityId || !entityType) return res.status(400).json({ success: false, error: 'entityId and entityType are required' });
    const instance = await svc.startWorkflow(req.user.orgId, req.user.id, { entityId, entityType, entityName });
    res.status(201).json({ success: true, data: instance });
  } catch (err) { next(err); }
});

/**
 * GET /v1/approval-groups/instances/:instanceId
 * Full detail: steps, votes, audit log
 */
router.get('/instances/:instanceId', async (req, res, next) => {
  try {
    const detail = await svc.getInstanceDetail(req.user.orgId, req.params.instanceId);
    res.json({ success: true, data: detail });
  } catch (err) { next(err); }
});

/**
 * POST /v1/approval-groups/instances/:instanceId/vote
 * Cast a vote on the current step (APPROVE / REJECT / SENDBACK)
 */
router.post('/instances/:instanceId/vote', async (req, res, next) => {
  try {
    const { action, comment } = req.body;
    if (!action || !['APPROVE', 'REJECT', 'SENDBACK'].includes(action)) {
      return res.status(400).json({ success: false, error: 'action must be APPROVE, REJECT, or SENDBACK' });
    }
    const result = await svc.castVote(req.user.orgId, req.user.id, req.params.instanceId, { action, comment });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ── Audit log ─────────────────────────────────────────────────────────────────

/**
 * GET /v1/approval-groups/audit?instanceId=&groupId=&limit=
 */
router.get('/audit', async (req, res, next) => {
  try {
    const { instanceId, groupId, limit } = req.query;
    const log = await svc.getAuditLog(req.user.orgId, { instanceId, groupId, limit: parseInt(limit) || 50 });
    res.json({ success: true, data: log });
  } catch (err) { next(err); }
});

module.exports = router;
