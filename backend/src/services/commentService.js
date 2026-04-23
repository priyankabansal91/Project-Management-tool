const ApiError = require('../utils/ApiError');

const commentsStore = new Map();

// Seed some comments for dev tasks so the UI isn't empty
const SEED = [
  {
    id: 'c1', orgId: 'dev-org-id', taskId: 't1',
    authorId: 'dev-project_manager-id',
    author: { id: 'dev-project_manager-id', name: 'Demo PM', avatar_url: null },
    body: 'Great progress on this task! Please make sure to test in Safari as well — there were animation issues in the previous iteration.',
    parentId: null, isEdited: false,
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'c2', orgId: 'dev-org-id', taskId: 't1',
    authorId: 'dev-member-id',
    author: { id: 'dev-member-id', name: 'Demo Member', avatar_url: null },
    body: 'Safari issues fixed! Added cross-browser tests in Playwright. Ready for review.',
    parentId: 'c1', isEdited: false,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'c3', orgId: 'dev-org-id', taskId: 't2',
    authorId: 'dev-project_manager-id',
    author: { id: 'dev-project_manager-id', name: 'Demo PM', avatar_url: null },
    body: 'Remember to handle token rotation edge cases — especially concurrent refresh scenarios.',
    parentId: null, isEdited: false,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];

SEED.forEach((c) => commentsStore.set(c.id, c));

function toResponse(comment, replies = []) {
  return {
    id: comment.id,
    author: comment.author,
    body: comment.body,
    is_edited: comment.isEdited,
    created_at: comment.createdAt,
    replies: replies.map((r) => ({
      id: r.id,
      author: r.author,
      body: r.body,
      is_edited: r.isEdited,
      created_at: r.createdAt,
    })),
  };
}

// Build author object from user info stored on comment (or fallback)
function resolveAuthor(userId) {
  const MAP = {
    'dev-org_admin-id':       { id: 'dev-org_admin-id',       name: 'Demo Admin',     avatar_url: null },
    'dev-division_admin-id':  { id: 'dev-division_admin-id',  name: 'Demo Div Admin', avatar_url: null },
    'dev-project_manager-id': { id: 'dev-project_manager-id', name: 'Demo PM',        avatar_url: null },
    'dev-member-id':          { id: 'dev-member-id',          name: 'Demo Member',    avatar_url: null },
    'dev-executive-id':       { id: 'dev-executive-id',       name: 'Demo Executive', avatar_url: null },
    'dev-viewer-id':          { id: 'dev-viewer-id',          name: 'Demo Viewer',    avatar_url: null },
  };
  return MAP[userId] || { id: userId, name: 'Unknown User', avatar_url: null };
}

class CommentService {
  listByTask(orgId, taskId) {
    const all = [...commentsStore.values()].filter(
      (c) => c.orgId === orgId && c.taskId === taskId && !c.deletedAt
    );
    const roots = all.filter((c) => !c.parentId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return roots.map((root) => {
      const replies = all
        .filter((c) => c.parentId === root.id)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return toResponse(root, replies);
    });
  }

  create(orgId, taskId, userId, { body, parent_id }) {
    if (!body || !body.trim()) throw ApiError.badRequest('Comment body is required');

    const id = `c-${crypto.randomUUID()}`;
    const comment = {
      id,
      orgId,
      taskId,
      authorId: userId,
      author: resolveAuthor(userId),
      body: body.trim(),
      parentId: parent_id || null,
      isEdited: false,
      createdAt: new Date().toISOString(),
    };
    commentsStore.set(id, comment);
    return toResponse(comment, []);
  }

  update(orgId, commentId, userId, { body }) {
    const comment = commentsStore.get(commentId);
    if (!comment || comment.orgId !== orgId || comment.deletedAt) throw ApiError.notFound('Comment not found');
    if (comment.authorId !== userId) throw ApiError.forbidden('Can only edit own comments');

    const updated = { ...comment, body: body.trim(), isEdited: true, editedAt: new Date().toISOString() };
    commentsStore.set(commentId, updated);
    return toResponse(updated, []);
  }

  delete(orgId, commentId, userId, userRole) {
    const comment = commentsStore.get(commentId);
    if (!comment || comment.orgId !== orgId || comment.deletedAt) throw ApiError.notFound('Comment not found');
    if (comment.authorId !== userId && !['org_admin', 'project_manager'].includes(userRole)) {
      throw ApiError.forbidden('Insufficient permissions');
    }
    commentsStore.set(commentId, { ...comment, deletedAt: new Date().toISOString() });
  }
}

module.exports = new CommentService();
