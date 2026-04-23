const ApiError = require('../utils/ApiError');

const divisionsStore = new Map();
const membersStore = new Map(); // key: `${divisionId}:${userId}`

const DEV_USERS = {
  'dev-org_admin-id':       { id: 'dev-org_admin-id',       name: 'Priya Sharma',  email: 'admin@example.local' },
  'dev-division_admin-id':  { id: 'dev-division_admin-id',  name: 'Vikram Mehta',  email: 'div-admin@example.local' },
  'dev-project_manager-id': { id: 'dev-project_manager-id', name: 'Anjali Singh',  email: 'pm@example.local' },
  'dev-member-id':          { id: 'dev-member-id',          name: 'Ravi Kumar',    email: 'member@example.local' },
  'dev-executive-id':       { id: 'dev-executive-id',       name: 'Sunita Reddy',  email: 'executive@example.local' },
  'dev-viewer-id':          { id: 'dev-viewer-id',          name: 'Arjun Patel',   email: 'viewer@example.local' },
};

// Seed default divisions — IDs match divisionConfigService + projectService
const seedDivisions = [
  {
    id: 'div_engineering', orgId: 'dev-org-id',
    name: 'Engineering', code: 'ENG',
    description: 'Product engineering and development',
    color: '#3B82F6', icon: null,
    parentId: null, managerId: 'dev-project_manager-id',
    budget: 5000000, headCount: 20,
    isActive: true, displayOrder: 1, settings: {},
    createdBy: 'dev-org_admin-id', deletedAt: null,
    createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'div_sales', orgId: 'dev-org-id',
    name: 'Sales & Marketing', code: 'SALES',
    description: 'Sales, marketing, and growth',
    color: '#10B981', icon: null,
    parentId: null, managerId: 'dev-division_admin-id',
    budget: 2000000, headCount: 12,
    isActive: true, displayOrder: 2, settings: {},
    createdBy: 'dev-org_admin-id', deletedAt: null,
    createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'div_hr', orgId: 'dev-org-id',
    name: 'Human Resources', code: 'HR',
    description: 'People operations and HR',
    color: '#F59E0B', icon: null,
    parentId: null, managerId: null,
    budget: 1000000, headCount: 8,
    isActive: true, displayOrder: 3, settings: {},
    createdBy: 'dev-org_admin-id', deletedAt: null,
    createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
  },
];

seedDivisions.forEach((d) => divisionsStore.set(d.id, d));

// Seed some members
const seedMembers = [
  { divisionId: 'div_engineering', userId: 'dev-project_manager-id', role: 'division_admin' },
  { divisionId: 'div_engineering', userId: 'dev-member-id',          role: 'member' },
  { divisionId: 'div_sales',       userId: 'dev-division_admin-id',  role: 'division_admin' },
  { divisionId: 'div_hr',          userId: 'dev-org_admin-id',       role: 'division_admin' },
];

seedMembers.forEach((m) => {
  const key = `${m.divisionId}:${m.userId}`;
  membersStore.set(key, { id: key, divisionId: m.divisionId, userId: m.userId, role: m.role, createdAt: new Date('2026-01-01') });
});

function getMemberCount(divisionId) {
  return [...membersStore.values()].filter((m) => m.divisionId === divisionId).length;
}

function getProjectCount(orgId, divisionId) {
  try {
    const projectService = require('./projectService');
    const all = [...(projectService._store?.values() || [])].filter(
      (p) => p.orgId === orgId && p.divisionId === divisionId && !p.deletedAt
    );
    return all.length;
  } catch {
    return 0;
  }
}

function getChildren(orgId, parentId) {
  return [...divisionsStore.values()]
    .filter((d) => d.orgId === orgId && d.parentId === parentId && !d.deletedAt)
    .map((d) => ({ id: d.id, name: d.name, code: d.code }));
}

function formatDivision(d, opts = {}) {
  const manager = d.managerId ? DEV_USERS[d.managerId] || null : null;
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    code: d.code,
    icon: d.icon,
    color: d.color,
    parent_id: d.parentId || null,
    manager: manager ? { id: manager.id, name: manager.name, email: manager.email } : null,
    budget: d.budget,
    head_count: d.headCount,
    is_active: d.isActive,
    display_order: d.displayOrder,
    settings: d.settings,
    member_count: opts.memberCount ?? getMemberCount(d.id),
    project_count: opts.projectCount ?? 0,
    children: opts.children ?? [],
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  };
}

class DivisionService {
  async create(orgId, userId, data) {
    const { name, description, code, parent_id, manager_id, budget, head_count } = data;

    // Validate code uniqueness
    const existing = [...divisionsStore.values()].find(
      (d) => d.orgId === orgId && d.code === code && !d.deletedAt
    );
    if (existing) throw ApiError.badRequest(`Division code "${code}" already exists`);

    // Validate parent
    if (parent_id) {
      const parent = divisionsStore.get(parent_id);
      if (!parent || parent.orgId !== orgId || parent.deletedAt) throw ApiError.notFound('Parent division not found');
    }

    const id = `div_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const maxOrder = Math.max(0, ...[...divisionsStore.values()].filter((d) => d.orgId === orgId && !d.deletedAt).map((d) => d.displayOrder));

    const division = {
      id, orgId, name, description: description || null, code,
      color: data.color || '#6B7280', icon: null,
      parentId: parent_id || null, managerId: manager_id || null,
      budget: budget ? parseFloat(budget) : null,
      headCount: head_count || null,
      isActive: true, displayOrder: maxOrder + 1, settings: {},
      createdBy: userId, deletedAt: null,
      createdAt: new Date(), updatedAt: new Date(),
    };

    divisionsStore.set(id, division);
    return formatDivision(division, { memberCount: 0, projectCount: 0, children: [] });
  }

  async getById(orgId, divisionId) {
    const d = divisionsStore.get(divisionId);
    if (!d || d.orgId !== orgId || d.deletedAt) throw ApiError.notFound('Division not found');

    const members = [...membersStore.values()]
      .filter((m) => m.divisionId === divisionId)
      .map((m) => {
        const u = DEV_USERS[m.userId] || { id: m.userId, name: 'Unknown', email: '' };
        return { id: m.id, user: u, role: m.role };
      });

    return {
      ...formatDivision(d, { children: getChildren(orgId, divisionId) }),
      members,
    };
  }

  async list(orgId, { search, parent_id, page = 1, page_size = 20 } = {}) {
    let items = [...divisionsStore.values()].filter((d) => d.orgId === orgId && !d.deletedAt);

    if (parent_id !== undefined) {
      items = items.filter((d) => d.parentId === (parent_id || null));
    }
    if (search) {
      items = items.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));
    }

    items.sort((a, b) => a.displayOrder - b.displayOrder);

    const total = items.length;
    const paged = items.slice((page - 1) * page_size, page * page_size);

    return {
      items: paged.map((d) => formatDivision(d, { children: getChildren(orgId, d.id) })),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  async update(orgId, divisionId, data) {
    const d = divisionsStore.get(divisionId);
    if (!d || d.orgId !== orgId || d.deletedAt) throw ApiError.notFound('Division not found');

    if (data.name) d.name = data.name;
    if (data.description !== undefined) d.description = data.description;
    if (data.manager_id !== undefined) d.managerId = data.manager_id || null;
    if (data.budget !== undefined) d.budget = data.budget ? parseFloat(data.budget) : null;
    if (data.head_count !== undefined) d.headCount = data.head_count;
    if (data.color) d.color = data.color;
    d.updatedAt = new Date();

    divisionsStore.set(divisionId, d);
    return formatDivision(d, { children: getChildren(orgId, divisionId) });
  }

  async delete(orgId, divisionId) {
    const d = divisionsStore.get(divisionId);
    if (!d || d.orgId !== orgId || d.deletedAt) throw ApiError.notFound('Division not found');

    const childCount = [...divisionsStore.values()].filter(
      (x) => x.orgId === orgId && x.parentId === divisionId && !x.deletedAt
    ).length;
    if (childCount > 0) throw ApiError.badRequest('Cannot delete division with child divisions');

    d.deletedAt = new Date();
    divisionsStore.set(divisionId, d);
    return { success: true };
  }

  async addMember(orgId, divisionId, userId, role) {
    const d = divisionsStore.get(divisionId);
    if (!d || d.orgId !== orgId || d.deletedAt) throw ApiError.notFound('Division not found');

    const key = `${divisionId}:${userId}`;
    const entry = { id: key, divisionId, userId, role, createdAt: new Date() };
    membersStore.set(key, entry);

    const u = DEV_USERS[userId] || { id: userId, name: 'Unknown', email: '' };
    return { id: key, user: u, role };
  }

  async removeMember(orgId, divisionId, userId) {
    const key = `${divisionId}:${userId}`;
    if (!membersStore.has(key)) throw ApiError.notFound('Member not found in division');
    membersStore.delete(key);
    return { success: true };
  }

  async getHierarchy(orgId) {
    const all = [...divisionsStore.values()]
      .filter((d) => d.orgId === orgId && !d.deletedAt)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const map = {};
    all.forEach((d) => {
      map[d.id] = { ...formatDivision(d), children: [] };
    });

    const roots = [];
    all.forEach((d) => {
      if (d.parentId && map[d.parentId]) {
        map[d.parentId].children.push(map[d.id]);
      } else {
        roots.push(map[d.id]);
      }
    });

    return roots;
  }
}

module.exports = new DivisionService();
