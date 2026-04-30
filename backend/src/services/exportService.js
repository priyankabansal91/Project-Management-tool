const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class ExportService {
  /**
   * Create an export request
   */
  async createExport(orgId, userId, data) {
    const { name, description, exportType, format, filters, columns } = data;

    // Validate format
    const validFormats = ['csv', 'json', 'xlsx', 'pdf'];
    if (!validFormats.includes(format)) {
      throw ApiError.badRequest(`Invalid format. Must be one of: ${validFormats.join(', ')}`);
    }

    const exportRecord = await prisma.export.create({
      data: {
        orgId,
        name,
        description,
        exportType,
        format,
        filters: JSON.stringify(filters || {}),
        columns: JSON.stringify(columns || []),
        status: 'pending',
        requestedBy: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // TODO: Queue export job for background processing
    // For now, mark as processing
    await prisma.export.update({
      where: { id: exportRecord.id },
      data: { status: 'processing' },
    });

    return this._formatExport(exportRecord);
  }

  /**
   * Get export by ID
   */
  async getById(orgId, exportId) {
    const exportRecord = await prisma.export.findFirst({
      where: { id: exportId, orgId },
    });

    if (!exportRecord) throw ApiError.notFound('Export not found');
    return this._formatExport(exportRecord);
  }

  /**
   * List exports
   */
  async list(orgId, { exportType, status, page = 1, page_size = 20 } = {}) {
    page = parseInt(page) || 1;
    page_size = parseInt(page_size) || 20;
    const where = {
      orgId,
      ...(exportType && { exportType }),
      ...(status && { status }),
    };

    const [items, total] = await Promise.all([
      prisma.export.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * page_size,
        take: page_size,
      }),
      prisma.export.count({ where }),
    ]);

    return {
      items: items.map((e) => this._formatExport(e)),
      pagination: { page, page_size, total, total_pages: Math.ceil(total / page_size) },
    };
  }

  /**
   * Export tasks
   */
  async exportTasks(orgId, userId, data) {
    const { format, filters, columns } = data;

    // Build query based on filters
    const where = {
      orgId,
      deletedAt: null,
      ...(filters?.projectId && { projectId: filters.projectId }),
      ...(filters?.status && { statusName: filters.status }),
      ...(filters?.priority && { priority: filters.priority }),
      ...(filters?.assigneeId && { assigneeId: filters.assigneeId }),
    };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { name: true, key: true } },
        assignee: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    // Format data based on columns
    const exportData = tasks.map((task) => {
      const row = {};
      if (!columns || columns.length === 0) {
        // Default columns
        row.id = task.id;
        row.title = task.title;
        row.project = task.project?.name;
        row.status = task.statusName;
        row.priority = task.priority;
        row.assignee = task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : '';
        row.dueDate = task.dueDate;
        row.createdAt = task.createdAt;
      } else {
        // Custom columns
        columns.forEach((col) => {
          switch (col) {
            case 'id':
              row.id = task.id;
              break;
            case 'title':
              row.title = task.title;
              break;
            case 'description':
              row.description = task.description;
              break;
            case 'project':
              row.project = task.project?.name;
              break;
            case 'status':
              row.status = task.statusName;
              break;
            case 'priority':
              row.priority = task.priority;
              break;
            case 'assignee':
              row.assignee = task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : '';
              break;
            case 'dueDate':
              row.dueDate = task.dueDate;
              break;
            case 'createdAt':
              row.createdAt = task.createdAt;
              break;
          }
        });
      }
      return row;
    });

    // Create export record
    const exportRecord = await prisma.export.create({
      data: {
        orgId,
        name: `Tasks Export - ${new Date().toISOString().split('T')[0]}`,
        exportType: 'tasks',
        format,
        filters: JSON.stringify(filters || {}),
        columns: JSON.stringify(columns || []),
        status: 'completed',
        recordCount: exportData.length,
        requestedBy: userId,
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      export: this._formatExport(exportRecord),
      data: exportData,
    };
  }

  /**
   * Export projects
   */
  async exportProjects(orgId, userId, data) {
    const { format, filters, columns } = data;

    const where = {
      orgId,
      deletedAt: null,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.visibility && { visibility: filters.visibility }),
    };

    const projects = await prisma.project.findMany({
      where,
      include: {
        _count: { select: { tasks: true, members: true } },
      },
    });

    const exportData = projects.map((project) => {
      const row = {};
      if (!columns || columns.length === 0) {
        row.id = project.id;
        row.name = project.name;
        row.key = project.key;
        row.status = project.status;
        row.visibility = project.visibility;
        row.taskCount = project._count.tasks;
        row.memberCount = project._count.members;
        row.createdAt = project.createdAt;
      } else {
        columns.forEach((col) => {
          switch (col) {
            case 'id':
              row.id = project.id;
              break;
            case 'name':
              row.name = project.name;
              break;
            case 'key':
              row.key = project.key;
              break;
            case 'status':
              row.status = project.status;
              break;
            case 'visibility':
              row.visibility = project.visibility;
              break;
            case 'taskCount':
              row.taskCount = project._count.tasks;
              break;
            case 'memberCount':
              row.memberCount = project._count.members;
              break;
            case 'createdAt':
              row.createdAt = project.createdAt;
              break;
          }
        });
      }
      return row;
    });

    const exportRecord = await prisma.export.create({
      data: {
        orgId,
        name: `Projects Export - ${new Date().toISOString().split('T')[0]}`,
        exportType: 'projects',
        format,
        filters: JSON.stringify(filters || {}),
        columns: JSON.stringify(columns || []),
        status: 'completed',
        recordCount: exportData.length,
        requestedBy: userId,
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      export: this._formatExport(exportRecord),
      data: exportData,
    };
  }

  /**
   * Delete export
   */
  async delete(orgId, exportId) {
    const exportRecord = await prisma.export.findFirst({
      where: { id: exportId, orgId },
    });

    if (!exportRecord) throw ApiError.notFound('Export not found');

    await prisma.export.delete({
      where: { id: exportId },
    });

    return { success: true };
  }

  /**
   * Format export for response
   */
  _formatExport(exportRecord) {
    return {
      id: exportRecord.id,
      name: exportRecord.name,
      description: exportRecord.description,
      export_type: exportRecord.exportType,
      format: exportRecord.format,
      status: exportRecord.status,
      file_url: exportRecord.fileUrl,
      file_size: exportRecord.fileSize,
      record_count: exportRecord.recordCount,
      error_message: exportRecord.errorMessage,
      completed_at: exportRecord.completedAt,
      expires_at: exportRecord.expiresAt,
      created_at: exportRecord.createdAt,
      updated_at: exportRecord.updatedAt,
    };
  }
}

module.exports = new ExportService();
