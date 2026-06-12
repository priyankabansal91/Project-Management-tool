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
    const { randomUUID } = require('crypto');
    const milestoneIds = [];

    const buildMilestoneRows = (items, mapFn) => {
      const ids = items.map(() => randomUUID());
      return {
        ids,
        rows: items.map((item, i) => ({
          id: ids[i],
          ...mapFn(item, i),
          projectId: project.id,
          orgId: req.user.orgId,
          createdBy: req.user.id,
          status: 'pending',
          sequenceOrder: i + 1,
          predecessorId: i === 0 ? null : ids[i - 1],
          waterfallStatus: i === 0 ? 'NOT_STARTED' : 'BLOCKED',
        })),
      };
    };

    // Create initial milestones if provided
    if (Array.isArray(data.milestones) && data.milestones.length > 0) {
      try {
        const { ids, rows } = buildMilestoneRows(data.milestones, (ms) => ({
          title: ms.title,
          description: ms.description || null,
          budget: ms.budget ? parseFloat(ms.budget) : null,
          startDate: ms.start_date ? new Date(ms.start_date) : null,
          dueDate: ms.due_date ? new Date(ms.due_date) : null,
        }));
        await prisma.milestone.createMany({ data: rows });
        milestoneIds.push(...ids);
      } catch { /* continue if milestone creation fails */ }
    } else if (data.stage_template_id && (!Array.isArray(data.milestones) || data.milestones.length === 0)) {
      // Auto-create milestones from stage template substages using a single bulk insert
      try {
        const stageTemplate = await prisma.stageTemplate.findFirst({
          where: { id: data.stage_template_id, orgId: req.user.orgId },
          include: { substages: { orderBy: { order: 'asc' } } },
        });
        if (stageTemplate && stageTemplate.substages.length > 0) {
          const { ids, rows } = buildMilestoneRows(stageTemplate.substages, (sub) => ({
            title: sub.name,
            description: null,
            budget: null,
            startDate: null,
            dueDate: null,
          }));
          await prisma.milestone.createMany({ data: rows });
          milestoneIds.push(...ids);
        }
      } catch { /* stage template auto-milestone creation is optional */ }
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

router.post('/:projectId/close', authorize('org_admin', 'division_admin', 'project_manager', 'vertical_head'), async (req, res, next) => {
  const BUDGET_THRESHOLD = 5_000_000; // ₹50L triggers org_admin step
  try {
    const prisma = require('../config/prisma');
    const project = await prisma.project.findFirst({
      where: { id: req.params.projectId, orgId: req.user.orgId },
      include: { vertical: { include: { division: true } } },
    });
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    const phase = project.phase || 'ACTIVE';
    if (!['ACTIVE', 'ON_HOLD'].includes(phase)) {
      return res.status(400).json({ success: false, error: `Cannot close a project in ${phase} phase` });
    }

    const reason = req.body.reason || '';

    // Resolve approvers
    let verticalHeadId = null;
    let divisionAdminId = null;

    if (project.vertical?.headId) verticalHeadId = project.vertical.headId;

    if (project.divisionId || project.vertical?.divisionId) {
      const divId = project.divisionId || project.vertical.divisionId;
      const divAdmin = await prisma.user.findFirst({
        where: { orgId: req.user.orgId, orgMembers: { some: { role: 'division_admin', status: 'active' } } },
        select: { id: true },
      });
      divisionAdminId = divAdmin?.id || null;
    }

    const budget = project.budget ? parseFloat(project.budget) : 0;
    const addOrgAdmin = budget >= BUDGET_THRESHOLD;

    const approval = await prisma.approval.create({
      data: {
        orgId: req.user.orgId,
        requestedBy: req.user.id,
        title: `Project Closure: ${project.name}`,
        description: reason || `Closure request for project "${project.name}".`,
        status: 'pending',
        relatedProjectId: project.id,
        workflowType: 'project_closure',
        entityType: 'project',
        entityId: project.id,
        currentStep: 1,
      },
    });

    // Chain: Vertical Head → HOD/Division Admin → CEO/Org Admin (high budget only)
    const steps = [];
    steps.push({
      approvalId: approval.id,
      stepId: `step-vh-${approval.id}`,
      stepName: 'Vertical Head',
      stepOrder: 1,
      role: 'vertical_head',
      status: 'pending',
    });
    steps.push({
      approvalId: approval.id,
      stepId: `step-hod-${approval.id}`,
      stepName: 'HOD / Division Admin',
      stepOrder: 2,
      role: 'division_admin',
      status: 'blocked',
    });
    if (addOrgAdmin) {
      steps.push({
        approvalId: approval.id,
        stepId: `step-ceo-${approval.id}`,
        stepName: 'CEO / Org Admin',
        stepOrder: 3,
        role: 'org_admin',
        status: 'blocked',
      });
    }

    await prisma.approvalStep.createMany({ data: steps });
    await prisma.project.update({ where: { id: project.id }, data: { phase: 'PENDING_CLOSURE' } });

    // Notify executives (fire-and-forget)
    prisma.user.findMany({
      where: { orgId: req.user.orgId, orgMembers: { some: { role: 'executive' } } },
      select: { id: true },
    }).then(async (execs) => {
      if (execs.length) {
        await prisma.notification.createMany({
          data: execs.map((e) => ({
            orgId: req.user.orgId,
            userId: e.id,
            title: `Project closure initiated: ${project.name}`,
            body: `Project "${project.name}" has been submitted for closure approval.`,
            type: 'project_updated',
            entityType: 'project',
            entityId: project.id,
            actorId: req.user.id,
          })),
          skipDuplicates: true,
        });
      }
    }).catch(() => {});

    res.status(201).json({
      success: true,
      data: {
        approval_id: approval.id,
        step_count: steps.length,
        high_budget: addOrgAdmin,
        phase: 'PENDING_CLOSURE',
      },
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:projectId', authorize('org_admin', 'division_admin', 'vertical_head'), async (req, res, next) => {
  try {
    await projectService.delete(req.user.orgId, req.params.projectId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ── Project Team Member Management ──────────────────────

// Add a member to the project team
router.post('/:projectId/members', authorize('org_admin', 'division_admin', 'vertical_head', 'project_manager'), async (req, res, next) => {
  try {
    const prisma = require('../config/prisma');
    const { userId, role } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'userId is required' } });

    const project = await prisma.project.findFirst({ where: { id: req.params.projectId, orgId: req.user.orgId } });
    if (!project) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });

    // Upsert — don't error if already a member
    const member = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: req.params.projectId, userId } },
      create: { projectId: req.params.projectId, userId, role: role || 'member' },
      update: { role: role || 'member' },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });

    res.status(201).json({
      success: true,
      data: {
        id: member.user.id,
        name: `${member.user.firstName} ${member.user.lastName}`,
        avatar_url: member.user.avatarUrl || null,
        role: member.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Remove a member from the project team
router.delete('/:projectId/members/:userId', authorize('org_admin', 'division_admin', 'vertical_head', 'project_manager'), async (req, res, next) => {
  try {
    const prisma = require('../config/prisma');
    const project = await prisma.project.findFirst({ where: { id: req.params.projectId, orgId: req.user.orgId } });
    if (!project) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });

    await prisma.projectMember.deleteMany({
      where: { projectId: req.params.projectId, userId: req.params.userId },
    });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
