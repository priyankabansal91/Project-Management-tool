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
    { id: 'dev-org_admin-id',       email: 'admin@example.local',          firstName: 'Priya',   lastName: 'Sharma' },
    { id: 'dev-division_admin-id',  email: 'div-admin@example.local',      firstName: 'Vikram',  lastName: 'Mehta' },
    { id: 'dev-vertical_head-id',   email: 'vertical-head@example.local',  firstName: 'Deepa',   lastName: 'Nair' },
    { id: 'dev-project_manager-id', email: 'pm@example.local',             firstName: 'Anjali',  lastName: 'Singh' },
    { id: 'dev-team_lead-id',       email: 'team-lead@example.local',      firstName: 'Rahul',   lastName: 'Pillai' },
    { id: 'dev-member-id',          email: 'member@example.local',         firstName: 'Ravi',    lastName: 'Kumar' },
    { id: 'dev-executive-id',       email: 'executive@example.local',      firstName: 'Sunita',  lastName: 'Reddy' },
    { id: 'dev-viewer-id',          email: 'viewer@example.local',         firstName: 'Arjun',   lastName: 'Patel' },
    { id: 'dev-hod-id',             email: 'hod@example.local',            firstName: 'Subroto', lastName: 'Ghosh' },
    // PPID-specific users
    { id: 'dev-ppid-divadmin-id',  email: 'ppid-divadmin@example.local',  firstName: 'PPID',    lastName: 'Admin' },
    { id: 'dev-ppid-vh-id',        email: 'ppid-vh@example.local',        firstName: 'Aashna',  lastName: 'Kapoor' },
    { id: 'dev-ppid-tm-id',        email: 'ppid-tm@example.local',        firstName: 'Meera',   lastName: 'Iyer' },
    { id: 'dev-ppid-pl-id',        email: 'ppid-pl@example.local',        firstName: 'Sidharth',lastName: 'Verma' },
    { id: 'dev-ppid-hod-id',       email: 'ppid-hod@example.local',       firstName: 'Nandita', lastName: 'Roy' },
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
    { userId: 'dev-vertical_head-id',   role: 'vertical_head',   isOwner: false },
    { userId: 'dev-project_manager-id', role: 'project_manager', isOwner: false },
    { userId: 'dev-team_lead-id',       role: 'team_lead',       isOwner: false },
    { userId: 'dev-member-id',          role: 'member',          isOwner: false },
    { userId: 'dev-executive-id',       role: 'executive',       isOwner: false },
    { userId: 'dev-viewer-id',          role: 'viewer',          isOwner: false },
    { userId: 'dev-hod-id',             role: 'hod',             isOwner: false },
    // PPID org members
    { userId: 'dev-ppid-divadmin-id',  role: 'division_admin',  isOwner: false },
    { userId: 'dev-ppid-vh-id',        role: 'vertical_head',   isOwner: false },
    { userId: 'dev-ppid-tm-id',        role: 'member',          isOwner: false },
    { userId: 'dev-ppid-pl-id',        role: 'project_manager', isOwner: false },
    { userId: 'dev-ppid-hod-id',       role: 'hod',             isOwner: false },
  ];

  for (const m of orgMembers) {
    await prisma.orgMember.upsert({
      where: { orgId_userId: { orgId: 'dev-org-id', userId: m.userId } },
      update: {},
      create: { orgId: 'dev-org-id', ...m },
    });
  }

  // ── Workflow Configs (3 variants) ────────────────────────
  const workflows = [
    {
      id: 'wf_default',
      name: 'Default Kanban',
      isDefault: true,
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
    {
      id: 'wf_agile',
      name: 'Agile Scrum',
      isDefault: false,
      statuses: [
        { id: 'product-backlog', name: 'Product Backlog', color: '#6B7280', is_initial: true,  is_final: false, order: 1 },
        { id: 'sprint-backlog',  name: 'Sprint Backlog',  color: '#3B82F6', is_initial: false, is_final: false, order: 2 },
        { id: 'development',     name: 'Development',     color: '#F59E0B', is_initial: false, is_final: false, order: 3 },
        { id: 'testing',         name: 'Testing / QA',    color: '#EC4899', is_initial: false, is_final: false, order: 4 },
        { id: 'accepted',        name: 'Accepted',        color: '#10B981', is_initial: false, is_final: true,  order: 5 },
      ],
      transitions: [
        { from: 'product-backlog', to: ['sprint-backlog'] },
        { from: 'sprint-backlog',  to: ['development'] },
        { from: 'development',     to: ['testing', 'sprint-backlog'] },
        { from: 'testing',         to: ['development', 'accepted'] },
      ],
    },
    {
      id: 'wf_simple',
      name: 'Simple 3-Stage',
      isDefault: false,
      statuses: [
        { id: 'open',        name: 'Open',        color: '#3B82F6', is_initial: true,  is_final: false, order: 1 },
        { id: 'working',     name: 'Working',     color: '#F59E0B', is_initial: false, is_final: false, order: 2 },
        { id: 'closed',      name: 'Closed',      color: '#10B981', is_initial: false, is_final: true,  order: 3 },
      ],
      transitions: [
        { from: 'open',    to: ['working'] },
        { from: 'working', to: ['open', 'closed'] },
      ],
    },
    {
      id: 'wf_approval',
      name: 'Approval-Gated',
      isDefault: false,
      statuses: [
        { id: 'draft',            name: 'Draft',             color: '#6B7280', is_initial: true,  is_final: false, order: 1 },
        { id: 'pending-approval', name: 'Pending Approval',  color: '#F59E0B', is_initial: false, is_final: false, order: 2 },
        { id: 'approved',         name: 'Approved',          color: '#3B82F6', is_initial: false, is_final: false, order: 3 },
        { id: 'rejected',         name: 'Rejected',          color: '#EF4444', is_initial: false, is_final: false, order: 4 },
        { id: 'published',        name: 'Published',         color: '#10B981', is_initial: false, is_final: true,  order: 5 },
      ],
      transitions: [
        { from: 'draft',            to: ['pending-approval'] },
        { from: 'pending-approval', to: ['approved', 'rejected'] },
        { from: 'approved',         to: ['published'] },
        { from: 'rejected',         to: ['draft'] },
      ],
    },
  ];

  for (const wf of workflows) {
    await prisma.workflowConfig.upsert({
      where: { id: wf.id },
      update: {},
      create: { ...wf, orgId: 'dev-org-id', createdBy: 'dev-org_admin-id' },
    });
  }

  // ── Custom Roles ─────────────────────────────────────────
  const customRoles = [
    { id: 'cr_lead',       name: 'Tech Lead',        color: '#3B82F6', description: 'Senior developer with code review rights', permissions: ['task:read', 'task:write', 'task:review', 'sprint:read', 'sprint:write'] },
    { id: 'cr_auditor',    name: 'Quality Auditor',  color: '#8B5CF6', description: 'Can view all data but not modify',          permissions: ['task:read', 'project:read', 'report:read', 'audit:read'] },
    { id: 'cr_billing',    name: 'Finance Manager',  color: '#10B981', description: 'Access to financial and budget reports',    permissions: ['report:read', 'financial:read', 'financial:write', 'export:read'] },
    { id: 'cr_contractor', name: 'Contractor',       color: '#F59E0B', description: 'Limited external access to assigned tasks', permissions: ['task:read', 'task:write', 'comment:write'] },
  ];

  for (const cr of customRoles) {
    await prisma.customRole.upsert({
      where: { orgId_name: { orgId: 'dev-org-id', name: cr.name } },
      update: {},
      create: { ...cr, orgId: 'dev-org-id', createdBy: 'dev-org_admin-id' },
    });
  }

  // ── Custom Field Definitions ─────────────────────────────
  const customFields = [
    { id: 'cf_story_points', name: 'Story Points',     fieldKey: 'story_points', fieldType: 'number',   options: { min: 1, max: 13 },                                                                   displayOrder: 1 },
    { id: 'cf_department',   name: 'Department',       fieldKey: 'department',   fieldType: 'select',   options: { choices: ['Engineering', 'Sales', 'HR', 'Finance', 'Operations', 'Product'] },        displayOrder: 2 },
    { id: 'cf_risk_level',   name: 'Risk Level',       fieldKey: 'risk_level',   fieldType: 'select',   options: { choices: ['Low', 'Medium', 'High', 'Critical'] },                                     displayOrder: 3 },
    { id: 'cf_client_ref',   name: 'Client Reference', fieldKey: 'client_ref',   fieldType: 'text',     options: { placeholder: 'e.g. ACME-2026-001' },                                                  displayOrder: 4 },
  ];

  for (const cf of customFields) {
    await prisma.customFieldDefinition.upsert({
      where: { orgId_fieldKey: { orgId: 'dev-org-id', fieldKey: cf.fieldKey } },
      update: {},
      create: { ...cf, orgId: 'dev-org-id', createdBy: 'dev-org_admin-id', appliesTo: 'task' },
    });
  }

  // ── Divisions (with hierarchy) ───────────────────────────
  const divisions = [
    { id: 'div_engineering', name: 'Engineering',        code: 'ENG',   parentId: null,           color: '#3B82F6', description: 'Product engineering and development',  managerId: 'dev-project_manager-id', budget: 5000000, headCount: 20, displayOrder: 1 },
    { id: 'div_sales',       name: 'Sales & Marketing',  code: 'SALES', parentId: null,           color: '#10B981', description: 'Sales, marketing, and growth',          managerId: 'dev-division_admin-id',  budget: 2000000, headCount: 12, displayOrder: 2 },
    { id: 'div_hr',          name: 'Human Resources',    code: 'HR',    parentId: null,           color: '#F59E0B', description: 'People operations and HR',              managerId: null,                     budget: 1000000, headCount: 8,  displayOrder: 3 },
    { id: 'div_frontend',    name: 'Frontend Team',      code: 'FE',    parentId: 'div_engineering', color: '#8B5CF6', description: 'UI/UX and frontend development',    managerId: 'dev-member-id',          budget: 1500000, headCount: 7,  displayOrder: 1 },
    { id: 'div_backend',     name: 'Backend & DevOps',   code: 'BE',    parentId: 'div_engineering', color: '#06B6D4', description: 'API, infrastructure and DevOps',    managerId: null,                     budget: 2000000, headCount: 8,  displayOrder: 2 },
    { id: 'div_ppid',        name: 'PPID',               code: 'PPID',  parentId: null,              color: '#EC4899', description: 'PPID Division',                     managerId: 'dev-ppid-divadmin-id',   budget: 3000000, headCount: 10, displayOrder: 4 },
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
    { divisionId: 'div_frontend',    userId: 'dev-member-id',          role: 'division_admin' },
    { divisionId: 'div_backend',     userId: 'dev-project_manager-id', role: 'member' },
    // PPID division members
    { divisionId: 'div_ppid',        userId: 'dev-ppid-divadmin-id',   role: 'division_admin' },
    { divisionId: 'div_ppid',        userId: 'dev-ppid-vh-id',         role: 'member' },
    { divisionId: 'div_ppid',        userId: 'dev-ppid-tm-id',         role: 'member' },
    { divisionId: 'div_ppid',        userId: 'dev-ppid-pl-id',         role: 'member' },
    { divisionId: 'div_ppid',        userId: 'dev-ppid-hod-id',        role: 'member' },
  ];

  for (const m of divisionMembers) {
    await prisma.divisionMember.upsert({
      where: { divisionId_userId: { divisionId: m.divisionId, userId: m.userId } },
      update: {},
      create: m,
    });
  }

  // ── Verticals ─────────────────────────────────────────────
  const verticals = [
    { id: 'vert_tech',   name: 'Technology',          description: 'All technology and platform projects', color: '#3B82F6', status: 'active', lifecycleStatus: 'ACTIVE', divisionId: 'div_engineering', headId: 'dev-vertical_head-id', budget: 3000000 },
    { id: 'vert_digital', name: 'Digital Products',   description: 'Web and mobile digital products',     color: '#8B5CF6', status: 'active', lifecycleStatus: 'ACTIVE', divisionId: 'div_frontend',    headId: null,                  budget: 1500000 },
    { id: 'vert_ops',    name: 'Operations & DevOps', description: 'Infrastructure and DevOps vertical',  color: '#06B6D4', status: 'active', lifecycleStatus: 'ACTIVE', divisionId: 'div_backend',     headId: null,                  budget: 2000000 },
    { id: 'vert_ppid',   name: 'PPID Vertical',       description: 'PPID division vertical',              color: '#EC4899', status: 'active', lifecycleStatus: 'ACTIVE', divisionId: 'div_ppid',        headId: 'dev-ppid-vh-id',       budget: 2000000 },
  ];

  for (const v of verticals) {
    await prisma.vertical.upsert({
      where: { id: v.id },
      update: { headId: v.headId, lifecycleStatus: v.lifecycleStatus },
      create: { ...v, orgId: 'dev-org-id' },
    });
  }

  // ── Projects ──────────────────────────────────────────────
  const projects = [
    { id: 'proj_default_1', name: 'ProjectFlow Platform',  key: 'PF',     divisionId: 'div_engineering', verticalId: 'vert_tech',    ownerId: 'dev-org_admin-id',       color: '#3B82F6', description: 'The core project management platform — internal development.',         startDate: new Date('2026-01-01'), dueDate: new Date('2026-12-31'), createdBy: 'dev-org_admin-id',       workflowConfigId: 'wf_default' },
    { id: 'proj_eng_2',     name: 'API Platform v3',       key: 'APIV3',  divisionId: 'div_backend',     verticalId: 'vert_tech',    ownerId: 'dev-project_manager-id', color: '#8B5CF6', description: 'Next generation REST + GraphQL API platform.',                         startDate: new Date('2026-02-01'), dueDate: new Date('2026-09-30'), createdBy: 'dev-project_manager-id', workflowConfigId: 'wf_agile' },
    { id: 'proj_sales_1',   name: 'Q2 Lead Campaign',      key: 'Q2LEAD', divisionId: 'div_sales',       verticalId: null,           ownerId: 'dev-org_admin-id',       color: '#10B981', description: 'Q2 2026 sales and lead generation campaign across digital channels.', startDate: new Date('2026-04-01'), dueDate: new Date('2026-06-30'), createdBy: 'dev-org_admin-id',       workflowConfigId: 'wf_simple' },
    { id: 'proj_hr_1',      name: 'Annual Review 2026',    key: 'HR26',   divisionId: 'div_hr',          verticalId: null,           ownerId: 'dev-org_admin-id',       color: '#F59E0B', description: 'Annual performance review and appraisal cycle 2026.',                  startDate: new Date('2026-01-01'), dueDate: new Date('2026-03-31'), createdBy: 'dev-org_admin-id',       workflowConfigId: 'wf_approval' },
    { id: 'proj_mobile',    name: 'Mobile App v2',         key: 'MOB2',   divisionId: 'div_frontend',    verticalId: 'vert_digital', ownerId: 'dev-project_manager-id', color: '#EC4899', description: 'React Native mobile app — iOS & Android.',                             startDate: new Date('2026-03-01'), dueDate: new Date('2026-10-31'), createdBy: 'dev-project_manager-id', workflowConfigId: 'wf_default' },
    { id: 'proj_ppid_1',    name: 'PPID Initiative 2026',  key: 'PPID1',  divisionId: 'div_ppid',        verticalId: 'vert_ppid',    ownerId: 'dev-ppid-pl-id',        color: '#EC4899', description: 'Primary project under PPID vertical for 2026 initiatives.',            startDate: new Date('2026-06-01'), dueDate: new Date('2026-12-31'), createdBy: 'dev-ppid-divadmin-id',   workflowConfigId: 'wf_default' },
  ];

  for (const p of projects) {
    await prisma.project.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, orgId: 'dev-org-id', status: 'active', visibility: 'private' },
    });
  }

  // ── Project Members ───────────────────────────────────────
  const projectMembers = [
    { projectId: 'proj_default_1', userId: 'dev-org_admin-id',       role: 'org_admin' },
    { projectId: 'proj_default_1', userId: 'dev-project_manager-id', role: 'project_manager' },
    { projectId: 'proj_default_1', userId: 'dev-member-id',          role: 'member' },
    { projectId: 'proj_default_1', userId: 'dev-viewer-id',          role: 'viewer' },
    { projectId: 'proj_eng_2',     userId: 'dev-project_manager-id', role: 'project_manager' },
    { projectId: 'proj_eng_2',     userId: 'dev-member-id',          role: 'member' },
    { projectId: 'proj_eng_2',     userId: 'dev-org_admin-id',       role: 'org_admin' },
    { projectId: 'proj_sales_1',   userId: 'dev-org_admin-id',       role: 'project_manager' },
    { projectId: 'proj_sales_1',   userId: 'dev-division_admin-id',  role: 'member' },
    { projectId: 'proj_hr_1',      userId: 'dev-org_admin-id',       role: 'project_manager' },
    { projectId: 'proj_hr_1',      userId: 'dev-division_admin-id',  role: 'member' },
    { projectId: 'proj_mobile',    userId: 'dev-project_manager-id', role: 'project_manager' },
    { projectId: 'proj_mobile',    userId: 'dev-member-id',          role: 'member' },
    // PPID project members
    { projectId: 'proj_ppid_1',    userId: 'dev-ppid-pl-id',         role: 'project_manager' },
    { projectId: 'proj_ppid_1',    userId: 'dev-ppid-divadmin-id',   role: 'org_admin' },
    { projectId: 'proj_ppid_1',    userId: 'dev-ppid-vh-id',         role: 'project_manager' },
    { projectId: 'proj_ppid_1',    userId: 'dev-ppid-tm-id',         role: 'member' },
  ];

  for (const m of projectMembers) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: m.projectId, userId: m.userId } },
      update: {},
      create: m,
    });
  }

  // ── Sprints (4 per project) ───────────────────────────────
  const sprints = [
    // ProjectFlow Platform
    { id: 'sprint_pf_1', projectId: 'proj_default_1', name: 'Sprint 1 – Foundation',    goal: 'Set up project structure, auth, and CI/CD pipeline',      status: 'completed', startDate: new Date('2026-01-05'), endDate: new Date('2026-01-18'), createdBy: 'dev-project_manager-id' },
    { id: 'sprint_pf_2', projectId: 'proj_default_1', name: 'Sprint 2 – Core Features', goal: 'Implement dashboard, task board, and user management',     status: 'active',    startDate: new Date('2026-01-19'), endDate: new Date('2026-02-01'), createdBy: 'dev-project_manager-id' },
    { id: 'sprint_pf_3', projectId: 'proj_default_1', name: 'Sprint 3 – Reporting',     goal: 'Build reports, analytics, and executive dashboard',        status: 'planned',   startDate: new Date('2026-02-02'), endDate: new Date('2026-02-15'), createdBy: 'dev-project_manager-id' },
    { id: 'sprint_pf_4', projectId: 'proj_default_1', name: 'Sprint 4 – Launch',        goal: 'Performance, QA, documentation, and production release',  status: 'planned',   startDate: new Date('2026-02-16'), endDate: new Date('2026-03-01'), createdBy: 'dev-project_manager-id' },
    // API Platform v3
    { id: 'sprint_api_1', projectId: 'proj_eng_2', name: 'API Sprint 1 – Design',    goal: 'OpenAPI spec, architecture decisions, and scaffolding',   status: 'completed', startDate: new Date('2026-02-01'), endDate: new Date('2026-02-14'), createdBy: 'dev-project_manager-id' },
    { id: 'sprint_api_2', projectId: 'proj_eng_2', name: 'API Sprint 2 – Core APIs', goal: 'CRUD endpoints for tasks, projects, users',               status: 'active',    startDate: new Date('2026-02-15'), endDate: new Date('2026-02-28'), createdBy: 'dev-project_manager-id' },
    { id: 'sprint_api_3', projectId: 'proj_eng_2', name: 'API Sprint 3 – Security',  goal: 'Rate limiting, auth middleware, RBAC implementation',      status: 'planned',   startDate: new Date('2026-03-01'), endDate: new Date('2026-03-14'), createdBy: 'dev-project_manager-id' },
    { id: 'sprint_api_4', projectId: 'proj_eng_2', name: 'API Sprint 4 – Release',   goal: 'Load testing, docs generation, deployment pipeline',       status: 'planned',   startDate: new Date('2026-03-15'), endDate: new Date('2026-03-31'), createdBy: 'dev-project_manager-id' },
    // Mobile App
    { id: 'sprint_mob_1', projectId: 'proj_mobile', name: 'Mobile Sprint 1 – Setup',  goal: 'React Native scaffolding, navigation, and auth screens',  status: 'active',    startDate: new Date('2026-03-01'), endDate: new Date('2026-03-14'), createdBy: 'dev-project_manager-id' },
    { id: 'sprint_mob_2', projectId: 'proj_mobile', name: 'Mobile Sprint 2 – Tasks',  goal: 'Task list, task detail, and push notifications',          status: 'planned',   startDate: new Date('2026-03-15'), endDate: new Date('2026-03-31'), createdBy: 'dev-project_manager-id' },
  ];

  for (const s of sprints) {
    await prisma.sprint.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, orgId: 'dev-org-id' },
    });
  }

  // ── Tasks (4+ per project) ────────────────────────────────
  const tasks = [
    // ── proj_default_1 (ProjectFlow) ──
    { id: 't1',  projectId: 'proj_default_1', seqNumber: 1,  title: 'Design navigation component',          description: 'Redesign the top navigation bar with improved UX and mobile support.\n\n## Requirements\n- Sticky header on scroll\n- Mobile hamburger menu\n- Role-aware nav items\n- Active state indicators',               statusId: 'in-progress', statusName: 'In Progress', priority: 'high',     assigneeId: 'dev-member-id',          reporterId: 'dev-project_manager-id', startDate: new Date('2026-04-15'), dueDate: new Date('2026-05-10'), estimatedHours: 8,  loggedHours: 5,   sprintId: 'sprint_pf_2', position: 10, tags: ['frontend', 'ux'],        createdBy: 'dev-project_manager-id', createdAt: new Date('2026-04-01') },
    { id: 't2',  projectId: 'proj_default_1', seqNumber: 2,  title: 'Implement JWT authentication flow',     description: 'Set up JWT-based auth with refresh token rotation and secure cookie storage.\n\n## Tasks\n- Access token (15min TTL)\n- Refresh token (7 days, httpOnly cookie)\n- Token rotation on refresh\n- Revoke on logout',    statusId: 'todo',        statusName: 'To Do',       priority: 'critical', assigneeId: 'dev-project_manager-id', reporterId: 'dev-org_admin-id',       startDate: new Date('2026-04-20'), dueDate: new Date('2026-05-15'), estimatedHours: 16, loggedHours: 0,   sprintId: 'sprint_pf_2', position: 20, tags: ['backend', 'security'],   createdBy: 'dev-org_admin-id',       createdAt: new Date('2026-04-01') },
    { id: 't3',  projectId: 'proj_default_1', seqNumber: 3,  title: 'Analytics dashboard wireframes',        description: 'Create detailed wireframes for the analytics dashboard with KPI tiles, charts, and filters.',                                                                                                                         statusId: 'done',        statusName: 'Done',        priority: 'medium',   assigneeId: 'dev-member-id',          reporterId: 'dev-project_manager-id', startDate: new Date('2026-03-15'), dueDate: new Date('2026-04-01'), estimatedHours: 4,  loggedHours: 3.5, sprintId: null,           position: 30, tags: ['design'],               createdBy: 'dev-project_manager-id', createdAt: new Date('2026-03-15'), completedAt: new Date('2026-03-30') },
    { id: 't4',  projectId: 'proj_default_1', seqNumber: 4,  title: 'Set up CI/CD pipeline',                 description: 'Configure GitHub Actions for automated testing and deployment to staging and production.',                                                                                                                           statusId: 'in-review',   statusName: 'In Review',   priority: 'high',     assigneeId: 'dev-project_manager-id', reporterId: 'dev-org_admin-id',       startDate: new Date('2026-04-10'), dueDate: new Date('2026-05-05'), estimatedHours: 6,  loggedHours: 6,   sprintId: 'sprint_pf_2', position: 40, tags: ['devops'],               createdBy: 'dev-org_admin-id',       createdAt: new Date('2026-04-05') },
    { id: 't5',  projectId: 'proj_default_1', seqNumber: 5,  title: 'Role-based permission matrix UI',       description: 'Build admin UI to configure permissions per role across features.',                                                                                                                                                 statusId: 'todo',        statusName: 'To Do',       priority: 'medium',   assigneeId: 'dev-member-id',          reporterId: 'dev-project_manager-id', startDate: new Date('2026-05-01'), dueDate: new Date('2026-05-20'), estimatedHours: 10, loggedHours: 0,   sprintId: 'sprint_pf_3', position: 50, tags: ['frontend', 'admin'],     createdBy: 'dev-project_manager-id', createdAt: new Date('2026-04-20') },
    { id: 't6',  projectId: 'proj_default_1', seqNumber: 6,  title: 'Write integration test suite',          description: 'Set up Vitest + Testing Library tests for all major components and API hooks.',                                                                                                                                    statusId: 'backlog',     statusName: 'Backlog',     priority: 'low',      assigneeId: null,                     reporterId: 'dev-project_manager-id', startDate: null,              dueDate: new Date('2026-06-01'), estimatedHours: 20, loggedHours: 0,   sprintId: null,           position: 60, tags: ['testing', 'quality'],    createdBy: 'dev-project_manager-id', createdAt: new Date('2026-04-25') },

    // ── proj_eng_2 (API Platform) ──
    { id: 't10', projectId: 'proj_eng_2', seqNumber: 1, title: 'Define OpenAPI 3.1 specification',     description: 'Draft the full OpenAPI spec for all v3 endpoints including schemas, request/response examples, and error codes.',                                                                                                        statusId: 'in-progress', statusName: 'In Progress', priority: 'high',     assigneeId: 'dev-member-id',          reporterId: 'dev-project_manager-id', startDate: new Date('2026-04-10'), dueDate: new Date('2026-05-20'), estimatedHours: 12, loggedHours: 8,   sprintId: 'sprint_api_2', position: 10, tags: ['api', 'design'],        createdBy: 'dev-project_manager-id', createdAt: new Date('2026-04-10') },
    { id: 't11', projectId: 'proj_eng_2', seqNumber: 2, title: 'Implement rate limiting middleware',    description: 'Add configurable rate limiting per API key and endpoint using Redis sliding window algorithm.',                                                                                                                          statusId: 'todo',        statusName: 'To Do',       priority: 'medium',   assigneeId: 'dev-member-id',          reporterId: 'dev-project_manager-id', startDate: new Date('2026-05-01'), dueDate: new Date('2026-06-01'), estimatedHours: 8,  loggedHours: 0,   sprintId: 'sprint_api_3', position: 20, tags: ['security', 'performance'], createdBy: 'dev-project_manager-id', createdAt: new Date('2026-04-10') },
    { id: 't12', projectId: 'proj_eng_2', seqNumber: 3, title: 'GraphQL schema design',                description: 'Design the GraphQL schema for complex querying — tasks, projects, users with nested resolvers.',                                                                                                                          statusId: 'backlog',     statusName: 'Backlog',     priority: 'high',     assigneeId: null,                     reporterId: 'dev-project_manager-id', startDate: null,              dueDate: new Date('2026-06-15'), estimatedHours: 16, loggedHours: 0,   sprintId: null,           position: 30, tags: ['api', 'graphql'],       createdBy: 'dev-project_manager-id', createdAt: new Date('2026-04-10') },
    { id: 't13', projectId: 'proj_eng_2', seqNumber: 4, title: 'API versioning strategy',              description: 'Implement URL-based versioning (/v3/) with backward compatibility for v2 clients during 6-month sunset period.',                                                                                                         statusId: 'in-review',   statusName: 'In Review',   priority: 'critical', assigneeId: 'dev-project_manager-id', reporterId: 'dev-org_admin-id',       startDate: new Date('2026-04-01'), dueDate: new Date('2026-04-30'), estimatedHours: 6,  loggedHours: 5,   sprintId: 'sprint_api_2', position: 40, tags: ['api', 'backend'],       createdBy: 'dev-org_admin-id',       createdAt: new Date('2026-04-01') },

    // ── proj_sales_1 (Q2 Lead Campaign) ──
    { id: 't20', projectId: 'proj_sales_1', seqNumber: 1, title: 'Launch email drip campaign',          description: 'Set up HubSpot email drip campaign targeting 500 qualified leads from Q1 pipeline.',                                                                                                                                    statusId: 'in-progress', statusName: 'Working',     priority: 'high',     assigneeId: 'dev-division_admin-id',  reporterId: 'dev-org_admin-id',       startDate: new Date('2026-04-05'), dueDate: new Date('2026-04-30'), estimatedHours: 12, loggedHours: 6,   sprintId: null, position: 10, tags: ['email', 'marketing'],   createdBy: 'dev-org_admin-id',       createdAt: new Date('2026-04-01') },
    { id: 't21', projectId: 'proj_sales_1', seqNumber: 2, title: 'LinkedIn outreach for enterprise',    description: 'Personalized LinkedIn outreach to 50 enterprise decision makers in manufacturing sector.',                                                                                                                               statusId: 'open',        statusName: 'Open',        priority: 'medium',   assigneeId: 'dev-division_admin-id',  reporterId: 'dev-org_admin-id',       startDate: new Date('2026-04-15'), dueDate: new Date('2026-05-15'), estimatedHours: 8,  loggedHours: 0,   sprintId: null, position: 20, tags: ['outreach'],             createdBy: 'dev-org_admin-id',       createdAt: new Date('2026-04-01') },
    { id: 't22', projectId: 'proj_sales_1', seqNumber: 3, title: 'Prepare sales collateral deck',       description: 'Update product presentation deck, case studies, and pricing sheet for Q2 2026.',                                                                                                                                         statusId: 'closed',      statusName: 'Closed',      priority: 'low',      assigneeId: 'dev-division_admin-id',  reporterId: 'dev-org_admin-id',       startDate: new Date('2026-04-01'), dueDate: new Date('2026-04-10'), estimatedHours: 6,  loggedHours: 5,   sprintId: null, position: 30, tags: ['content'],              createdBy: 'dev-org_admin-id',       createdAt: new Date('2026-04-01'), completedAt: new Date('2026-04-09') },
    { id: 't23', projectId: 'proj_sales_1', seqNumber: 4, title: 'Q2 conversion funnel analysis',       description: 'Analyze conversion rates across each funnel stage and identify bottlenecks for improvement.',                                                                                                                            statusId: 'open',        statusName: 'Open',        priority: 'high',     assigneeId: null,                     reporterId: 'dev-org_admin-id',       startDate: new Date('2026-06-01'), dueDate: new Date('2026-06-30'), estimatedHours: 10, loggedHours: 0,   sprintId: null, position: 40, tags: ['analytics'],            createdBy: 'dev-org_admin-id',       createdAt: new Date('2026-04-15') },

    // ── proj_hr_1 (Annual Review) ──
    { id: 't30', projectId: 'proj_hr_1', seqNumber: 1, title: 'Set review goals & criteria',            description: 'Define 2026 performance review criteria, weightings, and competency framework across all grades.',                                                                                                                       statusId: 'approved',    statusName: 'Approved',    priority: 'critical', assigneeId: 'dev-org_admin-id',       reporterId: 'dev-org_admin-id',       startDate: new Date('2026-01-05'), dueDate: new Date('2026-01-20'), estimatedHours: 8,  loggedHours: 8,   sprintId: null, position: 10, tags: ['hr', 'planning'],       createdBy: 'dev-org_admin-id',       createdAt: new Date('2026-01-01') },
    { id: 't31', projectId: 'proj_hr_1', seqNumber: 2, title: 'Distribute self-assessment forms',       description: 'Send self-assessment forms to all 46 permanent employees via email with 2-week deadline.',                                                                                                                               statusId: 'published',   statusName: 'Published',   priority: 'high',     assigneeId: 'dev-division_admin-id',  reporterId: 'dev-org_admin-id',       startDate: new Date('2026-01-21'), dueDate: new Date('2026-02-05'), estimatedHours: 4,  loggedHours: 4,   sprintId: null, position: 20, tags: ['hr', 'forms'],          createdBy: 'dev-org_admin-id',       createdAt: new Date('2026-01-05'), completedAt: new Date('2026-02-05') },
    { id: 't32', projectId: 'proj_hr_1', seqNumber: 3, title: 'Manager review calibration sessions',    description: 'Conduct calibration sessions with 6 department heads to normalize ratings and resolve outliers.',                                                                                                                         statusId: 'pending-approval', statusName: 'Pending Approval', priority: 'high', assigneeId: 'dev-org_admin-id', reporterId: 'dev-org_admin-id',       startDate: new Date('2026-02-10'), dueDate: new Date('2026-02-28'), estimatedHours: 12, loggedHours: 6,   sprintId: null, position: 30, tags: ['hr', 'management'],     createdBy: 'dev-org_admin-id',       createdAt: new Date('2026-01-20') },
    { id: 't33', projectId: 'proj_hr_1', seqNumber: 4, title: 'Compile appraisal letters',              description: 'Generate and quality-check appraisal letters for all employees including salary revisions.',                                                                                                                             statusId: 'draft',       statusName: 'Draft',       priority: 'medium',   assigneeId: 'dev-division_admin-id',  reporterId: 'dev-org_admin-id',       startDate: new Date('2026-03-01'), dueDate: new Date('2026-03-25'), estimatedHours: 16, loggedHours: 0,   sprintId: null, position: 40, tags: ['hr', 'documents'],      createdBy: 'dev-org_admin-id',       createdAt: new Date('2026-02-01') },

    // ── proj_mobile (Mobile App) ──
    { id: 't40', projectId: 'proj_mobile', seqNumber: 1, title: 'React Native project scaffolding',     description: 'Set up Expo managed workflow with TypeScript, navigation library, and styling setup.',                                                                                                                                    statusId: 'done',        statusName: 'Done',        priority: 'critical', assigneeId: 'dev-member-id',          reporterId: 'dev-project_manager-id', startDate: new Date('2026-03-01'), dueDate: new Date('2026-03-07'), estimatedHours: 4,  loggedHours: 4,   sprintId: 'sprint_mob_1', position: 10, tags: ['mobile', 'setup'],      createdBy: 'dev-project_manager-id', createdAt: new Date('2026-03-01'), completedAt: new Date('2026-03-06') },
    { id: 't41', projectId: 'proj_mobile', seqNumber: 2, title: 'Login and biometric auth screens',     description: 'Implement login, forgot password, and Face ID/fingerprint unlock screens using expo-local-authentication.',                                                                                                               statusId: 'in-progress', statusName: 'In Progress', priority: 'high',     assigneeId: 'dev-member-id',          reporterId: 'dev-project_manager-id', startDate: new Date('2026-03-08'), dueDate: new Date('2026-03-22'), estimatedHours: 10, loggedHours: 4,   sprintId: 'sprint_mob_1', position: 20, tags: ['mobile', 'auth'],       createdBy: 'dev-project_manager-id', createdAt: new Date('2026-03-01') },
    { id: 't42', projectId: 'proj_mobile', seqNumber: 3, title: 'Task list and detail views',           description: 'Build mobile-optimized task list with swipe actions, pull-to-refresh, and offline caching via MMKV.',                                                                                                                   statusId: 'todo',        statusName: 'To Do',       priority: 'high',     assigneeId: 'dev-member-id',          reporterId: 'dev-project_manager-id', startDate: new Date('2026-03-15'), dueDate: new Date('2026-03-31'), estimatedHours: 14, loggedHours: 0,   sprintId: 'sprint_mob_2', position: 30, tags: ['mobile', 'tasks'],      createdBy: 'dev-project_manager-id', createdAt: new Date('2026-03-01') },
    { id: 't43', projectId: 'proj_mobile', seqNumber: 4, title: 'Push notification integration',        description: 'Integrate Expo Push Notifications for task assignments, due date reminders, and @mentions.',                                                                                                                             statusId: 'backlog',     statusName: 'Backlog',     priority: 'medium',   assigneeId: null,                     reporterId: 'dev-project_manager-id', startDate: null,              dueDate: new Date('2026-04-15'), estimatedHours: 8,  loggedHours: 0,   sprintId: null,           position: 40, tags: ['mobile', 'notifications'], createdBy: 'dev-project_manager-id', createdAt: new Date('2026-03-01') },
  ];

  for (const t of tasks) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: {},
      create: { ...t, orgId: 'dev-org-id' },
    });
  }

  // ── Comments (3-4 per task) ───────────────────────────────
  const comments = [
    // t1 – Navigation component
    { id: 'c1',  orgId: 'dev-org-id', taskId: 't1', authorId: 'dev-project_manager-id', parentId: null, body: 'Great progress on the nav! Please ensure it is tested in Safari — previous iteration had animation issues on iOS.',                                                     createdAt: new Date(Date.now() - 6 * 3600000) },
    { id: 'c2',  orgId: 'dev-org-id', taskId: 't1', authorId: 'dev-member-id',          parentId: 'c1', body: 'Safari bugs fixed. Added Playwright cross-browser tests. Also resolved the z-index conflict with modal overlays. Ready for review.',                                    createdAt: new Date(Date.now() - 4 * 3600000) },
    { id: 'c3',  orgId: 'dev-org-id', taskId: 't1', authorId: 'dev-org_admin-id',       parentId: null, body: 'Can we also ensure the hamburger menu is keyboard-accessible? WCAG AA compliance is required for this sprint.',                                                         createdAt: new Date(Date.now() - 2 * 3600000) },
    { id: 'c4',  orgId: 'dev-org-id', taskId: 't1', authorId: 'dev-member-id',          parentId: 'c3', body: 'Yes, I have added aria-label and keyboard trap in the drawer. Will include in the same PR.',                                                                            createdAt: new Date(Date.now() - 1 * 3600000) },

    // t2 – JWT auth
    { id: 'c5',  orgId: 'dev-org-id', taskId: 't2', authorId: 'dev-project_manager-id', parentId: null, body: 'Remember to handle concurrent refresh race conditions. Multiple tabs refreshing simultaneously can cause duplicate token revocations.',                                   createdAt: new Date(Date.now() - 48 * 3600000) },
    { id: 'c6',  orgId: 'dev-org-id', taskId: 't2', authorId: 'dev-org_admin-id',       parentId: null, body: 'For the refresh token store, let us use Redis with TTL matching the token expiry. Avoids stale token attacks if the DB is compromised.',                                 createdAt: new Date(Date.now() - 36 * 3600000) },
    { id: 'c7',  orgId: 'dev-org-id', taskId: 't2', authorId: 'dev-project_manager-id', parentId: null, body: 'This is now the highest priority task for this sprint. Blocking the SSO integration deliverable.',                                                                       createdAt: new Date(Date.now() - 12 * 3600000) },

    // t4 – CI/CD
    { id: 'c8',  orgId: 'dev-org-id', taskId: 't4', authorId: 'dev-org_admin-id',       parentId: null, body: 'The GitHub Actions pipeline looks solid. One suggestion: cache the npm install step using actions/cache with the package-lock hash.',                                    createdAt: new Date(Date.now() - 10 * 3600000) },
    { id: 'c9',  orgId: 'dev-org-id', taskId: 't4', authorId: 'dev-project_manager-id', parentId: 'c8', body: 'Good call — caching already added. Build time dropped from 4:20 to 1:45. PR is ready for final approval.',                                                             createdAt: new Date(Date.now() - 5 * 3600000) },
    { id: 'c10', orgId: 'dev-org-id', taskId: 't4', authorId: 'dev-member-id',          parentId: null, body: 'Staging deployment tested. All 47 unit tests pass. Smoke tests on the staging env confirmed core flows working correctly.',                                              createdAt: new Date(Date.now() - 2 * 3600000) },

    // t10 – OpenAPI spec
    { id: 'c11', orgId: 'dev-org-id', taskId: 't10', authorId: 'dev-project_manager-id', parentId: null, body: 'The OpenAPI spec draft looks great. One gap: we need to add the webhook event schemas for task-created, task-updated, and sprint-completed.',                          createdAt: new Date(Date.now() - 24 * 3600000) },
    { id: 'c12', orgId: 'dev-org-id', taskId: 't10', authorId: 'dev-member-id',          parentId: 'c11', body: 'Webhook schemas added. Also added discriminated union response types for error codes. Draft v0.3 is up in Confluence.',                                              createdAt: new Date(Date.now() - 18 * 3600000) },
    { id: 'c13', orgId: 'dev-org-id', taskId: 't10', authorId: 'dev-org_admin-id',       parentId: null, body: 'Can we include examples for the pagination envelope? Consumers always struggle with cursor vs offset decisions.',                                                      createdAt: new Date(Date.now() - 8 * 3600000) },

    // t20 – Email drip campaign
    { id: 'c14', orgId: 'dev-org-id', taskId: 't20', authorId: 'dev-org_admin-id',       parentId: null, body: 'First batch sent to 120 leads. Open rate at 38% — above industry average of 22%. Click-through at 14%. Let us monitor bounce rates before sending batch 2.',          createdAt: new Date(Date.now() - 72 * 3600000) },
    { id: 'c15', orgId: 'dev-org-id', taskId: 't20', authorId: 'dev-division_admin-id',  parentId: 'c14', body: 'Batch 2 ready. Personalized subject lines based on segment. Removing 8 hard bounces from the list before sending.',                                                  createdAt: new Date(Date.now() - 48 * 3600000) },
    { id: 'c16', orgId: 'dev-org-id', taskId: 't20', authorId: 'dev-org_admin-id',       parentId: null, body: '3 leads have booked demo calls from batch 1. Routing to Anjali for qualification. Great initial results!',                                                            createdAt: new Date(Date.now() - 24 * 3600000) },
  ];

  for (const c of comments) {
    await prisma.comment.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c, isEdited: false },
    });
  }

  // ── Time Logs (4 per task) ────────────────────────────────
  const timeLogs = [
    // t1 – Navigation
    { id: 'tl1',  orgId: 'dev-org-id', taskId: 't1',  userId: 'dev-member-id',          hours: 2.5, description: 'Responsive layout and mobile breakpoints',          loggedDate: new Date('2026-04-22') },
    { id: 'tl2',  orgId: 'dev-org-id', taskId: 't1',  userId: 'dev-member-id',          hours: 1.5, description: 'Safari animation bug investigation and fix',         loggedDate: new Date('2026-04-23') },
    { id: 'tl3',  orgId: 'dev-org-id', taskId: 't1',  userId: 'dev-member-id',          hours: 1.0, description: 'Accessibility keyboard navigation implementation',    loggedDate: new Date('2026-04-25') },
    // t2 – JWT
    { id: 'tl4',  orgId: 'dev-org-id', taskId: 't2',  userId: 'dev-project_manager-id', hours: 3.0, description: 'Research and design token rotation strategy',        loggedDate: new Date('2026-04-21') },
    // t3 – Wireframes
    { id: 'tl5',  orgId: 'dev-org-id', taskId: 't3',  userId: 'dev-member-id',          hours: 2.0, description: 'Initial wireframe sketches and Figma setup',         loggedDate: new Date('2026-03-20') },
    { id: 'tl6',  orgId: 'dev-org-id', taskId: 't3',  userId: 'dev-member-id',          hours: 1.5, description: 'Responsive layout variants and stakeholder review',  loggedDate: new Date('2026-03-25') },
    // t4 – CI/CD
    { id: 'tl7',  orgId: 'dev-org-id', taskId: 't4',  userId: 'dev-project_manager-id', hours: 2.0, description: 'GitHub Actions workflow setup and secrets config',   loggedDate: new Date('2026-04-15') },
    { id: 'tl8',  orgId: 'dev-org-id', taskId: 't4',  userId: 'dev-project_manager-id', hours: 2.0, description: 'Caching optimization and staging deployment test',   loggedDate: new Date('2026-04-18') },
    { id: 'tl9',  orgId: 'dev-org-id', taskId: 't4',  userId: 'dev-project_manager-id', hours: 2.0, description: 'Rollback strategy and production pipeline config',   loggedDate: new Date('2026-04-22') },
    // t10 – OpenAPI
    { id: 'tl10', orgId: 'dev-org-id', taskId: 't10', userId: 'dev-member-id',          hours: 4.0, description: 'Draft all CRUD endpoint definitions',                loggedDate: new Date('2026-04-15') },
    { id: 'tl11', orgId: 'dev-org-id', taskId: 't10', userId: 'dev-member-id',          hours: 4.0, description: 'Add webhook schemas and error response models',      loggedDate: new Date('2026-04-20') },
    // t20 – Email campaign
    { id: 'tl12', orgId: 'dev-org-id', taskId: 't20', userId: 'dev-division_admin-id',  hours: 3.0, description: 'HubSpot email sequence setup and template design',   loggedDate: new Date('2026-04-07') },
    { id: 'tl13', orgId: 'dev-org-id', taskId: 't20', userId: 'dev-division_admin-id',  hours: 3.0, description: 'List segmentation and lead scoring configuration',   loggedDate: new Date('2026-04-10') },
    // t30 – HR goals
    { id: 'tl14', orgId: 'dev-org-id', taskId: 't30', userId: 'dev-org_admin-id',       hours: 4.0, description: 'Review criteria definition and weighting model',     loggedDate: new Date('2026-01-08') },
    { id: 'tl15', orgId: 'dev-org-id', taskId: 't30', userId: 'dev-org_admin-id',       hours: 4.0, description: 'Competency framework alignment with board inputs',    loggedDate: new Date('2026-01-12') },
    // t40 – Mobile setup
    { id: 'tl16', orgId: 'dev-org-id', taskId: 't40', userId: 'dev-member-id',          hours: 4.0, description: 'Expo setup, TypeScript config, navigation library',   loggedDate: new Date('2026-03-05') },
    // t41 – Auth screens
    { id: 'tl17', orgId: 'dev-org-id', taskId: 't41', userId: 'dev-member-id',          hours: 2.5, description: 'Login screen, form validation, error states',        loggedDate: new Date('2026-03-10') },
    { id: 'tl18', orgId: 'dev-org-id', taskId: 't41', userId: 'dev-member-id',          hours: 1.5, description: 'Biometric auth integration and fallback PIN flow',    loggedDate: new Date('2026-03-14') },
  ];

  for (const tl of timeLogs) {
    await prisma.timeLog.upsert({
      where: { id: tl.id },
      update: {},
      create: tl,
    });
  }

  // ── Notifications ─────────────────────────────────────────
  const notifications = [
    { id: 'n1', orgId: 'dev-org-id', userId: 'dev-member-id',          type: 'task_assigned',     title: 'Task assigned to you',              body: 'Anjali Singh assigned "Design navigation component" to you.',              entityType: 'task',    entityId: 't1',  actorId: 'dev-project_manager-id', isRead: false, createdAt: new Date(Date.now() - 2 * 3600000) },
    { id: 'n2', orgId: 'dev-org-id', userId: 'dev-member-id',          type: 'task_commented',    title: 'New comment on your task',          body: 'Priya Sharma commented on "Design navigation component".',                entityType: 'task',    entityId: 't1',  actorId: 'dev-org_admin-id',       isRead: false, createdAt: new Date(Date.now() - 1 * 3600000) },
    { id: 'n3', orgId: 'dev-org-id', userId: 'dev-project_manager-id', type: 'task_updated',      title: 'Task status changed',               body: 'Set up CI/CD pipeline moved to "In Review".',                            entityType: 'task',    entityId: 't4',  actorId: 'dev-project_manager-id', isRead: true,  createdAt: new Date(Date.now() - 5 * 3600000) },
    { id: 'n4', orgId: 'dev-org-id', userId: 'dev-org_admin-id',       type: 'project_created',   title: 'New project created',               body: 'Anjali Singh created project "Mobile App v2".',                           entityType: 'project', entityId: 'proj_mobile', actorId: 'dev-project_manager-id', isRead: true, createdAt: new Date(Date.now() - 24 * 3600000) },
    { id: 'n5', orgId: 'dev-org-id', userId: 'dev-member-id',          type: 'due_date_reminder', title: 'Task due in 2 days',                body: '"Design navigation component" is due on May 10, 2026.',                   entityType: 'task',    entityId: 't1',  actorId: null,                     isRead: false, createdAt: new Date(Date.now() - 30 * 60000) },
    { id: 'n6', orgId: 'dev-org-id', userId: 'dev-division_admin-id',  type: 'member_added',      title: 'Added to Q2 Lead Campaign',         body: 'Priya Sharma added you to project "Q2 Lead Campaign".',                  entityType: 'project', entityId: 'proj_sales_1', actorId: 'dev-org_admin-id', isRead: false, createdAt: new Date(Date.now() - 48 * 3600000) },
    { id: 'n7', orgId: 'dev-org-id', userId: 'dev-project_manager-id', type: 'mention',           title: 'You were mentioned',                body: 'Ravi Kumar mentioned you in a comment on "Set up CI/CD pipeline".',      entityType: 'task',    entityId: 't4',  actorId: 'dev-member-id',          isRead: false, createdAt: new Date(Date.now() - 3 * 3600000) },
    { id: 'n8', orgId: 'dev-org-id', userId: 'dev-org_admin-id',       type: 'workflow_changed',  title: 'Workflow configuration updated',    body: 'Agile Scrum workflow updated — new "Testing / QA" stage added.',         entityType: 'workflow', entityId: 'wf_agile', actorId: 'dev-org_admin-id', isRead: true, createdAt: new Date(Date.now() - 72 * 3600000) },
  ];

  for (const n of notifications) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: {},
      create: n,
    });
  }

  // ── Approvals (4 samples) ─────────────────────────────────
  const approvals = [
    { id: 'appr1', orgId: 'dev-org-id', workflowId: 'wf_approval', title: 'Q2 Marketing Budget Increase',    description: 'Request to increase Q2 marketing budget by ₹5,00,000 for LinkedIn Ads campaign.',             status: 'pending',  currentStep: 1, requestedBy: 'dev-division_admin-id',  relatedProjectId: 'proj_sales_1', createdAt: new Date(Date.now() - 48 * 3600000) },
    { id: 'appr2', orgId: 'dev-org-id', workflowId: 'wf_approval', title: 'New Contractor Onboarding',       description: 'Onboard 2 React Native contractors for Mobile App v2 sprint 2 and sprint 3.',               status: 'approved', currentStep: 2, requestedBy: 'dev-project_manager-id', relatedProjectId: 'proj_mobile',   createdAt: new Date(Date.now() - 5 * 86400000) },
    { id: 'appr3', orgId: 'dev-org-id', workflowId: 'wf_approval', title: 'Performance Review Criteria',     description: 'Approval of 2026 annual performance review criteria and competency framework.',               status: 'approved', currentStep: 3, requestedBy: 'dev-org_admin-id',       relatedProjectId: 'proj_hr_1',     createdAt: new Date(Date.now() - 15 * 86400000) },
    { id: 'appr4', orgId: 'dev-org-id', workflowId: 'wf_approval', title: 'Cloud Infrastructure Upgrade',    description: 'Migrate API platform from 4 vCPU to 8 vCPU nodes — estimated ₹2,40,000/year additional.', status: 'rejected', currentStep: 2, requestedBy: 'dev-project_manager-id', relatedProjectId: 'proj_eng_2',    createdAt: new Date(Date.now() - 3 * 86400000) },
  ];

  for (const a of approvals) {
    await prisma.approval.upsert({
      where: { id: a.id },
      update: {},
      create: a,
    });
  }

  // ── Approval Steps ────────────────────────────────────────
  const approvalSteps = [
    { id: 'as1',  approvalId: 'appr1', stepId: 'step1', stepName: 'Division Admin Review',   stepOrder: 1, role: 'division_admin', status: 'pending',  parallel: false },
    { id: 'as2',  approvalId: 'appr1', stepId: 'step2', stepName: 'Org Admin Final Approval', stepOrder: 2, role: 'org_admin',      status: 'pending',  parallel: false },
    { id: 'as3',  approvalId: 'appr2', stepId: 'step1', stepName: 'PM Review',                stepOrder: 1, role: 'project_manager', status: 'approved', parallel: false },
    { id: 'as4',  approvalId: 'appr2', stepId: 'step2', stepName: 'Org Admin Final Approval', stepOrder: 2, role: 'org_admin',      status: 'approved', parallel: false },
    { id: 'as5',  approvalId: 'appr3', stepId: 'step1', stepName: 'HR Head Review',           stepOrder: 1, role: 'division_admin', status: 'approved', parallel: false },
    { id: 'as6',  approvalId: 'appr3', stepId: 'step2', stepName: 'Executive Sign-off',       stepOrder: 2, role: 'executive',      status: 'approved', parallel: false },
    { id: 'as7',  approvalId: 'appr3', stepId: 'step3', stepName: 'Org Admin Final Approval', stepOrder: 3, role: 'org_admin',      status: 'approved', parallel: false },
    { id: 'as8',  approvalId: 'appr4', stepId: 'step1', stepName: 'Division Admin Review',    stepOrder: 1, role: 'division_admin', status: 'approved', parallel: false },
    { id: 'as9',  approvalId: 'appr4', stepId: 'step2', stepName: 'Org Admin Final Approval', stepOrder: 2, role: 'org_admin',      status: 'rejected', parallel: false },
  ];

  for (const s of approvalSteps) {
    await prisma.approvalStep.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    });
  }

  // ── Approval Records ──────────────────────────────────────
  const approvalRecords = [
    { id: 'ar1', approvalId: 'appr2', stepId: 'step1', approvedBy: 'dev-project_manager-id', action: 'approved', reason: 'Contractors vetted and budget within project allocation.', createdAt: new Date(Date.now() - 4 * 86400000) },
    { id: 'ar2', approvalId: 'appr2', stepId: 'step2', approvedBy: 'dev-org_admin-id',       action: 'approved', reason: 'Approved. Please ensure NDAs are signed before access is granted.', createdAt: new Date(Date.now() - 3 * 86400000) },
    { id: 'ar3', approvalId: 'appr3', stepId: 'step1', approvedBy: 'dev-org_admin-id',       action: 'approved', reason: 'Criteria well-defined and aligned with org OKRs.', createdAt: new Date(Date.now() - 13 * 86400000) },
    { id: 'ar4', approvalId: 'appr3', stepId: 'step2', approvedBy: 'dev-executive-id',       action: 'approved', reason: 'Approved. Emphasize cross-functional collaboration competency.', createdAt: new Date(Date.now() - 12 * 86400000) },
    { id: 'ar5', approvalId: 'appr3', stepId: 'step3', approvedBy: 'dev-org_admin-id',       action: 'approved', reason: 'Final approval granted. Circulate to all department heads.', createdAt: new Date(Date.now() - 11 * 86400000) },
    { id: 'ar6', approvalId: 'appr4', stepId: 'step1', approvedBy: 'dev-division_admin-id',  action: 'approved', reason: 'Technical need is valid. Escalating to org admin for budget decision.', createdAt: new Date(Date.now() - 2 * 86400000) },
    { id: 'ar7', approvalId: 'appr4', stepId: 'step2', approvedBy: 'dev-org_admin-id',       action: 'rejected', reason: 'Budget not available in Q2. Please re-submit in Q3 planning cycle.', createdAt: new Date(Date.now() - 1 * 86400000) },
  ];

  for (const ar of approvalRecords) {
    await prisma.approvalRecord.upsert({
      where: { id: ar.id },
      update: {},
      create: ar,
    });
  }

  // ── Activity Logs ─────────────────────────────────────────
  const activityLogs = [
    { id: 'al1',  orgId: 'dev-org-id', actorId: 'dev-project_manager-id', entityType: 'task',    entityId: 't1',  action: 'status_changed',  oldValue: { status: 'todo' },        newValue: { status: 'in-progress' }, createdAt: new Date(Date.now() - 6 * 3600000) },
    { id: 'al2',  orgId: 'dev-org-id', actorId: 'dev-org_admin-id',       entityType: 'task',    entityId: 't2',  action: 'priority_changed', oldValue: { priority: 'high' },      newValue: { priority: 'critical' },  createdAt: new Date(Date.now() - 12 * 3600000) },
    { id: 'al3',  orgId: 'dev-org-id', actorId: 'dev-project_manager-id', entityType: 'sprint',  entityId: 'sprint_pf_1', action: 'sprint_completed', oldValue: null, newValue: { status: 'completed' }, createdAt: new Date(Date.now() - 10 * 86400000) },
    { id: 'al4',  orgId: 'dev-org-id', actorId: 'dev-project_manager-id', entityType: 'project', entityId: 'proj_mobile', action: 'project_created',  oldValue: null, newValue: { name: 'Mobile App v2' }, createdAt: new Date(Date.now() - 30 * 86400000) },
    { id: 'al5',  orgId: 'dev-org-id', actorId: 'dev-org_admin-id',       entityType: 'task',    entityId: 't3',  action: 'task_completed',   oldValue: { status: 'in-review' },  newValue: { status: 'done', completedAt: '2026-03-30' }, createdAt: new Date('2026-03-30') },
    { id: 'al6',  orgId: 'dev-org-id', actorId: 'dev-member-id',          entityType: 'task',    entityId: 't1',  action: 'assignee_changed', oldValue: { assignee: null },        newValue: { assignee: 'dev-member-id' }, createdAt: new Date(Date.now() - 8 * 86400000) },
    { id: 'al7',  orgId: 'dev-org-id', actorId: 'dev-org_admin-id',       entityType: 'org',     entityId: 'dev-org-id', action: 'member_invited',  oldValue: null, newValue: { email: 'viewer@example.local', role: 'viewer' }, createdAt: new Date(Date.now() - 20 * 86400000) },
    { id: 'al8',  orgId: 'dev-org-id', actorId: 'dev-project_manager-id', entityType: 'task',    entityId: 't4',  action: 'status_changed',  oldValue: { status: 'in-progress' }, newValue: { status: 'in-review' }, createdAt: new Date(Date.now() - 3 * 3600000) },
  ];

  for (const al of activityLogs) {
    await prisma.activityLog.upsert({
      where: { id: al.id },
      update: {},
      create: al,
    });
  }

  // ── External Users ────────────────────────────────────────
  const externalUsers = [
    { id: 'ext1', orgId: 'dev-org-id', email: 'client.acme@acmecorp.com',    firstName: 'David',   lastName: 'Chen',    accessLevel: 'viewer',        invitedBy: 'dev-org_admin-id',       expiresAt: new Date('2026-12-31'), isActive: true, createdAt: new Date(Date.now() - 30 * 86400000) },
    { id: 'ext2', orgId: 'dev-org-id', email: 'auditor@external-audit.com',  firstName: 'Meera',   lastName: 'Kapoor',  accessLevel: 'viewer',        invitedBy: 'dev-org_admin-id',       expiresAt: new Date('2026-06-30'), isActive: true, createdAt: new Date(Date.now() - 15 * 86400000) },
    { id: 'ext3', orgId: 'dev-org-id', email: 'contractor1@freelance.io',    firstName: 'James',   lastName: 'Lee',     accessLevel: 'contributor',   invitedBy: 'dev-project_manager-id', expiresAt: new Date('2026-09-30'), isActive: true, createdAt: new Date(Date.now() - 5 * 86400000) },
  ];

  for (const eu of externalUsers) {
    await prisma.externalUser.upsert({
      where: { orgId_email: { orgId: eu.orgId, email: eu.email } },
      update: {},
      create: { ...eu, permissions: ['read'] },
    });
  }

  console.log('✅  Database seeded with comprehensive demo data');
  console.log('   • 14 users (8 base + 5 PPID + 1 HoD)');
  console.log('   • PPID division: div_ppid (divAdmin, VH, TM, PL, HoD)');
  console.log('   • 3 verticals (vert_tech headed by dev-vertical_head-id)');
  console.log('   • 4 workflow configs (Kanban, Agile, Simple, Approval-Gated)');
  console.log('   • 4 custom roles, 4 custom field definitions');
  console.log('   • 5 divisions (2 sub-divisions of Engineering)');
  console.log('   • 5 projects across all divisions');
  console.log('   • 10 sprints across projects');
  console.log('   • 20 tasks with full detail (status, priority, estimates, tags)');
  console.log('   • 16 comments with threaded replies');
  console.log('   • 18 time log entries');
  console.log('   • 8 notifications');
  console.log('   • 4 approvals with steps and records');
  console.log('   • 8 activity log entries');
  console.log('   • 3 external users');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
