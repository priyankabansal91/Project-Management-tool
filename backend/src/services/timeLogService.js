// In-memory storage
const timeLogsStore = new Map();
const timesheetsStore = new Map();

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

function genLogId() {
  return 'tl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

function genTimesheetId() {
  return 'ts_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

/**
 * Return the ISO date string (YYYY-MM-DD) for the Monday of the week
 * containing `dateStr`.
 */
function getMondayOf(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diff = (day === 0 ? -6 : 1 - day);
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/**
 * Return YYYY-MM-DD that is `n` days after `dateStr`.
 */
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  return DAY_LABELS[d.getUTCDay()];
}

const USER_NAMES = {
  'dev-member-id':          'Ravi Kumar',
  'dev-project_manager-id': 'Anjali Singh',
  'dev-org_admin-id':       'Priya Sharma',
  'dev-division_admin-id':  'Rahul Mehta',
  'dev-executive-id':       'Vikram Nair',
  'dev-viewer-id':          'Sneha Patel',
};

const ADMIN_ROLES = new Set(['org_admin', 'division_admin', 'project_manager']);

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

function seed() {
  // ---- helper to create a log entry ----
  function mkLog({
    id, userId, taskKey, taskTitle, projectId, projectKey, projectColor,
    divisionId, hours, description, loggedDate, timesheetId = null,
    status = 'draft',
  }) {
    const now = new Date().toISOString();
    const log = {
      id,
      orgId: 'dev-org-id',
      userId,
      taskKey,
      taskTitle,
      projectId,
      projectKey,
      projectColor,
      divisionId,
      hours,
      description,
      loggedDate,
      timesheetId,
      status,
      createdAt: now,
      updatedAt: now,
    };
    timeLogsStore.set(id, log);
    return log;
  }

  // ---- Ravi Kumar (dev-member-id) — week Apr 14–20 ----
  const rl1  = mkLog({ id: 'tl_seed_rl01', userId: 'dev-member-id', taskKey: 'APIV3-1', taskTitle: 'Auth module backend',      projectId: 'proj_eng_2',     projectKey: 'APIV3',  projectColor: '#8B5CF6', divisionId: 'div_engineering', hours: 3,   description: 'Implemented auth module backend',           loggedDate: '2026-04-14', timesheetId: 'ts_seed_ravi_1', status: 'submitted' });
  const rl2  = mkLog({ id: 'tl_seed_rl02', userId: 'dev-member-id', taskKey: 'APIV3-2', taskTitle: 'Database schema design',   projectId: 'proj_eng_2',     projectKey: 'APIV3',  projectColor: '#8B5CF6', divisionId: 'div_engineering', hours: 2,   description: 'Designed database schema',                  loggedDate: '2026-04-14', timesheetId: 'ts_seed_ravi_1', status: 'submitted' });
  const rl3  = mkLog({ id: 'tl_seed_rl03', userId: 'dev-member-id', taskKey: 'APIV3-1', taskTitle: 'JWT implementation',       projectId: 'proj_eng_2',     projectKey: 'APIV3',  projectColor: '#8B5CF6', divisionId: 'div_engineering', hours: 4,   description: 'Implemented JWT authentication',            loggedDate: '2026-04-15', timesheetId: 'ts_seed_ravi_1', status: 'submitted' });
  const rl4  = mkLog({ id: 'tl_seed_rl04', userId: 'dev-member-id', taskKey: 'APIV3-3', taskTitle: 'API endpoint testing',     projectId: 'proj_eng_2',     projectKey: 'APIV3',  projectColor: '#8B5CF6', divisionId: 'div_engineering', hours: 3.5, description: 'Tested API endpoints',                      loggedDate: '2026-04-16', timesheetId: 'ts_seed_ravi_1', status: 'submitted' });
  const rl5  = mkLog({ id: 'tl_seed_rl05', userId: 'dev-member-id', taskKey: 'APIV3-1', taskTitle: 'Code review fixes',        projectId: 'proj_eng_2',     projectKey: 'APIV3',  projectColor: '#8B5CF6', divisionId: 'div_engineering', hours: 4,   description: 'Fixed code review comments',                loggedDate: '2026-04-17', timesheetId: 'ts_seed_ravi_1', status: 'submitted' });
  const rl6  = mkLog({ id: 'tl_seed_rl06', userId: 'dev-member-id', taskKey: 'SAMPLE-1', taskTitle: 'Sprint planning',         projectId: 'proj_default_1', projectKey: 'SAMPLE', projectColor: '#3B82F6', divisionId: 'div_engineering', hours: 2,   description: 'Participated in sprint planning',           loggedDate: '2026-04-18', timesheetId: 'ts_seed_ravi_1', status: 'submitted' });
  // week Apr 21–27 (current, draft)
  const rl7  = mkLog({ id: 'tl_seed_rl07', userId: 'dev-member-id', taskKey: 'APIV3-4', taskTitle: 'Frontend integration',     projectId: 'proj_eng_2',     projectKey: 'APIV3',  projectColor: '#8B5CF6', divisionId: 'div_engineering', hours: 3,   description: 'Worked on frontend integration',            loggedDate: '2026-04-21' });
  const rl8  = mkLog({ id: 'tl_seed_rl08', userId: 'dev-member-id', taskKey: 'APIV3-5', taskTitle: 'Bug fixes',                projectId: 'proj_eng_2',     projectKey: 'APIV3',  projectColor: '#8B5CF6', divisionId: 'div_engineering', hours: 1.5, description: 'Fixed reported bugs',                       loggedDate: '2026-04-21' });

  // Ravi's submitted timesheet for Apr 14–20
  const raviTs = {
    id: 'ts_seed_ravi_1',
    orgId: 'dev-org-id',
    userId: 'dev-member-id',
    weekStart: '2026-04-13',
    weekEnd: '2026-04-19',
    totalHours: 18.5,
    status: 'submitted',
    submittedAt: new Date('2026-04-20T10:00:00Z').toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    entryIds: [rl1.id, rl2.id, rl3.id, rl4.id, rl5.id, rl6.id],
    createdAt: new Date('2026-04-20T10:00:00Z').toISOString(),
  };
  timesheetsStore.set(raviTs.id, raviTs);

  // ---- Anjali Singh (dev-project_manager-id) — week Apr 14–20 ----
  const al1 = mkLog({ id: 'tl_seed_al01', userId: 'dev-project_manager-id', taskKey: 'APIV3-1',  taskTitle: 'Sprint planning meeting', projectId: 'proj_eng_2',     projectKey: 'APIV3',  projectColor: '#8B5CF6', divisionId: 'div_engineering', hours: 2,   description: 'Ran sprint planning meeting',               loggedDate: '2026-04-14', timesheetId: 'ts_seed_anjali_1', status: 'approved' });
  const al2 = mkLog({ id: 'tl_seed_al02', userId: 'dev-project_manager-id', taskKey: 'APIV3-2',  taskTitle: 'Requirements review',    projectId: 'proj_eng_2',     projectKey: 'APIV3',  projectColor: '#8B5CF6', divisionId: 'div_engineering', hours: 1.5, description: 'Reviewed requirements documentation',       loggedDate: '2026-04-15', timesheetId: 'ts_seed_anjali_1', status: 'approved' });
  const al3 = mkLog({ id: 'tl_seed_al03', userId: 'dev-project_manager-id', taskKey: 'SAMPLE-1', taskTitle: 'Stakeholder call prep',  projectId: 'proj_default_1', projectKey: 'SAMPLE', projectColor: '#3B82F6', divisionId: 'div_engineering', hours: 3,   description: 'Prepared materials for stakeholder call',   loggedDate: '2026-04-16', timesheetId: 'ts_seed_anjali_1', status: 'approved' });
  const al4 = mkLog({ id: 'tl_seed_al04', userId: 'dev-project_manager-id', taskKey: 'APIV3-3',  taskTitle: 'QA review',             projectId: 'proj_eng_2',     projectKey: 'APIV3',  projectColor: '#8B5CF6', divisionId: 'div_engineering', hours: 2,   description: 'Reviewed QA test results',                  loggedDate: '2026-04-17', timesheetId: 'ts_seed_anjali_1', status: 'approved' });
  const al5 = mkLog({ id: 'tl_seed_al05', userId: 'dev-project_manager-id', taskKey: 'APIV3-1',  taskTitle: 'Architecture planning',  projectId: 'proj_eng_2',     projectKey: 'APIV3',  projectColor: '#8B5CF6', divisionId: 'div_engineering', hours: 4,   description: 'Planned API architecture for next sprint',  loggedDate: '2026-04-18', timesheetId: 'ts_seed_anjali_1', status: 'approved' });
  // week Apr 21–27 (current, draft)
  const al6 = mkLog({ id: 'tl_seed_al06', userId: 'dev-project_manager-id', taskKey: 'APIV3-4',  taskTitle: 'Feature development',    projectId: 'proj_eng_2',     projectKey: 'APIV3',  projectColor: '#8B5CF6', divisionId: 'div_engineering', hours: 5,   description: 'Worked on new feature development',         loggedDate: '2026-04-21' });

  // Anjali's approved timesheet for Apr 14–20
  const anjaliTs = {
    id: 'ts_seed_anjali_1',
    orgId: 'dev-org-id',
    userId: 'dev-project_manager-id',
    weekStart: '2026-04-13',
    weekEnd: '2026-04-19',
    totalHours: 12.5,
    status: 'approved',
    submittedAt: new Date('2026-04-20T09:00:00Z').toISOString(),
    reviewedBy: 'dev-org_admin-id',
    reviewedAt: new Date('2026-04-20T15:00:00Z').toISOString(),
    reviewNote: 'Great work this week!',
    entryIds: [al1.id, al2.id, al3.id, al4.id, al5.id],
    createdAt: new Date('2026-04-20T09:00:00Z').toISOString(),
  };
  timesheetsStore.set(anjaliTs.id, anjaliTs);
}

seed();

// ---------------------------------------------------------------------------
// TimeLogService class
// ---------------------------------------------------------------------------

class TimeLogService {
  // 1. Log time
  logTime(userId, orgId, {
    taskKey, taskTitle, projectId, projectKey, projectColor,
    divisionId, hours, description, loggedDate,
  }) {
    if (typeof hours !== 'number' || hours <= 0) throw Object.assign(new Error('hours must be a positive number'), { code: 'VALIDATION_ERROR', status: 400 });

    const date = loggedDate || new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const id = genLogId();

    const log = {
      id,
      orgId,
      userId,
      taskKey: taskKey || null,
      taskTitle: taskTitle || taskKey || 'General',
      projectId: projectId || null,
      projectKey: projectKey || null,
      projectColor: projectColor || null,
      divisionId: divisionId || null,
      hours,
      description: description || null,
      loggedDate: date,
      timesheetId: null,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };

    timeLogsStore.set(id, log);
    return log;
  }

  // 2. Get my logs (filtered)
  getMyLogs(userId, orgId, { startDate, endDate, projectId, status, page = 1, pageSize = 50 } = {}) {
    let items = Array.from(timeLogsStore.values()).filter(
      l => l.userId === userId && l.orgId === orgId,
    );

    if (startDate) items = items.filter(l => l.loggedDate >= startDate);
    if (endDate)   items = items.filter(l => l.loggedDate <= endDate);
    if (projectId) items = items.filter(l => l.projectId === projectId);
    if (status)    items = items.filter(l => l.status === status);

    items.sort((a, b) => (b.loggedDate > a.loggedDate ? 1 : b.loggedDate < a.loggedDate ? -1 : 0));

    const total = items.length;
    const p = parseInt(page, 10) || 1;
    const ps = parseInt(pageSize, 10) || 50;
    const paginated = items.slice((p - 1) * ps, p * ps);

    return {
      items: paginated,
      pagination: { page: p, pageSize: ps, total, totalPages: Math.ceil(total / ps) },
    };
  }

  // 3. Update log
  updateLog(id, userId, { hours, description, loggedDate }) {
    const log = timeLogsStore.get(id);
    if (!log) throw Object.assign(new Error('Time log not found'), { code: 'NOT_FOUND', status: 404 });
    if (log.userId !== userId) throw Object.assign(new Error('You can only edit your own logs'), { code: 'FORBIDDEN', status: 403 });
    if (log.status !== 'draft' && log.status !== 'rejected') {
      throw Object.assign(new Error('Only draft or rejected logs can be edited'), { code: 'INVALID_STATE', status: 400 });
    }

    if (hours !== undefined) {
      if (typeof hours !== 'number' || hours <= 0) throw Object.assign(new Error('hours must be a positive number'), { code: 'VALIDATION_ERROR', status: 400 });
      log.hours = hours;
    }
    if (description !== undefined) log.description = description;
    if (loggedDate !== undefined)  log.loggedDate = loggedDate;
    log.updatedAt = new Date().toISOString();

    timeLogsStore.set(id, log);
    return log;
  }

  // 4. Delete log
  deleteLog(id, userId, role) {
    const log = timeLogsStore.get(id);
    if (!log) throw Object.assign(new Error('Time log not found'), { code: 'NOT_FOUND', status: 404 });

    const isOwner = log.userId === userId;
    const isAdmin = ADMIN_ROLES.has(role);

    if (!isOwner && !isAdmin) {
      throw Object.assign(new Error('You do not have permission to delete this log'), { code: 'FORBIDDEN', status: 403 });
    }

    timeLogsStore.delete(id);
    return { deleted: true };
  }

  // 5. Weekly summary
  getWeeklySummary(userId, orgId, weekStart) {
    const monday = weekStart || getMondayOf(new Date().toISOString().slice(0, 10));
    const sunday = addDays(monday, 6);

    const logs = Array.from(timeLogsStore.values()).filter(
      l => l.userId === userId && l.orgId === orgId &&
           l.loggedDate >= monday && l.loggedDate <= sunday,
    );

    // Build byDay structure (Mon–Sun)
    const byDay = {};
    for (let i = 0; i < 7; i++) {
      const date = addDays(monday, i);
      const label = dayLabel(date);
      byDay[label] = { date, hours: 0, entries: [] };
    }

    logs.forEach(log => {
      const label = dayLabel(log.loggedDate);
      if (byDay[label]) {
        byDay[label].hours += log.hours;
        byDay[label].entries.push(log);
      }
    });

    // Build byProject
    const projectMap = {};
    logs.forEach(log => {
      const key = log.projectKey || 'UNKNOWN';
      if (!projectMap[key]) {
        projectMap[key] = {
          projectKey: key,
          projectColor: log.projectColor,
          hours: 0,
          days: {},
        };
      }
      projectMap[key].hours += log.hours;
      const label = dayLabel(log.loggedDate);
      projectMap[key].days[label] = (projectMap[key].days[label] || 0) + log.hours;
    });

    const totalHours = logs.reduce((sum, l) => sum + l.hours, 0);

    // Find timesheet status for this week
    const ts = Array.from(timesheetsStore.values()).find(
      t => t.userId === userId && t.orgId === orgId && t.weekStart === monday,
    );

    return {
      weekStart: monday,
      weekEnd: sunday,
      totalHours,
      targetHours: 40,
      byDay,
      byProject: Object.values(projectMap),
      timesheetStatus: ts ? ts.status : null,
    };
  }

  // 6. Submit timesheet
  submitTimesheet(userId, orgId, weekStart) {
    if (!weekStart) throw Object.assign(new Error('weekStart is required'), { code: 'VALIDATION_ERROR', status: 400 });

    const monday = weekStart;
    const sunday = addDays(monday, 6);

    const draftLogs = Array.from(timeLogsStore.values()).filter(
      l => l.userId === userId && l.orgId === orgId &&
           l.loggedDate >= monday && l.loggedDate <= sunday &&
           (l.status === 'draft' || l.status === 'rejected'),
    );

    if (draftLogs.length === 0) {
      throw Object.assign(new Error('No draft logs found for this week'), { code: 'NO_LOGS', status: 400 });
    }

    const totalHours = draftLogs.reduce((sum, l) => sum + l.hours, 0);
    const now = new Date().toISOString();

    // Check if timesheet already exists for this week
    let ts = Array.from(timesheetsStore.values()).find(
      t => t.userId === userId && t.orgId === orgId && t.weekStart === monday,
    );

    const entryIds = draftLogs.map(l => l.id);

    if (ts) {
      // Update existing timesheet
      ts.totalHours = totalHours;
      ts.status = 'submitted';
      ts.submittedAt = now;
      ts.reviewedBy = null;
      ts.reviewedAt = null;
      ts.reviewNote = null;
      // Merge entry ids (avoid duplicates)
      ts.entryIds = Array.from(new Set([...ts.entryIds, ...entryIds]));
      timesheetsStore.set(ts.id, ts);
    } else {
      ts = {
        id: genTimesheetId(),
        orgId,
        userId,
        weekStart: monday,
        weekEnd: sunday,
        totalHours,
        status: 'submitted',
        submittedAt: now,
        reviewedBy: null,
        reviewedAt: null,
        reviewNote: null,
        entryIds,
        createdAt: now,
      };
      timesheetsStore.set(ts.id, ts);
    }

    // Mark all draft/rejected logs as submitted and link to timesheet
    draftLogs.forEach(log => {
      log.status = 'submitted';
      log.timesheetId = ts.id;
      log.updatedAt = now;
      timeLogsStore.set(log.id, log);
    });

    return ts;
  }

  // 7. Get timesheets
  getTimesheets(userId, orgId, role, { status } = {}) {
    let items = Array.from(timesheetsStore.values()).filter(t => t.orgId === orgId);

    // Members see only their own timesheets
    if (role === 'member' || role === 'viewer') {
      items = items.filter(t => t.userId === userId);
    }

    if (status) items = items.filter(t => t.status === status);

    items.sort((a, b) => (b.weekStart > a.weekStart ? 1 : b.weekStart < a.weekStart ? -1 : 0));

    return items;
  }

  // 8. Review timesheet
  reviewTimesheet(timesheetId, reviewerId, reviewerRole, action, note) {
    const allowed = ['project_manager', 'division_admin', 'org_admin'];
    if (!allowed.includes(reviewerRole)) {
      throw Object.assign(new Error('Insufficient permissions to review timesheets'), { code: 'FORBIDDEN', status: 403 });
    }
    if (!['approve', 'reject'].includes(action)) {
      throw Object.assign(new Error('action must be approve or reject'), { code: 'VALIDATION_ERROR', status: 400 });
    }

    const ts = timesheetsStore.get(timesheetId);
    if (!ts) throw Object.assign(new Error('Timesheet not found'), { code: 'NOT_FOUND', status: 404 });
    if (ts.status !== 'submitted') {
      throw Object.assign(new Error('Only submitted timesheets can be reviewed'), { code: 'INVALID_STATE', status: 400 });
    }
    if (action === 'reject' && !note) {
      throw Object.assign(new Error('A note is required when rejecting a timesheet'), { code: 'VALIDATION_ERROR', status: 400 });
    }

    const now = new Date().toISOString();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    ts.status = newStatus;
    ts.reviewedBy = reviewerId;
    ts.reviewedAt = now;
    ts.reviewNote = note || null;
    timesheetsStore.set(timesheetId, ts);

    // Update all linked log statuses
    ts.entryIds.forEach(logId => {
      const log = timeLogsStore.get(logId);
      if (log) {
        log.status = newStatus;
        log.updatedAt = now;
        timeLogsStore.set(logId, log);
      }
    });

    return ts;
  }

  // 9. Org summary (PM/admin)
  getOrgSummary(orgId, { startDate, endDate } = {}) {
    let logs = Array.from(timeLogsStore.values()).filter(l => l.orgId === orgId);

    if (startDate) logs = logs.filter(l => l.loggedDate >= startDate);
    if (endDate)   logs = logs.filter(l => l.loggedDate <= endDate);

    const totalHours = logs.reduce((sum, l) => sum + l.hours, 0);

    // byMember
    const memberMap = {};
    logs.forEach(log => {
      if (!memberMap[log.userId]) {
        memberMap[log.userId] = { userId: log.userId, name: USER_NAMES[log.userId] || log.userId, hours: 0 };
      }
      memberMap[log.userId].hours += log.hours;
    });

    // byProject
    const projectMap = {};
    logs.forEach(log => {
      const key = log.projectKey || 'UNKNOWN';
      if (!projectMap[key]) {
        projectMap[key] = { projectKey: key, hours: 0 };
      }
      projectMap[key].hours += log.hours;
    });

    // pending timesheets
    const pendingTimesheets = Array.from(timesheetsStore.values()).filter(
      t => t.orgId === orgId && t.status === 'submitted',
    ).length;

    return {
      totalHours,
      byMember: Object.values(memberMap),
      byProject: Object.values(projectMap),
      pendingTimesheets,
    };
  }
}

module.exports = new TimeLogService();
