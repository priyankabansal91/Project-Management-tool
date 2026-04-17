const { Router } = require('express');
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const ApiError = require('../utils/ApiError');

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const workflows = await prisma.workflowConfig.findMany({
      where: { orgId: req.user.orgId },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      data: workflows.map((w) => ({
        id: w.id,
        name: w.name,
        description: w.description,
        is_default: w.isDefault,
        statuses: typeof w.statuses === 'string' ? JSON.parse(w.statuses) : w.statuses,
        transitions: typeof w.transitions === 'string' ? JSON.parse(w.transitions) : w.transitions,
        created_at: w.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:workflowId', async (req, res, next) => {
  try {
    const workflow = await prisma.workflowConfig.findFirst({
      where: { id: req.params.workflowId, orgId: req.user.orgId },
    });
    if (!workflow) throw ApiError.notFound('Workflow not found');

    res.json({
      success: true,
      data: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        is_default: workflow.isDefault,
        statuses: typeof workflow.statuses === 'string' ? JSON.parse(workflow.statuses) : workflow.statuses,
        transitions: typeof workflow.transitions === 'string' ? JSON.parse(workflow.transitions) : workflow.transitions,
        created_at: workflow.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', authorize('org_admin', 'project_manager'), async (req, res, next) => {
  try {
    const { name, description, statuses, transitions } = req.body;
    const workflow = await prisma.workflowConfig.create({
      data: {
        orgId: req.user.orgId,
        name,
        description,
        statuses: JSON.stringify(statuses),
        transitions: JSON.stringify(transitions || []),
        createdBy: req.user.id,
      },
    });
    res.status(201).json({ success: true, data: workflow });
  } catch (err) {
    next(err);
  }
});

router.patch('/:workflowId', authorize('org_admin', 'project_manager'), async (req, res, next) => {
  try {
    const wf = await prisma.workflowConfig.findFirst({ where: { id: req.params.workflowId, orgId: req.user.orgId } });
    if (!wf) throw ApiError.notFound('Workflow not found');

    const { name, description, statuses, transitions, is_default } = req.body;
    const updated = await prisma.workflowConfig.update({
      where: { id: req.params.workflowId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(statuses && { statuses: JSON.stringify(statuses) }),
        ...(transitions && { transitions: JSON.stringify(transitions) }),
        ...(is_default !== undefined && { isDefault: is_default }),
      },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/:workflowId', authorize('org_admin'), async (req, res, next) => {
  try {
    const wf = await prisma.workflowConfig.findFirst({ where: { id: req.params.workflowId, orgId: req.user.orgId } });
    if (!wf) throw ApiError.notFound('Workflow not found');
    if (wf.isDefault) throw ApiError.badRequest('Cannot delete default workflow');

    await prisma.workflowConfig.delete({ where: { id: req.params.workflowId } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
