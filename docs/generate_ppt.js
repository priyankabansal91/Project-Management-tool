// Run: node docs/generate_ppt.js
// Output: docs/PM_Tool_Presentation.pptx

const PptxGenJS = require('pptxgenjs');
const path = require('path');

const pptx = new PptxGenJS();

// ─── Theme ───────────────────────────────────────────────
const C = {
  primary:    '1E3A5F',  // deep navy
  accent:     '3B82F6',  // blue
  green:      '10B981',
  orange:     'F59E0B',
  red:        'EF4444',
  purple:     '8B5CF6',
  white:      'FFFFFF',
  lightGray:  'F1F5F9',
  midGray:    '94A3B8',
  darkText:   '1E293B',
  bodyText:   '475569',
};

pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches
pptx.author  = 'Quality Council of India';
pptx.company = 'QCI';
pptx.subject = 'Enterprise PM Tool';
pptx.title   = 'Enterprise Project Management Tool';

// ─── Helper: add slide background ───────────────────────
function slideBg(slide, color = C.white) {
  slide.background = { color };
}

// ─── Helper: header band ────────────────────────────────
function headerBand(slide, title, subtitle = '', color = C.primary) {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.2, fill: { color } });
  slide.addText(title, { x: 0.4, y: 0.12, w: 10, h: 0.6, fontSize: 26, bold: true, color: C.white, fontFace: 'Calibri' });
  if (subtitle) {
    slide.addText(subtitle, { x: 0.4, y: 0.72, w: 10, h: 0.38, fontSize: 13, color: 'BFD3E8', fontFace: 'Calibri' });
  }
}

// ─── Helper: footer ─────────────────────────────────────
function footer(slide, pageNum) {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 7.1, w: '100%', h: 0.4, fill: { color: C.lightGray } });
  slide.addText('Quality Council of India — Enterprise PM Tool   |   Confidential', {
    x: 0.3, y: 7.12, w: 10, h: 0.28, fontSize: 8, color: C.midGray, fontFace: 'Calibri',
  });
  slide.addText(`${pageNum}`, {
    x: 12.8, y: 7.12, w: 0.4, h: 0.28, fontSize: 8, color: C.midGray, fontFace: 'Calibri', align: 'right',
  });
}

// ─── Helper: stat box ───────────────────────────────────
function statBox(slide, x, y, value, label, color) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.6, h: 1.3, fill: { color }, rectRadius: 0.12, shadow: { type: 'outer', blur: 6, offset: 2, angle: 45, color: '000000', opacity: 0.12 } });
  slide.addText(value, { x, y: y + 0.1, w: 2.6, h: 0.65, fontSize: 28, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
  slide.addText(label, { x, y: y + 0.72, w: 2.6, h: 0.42, fontSize: 11, color: 'DBEAFE', align: 'center', fontFace: 'Calibri' });
}

// ─── Helper: feature card ───────────────────────────────
function featureCard(slide, x, y, w, h, title, bullets, color = C.primary) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, fill: { color: C.white }, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.1, shadow: { type: 'outer', blur: 5, offset: 2, angle: 45, color: '000000', opacity: 0.08 } });
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.38, fill: { color }, rectRadius: 0.1, line: { color, width: 0 } });
  // bottom corners of title bar should be square
  slide.addShape(pptx.ShapeType.rect, { x, y: y + 0.2, w, h: 0.18, fill: { color }, line: { color, width: 0 } });
  slide.addText(title, { x: x + 0.15, y: y + 0.06, w: w - 0.3, h: 0.28, fontSize: 11, bold: true, color: C.white, fontFace: 'Calibri' });
  const rows = bullets.map(b => [{ text: '• ' + b, options: { fontSize: 9.5, color: C.bodyText, fontFace: 'Calibri' } }]);
  if (rows.length) {
    slide.addText(rows.map(r => r[0].text).join('\n'), {
      x: x + 0.15, y: y + 0.44, w: w - 0.3, h: h - 0.52,
      fontSize: 9.5, color: C.bodyText, fontFace: 'Calibri', valign: 'top',
    });
  }
}

// ─── Helper: role badge ─────────────────────────────────
function roleBadge(slide, x, y, role, color) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w: 2.1, h: 0.38, fill: { color }, rectRadius: 0.19 });
  slide.addText(role, { x, y: y + 0.04, w: 2.1, h: 0.3, fontSize: 10, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
}

// ─── Helper: mock screen box ────────────────────────────
function mockScreen(slide, x, y, w, h, title, items = []) {
  // browser chrome
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, fill: { color: C.white }, line: { color: 'CBD5E1', width: 1.5 }, rectRadius: 0.12, shadow: { type: 'outer', blur: 10, offset: 3, angle: 45, color: '000000', opacity: 0.14 } });
  slide.addShape(pptx.ShapeType.rect, { x, y, w, h: 0.32, fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', width: 0 } });
  // traffic lights
  slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.12, y: y + 0.1, w: 0.12, h: 0.12, fill: { color: 'FC5C57' } });
  slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.3,  y: y + 0.1, w: 0.12, h: 0.12, fill: { color: 'FDBC2C' } });
  slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.48, y: y + 0.1, w: 0.12, h: 0.12, fill: { color: '34C84A' } });
  // address bar
  slide.addShape(pptx.ShapeType.roundRect, { x: x + 0.7, y: y + 0.05, w: w - 1.0, h: 0.22, fill: { color: 'EEF2FF' }, rectRadius: 0.04 });
  slide.addText('localhost:5173 — PM Tool', { x: x + 0.75, y: y + 0.07, w: w - 1.1, h: 0.18, fontSize: 7, color: '6366F1' });
  // content title
  slide.addShape(pptx.ShapeType.rect, { x, y: y + 0.32, w, h: 0.36, fill: { color: C.primary } });
  slide.addText(title, { x: x + 0.15, y: y + 0.36, w: w - 0.3, h: 0.28, fontSize: 10, bold: true, color: C.white, fontFace: 'Calibri' });
  // rows
  items.forEach((item, i) => {
    const rowY = y + 0.72 + i * 0.36;
    if (rowY + 0.36 > y + h) return;
    slide.addShape(pptx.ShapeType.rect, { x, y: rowY, w, h: 0.36, fill: { color: i % 2 === 0 ? C.white : 'F8FAFC' } });
    slide.addText(item, { x: x + 0.18, y: rowY + 0.08, w: w - 0.3, h: 0.22, fontSize: 8.5, color: C.darkText, fontFace: 'Calibri' });
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 1 — TITLE
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  // full background gradient simulation
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: C.primary } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 4.5, w: '100%', h: 3.0, fill: { color: '152B47' } });
  // accent stripe
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 2.8, w: 0.18, h: 2.0, fill: { color: C.accent } });

  s.addText('Enterprise Project\nManagement Tool', {
    x: 0.5, y: 1.2, w: 8, h: 1.9,
    fontSize: 38, bold: true, color: C.white, fontFace: 'Calibri', lineSpacingMultiple: 1.2,
  });
  s.addText('A comprehensive SaaS platform for multi-division enterprise project delivery', {
    x: 0.5, y: 3.1, w: 8.5, h: 0.55,
    fontSize: 15, color: 'BFD3E8', fontFace: 'Calibri',
  });
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 3.72, w: 3.5, h: 0.04, fill: { color: C.accent } });
  s.addText('Quality Council of India', {
    x: 0.5, y: 3.85, w: 5, h: 0.4, fontSize: 14, bold: true, color: C.accent, fontFace: 'Calibri',
  });
  s.addText('April 2026   |   Confidential', {
    x: 0.5, y: 4.3, w: 5, h: 0.3, fontSize: 11, color: C.midGray, fontFace: 'Calibri',
  });

  // right side decoration — mock screen outline
  s.addShape(pptx.ShapeType.roundRect, { x: 9.2, y: 1.0, w: 3.8, h: 5.2, fill: { color: '253E5E' }, rectRadius: 0.2 });
  s.addShape(pptx.ShapeType.roundRect, { x: 9.4, y: 1.2, w: 3.4, h: 4.8, fill: { color: '1A2E44' }, rectRadius: 0.12 });
  ['Dashboard', 'Projects', 'Sprints', 'My Tasks', 'Portfolio', 'Capacity', 'Users', 'Divisions'].forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    s.addShape(pptx.ShapeType.roundRect, {
      x: 9.5 + col * 1.65, y: 1.4 + row * 1.1, w: 1.5, h: 0.85,
      fill: { color: col === 0 ? C.accent : '2D5FA3' }, rectRadius: 0.1,
    });
    s.addText(item, {
      x: 9.5 + col * 1.65, y: 1.56 + row * 1.1, w: 1.5, h: 0.55,
      fontSize: 9, bold: true, color: C.white, align: 'center', fontFace: 'Calibri',
    });
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
    ['01', 'Business Overview',        'Challenges addressed and system goals'],
    ['02', 'User Roles & Access',       '6-tier role-based access control'],
    ['03', 'Core PM Features',          'Projects, Kanban, Sprints, Tasks'],
    ['04', 'Team & Division Mgmt',      'User onboarding, divisions, permissions'],
    ['05', 'Workflow & Approvals',       'Custom workflows, approval chains'],
    ['06', 'Time Tracking',             'Timesheets, logging, approvals'],
    ['07', 'Portfolio & Capacity',      'Health scores, utilization heatmaps'],
    ['08', 'Executive Dashboard',       'OKRs, scorecards, resource view'],
    ['09', 'Platform Features',         'Search, notifications, exports, AI'],
    ['10', 'Roadmap & Next Steps',      'Upcoming features and deployment plan'],
  ];

  topics.forEach(([num, title, desc], i) => {
    const col = i < 5 ? 0 : 1;
    const row = i % 5;
    const x = col === 0 ? 0.4 : 6.8;
    const y = 1.4 + row * 1.0;

    s.addShape(pptx.ShapeType.roundRect, { x, y, w: 5.9, h: 0.82, fill: { color: C.lightGray }, rectRadius: 0.08 });
    s.addShape(pptx.ShapeType.roundRect, { x, y, w: 0.55, h: 0.82, fill: { color: C.accent }, rectRadius: 0.08 });
    s.addShape(pptx.ShapeType.rect,      { x: x + 0.36, y, w: 0.2, h: 0.82, fill: { color: C.accent } });
    s.addText(num, { x, y: y + 0.2, w: 0.55, h: 0.42, fontSize: 14, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
    s.addText(title, { x: x + 0.65, y: y + 0.08, w: 5.1, h: 0.32, fontSize: 12, bold: true, color: C.darkText, fontFace: 'Calibri' });
    s.addText(desc,  { x: x + 0.65, y: y + 0.42, w: 5.1, h: 0.28, fontSize: 9.5, color: C.bodyText, fontFace: 'Calibri' });
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

  // challenges
  s.addText('Challenges Addressed', { x: 0.4, y: 1.35, w: 5.8, h: 0.35, fontSize: 13, bold: true, color: C.primary, fontFace: 'Calibri' });
  const challenges = [
    '❌  Siloed project data across divisions with no unified view',
    '❌  Manual status tracking leading to missed deadlines',
    '❌  No visibility into team capacity and resource utilization',
    '❌  Disconnected approval workflows causing delays',
    '❌  No real-time portfolio health monitoring for leadership',
    '❌  Time tracking scattered across spreadsheets',
  ];
  challenges.forEach((c, i) => {
    s.addShape(pptx.ShapeType.rect, { x: 0.4, y: 1.78 + i * 0.6, w: 5.8, h: 0.48, fill: { color: i % 2 === 0 ? 'FFF1F2' : 'FEF2F2' } });
    s.addText(c, { x: 0.55, y: 1.85 + i * 0.6, w: 5.5, h: 0.34, fontSize: 10, color: '991B1B', fontFace: 'Calibri' });
  });

  // solutions
  s.addText('Our Solution', { x: 7.0, y: 1.35, w: 5.8, h: 0.35, fontSize: 13, bold: true, color: C.primary, fontFace: 'Calibri' });
  const solutions = [
    '✅  Single unified platform for all divisions and projects',
    '✅  Real-time Kanban boards with drag-and-drop task management',
    '✅  Capacity planning heatmaps and resource dashboards',
    '✅  Configurable approval chains with audit trails',
    '✅  Executive portfolio dashboard with health scores',
    '✅  Integrated time logging and timesheet approvals',
  ];
  solutions.forEach((c, i) => {
    s.addShape(pptx.ShapeType.rect, { x: 7.0, y: 1.78 + i * 0.6, w: 5.8, h: 0.48, fill: { color: i % 2 === 0 ? 'F0FDF4' : 'ECFDF5' } });
    s.addText(c, { x: 7.15, y: 1.85 + i * 0.6, w: 5.5, h: 0.34, fontSize: 10, color: '166534', fontFace: 'Calibri' });
  });
  // divider
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
    { role: 'Member',           color: '16A34A', desc: 'Works on assigned tasks, logs time, submits timesheets, participates in sprints, and adds comments.' },
    { role: 'Executive',        color: '7C3AED', desc: 'Read-only access to portfolio dashboards, OKR tracking, executive scorecards, and cross-division reports.' },
    { role: 'Viewer',           color: '475569', desc: 'Limited read-only access to specific projects they are granted visibility into. Cannot create or modify.' },
  ];

  roles.forEach((r, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
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

  // stat boxes
  statBox(s, 0.4,  1.45, '12',   'Active Projects',    C.accent);
  statBox(s, 3.15, 1.45, '148',  'Total Tasks',         C.green);
  statBox(s, 5.9,  1.45, '73%',  'Completion Rate',     C.purple);
  statBox(s, 8.65, 1.45, '7',    'Overdue Tasks',       'DC2626');

  // mock screen - recent activity
  mockScreen(s, 0.4, 3.0, 5.8, 3.6, 'Recent Activity', [
    '📋  Sprint 3 started — Sample Project',
    '✅  Task "Auth flow" marked Done by Ravi Kumar',
    '💬  New comment on "API Platform v3"',
    '👤  Anjali Singh invited Vikram Mehta',
    '📊  Timesheet submitted by Ravi Kumar',
    '🚀  Project "Q2 Lead Campaign" created',
  ]);

  // mock screen - my tasks
  mockScreen(s, 6.6, 3.0, 6.3, 3.6, 'My Tasks (Due Soon)', [
    '🔴 HIGH  — Design navigation component  (Due: May 10)',
    '🟡 MED   — API specification document  (Due: May 20)',
    '🔴 CRIT  — Implement auth flow         (Due: May 15)',
    '🟢 LOW   — Rate limiting middleware    (Due: Jun 01)',
  ]);

  s.addText('Navigation sidebar includes: Dashboard · Projects · Sprints · My Tasks · Time Logs · Calendar · Portfolio · Capacity Planning · Executive Dashboard · Admin modules', {
    x: 0.4, y: 6.62, w: 12.5, h: 0.35, fontSize: 8.5, color: C.midGray, italic: true, fontFace: 'Calibri',
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 6 — PROJECT MANAGEMENT
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Project Management', 'End-to-end project lifecycle management');
  footer(s, 6);

  // Kanban mock
  s.addText('Kanban Board', { x: 0.4, y: 1.32, w: 6, h: 0.32, fontSize: 12, bold: true, color: C.primary, fontFace: 'Calibri' });

  const columns = [
    { name: 'Backlog', color: '64748B', tasks: ['Create API spec', 'Setup DB schema'] },
    { name: 'To Do',   color: '3B82F6', tasks: ['Auth middleware', 'Rate limiting'] },
    { name: 'In Prog', color: 'F59E0B', tasks: ['Navigation UI', 'OpenAPI docs'] },
    { name: 'Done',    color: '10B981', tasks: ['CI/CD Pipeline'] },
  ];

  columns.forEach((col, ci) => {
    const x = 0.4 + ci * 3.1;
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.7, w: 2.85, h: 4.9, fill: { color: C.lightGray }, rectRadius: 0.1 });
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.7, w: 2.85, h: 0.38, fill: { color: col.color }, rectRadius: 0.1 });
    s.addShape(pptx.ShapeType.rect,      { x, y: 1.88, w: 2.85, h: 0.2, fill: { color: col.color } });
    s.addText(col.name, { x: x + 0.1, y: 1.75, w: 2.5, h: 0.28, fontSize: 10, bold: true, color: C.white, fontFace: 'Calibri' });
    col.tasks.forEach((task, ti) => {
      const ty = 2.2 + ti * 1.15;
      s.addShape(pptx.ShapeType.roundRect, { x: x + 0.12, y: ty, w: 2.6, h: 0.95, fill: { color: C.white }, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.08, shadow: { type: 'outer', blur: 3, offset: 1, angle: 45, color: '000000', opacity: 0.07 } });
      s.addText(task, { x: x + 0.22, y: ty + 0.1, w: 2.25, h: 0.35, fontSize: 9, bold: true, color: C.darkText, fontFace: 'Calibri' });
      s.addShape(pptx.ShapeType.roundRect, { x: x + 0.22, y: ty + 0.5, w: 0.65, h: 0.22, fill: { color: 'FEF9C3' }, rectRadius: 0.06 });
      s.addText('HIGH', { x: x + 0.22, y: ty + 0.52, w: 0.65, h: 0.18, fontSize: 7, bold: true, color: '854D0E', align: 'center', fontFace: 'Calibri' });
      s.addShape(pptx.ShapeType.ellipse, { x: x + 2.08, y: ty + 0.48, w: 0.26, h: 0.26, fill: { color: '3B82F6' } });
      s.addText('RK', { x: x + 2.08, y: ty + 0.52, w: 0.26, h: 0.18, fontSize: 7, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
    });
  });

  // features list on right
  s.addText('Key Features', { x: 12.8, y: 1.32, w: 0.01, h: 0.01, fontSize: 1, color: C.white }); // spacer
  const features = [
    '🎯  Drag-and-drop task cards across status columns',
    '➕  Create tasks inline within any column',
    '🏷️  Priority badges: Critical / High / Medium / Low',
    '👤  Assignee avatars on every task card',
    '⋮   Three-dot menu: View Details · Delete Task',
    '📊  Per-column task count and estimated hours',
    '🔍  Filter by status, assignee, priority, search',
    '📅  Project dates and progress tracking',
  ];
  s.addShape(pptx.ShapeType.roundRect, { x: 12.6, y: 1.7, w: 0.55, h: 4.9, fill: { color: C.lightGray }, rectRadius: 0.1 });
  // right panel
  s.addShape(pptx.ShapeType.roundRect, { x: 12.7, y: 1.7, w: 0.5, h: 4.9, fill: { color: C.lightGray }, rectRadius: 0.1 });

  // Actually put feature list below kanban
  s.addText(features.join('   '), {
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

  // active sprint banner mock
  s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 1.4, w: 12.5, h: 1.0, fill: { color: 'F0FDF4' }, line: { color: 'BBF7D0', width: 1 }, rectRadius: 0.1 });
  s.addShape(pptx.ShapeType.ellipse, { x: 0.65, y: 1.6, w: 0.6, h: 0.6, fill: { color: 'D1FAE5' } });
  s.addText('▶', { x: 0.65, y: 1.67, w: 0.6, h: 0.42, fontSize: 16, color: '059669', align: 'center' });
  s.addText('Sprint 2 — Active', { x: 1.4, y: 1.47, w: 5, h: 0.32, fontSize: 12, bold: true, color: C.darkText, fontFace: 'Calibri' });
  s.addText('Implement user authentication and dashboard', { x: 1.4, y: 1.8, w: 6, h: 0.28, fontSize: 9.5, color: C.bodyText, fontFace: 'Calibri' });
  [['4', 'Tasks'], ['36h', 'Estimated'], ['25%', 'Complete']].forEach(([val, lbl], i) => {
    s.addText(val, { x: 9.2 + i * 1.4, y: 1.48, w: 1.2, h: 0.38, fontSize: 18, bold: true, color: C.primary, align: 'center', fontFace: 'Calibri' });
    s.addText(lbl, { x: 9.2 + i * 1.4, y: 1.86, w: 1.2, h: 0.22, fontSize: 8, color: C.midGray, align: 'center', fontFace: 'Calibri' });
  });

  // sprint list
  s.addText('Sprint List', { x: 0.4, y: 2.58, w: 3.2, h: 0.3, fontSize: 11, bold: true, color: C.primary, fontFace: 'Calibri' });
  [
    { name: 'Sprint 1', status: 'completed', color: '3B82F6', tasks: 5 },
    { name: 'Sprint 2', status: 'active',    color: '10B981', tasks: 4 },
    { name: 'Sprint 3', status: 'planned',   color: '94A3B8', tasks: 0 },
  ].forEach((sp, i) => {
    s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 2.95 + i * 1.1, w: 3.5, h: 0.9, fill: C.white, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.08 });
    s.addShape(pptx.ShapeType.roundRect, { x: 3.66, y: 3.08 + i * 1.1, w: 0.7, h: 0.25, fill: { color: sp.color }, rectRadius: 0.08 });
    s.addText(sp.name, { x: 0.6, y: 3.02 + i * 1.1, w: 2.8, h: 0.28, fontSize: 11, bold: true, color: C.darkText, fontFace: 'Calibri' });
    s.addText(sp.status, { x: 3.68, y: 3.1 + i * 1.1, w: 0.66, h: 0.2, fontSize: 7.5, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
    s.addText(`${sp.tasks} tasks`, { x: 0.6, y: 3.34 + i * 1.1, w: 2, h: 0.22, fontSize: 9, color: C.midGray, fontFace: 'Calibri' });
  });

  // sprint detail
  s.addText('Sprint Tasks & Backlog', { x: 4.2, y: 2.58, w: 8.5, h: 0.3, fontSize: 11, bold: true, color: C.primary, fontFace: 'Calibri' });
  mockScreen(s, 4.2, 2.92, 8.7, 3.62, 'Sprint 2 — Tasks', [
    '🔴 CRITICAL  Implement authentication flow           • Ravi Kumar  • To Do    16h',
    '🟠 HIGH      Design new navigation component         • Anjali Singh • In Prog  8h',
    '🟠 HIGH      Set up CI/CD pipeline                   • Ravi Kumar  • Review   6h',
    '🟡 MEDIUM    Customer dashboard wireframes            • Anjali Singh • Done     4h',
    '─ ─ ─ ─ ─ ─ ─ ─ PRODUCT BACKLOG ─ ─ ─ ─ ─ ─ ─ ─',
    '⬜ MEDIUM    Define OpenAPI 3.1 specification  [+ Add to Sprint]',
    '⬜ MEDIUM    Implement rate limiting middleware [+ Add to Sprint]',
  ]);
}

// ════════════════════════════════════════════════════════
// SLIDE 8 — TASK MANAGEMENT
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Task Management', 'Detailed task tracking, comments & collaboration');
  footer(s, 8);

  // left: task detail panel mock
  s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 1.35, w: 6.2, h: 5.4, fill: C.white, line: { color: 'E2E8F0', width: 1.5 }, rectRadius: 0.12, shadow: { type: 'outer', blur: 8, offset: 2, angle: 45, color: '000000', opacity: 0.09 } });
  s.addShape(pptx.ShapeType.rect, { x: 0.4, y: 1.35, w: 6.2, h: 0.42, fill: { color: C.primary } });
  s.addShape(pptx.ShapeType.rect, { x: 0.4, y: 1.57, w: 6.2, h: 0.2, fill: { color: C.primary } });
  s.addText('SAMPLE-1   ·   Task Detail', { x: 0.6, y: 1.42, w: 5.8, h: 0.28, fontSize: 10, bold: true, color: C.white, fontFace: 'Calibri' });

  s.addText('Design new navigation component', { x: 0.6, y: 1.88, w: 5.8, h: 0.42, fontSize: 13, bold: true, color: C.darkText, fontFace: 'Calibri' });
  s.addText('Redesign the top navigation bar with improved UX and mobile support.', { x: 0.6, y: 2.38, w: 5.8, h: 0.42, fontSize: 9.5, color: C.bodyText, fontFace: 'Calibri' });

  const fields = [
    ['Status',    'In Progress'],
    ['Priority',  'High'],
    ['Assignee',  'Ravi Kumar'],
    ['Reporter',  'Anjali Singh'],
    ['Due Date',  '10 May 2026'],
    ['Est. Hours','8h'],
  ];
  fields.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const fx = 0.6 + col * 3.0;
    const fy = 2.9 + row * 0.55;
    s.addText(label + ':', { x: fx, y: fy, w: 1.1, h: 0.28, fontSize: 8.5, color: C.midGray, fontFace: 'Calibri' });
    s.addText(value,        { x: fx + 1.1, y: fy, w: 1.8, h: 0.28, fontSize: 9, bold: true, color: C.darkText, fontFace: 'Calibri' });
  });

  // comment section
  s.addShape(pptx.ShapeType.rect, { x: 0.4, y: 4.65, w: 6.2, h: 0.02, fill: { color: 'E2E8F0' } });
  s.addText('Comments (2)', { x: 0.6, y: 4.72, w: 3, h: 0.3, fontSize: 10, bold: true, color: C.darkText, fontFace: 'Calibri' });

  [
    { user: 'PM', name: 'Anjali Singh', text: 'Please test in Safari — there were animation issues.' },
    { user: 'RK', name: 'Ravi Kumar',   text: 'Safari issues fixed! Added Playwright cross-browser tests.' },
  ].forEach((c, i) => {
    const cy = 5.1 + i * 0.72;
    s.addShape(pptx.ShapeType.ellipse, { x: 0.6, y: cy, w: 0.32, h: 0.32, fill: { color: C.accent } });
    s.addText(c.user, { x: 0.6, y: cy + 0.06, w: 0.32, h: 0.2, fontSize: 7, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
    s.addText(c.name + ':', { x: 1.0, y: cy, w: 5.4, h: 0.22, fontSize: 8.5, bold: true, color: C.darkText, fontFace: 'Calibri' });
    s.addText(c.text, { x: 1.0, y: cy + 0.22, w: 5.4, h: 0.38, fontSize: 8.5, color: C.bodyText, fontFace: 'Calibri' });
  });

  // right: My Tasks + features
  s.addText('My Tasks Page', { x: 6.9, y: 1.35, w: 6.0, h: 0.32, fontSize: 12, bold: true, color: C.primary, fontFace: 'Calibri' });
  mockScreen(s, 6.9, 1.72, 6.0, 2.6, 'My Tasks — All Tasks', [
    '☐  SAMPLE-1  Design navigation component  HIGH   Due May 10',
    '☐  APIV3-1   OpenAPI specification         HIGH   Due May 20',
    '☐  SAMPLE-2  Implement auth flow          CRIT   Due May 15',
    '✅  SAMPLE-3  Dashboard wireframes         MED    Completed',
  ]);

  s.addText('Task Features', { x: 6.9, y: 4.5, w: 6.0, h: 0.32, fontSize: 11, bold: true, color: C.primary, fontFace: 'Calibri' });
  featureCard(s, 6.9, 4.85, 2.85, 1.9, 'My Tasks', [
    'All tasks assigned to you',
    'Filter: All / Open / Overdue / Done',
    'Bulk: Mark Done, Set Priority, Delete',
    'Search by title',
  ], C.accent);
  featureCard(s, 9.9, 4.85, 2.85, 1.9, 'Collaboration', [
    'Threaded comment system',
    'Reply to specific comments',
    'Edit & delete own comments',
    'PM can delete any comment',
  ], C.purple);
  featureCard(s, 12.2, 4.85, 0.7, 1.9, '', [], C.white);
}

// ════════════════════════════════════════════════════════
// SLIDE 9 — USER MANAGEMENT & ONBOARDING
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'User Management & Onboarding', 'Invite, manage, and control team access');
  footer(s, 9);

  // Active Members mock
  s.addText('Active Members', { x: 0.4, y: 1.35, w: 6.0, h: 0.32, fontSize: 12, bold: true, color: C.primary, fontFace: 'Calibri' });
  mockScreen(s, 0.4, 1.72, 6.4, 3.5, 'User Management — Active Members', [
    '👤 Priya Sharma      org admin      ● active   Joined Jan 2026',
    '👤 Vikram Mehta      div admin      ● active   Joined Jan 2026',
    '👤 Anjali Singh      proj manager   ● active   Joined Jan 2026',
    '👤 Ravi Kumar        member         ● active   Joined Jan 2026',
    '👤 Sunita Reddy      executive      ● active   Joined Jan 2026',
    '👤 Arjun Patel       viewer         ● active   Joined Feb 2026',
  ]);

  // Pending Invites mock
  s.addText('Pending Invites Tab', { x: 7.1, y: 1.35, w: 6.0, h: 0.32, fontSize: 12, bold: true, color: C.primary, fontFace: 'Calibri' });
  mockScreen(s, 7.1, 1.72, 6.0, 2.0, 'User Management — Pending Invites', [
    '📧 colleague@company.com   member   Sent Apr 23   Expires Apr 30',
    '📧 manager@partner.org     pm       Sent Apr 22   Expires Apr 29',
  ]);

  // Invite modal mock
  s.addShape(pptx.ShapeType.roundRect, { x: 7.1, y: 3.85, w: 6.0, h: 3.2, fill: C.white, line: { color: 'E2E8F0', width: 1.5 }, rectRadius: 0.12, shadow: { type: 'outer', blur: 10, offset: 3, angle: 45, color: '000000', opacity: 0.12 } });
  s.addText('Invite Team Member', { x: 7.3, y: 4.0, w: 5.5, h: 0.35, fontSize: 13, bold: true, color: C.darkText, fontFace: 'Calibri' });
  s.addText('Email Address *', { x: 7.3, y: 4.45, w: 4, h: 0.25, fontSize: 9, bold: true, color: C.darkText, fontFace: 'Calibri' });
  s.addShape(pptx.ShapeType.roundRect, { x: 7.3, y: 4.73, w: 5.6, h: 0.38, fill: { color: 'F8FAFC' }, line: { color: 'CBD5E1', width: 1 }, rectRadius: 0.06 });
  s.addText('colleague@company.com', { x: 7.45, y: 4.82, w: 5.0, h: 0.22, fontSize: 9, color: C.midGray, fontFace: 'Calibri' });
  s.addText('Role', { x: 7.3, y: 5.22, w: 4, h: 0.25, fontSize: 9, bold: true, color: C.darkText, fontFace: 'Calibri' });
  s.addShape(pptx.ShapeType.roundRect, { x: 7.3, y: 5.5, w: 5.6, h: 0.38, fill: { color: 'F8FAFC' }, line: { color: 'CBD5E1', width: 1 }, rectRadius: 0.06 });
  s.addText('Member  ▼', { x: 7.45, y: 5.58, w: 5.0, h: 0.22, fontSize: 9, color: C.darkText, fontFace: 'Calibri' });
  s.addShape(pptx.ShapeType.roundRect, { x: 10.5, y: 6.08, w: 2.4, h: 0.42, fill: { color: C.accent }, rectRadius: 0.08 });
  s.addText('✉  Send Invite', { x: 10.5, y: 6.16, w: 2.4, h: 0.28, fontSize: 10, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });

  // features
  const features = ['Real Gmail SMTP email delivery', 'Invite link expires in 7 days', 'Duplicate invite detection', 'Suspend / Reactivate members', 'Role change in one click', 'Cancel pending invites'];
  s.addText('Key Capabilities', { x: 0.4, y: 5.38, w: 6.4, h: 0.3, fontSize: 11, bold: true, color: C.primary, fontFace: 'Calibri' });
  features.forEach((f, i) => {
    s.addShape(pptx.ShapeType.roundRect, { x: 0.4 + (i % 2) * 3.25, y: 5.72 + Math.floor(i / 2) * 0.48, w: 3.1, h: 0.38, fill: { color: 'EFF6FF' }, rectRadius: 0.06 });
    s.addText('✓  ' + f, { x: 0.55 + (i % 2) * 3.25, y: 5.8 + Math.floor(i / 2) * 0.48, w: 2.9, h: 0.24, fontSize: 9, color: C.accent, fontFace: 'Calibri' });
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 10 — DIVISION MANAGEMENT
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Division Management', 'Multi-division enterprise structure');
  footer(s, 10);

  // division cards
  const divs = [
    { name: 'Engineering',      code: 'ENG',   color: C.accent,  members: 20, projects: 2, budget: '₹50L' },
    { name: 'Sales & Marketing', code: 'SALES', color: C.green,   members: 12, projects: 1, budget: '₹20L' },
    { name: 'Human Resources',   code: 'HR',    color: C.orange,  members:  8, projects: 1, budget: '₹10L' },
  ];

  divs.forEach((d, i) => {
    const x = 0.4 + i * 4.2;
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.4, w: 3.9, h: 2.2, fill: C.white, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.12, shadow: { type: 'outer', blur: 6, offset: 2, angle: 45, color: '000000', opacity: 0.08 } });
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.4, w: 3.9, h: 0.42, fill: { color: d.color }, rectRadius: 0.12 });
    s.addShape(pptx.ShapeType.rect,      { x, y: 1.62, w: 3.9, h: 0.2, fill: { color: d.color } });
    s.addText(d.name, { x: x + 0.15, y: 1.47, w: 3.6, h: 0.3, fontSize: 12, bold: true, color: C.white, fontFace: 'Calibri' });
    [['Members', d.members], ['Projects', d.projects], ['Budget', d.budget]].forEach(([lbl, val], j) => {
      s.addText(String(val), { x: x + 0.15 + j * 1.25, y: 2.02, w: 1.2, h: 0.42, fontSize: 18, bold: true, color: C.darkText, align: 'center', fontFace: 'Calibri' });
      s.addText(lbl,         { x: x + 0.15 + j * 1.25, y: 2.44, w: 1.2, h: 0.25, fontSize: 8.5, color: C.midGray, align: 'center', fontFace: 'Calibri' });
    });
    s.addText(`Code: ${d.code}`, { x: x + 0.15, y: 2.82, w: 3.5, h: 0.22, fontSize: 8.5, color: C.midGray, fontFace: 'Calibri' });
  });

  // feature cards
  s.addText('Division Capabilities', { x: 0.4, y: 3.78, w: 12.5, h: 0.32, fontSize: 12, bold: true, color: C.primary, fontFace: 'Calibri' });
  featureCard(s, 0.4,  4.18, 3.0, 2.5, 'Structure',      ['Create division hierarchy', 'Parent-child divisions', 'Unique division codes', 'Color-coded divisions'], C.primary);
  featureCard(s, 3.6,  4.18, 3.0, 2.5, 'Member Access',  ['Assign members per division', 'Division-specific roles', 'Remove division members', 'Member count tracking'], C.accent);
  featureCard(s, 6.8,  4.18, 3.0, 2.5, 'Feature Config', ['Enable/disable modules per division', 'Time tracking toggle', 'Sprint & calendar toggle', 'AI & exports toggle'], C.green);
  featureCard(s, 10.0, 4.18, 3.0, 2.5, 'Governance',     ['Budget allocation', 'Headcount management', 'Handoff readiness checklist', 'Division admin assignment'], C.purple);
}

// ════════════════════════════════════════════════════════
// SLIDE 11 — WORKFLOW & APPROVALS
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Workflow & Approvals', 'Customizable workflows and multi-step approval chains');
  footer(s, 11);

  // workflow diagram
  s.addText('Default Workflow', { x: 0.4, y: 1.38, w: 5, h: 0.3, fontSize: 11, bold: true, color: C.primary, fontFace: 'Calibri' });
  const statuses = [
    { name: 'Backlog',     color: '64748B' },
    { name: 'To Do',       color: '3B82F6' },
    { name: 'In Progress', color: 'F59E0B' },
    { name: 'In Review',   color: '8B5CF6' },
    { name: 'Done',        color: '10B981' },
  ];
  statuses.forEach((st, i) => {
    const x = 0.4 + i * 2.4;
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.82, w: 2.1, h: 0.6, fill: { color: st.color }, rectRadius: 0.08 });
    s.addText(st.name, { x, y: 1.98, w: 2.1, h: 0.3, fontSize: 10, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
    if (i < statuses.length - 1) {
      s.addText('→', { x: x + 2.12, y: 1.98, w: 0.26, h: 0.3, fontSize: 14, bold: true, color: C.midGray, align: 'center' });
    }
  });

  featureCard(s, 0.4,  2.65, 3.8, 2.0, 'Custom Workflows',  ['Add/remove/reorder statuses', 'Set initial & final statuses', 'Custom status colors', 'Per-project workflow assignment'], C.accent);
  featureCard(s, 4.4,  2.65, 3.8, 2.0, 'Approval Chains',   ['Multi-step approval sequence', 'Assign approvers per step', 'Approve / Reject with notes', 'Full audit trail'], C.orange);
  featureCard(s, 8.4,  2.65, 3.8, 2.0, 'Approvals Inbox',   ['Pending approvals dashboard', 'One-click approve/reject', 'Filter by status', 'Notifications on decisions'], C.purple);
  featureCard(s, 0.4,  4.82, 5.8, 1.8, 'Forms & Submissions', ['Create custom intake forms', 'Submit forms to trigger workflows', 'Form submissions feed into task queue', 'Track submission status'], C.green);
  featureCard(s, 6.4,  4.82, 5.8, 1.8, 'Versioning & Audit', ['Entity history for tasks/projects', 'Who changed what and when', 'Create point-in-time snapshots', 'Restore previous versions'], C.primary);
}

// ════════════════════════════════════════════════════════
// SLIDE 12 — TIME TRACKING
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Time Tracking & Timesheets', 'Log, review, and approve work hours');
  footer(s, 12);

  mockScreen(s, 0.4, 1.4, 6.5, 3.8, 'Time Logging — Weekly View', [
    'Week: 21 Apr – 27 Apr 2026    Total: 32h / 40h target',
    '',
    'Mon  Tue  Wed  Thu  Fri',
    ' 8h   6h   7h   5h   6h',
    '',
    'Sample Project   ██████████████   18h',
    'API Platform v3  ████████         14h',
    '',
    'Status: Draft — [Submit for Approval]',
  ]);

  featureCard(s, 7.1, 1.4,  2.9, 1.85, 'Log Time',        ['Log against task or project', 'Date picker', 'Description field', 'Edit / delete entries'], C.accent);
  featureCard(s, 10.2, 1.4, 2.9, 1.85, 'Timesheets',      ['Weekly timesheet view', 'Submit to manager', 'Track approval status', 'Manager approve/reject'], C.orange);
  featureCard(s, 7.1, 3.42, 2.9, 1.78, 'Reports',         ['By-day breakdown', 'By-project breakdown', 'Org-wide time summary', 'Export to CSV'], C.green);
  featureCard(s, 10.2, 3.42, 2.9, 1.78, 'Management',     ['Admin sees all timesheets', 'Approve in bulk', 'Reject with note', 'Utilization trends'], C.purple);

  // stats
  [
    ['40h', 'Weekly Target',  C.accent],
    ['32h', 'Logged This Week', C.green],
    ['80%', 'Utilization',    C.orange],
    ['3',   'Pending Approvals', 'DC2626'],
  ].forEach(([val, lbl, color], i) => {
    statBox(s, 0.4 + i * 3.1, 5.42, val, lbl, color);
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 13 — PORTFOLIO & CAPACITY
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Portfolio & Capacity Planning', 'Executive visibility into project health and team utilization');
  footer(s, 13);

  // portfolio health table
  s.addText('Portfolio Health Dashboard', { x: 0.4, y: 1.38, w: 6.5, h: 0.3, fontSize: 12, bold: true, color: C.primary, fontFace: 'Calibri' });
  const headers = ['Project', 'Progress', 'Health', 'Status'];
  headers.forEach((h, i) => {
    s.addShape(pptx.ShapeType.rect, { x: 0.4 + i * 1.55, y: 1.75, w: 1.5, h: 0.35, fill: { color: C.primary } });
    s.addText(h, { x: 0.45 + i * 1.55, y: 1.82, w: 1.45, h: 0.22, fontSize: 9, bold: true, color: C.white, fontFace: 'Calibri' });
  });
  const rows = [
    ['Sample Project',   '65%', '78', 'On Track'],
    ['API Platform v3',  '40%', '62', 'At Risk'],
    ['Q2 Lead Campaign', '80%', '88', 'On Track'],
    ['Annual Review',    '50%', '71', 'On Track'],
  ];
  rows.forEach((row, ri) => {
    const bg = ri % 2 === 0 ? C.white : 'F8FAFC';
    s.addShape(pptx.ShapeType.rect, { x: 0.4, y: 2.1 + ri * 0.52, w: 6.2, h: 0.5, fill: { color: bg } });
    row.forEach((cell, ci) => {
      if (ci === 2) { // health score with color
        const hColor = parseInt(cell) >= 80 ? C.green : parseInt(cell) >= 65 ? C.orange : 'DC2626';
        s.addShape(pptx.ShapeType.roundRect, { x: 0.45 + ci * 1.55, y: 2.17 + ri * 0.52, w: 0.5, h: 0.3, fill: { color: hColor }, rectRadius: 0.06 });
        s.addText(cell, { x: 0.45 + ci * 1.55, y: 2.22 + ri * 0.52, w: 0.5, h: 0.22, fontSize: 9, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
      } else {
        s.addText(cell, { x: 0.45 + ci * 1.55, y: 2.18 + ri * 0.52, w: 1.45, h: 0.3, fontSize: 9, color: C.darkText, fontFace: 'Calibri' });
      }
    });
  });

  s.addText('Health = 40% Progress + 30% Budget Efficiency + 30% Blocked Task Penalty', {
    x: 0.4, y: 4.28, w: 6.2, h: 0.3, fontSize: 8, color: C.midGray, italic: true, fontFace: 'Calibri',
  });

  // capacity heatmap
  s.addText('Capacity Planning — Utilization Heatmap', { x: 7.0, y: 1.38, w: 6.2, h: 0.3, fontSize: 12, bold: true, color: C.primary, fontFace: 'Calibri' });

  const members = ['Ravi Kumar', 'Anjali Singh', 'Vikram Mehta'];
  const weeks   = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];
  const utilData = [
    [45, 80, 95, 60],
    [70, 85, 110, 75],
    [30, 55, 70, 40],
  ];
  const heatColor = (v) => v < 50 ? '3B82F6' : v < 80 ? '10B981' : v < 100 ? 'F59E0B' : 'DC2626';

  weeks.forEach((w, wi) => {
    s.addText(w, { x: 8.2 + wi * 1.4, y: 1.78, w: 1.2, h: 0.28, fontSize: 9, bold: true, color: C.darkText, align: 'center', fontFace: 'Calibri' });
  });
  members.forEach((m, mi) => {
    s.addText(m, { x: 7.05, y: 2.18 + mi * 0.72, w: 1.1, h: 0.5, fontSize: 8.5, color: C.darkText, fontFace: 'Calibri', valign: 'middle' });
    utilData[mi].forEach((val, wi) => {
      s.addShape(pptx.ShapeType.roundRect, { x: 8.2 + wi * 1.4, y: 2.18 + mi * 0.72, w: 1.2, h: 0.5, fill: { color: heatColor(val) }, rectRadius: 0.06 });
      s.addText(val + '%', { x: 8.2 + wi * 1.4, y: 2.3 + mi * 0.72, w: 1.2, h: 0.3, fontSize: 10, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
    });
  });

  // legend
  [['< 50%', '3B82F6', 'Under'], ['50-80%', '10B981', 'Optimal'], ['80-100%', 'F59E0B', 'High'], ['> 100%', 'DC2626', 'Over']].forEach(([lbl, color, tag], i) => {
    s.addShape(pptx.ShapeType.roundRect, { x: 7.05 + i * 1.5, y: 4.62, w: 1.3, h: 0.5, fill: { color }, rectRadius: 0.06 });
    s.addText(lbl, { x: 7.05 + i * 1.5, y: 4.7, w: 1.3, h: 0.36, fontSize: 9, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
  });

  featureCard(s, 7.0, 5.28, 3.0, 1.5, 'Planning Features', ['2 / 4 / 8 week view toggle', 'Per-member workload cards', 'Over-utilization alerts'], C.accent);
  featureCard(s, 10.2, 5.28, 3.0, 1.5, 'Portfolio Features', ['Project health scoring', 'Budget vs actual tracking', 'Cross-division view'], C.orange);
}

// ════════════════════════════════════════════════════════
// SLIDE 14 — EXECUTIVE DASHBOARD
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Executive Dashboard & OKRs', 'Strategic visibility for leadership');
  footer(s, 14);

  statBox(s, 0.4,  1.4, '4',    'Active Divisions', C.primary);
  statBox(s, 3.15, 1.4, '92%',  'OKR Progress',     C.green);
  statBox(s, 5.9,  1.4, '₹80L', 'Total Budget',     C.purple);
  statBox(s, 8.65, 1.4, '148',  'Total Tasks',      C.accent);

  featureCard(s, 0.4,  2.9, 3.8, 2.0, 'OKR Dashboard',       ['Company & division-level OKRs', 'Key Results with % progress', 'Q1/Q2/Q3/Q4 quarterly view', 'Inline KR update by manager'], C.primary);
  featureCard(s, 4.4,  2.9, 3.8, 2.0, 'Division Scorecards', ['Health status: Green/Amber/Red', 'Completion %, overdue tasks', 'Budget utilization bars', 'Trend vs. previous period'], C.accent);
  featureCard(s, 8.4,  2.9, 3.8, 2.0, 'Resource Dashboard',  ['Team size per division', 'Billable vs non-billable hours', 'Capacity vs. demand view', 'Exportable reports'], C.green);
  featureCard(s, 0.4,  5.08, 3.8, 1.7, 'Executive Rollup',   ['Org-wide KPI summary', 'Alerts for at-risk divisions', 'Velocity trends comparison', 'Budget comparison chart'], C.orange);
  featureCard(s, 4.4,  5.08, 3.8, 1.7, 'Portfolio View',     ['All projects in one view', 'Filter by division/status', 'Health matrix at a glance', 'Drill-down per project'], C.purple);
  featureCard(s, 8.4,  5.08, 3.8, 1.7, 'Access Control',     ['Executive role = read-only', 'No accidental modifications', 'Downloadable board reports', 'PDF / CSV export options'], '475569');
}

// ════════════════════════════════════════════════════════
// SLIDE 15 — PLATFORM FEATURES
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Platform-Wide Features', 'Search, notifications, exports, AI & integrations');
  footer(s, 15);

  featureCard(s, 0.4,  1.45, 2.9, 2.2, 'Global Search',      ['Search tasks & projects instantly', 'Results in < 200ms', 'Filter by type (task/project)', 'Keyboard shortcut: ⌘K'], C.accent);
  featureCard(s, 3.5,  1.45, 2.9, 2.2, 'Notifications',      ['In-app notification panel', 'Mark individual / all as read', 'Delete notifications', 'Auto-polls every 30 seconds'], C.orange);
  featureCard(s, 6.6,  1.45, 2.9, 2.2, 'Exports',            ['Export tasks to CSV / Excel / PDF', 'Export projects summary', 'Filter before export', 'Download history'], C.green);
  featureCard(s, 9.7,  1.45, 2.9, 2.2, 'AI Assistant',       ['Powered by Claude (Anthropic)', 'Task description suggestions', 'Sprint goal recommendations', 'Status report drafting'], C.purple);

  featureCard(s, 0.4,  3.85, 2.9, 2.2, 'Calendar View',      ['Tasks plotted by due date', 'Monthly / weekly calendar', 'Click task to open detail', 'Color-coded by project'], C.primary);
  featureCard(s, 3.5,  3.85, 2.9, 2.2, 'Custom Roles',       ['Define custom permission sets', 'Edit system role permissions', 'Assign to members', 'Granular access control'], C.accent);
  featureCard(s, 6.6,  3.85, 2.9, 2.2, 'External Users',     ['Invite external collaborators', 'Set access expiry dates', 'Project-level guest access', 'Revoke access instantly'], C.orange);
  featureCard(s, 9.7,  3.85, 2.9, 2.2, 'MS 365 Integration', ['Outlook calendar sync', 'Teams notification support', 'Azure AD authentication (prod)', 'OneDrive attachment storage'], C.green);

  // bottom bar
  s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 6.28, w: 12.5, h: 0.5, fill: { color: 'F0F9FF' }, line: { color: 'BAE6FD', width: 1 }, rectRadius: 0.08 });
  s.addText('🔒  Enterprise Security:   JWT authentication  ·  Rate limiting (100 req/min)  ·  Helmet.js security headers  ·  CORS origin validation  ·  bcrypt password hashing  ·  Refresh token rotation', {
    x: 0.55, y: 6.36, w: 12.2, h: 0.3, fontSize: 8.5, color: '0369A1', fontFace: 'Calibri',
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 16 — TECHNICAL ARCHITECTURE
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Technical Architecture', 'Modern, scalable full-stack architecture');
  footer(s, 16);

  const stack = [
    { layer: 'Frontend',  color: C.accent,   items: ['React 18 + TypeScript', 'TanStack Query v5', 'Tailwind CSS + shadcn/ui', 'React Router v6', 'Vite build tool'] },
    { layer: 'Backend',   color: C.primary,  items: ['Node.js + Express 5', 'In-memory stores (dev)', 'Prisma ORM (prod)', 'JWT + Refresh Tokens', 'Zod validation'] },
    { layer: 'Infra',     color: C.green,    items: ['PostgreSQL (prod DB)', 'Redis (caching/queues)', 'BullMQ job queues', 'AWS S3 (attachments)', 'Winston logging'] },
    { layer: 'Security',  color: C.purple,   items: ['Helmet.js headers', 'CORS whitelisting', 'Rate limiting', 'bcrypt hashing', 'HTTPS (prod)'] },
  ];

  stack.forEach((st, i) => {
    const x = 0.4 + i * 3.2;
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.42, w: 2.95, h: 4.2, fill: { color: C.lightGray }, rectRadius: 0.12 });
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.42, w: 2.95, h: 0.5, fill: { color: st.color }, rectRadius: 0.12 });
    s.addShape(pptx.ShapeType.rect,      { x, y: 1.72, w: 2.95, h: 0.22, fill: { color: st.color } });
    s.addText(st.layer, { x: x + 0.12, y: 1.52, w: 2.7, h: 0.32, fontSize: 13, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
    st.items.forEach((item, ii) => {
      s.addShape(pptx.ShapeType.roundRect, { x: x + 0.15, y: 2.06 + ii * 0.66, w: 2.65, h: 0.5, fill: C.white, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.07 });
      s.addText(item, { x: x + 0.28, y: 2.16 + ii * 0.66, w: 2.4, h: 0.3, fontSize: 9.5, color: C.darkText, fontFace: 'Calibri' });
    });
  });

  // deployment note
  s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 5.8, w: 12.5, h: 0.85, fill: { color: 'FFFBEB' }, line: { color: 'FDE68A', width: 1 }, rectRadius: 0.1 });
  s.addText('📋  Current Status:', { x: 0.6, y: 5.9, w: 2, h: 0.3, fontSize: 10, bold: true, color: '92400E', fontFace: 'Calibri' });
  s.addText('All modules are functional in development mode using in-memory data stores. Production deployment requires PostgreSQL database migration via Prisma ORM and Redis configuration. The codebase is fully prepared for production with environment-based configuration.', {
    x: 2.7, y: 5.88, w: 9.8, h: 0.56, fontSize: 9, color: '92400E', fontFace: 'Calibri',
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 17 — ROADMAP
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  slideBg(s, C.white);
  headerBand(s, 'Roadmap & Next Steps', 'Phased delivery plan');
  footer(s, 17);

  const phases = [
    {
      phase: 'Phase 1', label: 'COMPLETE ✅', color: C.green, date: 'Jan – Apr 2026',
      items: ['Authentication & user management', 'Project & task management', 'Kanban board with drag-drop', 'Sprint management', 'Division management', 'Workflow & approvals'],
    },
    {
      phase: 'Phase 2', label: 'COMPLETE ✅', color: C.accent, date: 'Mar – Apr 2026',
      items: ['Time tracking & timesheets', 'Portfolio dashboard', 'Capacity planning heatmap', 'Executive OKR dashboard', 'Global search & notifications', 'Custom roles & exports'],
    },
    {
      phase: 'Phase 3', label: 'IN PROGRESS 🔄', color: C.orange, date: 'May – Jun 2026',
      items: ['Production DB migration (PostgreSQL)', 'Gmail/SMTP email delivery live', 'MS 365 / Azure AD integration', 'Mobile responsive polish', 'Performance optimization', 'Security audit & pen testing'],
    },
    {
      phase: 'Phase 4', label: 'PLANNED 📋', color: C.midGray, date: 'Jul – Sep 2026',
      items: ['Native mobile app (React Native)', 'Advanced AI suggestions', 'Gantt chart view', 'Budget tracking module', 'Multi-language support', 'SSO / SAML integration'],
    },
  ];

  phases.forEach((ph, i) => {
    const x = 0.4 + i * 3.28;
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.38, w: 3.0, h: 5.5, fill: C.white, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.12, shadow: { type: 'outer', blur: 5, offset: 2, angle: 45, color: '000000', opacity: 0.07 } });
    s.addShape(pptx.ShapeType.roundRect, { x, y: 1.38, w: 3.0, h: 0.65, fill: { color: ph.color }, rectRadius: 0.12 });
    s.addShape(pptx.ShapeType.rect,      { x, y: 1.72, w: 3.0, h: 0.3, fill: { color: ph.color } });
    s.addText(ph.phase, { x: x + 0.12, y: 1.44, w: 2.76, h: 0.32, fontSize: 13, bold: true, color: C.white, fontFace: 'Calibri' });
    s.addText(ph.date,  { x: x + 0.12, y: 1.77, w: 2.76, h: 0.22, fontSize: 8, color: 'D1FAE5', fontFace: 'Calibri', italic: true });
    const labelBg = { [C.green]: 'D1FAE5', [C.accent]: 'DBEAFE', [C.orange]: 'FEF3C7', [C.midGray]: 'F1F5F9' }[ph.color] || 'F1F5F9';
    s.addShape(pptx.ShapeType.roundRect, { x: x + 0.12, y: 2.12, w: 2.76, h: 0.3, fill: { color: labelBg }, rectRadius: 0.06 });
    s.addText(ph.label, { x: x + 0.12, y: 2.18, w: 2.76, h: 0.2, fontSize: 8.5, bold: true, color: ph.color, align: 'center', fontFace: 'Calibri' });
    ph.items.forEach((item, ii) => {
      s.addText('• ' + item, { x: x + 0.18, y: 2.58 + ii * 0.66, w: 2.7, h: 0.55, fontSize: 9, color: C.bodyText, fontFace: 'Calibri', valign: 'top' });
    });
  });
}

// ════════════════════════════════════════════════════════
// SLIDE 18 — THANK YOU
// ════════════════════════════════════════════════════════
{
  const s = pptx.addSlide();
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: C.primary } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 5.2, w: '100%', h: 2.3, fill: { color: '152B47' } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 2.55, w: 0.18, h: 2.0, fill: { color: C.accent } });

  s.addText('Thank You', { x: 0.5, y: 1.5, w: 9, h: 1.2, fontSize: 48, bold: true, color: C.white, fontFace: 'Calibri' });
  s.addText('Questions & Discussion', { x: 0.5, y: 2.75, w: 7, h: 0.55, fontSize: 18, color: 'BFD3E8', fontFace: 'Calibri' });
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 3.4, w: 4, h: 0.04, fill: { color: C.accent } });

  const contact = ['priyanka.bansal@qcin.org', 'Quality Council of India', 'Enterprise PM Tool — v1.0  |  April 2026'];
  contact.forEach((line, i) => {
    s.addText(line, { x: 0.5, y: 3.6 + i * 0.48, w: 9, h: 0.38, fontSize: 13, color: i === 0 ? C.accent : 'BFD3E8', fontFace: 'Calibri' });
  });

  // right decoration
  ['Dashboard', 'Projects', 'Kanban', 'Sprints', 'Portfolio', 'Capacity', 'OKRs', 'Timesheets', 'Divisions', 'Users'].forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    s.addShape(pptx.ShapeType.roundRect, { x: 9.8 + col * 1.8, y: 1.2 + row * 1.1, w: 1.6, h: 0.75, fill: { color: col === 0 ? C.accent : '2D5FA3' }, rectRadius: 0.1 });
    s.addText(item, { x: 9.8 + col * 1.8, y: 1.42 + row * 1.1, w: 1.6, h: 0.32, fontSize: 10, bold: true, color: C.white, align: 'center', fontFace: 'Calibri' });
  });
}

// ─── Save ─────────────────────────────────────────────
const outPath = path.join(__dirname, 'PM_Tool_Presentation.pptx');
pptx.writeFile({ fileName: outPath })
  .then(() => console.log(`\n✅  Presentation saved to:\n    ${outPath}\n`))
  .catch((err) => console.error('Error:', err));
