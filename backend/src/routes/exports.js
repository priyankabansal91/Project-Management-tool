const { Router } = require('express');
const exportService = require('../services/exportService');
const { authenticate } = require('../middleware/auth');
const { exportTasksSchema, exportProjectsSchema, createExportSchema } = require('../validators/export');

const router = Router();

router.use(authenticate);

/**
 * Export tasks
 * POST /v1/exports/tasks
 */
router.post('/tasks', async (req, res, next) => {
  let data;
  try {
    data = exportTasksSchema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
  }
  try {
    const { format, filters, columns } = data;

    const result = await exportService.exportTasks(req.user.orgId, req.user.id, {
      format,
      filters,
      columns,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Export projects
 * POST /v1/exports/projects
 */
router.post('/projects', async (req, res, next) => {
  let data;
  try {
    data = exportProjectsSchema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
  }
  try {
    const { format, filters, columns } = data;

    const result = await exportService.exportProjects(req.user.orgId, req.user.id, {
      format,
      filters,
      columns,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Create custom export
 * POST /v1/exports
 */
router.post('/', async (req, res, next) => {
  let data;
  try {
    data = createExportSchema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
  }
  try {
    const { name, description, exportType, format, filters, columns } = data;

    const exportRecord = await exportService.createExport(req.user.orgId, req.user.id, {
      name,
      description,
      exportType,
      format,
      filters,
      columns,
    });

    res.status(201).json({ success: true, data: exportRecord });
  } catch (err) {
    next(err);
  }
});

/**
 * List exports
 * GET /v1/exports
 */
router.get('/', async (req, res, next) => {
  try {
    const { exportType, status, page, page_size } = req.query;
    const result = await exportService.list(req.user.orgId, {
      exportType,
      status,
      page: parseInt(page) || 1,
      page_size: parseInt(page_size) || 20,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Get export by ID
 * GET /v1/exports/:exportId
 */
router.get('/:exportId', async (req, res, next) => {
  try {
    const exportRecord = await exportService.getById(req.user.orgId, req.params.exportId);
    res.json({ success: true, data: exportRecord });
  } catch (err) {
    next(err);
  }
});

/**
 * Delete export
 * DELETE /v1/exports/:exportId
 */
router.delete('/:exportId', async (req, res, next) => {
  try {
    await exportService.delete(req.user.orgId, req.params.exportId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
