const { Router } = require('express');
const dashboardService = require('../services/dashboardService');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/overview', async (req, res, next) => {
  try {
    const data = await dashboardService.getOverview(req.user.orgId, req.user.id, req.user.role);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
