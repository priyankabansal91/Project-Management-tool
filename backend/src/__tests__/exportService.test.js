'use strict';

jest.mock('../queues/exportQueue', () => ({
  exportQueue: { add: jest.fn().mockResolvedValue({ id: 'job-1' }) },
}), { virtual: true });

jest.mock('../config/prisma', () => ({
  export: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  task: { findMany: jest.fn() },
  project: { findMany: jest.fn() },
}));

const prisma = require('../config/prisma');
const exportService = require('../services/exportService');

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const makeExportRecord = (overrides = {}) => ({
  id: 'export-1',
  name: 'Test Export',
  description: 'A test export',
  exportType: 'tasks',
  format: 'csv',
  status: 'pending',
  fileUrl: null,
  fileSize: null,
  recordCount: null,
  errorMessage: null,
  completedAt: null,
  expiresAt: new Date('2025-06-19T00:00:00Z'),
  createdAt: new Date('2025-06-12T00:00:00Z'),
  updatedAt: new Date('2025-06-12T00:00:00Z'),
  ...overrides,
});

// ─────────────────────────────────────────────────────────────
// createExport
// ─────────────────────────────────────────────────────────────
describe('ExportService.createExport()', () => {
  it('creates a DB record and enqueues a job when queue is available', async () => {
    const record = makeExportRecord();
    prisma.export.create.mockResolvedValue(record);
    prisma.export.update.mockResolvedValue({ ...record, status: 'processing' });

    const result = await exportService.createExport('org-1', 'user-1', {
      name: 'Test Export',
      description: 'A test export',
      exportType: 'tasks',
      format: 'csv',
      filters: { projectId: 'proj-1' },
      columns: ['id', 'title'],
    });

    expect(prisma.export.create).toHaveBeenCalledTimes(1);
    expect(prisma.export.update).toHaveBeenCalledWith({
      where: { id: 'export-1' },
      data: { status: 'processing' },
    });
    expect(result.id).toBe('export-1');
    expect(result.export_type).toBe('tasks');
    expect(result.format).toBe('csv');
    expect(result.status).toBe('pending'); // _formatExport uses the original record
  });

  it('throws BadRequest for an invalid format', async () => {
    await expect(
      exportService.createExport('org-1', 'user-1', {
        name: 'Bad',
        exportType: 'tasks',
        format: 'docx',
      })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(prisma.export.create).not.toHaveBeenCalled();
  });

  it('works without optional filters and columns', async () => {
    const record = makeExportRecord({ filters: '{}', columns: '[]' });
    prisma.export.create.mockResolvedValue(record);
    prisma.export.update.mockResolvedValue({ ...record, status: 'processing' });

    const result = await exportService.createExport('org-1', 'user-1', {
      name: 'Minimal',
      exportType: 'projects',
      format: 'json',
    });

    const createCall = prisma.export.create.mock.calls[0][0].data;
    expect(createCall.filters).toBe('{}');
    expect(createCall.columns).toBe('[]');
    expect(result).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────
// getById
// ─────────────────────────────────────────────────────────────
describe('ExportService.getById()', () => {
  it('returns a formatted export when found', async () => {
    const record = makeExportRecord({ status: 'completed' });
    prisma.export.findFirst.mockResolvedValue(record);

    const result = await exportService.getById('org-1', 'export-1');

    expect(prisma.export.findFirst).toHaveBeenCalledWith({
      where: { id: 'export-1', orgId: 'org-1' },
    });
    expect(result.id).toBe('export-1');
    expect(result.status).toBe('completed');
  });

  it('throws NotFound when export does not exist', async () => {
    prisma.export.findFirst.mockResolvedValue(null);

    await expect(exportService.getById('org-1', 'missing')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

// ─────────────────────────────────────────────────────────────
// list
// ─────────────────────────────────────────────────────────────
describe('ExportService.list()', () => {
  it('returns paginated items with default pagination', async () => {
    const records = [makeExportRecord(), makeExportRecord({ id: 'export-2' })];
    prisma.export.findMany.mockResolvedValue(records);
    prisma.export.count.mockResolvedValue(2);

    const result = await exportService.list('org-1');

    expect(result.items).toHaveLength(2);
    expect(result.pagination).toEqual({ page: 1, page_size: 20, total: 2, total_pages: 1 });
  });

  it('applies exportType and status filters', async () => {
    prisma.export.findMany.mockResolvedValue([]);
    prisma.export.count.mockResolvedValue(0);

    await exportService.list('org-1', { exportType: 'tasks', status: 'completed', page: 2, page_size: 10 });

    expect(prisma.export.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orgId: 'org-1', exportType: 'tasks', status: 'completed' },
        skip: 10,
        take: 10,
      })
    );
  });

  it('calculates total_pages correctly', async () => {
    prisma.export.findMany.mockResolvedValue([]);
    prisma.export.count.mockResolvedValue(45);

    const result = await exportService.list('org-1', { page_size: 20 });

    expect(result.pagination.total_pages).toBe(3);
  });

  it('handles string pagination params (from query string)', async () => {
    prisma.export.findMany.mockResolvedValue([]);
    prisma.export.count.mockResolvedValue(0);

    const result = await exportService.list('org-1', { page: '2', page_size: '5' });

    expect(result.pagination.page).toBe(2);
    expect(result.pagination.page_size).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────
// delete
// ─────────────────────────────────────────────────────────────
describe('ExportService.delete()', () => {
  it('deletes an existing export and returns success', async () => {
    const record = makeExportRecord();
    prisma.export.findFirst.mockResolvedValue(record);
    prisma.export.delete.mockResolvedValue(record);

    const result = await exportService.delete('org-1', 'export-1');

    expect(prisma.export.delete).toHaveBeenCalledWith({ where: { id: 'export-1' } });
    expect(result).toEqual({ success: true });
  });

  it('throws NotFound when export does not exist', async () => {
    prisma.export.findFirst.mockResolvedValue(null);

    await expect(exportService.delete('org-1', 'missing')).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(prisma.export.delete).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────
// exportTasks
// ─────────────────────────────────────────────────────────────
describe('ExportService.exportTasks()', () => {
  const mockTask = {
    id: 'task-1',
    title: 'Fix bug',
    description: 'Some bug',
    statusName: 'In Progress',
    priority: 'high',
    dueDate: new Date('2025-07-01'),
    createdAt: new Date('2025-06-01'),
    project: { name: 'Alpha', key: 'ALPHA' },
    assignee: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
  };

  it('exports tasks with default columns and creates a completed record', async () => {
    prisma.task.findMany.mockResolvedValue([mockTask]);
    const record = makeExportRecord({
      exportType: 'tasks',
      status: 'completed',
      recordCount: 1,
    });
    prisma.export.create.mockResolvedValue(record);

    const result = await exportService.exportTasks('org-1', 'user-1', { format: 'csv' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].title).toBe('Fix bug');
    expect(result.data[0].assignee).toBe('Jane Doe');
    expect(result.export.status).toBe('completed');
  });

  it('exports only requested columns', async () => {
    prisma.task.findMany.mockResolvedValue([mockTask]);
    prisma.export.create.mockResolvedValue(makeExportRecord({ status: 'completed' }));

    const result = await exportService.exportTasks('org-1', 'user-1', {
      format: 'json',
      columns: ['id', 'title', 'status'],
    });

    const row = result.data[0];
    expect(Object.keys(row)).toEqual(expect.arrayContaining(['id', 'title', 'status']));
    expect(row.description).toBeUndefined();
    expect(row.priority).toBeUndefined();
  });

  it('applies project and assignee filters', async () => {
    prisma.task.findMany.mockResolvedValue([]);
    prisma.export.create.mockResolvedValue(makeExportRecord({ recordCount: 0 }));

    await exportService.exportTasks('org-1', 'user-1', {
      format: 'csv',
      filters: { projectId: 'proj-1', assigneeId: 'user-2' },
    });

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ projectId: 'proj-1', assigneeId: 'user-2' }),
      })
    );
  });
});

// ─────────────────────────────────────────────────────────────
// exportProjects
// ─────────────────────────────────────────────────────────────
describe('ExportService.exportProjects()', () => {
  const mockProject = {
    id: 'proj-1',
    name: 'Alpha',
    key: 'ALPHA',
    status: 'active',
    visibility: 'private',
    createdAt: new Date('2025-01-01'),
    _count: { tasks: 10, members: 5 },
  };

  it('exports projects with default columns', async () => {
    prisma.project.findMany.mockResolvedValue([mockProject]);
    prisma.export.create.mockResolvedValue(makeExportRecord({ exportType: 'projects', status: 'completed', recordCount: 1 }));

    const result = await exportService.exportProjects('org-1', 'user-1', { format: 'csv' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Alpha');
    expect(result.data[0].taskCount).toBe(10);
    expect(result.data[0].memberCount).toBe(5);
  });

  it('exports only requested columns', async () => {
    prisma.project.findMany.mockResolvedValue([mockProject]);
    prisma.export.create.mockResolvedValue(makeExportRecord({ exportType: 'projects', status: 'completed' }));

    const result = await exportService.exportProjects('org-1', 'user-1', {
      format: 'json',
      columns: ['id', 'name', 'status'],
    });

    const row = result.data[0];
    expect(Object.keys(row)).toEqual(expect.arrayContaining(['id', 'name', 'status']));
    expect(row.taskCount).toBeUndefined();
  });

  it('applies status and visibility filters', async () => {
    prisma.project.findMany.mockResolvedValue([]);
    prisma.export.create.mockResolvedValue(makeExportRecord({ exportType: 'projects', recordCount: 0 }));

    await exportService.exportProjects('org-1', 'user-1', {
      format: 'xlsx',
      filters: { status: 'active', visibility: 'public' },
    });

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'active', visibility: 'public' }),
      })
    );
  });
});
