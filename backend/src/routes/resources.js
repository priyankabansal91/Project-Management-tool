/**
 * Resource & Capacity Dashboard Routes
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ResourceService = require('../services/resourceService');

router.use(authenticate);

/**
 * GET /v1/resources - List resources
 */
router.get('/', (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      department: req.query.department,
      status: req.query.status,
      skill: req.query.skill,
    };
    const resources = ResourceService.listResources(filters);
    res.json({ success: true, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /v1/resources - Create resource
 */
router.post('/', (req, res) => {
  try {
    const resource = ResourceService.createResource(req.body);
    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/resources/:id - Get resource
 */
router.get('/:id', (req, res) => {
  try {
    const resource = ResourceService.getResource(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }
    res.json({ success: true, data: resource });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /v1/resources/:id/allocate - Allocate resource to project
 */
router.post('/:id/allocate', (req, res) => {
  try {
    const resource = ResourceService.allocateResource(req.params.id, req.body.projectId, req.body);
    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }
    res.json({ success: true, data: resource });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /v1/resources/:id/deallocate - Deallocate resource from project
 */
router.post('/:id/deallocate', (req, res) => {
  try {
    const resource = ResourceService.deallocateResource(req.params.id, req.body.projectId);
    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }
    res.json({ success: true, data: resource });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /v1/resources/:id/skills - Add skill
 */
router.post('/:id/skills', (req, res) => {
  try {
    const resource = ResourceService.addSkill(req.params.id, req.body.skill);
    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }
    res.json({ success: true, data: resource });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/resources/skills/:skill - Get skill matrix
 */
router.get('/skills/:skill', (req, res) => {
  try {
    const matrix = ResourceService.getSkillMatrix(req.params.skill);
    res.json({ success: true, data: matrix });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /v1/resources/skills/gaps - Get skill gaps
 */
router.post('/skills/gaps', (req, res) => {
  try {
    const gaps = ResourceService.getSkillGaps(req.body.requiredSkills);
    res.json({ success: true, data: gaps });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/resources/capacity/heatmap - Get capacity heatmap
 */
router.get('/capacity/heatmap', (req, res) => {
  try {
    const heatmap = ResourceService.getCapacityHeatmap();
    res.json({ success: true, data: heatmap });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/resources/bench/report - Get bench report
 */
router.get('/bench/report', (req, res) => {
  try {
    const report = ResourceService.getBenchReport();
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/resources/hiring/plan - Get hiring plan
 */
router.get('/hiring/plan', (req, res) => {
  try {
    const quarters = req.query.quarters ? req.query.quarters.split(',') : ['Q1', 'Q2', 'Q3', 'Q4'];
    const plan = ResourceService.getHiringPlan(quarters);
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /v1/resources/:id/pto - Add PTO/holiday
 */
router.post('/:id/pto', (req, res) => {
  try {
    const resource = ResourceService.addPTO(req.params.id, req.body);
    if (!resource) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }
    res.json({ success: true, data: resource });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/resources/pto/calendar - Get PTO calendar
 */
router.get('/pto/calendar', (req, res) => {
  try {
    const filters = {
      department: req.query.department,
      type: req.query.type,
    };
    const calendar = ResourceService.getPTOCalendar(filters);
    res.json({ success: true, data: calendar });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/resources/utilization/comparison - Get utilization comparison
 */
router.get('/utilization/comparison', (req, res) => {
  try {
    const comparison = ResourceService.getUtilizationComparison();
    res.json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/resources/dashboard - Resource dashboard summary
 */
router.get('/dashboard', (req, res) => {
  try {
    const summary = ResourceService.getDashboardSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
