const express = require('express');
const { authenticate } = require('../middleware/auth');
const aiService = require('../services/aiService');
const logger = require('../config/logger');

const router = express.Router();
router.use(authenticate);

router.post('/generate-tasks', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt?.trim()) {
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'prompt is required' } });
  }
  if (prompt.length > 2000) {
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Prompt too long (max 2000 characters)' } });
  }
  try {
    const tasks = await aiService.generateTasks(prompt);
    res.json({ success: true, data: { tasks } });
  } catch (err) {
    logger.error('AI generate-tasks error', { error: err.message });
    res.status(500).json({ success: false, error: { code: 'AI_ERROR', message: 'Internal server error' } });
  }
});

router.post('/summarize-task', async (req, res) => {
  const { task } = req.body;
  if (!task?.title) {
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'task object with title is required' } });
  }
  try {
    const summary = await aiService.summarizeTask(task);
    res.json({ success: true, data: { summary } });
  } catch (err) {
    logger.error('AI summarize-task error', { error: err.message });
    res.status(500).json({ success: false, error: { code: 'AI_ERROR', message: 'Internal server error' } });
  }
});

router.post('/suggest-assignee', async (req, res) => {
  const { taskDescription, members } = req.body;
  if (!taskDescription) {
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'taskDescription is required' } });
  }
  try {
    const suggestions = await aiService.suggestAssignee(taskDescription, members || []);
    res.json({ success: true, data: { suggestions } });
  } catch (err) {
    logger.error('AI suggest-assignee error', { error: err.message });
    res.status(500).json({ success: false, error: { code: 'AI_ERROR', message: 'Internal server error' } });
  }
});

router.post('/generate-report', async (req, res) => {
  const { type, projectData } = req.body;
  if (!type || !['weekly', 'executive', 'technical'].includes(type)) {
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'type must be weekly, executive, or technical' } });
  }
  try {
    const report = await aiService.generateReport(type, projectData || {});
    res.json({ success: true, data: { report } });
  } catch (err) {
    logger.error('AI generate-report error', { error: err.message });
    res.status(500).json({ success: false, error: { code: 'AI_ERROR', message: 'Internal server error' } });
  }
});

router.post('/review-task', async (req, res) => {
  const { task } = req.body;
  if (!task?.title) {
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'task object with title is required' } });
  }
  try {
    const review = await aiService.reviewTask(task);
    res.json({ success: true, data: { review } });
  } catch (err) {
    logger.error('AI review-task error', { error: err.message });
    res.status(500).json({ success: false, error: { code: 'AI_ERROR', message: 'Internal server error' } });
  }
});

module.exports = router;
