const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../config/prisma');

// Dev-only persona map — uses generic placeholder emails, never real employee addresses
const DEV_USERS = {
  'dev-org_admin-id':       { id: 'dev-org_admin-id',       orgId: 'dev-org-id', role: 'org_admin',       email: 'admin@example.local' },
  'dev-division_admin-id':  { id: 'dev-division_admin-id',  orgId: 'dev-org-id', role: 'division_admin',  email: 'div-admin@example.local' },
  'dev-project_manager-id': { id: 'dev-project_manager-id', orgId: 'dev-org-id', role: 'project_manager', email: 'pm@example.local' },
  'dev-member-id':          { id: 'dev-member-id',          orgId: 'dev-org-id', role: 'member',          email: 'member@example.local' },
  'dev-viewer-id':          { id: 'dev-viewer-id',          orgId: 'dev-org-id', role: 'viewer',          email: 'viewer@example.local' },
  'dev-executive-id':       { id: 'dev-executive-id',       orgId: 'dev-org-id', role: 'executive',       email: 'executive@example.local' },
  'dev-vertical_head-id':  { id: 'dev-vertical_head-id',  orgId: 'dev-org-id', role: 'vertical_head',  email: 'vertical-head@example.local' },
  'dev-team_lead-id':      { id: 'dev-team_lead-id',      orgId: 'dev-org-id', role: 'team_lead',      email: 'team-lead@example.local' },
};

// Allowed dev user ID values — only exact keys from above are accepted
const ALLOWED_DEV_IDS = new Set(Object.keys(DEV_USERS));
const defaultDev = DEV_USERS['dev-org_admin-id'];

function authenticate(req, res, next) {
  // Development-only bypass: only active when NODE_ENV is explicitly 'development'
  // If a valid Bearer JWT is present, prefer it over the dev bypass so that
  // real invited/registered users are correctly identified in dev mode.
  if (config.nodeEnv === 'development') {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Try to use the real JWT first
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
        if (decoded.sub && decoded.org_id && decoded.role && typeof decoded.sub === 'string') {
          req.user = { id: decoded.sub, orgId: decoded.org_id, role: decoded.role, email: decoded.email };
          return next();
        }
      } catch { /* invalid JWT — fall through to dev bypass */ }
    }
    // No Authorization header (or invalid JWT) — use dev bypass
    const devUserId = req.headers['x-dev-user-id'];
    req.user = (devUserId && ALLOWED_DEV_IDS.has(devUserId)) ? DEV_USERS[devUserId] : defaultDev;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });

    if (!decoded.sub || !decoded.org_id || !decoded.role || typeof decoded.sub !== 'string') {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Token contains invalid claims' },
      });
    }

    req.user = { id: decoded.sub, orgId: decoded.org_id, role: decoded.role, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: 'Token expired or invalid' },
    });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
    }

    next();
  };
}

async function setTenantContext(req, res, next) {
  if (!req.user || !req.user.orgId) return next();

  try {
    // Use parameterised $executeRaw (tagged template) to prevent SQL injection
    await prisma.$executeRaw`SET LOCAL app.current_org_id = ${req.user.orgId}`;
    await prisma.$executeRaw`SET LOCAL app.current_user_id = ${req.user.id}`;
  } catch (err) {
    // RLS context is defense-in-depth; app-level filtering is primary
  }
  next();
}

module.exports = { authenticate, authorize, setTenantContext };
