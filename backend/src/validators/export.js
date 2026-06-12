const { z } = require('zod');

const EXPORT_FORMATS = ['csv', 'json', 'xlsx', 'pdf'];
const EXPORT_TYPES = ['tasks', 'projects', 'timeLogs', 'members'];

const exportTasksSchema = z.object({
  format: z.enum(EXPORT_FORMATS),
  filters: z.record(z.any()).optional(),
  columns: z.array(z.string()).optional(),
});

const exportProjectsSchema = z.object({
  format: z.enum(EXPORT_FORMATS),
  filters: z.record(z.any()).optional(),
  columns: z.array(z.string()).optional(),
});

const createExportSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  exportType: z.enum(EXPORT_TYPES),
  format: z.enum(EXPORT_FORMATS).default('csv'),
  filters: z.record(z.any()).optional(),
  columns: z.array(z.string()).optional(),
  project_id: z.string().optional(),
  date_from: z.string().optional().nullable(),
  date_to: z.string().optional().nullable(),
});

module.exports = { exportTasksSchema, exportProjectsSchema, createExportSchema };
