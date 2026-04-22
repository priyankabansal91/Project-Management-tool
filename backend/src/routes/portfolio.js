const express = require('express');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const portfolioService = require('../services/portfolioService');

const router = express.Router();

// ─── Validation helper (matches timeLogs.js pattern) ─────────────────────────

function validate(schema, source) {
  return (req, res, next) => {
    const result = schema.safeParse(source === 'body' ? req.body : req.query);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: result.error.errors,
        },
      });
    }
    if (source === 'body') req.body = result.data;
    else req.validatedQuery = result.data;
    next();
  };
}

// ─── Validation schemas ───────────────────────────────────────────────────────

const capacityQuerySchema = z.object({
  weeks: z.coerce.number().int().min(1).max(12).default(4),
});

// ─── All routes require authentication ───────────────────────────────────────

router.use(authenticate);

// ─── GET /v1/portfolio ────────────────────────────────────────────────────────
// Returns portfolio summary: all projects with health, budget, progress stats.

router.get('/', (req, res) => {
  try {
    const data = portfolioService.getPortfolioSummary(req.user.orgId);
    return res.json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: status === 500 ? 'Internal server error' : err.message,
      },
    });
  }
});

// ─── GET /v1/portfolio/capacity?weeks=4 ──────────────────────────────────────
// Returns capacity planning data for team members over the next N weeks.

router.get('/capacity', validate(capacityQuerySchema, 'query'), (req, res) => {
  try {
    const { weeks } = req.validatedQuery;
    const data = portfolioService.getCapacityData(req.user.orgId, { weeks });
    return res.json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: status === 500 ? 'Internal server error' : err.message,
      },
    });
  }
});

// ─── GET /v1/portfolio/dependencies ──────────────────────────────────────────
// Returns project dependency graph (nodes + edges).

router.get('/dependencies', (req, res) => {
  try {
    const data = portfolioService.getDependencies(req.user.orgId);
    return res.json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: status === 500 ? 'Internal server error' : err.message,
      },
    });
  }
});

module.exports = router;
