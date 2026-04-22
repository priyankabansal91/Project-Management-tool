const { Router } = require('express');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const searchService = require('../services/searchService');

const router = Router();
router.use(authenticate);

const querySchema = z.object({
  q:         z.string().min(1).max(200),
  types:     z.string().optional().default('tasks,projects'),
  page:      z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(50).default(20),
});

router.get('/', (req, res) => {
  const result = querySchema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid query' } });
  }
  try {
    const { q, types, page, page_size } = result.data;
    const data = searchService.search(req.user.orgId, { q, types, page, pageSize: page_size });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

module.exports = router;
