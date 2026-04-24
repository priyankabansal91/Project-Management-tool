// Run: npx prisma db seed
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);

  // ── Organization ────────────────────────────────────────
  await prisma.organization.upsert({
    where: { id: 'dev-org-id' },
    update: {},
    create: {
      id: 'dev-org-id',
      name: 'Quality Council of India',
      slug: 'qci-dev',
      plan: 'enterprise',
      isActive: true,
      settings: { theme: 'light', timezone: 'Asia/Kolkata', date_format: 'YYYY-MM-DD' },
    },
  });

  // ── Users ────────────────────────────────────────────────
  const users = [
    { id: 'dev-org_admin-id',       email: 'admin@example.local',     firstName: 'Priya',   lastName: 'Sharma' },
    { id: 'dev-division_admin-id',  email: 'div-admin@example.local', firstName: 'Vikram',  lastName: 'Mehta' },
    { id: 'dev-project_manager-id', email: 'pm@example.local',        firstName: 'Anjali',  lastName: 'Singh' },
    { id: 'dev-member-id',          email: 'member@example.local',    firstName: 'Ravi',    lastName: 'Kumar' },
    { id: 'dev-executive-id',       email: 'executive@example.local', firstName: 'Sunita',  lastName: 'Reddy' },
    { id: 'dev-viewer-id',          email: 'viewer@example.local',    firstName: 'Arjun',   lastName: 'Patel' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: { ...u, passwordHash, status: 'active', emailVerifiedAt: new Date() },
    });
  }

  // ── Org Members ──────────────────────────────────────────
  const orgMembers = [
    { userId: 'dev-org_admin-id',       role: 'org_admin',       isOwner: true },
    { userId: 'dev-division_admin-id',  role: 'division_admin',  isOwner: false },
    { userId: 'dev-project_manager-id', role: 'project_manager', isOwner: false },
    { userId: 'dev-member-id',          role: 'member',          isOwner: false },
    { userId: 'dev-executive-id',       role: 'executive',       isOwner: false },
    { userId: 'dev-viewer-id',          role: 'viewer',          isOwner: false },
  ];

  for (const m of orgMembers) {
    await prisma.orgMember.upsert({
      where: { orgId_userId: { orgId: 'dev-org-id', userId: m.userId } },
      update: {},
      create: { orgId: 'dev-org-id', ...m },
    });
  }

  // ── Default Workflow ─────────────────────────────────────
  await prisma.workflowConfig.upsert({
    where: { id: 'wf_default' },
    update: {},
    create: {
      id: 'wf_default',
      orgId: 'dev-org-id',
      name: 'Default Kanban',
      isDefault: true,
      createdBy: 'dev-org_admin-id',
      statuses: [
        { id: 'backlog',     name: 'Backlog',      color: '#6B7280', is_initial: true,  is_final: false, order: 1 },
        { id: 'todo',        name: 'To Do',        color: '#3B82F6', is_initial: false, is_final: false, order: 2 },
        { id: 'in-progress', name: 'In Progress',  color: '#F59E0B', is_initial: false, is_final: false, order: 3 },
        { id: 'in-review',   name: 'In Review',    color: '#8B5CF6', is_initial: false, is_final: false, order: 4 },
        { id: 'done',        name: 'Done',         color: '#10B981', is_initial: false, is_final: true,  order: 5 },
      ],
      transitions: [
        { from: 'backlog',     to: ['todo'] },
        { from: 'todo',        to: ['in-progress'] },
        { from: 'in-progress', to: ['todo', 'in-review'] },
        { from: 'in-review',   to: ['in-progress', 'done'] },
        { from: 'done',        to: ['in-progress'] },
      ],
    },
  });

  // ── Divisions ─────────────────────────────────────────────
  const divisions = [
    { id: 'div_engineering', name: 'Engineering',        code: 'ENG',   color: '#3B82F6', description: 'Product engineering and development',  managerId: 'dev-project_manager-id', budget: 5000000, headCount: 20, displayOrder: 1 },
    { id: 'div_sales',       name: 'Sales & Marketing',  code: 'SALES', color: '#10B981', description: 'Sales, marketing, and growth',          managerId: 'dev-division_admin-id',  budget: 2000000, headCount: 12, displayOrder: 2 },
    { id: 'div_hr',          name: 'Human Resources',    code: 'HR',    color: '#F59E0B', description: 'People operations and HR',              managerId: null,                     budget: 1000000, headCount: 8,  displayOrder: 3 },
  ];

  for (const d of divisions) {
    await prisma.division.upsert({
      where: { id: d.id },
      update: {},
      create: { ...d, orgId: 'dev-org-id', createdBy: 'dev-org_admin-id', isActive: true },
    });
  }

  // ── Division Members ─────────────────────────────────────
  const divisionMembers = [
    { divisionId: 'div_engineering', userId: 'dev-project_manager-id', role: 'division_admin' },
    { divisionId: 'div_engineering', userId: 'dev-member-id',          role: 'member' },
    { divisionId: 'div_sales',       userId: 'dev-division_admin-id',  role: 'division_admin' },
    { divisionId: 'div_hr',          userId: 'dev-org_admin-id',       role: 'division_admin' },
  ];

  for (const m of divisionMembers) {
    await prisma.divisionMember.upsert({
      where: { divisionId_userId: { divisionId: m.divisionId, userId: m.userId } },
      update: {},
      create: m,
    });
  }

  // ── Projects ──────────────────────────────────────────────
  const projects = [
    { id: 'proj_default_1', name: 'Sample Project',    key: 'SAMPLE', divisionId: 'div_engineering', ownerId: 'dev-org_admin-id',       color: '#3B82F6', description: 'A sample project to get started',              startDate: new Date('2026-01-01'), dueDate: new Date('2026-12-31'), createdBy: 'dev-org_admin-id' },
    { id: 'proj_eng_2',     name: 'API Platform v3',   key: 'APIV3',  divisionId: 'div_engineering', ownerId: 'dev-project_manager-id', color: '#8B5CF6', description: 'Next generation API platform development',      startDate: new Date('2026-02-01'), dueDate: new Date('2026-09-30'), createdBy: 'dev-project_manager-id' },
    { id: 'proj_sales_1',   name: 'Q2 Lead Campaign',  key: 'SALES',  divisionId: 'div_sales',       ownerId: 'dev-org_admin-id',       color: '#10B981', description: 'Q2 sales lead generation campaign',            startDate: new Date('2026-04-01'), dueDate: new Date('2026-06-30'), createdBy: 'dev-org_admin-id' },
    { id: 'proj_hr_1',      name: 'Annual Review 2026',key: 'HR26',   divisionId: 'div_hr',          ownerId: 'dev-org_admin-id',       color: '#F59E0B', description: 'Annual performance review cycle 2026',         startDate: new Date('2026-01-01'), dueDate: new Date('2026-03-31'), createdBy: 'dev-org_admin-id' },
  ];

  for (const p of projects) {
    await prisma.project.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, orgId: 'dev-org-id', status: 'active', visibility: 'private', workflowConfigId: 'wf_default' },
    });
  }

  // ── Project Members ───────────────────────────────────────
  const projectMembers = [
    { projectId: 'proj_default_1', userId: 'dev-org_admin-id',       role: 'org_admin' },
    { projectId: 'proj_default_1', userId: 'dev-project_manager-id', role: 'project_manager' },
    { projectId: 'proj_default_1', userId: 'dev-member-id',          role: 'member' },
    { projectId: 'proj_eng_2',     userId: 'dev-project_manager-id', role: 'project_manager' },
    { projectId: 'proj_eng_2',     userId: 'dev-member-id',          role: 'member' },
    { projectId: 'proj_sales_1',   userId: 'dev-org_admin-id',       role: 'project_manager' },
    { projectId: 'proj_hr_1',      userId: 'dev-org_admin-id',       role: 'project_manager' },
  ];

  for (const m of projectMembers) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: m.projectId, userId: m.userId } },
      update: {},
      create: m,
    });
  }

  // ── Sprints ───────────────────────────────────────────────
  const sprints = [
    { id: 'sprint_1', projectId: 'proj_default_1', name: 'Sprint 1', goal: 'Set up project foundation and core architecture',    status: 'completed', startDate: new Date('2026-01-05'), endDate: new Date('2026-01-18'), createdBy: 'dev-project_manager-id' },
    { id: 'sprint_2', projectId: 'proj_default_1', name: 'Sprint 2', goal: 'Implement user authentication and dashboard',         status: 'active',    startDate: new Date('2026-01-19'), endDate: new Date('2026-02-01'), createdBy: 'dev-project_manager-id' },
    { id: 'sprint_3', projectId: 'proj_default_1', name: 'Sprint 3', goal: 'Task management and reporting features',              status: 'planned',   startDate: new Date('2026-02-02'), endDate: new Date('2026-02-15'), createdBy: 'dev-project_manager-id' },
  ];

  for (const s of sprints) {
    await prisma.sprint.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, orgId: 'dev-org-id' },
    });
  }

  // ── Tasks ─────────────────────────────────────────────────
  const tasks = [
    { id: 't1', projectId: 'proj_default_1', seqNumber: 1, title: 'Design new navigation component',    description: 'Redesign the top navigation bar with improved UX and mobile support.',     statusId: 'in-progress', statusName: 'In Progress', priority: 'high',     assigneeId: 'dev-member-id',          reporterId: 'dev-project_manager-id', dueDate: new Date('2026-05-10'), estimatedHours: 8,  sprintId: 'sprint_2', position: 10, createdBy: 'dev-project_manager-id', createdAt: new Date('2026-04-01') },
    { id: 't2', projectId: 'proj_default_1', seqNumber: 2, title: 'Implement authentication flow',      description: 'Set up JWT-based auth with refresh token rotation.',                      statusId: 'todo',        statusName: 'To Do',       priority: 'critical', assigneeId: 'dev-project_manager-id', reporterId: 'dev-org_admin-id',       dueDate: new Date('2026-05-15'), estimatedHours: 16, sprintId: 'sprint_2', position: 20, createdBy: 'dev-org_admin-id',       createdAt: new Date('2026-04-01') },
    { id: 't3', projectId: 'proj_default_1', seqNumber: 3, title: 'Customer dashboard wireframes',     description: 'Create detailed wireframes for the analytics dashboard.',                  statusId: 'done',        statusName: 'Done',        priority: 'medium',   assigneeId: 'dev-member-id',          reporterId: 'dev-project_manager-id', dueDate: new Date('2026-04-01'), estimatedHours: 4,  sprintId: null,       position: 30, createdBy: 'dev-project_manager-id', createdAt: new Date('2026-03-15'), completedAt: new Date('2026-03-30') },
    { id: 't4', projectId: 'proj_default_1', seqNumber: 4, title: 'Set up CI/CD pipeline',             description: 'Configure GitHub Actions for automated testing and deployment.',           statusId: 'in-review',   statusName: 'In Review',   priority: 'high',     assigneeId: 'dev-project_manager-id', reporterId: 'dev-org_admin-id',       dueDate: new Date('2026-05-05'), estimatedHours: 6,  sprintId: 'sprint_2', position: 40, createdBy: 'dev-org_admin-id',       createdAt: new Date('2026-04-05') },
    { id: 't5', projectId: 'proj_eng_2',     seqNumber: 1, title: 'Define OpenAPI 3.1 specification',  description: 'Draft the full OpenAPI spec for all v3 endpoints.',                        statusId: 'in-progress', statusName: 'In Progress', priority: 'high',     assigneeId: 'dev-member-id',          reporterId: 'dev-project_manager-id', dueDate: new Date('2026-05-20'), estimatedHours: 12, sprintId: null,       position: 10, createdBy: 'dev-project_manager-id', createdAt: new Date('2026-04-10') },
    { id: 't6', projectId: 'proj_eng_2',     seqNumber: 2, title: 'Implement rate limiting middleware', description: 'Add configurable rate limiting per API key and endpoint.',               statusId: 'todo',        statusName: 'To Do',       priority: 'medium',   assigneeId: 'dev-member-id',          reporterId: 'dev-project_manager-id', dueDate: new Date('2026-06-01'), estimatedHours: 8,  sprintId: null,       position: 20, createdBy: 'dev-project_manager-id', createdAt: new Date('2026-04-10') },
  ];

  for (const t of tasks) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: {},
      create: { ...t, orgId: 'dev-org-id' },
    });
  }

  // ── Seed Comments ─────────────────────────────────────────
  const comments = [
    { id: 'c1', orgId: 'dev-org-id', taskId: 't1', authorId: 'dev-project_manager-id', body: 'Great progress! Please test in Safari — there were animation issues in the previous iteration.', parentId: null, createdAt: new Date(Date.now() - 4 * 3600000) },
    { id: 'c2', orgId: 'dev-org-id', taskId: 't1', authorId: 'dev-member-id',          body: 'Safari issues fixed! Added cross-browser tests in Playwright. Ready for review.',               parentId: 'c1', createdAt: new Date(Date.now() - 2 * 3600000) },
    { id: 'c3', orgId: 'dev-org-id', taskId: 't2', authorId: 'dev-project_manager-id', body: 'Remember to handle token rotation edge cases — especially concurrent refresh scenarios.',        parentId: null, createdAt: new Date(Date.now() - 24 * 3600000) },
  ];

  for (const c of comments) {
    await prisma.comment.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }

  console.log('✅  Database seeded with dev data');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
