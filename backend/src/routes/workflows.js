const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const ApiError = require('../utils/ApiError');
const workflowService = require('../services/workflowService');

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const workflows = await workflowService.list(req.user.orgId, req.user.id);
    res.json({ success: true, data: workflows });
  } catch (err) {
    next(err);
  }
});

router.get('/:workflowId', async (req, res, next) => {
  try {
    const workflow = await workflowService.getById(req.user.orgId, req.params.workflowId);
    res.json({ success: true, data: workflow });
  } catch (err) {
    if (err.statusCode === 404) return next(ApiError.notFound(err.message));
    next(err);
  }
});

router.post('/', authorize('org_admin', 'project_manager'), async (req, res, next) => {
  try {
    const workflow = await workflowService.create(req.user.orgId, req.user.id, req.body);
    res.status(201).json({ success: true, data: workflow });
  } catch (err) {
    next(err);
  }
});

router.patch('/:workflowId', authorize('org_admin', 'project_manager'), async (req, res, next) => {
  try {
    const workflow = await workflowService.update(req.user.orgId, req.params.workflowId, req.body);
    res.json({ success: true, data: workflow });
  } catch (err) {
    if (err.statusCode === 404) return next(ApiError.notFound(err.message));
    next(err);
  }
});

router.delete('/:workflowId', authorize('org_admin'), async (req, res, next) => {
  try {
    await workflowService.remove(req.user.orgId, req.params.workflowId);
    res.status(204).end();
  } catch (err) {
    if (err.statusCode === 404) return next(ApiError.notFound(err.message));
    if (err.statusCode === 400) return next(ApiError.badRequest(err.message));
    next(err);
  }
});

module.exports = router;
