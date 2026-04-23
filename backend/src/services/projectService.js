const ApiError = require('../utils/ApiError');

// In-memory storage for development (until database is set up)
const projectsStore = new Map();

// Create some default projects for development
const defaultProjects = [
  {
    id: 'proj_default_1',
    orgId: 'dev-org-id',
    divisionId: 'div_engineering',
    name: 'Sample Project',
    key: 'SAMPLE',
    description: 'A sample project to get started',
    status: 'active',
    visibility: 'private',
    color: '#3B82F6',
    ownerId: 'dev-org_admin-id',
    startDate: new Date(2026, 0, 1),
    dueDate: new Date(2026, 11, 31),
    createdBy: 'dev-org_admin-id',
    createdAt: new Date(2026, 0, 1),
    updatedAt: new Date(2026, 0, 1),
    deletedAt: null,
    members: [
      { id: 'dev-org_admin-id', name: 'Priya Sharma', avatar_url: null, role: 'project_manager' }
    ],
    taskCount: 4,
    completedCount: 1,
  },
  {
    id: 'proj_sales_1',
    orgId: 'dev-org-id',
    divisionId: 'div_sales',
    name: 'Q2 Lead Campaign',
    key: 'SALES',
    description: 'Q2 sales lead generation campaign',
    status: 'active',
    visibility: 'private',
    color: '#10B981',
    ownerId: 'dev-org_admin-id',
    startDate: new Date(2026, 3, 1),
    dueDate: new Date(2026, 5, 30),
    createdBy: 'dev-org_admin-id',
    createdAt: new Date(2026, 3, 1),
    updatedAt: new Date(2026, 3, 1),
    deletedAt: null,
    members: [
      { id: 'dev-org_admin-id', name: 'Priya Sharma', avatar_url: null, role: 'project_manager' }
    ],
    taskCount: 0,
  },
  {
    id: 'proj_hr_1',
    orgId: 'dev-org-id',
    divisionId: 'div_hr',
    name: 'Annual Review 2026',
    key: 'HR26',
    description: 'Annual performance review cycle 2026',
    status: 'active',
    visibility: 'private',
    color: '#F59E0B',
    ownerId: 'dev-org_admin-id',
    startDate: new Date(2026, 0, 1),
    dueDate: new Date(2026, 2, 31),
    createdBy: 'dev-org_admin-id',
    createdAt: new Date(2026, 0, 1),
    updatedAt: new Date(2026, 0, 1),
    deletedAt: null,
    members: [
      { id: 'dev-org_admin-id', name: 'Priya Sharma', avatar_url: null, role: 'project_manager' }
    ],
    taskCount: 0,
  },
  {
    id: 'proj_eng_2',
    orgId: 'dev-org-id',
    divisionId: 'div_engineering',
    name: 'API Platform v3',
    key: 'APIV3',
    description: 'Next generation API platform development',
    status: 'active',
    visibility: 'private',
    color: '#8B5CF6',
    ownerId: 'dev-project_manager-id',
    startDate: new Date(2026, 1, 1),
    dueDate: new Date(2026, 8, 30),
    createdBy: 'dev-project_manager-id',
    createdAt: new Date(2026, 1, 1),
    updatedAt: new Date(2026, 1, 1),
    deletedAt: null,
    members: [
      { id: 'dev-project_manager-id', name: 'Anjali Singh', avatar_url: null, role: 'project_manager' },
      { id: 'dev-member-id', name: 'Ravi Kumar', avatar_url: null, role: 'member' }
    ],
    taskCount: 2,
    completedCount: 0,
  },
];

// Initialize with default projects
defaultProjects.forEach(p => projectsStore.set(p.id, p));

class ProjectService {
  async list(orgId, { status, search, page = 1, page_size = 20 } = {}, divisionScope = {}) {
    let items = Array.from(projectsStore.values())
      .filter(p => p.orgId === orgId && !p.deletedAt);

    // Apply division scoping
    const { userDivisions, isScopeAll, divisionId } = divisionScope;
    if (!isScopeAll) {
      if (divisionId) {
        items = items.filter(p => p.divisionId === divisionId);
      } else if (userDivisions && userDivisions.length > 0) {
        items = items.filter(p => userDivisions.includes(p.divisionId));
      }
    }

    if (status) items = items.filter(p => p.status === status);
    if (search) items = items.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    items.sort((a, b) => b.updatedAt - a.updatedAt);

    const total = items.length;
    const paginatedItems = items.slice((page - 1) * page_size, page * page_size);

    return {
      items: paginatedItems.map((p) => ({
        id: p.id,
        name: p.name,
        key: p.key,
        description: p.description,
        status: p.status,
        visibility: p.visibility,
        color: p.color,
        owner_id: p.ownerId,
        division_id: p.divisionId || null,
        start_date: p.startDate,
        due_date: p.dueDate,
        member_count: p.members?.length || 0,
        task_count: p.taskCount || 0,
        completed: p.completedCount || 0,
        members: p.members || [],
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      })),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  async getById(orgId, projectId) {
    const project = projectsStore.get(projectId);
    if (!project || project.orgId !== orgId || project.deletedAt) {
      throw ApiError.notFound('Project not found');
    }
    return project;
  }

  async create(orgId, userId, data, divisionId = null) {
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const project = {
      id: projectId,
      orgId,
      divisionId: data.division_id || divisionId || null,
      name: data.name,
      description: data.description || '',
      key: data.key || data.name.substring(0, 3).toUpperCase(),
      visibility: data.visibility || 'private',
      color: data.color || '#3B82F6',
      ownerId: userId,
      startDate: data.start_date ? new Date(data.start_date) : null,
      dueDate: data.due_date ? new Date(data.due_date) : null,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      status: 'active',
      members: [
        { id: userId, name: 'Dev User', avatar_url: null, role: 'project_manager' }
      ],
      taskCount: 0,
    };

    projectsStore.set(projectId, project);
    return project;
  }

  async update(orgId, projectId, data) {
    const project = projectsStore.get(projectId);
    if (!project || project.orgId !== orgId || project.deletedAt) {
      throw ApiError.notFound('Project not found');
    }

    if (data.name) project.name = data.name;
    if (data.description !== undefined) project.description = data.description;
    if (data.status) project.status = data.status;
    if (data.visibility) project.visibility = data.visibility;
    if (data.color) project.color = data.color;
    if (data.due_date !== undefined) project.dueDate = data.due_date ? new Date(data.due_date) : null;
    project.updatedAt = new Date();

    projectsStore.set(projectId, project);
    return project;
  }

  async delete(orgId, projectId) {
    const project = projectsStore.get(projectId);
    if (!project || project.orgId !== orgId || project.deletedAt) {
      throw ApiError.notFound('Project not found');
    }

    project.deletedAt = new Date();
    projectsStore.set(projectId, project);
    return { success: true };
  }

  incrementTaskCount(orgId, projectId) {
    const project = projectsStore.get(projectId);
    if (project && project.orgId === orgId && !project.deletedAt) {
      project.taskCount = (project.taskCount || 0) + 1;
      project.updatedAt = new Date();
      projectsStore.set(projectId, project);
    }
  }

  decrementTaskCount(orgId, projectId) {
    const project = projectsStore.get(projectId);
    if (project && project.orgId === orgId && !project.deletedAt) {
      project.taskCount = Math.max(0, (project.taskCount || 0) - 1);
      project.updatedAt = new Date();
      projectsStore.set(projectId, project);
    }
  }

  updateCompletedCount(orgId, projectId, delta) {
    const project = projectsStore.get(projectId);
    if (project && project.orgId === orgId && !project.deletedAt) {
      project.completedCount = Math.max(0, (project.completedCount || 0) + delta);
      project.updatedAt = new Date();
      projectsStore.set(projectId, project);
    }
  }
}

module.exports = new ProjectService();
