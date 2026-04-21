const express = require('express');
const { authenticate } = require('../middleware/auth');
const timeLogService = require('../services/timeLogService');

const router = express.Router();

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
router.get('/my', (req, res) => {
  try {
    const { startDate, endDate, projectId, status, page, page_size } = req.query;
    const result = timeLogService.getMyLogs(req.user.id, req.user.orgId, {
      startDate,
      endDate,
      projectId,
      status,
      page: page ? parseInt(page, 10) : 1,
      pageSize: page_size ? parseInt(page_size, 10) : 50,
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// ---------------------------------------------------------------------------
// GET /summary/weekly?weekStart=YYYY-MM-DD
// ---------------------------------------------------------------------------
router.get('/summary/weekly', (req, res) => {
  try {
    const weekStart = req.query.weekStart || getMostRecentMonday();
    const data = timeLogService.getWeeklySummary(req.user.id, req.user.orgId, weekStart);
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
router.get('/timesheets', (req, res) => {
  try {
    const { status } = req.query;
    const data = timeLogService.getTimesheets(req.user.id, req.user.orgId, req.user.role, { status });
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
// POST /timesheets/submit — body { weekStart }
// ---------------------------------------------------------------------------
router.post('/timesheets/submit', (req, res) => {
  try {
    const { weekStart } = req.body || {};
    const data = timeLogService.submitTimesheet(req.user.id, req.user.orgId, weekStart);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
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
router.post('/', (req, res) => {
  try {
    const {
      taskKey, taskTitle, projectId, projectKey, projectColor,
      divisionId, hours, description, loggedDate,
    } = req.body || {};

    const parsedHours = typeof hours === 'string' ? parseFloat(hours) : hours;

    const data = timeLogService.logTime(req.user.id, req.user.orgId, {
      taskKey,
      taskTitle,
      projectId,
      projectKey,
      projectColor,
      divisionId,
      hours: parsedHours,
      description,
      loggedDate,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// ---------------------------------------------------------------------------
// PATCH /:id — update a log
// ---------------------------------------------------------------------------
router.patch('/:id', (req, res) => {
  try {
    const { hours, description, loggedDate } = req.body || {};
    const parsedHours = hours !== undefined
      ? (typeof hours === 'string' ? parseFloat(hours) : hours)
      : undefined;

    const data = timeLogService.updateLog(req.params.id, req.user.id, {
      hours: parsedHours,
      description,
      loggedDate,
    });
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
