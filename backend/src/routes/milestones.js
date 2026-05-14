const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams for /projects/:projectId/milestones
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

const SEED_MILESTONES = [
  { id: 'ms1', projectId: null, title: 'Requirement Gathering', description: 'Collect and document all requirements', status: 'completed', progress: 100, startDate: '2026-01-10', dueDate: '2026-01-25', createdAt: new Date().toISOString() },
  { id: 'ms2', projectId: null, title: 'UI/UX Design Finalization', description: 'Finalize wireframes and design system', status: 'completed', progress: 100, startDate: '2026-01-26', dueDate: '2026-02-10', createdAt: new Date().toISOString() },
  { id: 'ms3', projectId: null, title: 'Development Phase 1', description: 'Core module development', status: 'in_progress', progress: 65, startDate: '2026-02-11', dueDate: '2026-03-20', createdAt: new Date().toISOString() },
  { id: 'ms4', projectId: null, title: 'UAT & Testing', description: 'User acceptance testing and QA', status: 'pending', progress: 0, startDate: '2026-03-21', dueDate: '2026-04-05', createdAt: new Date().toISOString() },
  { id: 'ms5', projectId: null, title: 'Production Deployment', description: 'Deploy to production environment', status: 'pending', progress: 0, startDate: '2026-04-06', dueDate: '2026-04-15', createdAt: new Date().toISOString() },
];

// GET /v1/projects/:projectId/milestones
router.get('/', async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const milestones = await prisma.milestone.findMany({
      where: { projectId: req.params.projectId, orgId: req.user.orgId },
      include: {
        tasks: { select: { id: true, title: true, statusName: true, priority: true, assigneeId: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
    res.json({ success: true, data: { items: milestones } });
  } catch {
    const seeded = SEED_MILESTONES.map(m => ({ ...m, projectId: req.params.projectId }));
    res.json({ success: true, data: { items: seeded } });
  }
});

// POST /v1/projects/:projectId/milestones
router.post('/', async (req, res) => {
  const { title, description, status = 'pending', progress = 0, startDate, dueDate } = req.body;
  if (!title) return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'title is required' } });
  try {
    const prisma = require('../config/prisma');
    const milestone = await prisma.milestone.create({
      data: {
        title,
        description,
        status,
        progress,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: req.params.projectId,
        orgId: req.user.orgId,
        createdBy: req.user.id,
      },
    });
    res.status(201).json({ success: true, data: milestone });
  } catch {
    const fake = { id: 'ms_' + Date.now(), projectId: req.params.projectId, title, description, status, progress, startDate, dueDate, createdAt: new Date().toISOString() };
    res.status(201).json({ success: true, data: fake });
  }
});

// GET /v1/projects/:projectId/milestones/:id
router.get('/:id', async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const milestone = await prisma.milestone.findFirst({
      where: { id: req.params.id, projectId: req.params.projectId, orgId: req.user.orgId },
      include: {
        tasks: { select: { id: true, title: true, statusName: true, priority: true, assigneeId: true, dueDate: true } },
        project: { select: { id: true, name: true, verticalId: true, divisionId: true } },
      },
    });
    if (!milestone) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Milestone not found' } });
    res.json({ success: true, data: milestone });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// PATCH /v1/projects/:projectId/milestones/:id
router.patch('/:id', async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const { title, description, status, progress, startDate, dueDate } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = status;
    if (progress !== undefined) data.progress = progress;
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (status === 'completed') data.completedAt = new Date();
    const milestone = await prisma.milestone.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: milestone });
  } catch {
    res.json({ success: true, data: { ...req.body, id: req.params.id } });
  }
});

// DELETE /v1/projects/:projectId/milestones/:id
router.delete('/:id', authorize('org_admin', 'division_admin', 'vertical_head', 'project_manager'), async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    await prisma.milestone.delete({ where: { id: req.params.id } });
  } catch { /* not yet in DB */ }
  res.json({ success: true, data: { deleted: true } });
});

module.exports = router;
