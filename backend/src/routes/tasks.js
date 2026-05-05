const { Router } = require('express');
const taskService = require('../services/taskService');
const { createTaskSchema, updateTaskSchema, moveTaskSchema } = require('../validators/task');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

// My tasks across all projects
router.get('/my', async (req, res, next) => {
  try {
    const result = await taskService.getMyTasks(req.user.orgId, req.user.id, req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// List tasks for a project
router.get('/project/:projectId', async (req, res, next) => {
  try {
    const result = await taskService.listByProject(req.user.orgId, req.params.projectId, req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Get single task
router.get('/:taskId', async (req, res, next) => {
  try {
    const raw = await taskService.getById(req.user.orgId, req.params.taskId);
    res.json({ success: true, data: taskService.formatTask(raw) });
  } catch (err) {
    next(err);
  }
});

// Create task
router.post('/project/:projectId', async (req, res, next) => {
  try {
    const data = createTaskSchema.parse(req.body);
    const task = await taskService.create(req.user.orgId, req.params.projectId, req.user.id, data);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// PATCH /bulk — bulk update/delete tasks (must be before /:taskId)
router.patch('/bulk', async (req, res, next) => {
  try {
    const { z } = require('zod');
    const schema = z.object({
      taskIds:   z.array(z.string()).min(1).max(100),
      operation: z.enum(['status', 'priority', 'assignee', 'delete']),
      value:     z.string().optional(),
    });
    const body = schema.parse(req.body);
    const { taskIds, operation, value } = body;

    if (operation === 'delete') {
      const results = await Promise.allSettled(
        taskIds.map(id => taskService.delete(req.user.orgId, id))
      );
      return res.json({ success: true, data: { deleted: results.filter(r => r.status === 'fulfilled').length } });
    }

    const updateData = {};
    if (operation === 'status') {
      if (value === 'done') {
        updateData.status_name = 'Done';
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.status_id = value;
      }
    }
    if (operation === 'priority') updateData.priority = value;
    if (operation === 'assignee') updateData.assignee_id = value;

    const results = await Promise.allSettled(
      taskIds.map(id => taskService.update(req.user.orgId, id, updateData))
    );
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    return res.json({ success: true, data: { updated: succeeded, failed: taskIds.length - succeeded } });
  } catch (err) {
    next(err);
  }
});

// Update task
router.patch('/:taskId', async (req, res, next) => {
  try {
    const data = updateTaskSchema.parse(req.body);
    const task = await taskService.update(req.user.orgId, req.params.taskId, data);
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// Move task (Kanban drag-drop)
router.post('/:taskId/move', async (req, res, next) => {
  try {
    const data = moveTaskSchema.parse(req.body);
    const task = await taskService.moveTask(req.user.orgId, req.params.taskId, data);
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// Delete task
router.delete('/:taskId', async (req, res, next) => {
  try {
    await taskService.delete(req.user.orgId, req.params.taskId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
