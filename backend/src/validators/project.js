const { z } = require('zod');

const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  key: z.string().min(2).max(10).toUpperCase().optional(),
  visibility: z.enum(['private', 'org_wide', 'public']).optional().default('private'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#3B82F6'),
  workflow_config_id: z.string().optional(),
  start_date: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  budget: z.union([z.number(), z.string()]).optional().nullable(),
  estimated_hours: z.union([z.number(), z.string()]).optional().nullable(),
  division_id: z.string().optional().nullable(),
  vertical_id: z.string().optional().nullable(),
  project_manager_id: z.string().optional().nullable(),
  milestones: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    budget: z.union([z.number(), z.string()]).optional().nullable(),
    start_date: z.string().optional().nullable(),
    due_date: z.string().optional().nullable(),
    stage_name: z.string().optional().nullable(),
  })).optional(),
  stage_template_id: z.string().optional().nullable(),
  expense_heads: z.any().optional().nullable(),
  submit_for_approval: z.boolean().optional(),
});

const updateProjectSchema = createProjectSchema.partial().extend({
  phase: z.enum(['DRAFT', 'SETUP_PENDING', 'PENDING_APPROVAL', 'ACTIVE', 'ON_HOLD', 'PENDING_CLOSURE', 'CLOSED']).optional(),
  status: z.string().optional(),
});

module.exports = { createProjectSchema, updateProjectSchema };
