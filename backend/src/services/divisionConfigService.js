// In-memory division config service for development

const DIVISION_METADATA = new Map([
  ['div_engineering', {
    id: 'div_engineering',
    name: 'Engineering',
    color: '#3B82F6',
    description: 'Product engineering and development',
    budget: 5000000,
  }],
  ['div_sales', {
    id: 'div_sales',
    name: 'Sales & Marketing',
    color: '#10B981',
    description: 'Sales, marketing, and growth',
    budget: 2000000,
  }],
  ['div_hr', {
    id: 'div_hr',
    name: 'Human Resources',
    color: '#F59E0B',
    description: 'People operations and HR',
    budget: 1000000,
  }],
]);

// divisionConfigs: Map<divisionId, configObject>
const divisionConfigs = new Map([
  ['div_engineering', {
    workflowTemplate: 'wf_scrum',
    features: {
      timeTracking: true,
      sprints: true,
      calendar: true,
      ai: true,
      exports: true,
      financialDashboard: true,
      okrDashboard: true,
      resourceDashboard: true,
      approvals: true,
      forms: true,
    },
    roleOverrides: {
      member: { task_delete: false, project_create: false },
    },
    reportAccess: {
      download: ['division_admin', 'project_manager'],
      formats: ['pdf', 'csv', 'excel'],
    },
  }],
  ['div_sales', {
    workflowTemplate: 'wf_marketing',
    features: {
      timeTracking: true,
      sprints: false,
      calendar: true,
      ai: false,
      exports: true,
      financialDashboard: true,
      okrDashboard: false,
      resourceDashboard: false,
      approvals: true,
      forms: true,
    },
    roleOverrides: {
      member: { task_delete: false },
    },
    reportAccess: {
      download: ['division_admin', 'project_manager'],
      formats: ['pdf'],
    },
  }],
  ['div_hr', {
    workflowTemplate: 'wf_kanban',
    features: {
      timeTracking: true,
      sprints: false,
      calendar: true,
      ai: false,
      exports: false,
      financialDashboard: false,
      okrDashboard: false,
      resourceDashboard: true,
      approvals: true,
      forms: true,
    },
    roleOverrides: {
      member: { task_delete: false, time_edit: false },
    },
    reportAccess: {
      download: ['division_admin'],
      formats: ['pdf'],
    },
  }],
]);

// divisionMemberships: Map<userId, Array<{ divisionId, role }>>
const divisionMemberships = new Map([
  ['dev-org_admin-id', [
    { divisionId: 'div_engineering', role: 'division_admin' },
    { divisionId: 'div_sales', role: 'division_admin' },
    { divisionId: 'div_hr', role: 'division_admin' },
  ]],
  ['dev-division_admin-id', [
    { divisionId: 'div_engineering', role: 'division_admin' },
  ]],
  ['dev-project_manager-id', [
    { divisionId: 'div_engineering', role: 'project_manager' },
  ]],
  ['dev-member-id', [
    { divisionId: 'div_engineering', role: 'member' },
  ]],
  ['dev-viewer-id', [
    { divisionId: 'div_engineering', role: 'viewer' },
    { divisionId: 'div_sales', role: 'viewer' },
    { divisionId: 'div_hr', role: 'viewer' },
  ]],
  ['dev-executive-id', [
    { divisionId: 'div_engineering', role: 'viewer' },
    { divisionId: 'div_sales', role: 'viewer' },
    { divisionId: 'div_hr', role: 'viewer' },
  ]],
]);

const SCOPE_ALL_ROLES = new Set(['org_admin', 'executive']);

class DivisionConfigService {
  /**
   * Returns [{ divisionId, role, divisionName }] for the given user.
   */
  getUserDivisions(userId) {
    const memberships = divisionMemberships.get(userId) || [];
    return memberships.map(({ divisionId, role }) => {
      const meta = DIVISION_METADATA.get(divisionId);
      return { divisionId, role, divisionName: meta ? meta.name : divisionId };
    });
  }

  /**
   * Returns feature flags + role overrides for a division.
   */
  getDivisionConfig(divisionId) {
    const config = divisionConfigs.get(divisionId);
    if (!config) return null;
    const meta = DIVISION_METADATA.get(divisionId);
    return { divisionId, ...(meta || {}), ...config };
  }

  /**
   * Updates division config in-memory.
   */
  updateDivisionConfig(divisionId, config, updatedBy) {
    const existing = divisionConfigs.get(divisionId);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...config,
      features: { ...existing.features, ...(config.features || {}) },
      roleOverrides: { ...existing.roleOverrides, ...(config.roleOverrides || {}) },
      reportAccess: { ...existing.reportAccess, ...(config.reportAccess || {}) },
      updatedBy,
      updatedAt: new Date(),
    };
    divisionConfigs.set(divisionId, updated);
    return this.getDivisionConfig(divisionId);
  }

  /**
   * Returns all division metadata (without configs).
   */
  getAllDivisions() {
    return Array.from(DIVISION_METADATA.values());
  }

  /**
   * Returns members of a division: [{ userId, role }]
   */
  getDivisionMembers(divisionId) {
    const members = [];
    for (const [userId, memberships] of divisionMemberships.entries()) {
      for (const m of memberships) {
        if (m.divisionId === divisionId) {
          members.push({ userId, role: m.role });
        }
      }
    }
    return members;
  }

  /**
   * Assigns a user to a division with a given role.
   * If already a member, updates the role.
   */
  assignUserToDivision(userId, divisionId, role) {
    if (!DIVISION_METADATA.has(divisionId)) return null;
    const memberships = divisionMemberships.get(userId) || [];
    const idx = memberships.findIndex((m) => m.divisionId === divisionId);
    if (idx >= 0) {
      memberships[idx].role = role;
    } else {
      memberships.push({ divisionId, role });
    }
    divisionMemberships.set(userId, memberships);
    return { userId, divisionId, role };
  }

  /**
   * Removes a user from a division.
   */
  removeUserFromDivision(userId, divisionId) {
    const memberships = divisionMemberships.get(userId) || [];
    const updated = memberships.filter((m) => m.divisionId !== divisionId);
    divisionMemberships.set(userId, updated);
    return { success: true };
  }

  /**
   * Returns true if the role has org-wide (all-division) scope.
   */
  isScopeAll(userRole) {
    return SCOPE_ALL_ROLES.has(userRole);
  }

  /**
   * Returns handoff readiness for a division:
   * checks whether workflow, admin, members, features, and role overrides are configured.
   */
  getHandoffStatus(divisionId) {
    const config = divisionConfigs.get(divisionId);
    const meta = DIVISION_METADATA.get(divisionId);
    if (!config || !meta) return null;

    const members = this.getDivisionMembers(divisionId);
    const checks = {
      hasWorkflow:        !!config.workflowTemplate,
      hasDivisionAdmin:   members.some((m) => m.role === 'division_admin'),
      hasMembers:         members.length >= 2,
      featuresConfigured: Object.values(config.features || {}).filter(Boolean).length >= 3,
      roleOverridesSet:   Object.keys(config.roleOverrides || {}).some(
                            (r) => Object.keys(config.roleOverrides[r] || {}).length > 0
                          ),
    };
    const readyScore  = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    return {
      divisionId,
      name: meta.name,
      checks,
      readyScore,
      totalChecks,
      isReady: readyScore === totalChecks,
      workflowTemplate: config.workflowTemplate || null,
    };
  }

  /**
   * Returns handoff status for all divisions.
   */
  getAllHandoffStatuses() {
    return Array.from(DIVISION_METADATA.keys()).map((id) => this.getHandoffStatus(id));
  }
}

module.exports = new DivisionConfigService();
module.exports.DIVISION_METADATA = DIVISION_METADATA;
