'use strict';

jest.mock('../config/prisma', () => ({
  project: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
}));

const prisma = require('../config/prisma');
const projectService = require('../services/projectService');

// Minimal project shape that satisfies the fmt() function
function makeProject(overrides = {}) {
  return {
    id: 'p1',
    name: 'Alpha Project',
    key: 'ALPH',
    description: null,
    status: 'active',
    phase: 'ACTIVE',
    visibility: 'private',
    color: '#3B82F6',
    ownerId: 'u1',
    divisionId: null,
    verticalId: null,
    startDate: null,
    dueDate: null,
    budget: null,
    expenseHeads: [],
    workflowConfig: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    tasks: [],
    members: [],
    ...overrides,
  };
}

beforeEach(() => jest.clearAllMocks());

// ── list() ──────────────────────────────────────────────────────────────────

describe('projectService.list()', () => {
  it('returns formatted project list with pagination', async () => {
    prisma.project.count.mockResolvedValue(1);
    prisma.project.findMany.mockResolvedValue([makeProject()]);

    const result = await projectService.list('org-1', {}, { isScopeAll: true });

    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('pagination');
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it('returns empty items array when no projects exist', async () => {
    prisma.project.count.mockResolvedValue(0);
    prisma.project.findMany.mockResolvedValue([]);

    const result = await projectService.list('org-1', {}, { isScopeAll: true });

    expect(result.items).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });

  it('formats owner and member fields correctly', async () => {
    prisma.project.count.mockResolvedValue(1);
    prisma.project.findMany.mockResolvedValue([
      makeProject({
        members: [
          {
            role: 'project_manager',
            user: { id: 'u1', firstName: 'Jane', lastName: 'Doe', avatarUrl: null },
          },
        ],
        tasks: [
          { id: 't1', completedAt: null },
          { id: 't2', completedAt: new Date() },
        ],
      }),
    ]);

    const result = await projectService.list('org-1', {}, { isScopeAll: true });
    const item = result.items[0];

    expect(item.member_count).toBe(1);
    expect(item.task_count).toBe(2);
    expect(item.completed).toBe(1);
    expect(item.members[0].name).toBe('Jane Doe');
    expect(item.members[0].role).toBe('project_manager');
  });

  it('applies division scope filter when isScopeAll is false and divisionId is set', async () => {
    prisma.project.count.mockResolvedValue(0);
    prisma.project.findMany.mockResolvedValue([]);

    await projectService.list('org-1', {}, { isScopeAll: false, divisionId: 'div-1' });

    const findManyCall = prisma.project.findMany.mock.calls[0][0];
    expect(findManyCall.where.divisionId).toBe('div-1');
  });

  it('paginates correctly with page and page_size params', async () => {
    prisma.project.count.mockResolvedValue(50);
    prisma.project.findMany.mockResolvedValue([]);

    const result = await projectService.list('org-1', { page: 3, page_size: 10 }, { isScopeAll: true });

    expect(result.pagination.page).toBe(3);
    expect(result.pagination.page_size).toBe(10);
    expect(result.pagination.total_pages).toBe(5);
    const findManyCall = prisma.project.findMany.mock.calls[0][0];
    expect(findManyCall.skip).toBe(20);
    expect(findManyCall.take).toBe(10);
  });
});

// ── getById() ───────────────────────────────────────────────────────────────

describe('projectService.getById()', () => {
  it('throws when project is not found', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(projectService.getById('org-1', 'nonexistent')).rejects.toThrow('Project not found');
  });

  it('throws an ApiError with 404 status when not found', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    try {
      await projectService.getById('org-1', 'nonexistent');
      fail('Expected error was not thrown');
    } catch (err) {
      expect(err.statusCode).toBe(404);
    }
  });

  it('returns formatted project when found', async () => {
    const project = makeProject({ id: 'p-found', name: 'Found Project' });
    prisma.project.findFirst.mockResolvedValue(project);

    const result = await projectService.getById('org-1', 'p-found');

    expect(result.id).toBe('p-found');
    expect(result.name).toBe('Found Project');
    expect(result).toHaveProperty('key');
    expect(result).toHaveProperty('status');
  });

  it('queries with correct orgId and projectId filters', async () => {
    prisma.project.findFirst.mockResolvedValue(makeProject());

    await projectService.getById('org-abc', 'proj-xyz');

    const call = prisma.project.findFirst.mock.calls[0][0];
    expect(call.where.orgId).toBe('org-abc');
    expect(call.where.id).toBe('proj-xyz');
    expect(call.where.deletedAt).toBeNull();
  });
});

// ── create() ────────────────────────────────────────────────────────────────

describe('projectService.create()', () => {
  it('creates a project and returns formatted result', async () => {
    // No active conflict
    prisma.project.findFirst.mockResolvedValueOnce(null);
    // No soft-deleted conflict
    prisma.project.findFirst.mockResolvedValueOnce(null);
    // create returns the new project
    prisma.project.create.mockResolvedValue(makeProject({ id: 'new-proj', name: 'Brand New' }));

    const result = await projectService.create('org-1', 'u1', { name: 'Brand New', visibility: 'private' });

    expect(result.id).toBe('new-proj');
    expect(prisma.project.create).toHaveBeenCalledTimes(1);
  });

  it('throws when project key is already in use', async () => {
    // Active conflict found
    prisma.project.findFirst.mockResolvedValueOnce(makeProject({ key: 'DUPK' }));

    await expect(
      projectService.create('org-1', 'u1', { name: 'Duplicate', key: 'DUPK', visibility: 'private' })
    ).rejects.toThrow('already in use');
  });

  it('adds project_manager_id as member when provided', async () => {
    prisma.project.findFirst.mockResolvedValueOnce(null);
    prisma.project.findFirst.mockResolvedValueOnce(null);
    prisma.project.create.mockResolvedValue(
      makeProject({
        members: [
          { role: 'project_manager', user: { id: 'pm-1', firstName: 'PM', lastName: 'User', avatarUrl: null } },
          { role: 'member', user: { id: 'u1', firstName: 'Creator', lastName: 'User', avatarUrl: null } },
        ],
      })
    );

    await projectService.create('org-1', 'u1', {
      name: 'PM Project',
      project_manager_id: 'pm-1',
      visibility: 'private',
    });

    const createCall = prisma.project.create.mock.calls[0][0];
    const memberRoles = createCall.data.members.create.map((m) => m.role);
    expect(memberRoles).toContain('project_manager');
    expect(memberRoles).toContain('member');
  });
});

// ── update() ────────────────────────────────────────────────────────────────

describe('projectService.update()', () => {
  it('updates name and color', async () => {
    // getById call inside update
    prisma.project.findFirst.mockResolvedValue(makeProject());
    prisma.project.update.mockResolvedValue(makeProject({ name: 'Updated Name', color: '#EF4444' }));

    const result = await projectService.update('org-1', 'p1', { name: 'Updated Name', color: '#EF4444' });

    expect(result.name).toBe('Updated Name');
    expect(result.color).toBe('#EF4444');
  });

  it('throws when project does not exist', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(projectService.update('org-1', 'missing', { name: 'X' })).rejects.toThrow('Project not found');
  });
});

// ── delete() ────────────────────────────────────────────────────────────────

describe('projectService.delete()', () => {
  it('deletes project and returns success', async () => {
    prisma.project.findFirst.mockResolvedValue(makeProject());
    prisma.project.delete.mockResolvedValue({});

    const result = await projectService.delete('org-1', 'p1');

    expect(result).toEqual({ success: true });
    expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
  });

  it('throws when project does not exist', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(projectService.delete('org-1', 'nonexistent')).rejects.toThrow('Project not found');
  });
});
