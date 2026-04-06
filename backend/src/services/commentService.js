const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class CommentService {
  async listByTask(orgId, taskId) {
    const comments = await prisma.comment.findMany({
      where: { orgId, taskId, deletedAt: null, parentId: null },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        replies: {
          where: { deletedAt: null },
          include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return comments.map((c) => ({
      id: c.id,
      author: { id: c.author.id, name: `${c.author.firstName} ${c.author.lastName}`, avatar_url: c.author.avatarUrl },
      body: c.body,
      is_edited: c.isEdited,
      created_at: c.createdAt,
      replies: c.replies.map((r) => ({
        id: r.id,
        author: { id: r.author.id, name: `${r.author.firstName} ${r.author.lastName}`, avatar_url: r.author.avatarUrl },
        body: r.body,
        is_edited: r.isEdited,
        created_at: r.createdAt,
      })),
    }));
  }

  async create(orgId, taskId, userId, { body, parent_id }) {
    const task = await prisma.task.findFirst({ where: { id: taskId, orgId, deletedAt: null } });
    if (!task) throw ApiError.notFound('Task not found');

    return prisma.comment.create({
      data: { orgId, taskId, authorId: userId, body, parentId: parent_id || null },
      include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });
  }

  async update(orgId, commentId, userId, { body }) {
    const comment = await prisma.comment.findFirst({ where: { id: commentId, orgId, deletedAt: null } });
    if (!comment) throw ApiError.notFound('Comment not found');
    if (comment.authorId !== userId) throw ApiError.forbidden('Can only edit own comments');

    return prisma.comment.update({
      where: { id: commentId },
      data: { body, isEdited: true, editedAt: new Date() },
    });
  }

  async delete(orgId, commentId, userId, userRole) {
    const comment = await prisma.comment.findFirst({ where: { id: commentId, orgId, deletedAt: null } });
    if (!comment) throw ApiError.notFound('Comment not found');
    if (comment.authorId !== userId && !['org_admin', 'project_manager'].includes(userRole)) {
      throw ApiError.forbidden('Insufficient permissions');
    }

    return prisma.comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } });
  }
}

module.exports = new CommentService();
