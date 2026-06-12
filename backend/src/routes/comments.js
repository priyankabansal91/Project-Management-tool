const { Router } = require('express');
const commentService = require('../services/commentService');
const { authenticate } = require('../middleware/auth');
const { createCommentSchema, updateCommentSchema } = require('../validators/comments');

const router = Router();

router.use(authenticate);

router.get('/task/:taskId', async (req, res, next) => {
  try {
    const comments = await commentService.listByTask(req.user.orgId, req.params.taskId);
    res.json({ success: true, data: { items: comments } });
  } catch (err) {
    next(err);
  }
});

router.post('/task/:taskId', async (req, res, next) => {
  try {
    let data;
    try {
      data = createCommentSchema.parse(req.body);
    } catch (err) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
    }
    const comment = await commentService.create(req.user.orgId, req.params.taskId, req.user.id, data);
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
});

router.patch('/:commentId', async (req, res, next) => {
  try {
    let data;
    try {
      data = updateCommentSchema.parse(req.body);
    } catch (err) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
    }
    const comment = await commentService.update(req.user.orgId, req.params.commentId, req.user.id, data);
    res.json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
});

router.delete('/:commentId', async (req, res, next) => {
  try {
    await commentService.delete(req.user.orgId, req.params.commentId, req.user.id, req.user.role);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
