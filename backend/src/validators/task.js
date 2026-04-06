const { z } = require('zod');

const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low', 'none']).optional().default('medium'),
  assignee_id: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  estimated_hours: z.number().positive().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  status_id: z.string().optional(),
  custom_fields: z.record(z.any()).optional().default({}),
  parent_task_id: z.string().uuid().optional().nullable(),
});

const updateTaskSchema = createTaskSchema.partial();

const moveTaskSchema = z.object({
  status_id: z.string(),
  status_name: z.string(),
  position: z.number(),
});

module.exports = { createTaskSchema, updateTaskSchema, moveTaskSchema };
