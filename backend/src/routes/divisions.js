const { Router } = require('express');
const divisionService = require('../services/divisionService');
const { authenticate, authorize } = require('../middleware/auth');
const { getDivisionReadiness, updateChecklistItem, getVerticalReadiness } = require('../services/setupReadinessService');

const router = Router();

router.use(authenticate);

/**
 * Create division
 * POST /v1/divisions
 */
router.post('/', authorize('org_admin'), async (req, res, next) => {
  try {
    const { name, description, code, parent_id, manager_id, budget, head_count } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, error: 'name and code are required' });
    }
    if (!manager_id) {
      return res.status(400).json({ success: false, error: 'manager_id (Division Head) is required' });
    }

    const division = await divisionService.create(req.user.orgId, req.user.id, {
      name,
      description,
      code,
      parent_id,
      manager_id,
      budget,
      head_count,
    });

    res.status(201).json({ success: true, data: division });
  } catch (err) {
    next(err);
  }
});

/**
 * Get division hierarchy
 * GET /v1/divisions/hierarchy
 */
router.get('/hierarchy', async (req, res, next) => {
  try {
    const hierarchy = await divisionService.getHierarchy(req.user.orgId, req.user.id, req.user.role);
    res.json({ success: true, data: hierarchy });
  } catch (err) {
    next(err);
  }
});

/**
 * List divisions
 * GET /v1/divisions
 */
router.get('/', async (req, res, next) => {
  try {
    const { search, parent_id, page, page_size } = req.query;
    const result = await divisionService.list(req.user.orgId, {
      search,
      parent_id,
      page: parseInt(page) || 1,
      page_size: parseInt(page_size) || 20,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Get division by ID
 * GET /v1/divisions/:divisionId
 */
router.get('/:divisionId', async (req, res, next) => {
  try {
    const division = await divisionService.getById(req.user.orgId, req.params.divisionId);
    res.json({ success: true, data: division });
  } catch (err) {
    next(err);
  }
});

/**
 * Update division
 * PATCH /v1/divisions/:divisionId
 */
router.patch('/:divisionId', authorize('org_admin'), async (req, res, next) => {
  try {
    const division = await divisionService.update(req.user.orgId, req.params.divisionId, req.body);
    res.json({ success: true, data: division });
  } catch (err) {
    next(err);
  }
});

/**
 * Delete division
 * DELETE /v1/divisions/:divisionId
 */
router.delete('/:divisionId', authorize('org_admin'), async (req, res, next) => {
  try {
    await divisionService.delete(req.user.orgId, req.params.divisionId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

/**
 * Add member to division
 * POST /v1/divisions/:divisionId/members
 */
router.post('/:divisionId/members', authorize('org_admin'), async (req, res, next) => {
  try {
    const { user_id, role } = req.body;

    if (!user_id || !role) {
      return res.status(400).json({ success: false, error: 'user_id and role are required' });
    }

    const member = await divisionService.addMember(req.user.orgId, req.params.divisionId, user_id, role);
    res.status(201).json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
});

/**
 * Remove member from division
 * DELETE /v1/divisions/:divisionId/members/:userId
 */
router.delete('/:divisionId/members/:userId', authorize('org_admin'), async (req, res, next) => {
  try {
    await divisionService.removeMember(req.user.orgId, req.params.divisionId, req.params.userId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

/**
 * GET /v1/divisions/:divisionId/readiness — setup readiness check
 */
router.get('/:divisionId/readiness', async (req, res, next) => {
  try {
    const readiness = await getDivisionReadiness(req.params.divisionId);
    if (!readiness) {
      return res.status(404).json({ success: false, error: 'Division not found' });
    }
    res.json({ success: true, data: readiness });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /v1/divisions/:divisionId/readiness — update a checklist item
 */
router.patch('/:divisionId/readiness', authorize('org_admin', 'division_admin'), async (req, res, next) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ success: false, error: 'key is required' });
    const division = await updateChecklistItem(req.params.divisionId, key, value !== false);
    const readiness = await getDivisionReadiness(req.params.divisionId);
    res.json({ success: true, data: readiness });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
