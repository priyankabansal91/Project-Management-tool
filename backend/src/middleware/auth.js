const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../config/prisma');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = {
      id: decoded.sub,
      orgId: decoded.org_id,
      role: decoded.role,
      email: decoded.email,
    };
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
    await prisma.$executeRawUnsafe(
      `SET LOCAL app.current_org_id = '${req.user.orgId}'`
    );
    await prisma.$executeRawUnsafe(
      `SET LOCAL app.current_user_id = '${req.user.id}'`
    );
  } catch (err) {
    // RLS context is defense-in-depth; app-level filtering is primary
  }
  next();
}

module.exports = { authenticate, authorize, setTenantContext };
