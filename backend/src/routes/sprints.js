const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const sprintService = require('../services/sprintService');
const { createSprintSchema, updateSprintSchema, addSprintTaskSchema } = require('../validators/sprint');

const router = express.Router();
router.use(authenticate);

// Aliases for backward-compat within this file
const createSchema = createSprintSchema;
const updateSchema = updateSprintSchema;

// Get backlog — MUST be before /:sprintId routes so "backlog" isn't treated as an ID
router.get('/backlog', async (req, res, next) => {
  try {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'project_id is required' } });
    const tasks = await sprintService.getBacklog(req.user.orgId, project_id);
    res.json({ success: true, data: tasks });
  } catch (err) { next(err); }
});

// List sprints for a project
router.get('/', async (req, res, next) => {
  try {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'project_id is required' } });
    const sprints = await sprintService.listByProject(req.user.orgId, project_id);
    res.json({ success: true, data: sprints });
  } catch (err) { next(err); }
});

// Create sprint
router.post('/', authorize('org_admin', 'division_admin', 'vertical_head', 'project_manager', 'team_lead'), async (req, res, next) => {
  try {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'project_id is required' } });
    const data = createSchema.parse(req.body);
    const sprint = await sprintService.create(req.user.orgId, project_id, req.user.id, data);
    res.status(201).json({ success: true, data: sprint });
  } catch (err) { next(err); }
});

// Update sprint
router.patch('/:sprintId', authorize('org_admin', 'division_admin', 'vertical_head', 'project_manager', 'team_lead'), async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const sprint = await sprintService.update(req.user.orgId, req.params.sprintId, data);
    res.json({ success: true, data: sprint });
  } catch (err) { next(err); }
});

// Delete sprint
router.delete('/:sprintId', authorize('org_admin', 'division_admin', 'vertical_head', 'project_manager', 'team_lead'), async (req, res, next) => {
  try {
    const result = await sprintService.delete(req.user.orgId, req.params.sprintId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Add task to sprint
router.post('/:sprintId/tasks', async (req, res, next) => {
  let taskData;
  try {
    taskData = addSprintTaskSchema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
  }
  try {
    const { task_id } = taskData;
    const sprint = await sprintService.addTask(req.user.orgId, req.params.sprintId, task_id);
    res.json({ success: true, data: sprint });
  } catch (err) { next(err); }
});

// Remove task from sprint
router.delete('/:sprintId/tasks/:taskId', async (req, res, next) => {
  try {
    const sprint = await sprintService.removeTask(req.user.orgId, req.params.sprintId, req.params.taskId);
    res.json({ success: true, data: sprint });
  } catch (err) { next(err); }
});

module.exports = router;
