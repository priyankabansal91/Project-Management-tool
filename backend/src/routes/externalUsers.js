const { Router } = require('express');
const externalUserService = require('../services/externalUserService');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

/**
 * Invite external user
 * POST /v1/external-users
 */
router.post('/', authorize('org_admin'), async (req, res, next) => {
  try {
    const { email, firstName, lastName, accessLevel, expiresAt, permissions } = req.body;

    if (!email || !firstName || !lastName) {
      return res.status(400).json({ success: false, error: 'email, firstName, and lastName are required' });
    }

    const user = await externalUserService.invite(req.user.orgId, req.user.id, {
      email,
      firstName,
      lastName,
      accessLevel,
      expiresAt,
      permissions,
    });

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

/**
 * List external users
 * GET /v1/external-users
 */
router.get('/', authorize('org_admin'), async (req, res, next) => {
  try {
    const { search, accessLevel, page, page_size } = req.query;
    const result = await externalUserService.list(req.user.orgId, {
      search,
      accessLevel,
      page: parseInt(page) || 1,
      page_size: parseInt(page_size) || 20,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Get external user by ID
 * GET /v1/external-users/:externalUserId
 */
router.get('/:externalUserId', authorize('org_admin'), async (req, res, next) => {
  try {
    const user = await externalUserService.getById(req.user.orgId, req.params.externalUserId);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

/**
 * Update external user
 * PATCH /v1/external-users/:externalUserId
 */
router.patch('/:externalUserId', authorize('org_admin'), async (req, res, next) => {
  try {
    const user = await externalUserService.update(req.user.orgId, req.params.externalUserId, req.body);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

/**
 * Revoke external user access
 * POST /v1/external-users/:externalUserId/revoke
 */
router.post('/:externalUserId/revoke', authorize('org_admin'), async (req, res, next) => {
  try {
    const user = await externalUserService.revoke(req.user.orgId, req.params.externalUserId);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

/**
 * Grant resource access
 * POST /v1/external-users/:externalUserId/grant-access
 */
router.post('/:externalUserId/grant-access', authorize('org_admin'), async (req, res, next) => {
  try {
    const { resourceType, resourceId, accessLevel } = req.body;

    if (!resourceType || !resourceId || !accessLevel) {
      return res.status(400).json({
        success: false,
        error: 'resourceType, resourceId, and accessLevel are required',
      });
    }

    const access = await externalUserService.grantAccess(
      req.user.orgId,
      req.params.externalUserId,
      resourceType,
      resourceId,
      accessLevel,
      req.user.id
    );

    res.status(201).json({ success: true, data: access });
  } catch (err) {
    next(err);
  }
});

/**
 * Revoke resource access
 * DELETE /v1/external-users/:externalUserId/access/:resourceType/:resourceId
 */
router.delete('/:externalUserId/access/:resourceType/:resourceId', authorize('org_admin'), async (req, res, next) => {
  try {
    await externalUserService.revokeAccess(
      req.user.orgId,
      req.params.externalUserId,
      req.params.resourceType,
      req.params.resourceId
    );

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

/**
 * Get user's resource access
 * GET /v1/external-users/:externalUserId/access
 */
router.get('/:externalUserId/access', authorize('org_admin'), async (req, res, next) => {
  try {
    const access = await externalUserService.getUserAccess(req.params.externalUserId);
    res.json({ success: true, data: access });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
