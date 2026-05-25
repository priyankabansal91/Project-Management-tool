const { Router } = require('express');
const projectService = require('../services/projectService');
const { createProjectSchema, updateProjectSchema } = require('../validators/project');
const { authenticate, authorize } = require('../middleware/auth');
const divisionScope = require('../middleware/divisionScope');
const { requireParentReady } = require('../middleware/waterfallGuard');

const router = Router();

router.use(authenticate);
router.use(divisionScope);

router.get('/', async (req, res, next) => {
  try {
    const result = await projectService.list(
      req.user.orgId,
      req.query,
      {
        userDivisions: req.userDivisions,
        isScopeAll: req.isScopeAll,
        divisionId: req.query.division_id,
      }
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/:projectId', async (req, res, next) => {
  try {
    const project = await projectService.getById(req.user.orgId, req.params.projectId);
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

router.post('/', authorize('org_admin', 'division_admin', 'project_manager'), requireParentReady('project'), async (req, res, next) => {
  try {
    const data = createProjectSchema.parse(req.body);
    const divisionId = data.division_id || req.currentDivisionId;
    const project = await projectService.create(req.user.orgId, req.user.id, data, divisionId);
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

router.patch('/:projectId', authorize('org_admin', 'division_admin', 'project_manager'), async (req, res, next) => {
  try {
    const data = updateProjectSchema.parse(req.body);
    const project = await projectService.update(req.user.orgId, req.params.projectId, data);
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

router.delete('/:projectId', authorize('org_admin', 'division_admin'), async (req, res, next) => {
  try {
    await projectService.delete(req.user.orgId, req.params.projectId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
