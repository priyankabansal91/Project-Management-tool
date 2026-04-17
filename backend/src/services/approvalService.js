const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const APPROVAL_WORKFLOWS = require('../utils/approvalWorkflows');

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
    const approval = await prisma.approval.create({
      data: {
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
        steps: {
          create: workflow.steps.map((step) => ({
            stepId: step.id,
            stepName: step.name,
            stepOrder: step.order,
            role: step.role,
            status: 'pending',
            parallel: step.parallel || false,
          })),
        },
      },
      include: {
        steps: true,
        requestedByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return this._formatApproval(approval);
  }

  /**
   * Get approval by ID
   */
  async getApprovalById(orgId, approvalId) {
    const approval = await prisma.approval.findFirst({
      where: { id: approvalId, orgId },
      include: {
        steps: true,
        approvals: { include: { approvedBy: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        requestedByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!approval) throw ApiError.notFound('Approval not found');
    return this._formatApproval(approval);
  }

  /**
   * List pending approvals for a user
   */
  async listPendingApprovals(orgId, userId, { page = 1, page_size = 20 } = {}) {
    // Get user's role
    const member = await prisma.organizationMember.findFirst({
      where: { userId, orgId },
    });

    if (!member) throw ApiError.forbidden('User not a member of this organization');

    // Find approvals where user's role matches a pending step
    const where = {
      orgId,
      status: 'pending',
      steps: {
        some: {
          status: 'pending',
          role: member.role,
        },
      },
    };

    const [items, total] = await Promise.all([
      prisma.approval.findMany({
        where,
        include: {
          steps: true,
          requestedByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * page_size,
        take: page_size,
      }),
      prisma.approval.count({ where }),
    ]);

    return {
      items: items.map((a) => this._formatApproval(a)),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  /**
   * List all approvals for a user (created by or assigned to)
   */
  async listApprovals(orgId, userId, { status, page = 1, page_size = 20 } = {}) {
    const where = {
      orgId,
      ...(status && { status }),
    };

    const [items, total] = await Promise.all([
      prisma.approval.findMany({
        where,
        include: {
          steps: true,
          approvals: { include: { approvedBy: { select: { id: true, firstName: true, lastName: true, email: true } } } },
          requestedByUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * page_size,
        take: page_size,
      }),
      prisma.approval.count({ where }),
    ]);

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

    const approval = await prisma.approval.findFirst({
      where: { id: approvalId, orgId },
      include: { steps: true },
    });

    if (!approval) throw ApiError.notFound('Approval not found');
    if (approval.status !== 'pending') throw ApiError.badRequest('Approval is not pending');

    // Get user's role
    const member = await prisma.organizationMember.findFirst({
      where: { userId, orgId },
    });

    // Find the current pending step for this user's role
    const currentStep = approval.steps.find((s) => s.status === 'pending' && s.role === member.role);
    if (!currentStep) throw ApiError.forbidden('No pending step for your role');

    // Update the step
    await prisma.approvalStep.update({
      where: { id: currentStep.id },
      data: { status: 'approved' },
    });

    // Create approval record
    await prisma.approvalRecord.create({
      data: {
        approvalId,
        approvedBy: userId,
        action: 'approved',
        reason,
        stepId: currentStep.id,
      },
    });

    // Check if all steps are approved
    const updatedApproval = await prisma.approval.findFirst({
      where: { id: approvalId },
      include: { steps: true },
    });

    const allApproved = updatedApproval.steps.every((s) => s.status === 'approved');

    if (allApproved) {
      await prisma.approval.update({
        where: { id: approvalId },
        data: { status: 'approved' },
      });
    }

    return this.getApprovalById(orgId, approvalId);
  }

  /**
   * Reject an approval step
   */
  async rejectStep(orgId, userId, approvalId, data) {
    const { reason } = data;

    const approval = await prisma.approval.findFirst({
      where: { id: approvalId, orgId },
      include: { steps: true },
    });

    if (!approval) throw ApiError.notFound('Approval not found');
    if (approval.status !== 'pending') throw ApiError.badRequest('Approval is not pending');

    // Get user's role
    const member = await prisma.organizationMember.findFirst({
      where: { userId, orgId },
    });

    // Find the current pending step for this user's role
    const currentStep = approval.steps.find((s) => s.status === 'pending' && s.role === member.role);
    if (!currentStep) throw ApiError.forbidden('No pending step for your role');

    // Update the step
    await prisma.approvalStep.update({
      where: { id: currentStep.id },
      data: { status: 'rejected' },
    });

    // Create approval record
    await prisma.approvalRecord.create({
      data: {
        approvalId,
        approvedBy: userId,
        action: 'rejected',
        reason,
        stepId: currentStep.id,
      },
    });

    // Update approval status
    await prisma.approval.update({
      where: { id: approvalId },
      data: { status: 'rejected' },
    });

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
      })),
      created_at: approval.createdAt,
      updated_at: approval.updatedAt,
    };
  }
}

module.exports = new ApprovalService();
