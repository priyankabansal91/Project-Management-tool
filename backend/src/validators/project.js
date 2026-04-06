const { z } = require('zod');

const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  key: z.string().min(2).max(10).toUpperCase(),
  visibility: z.enum(['private', 'org_wide', 'public']).optional().default('private'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#3B82F6'),
  workflow_config_id: z.string().uuid().optional(),
  start_date: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
});

const updateProjectSchema = createProjectSchema.partial();

module.exports = { createProjectSchema, updateProjectSchema };
