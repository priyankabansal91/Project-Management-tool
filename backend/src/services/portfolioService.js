// ─── Portfolio Management & Capacity Planning Service ────────────────────────
// In-memory mock data (no DB). All public functions accept orgId so they are
// ready to be scoped once a real data layer is added.

// ─── Static seed data ────────────────────────────────────────────────────────

const SEED_PROJECTS = [
  {
    id: 'proj_eng_1',
    name: 'Cloud Migration Initiative',
    division: 'Engineering',
    budget: { allocated: 450000, spent: 312000, currency: 'USD' },
    progress: 68,
    tasksTotal: 120, tasksDone: 82, tasksBlocked: 4,
    teamSize: 12,
    startDate: '2025-09-01',
    endDate: '2026-06-30',
    priority: 'critical',
    phase: 'execution',
    tags: ['cloud', 'infrastructure', 'aws'],
    lastActivity: '2026-04-21T14:30:00.000Z',
  },
  {
    id: 'proj_eng_2',
    name: 'API Platform v3',
    division: 'Engineering',
    budget: { allocated: 180000, spent: 95000, currency: 'USD' },
    progress: 52,
    tasksTotal: 74, tasksDone: 38, tasksBlocked: 2,
    teamSize: 6,
    startDate: '2026-01-15',
    endDate: '2026-07-31',
    priority: 'high',
    phase: 'execution',
    tags: ['api', 'graphql', 'platform'],
    lastActivity: '2026-04-22T09:15:00.000Z',
  },
  {
    id: 'proj_eng_3',
    name: 'Security Compliance Hardening',
    division: 'Engineering',
    budget: { allocated: 90000, spent: 87500, currency: 'USD' },
    progress: 34,
    tasksTotal: 55, tasksDone: 19, tasksBlocked: 8,
    teamSize: 4,
    startDate: '2026-02-01',
    endDate: '2026-05-15',
    priority: 'critical',
    phase: 'execution',
    tags: ['security', 'compliance', 'iso27001'],
    lastActivity: '2026-04-20T16:45:00.000Z',
  },
  {
    id: 'proj_eng_4',
    name: 'Developer Portal Revamp',
    division: 'Engineering',
    budget: { allocated: 60000, spent: 12000, currency: 'USD' },
    progress: 18,
    tasksTotal: 40, tasksDone: 7, tasksBlocked: 0,
    teamSize: 3,
    startDate: '2026-04-01',
    endDate: '2026-08-31',
    priority: 'medium',
    phase: 'planning',
    tags: ['ux', 'documentation', 'portal'],
    lastActivity: '2026-04-18T11:00:00.000Z',
  },
  {
    id: 'proj_sales_1',
    name: 'Q2 Lead Generation Campaign',
    division: 'Sales',
    budget: { allocated: 75000, spent: 41000, currency: 'USD' },
    progress: 61,
    tasksTotal: 35, tasksDone: 21, tasksBlocked: 1,
    teamSize: 5,
    startDate: '2026-03-01',
    endDate: '2026-06-30',
    priority: 'high',
    phase: 'execution',
    tags: ['marketing', 'leads', 'campaign'],
    lastActivity: '2026-04-22T08:00:00.000Z',
  },
  {
    id: 'proj_sales_2',
    name: 'CRM Migration to Salesforce',
    division: 'Sales',
    budget: { allocated: 120000, spent: 118500, currency: 'USD' },
    progress: 95,
    tasksTotal: 50, tasksDone: 48, tasksBlocked: 0,
    teamSize: 4,
    startDate: '2025-11-01',
    endDate: '2026-04-30',
    priority: 'high',
    phase: 'review',
    tags: ['crm', 'salesforce', 'migration'],
    lastActivity: '2026-04-21T17:20:00.000Z',
  },
  {
    id: 'proj_hr_1',
    name: 'Annual Performance Review 2026',
    division: 'HR',
    budget: { allocated: 30000, spent: 9500, currency: 'USD' },
    progress: 45,
    tasksTotal: 28, tasksDone: 13, tasksBlocked: 0,
    teamSize: 3,
    startDate: '2026-03-15',
    endDate: '2026-05-31',
    priority: 'medium',
    phase: 'execution',
    tags: ['hr', 'performance', 'review'],
    lastActivity: '2026-04-19T10:30:00.000Z',
  },
  {
    id: 'proj_hr_2',
    name: 'L&D Platform Rollout',
    division: 'HR',
    budget: { allocated: 55000, spent: 55200, currency: 'USD' },
    progress: 100,
    tasksTotal: 32, tasksDone: 32, tasksBlocked: 0,
    teamSize: 2,
    startDate: '2025-07-01',
    endDate: '2026-03-31',
    priority: 'low',
    phase: 'done',
    tags: ['learning', 'lms', 'training'],
    lastActivity: '2026-03-31T18:00:00.000Z',
  },
];

// status is derived separately so health can be computed first
const SEED_PROJECT_STATUS = {
  proj_eng_1: 'at_risk',
  proj_eng_2: 'on_track',
  proj_eng_3: 'off_track',
  proj_eng_4: 'on_track',
  proj_sales_1: 'on_track',
  proj_sales_2: 'completed',
  proj_hr_1: 'on_track',
  proj_hr_2: 'completed',
};

const SEED_MEMBERS = [
  { id: 'mem_1',  name: 'Alex Rivera',    role: 'Senior Engineer',   division: 'Engineering', capacity: 40 },
  { id: 'mem_2',  name: 'Jordan Lee',     role: 'DevOps Engineer',   division: 'Engineering', capacity: 40 },
  { id: 'mem_3',  name: 'Morgan Chen',    role: 'Frontend Engineer', division: 'Engineering', capacity: 40 },
  { id: 'mem_4',  name: 'Taylor Smith',   role: 'Backend Engineer',  division: 'Engineering', capacity: 40 },
  { id: 'mem_5',  name: 'Casey Walsh',    role: 'Security Engineer', division: 'Engineering', capacity: 40 },
  { id: 'mem_6',  name: 'Jamie Patel',    role: 'Sales Manager',     division: 'Sales',       capacity: 40 },
  { id: 'mem_7',  name: 'Drew Thompson',  role: 'Account Executive', division: 'Sales',       capacity: 40 },
  { id: 'mem_8',  name: 'Sam Nguyen',     role: 'Sales Analyst',     division: 'Sales',       capacity: 40 },
  { id: 'mem_9',  name: 'Robin Adams',    role: 'HR Business Partner', division: 'HR',        capacity: 40 },
  { id: 'mem_10', name: 'Blair Foster',   role: 'L&D Specialist',    division: 'HR',          capacity: 40 },
];

// Base weekly allocated hours per member (deterministic mock values, hours/week)
const MEMBER_BASE_ALLOCATIONS = {
  mem_1:  [42, 40, 38, 44, 40, 36, 44, 42, 38, 40, 44, 40],
  mem_2:  [38, 40, 44, 40, 36, 42, 40, 38, 44, 40, 38, 36],
  mem_3:  [35, 38, 40, 35, 38, 40, 42, 38, 36, 34, 38, 40],
  mem_4:  [40, 44, 46, 40, 42, 44, 40, 38, 44, 42, 40, 44],
  mem_5:  [50, 52, 48, 50, 46, 52, 50, 48, 52, 50, 48, 46],
  mem_6:  [32, 36, 38, 32, 30, 34, 36, 34, 32, 30, 34, 36],
  mem_7:  [38, 40, 42, 38, 36, 40, 38, 40, 42, 38, 36, 40],
  mem_8:  [28, 30, 32, 28, 26, 30, 28, 30, 32, 28, 26, 30],
  mem_9:  [36, 38, 36, 34, 36, 38, 36, 34, 36, 38, 36, 34],
  mem_10: [20, 22, 18, 20, 18, 22, 20, 18, 22, 20, 18, 22],
};

const SEED_EDGES = [
  { from: 'proj_eng_1', to: 'proj_eng_2', type: 'blocks',     critical: true  },
  { from: 'proj_eng_3', to: 'proj_eng_1', type: 'depends_on', critical: true  },
  { from: 'proj_sales_2', to: 'proj_sales_1', type: 'blocks', critical: false },
  { from: 'proj_eng_2', to: 'proj_sales_1', type: 'depends_on', critical: false },
  { from: 'proj_hr_2', to: 'proj_hr_1', type: 'blocks',       critical: false },
  { from: 'proj_eng_4', to: 'proj_eng_2', type: 'depends_on', critical: false },
];

// ─── Pure helper ─────────────────────────────────────────────────────────────

/**
 * Compute a 0-100 health score for a project.
 *
 * Formula:
 *   40% progress score        (progress / 100) * 100
 *   30% budget efficiency     (1 - spent/allocated) clamped to [0,1] * 100
 *   30% blocked-task penalty  1.0 if no blocked tasks, 0.5 otherwise
 *
 * @param {{ progress: number, budget: { allocated: number, spent: number }, tasksBlocked: number, tasksTotal: number }} project
 * @returns {number} 0-100
 */
function getProjectHealthScore(project) {
  const { progress = 0, budget = {}, tasksBlocked = 0 } = project;
  const { allocated = 1, spent = 0 } = budget;

  const progressScore = (Math.min(Math.max(progress, 0), 100) / 100) * 100;

  const budgetRatio = allocated > 0 ? Math.min(spent / allocated, 1) : 1;
  const budgetScore = (1 - budgetRatio) * 100;

  const blockScore = tasksBlocked > 0 ? 50 : 100;

  const raw = 0.4 * progressScore + 0.3 * budgetScore + 0.3 * blockScore;
  return Math.round(Math.min(Math.max(raw, 0), 100));
}

// ─── Week-start helper ────────────────────────────────────────────────────────

/**
 * Return a Date set to the Monday of the week containing `baseDate`.
 */
function getMondayOf(baseDate) {
  const d = new Date(baseDate);
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Format a Date as 'YYYY-MM-DD'.
 */
function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Returns full portfolio summary for the org.
 * orgId is accepted for future scoping; currently returns shared mock data.
 *
 * @param {string} orgId
 */
function getPortfolioSummary(orgId) {
  const projects = SEED_PROJECTS.map((p) => {
    const health = getProjectHealthScore(p);
    return {
      id: p.id,
      name: p.name,
      division: p.division,
      status: SEED_PROJECT_STATUS[p.id] || 'on_track',
      health,
      budget: { ...p.budget },
      progress: p.progress,
      tasksTotal: p.tasksTotal,
      tasksDone: p.tasksDone,
      tasksBlocked: p.tasksBlocked,
      teamSize: p.teamSize,
      startDate: p.startDate,
      endDate: p.endDate,
      priority: p.priority,
      phase: p.phase,
      tags: [...p.tags],
      lastActivity: p.lastActivity,
    };
  });

  // Build summary counters
  let onTrack = 0, atRisk = 0, offTrack = 0, completed = 0;
  let totalBudgetAllocated = 0, totalBudgetSpent = 0;
  let totalTasks = 0, totalDone = 0, totalBlocked = 0;
  let healthSum = 0;
  const teamMemberSet = new Set();

  for (const p of projects) {
    switch (p.status) {
      case 'on_track':  onTrack++;   break;
      case 'at_risk':   atRisk++;    break;
      case 'off_track': offTrack++;  break;
      case 'completed': completed++; break;
      default: break;
    }
    totalBudgetAllocated += p.budget.allocated;
    totalBudgetSpent     += p.budget.spent;
    totalTasks           += p.tasksTotal;
    totalDone            += p.tasksDone;
    totalBlocked         += p.tasksBlocked;
    healthSum            += p.health;
    // Count unique team members per division as a rough proxy
    for (let i = 0; i < p.teamSize; i++) {
      teamMemberSet.add(`${p.id}_member_${i}`);
    }
  }

  const totalProjects = projects.length;
  const avgHealth = totalProjects > 0 ? Math.round(healthSum / totalProjects) : 0;

  return {
    projects,
    summary: {
      totalProjects,
      onTrack,
      atRisk,
      offTrack,
      completed,
      totalBudgetAllocated,
      totalBudgetSpent,
      avgHealth,
      totalTasks,
      totalDone,
      totalBlocked,
      totalTeamMembers: teamMemberSet.size,
    },
  };
}

/**
 * Returns capacity planning data for the next `weeks` weeks.
 *
 * @param {string} orgId
 * @param {{ weeks?: number }} options
 */
function getCapacityData(orgId, { weeks = 4 } = {}) {
  const numWeeks = Math.min(Math.max(Math.floor(weeks), 1), 12);

  // Build the list of week-start Mondays starting from current Monday
  const currentMonday = getMondayOf(new Date());
  const weekStarts = [];
  for (let i = 0; i < numWeeks; i++) {
    const d = new Date(currentMonday);
    d.setUTCDate(d.getUTCDate() + i * 7);
    weekStarts.push(toDateStr(d));
  }

  const members = SEED_MEMBERS.map((m) => {
    const baseAllocations = MEMBER_BASE_ALLOCATIONS[m.id] || [];

    const weekData = weekStarts.map((weekStart, idx) => {
      const allocated = baseAllocations[idx % baseAllocations.length] ?? 40;
      const utilization = Math.round((allocated / m.capacity) * 100);
      return { weekStart, allocated, utilization };
    });

    return {
      id: m.id,
      name: m.name,
      role: m.role,
      division: m.division,
      capacity: m.capacity,
      weeks: weekData,
    };
  });

  // Summary stats — averaged over the first week for a snapshot view
  const utilizationSnapshot = members.map((m) =>
    m.weeks.length > 0 ? m.weeks[0].utilization : 0,
  );
  const totalMembers = members.length;
  const avgUtilization =
    totalMembers > 0
      ? Math.round(utilizationSnapshot.reduce((a, b) => a + b, 0) / totalMembers)
      : 0;
  const overAllocated  = utilizationSnapshot.filter((u) => u > 100).length;
  const underAllocated = utilizationSnapshot.filter((u) => u < 50).length;

  return {
    members,
    weeks: weekStarts,
    summary: {
      totalMembers,
      avgUtilization,
      overAllocated,
      underAllocated,
    },
  };
}

/**
 * Returns a dependency graph (nodes + edges) for the portfolio.
 *
 * @param {string} orgId
 */
function getDependencies(orgId) {
  // Build nodes from projects that appear in at least one edge
  const projectMap = Object.fromEntries(
    SEED_PROJECTS.map((p) => [p.id, p]),
  );

  // Collect all project ids referenced by edges
  const referencedIds = new Set();
  for (const edge of SEED_EDGES) {
    referencedIds.add(edge.from);
    referencedIds.add(edge.to);
  }

  const nodes = [...referencedIds].map((id) => {
    const p = projectMap[id];
    const health = p ? getProjectHealthScore(p) : 0;
    return {
      id,
      name: p ? p.name : id,
      status: SEED_PROJECT_STATUS[id] || 'on_track',
      health,
    };
  });

  const edges = SEED_EDGES.map((e) => ({ ...e }));

  return { nodes, edges };
}

module.exports = {
  getPortfolioSummary,
  getCapacityData,
  getDependencies,
  getProjectHealthScore,
};
