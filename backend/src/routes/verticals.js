const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { requireParentReady } = require('../middleware/waterfallGuard');
const { createVerticalSchema, updateVerticalSchema } = require('../validators/vertical');

router.use(authenticate);

// GET / — list all verticals for the org (optionally filter by divisionId)
router.get('/', async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const where = { orgId: req.user.orgId };
    if (req.query.divisionId) {
      where.divisionId = req.query.divisionId;
    }
    // vertical_head sees only verticals they head
    if (req.user.role === 'vertical_head') {
      where.headId = req.user.id;
    }
    const verticals = await prisma.vertical.findMany({
      where,
      include: {
        division: { select: { id: true, name: true } },
        head: { select: { id: true, firstName: true, lastName: true, email: true } },
        projects: {
          where: { deletedAt: null },
          select: {
            id: true,
            budget: true,
            milestones: { select: { actualBudget: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute actualBudget = sum of all milestone actualBudgets across all projects in vertical
    const enriched = verticals.map((v) => {
      const actualBudget = (v.projects || []).reduce((sum, p) => {
        return sum + (p.milestones || []).reduce((ms, m) => ms + Number(m.actualBudget || 0), 0);
      }, 0);
      const { projects, ...rest } = v;
      return { ...rest, actualBudget };
    });

    res.json({ success: true, data: { items: enriched } });
  } catch (err) {
    // Prisma model not yet migrated — return empty list
    res.json({ success: true, data: { items: [] } });
  }
});

// POST / — create a vertical (org_admin, division_admin only)
router.post('/', authorize('org_admin', 'division_admin'), requireParentReady('vertical'), async (req, res) => {
  let bodyData;
  try {
    bodyData = createVerticalSchema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
  }
  try {
    const prisma = require('../config/prisma');
    const { name, description, color, status, divisionId, headId, budget } = { ...bodyData, divisionId: bodyData.divisionId ?? bodyData.division_id, headId: bodyData.headId ?? bodyData.head_id };
    if (!name) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name is required' } });
    }
    if (!headId) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'headId (Vertical Head) is required' } });
    }
    const vertical = await prisma.vertical.create({
      data: {
        name,
        description: description || null,
        color: color || '#3B82F6',
        status: status || 'active',
        orgId: req.user.orgId,
        divisionId: divisionId || null,
        headId: headId || null,
        ...(budget !== undefined && { budget: budget ? parseFloat(budget) : null }),
      },
      include: {
        division: { select: { id: true, name: true } },
        head: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    res.status(201).json({ success: true, data: vertical });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /:id/members — list org members who can be assigned to this vertical
router.get('/:id/members', async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const vertical = await prisma.vertical.findFirst({
      where: { id: req.params.id, orgId: req.user.orgId },
    });
    if (!vertical) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vertical not found' } });
    }
    // Query via OrgMember (User model has no orgId field)
    const orgMembers = await prisma.orgMember.findMany({
      where: { orgId: req.user.orgId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: [{ user: { firstName: 'asc' } }],
    });
    const members = orgMembers.map((m) => ({
      id: m.user.id,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      email: m.user.email,
    }));
    res.json({ success: true, data: { items: members } });
  } catch (err) {
    res.json({ success: true, data: { items: [] } });
  }
});

// GET /:id — get a single vertical
router.get('/:id', async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const vertical = await prisma.vertical.findFirst({
      where: { id: req.params.id, orgId: req.user.orgId },
      include: {
        division: { select: { id: true, name: true } },
        head: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!vertical) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vertical not found' } });
    }
    res.json({ success: true, data: vertical });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// PATCH /:id — update a vertical
// org_admin and division_admin can update anything; vertical_head can only update lifecycle on their own vertical
router.patch('/:id', async (req, res) => {
  const { role, id: userId, orgId } = req.user;
  if (!['org_admin', 'division_admin', 'vertical_head'].includes(role)) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
  }
  let patchData;
  try {
    patchData = updateVerticalSchema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors ?? err.message } });
  }
  try {
    const prisma = require('../config/prisma');
    const scopeFilter = role === 'vertical_head' ? { headId: userId } : {};
    const existing = await prisma.vertical.findFirst({
      where: { id: req.params.id, orgId, ...scopeFilter },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vertical not found' } });
    }
    // vertical_head can only change lifecycleStatus, not structural fields
    if (role === 'vertical_head') {
      const { lifecycleStatus } = patchData;
      if (!lifecycleStatus) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Vertical heads can only update lifecycle status' } });
      }
    }
    const { name, description, color, status, divisionId: _divisionId, division_id, headId: _headId, head_id, budget, lifecycleStatus } = patchData;
    const divisionId = _divisionId ?? division_id;
    const headId = _headId ?? head_id;
    const updated = await prisma.vertical.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(status !== undefined && { status }),
        ...(divisionId !== undefined && { divisionId: divisionId || null }),
        ...(headId !== undefined && { headId: headId || null }),
        ...(budget !== undefined && { budget: budget ? parseFloat(budget) : null }),
        ...(lifecycleStatus !== undefined && { lifecycleStatus }),
      },
      include: {
        division: { select: { id: true, name: true } },
        head: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// DELETE /:id — delete a vertical (org_admin only)
router.delete('/:id', authorize('org_admin'), async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const existing = await prisma.vertical.findFirst({
      where: { id: req.params.id, orgId: req.user.orgId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vertical not found' } });
    }
    await prisma.vertical.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

module.exports = router;
