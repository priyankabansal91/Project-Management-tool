const { Router } = require('express');
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const ApiError = require('../utils/ApiError');

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const VALID_ROLES = new Set(['org_admin', 'division_admin', 'project_manager', 'member', 'viewer', 'executive']);
    const rawRole     = req.query.role;
    const rawPage     = Math.max(1, parseInt(req.query.page, 10) || 1);
    // Cap page_size at 100 to prevent unbounded queries
    const rawPageSize = Math.min(Math.max(1, parseInt(req.query.page_size, 10) || 20), 100);

    const where = { orgId: req.user.orgId };
    if (rawRole && VALID_ROLES.has(rawRole)) where.role = rawRole;

    const members = await prisma.orgMember.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true, status: true, lastLoginAt: true },
        },
      },
      skip: (rawPage - 1) * rawPageSize,
      take: rawPageSize,
    });

    const total = await prisma.orgMember.count({ where });

    res.json({
      success: true,
      data: {
        items: members.map((m) => ({
          id: m.user.id,
          email: m.user.email,
          first_name: m.user.firstName,
          last_name: m.user.lastName,
          avatar_url: m.user.avatarUrl,
          role: m.role,
          is_owner: m.isOwner,
          status: m.user.status,
          joined_at: m.joinedAt,
          last_login_at: m.user.lastLoginAt,
        })),
        pagination: { page: rawPage, page_size: rawPageSize, total, total_pages: Math.ceil(total / rawPageSize) },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:userId/role', authorize('org_admin'), async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['org_admin', 'project_manager', 'member', 'viewer'].includes(role)) {
      throw ApiError.badRequest('Invalid role');
    }

    const membership = await prisma.orgMember.findFirst({
      where: { orgId: req.user.orgId, userId: req.params.userId },
    });
    if (!membership) throw ApiError.notFound('Member not found');

    await prisma.orgMember.update({ where: { id: membership.id }, data: { role } });
    res.json({ success: true, data: { user_id: req.params.userId, role } });
  } catch (err) {
    next(err);
  }
});

router.delete('/:userId', authorize('org_admin'), async (req, res, next) => {
  try {
    if (req.params.userId === req.user.id) throw ApiError.badRequest('Cannot remove yourself');

    const membership = await prisma.orgMember.findFirst({
      where: { orgId: req.user.orgId, userId: req.params.userId },
    });
    if (!membership) throw ApiError.notFound('Member not found');

    await prisma.orgMember.delete({ where: { id: membership.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
