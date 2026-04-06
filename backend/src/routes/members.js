const { Router } = require('express');
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const ApiError = require('../utils/ApiError');

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { role, search, page = 1, page_size = 20 } = req.query;
    const where = { orgId: req.user.orgId };
    if (role) where.role = role;

    const members = await prisma.orgMember.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true, status: true, lastLoginAt: true },
        },
      },
      skip: (Number(page) - 1) * Number(page_size),
      take: Number(page_size),
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
        pagination: { page: Number(page), page_size: Number(page_size), total, total_pages: Math.ceil(total / Number(page_size)) },
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
