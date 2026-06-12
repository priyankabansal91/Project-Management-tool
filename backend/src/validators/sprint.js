const { z } = require('zod');

const createSprintSchema = z.object({
  name: z.string().min(1).max(100),
  goal: z.string().max(1000).optional().default(''),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
});

const updateSprintSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  goal: z.string().max(1000).optional(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  status: z.enum(['planned', 'active', 'completed', 'planning', 'cancelled']).optional(),
});

const addSprintTaskSchema = z.object({
  task_id: z.string().min(1),
});

module.exports = { createSprintSchema, updateSprintSchema, addSprintTaskSchema };
