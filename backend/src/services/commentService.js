const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

function fmtUser(u) {
  if (!u) return { id: 'unknown', name: 'Unknown User', avatar_url: null };
  return { id: u.id, name: `${u.firstName} ${u.lastName}`, avatar_url: u.avatarUrl || null };
}

function fmtComment(c, replies = []) {
  return {
    id: c.id,
    author: fmtUser(c.author),
    body: c.body,
    is_edited: c.isEdited,
    created_at: c.createdAt,
    replies: replies.map((r) => ({
      id: r.id,
      author: fmtUser(r.author),
      body: r.body,
      is_edited: r.isEdited,
      created_at: r.createdAt,
    })),
  };
}

const AUTHOR_SELECT = { select: { id: true, firstName: true, lastName: true, avatarUrl: true } };

class CommentService {
  async listByTask(orgId, taskId) {
    const all = await prisma.comment.findMany({
      where: { orgId, taskId, deletedAt: null },
      include: { author: AUTHOR_SELECT },
      orderBy: { createdAt: 'desc' },
    });

    const roots   = all.filter((c) => !c.parentId);
    const replies = all.filter((c) => c.parentId);

    return roots.map((root) =>
      fmtComment(root, replies.filter((r) => r.parentId === root.id).sort((a, b) => a.createdAt - b.createdAt))
    );
  }

  async create(orgId, taskId, userId, { body, parent_id }) {
    if (!body?.trim()) throw ApiError.badRequest('Comment body is required');

    const comment = await prisma.comment.create({
      data: { orgId, taskId, authorId: userId, body: body.trim(), parentId: parent_id || null },
      include: { author: AUTHOR_SELECT },
    });
    return fmtComment(comment, []);
  }

  async update(orgId, commentId, userId, { body }) {
    const comment = await prisma.comment.findFirst({ where: { id: commentId, orgId, deletedAt: null } });
    if (!comment) throw ApiError.notFound('Comment not found');
    if (comment.authorId !== userId) throw ApiError.forbidden('Can only edit own comments');

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { body: body.trim(), isEdited: true, editedAt: new Date() },
      include: { author: AUTHOR_SELECT },
    });
    return fmtComment(updated, []);
  }

  async delete(orgId, commentId, userId, userRole) {
    const comment = await prisma.comment.findFirst({ where: { id: commentId, orgId, deletedAt: null } });
    if (!comment) throw ApiError.notFound('Comment not found');
    if (comment.authorId !== userId && !['org_admin', 'project_manager'].includes(userRole)) {
      throw ApiError.forbidden('Insufficient permissions');
    }
    await prisma.comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } });
  }
}

module.exports = new CommentService();
