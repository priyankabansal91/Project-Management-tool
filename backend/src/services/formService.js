const ApiError = require('../utils/ApiError');
const FORM_TEMPLATES = require('../utils/formTemplates');
const APPROVAL_WORKFLOWS = require('../utils/approvalWorkflows');

// In-memory storage for development (until database is set up)
const tasksStore = new Map();
const approvalsStore = new Map();

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

    // Create task
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const task = {
      id: taskId,
      orgId,
      title: data.title || data[form.fields[0]?.id] || 'Untitled Task',
      description: data.description || '',
      priority: form.autoAssign?.priority || 'medium',
      type: form.autoAssign?.taskType || 'task',
      createdBy: userId,
      assignedTo: userId,
      formSubmissionData: data,
      formTemplateId: formId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    tasksStore.set(taskId, task);

    // Create approval if needed
    let approvalId = null;
    if (form.approvalWorkflow) {
      const workflow = APPROVAL_WORKFLOWS[form.approvalWorkflow];
      if (workflow) {
        const approval = {
          id: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          orgId,
          workflowId: form.approvalWorkflow,
          title: `Approval: ${task.title}`,
          description: `Form submission approval for ${form.name}`,
          content: JSON.stringify(data),
          requestedBy: userId,
          relatedTaskId: taskId,
          status: 'pending',
          currentStep: 1,
          steps: workflow.steps.map((step, index) => ({
            id: `step_${index}`,
            stepId: step.id,
            stepName: step.name,
            stepOrder: step.order,
            role: step.role,
            status: 'pending',
            parallel: step.parallel || false,
          })),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        approvalsStore.set(approval.id, approval);
        approvalId = approval.id;
      }
    }

    return {
      task_id: taskId,
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
    page = parseInt(page) || 1;
    page_size = parseInt(page_size) || 20;
    let items = Array.from(tasksStore.values())
      .filter(t => t.orgId === orgId && t.createdBy === userId);

    if (form_id) {
      items = items.filter(t => t.formTemplateId === form_id);
    }

    items.sort((a, b) => b.createdAt - a.createdAt);

    const total = items.length;
    const paginatedItems = items.slice((page - 1) * page_size, page * page_size);

    return {
      items: paginatedItems.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        form_id: t.formTemplateId,
        project: null,
        status: null,
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
