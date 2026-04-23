// Use crypto.randomUUID() instead of uuid package (Node 14.17+)
const notificationsStore = new Map();

const TYPE_META = {
  task_assigned:     { icon: 'UserPlus',        color: 'blue'   },
  task_updated:      { icon: 'ArrowRightCircle', color: 'purple' },
  task_commented:    { icon: 'MessageSquare',    color: 'green'  },
  task_due_soon:     { icon: 'Clock',            color: 'yellow' },
  task_overdue:      { icon: 'AlertTriangle',    color: 'red'    },
  project_created:   { icon: 'FolderKanban',     color: 'indigo' },
  member_added:      { icon: 'UserPlus',         color: 'orange' },
  approval_request:  { icon: 'FileCheck',        color: 'blue'   },
  approval_done:     { icon: 'CheckCircle2',     color: 'green'  },
  mention:           { icon: 'AtSign',           color: 'yellow' },
};

// Seed for dev: notifications for multiple dev users
const now = Date.now();
const SEED = [
  // For dev-member-id (Ravi Kumar → Demo Member)
  { id: 'n1',  userId: 'dev-member-id',          orgId: 'dev-org-id', type: 'task_assigned',   title: 'Task assigned to you',         body: 'You were assigned "Setup CI/CD pipeline" in APIV3',         actor: 'Demo PM',       entityType: 'task',      entityId: 'task_1',           isRead: false, createdAt: new Date(now - 8 * 60000).toISOString() },
  { id: 'n2',  userId: 'dev-member-id',          orgId: 'dev-org-id', type: 'task_due_soon',   title: 'Task due tomorrow',            body: '"API endpoint tests" is due April 23 — 22 hrs left',         actor: 'System',        entityType: 'task',      entityId: 'task_2',           isRead: false, createdAt: new Date(now - 2 * 3600000).toISOString() },
  { id: 'n3',  userId: 'dev-member-id',          orgId: 'dev-org-id', type: 'task_commented',  title: 'New comment on your task',     body: 'Demo PM commented: "Please add unit tests for this PR"',    actor: 'Demo PM',       entityType: 'task',      entityId: 'task_1',           isRead: false, createdAt: new Date(now - 4 * 3600000).toISOString() },
  { id: 'n4',  userId: 'dev-member-id',          orgId: 'dev-org-id', type: 'approval_done',   title: 'Timesheet approved',           body: 'Your timesheet for Apr 14–20 was approved',                  actor: 'Demo PM',       entityType: 'timesheet', entityId: 'ts_1',             isRead: true,  createdAt: new Date(now - 24 * 3600000).toISOString() },
  { id: 'n5',  userId: 'dev-member-id',          orgId: 'dev-org-id', type: 'mention',         title: 'You were mentioned',           body: '@Demo Member can you review the API spec by EOD?',           actor: 'Demo Admin',    entityType: 'task',      entityId: 'task_3',           isRead: true,  createdAt: new Date(now - 2 * 86400000).toISOString() },
  // For dev-project_manager-id
  { id: 'n6',  userId: 'dev-project_manager-id', orgId: 'dev-org-id', type: 'approval_request', title: 'Timesheet awaiting review',   body: 'Demo Member submitted timesheet for Apr 14–20 (18.5h)',      actor: 'Demo Member',   entityType: 'timesheet', entityId: 'ts_submitted',     isRead: false, createdAt: new Date(now - 3 * 3600000).toISOString() },
  { id: 'n7',  userId: 'dev-project_manager-id', orgId: 'dev-org-id', type: 'task_overdue',    title: '2 tasks are overdue',          body: '"DB Migration" and "Load testing" are past their due date',  actor: 'System',        entityType: null,        entityId: null,               isRead: false, createdAt: new Date(now - 6 * 3600000).toISOString() },
  { id: 'n8',  userId: 'dev-project_manager-id', orgId: 'dev-org-id', type: 'member_added',    title: 'New team member',              body: 'Demo Member was added to APIV3 project',                     actor: 'Demo Admin',    entityType: 'project',   entityId: 'proj_eng_2',       isRead: true,  createdAt: new Date(now - 48 * 3600000).toISOString() },
  // For dev-org_admin-id
  { id: 'n9',  userId: 'dev-org_admin-id',       orgId: 'dev-org-id', type: 'project_created', title: 'New project created',          body: 'Project "Q2 Lead Campaign" (SALES) was created',             actor: 'Demo Admin',    entityType: 'project',   entityId: 'proj_sales_1',     isRead: false, createdAt: new Date(now - 30 * 60000).toISOString() },
  { id: 'n10', userId: 'dev-org_admin-id',       orgId: 'dev-org-id', type: 'task_overdue',    title: '3 tasks are overdue org-wide', body: 'Engineering division has 3 overdue high-priority tasks',     actor: 'System',        entityType: null,        entityId: null,               isRead: false, createdAt: new Date(now - 5 * 3600000).toISOString() },
];
SEED.forEach(n => notificationsStore.set(n.id, n));

function getNotifications(userId, orgId, { page = 1, pageSize = 30, unreadOnly = false } = {}) {
  let items = [...notificationsStore.values()]
    .filter(n => n.userId === userId && n.orgId === orgId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (unreadOnly) items = items.filter(n => !n.isRead);
  const total = items.length;
  const unreadCount = [...notificationsStore.values()].filter(n => n.userId === userId && n.orgId === orgId && !n.isRead).length;
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total, unreadCount };
}

function markAsRead(notifId, userId) {
  const n = notificationsStore.get(notifId);
  if (!n || n.userId !== userId) { const e = new Error('Not found'); e.status = 404; throw e; }
  n.isRead = true;
  notificationsStore.set(notifId, n);
  return n;
}

function markAllRead(userId, orgId) {
  for (const [id, n] of notificationsStore) {
    if (n.userId === userId && n.orgId === orgId && !n.isRead) {
      n.isRead = true;
      notificationsStore.set(id, n);
    }
  }
  return { success: true };
}

function deleteNotification(notifId, userId) {
  const n = notificationsStore.get(notifId);
  if (!n || n.userId !== userId) { const e = new Error('Not found'); e.status = 404; throw e; }
  notificationsStore.delete(notifId);
  return { deleted: true };
}

function createNotification({ userId, orgId, type, title, body, actor, entityType, entityId }) {
  const id = 'n_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const notif = { id, userId, orgId, type, title, body, actor, entityType: entityType || null, entityId: entityId || null, isRead: false, createdAt: new Date().toISOString() };
  notificationsStore.set(id, notif);
  return notif;
}

module.exports = { getNotifications, markAsRead, markAllRead, deleteNotification, createNotification };
