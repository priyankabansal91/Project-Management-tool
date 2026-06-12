const { Router } = require('express');
const formService = require('../services/formService');
const { authenticate } = require('../middleware/auth');
const { submitFormSchema } = require('../validators/form');

const router = Router();

router.use(authenticate);

/**
 * Get all form templates
 * GET /v1/forms/templates
 */
router.get('/templates', async (req, res, next) => {
  try {
    const templates = await formService.getFormTemplates();
    res.json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
});

/**
 * Get a specific form template
 * GET /v1/forms/templates/:formId
 */
router.get('/templates/:formId', async (req, res, next) => {
  try {
    const template = await formService.getFormTemplate(req.params.formId);
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
});

/**
 * Submit a form
 * POST /v1/forms/submit/:formId
 */
router.post('/submit/:formId', async (req, res, next) => {
  let data;
  try {
    data = submitFormSchema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
  }
  try {
    const result = await formService.submitForm(req.user.orgId, req.user.id, req.params.formId, data);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Get form submissions for current user
 * GET /v1/forms/submissions
 */
router.get('/submissions', async (req, res, next) => {
  try {
    const { form_id, status, page, page_size } = req.query;
    const result = await formService.getFormSubmissions(req.user.orgId, req.user.id, {
      form_id,
      status,
      page: parseInt(page) || 1,
      page_size: parseInt(page_size) || 20,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
