const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const FORM_TEMPLATES = require('../utils/formTemplates');
const APPROVAL_WORKFLOWS = require('../utils/approvalWorkflows');

class FormService {
  /**
   * Get all form templates
   */
  async getFormTemplates() {
    return Object.values(FORM_TEMPLATES).map((form) => ({
      id: form.id,
      name: form.name,
      description: form.description,
      type: form.type,
      fields: form.fields,
    }));
  }

  /**
   * Get a specific form template
   */
  async getFormTemplate(formId) {
    const form = FORM_TEMPLATES[formId];
    if (!form) throw ApiError.notFound(`Form template "${formId}" not found`);

    return {
      id: form.id,
      name: form.name,
      description: form.description,
      type: form.type,
      fields: form.fields,
    };
  }

  /**
   * Submit a form and create a task
   */
  async submitForm(orgId, userId, formId, data) {
    const form = FORM_TEMPLATES[formId];
    if (!form) throw ApiError.notFound(`Form template "${formId}" not found`);

    // Validate form data
    this._validateFormData(form, data);

    // Get or create the auto-assigned project
    let projectId = form.autoAssign?.project;
    if (projectId) {
      let project = await prisma.project.findFirst({
        where: { orgId, key: projectId, deletedAt: null },
      });

      if (!project) {
        // Create project if it doesn't exist
        project = await prisma.project.create({
          data: {
            orgId,
            name: form.autoAssign.project.replace(/-/g, ' ').toUpperCase(),
            key: projectId,
            description: `Auto-created project for ${form.name} forms`,
            visibility: 'private',
            ownerId: userId,
            createdBy: userId,
          },
        });
      }
      projectId = project.id;
    }

    // Get default workflow if not specified
    let workflowConfigId = null;
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { workflowConfigId: true },
      });
      workflowConfigId = project?.workflowConfigId;
    }

    if (!workflowConfigId) {
      const defaultWf = await prisma.workflowConfig.findFirst({
        where: { orgId, isDefault: true },
      });
      workflowConfigId = defaultWf?.id;
    }

    // Get initial status
    let statusId = null;
    if (workflowConfigId) {
      const workflow = await prisma.workflowConfig.findUnique({
        where: { id: workflowConfigId },
        include: { statuses: { orderBy: { order: 'asc' } } },
      });
      statusId = workflow?.statuses[0]?.id;
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        orgId,
        projectId,
        workflowConfigId,
        statusId,
        title: data.title || data[form.fields[0].id],
        description: data.description || '',
        priority: form.autoAssign?.priority || 'medium',
        type: form.autoAssign?.taskType || 'task',
        createdBy: userId,
        assignedTo: userId,
        formSubmissionData: data,
        formTemplateId: formId,
      },
    });

    // Create approval if needed
    let approvalId = null;
    if (form.approvalWorkflow) {
      const approval = await prisma.approval.create({
        data: {
          orgId,
          workflowId: form.approvalWorkflow,
          title: `Approval: ${task.title}`,
          description: `Form submission approval for ${form.name}`,
          content: JSON.stringify(data),
          requestedBy: userId,
          relatedTaskId: task.id,
          status: 'pending',
          currentStep: 1,
          steps: {
            create: APPROVAL_WORKFLOWS[form.approvalWorkflow].steps.map((step) => ({
              stepId: step.id,
              stepName: step.name,
              stepOrder: step.order,
              role: step.role,
              status: 'pending',
              parallel: step.parallel || false,
            })),
          },
        },
      });
      approvalId = approval.id;
    }

    return {
      task_id: task.id,
      approval_id: approvalId,
      form_id: formId,
      status: 'submitted',
      message: `Form submitted successfully. ${approvalId ? 'Approval workflow initiated.' : 'Task created.'}`,
    };
  }

  /**
   * Get form submissions for a user
   */
  async getFormSubmissions(orgId, userId, { form_id, status, page = 1, page_size = 20 } = {}) {
    const where = {
      orgId,
      createdBy: userId,
      ...(form_id && { formTemplateId: form_id }),
    };

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: { select: { id: true, name: true, key: true } },
          status: { select: { id: true, name: true, color: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * page_size,
        take: page_size,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      items: items.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        form_id: t.formTemplateId,
        project: t.project,
        status: t.status,
        priority: t.priority,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
      })),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  /**
   * Validate form data against template
   */
  _validateFormData(form, data) {
    const requiredFields = form.fields.filter((f) => f.required);

    for (const field of requiredFields) {
      if (!data[field.id]) {
        throw ApiError.badRequest(`Field "${field.name}" is required`);
      }
    }

    return true;
  }
}

module.exports = new FormService();
