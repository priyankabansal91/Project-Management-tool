// Run: node docs/generate_ppt.js
// Output: docs/PM_Tool_Presentation.pptx

const PptxGenJS = require('pptxgenjs');
const path = require('path');

const pptx = new PptxGenJS();

// ─── Theme ───────────────────────────────────────────────
const C = {
  primary:   '1E3A5F',
  accent:    '3B82F6',
  green:     '10B981',
  orange:    'F59E0B',
  red:       'EF4444',
  purple:    '8B5CF6',
  teal:      '06B6D4',
  white:     'FFFFFF',
  lightGray: 'F1F5F9',
  midGray:   '94A3B8',
  darkText:  '1E293B',
  bodyText:  '475569',
};

pptx.layout  = 'LAYOUT_WIDE';
pptx.author  = 'Quality Council of India';
pptx.company = 'QCI';
pptx.subject = 'Enterprise PM Tool';
pptx.title   = 'Enterprise Project Management Tool';

// ─── Helpers ────────────────────────────────────────────
function slideBg(s, color = C.white) { s.background = { color }; }

function headerBand(s, title, sub = '', color = C.primary) {
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.2, fill: { color } });
  s.addText(title, { x: 0.4, y: 0.12, w: 10, h: 0.6, fontSize: 26, bold: true, color: C.white, fontFace: 'Calibri' });
  if (sub) s.addText(sub, { x: 0.4, y: 0.72, w: 10, h: 0.38, fontSize: 13, color: 'BFD3E8', fontFace: 'Calibri' });
}

function footer(s, n) {
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 7.1, w: '100%', h: 0.4, fill: { color: C.lightGray } });
  s.addText('Quality Council of India — Enterprise PM Tool   |   Confidential', { x: 0.3, y: 7.12, w: 10, h: 0.28, fontSize: 8, color: C.midGray, fontFace: 'Calibri' });
  s.addText(`${n}`, { x: 12.8, y: 7.12, w: 0.4, h: 0.28, fontSize: 8, color: C.midGray, fontFace: 'Calibri', align: 'right' });
}

function statBox(s, x, y, value, label, color) {
  s.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.6, h: 1.3, fill: { color }, rectRadius: 0.12, shadow: { type: 'outer', blur: 6, offset: 2, angle: 45, color: '000000', opacity: 0.12 } });
  s.addText(value, { x, y: y + 0.1, w: 2.6, h: 0.65, fontSize: 28, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
  s.addText(label, { x, y: y + 0.72, w: 2.6, h: 0.42, fontSize: 11, color: 'DBEAFE', align: 'center', fontFace: 'Calibri' });
}

function featureCard(s, x, y, w, h, title, bullets, color = C.primary) {
  s.addShape(pptx.ShapeType.roundRect, { x, y, w, h, fill: { color: C.white }, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.1, shadow: { type: 'outer', blur: 5, offset: 2, angle: 45, color: '000000', opacity: 0.08 } });
  s.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.38, fill: { color }, rectRadius: 0.1, line: { color, width: 0 } });
  s.addShape(pptx.ShapeType.rect,      { x, y: y + 0.2, w, h: 0.18, fill: { color }, line: { color, width: 0 } });
  s.addText(title, { x: x + 0.15, y: y + 0.06, w: w - 0.3, h: 0.28, fontSize: 11, bold: true, color: C.white, fontFace: 'Calibri' });
  if (bullets.length) {
    s.addText(bullets.map(b => '• ' + b).join('\n'), { x: x + 0.15, y: y + 0.44, w: w - 0.3, h: h - 0.52, fontSize: 9.5, color: C.bodyText, fontFace: 'Calibri', valign: 'top' });
  }
}

function mockScreen(s, x, y, w, h, title, items = []) {
  s.addShape(pptx.ShapeType.roundRect, { x, y, w, h, fill: { color: C.white }, line: { color: 'CBD5E1', width: 1.5 }, rectRadius: 0.12, shadow: { type: 'outer', blur: 10, offset: 3, angle: 45, color: '000000', opacity: 0.14 } });
  s.addShape(pptx.ShapeType.rect,     { x, y, w, h: 0.32, fill: { color: 'F8FAFC' } });
  s.addShape(pptx.ShapeType.ellipse,  { x: x + 0.12, y: y + 0.1,  w: 0.12, h: 0.12, fill: { color: 'FC5C57' } });
  s.addShape(pptx.ShapeType.ellipse,  { x: x + 0.30, y: y + 0.1,  w: 0.12, h: 0.12, fill: { color: 'FDBC2C' } });
  s.addShape(pptx.ShapeType.ellipse,  { x: x + 0.48, y: y + 0.1,  w: 0.12, h: 0.12, fill: { color: '34C84A' } });
  s.addShape(pptx.ShapeType.roundRect,{ x: x + 0.7, y: y + 0.05, w: w - 1.0, h: 0.22, fill: { color: 'EEF2FF' }, rectRadius: 0.04 });
  s.addText('localhost:5173 — PM Tool', { x: x + 0.75, y: y + 0.07, w: w - 1.1, h: 0.18, fontSize: 7, color: '6366F1' });
  s.addShape(pptx.ShapeType.rect, { x, y: y + 0.32, w, h: 0.36, fill: { color: C.primary } });
  s.addText(title, { x: x + 0.15, y: y + 0.36, w: w - 0.3, h: 0.28, fontSize: 10, bold: true, color: C.white, fontFace: 'Calibri' });
  items.forEach((item, i) => {
    const ry = y + 0.72 + i * 0.36;
    if (ry + 0.36 > y + h) return;
    s.addShape(pptx.ShapeType.rect, { x, y: ry, w, h: 0.36, fill: { color: i % 2 === 0 ? C.white : 'F8FAFC' } });
    s.addText(item, { x: x + 0.18, y: ry + 0.08, w: w - 0.3, h: 0.22, fontSize: 8.5, color: C.darkText, fontFace: 'Calibri' });
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 1 — TITLE
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: C.primary } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 4.5, w: '100%', h: 3.0,  fill: { color: '152B47' } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 2.8, w: 0.18,  h: 2.0,  fill: { color: C.accent } });

  s.addText('Enterprise Project\nManagement Tool', { x: 0.5, y: 1.1, w: 8, h: 1.9, fontSize: 38, bold: true, color: C.white, fontFace: 'Calibri', lineSpacingMultiple: 1.2 });
  s.addText('A comprehensive SaaS platform for multi-division enterprise project delivery', { x: 0.5, y: 3.05, w: 8.5, h: 0.55, fontSize: 15, color: 'BFD3E8', fontFace: 'Calibri' });
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 3.68, w: 3.5, h: 0.04, fill: { color: C.accent } });
  s.addText('Quality Council of India', { x: 0.5, y: 3.82, w: 5, h: 0.4, fontSize: 14, bold: true, color: C.accent, fontFace: 'Calibri' });
  s.addText('April 30, 2026   |   v2.0   |   Confidential', { x: 0.5, y: 4.28, w: 6, h: 0.3, fontSize: 11, color: C.midGray, fontFace: 'Calibri' });

  // Right panel — feature tiles
  s.addShape(pptx.ShapeType.roundRect, { x: 9.2, y: 1.0, w: 3.8, h: 5.8, fill: { color: '253E5E' }, rectRadius: 0.2 });
  s.addShape(pptx.ShapeType.roundRect, { x: 9.4, y: 1.2, w: 3.4, h: 5.4, fill: { color: '1A2E44' }, rectRadius: 0.12 });
  const tiles = ['Dashboard', 'Projects', 'Sprints', 'My Tasks', 'Gantt', 'Attendance', 'Portfolio', 'Capacity', 'OKRs', 'Divisions'];
  tiles.forEach((t, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    s.addShape(pptx.ShapeType.roundRect, { x: 9.5 + col * 1.65, y: 1.38 + row * 1.0, w: 1.5, h: 0.78, fill: { color: col === 0 ? C.accent : '2D5FA3' }, rectRadius: 0.1 });
    s.addText(t, { x: 9.5 + col * 1.65, y: 1.52 + row * 1.0, w: 1.5, h: 0.5, fontSize: 9, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 2 — AGENDA
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Agenda', 'What we will cover today');
  footer(s, 2);

  const topics = [
    ['01', 'Business Overview',          'Challenges addressed and value delivered'],
    ['02', 'User Roles & Access',         '6-tier role-based access control'],
    ['03', 'Core PM Features',            'Projects, Kanban board, Tasks'],
    ['04', 'Sprint Management',           'Agile sprint planning and execution'],
    ['05', 'Team & Division Mgmt',        'User onboarding, hierarchy, permissions'],
    ['06', 'Workflow & Approvals',        '4 workflow types, multi-step approval chains'],
    ['07', 'Time Tracking',              'Timesheets, logging, approvals'],
    ['08', 'Attendance Tracking',        'Clock in/out, leave management, team view'],
    ['09', 'Gantt, Feature Flags & More','Timeline view, role configuration, onboarding'],
    ['10', 'Portfolio & Capacity',        'Health scores, utilization heatmaps'],
    ['11', 'Executive Dashboard',         'OKRs, scorecards, resource view'],
    ['12', 'Roadmap & Next Steps',        'Upcoming features and production deployment'],
  ];

  topics.forEach(([num, title, desc], i) => {
    const col = i < 6 ? 0 : 1;
    const row = i % 6;
    const x   = col === 0 ? 0.4 : 6.8;
    const y   = 1.35 + row * 0.92;

    s.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.9, h: 0.76, fill: { color: C.lightGray }, rectRadius: 0.08 });
    s.addShape(pptx.ShapeType.roundRect, { x, y, w: 0.55, h: 0.76, fill: { color: C.accent }, rectRadius: 0.08 });
    s.addShape(pptx.ShapeType.rect,      { x: x + 0.36, y, w: 0.2, h: 0.76, fill: { color: C.accent } });
    s.addText(num,   { x, y: y + 0.18, w: 0.55, h: 0.38, fontSize: 13, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
    s.addText(title, { x: x + 0.65, y: y + 0.06, w: 5.1, h: 0.3, fontSize: 11, bold: true, color: C.darkText, fontFace: 'Calibri' });
    s.addText(desc,  { x: x + 0.65, y: y + 0.38, w: 5.1, h: 0.28, fontSize: 9, color: C.bodyText, fontFace: 'Calibri' });
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 3 — BUSINESS OVERVIEW
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Business Overview', 'Problems solved and value delivered');
  footer(s, 3);

  s.addText('Challenges Addressed', { x: 0.4, y: 1.35, w: 5.8, h: 0.35, fontSize: 13, bold: true, color: C.primary, fontFace: 'Calibri' });
  const challenges = [
    '❌  Siloed project data across divisions — no unified view',
    '❌  Manual status tracking causing missed deadlines',
    '❌  No visibility into team capacity and resource utilization',
    '❌  Disconnected approval workflows causing delays',
    '❌  No real-time portfolio health monitoring for leadership',
    '❌  Time & attendance tracking scattered across spreadsheets',
  ];
  challenges.forEach((c, i) => {
    s.addShape(pptx.ShapeType.rect, { x: 0.4, y: 1.78 + i * 0.6, w: 5.8, h: 0.48, fill: { color: i % 2 === 0 ? 'FFF1F2' : 'FEF2F2' } });
    s.addText(c, { x: 0.55, y: 1.85 + i * 0.6, w: 5.5, h: 0.34, fontSize: 10, color: '991B1B', fontFace: 'Calibri' });
  });

  s.addText('Our Solution', { x: 7.0, y: 1.35, w: 5.8, h: 0.35, fontSize: 13, bold: true, color: C.primary, fontFace: 'Calibri' });
  const solutions = [
    '✅  Single unified platform for all divisions and projects',
    '✅  Real-time Kanban + Gantt with drag-and-drop task management',
    '✅  Capacity planning heatmaps and resource dashboards',
    '✅  Configurable approval chains with full audit trails',
    '✅  Executive portfolio dashboard with health scores',
    '✅  Integrated time logging, timesheets & attendance tracking',
  ];
  solutions.forEach((c, i) => {
    s.addShape(pptx.ShapeType.rect, { x: 7.0, y: 1.78 + i * 0.6, w: 5.8, h: 0.48, fill: { color: i % 2 === 0 ? 'F0FDF4' : 'ECFDF5' } });
    s.addText(c, { x: 7.15, y: 1.85 + i * 0.6, w: 5.5, h: 0.34, fontSize: 10, color: '166534', fontFace: 'Calibri' });
  });
  s.addShape(pptx.ShapeType.rect, { x: 6.65, y: 1.35, w: 0.04, h: 4.0, fill: { color: 'E2E8F0' } });
}

// ════════════════════════════════════════════════════════
// SLIDE 4 — USER ROLES
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'User Roles & Access Control', '6-tier role-based access control system');
  footer(s, 4);

  const roles = [
    { role: 'Org Admin',        color: 'DC2626', desc: 'Full system access. Manages users, divisions, billing, global settings, and all projects across the organization.' },
    { role: 'Division Admin',   color: 'EA580C', desc: 'Manages a specific division — its projects, members, budget, workflows, and division-level configurations.' },
    { role: 'Project Manager',  color: '2563EB', desc: 'Creates and manages projects, assigns tasks, runs sprints, approves timesheets, and monitors team capacity.' },
    { role: 'Member',           color: '16A34A', desc: 'Works on assigned tasks, logs time, submits timesheets, clocks attendance, participates in sprints, adds comments.' },
    { role: 'Executive',        color: '7C3AED', desc: 'Read-only access to portfolio dashboards, OKR tracking, executive scorecards, and cross-division reports.' },
    { role: 'Viewer',           color: '475569', desc: 'Limited read-only access to specific projects they are granted visibility into. Cannot create or modify.' },
  ];

  roles.forEach((r, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = col === 0 ? 0.4 : 6.8;
    const y = 1.45 + row * 1.7;
    s.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.9, h: 1.5, fill: { color: C.white }, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.1, shadow: { type: 'outer', blur: 4, offset: 1, angle: 45, color: '000000', opacity: 0.06 } });
    s.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.9, h: 0.42, fill: { color: r.color }, rectRadius: 0.1 });
    s.addShape(pptx.ShapeType.rect,      { x, y: y + 0.24, w: 5.9, h: 0.18, fill: { color: r.color } });
    s.addText(r.role, { x: x + 0.18, y: y + 0.08, w: 5.5, h: 0.28, fontSize: 12, bold: true, color: C.white, fontFace: 'Calibri' });
    s.addText(r.desc, { x: x + 0.18, y: y + 0.52, w: 5.5, h: 0.85, fontSize: 9.5, color: C.bodyText, fontFace: 'Calibri', valign: 'top' });
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 5 — DASHBOARD
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Dashboard', 'Real-time org-wide visibility at a glance');
  footer(s, 5);

  statBox(s, 0.4,  1.45, '5',    'Active Projects',    C.accent);
  statBox(s, 3.15, 1.45, '20',   'Tasks Seeded',        C.green);
  statBox(s, 5.9,  1.45, '76%',  'Completion Rate',     C.purple);
  statBox(s, 8.65, 1.45, '10',   'Active Sprints',      C.orange);

  mockScreen(s, 0.4, 3.0, 5.8, 3.6, 'Recent Activity', [
    '📋  Sprint 3 started — ProjectFlow Platform',
    '✅  "Analytics dashboard wireframes" marked Done by Ravi',
    '💬  Comment thread on "Design navigation component"',
    '👤  Anjali Singh invited Vikram Mehta to Mobile App v2',
    '📊  Time log submitted: 4h on OpenAPI specification',
    '🏢  Sub-division "Frontend Team" created under Engineering',
  ]);

  mockScreen(s, 6.6, 3.0, 6.3, 3.6, 'My Tasks (Due Soon)', [
    '🔴 HIGH    — Design navigation component     (Due: May 10)',
    '🔴 CRITICAL — Implement auth flow             (Due: May 15)',
    '🟠 HIGH    — OpenAPI specification           (Due: May 20)',
    '🟡 MEDIUM  — Role-based permission matrix    (Due: May 20)',
    '🟢 LOW     — Write integration test suite    (Due: Jun 01)',
  ]);

  s.addText('Navigation sidebar: Dashboard · Projects · My Tasks · Calendar · Gantt · Sprints · Attendance · Reports · Capacity · Executive · Admin modules', {
    x: 0.4, y: 6.62, w: 12.5, h: 0.35, fontSize: 8.5, color: C.midGray, italic: true, fontFace: 'Calibri',
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 6 — PROJECT MANAGEMENT (KANBAN)
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Project Management', 'End-to-end project lifecycle with Kanban board');
  footer(s, 6);

  s.addText('Kanban Board', { x: 0.4, y: 1.32, w: 6, h: 0.32, fontSize: 12, bold: true, color: C.primary, fontFace: 'Calibri' });

  const columns = [
    { name: 'Backlog',   color: '64748B', tasks: ['Rate limiting middleware', 'Write test suite'] },
    { name: 'To Do',     color: '3B82F6', tasks: ['Implement auth flow', 'Permission matrix UI'] },
    { name: 'In Prog',   color: 'F59E0B', tasks: ['Navigation UI', 'OpenAPI specification'] },
    { name: 'In Review', color: '8B5CF6', tasks: ['CI/CD pipeline'] },
    { name: 'Done',      color: '10B981', tasks: ['Dashboard wireframes'] },
  ];

  columns.forEach((col, ci) => {
    const x = 0.4 + ci * 2.5;
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.7, w: 2.28, h: 4.9, fill: { color: C.lightGray }, rectRadius: 0.1 });
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.7, w: 2.28, h: 0.38, fill: { color: col.color }, rectRadius: 0.1 });
    s.addShape(pptx.ShapeType.rect,      { x, y: 1.88, w: 2.28, h: 0.2,  fill: { color: col.color } });
    s.addText(col.name, { x: x + 0.1, y: 1.75, w: 2.0, h: 0.28, fontSize: 9.5, bold: true, color: C.white, fontFace: 'Calibri' });
    col.tasks.forEach((task, ti) => {
      const ty = 2.2 + ti * 1.1;
      s.addShape(pptx.ShapeType.roundRect, { x: x + 0.1, y: ty, w: 2.08, h: 0.9, fill: { color: C.white }, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.08, shadow: { type: 'outer', blur: 3, offset: 1, angle: 45, color: '000000', opacity: 0.07 } });
      s.addText(task, { x: x + 0.18, y: ty + 0.08, w: 1.78, h: 0.35, fontSize: 8.5, bold: true, color: C.darkText, fontFace: 'Calibri' });
      s.addShape(pptx.ShapeType.roundRect, { x: x + 0.18, y: ty + 0.48, w: 0.55, h: 0.2, fill: { color: 'FEF9C3' }, rectRadius: 0.06 });
      s.addText('HIGH', { x: x + 0.18, y: ty + 0.5, w: 0.55, h: 0.16, fontSize: 6.5, bold: true, color: '854D0E', align: 'center', fontFace: 'Calibri' });
      s.addShape(pptx.ShapeType.ellipse, { x: x + 1.7, y: ty + 0.46, w: 0.24, h: 0.24, fill: { color: C.accent } });
      s.addText('RK', { x: x + 1.7, y: ty + 0.5, w: 0.24, h: 0.16, fontSize: 6.5, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
    });
  });

  s.addText('5 projects across 5 divisions   ·   20 tasks with full seed data   ·   Drag-and-drop   ·   Priority badges   ·   Assignee avatars   ·   Inline task creation', {
    x: 0.4, y: 6.68, w: 12.5, h: 0.32, fontSize: 8, color: C.bodyText, fontFace: 'Calibri',
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 7 — SPRINT MANAGEMENT
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Sprint Management', 'Agile sprint planning and execution');
  footer(s, 7);

  // Active sprint banner
  s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 1.4, w: 12.5, h: 1.0, fill: { color: 'F0FDF4' }, line: { color: 'BBF7D0', width: 1 }, rectRadius: 0.1 });
  s.addShape(pptx.ShapeType.ellipse,  { x: 0.65, y: 1.6, w: 0.6, h: 0.6, fill: { color: 'D1FAE5' } });
  s.addText('▶', { x: 0.65, y: 1.67, w: 0.6, h: 0.42, fontSize: 16, color: '059669', align: 'center' });
  s.addText('Sprint 2 – Core Features — Active', { x: 1.4, y: 1.47, w: 6, h: 0.32, fontSize: 12, bold: true, color: C.darkText, fontFace: 'Calibri' });
  s.addText('Implement dashboard, task board, and user management', { x: 1.4, y: 1.8, w: 6, h: 0.28, fontSize: 9.5, color: C.bodyText, fontFace: 'Calibri' });
  [['6', 'Tasks'], ['42h', 'Estimated'], ['33%', 'Complete']].forEach(([val, lbl], i) => {
    s.addText(val, { x: 9.2 + i * 1.4, y: 1.48, w: 1.2, h: 0.38, fontSize: 18, bold: true, color: C.primary, align: 'center', fontFace: 'Calibri' });
    s.addText(lbl, { x: 9.2 + i * 1.4, y: 1.86, w: 1.2, h: 0.22, fontSize: 8, color: C.midGray, align: 'center', fontFace: 'Calibri' });
  });

  // Sprint list
  s.addText('10 Sprints across 3 Projects', { x: 0.4, y: 2.58, w: 4, h: 0.3, fontSize: 11, bold: true, color: C.primary, fontFace: 'Calibri' });
  [
    { name: 'PF Sprint 1 – Foundation',    status: 'completed', color: C.green,   tasks: 6 },
    { name: 'PF Sprint 2 – Core Features', status: 'active',    color: C.accent,  tasks: 6 },
    { name: 'API Sprint 1 – Design',       status: 'completed', color: C.green,   tasks: 4 },
    { name: 'API Sprint 2 – Core APIs',    status: 'active',    color: '059669',  tasks: 4 },
    { name: 'Mobile Sprint 1 – Setup',     status: 'active',    color: C.orange,  tasks: 4 },
  ].forEach((sp, i) => {
    s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 2.95 + i * 0.82, w: 4.2, h: 0.68, fill: C.white, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.08 });
    s.addShape(pptx.ShapeType.roundRect, { x: 4.36, y: 3.07 + i * 0.82, w: 0.75, h: 0.24, fill: { color: sp.color }, rectRadius: 0.08 });
    s.addText(sp.name,   { x: 0.6,  y: 3.02 + i * 0.82, w: 3.6, h: 0.26, fontSize: 10, bold: true, color: C.darkText, fontFace: 'Calibri' });
    s.addText(sp.status, { x: 4.38, y: 3.09 + i * 0.82, w: 0.7, h: 0.18, fontSize: 7,  bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
    s.addText(`${sp.tasks} tasks`, { x: 0.6, y: 3.3 + i * 0.82, w: 2, h: 0.2, fontSize: 8.5, color: C.midGray, fontFace: 'Calibri' });
  });

  // Sprint tasks
  s.addText('Sprint Tasks & Backlog', { x: 5.0, y: 2.58, w: 8.0, h: 0.3, fontSize: 11, bold: true, color: C.primary, fontFace: 'Calibri' });
  mockScreen(s, 5.0, 2.92, 8.1, 3.62, 'Sprint 2 — ProjectFlow Platform Tasks', [
    '🔴 CRITICAL  Implement authentication flow           • Anjali Singh  • To Do    16h',
    '🟠 HIGH      Design navigation component             • Ravi Kumar    • In Prog   8h',
    '🟠 HIGH      Set up CI/CD pipeline                   • Anjali Singh  • Review    6h',
    '🟡 MEDIUM    Role-based permission matrix UI         • Ravi Kumar    • To Do    10h',
    '─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ BACKLOG ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─',
    '⬜ LOW       Write integration test suite           [+ Add to Sprint]',
    '⬜ MED       Customer API docs                      [+ Add to Sprint]',
  ]);
}

// ════════════════════════════════════════════════════════
// SLIDE 8 — TASK MANAGEMENT
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Task Management', 'Detailed tracking, threaded comments & collaboration');
  footer(s, 8);

  // Task detail panel
  s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 1.35, w: 6.2, h: 5.4, fill: C.white, line: { color: 'E2E8F0', width: 1.5 }, rectRadius: 0.12, shadow: { type: 'outer', blur: 8, offset: 2, angle: 45, color: '000000', opacity: 0.09 } });
  s.addShape(pptx.ShapeType.rect, { x: 0.4, y: 1.35, w: 6.2, h: 0.42, fill: { color: C.primary } });
  s.addShape(pptx.ShapeType.rect, { x: 0.4, y: 1.57, w: 6.2, h: 0.2,  fill: { color: C.primary } });
  s.addText('PF-1   ·   Task Detail', { x: 0.6, y: 1.42, w: 5.8, h: 0.28, fontSize: 10, bold: true, color: C.white, fontFace: 'Calibri' });

  s.addText('Design navigation component', { x: 0.6, y: 1.88, w: 5.8, h: 0.42, fontSize: 13, bold: true, color: C.darkText, fontFace: 'Calibri' });
  s.addText('Redesign the top navigation bar with improved UX and mobile support. Requires Safari testing, keyboard accessibility (WCAG AA), and role-aware nav items.', { x: 0.6, y: 2.38, w: 5.8, h: 0.5, fontSize: 9.5, color: C.bodyText, fontFace: 'Calibri' });

  [['Status','In Progress'], ['Priority','High'], ['Assignee','Ravi Kumar'], ['Reporter','Anjali Singh'], ['Due Date','10 May 2026'], ['Est. Hours','8h  (5h logged)']].forEach(([label, value], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const fx = 0.6 + col * 3.0, fy = 2.95 + row * 0.55;
    s.addText(label + ':', { x: fx, y: fy, w: 1.2, h: 0.28, fontSize: 8.5, color: C.midGray, fontFace: 'Calibri' });
    s.addText(value,        { x: fx + 1.2, y: fy, w: 1.8, h: 0.28, fontSize: 9,   bold: true, color: C.darkText, fontFace: 'Calibri' });
  });

  // Comments
  s.addShape(pptx.ShapeType.rect, { x: 0.4, y: 4.65, w: 6.2, h: 0.02, fill: { color: 'E2E8F0' } });
  s.addText('Comments (4)', { x: 0.6, y: 4.72, w: 3, h: 0.3, fontSize: 10, bold: true, color: C.darkText, fontFace: 'Calibri' });
  [
    { user: 'PM',  name: 'Anjali Singh', text: 'Please test in Safari — there were animation issues in the previous iteration.' },
    { user: 'RK',  name: 'Ravi Kumar',   text: 'Safari bugs fixed! Added Playwright cross-browser tests. Ready for review.' },
    { user: 'PA',  name: 'Priya Sharma', text: 'Can we ensure keyboard accessibility (WCAG AA)? Required for this sprint.' },
  ].forEach((c, i) => {
    const cy = 5.1 + i * 0.6;
    s.addShape(pptx.ShapeType.ellipse, { x: 0.6, y: cy, w: 0.3, h: 0.3, fill: { color: C.accent } });
    s.addText(c.user, { x: 0.6, y: cy + 0.06, w: 0.3, h: 0.18, fontSize: 6.5, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
    s.addText(c.name + ':', { x: 1.0, y: cy,      w: 5.4, h: 0.22, fontSize: 8.5, bold: true, color: C.darkText, fontFace: 'Calibri' });
    s.addText(c.text,        { x: 1.0, y: cy + 0.22, w: 5.4, h: 0.28, fontSize: 8,   color: C.bodyText, fontFace: 'Calibri' });
  });

  // My Tasks side
  s.addText('My Tasks Page', { x: 6.9, y: 1.35, w: 6.0, h: 0.32, fontSize: 12, bold: true, color: C.primary, fontFace: 'Calibri' });
  mockScreen(s, 6.9, 1.72, 6.0, 2.6, 'My Tasks — All Tasks (20 seeded)', [
    '☐  PF-1     Design navigation component     HIGH     Due May 10',
    '☐  PF-2     Implement auth flow              CRITICAL Due May 15',
    '☐  APIV3-1  OpenAPI specification            HIGH     Due May 20',
    '✅  PF-3     Analytics wireframes            MED      Completed',
    '✅  MOB-1    React Native scaffolding         CRITICAL Completed',
  ]);

  s.addText('Task Features', { x: 6.9, y: 4.5, w: 6.0, h: 0.32, fontSize: 11, bold: true, color: C.primary, fontFace: 'Calibri' });
  featureCard(s, 6.9,  4.85, 2.85, 1.9, 'My Tasks',      ['Filter: All / Open / Overdue / Done', 'Bulk select: mark done, delete', 'Search by title keyword', '20 seeded tasks across 5 projects'], C.accent);
  featureCard(s, 9.9,  4.85, 2.85, 1.9, 'Collaboration', ['Threaded comment system', '16 seeded threaded comments', 'Edit & delete own comments', '@mention in comments'], C.purple);
}

// ════════════════════════════════════════════════════════
// SLIDE 9 — USER MANAGEMENT & ONBOARDING
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'User Management & Onboarding Wizard', 'Invite, manage, and onboard teams efficiently');
  footer(s, 9);

  s.addText('Active Members', { x: 0.4, y: 1.35, w: 6.0, h: 0.32, fontSize: 12, bold: true, color: C.primary, fontFace: 'Calibri' });
  mockScreen(s, 0.4, 1.72, 6.0, 3.2, 'User Management — Active Members', [
    '👤  Priya Sharma       org admin       ● active   Joined Jan 2026',
    '👤  Vikram Mehta       div admin       ● active   Joined Jan 2026',
    '👤  Anjali Singh       proj manager    ● active   Joined Jan 2026',
    '👤  Ravi Kumar         member          ● active   Joined Jan 2026',
    '👤  Sunita Reddy       executive       ● active   Joined Jan 2026',
    '👤  Arjun Patel        viewer          ● active   Joined Feb 2026',
  ]);

  // Onboarding Wizard mock
  s.addText('Onboarding Wizard — 5-Step Setup', { x: 6.7, y: 1.35, w: 6.0, h: 0.32, fontSize: 12, bold: true, color: C.primary, fontFace: 'Calibri' });
  s.addShape(pptx.ShapeType.roundRect, { x: 6.7, y: 1.72, w: 6.3, h: 5.0, fill: C.white, line: { color: 'E2E8F0', width: 1.5 }, rectRadius: 0.12, shadow: { type: 'outer', blur: 8, offset: 2, angle: 45, color: '000000', opacity: 0.1 } });

  // Progress bar
  const steps = ['Division', 'Assign Head', 'Invite Team', 'Permissions', 'Review'];
  steps.forEach((step, i) => {
    const isDone = i < 3, isActive = i === 3;
    const bColor = isDone ? C.green : isActive ? C.accent : 'CBD5E1';
    s.addShape(pptx.ShapeType.ellipse, { x: 6.9 + i * 1.15, y: 2.0, w: 0.38, h: 0.38, fill: { color: bColor } });
    s.addText(isDone ? '✓' : String(i + 1), { x: 6.9 + i * 1.15, y: 2.06, w: 0.38, h: 0.26, fontSize: 9, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
    s.addText(step, { x: 6.82 + i * 1.15, y: 2.42, w: 0.55, h: 0.28, fontSize: 7.5, color: C.bodyText, align: 'center', fontFace: 'Calibri' });
    if (i < 4) s.addShape(pptx.ShapeType.rect, { x: 7.28 + i * 1.15, y: 2.18, w: 0.77, h: 0.04, fill: { color: isDone ? C.green : 'CBD5E1' } });
  });

  // Step 4 panel
  s.addShape(pptx.ShapeType.roundRect, { x: 6.9, y: 2.78, w: 5.9, h: 0.36, fill: { color: C.lightGray }, rectRadius: 0.08 });
  s.addText('Step 4 of 5 — Set Permissions', { x: 7.05, y: 2.86, w: 5.5, h: 0.24, fontSize: 10, bold: true, color: C.primary, fontFace: 'Calibri' });
  const presets = ['Full Access', 'Standard', 'Read Only', 'Custom'];
  presets.forEach((p, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const isSelected = i === 1;
    s.addShape(pptx.ShapeType.roundRect, { x: 6.95 + col * 2.95, y: 3.2 + row * 0.72, w: 2.75, h: 0.58, fill: { color: isSelected ? 'EFF6FF' : C.white }, line: { color: isSelected ? C.accent : 'E2E8F0', width: isSelected ? 2 : 1 }, rectRadius: 0.08 });
    s.addText((isSelected ? '● ' : '○ ') + p, { x: 7.1 + col * 2.95, y: 3.3 + row * 0.72, w: 2.4, h: 0.36, fontSize: 10, bold: isSelected, color: isSelected ? C.accent : C.darkText, fontFace: 'Calibri' });
  });

  s.addShape(pptx.ShapeType.roundRect, { x: 10.8, y: 6.08, w: 1.9, h: 0.42, fill: { color: C.accent }, rectRadius: 0.08 });
  s.addText('Next →', { x: 10.8, y: 6.16, w: 1.9, h: 0.28, fontSize: 10, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });

  // Feature list bottom left
  const features = ['Real SMTP email invite delivery', 'Invite expires in 7 days', 'Duplicate invite detection', 'Suspend / Reactivate members', 'Role change in one click', 'Onboarding wizard: 5-step division setup'];
  s.addText('Key Capabilities', { x: 0.4, y: 5.08, w: 6.0, h: 0.3, fontSize: 11, bold: true, color: C.primary, fontFace: 'Calibri' });
  features.forEach((f, i) => {
    s.addShape(pptx.ShapeType.roundRect, { x: 0.4 + (i % 2) * 3.05, y: 5.42 + Math.floor(i / 2) * 0.48, w: 2.9, h: 0.38, fill: { color: 'EFF6FF' }, rectRadius: 0.06 });
    s.addText('✓  ' + f, { x: 0.55 + (i % 2) * 3.05, y: 5.5 + Math.floor(i / 2) * 0.48, w: 2.7, h: 0.24, fontSize: 8.5, color: C.accent, fontFace: 'Calibri' });
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 10 — DIVISION MANAGEMENT
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Division Management', 'Multi-level division hierarchy with sub-divisions');
  footer(s, 10);

  // 3 root division cards
  const divs = [
    { name: 'Engineering',       code: 'ENG',   color: C.accent,  members: 20, projects: 2, budget: '₹50L', children: 2 },
    { name: 'Sales & Marketing', code: 'SALES', color: C.green,   members: 12, projects: 1, budget: '₹20L', children: 0 },
    { name: 'Human Resources',   code: 'HR',    color: C.orange,  members:  8, projects: 1, budget: '₹10L', children: 0 },
  ];

  divs.forEach((d, i) => {
    const x = 0.4 + i * 4.3;
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.38, w: 4.0, h: 2.45, fill: C.white, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.12, shadow: { type: 'outer', blur: 6, offset: 2, angle: 45, color: '000000', opacity: 0.08 } });
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.38, w: 4.0, h: 0.44, fill: { color: d.color }, rectRadius: 0.12 });
    s.addShape(pptx.ShapeType.rect,      { x, y: 1.62, w: 4.0, h: 0.22, fill: { color: d.color } });
    s.addText(d.name, { x: x + 0.15, y: 1.44, w: 3.7, h: 0.3, fontSize: 12, bold: true, color: C.white, fontFace: 'Calibri' });
    [['Members', d.members], ['Projects', d.projects], ['Budget', d.budget]].forEach(([lbl, val], j) => {
      s.addText(String(val), { x: x + 0.15 + j * 1.28, y: 2.0,  w: 1.2, h: 0.42, fontSize: 18, bold: true, color: C.darkText, align: 'center', fontFace: 'Calibri' });
      s.addText(lbl,         { x: x + 0.15 + j * 1.28, y: 2.42, w: 1.2, h: 0.25, fontSize: 8.5, color: C.midGray, align: 'center', fontFace: 'Calibri' });
    });
    if (d.children > 0) {
      s.addShape(pptx.ShapeType.roundRect, { x: x + 0.15, y: 2.82, w: 3.7, h: 0.28, fill: { color: 'EFF6FF' }, rectRadius: 0.06 });
      s.addText(`Sub-divisions: Frontend Team, Backend & DevOps`, { x: x + 0.25, y: 2.88, w: 3.5, h: 0.18, fontSize: 7.5, color: C.accent, fontFace: 'Calibri' });
    }
    s.addText(`Code: ${d.code}`, { x: x + 0.15, y: 3.14, w: 3.5, h: 0.22, fontSize: 8, color: C.midGray, fontFace: 'Calibri' });
  });

  // Sub-division hierarchy visual
  s.addText('Division Hierarchy (Tree View)', { x: 0.4, y: 3.98, w: 7, h: 0.3, fontSize: 11, bold: true, color: C.primary, fontFace: 'Calibri' });
  s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 4.32, w: 6.5, h: 2.48, fill: { color: C.lightGray }, rectRadius: 0.1 });
  const treeLines = [
    { label: '● Engineering (ENG)', indent: 0.15, color: C.accent, bold: true },
    { label: '   └── Frontend Team (FE)', indent: 0.55, color: C.purple, bold: false },
    { label: '   └── Backend & DevOps (BE)', indent: 0.55, color: C.teal, bold: false },
    { label: '● Sales & Marketing (SALES)', indent: 0.15, color: C.green, bold: true },
    { label: '● Human Resources (HR)', indent: 0.15, color: C.orange, bold: true },
  ];
  treeLines.forEach((line, i) => {
    s.addText(line.label, { x: 0.55 + line.indent, y: 4.48 + i * 0.44, w: 5.8, h: 0.34, fontSize: 10.5, bold: line.bold, color: line.color, fontFace: 'Calibri' });
  });

  featureCard(s, 7.1, 3.98, 2.9, 2.82, 'Structure',     ['5 divisions (2 sub-divisions)', 'Parent-child hierarchy', 'Unique codes, color-coded', 'Tree & list view toggle'], C.primary);
  featureCard(s, 10.2, 3.98, 2.9, 2.82, 'Governance',   ['Budget allocation per division', 'Headcount management', 'Manager assignment', 'Onboarding wizard integration'], C.purple);
}

// ════════════════════════════════════════════════════════
// SLIDE 11 — WORKFLOW & APPROVALS
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Workflow & Approvals', '4 workflow types and configurable approval chains');
  footer(s, 11);

  s.addText('4 Built-in Workflow Types', { x: 0.4, y: 1.38, w: 12.5, h: 0.3, fontSize: 12, bold: true, color: C.primary, fontFace: 'Calibri' });
  const wflows = [
    { name: 'Default Kanban',     color: C.accent,  stages: ['Backlog','To Do','In Progress','In Review','Done'] },
    { name: 'Agile Scrum',        color: C.green,   stages: ['Product Backlog','Sprint Backlog','Development','Testing','Accepted'] },
    { name: 'Simple 3-Stage',     color: C.orange,  stages: ['Open','Working','Closed'] },
    { name: 'Approval-Gated',     color: C.purple,  stages: ['Draft','Pending Approval','Approved','Rejected','Published'] },
  ];

  const wfLightBg = { [C.accent]: 'DBEAFE', [C.green]: 'D1FAE5', [C.orange]: 'FEF3C7', [C.purple]: 'EDE9FE' };
  wflows.forEach((wf, wi) => {
    const y = 1.8 + wi * 1.1;
    s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y, w: 1.9, h: 0.78, fill: { color: wf.color }, rectRadius: 0.08 });
    s.addText(wf.name, { x: 0.5, y: y + 0.14, w: 1.7, h: 0.5, fontSize: 9.5, bold: true, color: C.white, fontFace: 'Calibri', valign: 'middle' });
    wf.stages.forEach((st, si) => {
      const sx = 2.45 + si * 2.1;
      s.addShape(pptx.ShapeType.roundRect, { x: sx, y: y + 0.15, w: 1.9, h: 0.46, fill: { color: wfLightBg[wf.color] || 'F1F5F9' }, line: { color: wf.color, width: 1 }, rectRadius: 0.06 });
      s.addText(st, { x: sx, y: y + 0.22, w: 1.9, h: 0.3, fontSize: 8, bold: true, color: C.darkText, align: 'center', fontFace: 'Calibri' });
      if (si < wf.stages.length - 1) s.addText('→', { x: sx + 1.9, y: y + 0.22, w: 0.2, h: 0.3, fontSize: 10, color: C.midGray, align: 'center' });
    });
  });

  featureCard(s, 0.4,  6.1, 3.0, 1.2, 'Approval Chains',  ['Multi-step approval sequence', '4 live approval samples seeded', 'Approve / Reject with notes', 'Full audit trail & records'], C.orange);
  featureCard(s, 3.6,  6.1, 3.0, 1.2, 'Approvals Inbox',  ['Pending approvals dashboard', 'One-click approve/reject', 'Filter by status', 'Email notifications on decisions'], C.purple);
  featureCard(s, 6.8,  6.1, 3.0, 1.2, 'Forms',            ['Custom intake forms', 'Submit to trigger workflows', 'Track submission status', 'Link forms to task templates'], C.green);
  featureCard(s, 10.0, 6.1, 3.0, 1.2, 'Versioning',       ['Entity history for all changes', 'Who changed what & when', 'Point-in-time snapshots', 'Restore previous versions'], C.accent);
}

// ════════════════════════════════════════════════════════
// SLIDE 12 — TIME TRACKING
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Time Tracking & Timesheets', 'Log, review, and approve work hours with 18 seeded entries');
  footer(s, 12);

  mockScreen(s, 0.4, 1.4, 6.5, 3.8, 'Time Logging — Weekly View', [
    'Week: 21 Apr – 27 Apr 2026       Total: 34.5h / 40h target',
    '',
    'Mon    Tue    Wed    Thu    Fri',
    ' 8h     7h     6.5h    7h    6h',
    '',
    'ProjectFlow Platform  ██████████████   22h',
    'API Platform v3       ████████         12.5h',
    '',
    'Status: Draft   [Submit for Approval]',
  ]);

  featureCard(s, 7.1,  1.4,  2.9, 1.85, 'Log Time',    ['Log against any task or project', 'Date picker + description', '18 time log entries seeded', 'Edit / delete own entries'], C.accent);
  featureCard(s, 10.2, 1.4,  2.9, 1.85, 'Timesheets',  ['Weekly view with breakdown', 'Submit to manager for approval', 'Track approval status', 'Manager approve / reject with note'], C.orange);
  featureCard(s, 7.1,  3.42, 2.9, 1.78, 'Reports',     ['By-day and by-project view', 'Org-wide time summary', 'Utilization trends over time', 'Export to CSV / Excel'], C.green);
  featureCard(s, 10.2, 3.42, 2.9, 1.78, 'Management',  ['Admin sees all timesheets', 'Approve / reject in bulk', 'Compare estimated vs. logged', 'Capacity planning integration'], C.purple);

  statBox(s, 0.4,  5.42, '40h',  'Weekly Target',     C.accent);
  statBox(s, 3.15, 5.42, '18',   'Time Logs Seeded',  C.green);
  statBox(s, 5.9,  5.42, '86%',  'Utilization',       C.orange);
  statBox(s, 8.65, 5.42, '4',    'Pending Approvals', 'DC2626');
}

// ════════════════════════════════════════════════════════
// SLIDE 13 — ATTENDANCE TRACKING  ◄ NEW
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Attendance Tracking', 'Clock in/out, leave management, and team attendance view');
  footer(s, 13);

  // Today tab panel
  s.addText('Today Tab — Live Clock & Status', { x: 0.4, y: 1.35, w: 5.5, h: 0.3, fontSize: 11, bold: true, color: C.primary, fontFace: 'Calibri' });
  s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 1.72, w: 5.9, h: 4.95, fill: C.white, line: { color: 'E2E8F0', width: 1.5 }, rectRadius: 0.12, shadow: { type: 'outer', blur: 8, offset: 2, angle: 45, color: '000000', opacity: 0.09 } });

  // Live clock display
  s.addShape(pptx.ShapeType.roundRect, { x: 1.2, y: 1.92, w: 3.2, h: 0.88, fill: { color: C.primary }, rectRadius: 0.1 });
  s.addText('09:42:17 AM', { x: 1.2, y: 1.98, w: 3.2, h: 0.56, fontSize: 22, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
  s.addText('Wednesday, 30 April 2026', { x: 1.2, y: 2.52, w: 3.2, h: 0.22, fontSize: 8, color: 'BFD3E8', align: 'center', fontFace: 'Calibri' });

  // Clock In button
  s.addShape(pptx.ShapeType.roundRect, { x: 1.0, y: 2.95, w: 3.6, h: 0.58, fill: { color: C.green }, rectRadius: 0.1 });
  s.addText('▶  Clock In', { x: 1.0, y: 3.1, w: 3.6, h: 0.3, fontSize: 13, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });

  // Today summary
  const todaySummary = [['Clock In', '09:00 AM'], ['Status', '● Present'], ['Hours', '0h 42m'], ['Leave Balance', '']];
  todaySummary.forEach(([lbl, val], i) => {
    s.addText(lbl + ':',  { x: 0.6, y: 3.72 + i * 0.46, w: 1.5, h: 0.3, fontSize: 9, color: C.midGray, fontFace: 'Calibri' });
    s.addText(val,        { x: 2.1, y: 3.72 + i * 0.46, w: 3.9, h: 0.3, fontSize: 9, bold: true, color: lbl === 'Status' ? C.green : C.darkText, fontFace: 'Calibri' });
  });

  // Leave balance bars
  [['Sick', 8, 10, 'EF4444'], ['Casual', 10, 12, 'F59E0B'], ['Earned', 15, 15, C.green]].forEach(([type, used, total, color], i) => {
    const bw = 3.4 * (used / total);
    s.addText(type, { x: 0.6, y: 5.52 + i * 0.46, w: 0.8, h: 0.26, fontSize: 8.5, color: C.bodyText, fontFace: 'Calibri' });
    s.addShape(pptx.ShapeType.roundRect, { x: 1.5, y: 5.56 + i * 0.46, w: 3.4, h: 0.18, fill: { color: 'E2E8F0' }, rectRadius: 0.06 });
    s.addShape(pptx.ShapeType.roundRect, { x: 1.5, y: 5.56 + i * 0.46, w: bw,  h: 0.18, fill: { color }, rectRadius: 0.06 });
    s.addText(`${used}/${total}`, { x: 5.0, y: 5.52 + i * 0.46, w: 0.85, h: 0.26, fontSize: 8, color: C.midGray, fontFace: 'Calibri' });
  });

  // Team view panel
  s.addText('Team View Tab — Manager View', { x: 6.6, y: 1.35, w: 6.5, h: 0.3, fontSize: 11, bold: true, color: C.primary, fontFace: 'Calibri' });
  mockScreen(s, 6.6, 1.72, 6.5, 4.95, 'Team Attendance — 30 Apr 2026', [
    '👤  Priya Sharma       ● Present     Clocked In: 08:48 AM',
    '👤  Vikram Mehta       ● Present     Clocked In: 09:05 AM',
    '👤  Anjali Singh       ● Present     Clocked In: 08:55 AM',
    '👤  Ravi Kumar         ⌂  WFH        Marked WFH',
    '👤  Sunita Reddy       ✈  On Leave   Sick Leave',
    '─ ─ ─ ─ ─ ─ ─ TEAM STATS ─ ─ ─ ─ ─ ─ ─',
    '✅  Present: 3   ⌂ WFH: 1   ✈ Leave: 1   ✗ Absent: 0',
    '30-day history seeded for all 5 users   •   Leave balance tracked',
  ]);

  // Feature cards
  featureCard(s, 0.4,  6.85, 2.9, 0.7, 'Leave Request',   ['Sick / Casual / Earned / WFH / Half-day', 'Date picker + reason', 'Leave history log'], C.orange);
  featureCard(s, 3.5,  6.85, 2.9, 0.7, 'Monthly Calendar',['Color-coded status per day', 'Month navigator', 'Attendance stats row'], C.purple);
  featureCard(s, 6.6,  6.85, 2.9, 0.7, 'Weekly Grid',     ['7-day status grid', 'Hours worked per day', 'Week navigation arrows'], C.accent);
  featureCard(s, 9.7,  6.85, 2.9, 0.7, 'Data Store',      ['Zustand persist store', '30-day seeded history', 'API-ready architecture'], C.green);
}

// ════════════════════════════════════════════════════════
// SLIDE 14 — GANTT, FEATURE FLAGS & ONBOARDING  ◄ NEW
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Gantt Timeline & Feature Configuration', 'Visual project timeline, role-based feature flags');
  footer(s, 14);

  // Gantt chart mock
  s.addText('Gantt Timeline View', { x: 0.4, y: 1.35, w: 7.5, h: 0.3, fontSize: 11, bold: true, color: C.primary, fontFace: 'Calibri' });
  s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 1.72, w: 7.8, h: 4.62, fill: C.white, line: { color: 'E2E8F0', width: 1.5 }, rectRadius: 0.12, shadow: { type: 'outer', blur: 8, offset: 2, angle: 45, color: '000000', opacity: 0.09 } });

  // Gantt header row
  s.addShape(pptx.ShapeType.rect, { x: 0.4, y: 1.72, w: 7.8, h: 0.36, fill: { color: C.primary } });
  s.addText('Task', { x: 0.55, y: 1.79, w: 1.8, h: 0.24, fontSize: 8.5, bold: true, color: C.white, fontFace: 'Calibri' });
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  months.forEach((m, i) => s.addText(m, { x: 2.5 + i * 0.9, y: 1.79, w: 0.88, h: 0.24, fontSize: 8.5, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' }));

  // Task rows with bars
  const ganttTasks = [
    { name: 'Design nav component',  start: 0.0, width: 0.9,  color: C.orange,  priority: 'HIGH' },
    { name: 'Implement auth flow',   start: 0.5, width: 1.2,  color: 'DC2626',  priority: 'CRIT' },
    { name: 'CI/CD pipeline',        start: 0.3, width: 0.8,  color: C.green,   priority: 'HIGH' },
    { name: 'OpenAPI specification', start: 0.1, width: 1.4,  color: C.accent,  priority: 'HIGH' },
    { name: 'Mobile – Auth screens', start: 0.6, width: 1.0,  color: C.purple,  priority: 'HIGH' },
    { name: 'Q2 Lead Campaign',      start: 0.0, width: 2.6,  color: C.green,   priority: 'MED'  },
    { name: 'Annual Review 2026',    start: 0.0, width: 1.8,  color: C.orange,  priority: 'CRIT' },
  ];
  ganttTasks.forEach((t, i) => {
    const ry = 2.12 + i * 0.48;
    s.addShape(pptx.ShapeType.rect, { x: 0.4, y: ry, w: 7.8, h: 0.46, fill: { color: i % 2 === 0 ? C.white : 'F8FAFC' } });
    s.addText(t.name, { x: 0.55, y: ry + 0.12, w: 1.85, h: 0.26, fontSize: 8, color: C.darkText, fontFace: 'Calibri' });
    const barX = 2.5 + t.start * 0.9;
    const barW = t.width * 0.9;
    s.addShape(pptx.ShapeType.roundRect, { x: barX, y: ry + 0.1, w: barW, h: 0.28, fill: { color: t.color }, rectRadius: 0.05 });
    s.addShape(pptx.ShapeType.roundRect, { x: 0.46, y: ry + 0.12, w: 0.38, h: 0.22, fill: { color: 'F1F5F9' }, rectRadius: 0.04 });
    s.addText(t.priority, { x: 0.46, y: ry + 0.14, w: 0.38, h: 0.18, fontSize: 5.5, bold: true, color: t.color, align: 'center', fontFace: 'Calibri' });
  });

  // Today line
  s.addShape(pptx.ShapeType.rect, { x: 3.32, y: 1.72, w: 0.03, h: 4.62, fill: { color: 'EF4444' } });
  s.addText('Today', { x: 3.18, y: 6.24, w: 0.65, h: 0.22, fontSize: 7, bold: true, color: 'EF4444', fontFace: 'Calibri' });

  // Zoom badges
  ['Day', 'Week', 'Month'].forEach((z, i) => {
    const isActive = z === 'Week';
    s.addShape(pptx.ShapeType.roundRect, { x: 7.0 + i * 0.7, y: 6.36, w: 0.62, h: 0.24, fill: { color: isActive ? C.accent : C.lightGray }, rectRadius: 0.06 });
    s.addText(z, { x: 7.0 + i * 0.7, y: 6.39, w: 0.62, h: 0.18, fontSize: 7.5, bold: isActive, color: isActive ? C.white : C.midGray, align: 'center', fontFace: 'Calibri' });
  });

  // Feature Flags panel
  s.addText('Feature Flags — Role Configuration', { x: 8.4, y: 1.35, w: 4.8, h: 0.3, fontSize: 11, bold: true, color: C.primary, fontFace: 'Calibri' });
  s.addShape(pptx.ShapeType.roundRect, { x: 8.4, y: 1.72, w: 4.7, h: 4.62, fill: C.white, line: { color: 'E2E8F0', width: 1.5 }, rectRadius: 0.12, shadow: { type: 'outer', blur: 8, offset: 2, angle: 45, color: '000000', opacity: 0.09 } });

  // Header row
  s.addShape(pptx.ShapeType.rect, { x: 8.4, y: 1.72, w: 4.7, h: 0.36, fill: { color: C.primary } });
  s.addText('Feature', { x: 8.55, y: 1.79, w: 1.4, h: 0.24, fontSize: 8, bold: true, color: C.white, fontFace: 'Calibri' });
  ['Admin', 'PM', 'Mbr', 'Exec'].forEach((role, i) => {
    s.addText(role, { x: 10.1 + i * 0.73, y: 1.79, w: 0.7, h: 0.24, fontSize: 7.5, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
  });

  const flagRows = [
    { name: 'Kanban Board',     flags: [true, true, true, false] },
    { name: 'Gantt Timeline',   flags: [true, true, false, false] },
    { name: 'Attendance',       flags: [true, true, true, false] },
    { name: 'Reports',          flags: [true, true, false, false] },
    { name: 'AI Features',      flags: [true, true, false, false] },
    { name: 'Audit Log',        flags: [true, false, false, false] },
    { name: 'Executive View',   flags: [true, false, false, true] },
    { name: 'Feature Flags',    flags: [true, false, false, false] },
  ];
  flagRows.forEach((row, ri) => {
    const ry = 2.12 + ri * 0.48;
    s.addShape(pptx.ShapeType.rect, { x: 8.4, y: ry, w: 4.7, h: 0.46, fill: { color: ri % 2 === 0 ? C.white : 'F8FAFC' } });
    s.addText(row.name, { x: 8.55, y: ry + 0.12, w: 1.5, h: 0.26, fontSize: 8, color: C.darkText, fontFace: 'Calibri' });
    row.flags.forEach((enabled, fi) => {
      const cx = 10.22 + fi * 0.73, cy = ry + 0.13;
      s.addShape(pptx.ShapeType.ellipse, { x: cx, y: cy, w: 0.22, h: 0.22, fill: { color: enabled ? C.green : 'CBD5E1' } });
      s.addText(enabled ? '✓' : '✗', { x: cx, y: cy + 0.02, w: 0.22, h: 0.18, fontSize: 7, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
    });
  });
  s.addText('Org Admin always has full access to all features', { x: 8.55, y: 6.18, w: 4.4, h: 0.24, fontSize: 7.5, color: C.midGray, italic: true, fontFace: 'Calibri' });

  // Feature summary bar
  s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 7.1, w: 12.5, h: 0.3, fill: { color: 'F0F9FF' }, rectRadius: 0 });
  s.addText('Gantt: Day/Week/Month zoom · Today-line · Priority-colored bars   |   Feature Flags: 24 flags · 4 categories · Toggle per role · Auto-save · Reset to defaults', {
    x: 0.55, y: 7.12, w: 12.2, h: 0.24, fontSize: 7.5, color: '0369A1', fontFace: 'Calibri',
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 15 — PORTFOLIO & CAPACITY
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Portfolio & Capacity Planning', 'Executive visibility into project health and team utilization');
  footer(s, 15);

  s.addText('Portfolio Health Dashboard', { x: 0.4, y: 1.38, w: 6.5, h: 0.3, fontSize: 12, bold: true, color: C.primary, fontFace: 'Calibri' });
  ['Project', 'Progress', 'Health', 'Status'].forEach((h, i) => {
    s.addShape(pptx.ShapeType.rect, { x: 0.4 + i * 1.55, y: 1.75, w: 1.5, h: 0.35, fill: { color: C.primary } });
    s.addText(h, { x: 0.45 + i * 1.55, y: 1.82, w: 1.45, h: 0.22, fontSize: 9, bold: true, color: C.white, fontFace: 'Calibri' });
  });

  [
    ['ProjectFlow Platform', '65%', '78', 'On Track'],
    ['API Platform v3',      '42%', '62', 'At Risk'],
    ['Q2 Lead Campaign',     '75%', '85', 'On Track'],
    ['Annual Review 2026',   '90%', '93', 'On Track'],
    ['Mobile App v2',        '28%', '70', 'On Track'],
  ].forEach((row, ri) => {
    const bg = ri % 2 === 0 ? C.white : 'F8FAFC';
    s.addShape(pptx.ShapeType.rect, { x: 0.4, y: 2.1 + ri * 0.52, w: 6.2, h: 0.5, fill: { color: bg } });
    row.forEach((cell, ci) => {
      if (ci === 2) {
        const hColor = parseInt(cell) >= 80 ? C.green : parseInt(cell) >= 65 ? C.orange : 'DC2626';
        s.addShape(pptx.ShapeType.roundRect, { x: 0.45 + ci * 1.55, y: 2.17 + ri * 0.52, w: 0.5, h: 0.3, fill: { color: hColor }, rectRadius: 0.06 });
        s.addText(cell, { x: 0.45 + ci * 1.55, y: 2.22 + ri * 0.52, w: 0.5, h: 0.22, fontSize: 9, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
      } else {
        s.addText(cell, { x: 0.45 + ci * 1.55, y: 2.18 + ri * 0.52, w: 1.45, h: 0.3, fontSize: 9, color: C.darkText, fontFace: 'Calibri' });
      }
    });
  });
  s.addText('Health = 40% Progress + 30% Budget Efficiency + 30% Blocked Task Penalty', { x: 0.4, y: 4.82, w: 6.2, h: 0.3, fontSize: 8, color: C.midGray, italic: true, fontFace: 'Calibri' });

  // Capacity heatmap
  s.addText('Capacity Planning — Utilization Heatmap', { x: 7.0, y: 1.38, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: C.primary, fontFace: 'Calibri' });
  const members = ['Ravi Kumar', 'Anjali Singh', 'Vikram Mehta'];
  const weeks   = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];
  const utilData = [[45, 80, 95, 60], [70, 85, 110, 75], [30, 55, 70, 40]];
  const heatColor = (v) => v < 50 ? C.accent : v < 80 ? C.green : v < 100 ? C.orange : 'DC2626';

  weeks.forEach((w, wi) => s.addText(w, { x: 8.2 + wi * 1.4, y: 1.78, w: 1.2, h: 0.28, fontSize: 9, bold: true, color: C.darkText, align: 'center', fontFace: 'Calibri' }));
  members.forEach((m, mi) => {
    s.addText(m, { x: 7.05, y: 2.18 + mi * 0.72, w: 1.1, h: 0.5, fontSize: 8.5, color: C.darkText, fontFace: 'Calibri', valign: 'middle' });
    utilData[mi].forEach((val, wi) => {
      s.addShape(pptx.ShapeType.roundRect, { x: 8.2 + wi * 1.4, y: 2.18 + mi * 0.72, w: 1.2, h: 0.5, fill: { color: heatColor(val) }, rectRadius: 0.06 });
      s.addText(val + '%', { x: 8.2 + wi * 1.4, y: 2.3 + mi * 0.72, w: 1.2, h: 0.3, fontSize: 10, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
    });
  });
  [['< 50%', C.accent, 'Under'], ['50–80%', C.green, 'Optimal'], ['80–100%', C.orange, 'High'], ['> 100%', 'DC2626', 'Over']].forEach(([lbl, color], i) => {
    s.addShape(pptx.ShapeType.roundRect, { x: 7.05 + i * 1.5, y: 4.62, w: 1.3, h: 0.5, fill: { color }, rectRadius: 0.06 });
    s.addText(lbl, { x: 7.05 + i * 1.5, y: 4.7, w: 1.3, h: 0.36, fontSize: 9, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
  });

  featureCard(s, 0.4,  5.28, 3.0, 1.5, 'Portfolio',  ['5 projects in one health view', 'Budget vs. actual tracking', 'Filter by division or status', 'Drill-down per project'], C.orange);
  featureCard(s, 3.6,  5.28, 3.0, 1.5, 'Capacity',   ['2 / 4 / 8 week view toggle', 'Per-member workload cards', 'Over-utilization alerts', 'Team allocation planning'], C.accent);
  featureCard(s, 7.0,  5.28, 3.0, 1.5, 'Planning',   ['Upcoming sprint capacity check', 'Cross-project member allocation', 'Availability vs. demand view', 'Exportable capacity reports'], C.green);
  featureCard(s, 10.2, 5.28, 3.0, 1.5, 'Roadmap',    ['Visual project roadmap view', 'Milestone tracking', 'Dependency highlights', 'Executive-ready summary'], C.purple);
}

// ════════════════════════════════════════════════════════
// SLIDE 16 — EXECUTIVE DASHBOARD
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Executive Dashboard & OKRs', 'Strategic visibility for leadership');
  footer(s, 16);

  statBox(s, 0.4,  1.4, '5',    'Active Divisions',  C.primary);
  statBox(s, 3.15, 1.4, '92%',  'OKR Progress',      C.green);
  statBox(s, 5.9,  1.4, '₹80L', 'Total Budget',      C.purple);
  statBox(s, 8.65, 1.4, '20',   'Tasks Seeded',      C.accent);

  featureCard(s, 0.4,  2.9,  3.8, 2.0, 'OKR Dashboard',       ['Company & division-level OKRs', 'Key Results with % progress', 'Q1–Q4 quarterly view', 'Inline KR update by manager'], C.primary);
  featureCard(s, 4.4,  2.9,  3.8, 2.0, 'Division Scorecards', ['Health: Green / Amber / Red', 'Completion %, overdue tasks', 'Budget utilization bars', 'Trend vs. previous period'], C.accent);
  featureCard(s, 8.4,  2.9,  3.8, 2.0, 'Resource Dashboard',  ['Team size per division', 'Billable vs non-billable hours', 'Capacity vs. demand', 'Exportable reports'], C.green);
  featureCard(s, 0.4,  5.08, 3.8, 1.7, 'Executive Rollup',   ['Org-wide KPI summary', 'Alerts for at-risk divisions', 'Velocity trends', 'Budget comparison chart'], C.orange);
  featureCard(s, 4.4,  5.08, 3.8, 1.7, 'Portfolio View',     ['All 5 projects in one view', 'Filter by division / status', 'Health matrix at a glance', 'Drill-down per project'], C.purple);
  featureCard(s, 8.4,  5.08, 3.8, 1.7, 'Access Control',     ['Executive role = read-only', 'No accidental modifications', 'PDF / CSV export options', 'Share reports externally'], '475569');
}

// ════════════════════════════════════════════════════════
// SLIDE 17 — PLATFORM FEATURES
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Platform-Wide Features', 'Search, notifications, exports, AI, integrations & more');
  footer(s, 17);

  featureCard(s, 0.4,  1.45, 2.9, 2.2, 'Global Search',       ['Search tasks & projects instantly', 'Results in < 200ms', 'Filter by type (task/project)', 'Keyboard shortcut: ⌘K'], C.accent);
  featureCard(s, 3.5,  1.45, 2.9, 2.2, 'Notifications',       ['8 seeded notification samples', 'Mark individual / all as read', 'Delete notifications', 'Auto-polls every 30 seconds'], C.orange);
  featureCard(s, 6.6,  1.45, 2.9, 2.2, 'Exports',             ['CSV / Excel / PDF export', 'Export tasks and project summaries', 'Filter before export', 'Download history'], C.green);
  featureCard(s, 9.7,  1.45, 2.9, 2.2, 'AI Assistant',        ['Powered by Claude (Anthropic)', 'Task description suggestions', 'Sprint goal recommendations', 'Status report drafting'], C.purple);

  featureCard(s, 0.4,  3.85, 2.9, 2.2, 'Calendar View',       ['Tasks plotted by due date', 'Monthly / weekly calendar', 'Click task to open detail', 'Color-coded by project'], C.primary);
  featureCard(s, 3.5,  3.85, 2.9, 2.2, 'Feature Flags',       ['24 flags across 4 categories', 'Toggle access per role', 'Org Admin always has full access', 'Auto-save + reset to defaults'], C.accent);
  featureCard(s, 6.6,  3.85, 2.9, 2.2, 'Custom Roles',        ['4 custom roles seeded', 'Define granular permission sets', 'Assign to org members', 'Tech Lead / Auditor / Contractor'], C.orange);
  featureCard(s, 9.7,  3.85, 2.9, 2.2, 'MS 365 Integration',  ['Outlook calendar sync', 'Teams notification support', 'Azure AD authentication (prod)', 'OneDrive attachment storage'], C.green);

  s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 6.28, w: 12.5, h: 0.5, fill: { color: 'F0F9FF' }, line: { color: 'BAE6FD', width: 1 }, rectRadius: 0.08 });
  s.addText('🔒  Enterprise Security:   JWT auth · Refresh token rotation · Rate limiting (100 req/min) · Helmet.js headers · CORS whitelisting · bcrypt password hashing · HTTPS (prod)', {
    x: 0.55, y: 6.36, w: 12.2, h: 0.3, fontSize: 8.5, color: '0369A1', fontFace: 'Calibri',
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 18 — TECHNICAL ARCHITECTURE
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Technical Architecture', 'Modern, scalable full-stack architecture');
  footer(s, 18);

  const stack = [
    { layer: 'Frontend',  color: C.accent,  items: ['React 18 + TypeScript', 'TanStack Query v5 (103 hooks)', 'Tailwind CSS + shadcn/ui', 'Zustand persist stores', 'Vite + React Router v6'] },
    { layer: 'Backend',   color: C.primary, items: ['Node.js + Express 5', 'In-memory stores (dev mode)', 'Prisma ORM → PostgreSQL', 'JWT + Refresh Token rotation', 'Zod request validation'] },
    { layer: 'Data',      color: C.green,   items: ['PostgreSQL 16 (prod)', 'Redis (caching & queues)', 'BullMQ job queues', 'Comprehensive seed.js', '28 Prisma models'] },
    { layer: 'Security',  color: C.purple,  items: ['Helmet.js security headers', 'CORS origin whitelisting', 'Rate limiting (100/min)', 'bcrypt password hashing', 'HTTPS + Secure cookies'] },
  ];

  stack.forEach((st, i) => {
    const x = 0.4 + i * 3.2;
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.42, w: 2.95, h: 4.2, fill: { color: C.lightGray }, rectRadius: 0.12 });
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.42, w: 2.95, h: 0.5,  fill: { color: st.color }, rectRadius: 0.12 });
    s.addShape(pptx.ShapeType.rect,      { x, y: 1.72, w: 2.95, h: 0.22, fill: { color: st.color } });
    s.addText(st.layer, { x: x + 0.12, y: 1.52, w: 2.7, h: 0.32, fontSize: 13, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
    st.items.forEach((item, ii) => {
      s.addShape(pptx.ShapeType.roundRect, { x: x + 0.15, y: 2.06 + ii * 0.66, w: 2.65, h: 0.5, fill: C.white, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.07 });
      s.addText(item, { x: x + 0.28, y: 2.16 + ii * 0.66, w: 2.4, h: 0.3, fontSize: 9.5, color: C.darkText, fontFace: 'Calibri' });
    });
  });

  s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 5.82, w: 12.5, h: 0.88, fill: { color: 'F0FDF4' }, line: { color: 'BBF7D0', width: 1 }, rectRadius: 0.1 });
  s.addText('✅  Current Status:', { x: 0.6, y: 5.9, w: 2.0, h: 0.3, fontSize: 10, bold: true, color: '166534', fontFace: 'Calibri' });
  s.addText('All 20 modules are fully functional in development mode. Comprehensive seed data seeded (20 tasks, 5 projects, 10 sprints, 4 workflow types, 18 time logs, 4 approvals, 8 activity logs). Production deployment requires running database migration via Prisma and Redis configuration — codebase is fully production-ready.', {
    x: 2.7, y: 5.88, w: 9.8, h: 0.6, fontSize: 9, color: '166534', fontFace: 'Calibri',
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 19 — ROADMAP
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Roadmap & Next Steps', 'Phased delivery plan — 3 phases complete');
  footer(s, 19);

  const phases = [
    {
      phase: 'Phase 1', label: 'COMPLETE ✅', color: C.green, date: 'Jan – Mar 2026',
      items: ['Authentication & user management', 'Project & task CRUD', 'Kanban board with drag-drop', 'Sprint management (10 sprints)', 'Division management hierarchy', 'Custom workflows & approval chains'],
    },
    {
      phase: 'Phase 2', label: 'COMPLETE ✅', color: C.accent, date: 'Mar – Apr 2026',
      items: ['Time tracking & timesheets', 'Portfolio health dashboard', 'Capacity planning heatmap', 'Executive OKR dashboard', 'Global search & notifications', 'Custom roles, exports, AI features'],
    },
    {
      phase: 'Phase 3', label: 'COMPLETE ✅', color: C.teal, date: 'Apr 2026',
      items: ['Attendance tracking with live clock', 'Gantt timeline (Day/Week/Month zoom)', '24 feature flags + role configuration', 'Onboarding wizard (5-step)', 'Comprehensive seed data (all modules)', 'Test suite (utils, StatCard, Button, Modal)'],
    },
    {
      phase: 'Phase 4', label: 'IN PROGRESS 🔄', color: C.orange, date: 'May – Jul 2026',
      items: ['Production PostgreSQL DB migration', 'Live Gmail / SMTP email delivery', 'MS 365 / Azure AD SSO integration', 'Security audit & penetration testing', 'Performance optimization + CDN', 'Native mobile app (React Native)'],
    },
  ];

  phases.forEach((ph, i) => {
    const x = 0.4 + i * 3.25;
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.38, w: 3.0, h: 5.5, fill: C.white, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.12, shadow: { type: 'outer', blur: 5, offset: 2, angle: 45, color: '000000', opacity: 0.07 } });
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.38, w: 3.0, h: 0.65, fill: { color: ph.color }, rectRadius: 0.12 });
    s.addShape(pptx.ShapeType.rect,      { x, y: 1.72, w: 3.0, h: 0.3,  fill: { color: ph.color } });
    s.addText(ph.phase, { x: x + 0.12, y: 1.44, w: 2.76, h: 0.32, fontSize: 13, bold: true, color: C.white, fontFace: 'Calibri' });
    s.addText(ph.date,  { x: x + 0.12, y: 1.77, w: 2.76, h: 0.22, fontSize: 8,  color: 'D1FAE5', fontFace: 'Calibri', italic: true });
    const labelBg = { [C.green]: 'D1FAE5', [C.accent]: 'DBEAFE', [C.teal]: 'CFFAFE', [C.orange]: 'FEF3C7' }[ph.color] || 'F1F5F9';
    const labelTx = { [C.green]: C.green, [C.accent]: C.accent, [C.teal]: '0E7490', [C.orange]: C.orange }[ph.color] || C.midGray;
    s.addShape(pptx.ShapeType.roundRect, { x: x + 0.12, y: 2.12, w: 2.76, h: 0.3, fill: { color: labelBg }, rectRadius: 0.06 });
    s.addText(ph.label, { x: x + 0.12, y: 2.18, w: 2.76, h: 0.2, fontSize: 8.5, bold: true, color: labelTx, align: 'center', fontFace: 'Calibri' });
    ph.items.forEach((item, ii) => {
      s.addText('• ' + item, { x: x + 0.18, y: 2.58 + ii * 0.66, w: 2.7, h: 0.55, fontSize: 9, color: C.bodyText, fontFace: 'Calibri', valign: 'top' });
    });
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 20 — THANK YOU
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: C.primary } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 5.2, w: '100%', h: 2.3,  fill: { color: '152B47' } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 2.55, w: 0.18, h: 2.2,   fill: { color: C.accent } });

  s.addText('Thank You', { x: 0.5, y: 1.4, w: 9, h: 1.2, fontSize: 48, bold: true, color: C.white, fontFace: 'Calibri' });
  s.addText('Questions & Discussion', { x: 0.5, y: 2.7, w: 7, h: 0.55, fontSize: 18, color: 'BFD3E8', fontFace: 'Calibri' });
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 3.35, w: 4, h: 0.04, fill: { color: C.accent } });

  ['priyanka.bansal@qcin.org', 'Quality Council of India', 'Enterprise PM Tool — v2.0  |  April 30, 2026'].forEach((line, i) => {
    s.addText(line, { x: 0.5, y: 3.55 + i * 0.48, w: 9, h: 0.38, fontSize: 13, color: i === 0 ? C.accent : 'BFD3E8', fontFace: 'Calibri' });
  });

  // Feature tiles
  const tiles = ['Dashboard', 'Projects', 'Kanban', 'Gantt', 'Sprints', 'Attendance', 'Portfolio', 'Capacity', 'OKRs', 'Feature Flags'];
  tiles.forEach((item, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    s.addShape(pptx.ShapeType.roundRect, { x: 9.8 + col * 1.8, y: 1.2 + row * 1.0, w: 1.6, h: 0.72, fill: { color: col === 0 ? C.accent : '2D5FA3' }, rectRadius: 0.1 });
    s.addText(item, { x: 9.8 + col * 1.8, y: 1.42 + row * 1.0, w: 1.6, h: 0.3, fontSize: col === 0 ? 9.5 : 9, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
  });
}

// ─── Save ────────────────────────────────────────────────
const outPath = path.join(__dirname, 'PM_Tool_Presentation.pptx');
pptx.writeFile({ fileName: outPath })
  .then(() => console.log(`\n✅  Presentation saved → ${outPath}\n    20 slides  |  v2.0  |  30 April 2026\n`))
  .catch((err) => console.error('Error:', err));
