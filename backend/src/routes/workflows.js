const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const ApiError = require('../utils/ApiError');
const WORKFLOW_TEMPLATES = require('../utils/workflowTemplates');

const router = Router();

// In-memory storage for workflows
const workflowsStore = new Map();

// Initialize with default workflow templates — key-based IDs since templates don't carry their own
Object.entries(WORKFLOW_TEMPLATES).forEach(([key, template]) => {
  const wfId = `wf_${key}`;
  workflowsStore.set(wfId, {
    id: wfId,
    orgId: 'dev-org-id',
    name: template.name,
    description: template.description,
    isDefault: key === 'kanban',
    statuses: template.statuses,
    transitions: template.transitions || [],
    createdBy: 'dev-user-id',
    createdAt: new Date(),
  });
});

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const workflows = Array.from(workflowsStore.values())
      .filter(w => w.orgId === req.user.orgId)
      .sort((a, b) => a.createdAt - b.createdAt);

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
    const workflow = workflowsStore.get(req.params.workflowId);
    if (!workflow || workflow.orgId !== req.user.orgId) {
      throw ApiError.notFound('Workflow not found');
    }

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
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const workflow = {
      id: workflowId,
      orgId: req.user.orgId,
      name,
      description,
      isDefault: false,
      statuses: typeof statuses === 'string' ? statuses : JSON.stringify(statuses),
      transitions: typeof transitions === 'string' ? transitions : JSON.stringify(transitions || []),
      createdBy: req.user.id,
      createdAt: new Date(),
    };

    workflowsStore.set(workflowId, workflow);
    res.status(201).json({ success: true, data: workflow });
  } catch (err) {
    next(err);
  }
});

router.patch('/:workflowId', authorize('org_admin', 'project_manager'), async (req, res, next) => {
  try {
    const wf = workflowsStore.get(req.params.workflowId);
    if (!wf || wf.orgId !== req.user.orgId) {
      throw ApiError.notFound('Workflow not found');
    }

    const { name, description, statuses, transitions, is_default } = req.body;
    
    if (name) wf.name = name;
    if (description !== undefined) wf.description = description;
    if (statuses) wf.statuses = typeof statuses === 'string' ? statuses : JSON.stringify(statuses);
    if (transitions) wf.transitions = typeof transitions === 'string' ? transitions : JSON.stringify(transitions);
    if (is_default !== undefined) wf.isDefault = is_default;

    workflowsStore.set(req.params.workflowId, wf);
    res.json({ success: true, data: wf });
  } catch (err) {
    next(err);
  }
});

router.delete('/:workflowId', authorize('org_admin'), async (req, res, next) => {
  try {
    const wf = workflowsStore.get(req.params.workflowId);
    if (!wf || wf.orgId !== req.user.orgId) {
      throw ApiError.notFound('Workflow not found');
    }
    if (wf.isDefault) {
      throw ApiError.badRequest('Cannot delete default workflow');
    }

    workflowsStore.delete(req.params.workflowId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
