const ApiError = require('../utils/ApiError');

// In-memory storage for development (until database is set up)
const projectsStore = new Map();

// Create some default projects for development
const defaultProjects = [
  {
    id: 'proj_default_1',
    orgId: 'dev-org-id',
    name: 'Sample Project',
    key: 'SAMPLE',
    description: 'A sample project to get started',
    status: 'active',
    visibility: 'private',
    color: '#3B82F6',
    ownerId: 'dev-user-id',
    startDate: new Date(2026, 0, 1),
    dueDate: new Date(2026, 11, 31),
    createdBy: 'dev-user-id',
    createdAt: new Date(2026, 0, 1),
    updatedAt: new Date(2026, 0, 1),
    deletedAt: null,
    members: [
      { id: 'dev-user-id', name: 'Dev User', avatar_url: null, role: 'project_manager' }
    ],
    taskCount: 0,
  }
];

// Initialize with default projects
defaultProjects.forEach(p => projectsStore.set(p.id, p));

class ProjectService {
  async list(orgId, { status, search, page = 1, page_size = 20 }) {
    let items = Array.from(projectsStore.values())
      .filter(p => p.orgId === orgId && !p.deletedAt);

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
        start_date: p.startDate,
        due_date: p.dueDate,
        member_count: p.members?.length || 0,
        task_count: p.taskCount || 0,
        completed: 0,
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

  async create(orgId, userId, data) {
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const project = {
      id: projectId,
      orgId,
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
}

module.exports = new ProjectService();
