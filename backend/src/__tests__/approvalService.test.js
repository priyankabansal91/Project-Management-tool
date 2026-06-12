'use strict';

// Mock Prisma — used only in DB approval paths
jest.mock('../config/prisma', () => ({
  approval: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  milestone: {
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
}));

// Mock logger to suppress debug output during tests
jest.mock('../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const prisma = require('../config/prisma');
const approvalService = require('../services/approvalService');

beforeEach(() => {
  jest.clearAllMocks();
  // Clear in-memory stores between tests by re-requiring the service
  // The service uses module-level Maps, so we reset by clearing mock state
  // and relying on unique IDs from Date.now() across tests.
});

// ── createApproval() ─────────────────────────────────────────────────────────

describe('approvalService.createApproval()', () => {
  it('creates an approval with pending status using a valid workflow', async () => {
    const result = await approvalService.createApproval('org-1', 'u1', {
      workflow_id: 'quickApproval',
      title: 'Test Approval',
      description: 'A simple test',
    });

    expect(result.status).toBe('pending');
    expect(result.title).toBe('Test Approval');
    expect(result.workflow_id).toBe('quickApproval');
    expect(result.current_step).toBe(1);
    expect(Array.isArray(result.steps)).toBe(true);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('creates steps matching the workflow definition', async () => {
    const result = await approvalService.createApproval('org-1', 'u1', {
      workflow_id: 'standardApproval',
      title: 'Multi-step Approval',
    });

    // standardApproval has 3 steps
    expect(result.steps).toHaveLength(3);
    expect(result.steps[0].status).toBe('pending');
    expect(result.steps[0].step_name).toBe('PM Review');
  });

  it('throws when workflow_id does not exist', async () => {
    await expect(
      approvalService.createApproval('org-1', 'u1', {
        workflow_id: 'nonExistentWorkflow',
        title: 'Bad Workflow',
      })
    ).rejects.toThrow('not found');
  });

  it('includes requested_by user info in result', async () => {
    const result = await approvalService.createApproval('org-1', 'u-creator', {
      workflow_id: 'quickApproval',
      title: 'Creator Test',
    });

    expect(result.requested_by.id).toBe('u-creator');
  });

  it('stores related_project_id and related_task_id', async () => {
    const result = await approvalService.createApproval('org-1', 'u1', {
      workflow_id: 'quickApproval',
      title: 'Linked Approval',
      related_project_id: 'proj-1',
      related_task_id: 'task-1',
    });

    expect(result.related_project_id).toBe('proj-1');
    expect(result.related_task_id).toBe('task-1');
  });
});

// ── approveStep() — in-memory path ───────────────────────────────────────────

describe('approvalService.approveStep() [in-memory]', () => {
  it('approves the pending step and returns updated approval', async () => {
    // DB findFirst returns null → falls through to in-memory store
    prisma.approval.findFirst.mockResolvedValue(null);

    // Create an in-memory approval first
    const created = await approvalService.createApproval('org-2', 'u1', {
      workflow_id: 'quickApproval',
      title: 'Approve Me',
    });

    const result = await approvalService.approveStep('org-2', 'u1', created.id, { reason: 'LGTM' });

    // quickApproval has only 1 step — should move to approved
    expect(result.status).toBe('approved');
    expect(result.steps[0].status).toBe('approved');
  });

  it('marks multi-step approval as pending after first approval', async () => {
    prisma.approval.findFirst.mockResolvedValue(null);

    const created = await approvalService.createApproval('org-3', 'u1', {
      workflow_id: 'standardApproval',
      title: 'Multi-step Approve',
    });

    // Approve first step
    const result = await approvalService.approveStep('org-3', 'u1', created.id, { reason: 'Step 1 ok' });

    // Still pending since step 2 and 3 remain
    expect(result.status).toBe('pending');
    expect(result.steps[0].status).toBe('approved');
    expect(result.steps[1].status).toBe('pending');
  });

  it('throws when approval not found in either store', async () => {
    prisma.approval.findFirst.mockResolvedValue(null);

    await expect(
      approvalService.approveStep('org-1', 'u1', 'nonexistent-id', { reason: 'x' })
    ).rejects.toThrow('Approval not found');
  });

  it('throws when approval is already approved (not pending)', async () => {
    prisma.approval.findFirst.mockResolvedValue(null);

    const created = await approvalService.createApproval('org-4', 'u1', {
      workflow_id: 'quickApproval',
      title: 'Already Done',
    });

    // Approve it once
    await approvalService.approveStep('org-4', 'u1', created.id, {});

    // Try to approve again — should throw
    await expect(
      approvalService.approveStep('org-4', 'u1', created.id, {})
    ).rejects.toThrow('not pending');
  });
});

// ── approveStep() — DB path ──────────────────────────────────────────────────

describe('approvalService.approveStep() [DB path]', () => {
  it('approves a DB approval record', async () => {
    const dbApproval = {
      id: 'db-appr-1',
      orgId: 'org-1',
      status: 'pending',
      workflowType: 'generic',
      relatedMilestoneId: null,
      requestedByUser: { id: 'u1', firstName: 'Jane', lastName: 'Doe', email: 'j@d.com' },
    };
    const updatedApproval = { ...dbApproval, status: 'approved', updatedAt: new Date() };

    prisma.approval.findFirst.mockResolvedValue(dbApproval);
    prisma.approval.update.mockResolvedValue(updatedApproval);

    const result = await approvalService.approveStep('org-1', 'u1', 'db-appr-1', { reason: 'OK' });

    expect(result.status).toBe('approved');
    expect(prisma.approval.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'db-appr-1' },
        data: expect.objectContaining({ status: 'approved' }),
      })
    );
  });

  it('auto-advances milestone when workflowType is milestone_closure', async () => {
    const dbApproval = {
      id: 'db-appr-ms',
      orgId: 'org-1',
      status: 'pending',
      workflowType: 'milestone_closure',
      relatedMilestoneId: 'ms-1',
      requestedByUser: null,
    };
    const updatedApproval = { ...dbApproval, status: 'approved', updatedAt: new Date() };
    const milestone = { id: 'ms-1', name: 'Phase 1' };

    prisma.approval.findFirst.mockResolvedValue(dbApproval);
    prisma.approval.update.mockResolvedValue(updatedApproval);
    prisma.milestone.findUnique.mockResolvedValue(milestone);
    prisma.milestone.update.mockResolvedValue({ ...milestone, waterfallStatus: 'COMPLETED' });
    prisma.milestone.updateMany.mockResolvedValue({ count: 0 });

    await approvalService.approveStep('org-1', 'u1', 'db-appr-ms', {});

    expect(prisma.milestone.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ms-1' },
        data: expect.objectContaining({ waterfallStatus: 'COMPLETED', status: 'completed' }),
      })
    );
    expect(prisma.milestone.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { predecessorId: 'ms-1', waterfallStatus: 'BLOCKED' },
        data: expect.objectContaining({ waterfallStatus: 'NOT_STARTED' }),
      })
    );
  });

  it('throws when DB approval is not pending', async () => {
    prisma.approval.findFirst.mockResolvedValue({
      id: 'db-appr-done',
      orgId: 'org-1',
      status: 'approved',
      workflowType: null,
      relatedMilestoneId: null,
    });

    await expect(
      approvalService.approveStep('org-1', 'u1', 'db-appr-done', {})
    ).rejects.toThrow('not pending');
  });
});

// ── rejectStep() — in-memory path ────────────────────────────────────────────

describe('approvalService.rejectStep() [in-memory]', () => {
  it('rejects the pending step and marks approval as rejected', async () => {
    prisma.approval.findFirst.mockResolvedValue(null);

    const created = await approvalService.createApproval('org-5', 'u1', {
      workflow_id: 'quickApproval',
      title: 'Reject Me',
    });

    const result = await approvalService.rejectStep('org-5', 'u1', created.id, { reason: 'Not good enough' });

    expect(result.status).toBe('rejected');
    expect(result.steps[0].status).toBe('rejected');
  });

  it('throws when approval is not found', async () => {
    prisma.approval.findFirst.mockResolvedValue(null);

    await expect(
      approvalService.rejectStep('org-1', 'u1', 'bad-id', { reason: 'x' })
    ).rejects.toThrow('Approval not found');
  });

  it('throws when approval is already rejected', async () => {
    prisma.approval.findFirst.mockResolvedValue(null);

    const created = await approvalService.createApproval('org-6', 'u1', {
      workflow_id: 'quickApproval',
      title: 'Reject Twice',
    });

    await approvalService.rejectStep('org-6', 'u1', created.id, { reason: 'Rejected once' });

    await expect(
      approvalService.rejectStep('org-6', 'u1', created.id, { reason: 'Again' })
    ).rejects.toThrow('not pending');
  });
});

// ── rejectStep() — DB path ───────────────────────────────────────────────────

describe('approvalService.rejectStep() [DB path]', () => {
  it('rejects a DB approval record', async () => {
    const dbApproval = {
      id: 'db-rej-1',
      orgId: 'org-1',
      status: 'pending',
      workflowType: 'generic',
      relatedMilestoneId: null,
      requestedByUser: null,
    };
    const updatedApproval = { ...dbApproval, status: 'rejected', updatedAt: new Date() };

    prisma.approval.findFirst.mockResolvedValue(dbApproval);
    prisma.approval.update.mockResolvedValue(updatedApproval);

    const result = await approvalService.rejectStep('org-1', 'u1', 'db-rej-1', { reason: 'Denied' });

    expect(result.status).toBe('rejected');
    expect(prisma.approval.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'db-rej-1' },
        data: expect.objectContaining({ status: 'rejected' }),
      })
    );
  });

  it('reverts milestone to IN_PROGRESS when rejection is for milestone_closure', async () => {
    const dbApproval = {
      id: 'db-rej-ms',
      orgId: 'org-1',
      status: 'pending',
      workflowType: 'milestone_closure',
      relatedMilestoneId: 'ms-2',
      requestedByUser: null,
    };
    const updatedApproval = { ...dbApproval, status: 'rejected', updatedAt: new Date() };

    prisma.approval.findFirst.mockResolvedValue(dbApproval);
    prisma.approval.update.mockResolvedValue(updatedApproval);
    prisma.milestone.update.mockResolvedValue({});

    await approvalService.rejectStep('org-1', 'u1', 'db-rej-ms', { reason: 'Needs rework' });

    expect(prisma.milestone.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ms-2' },
        data: expect.objectContaining({ waterfallStatus: 'IN_PROGRESS', status: 'in_progress' }),
      })
    );
  });

  it('throws when DB approval is not pending', async () => {
    prisma.approval.findFirst.mockResolvedValue({
      id: 'db-rej-already',
      orgId: 'org-1',
      status: 'rejected',
      workflowType: null,
      relatedMilestoneId: null,
    });

    await expect(
      approvalService.rejectStep('org-1', 'u1', 'db-rej-already', {})
    ).rejects.toThrow('not pending');
  });
});

// ── listApprovals() ──────────────────────────────────────────────────────────

describe('approvalService.listApprovals()', () => {
  it('returns merged in-memory and DB approvals', async () => {
    const dbRow = {
      id: 'db-list-1',
      orgId: 'org-list',
      status: 'pending',
      workflowId: null,
      workflowType: 'generic',
      entityType: null,
      entityId: null,
      title: 'DB Approval',
      description: null,
      content: null,
      currentStep: 1,
      hierarchyLevel: null,
      relatedMilestoneId: null,
      relatedProjectId: null,
      requestedBy: 'u1',
      requestedByUser: { id: 'u1', firstName: 'Jane', lastName: 'Doe', email: 'j@d.com' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prisma.approval.findMany.mockResolvedValue([dbRow]);

    const result = await approvalService.listApprovals('org-list', 'u1', {});

    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('pagination');
    // DB row is included
    const dbItem = result.items.find((i) => i.id === 'db-list-1');
    expect(dbItem).toBeDefined();
    expect(dbItem.title).toBe('DB Approval');
  });

  it('returns empty items when no approvals exist for org', async () => {
    prisma.approval.findMany.mockResolvedValue([]);

    const result = await approvalService.listApprovals('org-empty', 'u1', {});

    expect(result.items).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });
});
