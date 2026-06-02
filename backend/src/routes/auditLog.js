const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const prisma = require('../config/prisma');

const router = Router();
router.use(authenticate);

/**
 * GET /v1/audit-logs
 * List audit log entries for the org. Restricted to org_admin.
 *
 * Query params:
 *   page        {number}  default 1
 *   page_size   {number}  default 25, max 100
 *   entity_type {string}  filter by entity type (task, project, member, config, …)
 *   action      {string}  filter by action (created, updated, deleted, role_changed, …)
 *   actor_id    {string}  filter by actor user id
 *   search      {string}  free-text search on entity_id / action / entity_type
 *   start_date  {string}  ISO date — lower bound for created_at
 *   end_date    {string}  ISO date — upper bound for created_at (inclusive up to end of day)
 */
router.get('/', authorize('org_admin', 'hod', 'division_admin'), async (req, res, next) => {
  try {
    const page      = Math.max(1, parseInt(req.query.page, 10)      || 1);
    const page_size = Math.min(100, Math.max(1, parseInt(req.query.page_size, 10) || 25));
    const skip      = (page - 1) * page_size;

    const { entity_type, action, actor_id, search, start_date, end_date } = req.query;

    // ── Build Prisma where clause ──
    const where = { orgId: req.user.orgId };

    if (entity_type) where.entityType = entity_type;
    if (action)      where.action     = action;
    if (actor_id)    where.actorId    = actor_id;

    if (start_date || end_date) {
      where.createdAt = {};
      if (start_date) where.createdAt.gte = new Date(start_date + 'T00:00:00.000Z');
      if (end_date)   where.createdAt.lte = new Date(end_date   + 'T23:59:59.999Z');
    }

    // Free-text search across action / entity_type / entity_id
    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { action:     { contains: term, mode: 'insensitive' } },
        { entityType: { contains: term, mode: 'insensitive' } },
        { entityId:   { contains: term, mode: 'insensitive' } },
      ];
    }

    // ── Fetch page + total in parallel ──
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: page_size,
        include: {
          actor: {
            select: {
              id:        true,
              firstName: true,
              lastName:  true,
              email:     true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    // ── Shape the response ──
    const items = logs.map((log) => ({
      id:          log.id,
      entity_type: log.entityType,
      entity_id:   log.entityId,
      action:      log.action,
      old_value:   log.oldValue,
      new_value:   log.newValue,
      diff:        log.diff,
      ip_address:  log.ipAddress  || null,
      created_at:  log.createdAt,
      actor: log.actor
        ? {
            id:        log.actor.id,
            name:      `${log.actor.firstName} ${log.actor.lastName}`.trim(),
            email:     log.actor.email,
            avatar_url: log.actor.avatarUrl || null,
          }
        : null,
    }));

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          page_size,
          total,
          total_pages: Math.ceil(total / page_size),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
