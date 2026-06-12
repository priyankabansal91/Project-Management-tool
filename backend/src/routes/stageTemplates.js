const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const svc = require('../services/stageTemplateService');
const { createStageTemplateSchema, updateStageTemplateSchema, bulkSubstagesSchema, addSubstageSchema } = require('../validators/stageTemplate');

router.use(authenticate);

// GET /v1/stage-templates?division_id=xxx
router.get('/', async (req, res, next) => {
  try {
    const items = await svc.list(req.user.orgId, { divisionId: req.query.division_id });
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
});

// POST /v1/stage-templates
router.post('/', authorize('org_admin', 'division_admin'), async (req, res, next) => {
  let data;
  try {
    data = createStageTemplateSchema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
  }
  try {
    const item = await svc.create(req.user.orgId, req.user.id, data);
    res.status(201).json({ success: true, data: item });
  } catch (e) { next(e); }
});

// GET /v1/stage-templates/:id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await svc.getById(req.user.orgId, req.params.id);
    res.json({ success: true, data: item });
  } catch (e) { next(e); }
});

// PUT /v1/stage-templates/:id
router.put('/:id', authorize('org_admin', 'division_admin'), async (req, res, next) => {
  let data;
  try {
    data = updateStageTemplateSchema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
  }
  try {
    const item = await svc.update(req.user.orgId, req.params.id, data);
    res.json({ success: true, data: item });
  } catch (e) { next(e); }
});

// DELETE /v1/stage-templates/:id
router.delete('/:id', authorize('org_admin', 'division_admin'), async (req, res, next) => {
  try {
    const result = await svc.delete(req.user.orgId, req.params.id);
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

// PUT /v1/stage-templates/:id/substages — bulk replace all substages (must be before /:id/substages/:substageId)
router.put('/:id/substages', authorize('org_admin', 'division_admin'), async (req, res, next) => {
  let data;
  try {
    data = bulkSubstagesSchema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
  }
  try {
    const { names } = data;
    const item = await svc.bulkReplaceSubstages(req.user.orgId, req.params.id, names);
    res.json({ success: true, data: item });
  } catch (e) { next(e); }
});

// POST /v1/stage-templates/:id/substages
router.post('/:id/substages', authorize('org_admin', 'division_admin'), async (req, res, next) => {
  let data;
  try {
    data = addSubstageSchema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
  }
  try {
    const item = await svc.createSubstage(req.user.orgId, req.params.id, data);
    res.status(201).json({ success: true, data: item });
  } catch (e) { next(e); }
});

// PUT /v1/stage-templates/:id/substages/:substageId
router.put('/:id/substages/:substageId', authorize('org_admin', 'division_admin'), async (req, res, next) => {
  try {
    const item = await svc.updateSubstage(req.user.orgId, req.params.id, req.params.substageId, req.body);
    res.json({ success: true, data: item });
  } catch (e) { next(e); }
});

// DELETE /v1/stage-templates/:id/substages/:substageId
router.delete('/:id/substages/:substageId', authorize('org_admin', 'division_admin'), async (req, res, next) => {
  try {
    const result = await svc.deleteSubstage(req.user.orgId, req.params.id, req.params.substageId);
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

module.exports = router;
