'use strict';

// ─── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('../config/prisma', () => ({
  task: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  project: {
    findFirst: jest.fn(),
  },
  workflowConfig: {
    findFirst: jest.fn(),
  },
}));

// ─── Setup ───────────────────────────────────────────────────────────────────

const prisma = require('../config/prisma');
const taskService = require('../services/taskService');

beforeEach(() => jest.clearAllMocks());

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTask(overrides = {}) {
  return {
    id: 't1',
    orgId: 'org-1',
    projectId: 'proj-1',
    seqNumber: 1,
    title: 'Test Task',
    description: null,
    statusId: 'backlog',
    statusName: 'Backlog',
    priority: 'medium',
    assigneeId: null,
    reporterId: 'u1',
    dueDate: null,
    startDate: null,
    estimatedHours: null,
    loggedHours: 0,
    tags: [],
    customFields: {},
    position: 10,
    sprintId: null,
    milestoneId: null,
    dependsOnId: null,
    dependsOn: null,
    blockedReason: null,
    isArchived: false,
    completedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    assignee: null,
    reporter: { id: 'u1', firstName: 'Jane', lastName: 'Doe', avatarUrl: null },
    project: { id: 'proj-1', key: 'TST', name: 'Test Project', color: '#3B82F6' },
    _count: { comments: 0, subtasks: 0, dependents: 0 },
    ...overrides,
  };
}

// ─── listByProject() ─────────────────────────────────────────────────────────

describe('taskService.listByProject()', () => {
  it('returns paginated items in list view', async () => {
    prisma.task.findMany.mockResolvedValue([makeTask()]);
    prisma.task.count.mockResolvedValue(1);

    const result = await taskService.listByProject('org-1', 'proj-1');

    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('pagination');
    expect(result.items).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.items[0]).toHaveProperty('task_key', 'TST-1');
  });

  it('returns empty items when no tasks exist', async () => {
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);

    const result = await taskService.listByProject('org-1', 'proj-1');

    expect(result.items).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });

  it('builds kanban columns grouped by status_id', async () => {
    prisma.task.findMany.mockResolvedValue([makeTask({ statusId: 'todo', statusName: 'To Do' })]);
    prisma.task.count.mockResolvedValue(1);
    prisma.project.findFirst.mockResolvedValue({
      workflowConfig: null,
    });
    prisma.workflowConfig.findFirst.mockResolvedValue(null);

    const result = await taskService.listByProject('org-1', 'proj-1', { view: 'kanban' });

    expect(result).toHaveProperty('columns');
    expect(Array.isArray(result.columns)).toBe(true);
    // Default 5 columns
    expect(result.columns).toHaveLength(5);
    const todoCol = result.columns.find((c) => c.id === 'todo');
    expect(todoCol).toBeDefined();
    expect(todoCol.tasks).toHaveLength(1);
  });

  it('uses project workflow statuses for kanban columns when available', async () => {
    const customStatuses = [
      { id: 'open', name: 'Open', color: '#aaa', order: 1 },
      { id: 'closed', name: 'Closed', color: '#bbb', order: 2 },
    ];
    prisma.task.findMany.mockResolvedValue([makeTask({ statusId: 'open', statusName: 'Open' })]);
    prisma.task.count.mockResolvedValue(1);
    prisma.project.findFirst.mockResolvedValue({
      workflowConfig: { statuses: customStatuses },
    });

    const result = await taskService.listByProject('org-1', 'proj-1', { view: 'kanban' });

    expect(result.columns).toHaveLength(2);
    expect(result.columns[0].id).toBe('open');
    expect(result.columns[0].tasks).toHaveLength(1);
  });

  it('applies status_id filter to the where clause', async () => {
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);

    await taskService.listByProject('org-1', 'proj-1', { status_id: 'in_progress' });

    const call = prisma.task.findMany.mock.calls[0][0];
    expect(call.where.statusId).toBe('in_progress');
  });

  it('applies search filter as case-insensitive title contains', async () => {
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);

    await taskService.listByProject('org-1', 'proj-1', { search: 'alpha' });

    const call = prisma.task.findMany.mock.calls[0][0];
    expect(call.where.title).toEqual({ contains: 'alpha', mode: 'insensitive' });
  });

  it('paginates correctly with skip/take', async () => {
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(100);

    await taskService.listByProject('org-1', 'proj-1', { page: 3, page_size: 10 });

    const call = prisma.task.findMany.mock.calls[0][0];
    expect(call.skip).toBe(20);
    expect(call.take).toBe(10);
  });
});

// ─── getById() ───────────────────────────────────────────────────────────────

describe('taskService.getById()', () => {
  it('returns the raw task record when found', async () => {
    const task = makeTask({ id: 't-found' });
    prisma.task.findFirst.mockResolvedValue(task);

    const result = await taskService.getById('org-1', 't-found');

    expect(result.id).toBe('t-found');
    expect(prisma.task.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 't-found', orgId: 'org-1', deletedAt: null }) })
    );
  });

  it('throws 404 ApiError when task does not exist', async () => {
    prisma.task.findFirst.mockResolvedValue(null);

    try {
      await taskService.getById('org-1', 'nonexistent');
      throw new Error('Expected error was not thrown');
    } catch (err) {
      expect(err.statusCode).toBe(404);
      expect(err.message).toMatch(/not found/i);
    }
  });
});

// ─── create() ────────────────────────────────────────────────────────────────

describe('taskService.create()', () => {
  function setupCreateMocks(seqMax = 0, countInStatus = 0) {
    prisma.task.aggregate.mockResolvedValue({ _max: { seqNumber: seqMax } });
    prisma.task.count.mockResolvedValue(countInStatus);
    prisma.task.create.mockResolvedValue(makeTask({ seqNumber: seqMax + 1 }));
  }

  it('creates a task with auto-incremented seqNumber', async () => {
    setupCreateMocks(5, 2);

    const result = await taskService.create('org-1', 'proj-1', 'u1', { title: 'New Task' });

    expect(result.seq_number).toBe(6);
    expect(prisma.task.create).toHaveBeenCalledTimes(1);
  });

  it('uses seqNumber = 1 when no tasks exist yet', async () => {
    setupCreateMocks(null, 0);

    await taskService.create('org-1', 'proj-1', 'u1', { title: 'First Task' });

    const createCall = prisma.task.create.mock.calls[0][0];
    expect(createCall.data.seqNumber).toBe(1);
  });

  it('defaults statusId to "backlog" when status_id is not provided', async () => {
    setupCreateMocks(0, 0);

    await taskService.create('org-1', 'proj-1', 'u1', { title: 'Task' });

    const createCall = prisma.task.create.mock.calls[0][0];
    expect(createCall.data.statusId).toBe('backlog');
  });

  it('sets reporterId to the calling userId', async () => {
    setupCreateMocks(0, 0);

    await taskService.create('org-1', 'proj-1', 'reporter-user', { title: 'Task' });

    const createCall = prisma.task.create.mock.calls[0][0];
    expect(createCall.data.reporterId).toBe('reporter-user');
    expect(createCall.data.createdBy).toBe('reporter-user');
  });

  it('stores optional fields when provided', async () => {
    setupCreateMocks(0, 0);

    await taskService.create('org-1', 'proj-1', 'u1', {
      title: 'Full Task',
      description: 'Desc',
      status_id: 'todo',
      status_name: 'To Do',
      priority: 'high',
      assignee_id: 'a1',
      due_date: '2025-01-01',
      estimated_hours: 8,
      tags: ['backend'],
      milestone_id: 'm1',
    });

    const createCall = prisma.task.create.mock.calls[0][0];
    expect(createCall.data.statusId).toBe('todo');
    expect(createCall.data.priority).toBe('high');
    expect(createCall.data.assigneeId).toBe('a1');
    expect(createCall.data.estimatedHours).toBe(8);
    expect(createCall.data.tags).toEqual(['backend']);
    expect(createCall.data.milestoneId).toBe('m1');
  });

  it('returns formatted task with task_key', async () => {
    setupCreateMocks(0, 0);

    const result = await taskService.create('org-1', 'proj-1', 'u1', { title: 'Task' });

    expect(result).toHaveProperty('task_key');
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('title');
  });
});

// ─── update() ────────────────────────────────────────────────────────────────

describe('taskService.update()', () => {
  it('updates task fields and returns formatted result', async () => {
    const existing = makeTask();
    prisma.task.findFirst.mockResolvedValue(existing);
    prisma.task.update.mockResolvedValue(makeTask({ title: 'Updated', priority: 'high' }));

    const result = await taskService.update('org-1', 't1', { title: 'Updated', priority: 'high' });

    expect(result.title).toBe('Updated');
    expect(result.priority).toBe('high');
    expect(prisma.task.update).toHaveBeenCalledTimes(1);
  });

  it('throws 404 when task does not exist', async () => {
    prisma.task.findFirst.mockResolvedValue(null);

    await expect(taskService.update('org-1', 'missing', { title: 'X' })).rejects.toMatchObject({ statusCode: 404 });
  });

  it('sets completedAt when completed_at is provided in data', async () => {
    prisma.task.findFirst.mockResolvedValue(makeTask());
    prisma.task.update.mockResolvedValue(makeTask({ completedAt: new Date('2025-01-01') }));

    await taskService.update('org-1', 't1', { completed_at: '2025-01-01' });

    const updateCall = prisma.task.update.mock.calls[0][0];
    expect(updateCall.data).toHaveProperty('completedAt');
  });

  it('only patches provided fields (does not overwrite others)', async () => {
    prisma.task.findFirst.mockResolvedValue(makeTask());
    prisma.task.update.mockResolvedValue(makeTask({ title: 'Only Title Changed' }));

    await taskService.update('org-1', 't1', { title: 'Only Title Changed' });

    const updateCall = prisma.task.update.mock.calls[0][0];
    // priority was not provided, so it should not appear in the update data
    expect(updateCall.data).not.toHaveProperty('priority');
  });
});

// ─── moveTask() ──────────────────────────────────────────────────────────────

describe('taskService.moveTask()', () => {
  it('moves task to a new status and updates position', async () => {
    const existing = makeTask({ dependsOnId: null });
    prisma.task.findFirst.mockResolvedValue(existing);
    prisma.task.update.mockResolvedValue(makeTask({ statusId: 'in_progress', statusName: 'In Progress', position: 20 }));

    const result = await taskService.moveTask('org-1', 't1', {
      status_id: 'in_progress',
      status_name: 'In Progress',
      position: 20,
    });

    expect(result.status_id).toBe('in_progress');
    expect(result.position).toBe(20);
    expect(prisma.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 't1' },
        data: expect.objectContaining({ statusId: 'in_progress', position: 20 }),
      })
    );
  });

  it('sets completedAt when moving to "done" status', async () => {
    const existing = makeTask({ completedAt: null });
    prisma.task.findFirst.mockResolvedValue(existing);
    prisma.task.update.mockResolvedValue(makeTask({ statusId: 'done', completedAt: new Date() }));

    await taskService.moveTask('org-1', 't1', {
      status_id: 'done',
      status_name: 'Done',
      position: 100,
    });

    const updateCall = prisma.task.update.mock.calls[0][0];
    expect(updateCall.data.completedAt).toBeInstanceOf(Date);
  });

  it('clears completedAt when moving from done to a non-final status', async () => {
    const existing = makeTask({ completedAt: new Date(), statusName: 'Done' });
    prisma.task.findFirst.mockResolvedValue(existing);
    prisma.task.update.mockResolvedValue(makeTask({ statusId: 'in_progress', completedAt: null }));

    await taskService.moveTask('org-1', 't1', {
      status_id: 'in_progress',
      status_name: 'In Progress',
      position: 10,
    });

    const updateCall = prisma.task.update.mock.calls[0][0];
    expect(updateCall.data.completedAt).toBeNull();
  });

  it('throws 422 when task has an unresolved dependency', async () => {
    const existing = makeTask({ dependsOnId: 'dep-task' });
    prisma.task.findFirst.mockResolvedValue(existing);
    prisma.task.findUnique.mockResolvedValue({
      completedAt: null,
      title: 'Blocking Task',
      seqNumber: 2,
      project: { key: 'TST' },
    });

    await expect(
      taskService.moveTask('org-1', 't1', {
        status_id: 'in_progress',
        status_name: 'In Progress',
        position: 10,
      })
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  it('allows move to initial status even when dependency is unresolved', async () => {
    const existing = makeTask({ dependsOnId: 'dep-task' });
    prisma.task.findFirst.mockResolvedValue(existing);
    prisma.task.update.mockResolvedValue(makeTask({ statusId: 'backlog' }));

    // Moving to 'backlog' (initial status) should not check dependency
    const result = await taskService.moveTask('org-1', 't1', {
      status_id: 'backlog',
      status_name: 'Backlog',
      position: 10,
    });

    expect(result.status_id).toBe('backlog');
    // findUnique for the dependency task should NOT be called
    expect(prisma.task.findUnique).not.toHaveBeenCalled();
  });

  it('throws 404 when task does not exist', async () => {
    prisma.task.findFirst.mockResolvedValue(null);

    await expect(
      taskService.moveTask('org-1', 'missing', { status_id: 'done', status_name: 'Done', position: 1 })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─── delete() ────────────────────────────────────────────────────────────────

describe('taskService.delete()', () => {
  it('soft-deletes the task and returns { success: true }', async () => {
    prisma.task.findFirst.mockResolvedValue(makeTask());
    prisma.task.update.mockResolvedValue({});

    const result = await taskService.delete('org-1', 't1');

    expect(result).toEqual({ success: true });
    expect(prisma.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 't1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      })
    );
  });

  it('throws 404 when task does not exist', async () => {
    prisma.task.findFirst.mockResolvedValue(null);

    await expect(taskService.delete('org-1', 'nonexistent')).rejects.toMatchObject({ statusCode: 404 });
    expect(prisma.task.update).not.toHaveBeenCalled();
  });
});
