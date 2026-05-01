const { Router } = require('express');
const divisionConfigService = require('../services/divisionConfigService');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

/**
 * GET /v1/division-config
 * List all divisions with their configs — org_admin only.
 */
router.get('/', authorize('org_admin'), (req, res) => {
  const divisions = divisionConfigService.getAllDivisions();
  const result = divisions.map((div) => ({
    ...div,
    config: divisionConfigService.getDivisionConfig(div.id),
  }));
  res.json({ success: true, data: result });
});

/**
 * GET /v1/division-config/my
 * Get divisions the current user belongs to.
 */
router.get('/my', (req, res) => {
  const divisions = divisionConfigService.getUserDivisions(req.user.id);
  res.json({ success: true, data: divisions });
});

/**
 * GET /v1/division-config/modules
 * Returns the list of all available modules.
 */
router.get('/modules', (req, res) => {
  const modules = divisionConfigService.getAllModules();
  res.json({ success: true, data: modules });
});

/**
 * GET /v1/division-config/handoff/all
 * Handoff readiness for every division — org_admin only.
 */
router.get('/handoff/all', authorize('org_admin'), (req, res) => {
  const statuses = divisionConfigService.getAllHandoffStatuses();
  res.json({ success: true, data: statuses });
});

/**
 * GET /v1/division-config/:divisionId/handoff-status
 * Handoff readiness for one division.
 */
router.get('/:divisionId/handoff-status', authorize('org_admin'), (req, res) => {
  const status = divisionConfigService.getHandoffStatus(req.params.divisionId);
  if (!status) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Division not found' } });
  res.json({ success: true, data: status });
});

/**
 * GET /v1/division-config/:divisionId
 * Get config for a specific division.
 * Access: org_admin/executive see all; others must be a member of that division.
 */
router.get('/:divisionId', (req, res) => {
  const { role, id: userId } = req.user;
  const { divisionId } = req.params;

  if (role !== 'org_admin' && role !== 'executive') {
    const userDivisions = divisionConfigService.getUserDivisions(userId);
    const isMember = userDivisions.some((d) => d.divisionId === divisionId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied to this division' },
      });
    }
  }

  const config = divisionConfigService.getDivisionConfig(divisionId);
  if (!config) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Division not found' },
    });
  }
  res.json({ success: true, data: config });
});

/**
 * PATCH /v1/division-config/:divisionId
 * Update config — org_admin or division_admin of that division.
 */
router.patch('/:divisionId', (req, res) => {
  const { role, id: userId } = req.user;
  const { divisionId } = req.params;

  // Check permission: org_admin always allowed;
  // division_admin only if they belong to that division
  if (role !== 'org_admin') {
    if (role !== 'division_admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
    }
    const userDivisions = divisionConfigService.getUserDivisions(userId);
    const membership = userDivisions.find(
      (d) => d.divisionId === divisionId && d.role === 'division_admin'
    );
    if (!membership) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not a division admin for this division' },
      });
    }
  }

  const updated = divisionConfigService.updateDivisionConfig(divisionId, req.body, userId);
  if (!updated) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Division not found' },
    });
  }
  res.json({ success: true, data: updated });
});

/**
 * GET /v1/division-config/:divisionId/members
 * List division members — only accessible to division members, admins, or executives.
 */
router.get('/:divisionId/members', (req, res) => {
  const { role, id: userId } = req.user;
  const { divisionId } = req.params;

  if (role !== 'org_admin' && role !== 'executive') {
    const userDivisions = divisionConfigService.getUserDivisions(userId);
    const isMember = userDivisions.some((d) => d.divisionId === divisionId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied to this division' },
      });
    }
  }

  const members = divisionConfigService.getDivisionMembers(divisionId);
  res.json({ success: true, data: members });
});

/**
 * POST /v1/division-config/:divisionId/members
 * Add a member to a division — org_admin or division_admin.
 */
router.post('/:divisionId/members', (req, res) => {
  const { role, id: userId } = req.user;
  const { divisionId } = req.params;
  const { userId: targetUserId, role: memberRole } = req.body;

  if (!targetUserId || !memberRole) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'userId and role are required' },
    });
  }

  if (role !== 'org_admin') {
    if (role !== 'division_admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
    }
    const userDivisions = divisionConfigService.getUserDivisions(userId);
    const membership = userDivisions.find(
      (d) => d.divisionId === divisionId && d.role === 'division_admin'
    );
    if (!membership) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not a division admin for this division' },
      });
    }
  }

  const result = divisionConfigService.assignUserToDivision(targetUserId, divisionId, memberRole);
  if (!result) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Division not found' },
    });
  }
  res.status(201).json({ success: true, data: result });
});

/**
 * DELETE /v1/division-config/:divisionId/members/:userId
 * Remove a member from a division — org_admin or division_admin.
 */
router.delete('/:divisionId/members/:userId', (req, res) => {
  const { role, id: requestingUserId } = req.user;
  const { divisionId, userId: targetUserId } = req.params;

  if (role !== 'org_admin') {
    if (role !== 'division_admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
    }
    const userDivisions = divisionConfigService.getUserDivisions(requestingUserId);
    const membership = userDivisions.find(
      (d) => d.divisionId === divisionId && d.role === 'division_admin'
    );
    if (!membership) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not a division admin for this division' },
      });
    }
  }

  const result = divisionConfigService.removeUserFromDivision(targetUserId, divisionId);
  res.json({ success: true, data: result });
});

module.exports = router;
