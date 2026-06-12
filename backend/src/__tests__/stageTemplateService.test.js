'use strict';

jest.mock('../config/prisma', () => ({
  stageTemplate: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  substageTemplate: {
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
  },
}));

const prisma = require('../config/prisma');
const stageTemplateService = require('../services/stageTemplateService');

// Minimal shape that satisfies fmtStage()
function makeStage(overrides = {}) {
  return {
    id: 'st-1',
    orgId: 'org-1',
    divisionId: null,
    name: 'Alpha Stage',
    description: null,
    order: 0,
    isActive: true,
    createdBy: 'u1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    substages: [],
    division: null,
    ...overrides,
  };
}

beforeEach(() => jest.clearAllMocks());

// ── list() ──────────────────────────────────────────────────────────────────

describe('stageTemplateService.list()', () => {
  it('returns array of formatted stage templates', async () => {
    prisma.stageTemplate.findMany.mockResolvedValue([makeStage()]);

    const result = await stageTemplateService.list('org-1');

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('st-1');
    expect(result[0].name).toBe('Alpha Stage');
  });

  it('returns empty array when no stage templates exist', async () => {
    prisma.stageTemplate.findMany.mockResolvedValue([]);

    const result = await stageTemplateService.list('org-1');

    expect(result).toEqual([]);
  });

  it('filters by divisionId when provided', async () => {
    prisma.stageTemplate.findMany.mockResolvedValue([]);

    await stageTemplateService.list('org-1', { divisionId: 'div-1' });

    const call = prisma.stageTemplate.findMany.mock.calls[0][0];
    expect(call.where.divisionId).toBe('div-1');
  });

  it('includes substages and division in result', async () => {
    const stage = makeStage({
      substages: [{ id: 'sub-1', stageId: 'st-1', name: 'Sub A', order: 0 }],
      division: { id: 'div-1', name: 'Division One' },
      divisionId: 'div-1',
    });
    prisma.stageTemplate.findMany.mockResolvedValue([stage]);

    const result = await stageTemplateService.list('org-1');

    expect(result[0].substages).toHaveLength(1);
    expect(result[0].substages[0].name).toBe('Sub A');
    expect(result[0].division.name).toBe('Division One');
  });
});

// ── getById() ───────────────────────────────────────────────────────────────

describe('stageTemplateService.getById()', () => {
  it('throws when stage template is not found', async () => {
    prisma.stageTemplate.findFirst.mockResolvedValue(null);

    await expect(stageTemplateService.getById('org-1', 'nonexistent')).rejects.toThrow(
      'Stage template not found'
    );
  });

  it('throws ApiError with 404 status', async () => {
    prisma.stageTemplate.findFirst.mockResolvedValue(null);

    try {
      await stageTemplateService.getById('org-1', 'nonexistent');
      fail('Expected error was not thrown');
    } catch (err) {
      expect(err.statusCode).toBe(404);
    }
  });

  it('returns formatted stage template when found', async () => {
    prisma.stageTemplate.findFirst.mockResolvedValue(makeStage({ id: 'st-found', name: 'Found Stage' }));

    const result = await stageTemplateService.getById('org-1', 'st-found');

    expect(result.id).toBe('st-found');
    expect(result.name).toBe('Found Stage');
    expect(result).toHaveProperty('substages');
  });

  it('queries with correct orgId and stageId', async () => {
    prisma.stageTemplate.findFirst.mockResolvedValue(makeStage());

    await stageTemplateService.getById('org-abc', 'st-xyz');

    const call = prisma.stageTemplate.findFirst.mock.calls[0][0];
    expect(call.where.orgId).toBe('org-abc');
    expect(call.where.id).toBe('st-xyz');
  });
});

// ── create() ────────────────────────────────────────────────────────────────

describe('stageTemplateService.create()', () => {
  it('creates and returns a formatted stage template', async () => {
    prisma.stageTemplate.create.mockResolvedValue(makeStage({ id: 'new-st', name: 'New Stage' }));

    const result = await stageTemplateService.create('org-1', 'u1', { name: 'New Stage' });

    expect(result.id).toBe('new-st');
    expect(result.name).toBe('New Stage');
    expect(prisma.stageTemplate.create).toHaveBeenCalledTimes(1);
  });

  it('throws when name is missing', async () => {
    await expect(stageTemplateService.create('org-1', 'u1', { name: '' })).rejects.toThrow(
      'Stage name is required'
    );
    expect(prisma.stageTemplate.create).not.toHaveBeenCalled();
  });

  it('throws when name is undefined', async () => {
    await expect(stageTemplateService.create('org-1', 'u1', {})).rejects.toThrow('Stage name is required');
  });

  it('stores divisionId when provided', async () => {
    prisma.stageTemplate.create.mockResolvedValue(makeStage({ divisionId: 'div-1' }));

    await stageTemplateService.create('org-1', 'u1', { name: 'Scoped Stage', division_id: 'div-1' });

    const createCall = prisma.stageTemplate.create.mock.calls[0][0];
    expect(createCall.data.divisionId).toBe('div-1');
  });
});

// ── update() ────────────────────────────────────────────────────────────────

describe('stageTemplateService.update()', () => {
  it('updates stage template name', async () => {
    prisma.stageTemplate.findFirst.mockResolvedValue(makeStage());
    prisma.stageTemplate.update.mockResolvedValue(makeStage({ name: 'Updated Stage' }));

    const result = await stageTemplateService.update('org-1', 'st-1', { name: 'Updated Stage' });

    expect(result.name).toBe('Updated Stage');
  });

  it('throws when stage template does not exist', async () => {
    prisma.stageTemplate.findFirst.mockResolvedValue(null);

    await expect(stageTemplateService.update('org-1', 'missing', { name: 'X' })).rejects.toThrow(
      'Stage template not found'
    );
  });
});

// ── delete() ────────────────────────────────────────────────────────────────

describe('stageTemplateService.delete()', () => {
  it('deletes stage template and returns success', async () => {
    prisma.stageTemplate.findFirst.mockResolvedValue(makeStage());
    prisma.stageTemplate.delete.mockResolvedValue({});

    const result = await stageTemplateService.delete('org-1', 'st-1');

    expect(result).toEqual({ success: true });
    expect(prisma.stageTemplate.delete).toHaveBeenCalledWith({ where: { id: 'st-1' } });
  });

  it('throws when stage template does not exist', async () => {
    prisma.stageTemplate.findFirst.mockResolvedValue(null);

    await expect(stageTemplateService.delete('org-1', 'nonexistent')).rejects.toThrow(
      'Stage template not found'
    );
  });
});

// ── bulkReplaceSubstages() ───────────────────────────────────────────────────

describe('stageTemplateService.bulkReplaceSubstages()', () => {
  it('deletes existing substages and creates new ones', async () => {
    // getById call (first findFirst)
    prisma.stageTemplate.findFirst
      .mockResolvedValueOnce(makeStage())
      // getById call inside bulkReplaceSubstages after replacement
      .mockResolvedValueOnce(makeStage({
        substages: [
          { id: 'sub-a', stageId: 'st-1', name: 'Planning', order: 0 },
          { id: 'sub-b', stageId: 'st-1', name: 'Execution', order: 1 },
        ],
      }));

    prisma.substageTemplate.deleteMany.mockResolvedValue({ count: 0 });
    prisma.substageTemplate.createMany.mockResolvedValue({ count: 2 });

    const result = await stageTemplateService.bulkReplaceSubstages('org-1', 'st-1', ['Planning', 'Execution']);

    expect(prisma.substageTemplate.deleteMany).toHaveBeenCalledWith({ where: { stageId: 'st-1' } });
    expect(prisma.substageTemplate.createMany).toHaveBeenCalledWith({
      data: [
        { stageId: 'st-1', name: 'Planning', order: 0 },
        { stageId: 'st-1', name: 'Execution', order: 1 },
      ],
    });
    expect(result.substages).toHaveLength(2);
  });

  it('skips createMany when given an empty array', async () => {
    prisma.stageTemplate.findFirst
      .mockResolvedValueOnce(makeStage())
      .mockResolvedValueOnce(makeStage({ substages: [] }));
    prisma.substageTemplate.deleteMany.mockResolvedValue({ count: 3 });

    await stageTemplateService.bulkReplaceSubstages('org-1', 'st-1', []);

    expect(prisma.substageTemplate.createMany).not.toHaveBeenCalled();
  });

  it('throws when stage template does not exist', async () => {
    prisma.stageTemplate.findFirst.mockResolvedValue(null);

    await expect(
      stageTemplateService.bulkReplaceSubstages('org-1', 'missing', ['Planning'])
    ).rejects.toThrow('Stage template not found');
  });
});
