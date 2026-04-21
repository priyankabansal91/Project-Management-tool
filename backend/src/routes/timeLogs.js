const express = require('express');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const timeLogService = require('../services/timeLogService');

const router = express.Router();

// ─── Validation schemas ────────────────────────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const paginationSchema = z.object({
  page:      z.coerce.number().int().min(1).max(10000).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(50),
});

const weekStartSchema = z.string().regex(DATE_RE, 'weekStart must be YYYY-MM-DD').optional();

const logBodySchema = z.object({
  taskKey:      z.string().max(50).optional(),
  taskTitle:    z.string().max(255).optional(),
  projectId:    z.string().max(100).optional(),
  projectKey:   z.string().max(50).optional(),
  projectColor: z.string().max(20).optional(),
  divisionId:   z.string().max(100).optional(),
  hours:        z.coerce.number().positive().max(24),
  description:  z.string().max(2000).optional(),
  loggedDate:   z.string().regex(DATE_RE, 'loggedDate must be YYYY-MM-DD').optional(),
});

const updateLogSchema = z.object({
  hours:       z.coerce.number().positive().max(24).optional(),
  description: z.string().max(2000).optional(),
  loggedDate:  z.string().regex(DATE_RE).optional(),
});

const timesheetStatusSchema = z.enum(['draft', 'submitted', 'approved', 'rejected']).optional();

function validate(schema, source) {
  return (req, res, next) => {
    const result = schema.safeParse(source === 'body' ? req.body : req.query);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: result.error.errors },
      });
    }
    if (source === 'body') req.body = result.data;
    else req.validatedQuery = result.data;
    next();
  };
}

// All routes require authentication
router.use(authenticate);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return the ISO date string (YYYY-MM-DD) for the most recent Monday
 * on or before today.
 */
function getMostRecentMonday() {
  const today = new Date();
  const day = today.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() + diff);
  return monday.toISOString().slice(0, 10);
}

const ADMIN_ROLES = new Set(['org_admin', 'division_admin', 'project_manager', 'executive']);

// ---------------------------------------------------------------------------
// GET /my
// Returns the authenticated user's logs, filtered by query params.
// ---------------------------------------------------------------------------
router.get('/my', validate(paginationSchema.merge(z.object({
  startDate:  z.string().regex(DATE_RE).optional(),
  endDate:    z.string().regex(DATE_RE).optional(),
  projectId:  z.string().max(100).optional(),
  status:     timesheetStatusSchema,
})), 'query'), (req, res) => {
  try {
    const { startDate, endDate, projectId, status, page, page_size } = req.validatedQuery;
    const result = timeLogService.getMyLogs(req.user.id, req.user.orgId, {
      startDate, endDate, projectId, status, page, pageSize: page_size,
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: status === 500 ? 'Internal server error' : err.message },
    });
  }
});

// ---------------------------------------------------------------------------
// GET /summary/weekly?weekStart=YYYY-MM-DD
// ---------------------------------------------------------------------------
router.get('/summary/weekly', validate(z.object({ weekStart: weekStartSchema }), 'query'), (req, res) => {
  try {
    const weekStart = req.validatedQuery.weekStart || getMostRecentMonday();
    const data = timeLogService.getWeeklySummary(req.user.id, req.user.orgId, weekStart);
    return res.json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: status === 500 ? 'Internal server error' : err.message },
    });
  }
});

// ---------------------------------------------------------------------------
// GET /summary/org?startDate=&endDate=
// Only PM/admin roles; members and viewers get 403.
// ---------------------------------------------------------------------------
router.get('/summary/org', (req, res) => {
  try {
    const { role } = req.user;
    if (role === 'member' || role === 'viewer') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions to view org summary' },
      });
    }
    const { startDate, endDate } = req.query;
    const data = timeLogService.getOrgSummary(req.user.orgId, { startDate, endDate });
    return res.json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// ---------------------------------------------------------------------------
// GET /timesheets?status=
// ---------------------------------------------------------------------------
router.get('/timesheets', validate(z.object({ status: timesheetStatusSchema }), 'query'), (req, res) => {
  try {
    const { status } = req.validatedQuery;
    const data = timeLogService.getTimesheets(req.user.id, req.user.orgId, req.user.role, { status });
    return res.json({ success: true, data });
  } catch (err) {
    const st = err.status || 500;
    return res.status(st).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: st === 500 ? 'Internal server error' : err.message },
    });
  }
});

// ---------------------------------------------------------------------------
// POST /timesheets/submit — body { weekStart }
// ---------------------------------------------------------------------------
router.post('/timesheets/submit', validate(z.object({
  weekStart: z.string().regex(DATE_RE, 'weekStart must be YYYY-MM-DD'),
  note:      z.string().max(500).optional(),
}), 'body'), (req, res) => {
  try {
    const { weekStart } = req.body;
    const data = timeLogService.submitTimesheet(req.user.id, req.user.orgId, weekStart);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    const st = err.status || 500;
    return res.status(st).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: st === 500 ? 'Internal server error' : err.message },
    });
  }
});

// ---------------------------------------------------------------------------
// PATCH /timesheets/:timesheetId/approve — body { note? }
// ---------------------------------------------------------------------------
router.patch('/timesheets/:timesheetId/approve', (req, res) => {
  try {
    const { timesheetId } = req.params;
    const { note } = req.body || {};
    const data = timeLogService.reviewTimesheet(
      timesheetId, req.user.id, req.user.role, 'approve', note,
    );
    return res.json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// ---------------------------------------------------------------------------
// PATCH /timesheets/:timesheetId/reject — body { note }
// ---------------------------------------------------------------------------
router.patch('/timesheets/:timesheetId/reject', (req, res) => {
  try {
    const { timesheetId } = req.params;
    const { note } = req.body || {};
    const data = timeLogService.reviewTimesheet(
      timesheetId, req.user.id, req.user.role, 'reject', note,
    );
    return res.json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// ---------------------------------------------------------------------------
// POST / — log time
// body { taskKey, taskTitle?, projectId?, projectKey?, projectColor?,
//        divisionId?, hours, description?, loggedDate? }
// ---------------------------------------------------------------------------
router.post('/', validate(logBodySchema, 'body'), (req, res) => {
  try {
    const data = timeLogService.logTime(req.user.id, req.user.orgId, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    const st = err.status || 500;
    return res.status(st).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: st === 500 ? 'Internal server error' : err.message },
    });
  }
});

// ---------------------------------------------------------------------------
// PATCH /:id — update a log
// ---------------------------------------------------------------------------
router.patch('/:id', validate(updateLogSchema, 'body'), (req, res) => {
  try {
    const data = timeLogService.updateLog(req.params.id, req.user.id, req.body);
    return res.json({ success: true, data });
  } catch (err) {
    const st = err.status || 500;
    return res.status(st).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: st === 500 ? 'Internal server error' : err.message },
    });
  }
});

// ---------------------------------------------------------------------------
// DELETE /:id — delete a log
// ---------------------------------------------------------------------------
router.delete('/:id', (req, res) => {
  try {
    const data = timeLogService.deleteLog(req.params.id, req.user.id, req.user.role);
    return res.json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
});

module.exports = router;
