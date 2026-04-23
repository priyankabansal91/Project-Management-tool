const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const executiveService = require('../services/executiveService');

const router = Router();
router.use(authenticate);

/**
 * GET /v1/executive/rollup
 * Full cross-division rollup — org_admin and executive roles only.
 */
router.get('/rollup', async (req, res) => {
  try {
    const { role, orgId } = req.user;
    if (role !== 'org_admin' && role !== 'executive') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Executive or admin access required' } });
    }
    const data = await executiveService.getRollup(orgId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

/**
 * GET /v1/executive/scorecards
 * Per-division health scorecards — org_admin and executive roles.
 */
router.get('/scorecards', async (req, res) => {
  try {
    const { role, orgId } = req.user;
    if (role !== 'org_admin' && role !== 'executive') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Executive or admin access required' } });
    }
    const scorecards = await executiveService.getDivisionScorecards(orgId);
    res.json({ success: true, data: scorecards });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

module.exports = router;
