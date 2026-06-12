'use strict';

jest.mock('../config/prisma', () => ({
  entityVersion: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  snapshot: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
}));

const prisma = require('../config/prisma');
const versioningService = require('../services/versioningService');

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const makeVersionRecord = (overrides = {}) => ({
  id: 'ver-1',
  orgId: 'org-1',
  entityType: 'task',
  entityId: 'task-1',
  version: 1,
  data: JSON.stringify({ title: 'My Task', status: 'todo' }),
  changes: null,
  changedBy: 'user-1',
  changeReason: null,
  createdAt: new Date('2025-06-12T00:00:00Z'),
  ...overrides,
});

const makeSnapshotRecord = (overrides = {}) => ({
  id: 'snap-1',
  orgId: 'org-1',
  name: 'Sprint 1 Snapshot',
  description: 'End of sprint snapshot',
  snapshotType: 'sprint',
  data: JSON.stringify({ totalTasks: 10, completedTasks: 8 }),
  createdBy: 'user-1',
  createdAt: new Date('2025-06-12T00:00:00Z'),
  ...overrides,
});

// ─────────────────────────────────────────────────────────────
// createVersion
// ─────────────────────────────────────────────────────────────
describe('VersioningService.createVersion()', () => {
  it('creates version 1 when no previous version exists', async () => {
    prisma.entityVersion.findFirst.mockResolvedValue(null); // no prior version
    const record = makeVersionRecord({ version: 1, changes: null });
    prisma.entityVersion.create.mockResolvedValue(record);

    const result = await versioningService.createVersion(
      'org-1', 'task', 'task-1',
      { title: 'My Task', status: 'todo' },
      'user-1'
    );

    expect(prisma.entityVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orgId: 'org-1',
        entityType: 'task',
        entityId: 'task-1',
        version: 1,
        changedBy: 'user-1',
        changeReason: null,
      }),
    });
    expect(result.version).toBe(1);
    expect(result.changes).toBeNull();
    expect(result.data).toEqual({ title: 'My Task', status: 'todo' });
  });

  it('increments version and calculates changes when prior version exists', async () => {
    const prior = makeVersionRecord({
      version: 2,
      data: JSON.stringify({ title: 'Old Title', status: 'todo' }),
    });
    prisma.entityVersion.findFirst.mockResolvedValue(prior);

    const newData = { title: 'New Title', status: 'in_progress' };
    const expectedChanges = {
      title: { old: 'Old Title', new: 'New Title' },
      status: { old: 'todo', new: 'in_progress' },
    };
    const record = makeVersionRecord({
      version: 3,
      data: JSON.stringify(newData),
      changes: JSON.stringify(expectedChanges),
    });
    prisma.entityVersion.create.mockResolvedValue(record);

    const result = await versioningService.createVersion(
      'org-1', 'task', 'task-1', newData, 'user-1', 'Updated title and status'
    );

    expect(prisma.entityVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        version: 3,
        changeReason: 'Updated title and status',
        changes: JSON.stringify(expectedChanges),
      }),
    });
    expect(result.version).toBe(3);
    expect(result.changes).toEqual(expectedChanges);
  });

  it('stores null changes when data is identical to prior version', async () => {
    const dataObj = { title: 'Same', status: 'todo' };
    const prior = makeVersionRecord({
      version: 1,
      data: JSON.stringify(dataObj),
    });
    prisma.entityVersion.findFirst.mockResolvedValue(prior);

    const record = makeVersionRecord({ version: 2, data: JSON.stringify(dataObj), changes: null });
    prisma.entityVersion.create.mockResolvedValue(record);

    const result = await versioningService.createVersion(
      'org-1', 'task', 'task-1', dataObj, 'user-1'
    );

    expect(result.changes).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// getHistory
// ─────────────────────────────────────────────────────────────
describe('VersioningService.getHistory()', () => {
  it('returns paginated version history ordered by version desc', async () => {
    const records = [
      makeVersionRecord({ id: 'ver-2', version: 2 }),
      makeVersionRecord({ id: 'ver-1', version: 1 }),
    ];
    prisma.entityVersion.findMany.mockResolvedValue(records);
    prisma.entityVersion.count.mockResolvedValue(2);

    const result = await versioningService.getHistory('org-1', 'task', 'task-1');

    expect(result.items).toHaveLength(2);
    expect(result.items[0].version).toBe(2);
    expect(result.items[1].version).toBe(1);
    expect(result.pagination).toEqual({ page: 1, page_size: 20, total: 2, total_pages: 1 });
  });

  it('respects custom page and page_size', async () => {
    prisma.entityVersion.findMany.mockResolvedValue([]);
    prisma.entityVersion.count.mockResolvedValue(30);

    const result = await versioningService.getHistory('org-1', 'task', 'task-1', { page: 3, page_size: 10 });

    expect(prisma.entityVersion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    );
    expect(result.pagination.total_pages).toBe(3);
  });

  it('handles string pagination params', async () => {
    prisma.entityVersion.findMany.mockResolvedValue([]);
    prisma.entityVersion.count.mockResolvedValue(0);

    const result = await versioningService.getHistory('org-1', 'task', 'task-1', { page: '2', page_size: '5' });

    expect(result.pagination.page).toBe(2);
    expect(result.pagination.page_size).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────
// getVersion
// ─────────────────────────────────────────────────────────────
describe('VersioningService.getVersion()', () => {
  it('returns a formatted version when found', async () => {
    const record = makeVersionRecord({ version: 1 });
    prisma.entityVersion.findFirst.mockResolvedValue(record);

    const result = await versioningService.getVersion('org-1', 'task', 'task-1', 1);

    expect(prisma.entityVersion.findFirst).toHaveBeenCalledWith({
      where: { orgId: 'org-1', entityType: 'task', entityId: 'task-1', version: 1 },
    });
    expect(result.version).toBe(1);
    expect(result.entity_type).toBe('task');
    expect(result.entity_id).toBe('task-1');
    expect(result.data).toEqual({ title: 'My Task', status: 'todo' });
  });

  it('throws NotFound when version does not exist', async () => {
    prisma.entityVersion.findFirst.mockResolvedValue(null);

    await expect(
      versioningService.getVersion('org-1', 'task', 'task-1', 99)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─────────────────────────────────────────────────────────────
// restoreVersion
// ─────────────────────────────────────────────────────────────
describe('VersioningService.restoreVersion()', () => {
  it('creates a new version with restore reason and returns success', async () => {
    const oldRecord = makeVersionRecord({ version: 1, data: JSON.stringify({ title: 'Old', status: 'todo' }) });
    // findFirst: first call for restoreVersion lookup, second+ calls for createVersion
    prisma.entityVersion.findFirst
      .mockResolvedValueOnce(oldRecord)   // restore lookup
      .mockResolvedValueOnce(oldRecord);  // createVersion → getLastVersion lookup

    const newRecord = makeVersionRecord({ version: 2, changeReason: 'Restored from version 1' });
    prisma.entityVersion.create.mockResolvedValue(newRecord);

    const result = await versioningService.restoreVersion('org-1', 'task', 'task-1', 1, 'user-1');

    expect(prisma.entityVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ changeReason: 'Restored from version 1' }),
      })
    );
    expect(result.success).toBe(true);
    expect(result.message).toContain('version 1');
  });

  it('throws NotFound when target version does not exist', async () => {
    prisma.entityVersion.findFirst.mockResolvedValue(null);

    await expect(
      versioningService.restoreVersion('org-1', 'task', 'task-1', 99, 'user-1')
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(prisma.entityVersion.create).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────
// compareVersions
// ─────────────────────────────────────────────────────────────
describe('VersioningService.compareVersions()', () => {
  it('returns differences between two versions', async () => {
    const v1 = makeVersionRecord({ version: 1, data: JSON.stringify({ title: 'Old', status: 'todo' }) });
    const v2 = makeVersionRecord({ id: 'ver-2', version: 2, data: JSON.stringify({ title: 'New', status: 'done' }) });

    prisma.entityVersion.findFirst
      .mockResolvedValueOnce(v1)
      .mockResolvedValueOnce(v2);

    const result = await versioningService.compareVersions('org-1', 'task', 'task-1', 1, 2);

    expect(result.version1.version).toBe(1);
    expect(result.version2.version).toBe(2);
    expect(result.differences).toEqual({
      title: { old: 'Old', new: 'New' },
      status: { old: 'todo', new: 'done' },
    });
  });

  it('returns null differences when versions are identical', async () => {
    const data = { title: 'Same', status: 'todo' };
    const v1 = makeVersionRecord({ version: 1, data: JSON.stringify(data) });
    const v2 = makeVersionRecord({ id: 'ver-2', version: 2, data: JSON.stringify(data) });

    prisma.entityVersion.findFirst
      .mockResolvedValueOnce(v1)
      .mockResolvedValueOnce(v2);

    const result = await versioningService.compareVersions('org-1', 'task', 'task-1', 1, 2);

    expect(result.differences).toBeNull();
  });

  it('throws NotFound when either version is missing', async () => {
    prisma.entityVersion.findFirst
      .mockResolvedValueOnce(makeVersionRecord())
      .mockResolvedValueOnce(null);

    await expect(
      versioningService.compareVersions('org-1', 'task', 'task-1', 1, 99)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─────────────────────────────────────────────────────────────
// createSnapshot
// ─────────────────────────────────────────────────────────────
describe('VersioningService.createSnapshot()', () => {
  it('creates and returns a formatted snapshot', async () => {
    const record = makeSnapshotRecord();
    prisma.snapshot.create.mockResolvedValue(record);

    const result = await versioningService.createSnapshot(
      'org-1',
      'Sprint 1 Snapshot',
      'End of sprint snapshot',
      'sprint',
      { totalTasks: 10, completedTasks: 8 },
      'user-1'
    );

    expect(prisma.snapshot.create).toHaveBeenCalledWith({
      data: {
        orgId: 'org-1',
        name: 'Sprint 1 Snapshot',
        description: 'End of sprint snapshot',
        snapshotType: 'sprint',
        data: JSON.stringify({ totalTasks: 10, completedTasks: 8 }),
        createdBy: 'user-1',
      },
    });
    expect(result.id).toBe('snap-1');
    expect(result.snapshot_type).toBe('sprint');
    expect(result.data).toEqual({ totalTasks: 10, completedTasks: 8 });
    expect(result.created_by).toBe('user-1');
  });
});

// ─────────────────────────────────────────────────────────────
// getSnapshot
// ─────────────────────────────────────────────────────────────
describe('VersioningService.getSnapshot()', () => {
  it('returns a formatted snapshot when found', async () => {
    const record = makeSnapshotRecord();
    prisma.snapshot.findFirst.mockResolvedValue(record);

    const result = await versioningService.getSnapshot('org-1', 'snap-1');

    expect(prisma.snapshot.findFirst).toHaveBeenCalledWith({
      where: { id: 'snap-1', orgId: 'org-1' },
    });
    expect(result.name).toBe('Sprint 1 Snapshot');
    expect(result.description).toBe('End of sprint snapshot');
  });

  it('throws NotFound when snapshot does not exist', async () => {
    prisma.snapshot.findFirst.mockResolvedValue(null);

    await expect(
      versioningService.getSnapshot('org-1', 'missing')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─────────────────────────────────────────────────────────────
// listSnapshots
// ─────────────────────────────────────────────────────────────
describe('VersioningService.listSnapshots()', () => {
  it('returns paginated snapshots with default pagination', async () => {
    const records = [makeSnapshotRecord(), makeSnapshotRecord({ id: 'snap-2' })];
    prisma.snapshot.findMany.mockResolvedValue(records);
    prisma.snapshot.count.mockResolvedValue(2);

    const result = await versioningService.listSnapshots('org-1');

    expect(result.items).toHaveLength(2);
    expect(result.pagination).toEqual({ page: 1, page_size: 20, total: 2, total_pages: 1 });
  });

  it('filters by snapshotType when provided', async () => {
    prisma.snapshot.findMany.mockResolvedValue([]);
    prisma.snapshot.count.mockResolvedValue(0);

    await versioningService.listSnapshots('org-1', { snapshotType: 'project' });

    expect(prisma.snapshot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orgId: 'org-1', snapshotType: 'project' },
      })
    );
  });

  it('calculates total_pages correctly for fractional pages', async () => {
    prisma.snapshot.findMany.mockResolvedValue([]);
    prisma.snapshot.count.mockResolvedValue(21);

    const result = await versioningService.listSnapshots('org-1', { page_size: 10 });

    expect(result.pagination.total_pages).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────
// deleteSnapshot
// ─────────────────────────────────────────────────────────────
describe('VersioningService.deleteSnapshot()', () => {
  it('deletes an existing snapshot and returns success', async () => {
    const record = makeSnapshotRecord();
    prisma.snapshot.findFirst.mockResolvedValue(record);
    prisma.snapshot.delete.mockResolvedValue(record);

    const result = await versioningService.deleteSnapshot('org-1', 'snap-1');

    expect(prisma.snapshot.delete).toHaveBeenCalledWith({ where: { id: 'snap-1' } });
    expect(result).toEqual({ success: true });
  });

  it('throws NotFound when snapshot does not exist', async () => {
    prisma.snapshot.findFirst.mockResolvedValue(null);

    await expect(
      versioningService.deleteSnapshot('org-1', 'missing')
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(prisma.snapshot.delete).not.toHaveBeenCalled();
  });
});
