const { z } = require('zod');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const createTimeLogSchema = z.object({
  taskId: z.string().max(100).optional(),
  taskKey: z.string().max(50).optional(),
  taskTitle: z.string().max(255).optional(),
  projectId: z.string().max(100).optional(),
  projectKey: z.string().max(50).optional(),
  projectColor: z.string().max(20).optional(),
  divisionId: z.string().max(100).optional(),
  hours: z.coerce.number().positive().max(24),
  description: z.string().max(2000).optional(),
  loggedDate: z.string().regex(DATE_RE, 'loggedDate must be YYYY-MM-DD').optional(),
  billable: z.boolean().optional().default(false),
});

const updateTimeLogSchema = z.object({
  hours: z.coerce.number().positive().max(24).optional(),
  description: z.string().max(2000).optional(),
  loggedDate: z.string().regex(DATE_RE).optional(),
});

const submitTimesheetSchema = z.object({
  weekStart: z.string().regex(DATE_RE, 'weekStart must be YYYY-MM-DD'),
  note: z.string().max(500).optional(),
});

module.exports = { createTimeLogSchema, updateTimeLogSchema, submitTimesheetSchema };
