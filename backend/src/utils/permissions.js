/**
 * Role-based permission matrix.
 *
 * Implements resource-scoped RBAC for enterprise access control.
 * Each permission maps to: which roles can perform it and optional scope check.
 */

const ROLE_HIERARCHY = {
  org_admin: 100,
  division_admin: 80,
  vertical_head: 70,
  project_manager: 60,
  team_lead: 50,
  member: 30,
  executive: 90,
  viewer: 10,
};

/** Returns true if userRole is at least as powerful as requiredRole */
function roleAtLeast(userRole, requiredRole) {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}

const PERMISSION_MATRIX = {
  // Divisions
  'division:create':        ['org_admin'],
  'division:edit':          ['org_admin', 'division_admin'],
  'division:delete':        ['org_admin'],
  'division:view':          ['org_admin', 'division_admin', 'vertical_head', 'project_manager', 'executive'],

  // Verticals
  'vertical:create':        ['org_admin', 'division_admin'],
  'vertical:edit':          ['org_admin', 'division_admin', 'vertical_head'],
  'vertical:delete':        ['org_admin', 'division_admin'],
  'vertical:view':          ['org_admin', 'division_admin', 'vertical_head', 'project_manager', 'executive'],

  // Projects
  'project:create':         ['org_admin', 'division_admin', 'vertical_head'],
  'project:edit':           ['org_admin', 'division_admin', 'vertical_head', 'project_manager'],
  'project:delete':         ['org_admin', 'division_admin'],
  'project:view':           ['org_admin', 'division_admin', 'vertical_head', 'project_manager', 'team_lead', 'member', 'executive', 'viewer'],
  'project:manage_members': ['org_admin', 'division_admin', 'vertical_head', 'project_manager'],

  // Milestones
  'milestone:create':       ['org_admin', 'division_admin', 'vertical_head', 'project_manager'],
  'milestone:edit':         ['org_admin', 'division_admin', 'vertical_head', 'project_manager'],
  'milestone:delete':       ['org_admin', 'division_admin', 'vertical_head'],
  'milestone:view':         ['org_admin', 'division_admin', 'vertical_head', 'project_manager', 'team_lead', 'member', 'executive', 'viewer'],
  'milestone:close':        ['org_admin', 'division_admin', 'vertical_head', 'project_manager'],
  'milestone:approve':      ['org_admin', 'division_admin', 'vertical_head'],
  'milestone:budget:view':  ['org_admin', 'division_admin', 'vertical_head', 'project_manager', 'executive'],
  'milestone:budget:edit':  ['org_admin', 'division_admin', 'vertical_head'],

  // Tasks
  'task:create':            ['org_admin', 'division_admin', 'vertical_head', 'project_manager', 'team_lead', 'member'],
  'task:edit:own':          ['org_admin', 'division_admin', 'vertical_head', 'project_manager', 'team_lead', 'member'],
  'task:edit:any':          ['org_admin', 'division_admin', 'vertical_head', 'project_manager'],
  'task:delete':            ['org_admin', 'division_admin', 'vertical_head', 'project_manager'],
  'task:assign':            ['org_admin', 'division_admin', 'vertical_head', 'project_manager', 'team_lead'],
  'task:view':              ['org_admin', 'division_admin', 'vertical_head', 'project_manager', 'team_lead', 'member', 'executive', 'viewer'],

  // Time tracking
  'time:log':               ['org_admin', 'division_admin', 'vertical_head', 'project_manager', 'team_lead', 'member'],
  'time:edit:own':          ['org_admin', 'division_admin', 'vertical_head', 'project_manager', 'team_lead', 'member'],
  'time:edit:any':          ['org_admin', 'division_admin'],
  'time:approve':           ['org_admin', 'division_admin', 'vertical_head', 'project_manager'],

  // Approvals
  'approval:create':        ['org_admin', 'division_admin', 'vertical_head', 'project_manager'],
  'approval:view':          ['org_admin', 'division_admin', 'vertical_head', 'project_manager', 'executive'],
  'approval:action':        ['org_admin', 'division_admin', 'vertical_head'],

  // Reports
  'report:view:org':        ['org_admin', 'executive'],
  'report:view:division':   ['org_admin', 'division_admin', 'executive'],
  'report:view:vertical':   ['org_admin', 'division_admin', 'vertical_head', 'executive'],
  'report:view:project':    ['org_admin', 'division_admin', 'vertical_head', 'project_manager', 'executive'],
  'report:export':          ['org_admin', 'division_admin', 'vertical_head', 'project_manager'],

  // Admin
  'admin:users':            ['org_admin'],
  'admin:roles':            ['org_admin'],
  'admin:org_settings':     ['org_admin'],
  'admin:audit_log':        ['org_admin', 'executive'],
};

/**
 * Check if a user has a specific permission.
 * @param {object} user - { role, id }
 * @param {string} permission - e.g. 'milestone:edit'
 * @returns {boolean}
 */
function can(user, permission) {
  if (!user || !user.role) return false;
  const allowed = PERMISSION_MATRIX[permission];
  if (!allowed) return false;
  return allowed.includes(user.role);
}

/**
 * Express middleware that checks a single permission.
 * Usage: router.post('/', requirePermission('milestone:create'), handler)
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    if (!can(req.user, permission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Permission denied: ${permission}`,
          required: PERMISSION_MATRIX[permission] || [],
          userRole: req.user.role,
        },
      });
    }
    next();
  };
}

/**
 * Check multiple permissions — user must have ALL of them.
 */
function canAll(user, ...permissions) {
  return permissions.every((p) => can(user, p));
}

/**
 * Check multiple permissions — user must have at least ONE.
 */
function canAny(user, ...permissions) {
  return permissions.some((p) => can(user, p));
}

module.exports = { can, canAll, canAny, requirePermission, roleAtLeast, PERMISSION_MATRIX, ROLE_HIERARCHY };
