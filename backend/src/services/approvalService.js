const ApiError = require('../utils/ApiError');
const APPROVAL_WORKFLOWS = require('../utils/approvalWorkflows');

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
   */
  async listApprovals(orgId, userId, { status, page = 1, page_size = 20 } = {}) {
    let approvals = Array.from(approvalsStore.values())
      .filter(a => a.orgId === orgId);

    if (status) {
      approvals = approvals.filter(a => a.status === status);
    }

    approvals.sort((a, b) => b.createdAt - a.createdAt);

    const total = approvals.length;
    const items = approvals.slice((page - 1) * page_size, page * page_size);

    return {
      items: items.map((a) => this._formatApproval(a)),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  /**
   * Approve an approval step
   */
  async approveStep(orgId, userId, approvalId, data) {
    const { reason } = data;

    const approval = approvalsStore.get(approvalId);
    if (!approval || approval.orgId !== orgId) {
      throw ApiError.notFound('Approval not found');
    }

    if (approval.status !== 'pending') {
      throw ApiError.badRequest('Approval is not pending');
    }

    // Find the first pending step
    const currentStep = approval.steps.find((s) => s.status === 'pending');
    if (!currentStep) {
      throw ApiError.forbidden('No pending step found');
    }

    // Update the step
    currentStep.status = 'approved';

    // Create approval record
    const recordId = `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    approvalRecordsStore.set(recordId, {
      id: recordId,
      approvalId,
      approvedBy: userId,
      action: 'approved',
      reason,
      stepId: currentStep.id,
      createdAt: new Date(),
    });

    // Check if all steps are approved
    const allApproved = approval.steps.every((s) => s.status === 'approved');
    if (allApproved) {
      approval.status = 'approved';
    }

    approval.updatedAt = new Date();
    approvalsStore.set(approvalId, approval);

    return this.getApprovalById(orgId, approvalId);
  }

  /**
   * Reject an approval step
   */
  async rejectStep(orgId, userId, approvalId, data) {
    const { reason } = data;

    const approval = approvalsStore.get(approvalId);
    if (!approval || approval.orgId !== orgId) {
      throw ApiError.notFound('Approval not found');
    }

    if (approval.status !== 'pending') {
      throw ApiError.badRequest('Approval is not pending');
    }

    // Find the first pending step
    const currentStep = approval.steps.find((s) => s.status === 'pending');
    if (!currentStep) {
      throw ApiError.forbidden('No pending step found');
    }

    // Update the step
    currentStep.status = 'rejected';

    // Create approval record
    const recordId = `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    approvalRecordsStore.set(recordId, {
      id: recordId,
      approvalId,
      approvedBy: userId,
      action: 'rejected',
      reason,
      stepId: currentStep.id,
      createdAt: new Date(),
    });

    // Update approval status
    approval.status = 'rejected';
    approval.updatedAt = new Date();
    approvalsStore.set(approvalId, approval);

    return this.getApprovalById(orgId, approvalId);
  }

  /**
   * Format approval for response
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
