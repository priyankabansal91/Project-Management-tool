const ApiError = require('../utils/ApiError');
const APPROVAL_WORKFLOWS = require('../utils/approvalWorkflows');
const prisma = require('../config/prisma');

// In-memory storage for development (until database is set up)
const approvalsStore = new Map();
const approvalRecordsStore = new Map();

class ApprovalService {
  /**
   * Create an approval request
   */
  async createApproval(orgId, userId, data) {
    const { workflow_id, title, description, content, related_task_id, related_project_id } = data;

    // Validate workflow exists
    const workflow = APPROVAL_WORKFLOWS[workflow_id];
    if (!workflow) {
      throw ApiError.badRequest(`Approval workflow "${workflow_id}" not found`);
    }

    // Create approval request
    const approvalId = `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const approval = {
      id: approvalId,
      orgId,
      workflowId: workflow_id,
      title,
      description,
      content,
      requestedBy: userId,
      relatedTaskId: related_task_id,
      relatedProjectId: related_project_id,
      status: 'pending',
      currentStep: 1,
      steps: workflow.steps.map((step, index) => ({
        id: `step_${approvalId}_${index}`,
        stepId: step.id,
        stepName: step.name,
        stepOrder: step.order,
        role: step.role,
        status: 'pending',
        parallel: step.parallel || false,
      })),
      requestedByUser: {
        id: userId,
        firstName: 'Dev',
        lastName: 'User',
        email: 'dev@example.com',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    approvalsStore.set(approvalId, approval);
    return this._formatApproval(approval);
  }

  /**
   * Get approval by ID
   */
  async getApprovalById(orgId, approvalId) {
    const approval = approvalsStore.get(approvalId);

    if (!approval || approval.orgId !== orgId) {
      throw ApiError.notFound('Approval not found');
    }

    // Get approval records
    const records = Array.from(approvalRecordsStore.values()).filter(r => r.approvalId === approvalId);
    approval.approvals = records;

    return this._formatApproval(approval);
  }

  /**
   * List pending approvals for a user
   */
  async listPendingApprovals(orgId, userId, { page = 1, page_size = 20 } = {}) {
    page = parseInt(page) || 1;
    page_size = parseInt(page_size) || 20;
    // Get all approvals for this org that are pending
    const approvals = Array.from(approvalsStore.values())
      .filter(a => a.orgId === orgId && a.status === 'pending')
      .sort((a, b) => b.createdAt - a.createdAt);

    const total = approvals.length;
    const items = approvals.slice((page - 1) * page_size, page * page_size);

    return {
      items: items.map((a) => this._formatApproval(a)),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  /**
   * List all approvals for a user (created by or assigned to)
   * Merges in-memory workflow approvals with DB milestone-closure approvals
   */
  async listApprovals(orgId, userId, { status, page = 1, page_size = 20 } = {}) {
    page = parseInt(page) || 1;
    page_size = parseInt(page_size) || 20;

    // In-memory workflow approvals
    let memApprovals = Array.from(approvalsStore.values()).filter(a => a.orgId === orgId);
    if (status) memApprovals = memApprovals.filter(a => a.status === status);

    // DB-based approvals (milestone closures, etc.)
    let dbApprovals = [];
    try {
      const where = { orgId };
      if (status) where.status = status;
      const rows = await prisma.approval.findMany({
        where,
        include: { requestedByUser: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      dbApprovals = rows.map((r) => this._formatDbApproval(r));
    } catch (_) { /* DB not available */ }

    const all = [...memApprovals.map((a) => this._formatApproval(a)), ...dbApprovals]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const total = all.length;
    return {
      items: all.slice((page - 1) * page_size, page * page_size),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  /**
   * Approve an approval step
   * Handles both in-memory workflow approvals and DB milestone-closure approvals
   */
  async approveStep(orgId, userId, approvalId, data) {
    const { reason } = data;

    // Try DB approval first (milestone closures)
    let dbApproval = null;
    try {
      dbApproval = await prisma.approval.findFirst({ where: { id: approvalId, orgId } });
    } catch (_) {}

    if (dbApproval) {
      if (dbApproval.status !== 'pending') throw ApiError.badRequest('Approval is not pending');

      const updated = await prisma.approval.update({
        where: { id: approvalId },
        data: { status: 'approved', updatedAt: new Date() },
        include: { requestedByUser: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }).catch(() => null);

      // Auto-advance milestone waterfallStatus when a milestone_closure approval is approved
      if (dbApproval.workflowType === 'milestone_closure' && dbApproval.relatedMilestoneId) {
        const milestone = await prisma.milestone.findUnique({ where: { id: dbApproval.relatedMilestoneId } }).catch(() => null);
        if (milestone) {
          await prisma.milestone.update({
            where: { id: milestone.id },
            data: { waterfallStatus: 'COMPLETED', status: 'completed', progress: 100, completedAt: new Date() },
          }).catch(() => {});
          // Unblock next milestone
          await prisma.milestone.updateMany({
            where: { predecessorId: milestone.id, waterfallStatus: 'BLOCKED' },
            data: { waterfallStatus: 'NOT_STARTED', blockedReason: null },
          }).catch(() => {});
        }
      }

      return this._formatDbApproval(updated || dbApproval);
    }

    // Fall back to in-memory store
    const approval = approvalsStore.get(approvalId);
    if (!approval || approval.orgId !== orgId) throw ApiError.notFound('Approval not found');
    if (approval.status !== 'pending') throw ApiError.badRequest('Approval is not pending');

    const currentStep = approval.steps.find((s) => s.status === 'pending');
    if (!currentStep) throw ApiError.forbidden('No pending step found');

    currentStep.status = 'approved';

    const recordId = `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    approvalRecordsStore.set(recordId, {
      id: recordId, approvalId, approvedBy: userId, action: 'approved',
      reason, stepId: currentStep.id, createdAt: new Date(),
    });

    const allApproved = approval.steps.every((s) => s.status === 'approved');
    if (allApproved) approval.status = 'approved';

    approval.updatedAt = new Date();
    approvalsStore.set(approvalId, approval);

    return this.getApprovalById(orgId, approvalId);
  }

  /**
   * Reject an approval step
   */
  async rejectStep(orgId, userId, approvalId, data) {
    const { reason } = data;

    // Try DB approval first
    let dbApproval = null;
    try {
      dbApproval = await prisma.approval.findFirst({ where: { id: approvalId, orgId } });
    } catch (_) {}

    if (dbApproval) {
      if (dbApproval.status !== 'pending') throw ApiError.badRequest('Approval is not pending');
      const updated = await prisma.approval.update({
        where: { id: approvalId },
        data: { status: 'rejected', updatedAt: new Date() },
        include: { requestedByUser: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }).catch(() => null);

      // Revert milestone back to IN_PROGRESS if rejected
      if (dbApproval.workflowType === 'milestone_closure' && dbApproval.relatedMilestoneId) {
        await prisma.milestone.update({
          where: { id: dbApproval.relatedMilestoneId },
          data: { waterfallStatus: 'IN_PROGRESS', status: 'in_progress', approvalId: null },
        }).catch(() => {});
      }

      return this._formatDbApproval(updated || dbApproval);
    }

    // Fall back to in-memory store
    const approval = approvalsStore.get(approvalId);
    if (!approval || approval.orgId !== orgId) throw ApiError.notFound('Approval not found');
    if (approval.status !== 'pending') throw ApiError.badRequest('Approval is not pending');

    const currentStep = approval.steps.find((s) => s.status === 'pending');
    if (!currentStep) throw ApiError.forbidden('No pending step found');

    currentStep.status = 'rejected';
    const recordId = `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    approvalRecordsStore.set(recordId, {
      id: recordId, approvalId, approvedBy: userId, action: 'rejected',
      reason, stepId: currentStep.id, createdAt: new Date(),
    });

    approval.status = 'rejected';
    approval.updatedAt = new Date();
    approvalsStore.set(approvalId, approval);

    return this.getApprovalById(orgId, approvalId);
  }

  /**
   * Format a Prisma DB approval for API response
   */
  _formatDbApproval(row) {
    if (!row) return null;
    return {
      id: row.id,
      workflow_id: row.workflowId || null,
      title: row.title,
      description: row.description,
      content: row.content || null,
      status: row.status,
      current_step: row.currentStep || 1,
      workflow_type: row.workflowType,
      entity_type: row.entityType,
      entity_id: row.entityId,
      related_milestone_id: row.relatedMilestoneId,
      related_project_id: row.relatedProjectId,
      hierarchy_level: row.hierarchyLevel,
      requested_by: row.requestedByUser || { id: row.requestedBy },
      steps: [],
      approvals: [],
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    };
  }

  /**
   * Format in-memory approval for response
   */
  _formatApproval(approval) {
    return {
      id: approval.id,
      workflow_id: approval.workflowId,
      title: approval.title,
      description: approval.description,
      content: approval.content,
      status: approval.status,
      current_step: approval.currentStep,
      requested_by: approval.requestedByUser,
      related_task_id: approval.relatedTaskId,
      related_project_id: approval.relatedProjectId,
      steps: approval.steps.map((s) => ({
        id: s.id,
        step_id: s.stepId,
        step_name: s.stepName,
        step_order: s.stepOrder,
        role: s.role,
        status: s.status,
        parallel: s.parallel,
      })),
      approvals: approval.approvals?.map((a) => ({
        id: a.id,
        action: a.action,
        reason: a.reason,
        approved_by: a.approvedBy,
        created_at: a.createdAt,
      })) || [],
      created_at: approval.createdAt,
      updated_at: approval.updatedAt,
    };
  }
}

module.exports = new ApprovalService();
