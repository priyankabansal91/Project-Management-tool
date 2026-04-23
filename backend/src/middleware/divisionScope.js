const divisionConfigService = require('../services/divisionConfigService');

/**
 * Middleware that attaches division scope information to the request.
 *
 * Attaches:
 *   req.userDivisions    — array of divisionIds the user belongs to
 *   req.isScopeAll       — true if the user's role is org_admin or executive
 *   req.currentDivisionId — from ?division_id= query param, or first division in user's list
 */
function divisionScope(req, res, next) {
  if (!req.user) return next();

  const userDivisionData = divisionConfigService.getUserDivisions(req.user.id);
  req.userDivisions = userDivisionData.map((d) => d.divisionId);
  req.isScopeAll = divisionConfigService.isScopeAll(req.user.role);
  req.currentDivisionId = req.query.division_id || req.userDivisions[0] || null;

  next();
}

module.exports = divisionScope;
