const { Router } = require('express');
const versioningService = require('../services/versioningService');
const { authenticate, authorize } = require('../middleware/auth');
const prisma = require('../config/prisma');

const router = Router();

router.use(authenticate);

/**
 * Get entity version history
 * GET /v1/versioning/:entityType/:entityId/history
 */
router.get('/:entityType/:entityId/history', async (req, res, next) => {
  try {
    const { page, page_size } = req.query;
    const result = await versioningService.getHistory(
      req.user.orgId,
      req.params.entityType,
      req.params.entityId,
      {
        page: parseInt(page) || 1,
        page_size: parseInt(page_size) || 20,
      }
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Get specific version
 * GET /v1/versioning/:entityType/:entityId/version/:version
 */
router.get('/:entityType/:entityId/version/:version', async (req, res, next) => {
  try {
    const version = await versioningService.getVersion(
      req.user.orgId,
      req.params.entityType,
      req.params.entityId,
      parseInt(req.params.version)
    );

    res.json({ success: true, data: version });
  } catch (err) {
    next(err);
  }
});

/**
 * Restore to specific version
 * POST /v1/versioning/:entityType/:entityId/restore/:version
 */
router.post('/:entityType/:entityId/restore/:version', authorize('org_admin', 'division_admin', 'project_manager'), async (req, res, next) => {
  try {
    const result = await versioningService.restoreVersion(
      req.user.orgId,
      req.params.entityType,
      req.params.entityId,
      parseInt(req.params.version),
      req.user.id
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Compare two versions
 * GET /v1/versioning/:entityType/:entityId/compare/:version1/:version2
 */
router.get('/:entityType/:entityId/compare/:version1/:version2', async (req, res, next) => {
  try {
    const comparison = await versioningService.compareVersions(
      req.user.orgId,
      req.params.entityType,
      req.params.entityId,
      parseInt(req.params.version1),
      parseInt(req.params.version2)
    );

    res.json({ success: true, data: comparison });
  } catch (err) {
    next(err);
  }
});

/**
 * Create snapshot
 * POST /v1/versioning/snapshots
 */
router.post('/snapshots', async (req, res, next) => {
  try {
    const { name, description, snapshotType } = req.body;

    if (!name || !snapshotType) {
      return res.status(400).json({
        success: false,
        error: 'name and snapshotType are required',
      });
    }

    // Gather actual org state for the snapshot
    const [projects, taskGroups, milestones, memberCount] = await Promise.all([
      prisma.project.findMany({
        where: { orgId: req.user.orgId },
        select: {
          id: true, name: true, key: true, status: true, phase: true,
          budget: true, startDate: true, dueDate: true, divisionId: true,
          verticalId: true, createdAt: true,
          _count: { select: { tasks: true, milestones: true, projectMembers: true } },
        },
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: { project: { orgId: req.user.orgId } },
        _count: { status: true },
      }),
      prisma.milestone.findMany({
        where: { orgId: req.user.orgId },
        select: {
          id: true, title: true, status: true, projectId: true,
          budget: true, startDate: true, dueDate: true, waterfallStatus: true,
        },
      }),
      prisma.orgMember.count({ where: { orgId: req.user.orgId, status: 'active' } }),
    ]);

    const snapshotData = {
      capturedAt: new Date().toISOString(),
      summary: {
        totalProjects: projects.length,
        totalMilestones: milestones.length,
        totalMembers: memberCount,
        tasksByStatus: Object.fromEntries(taskGroups.map(t => [t.status, t._count.status])),
      },
      projects,
      milestones,
    };

    const snapshot = await versioningService.createSnapshot(
      req.user.orgId,
      name,
      description,
      snapshotType,
      snapshotData,
      req.user.id
    );

    res.status(201).json({ success: true, data: snapshot });
  } catch (err) {
    next(err);
  }
});

/**
 * List snapshots
 * GET /v1/versioning/snapshots
 */
router.get('/snapshots', async (req, res, next) => {
  try {
    const { snapshotType, page, page_size } = req.query;
    const result = await versioningService.listSnapshots(req.user.orgId, {
      snapshotType,
      page: parseInt(page) || 1,
      page_size: parseInt(page_size) || 20,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * Get snapshot by ID
 * GET /v1/versioning/snapshots/:snapshotId
 */
router.get('/snapshots/:snapshotId', async (req, res, next) => {
  try {
    const snapshot = await versioningService.getSnapshot(req.user.orgId, req.params.snapshotId);
    res.json({ success: true, data: snapshot });
  } catch (err) {
    next(err);
  }
});

/**
 * Delete snapshot
 * DELETE /v1/versioning/snapshots/:snapshotId
 */
router.delete('/snapshots/:snapshotId', async (req, res, next) => {
  try {
    await versioningService.deleteSnapshot(req.user.orgId, req.params.snapshotId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
