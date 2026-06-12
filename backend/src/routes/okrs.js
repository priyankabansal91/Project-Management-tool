/**
 * OKR & Goals Tracking Routes
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const OKRService = require('../services/okrService');
const { createOkrSchema, updateOkrSchema } = require('../validators/okr');

router.use(authenticate);

/**
 * GET /v1/okrs - List all OKRs
 */
router.get('/', (req, res) => {
  try {
    const filters = {
      level: req.query.level,
      quarter: req.query.quarter,
      year: req.query.year,
      ownerId: req.query.ownerId,
      status: req.query.status,
    };

    const okrs = OKRService.listOKRs(filters);
    res.json({ success: true, data: okrs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /v1/okrs - Create new OKR
 */
router.post('/', authorize('org_admin', 'division_admin', 'vertical_head', 'project_manager'), (req, res) => {
  let data;
  try {
    data = createOkrSchema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
  }
  try {
    const okr = OKRService.createOKR(data);
    res.status(201).json({ success: true, data: okr });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/okrs/:id - Get OKR by ID
 */
router.get('/:id', (req, res) => {
  try {
    const okr = OKRService.getOKR(req.params.id);
    if (!okr) {
      return res.status(404).json({ success: false, error: 'OKR not found' });
    }
    res.json({ success: true, data: okr });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PATCH /v1/okrs/:id - Update OKR
 */
router.patch('/:id', authorize('org_admin', 'division_admin', 'vertical_head', 'project_manager'), (req, res) => {
  let data;
  try {
    data = updateOkrSchema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
  }
  try {
    const okr = OKRService.updateOKR(req.params.id, data);
    if (!okr) {
      return res.status(404).json({ success: false, error: 'OKR not found' });
    }
    res.json({ success: true, data: okr });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /v1/okrs/:id - Delete OKR
 */
router.delete('/:id', authorize('org_admin', 'division_admin', 'vertical_head', 'project_manager'), (req, res) => {
  try {
    const deleted = OKRService.deleteOKR(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'OKR not found' });
    }
    res.json({ success: true, message: 'OKR deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /v1/okrs/:id/key-results - Add key result
 */
router.post('/:id/key-results', authorize('org_admin', 'division_admin', 'vertical_head', 'project_manager'), (req, res) => {
  try {
    const kr = OKRService.addKeyResult(req.params.id, req.body);
    if (!kr) {
      return res.status(404).json({ success: false, error: 'OKR not found' });
    }
    res.status(201).json({ success: true, data: kr });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /v1/okrs/:id/key-results/:krId - Update key result
 */
router.patch('/:id/key-results/:krId', authorize('org_admin', 'division_admin', 'vertical_head', 'project_manager'), (req, res) => {
  try {
    const kr = OKRService.updateKeyResult(req.params.id, req.params.krId, req.body);
    if (!kr) {
      return res.status(404).json({ success: false, error: 'Key result not found' });
    }
    res.json({ success: true, data: kr });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /v1/okrs/:id/link-project - Link project to OKR
 */
router.post('/:id/link-project', authorize('org_admin', 'division_admin', 'vertical_head', 'project_manager'), (req, res) => {
  try {
    const okr = OKRService.linkProject(req.params.id, req.body.projectId);
    if (!okr) {
      return res.status(404).json({ success: false, error: 'OKR not found' });
    }
    res.json({ success: true, data: okr });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /v1/okrs/:id/link-task - Link task to OKR
 */
router.post('/:id/link-task', authorize('org_admin', 'division_admin', 'vertical_head', 'project_manager'), (req, res) => {
  try {
    const okr = OKRService.linkTask(req.params.id, req.body.taskId);
    if (!okr) {
      return res.status(404).json({ success: false, error: 'OKR not found' });
    }
    res.json({ success: true, data: okr });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/okrs/:id/cascade - Get goal cascade
 */
router.get('/:id/cascade', (req, res) => {
  try {
    const cascade = OKRService.getGoalCascade(req.params.id);
    if (!cascade) {
      return res.status(404).json({ success: false, error: 'OKR not found' });
    }
    res.json({ success: true, data: cascade });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /v1/okrs/alignment/view - Get alignment view
 */
router.get('/alignment/view', (req, res) => {
  try {
    const filters = {
      level: req.query.level,
      quarter: req.query.quarter,
      year: req.query.year,
    };
    const alignment = OKRService.getAlignmentView(filters);
    res.json({ success: true, data: alignment });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /v1/okrs/quarterly-checkin - Get quarterly check-in
 */
router.get('/quarterly-checkin', (req, res) => {
  try {
    const quarter = req.query.quarter || 'Q1';
    const year = req.query.year || new Date().getFullYear();
    const checkIn = OKRService.getQuarterlyCheckIn(quarter, year);
    res.json({ success: true, data: checkIn });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /v1/okrs/health/scores - Get health scores
 */
router.get('/health/scores', (req, res) => {
  try {
    const scores = OKRService.getHealthScores();
    res.json({ success: true, data: scores });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
