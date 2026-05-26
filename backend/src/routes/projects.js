const { Router } = require('express');
const projectService = require('../services/projectService');
const { createProjectSchema, updateProjectSchema } = require('../validators/project');
const { authenticate, authorize } = require('../middleware/auth');
const divisionScope = require('../middleware/divisionScope');
const { requireParentReady } = require('../middleware/waterfallGuard');

const router = Router();

router.use(authenticate);
router.use(divisionScope);

router.get('/', async (req, res, next) => {
  try {
    let userVerticals;
    if (req.user.role === 'vertical_head') {
      const prisma = require('../config/prisma');
      const myVerticals = await prisma.vertical.findMany({
        where: { orgId: req.user.orgId, headId: req.user.id },
        select: { id: true },
      });
      userVerticals = myVerticals.map((v) => v.id);
    }
    const result = await projectService.list(
      req.user.orgId,
      req.query,
      {
        userDivisions: req.userDivisions,
        isScopeAll: req.isScopeAll,
        divisionId: req.query.division_id,
        userVerticals,
      }
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/:projectId', async (req, res, next) => {
  try {
    const project = await projectService.getById(req.user.orgId, req.params.projectId);
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

router.post('/', authorize('org_admin', 'division_admin', 'project_manager', 'vertical_head'), requireParentReady('project'), async (req, res, next) => {
  try {
    const data = createProjectSchema.parse(req.body);
    const divisionId = data.division_id || req.currentDivisionId;
    const project = await projectService.create(req.user.orgId, req.user.id, data, divisionId);

    const prisma = require('../config/prisma');
    const milestoneIds = [];

    // Create initial milestones if provided
    if (Array.isArray(data.milestones) && data.milestones.length > 0) {
      for (let i = 0; i < data.milestones.length; i++) {
        const ms = data.milestones[i];
        try {
          const created = await prisma.milestone.create({
            data: {
              title: ms.title,
              description: ms.description || null,
              budget: ms.budget ? parseFloat(ms.budget) : null,
              startDate: ms.start_date ? new Date(ms.start_date) : null,
              dueDate: ms.due_date ? new Date(ms.due_date) : null,
              projectId: project.id,
              orgId: req.user.orgId,
              createdBy: req.user.id,
              status: 'pending',
              sequenceOrder: i + 1,
              predecessorId: i === 0 ? null : milestoneIds[i - 1] || null,
              waterfallStatus: i === 0 ? 'NOT_STARTED' : 'BLOCKED',
            },
          });
          milestoneIds.push(created.id);
        } catch { /* continue if milestone creation fails */ }
      }
    }

    // Create approval request if requested
    let approval = null;
    if (req.body.submit_for_approval && data.vertical_id) {
      try {
        const vertical = await prisma.vertical.findFirst({
          where: { id: data.vertical_id, orgId: req.user.orgId },
          select: { headId: true, name: true },
        });
        approval = await prisma.approval.create({
          data: {
            orgId: req.user.orgId,
            requestedBy: req.user.id,
            title: `Project Approval: ${project.name}`,
            description: `New project "${project.name}" with ${milestoneIds.length} milestone(s) submitted for approval by vertical head.`,
            status: 'pending',
            relatedProjectId: project.id,
            workflowType: 'project_creation',
            entityType: 'project',
            entityId: project.id,
          },
        });
        // Update project phase to PENDING_APPROVAL
        await prisma.project.update({
          where: { id: project.id },
          data: { phase: 'PENDING_APPROVAL' },
        });
      } catch { /* approval optional */ }
    }

    res.status(201).json({ success: true, data: { ...project, approval_id: approval?.id, milestone_count: milestoneIds.length } });
  } catch (err) {
    next(err);
  }
});

router.patch('/:projectId', authorize('org_admin', 'division_admin', 'project_manager'), async (req, res, next) => {
  try {
    const data = updateProjectSchema.parse(req.body);
    const project = await projectService.update(req.user.orgId, req.params.projectId, data);
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

router.delete('/:projectId', authorize('org_admin', 'division_admin'), async (req, res, next) => {
  try {
    await projectService.delete(req.user.orgId, req.params.projectId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
