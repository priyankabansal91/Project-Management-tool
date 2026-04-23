const { Router } = require('express');
const customRoleService = require('../services/customRoleService');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

/**
 * Get available permissions
 * GET /v1/roles/permissions
 */
router.get('/permissions', async (req, res, next) => {
  try {
    const permissions = customRoleService.getAvailablePermissions();
    res.json({ success: true, data: permissions });
  } catch (err) {
    next(err);
  }
});

/**
 * Get system role permissions matrix
 * GET /v1/roles/system-matrix
 */
router.get('/system-matrix', async (req, res, next) => {
  try {
    const matrix = customRoleService.getSystemRoleMatrix();
    res.json({ success: true, data: matrix });
  } catch (err) {
    next(err);
  }
});

/**
 * Update system role permissions (org_admin only)
 * PATCH /v1/roles/system-matrix
 */
router.patch('/system-matrix', authorize('org_admin'), async (req, res, next) => {
  try {
    const { role, permissions } = req.body;
    if (!role || !permissions) {
      return res.status(400).json({ success: false, error: 'role and permissions are required' });
    }
    const matrix = customRoleService.updateSystemRolePermissions(role, permissions);
    res.json({ success: true, data: matrix });
  } catch (err) {
    next(err);
  }
});

/**
 * List org members with their roles
 * GET /v1/roles/members
 */
router.get('/members', async (req, res, next) => {
  try {
    const members = await customRoleService.listMembersWithRoles(req.user.orgId);
    res.json({ success: true, data: members });
  } catch (err) {
    next(err);
  }
});

/**
 * Update a member's system role
 * PATCH /v1/roles/members/:userId
 */
router.patch('/members/:userId', authorize('org_admin'), async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ success: false, error: 'role is required' });
    const member = await customRoleService.updateMemberRole(req.user.orgId, req.params.userId, role);
    res.json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
});

/**
 * Create custom role
 * POST /v1/roles
 */
router.post('/', authorize('org_admin'), async (req, res, next) => {
  try {
    const { name, description, permissions, color } = req.body;

    if (!name || !permissions) {
      return res.status(400).json({ success: false, error: 'name and permissions are required' });
    }

    const role = await customRoleService.create(req.user.orgId, req.user.id, {
      name,
      description,
      permissions,
      color,
    });

    res.status(201).json({ success: true, data: role });
  } catch (err) {
    next(err);
  }
});

/**
 * List roles
 * GET /v1/roles
 */
router.get('/', async (req, res, next) => {
  try {
    const { search, page, page_size } = req.query;
    const result = await customRoleService.list(req.user.orgId, {
      search,
      page: parseInt(page) || 1,
      page_size: parseInt(page_size) || 20,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Get role by ID
 * GET /v1/roles/:roleId
 */
router.get('/:roleId', async (req, res, next) => {
  try {
    const role = await customRoleService.getById(req.user.orgId, req.params.roleId);
    res.json({ success: true, data: role });
  } catch (err) {
    next(err);
  }
});

/**
 * Update role
 * PATCH /v1/roles/:roleId
 */
router.patch('/:roleId', authorize('org_admin'), async (req, res, next) => {
  try {
    const role = await customRoleService.update(req.user.orgId, req.params.roleId, req.body);
    res.json({ success: true, data: role });
  } catch (err) {
    next(err);
  }
});

/**
 * Delete role
 * DELETE /v1/roles/:roleId
 */
router.delete('/:roleId', authorize('org_admin'), async (req, res, next) => {
  try {
    await customRoleService.delete(req.user.orgId, req.params.roleId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

/**
 * Assign role to user
 * POST /v1/roles/:roleId/assign
 */
router.post('/:roleId/assign', authorize('org_admin'), async (req, res, next) => {
  try {
    const { user_id, scope, scope_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const member = await customRoleService.assignToUser(
      req.user.orgId,
      req.params.roleId,
      user_id,
      scope || 'org',
      scope_id
    );

    res.status(201).json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
});

/**
 * Remove role from user
 * POST /v1/roles/:roleId/unassign
 */
router.post('/:roleId/unassign', authorize('org_admin'), async (req, res, next) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    await customRoleService.removeFromUser(req.user.orgId, req.params.roleId, user_id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

/**
 * Get user permissions
 * GET /v1/roles/user/:userId/permissions
 */
router.get('/user/:userId/permissions', async (req, res, next) => {
  try {
    const permissions = await customRoleService.getUserPermissions(req.user.orgId, req.params.userId);
    res.json({ success: true, data: permissions });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
