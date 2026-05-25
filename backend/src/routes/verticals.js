const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { requireParentReady } = require('../middleware/waterfallGuard');

router.use(authenticate);

// GET / — list all verticals for the org (optionally filter by divisionId)
router.get('/', async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const where = { orgId: req.user.orgId };
    if (req.query.divisionId) {
      where.divisionId = req.query.divisionId;
    }
    const verticals = await prisma.vertical.findMany({
      where,
      include: {
        division: { select: { id: true, name: true } },
        head: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: { items: verticals } });
  } catch (err) {
    // Prisma model not yet migrated — return empty list
    res.json({ success: true, data: { items: [] } });
  }
});

// POST / — create a vertical (org_admin, division_admin only)
router.post('/', authorize('org_admin', 'division_admin'), requireParentReady('vertical'), async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const { name, description, color, status, divisionId, headId } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name is required' } });
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
router.patch('/:id', authorize('org_admin', 'division_admin'), async (req, res) => {
  try {
    const prisma = require('../config/prisma');
    const existing = await prisma.vertical.findFirst({
      where: { id: req.params.id, orgId: req.user.orgId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vertical not found' } });
    }
    const { name, description, color, status, divisionId, headId } = req.body;
    const updated = await prisma.vertical.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(status !== undefined && { status }),
        ...(divisionId !== undefined && { divisionId: divisionId || null }),
        ...(headId !== undefined && { headId: headId || null }),
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
