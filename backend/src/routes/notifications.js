const { Router } = require('express');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = Router();
router.use(authenticate);

// GET /v1/notifications
router.get('/', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, parseInt(req.query.page_size) || 30);
    const unreadOnly = req.query.unread_only === 'true';
    const data = notificationService.getNotifications(req.user.id, req.user.orgId, { page, pageSize, unreadOnly });
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// PATCH /v1/notifications/read-all  (must be before /:id)
router.patch('/read-all', (req, res) => {
  try {
    notificationService.markAllRead(req.user.id, req.user.orgId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// PATCH /v1/notifications/:id/read
router.patch('/:id/read', (req, res) => {
  try {
    const data = notificationService.markAsRead(req.params.id, req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { code: err.status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR', message: err.status === 404 ? 'Not found' : 'Internal server error' } });
  }
});

// DELETE /v1/notifications/:id
router.delete('/:id', (req, res) => {
  try {
    notificationService.deleteNotification(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

module.exports = router;
