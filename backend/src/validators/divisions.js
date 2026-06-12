const { z } = require('zod');

const createDivisionSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(2).max(20).transform(v => v.toUpperCase()),
  description: z.string().max(2000).optional(),
  parent_id: z.string().optional().nullable(),
  manager_id: z.string().optional().nullable(),
  budget: z.union([z.number(), z.string()]).optional().nullable(),
  head_count: z.number().int().optional().nullable(),
});

const updateDivisionSchema = createDivisionSchema.partial();

const addDivisionMemberSchema = z.object({
  user_id: z.string().min(1),
  role: z.enum(['division_admin', 'vertical_head', 'project_manager', 'member', 'viewer']).default('member'),
});

const updateReadinessSchema = z.object({
  key: z.string().min(1),
  completed: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
});

module.exports = { createDivisionSchema, updateDivisionSchema, addDivisionMemberSchema, updateReadinessSchema };
