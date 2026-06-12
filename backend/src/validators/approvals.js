const { z } = require('zod');

const createApprovalSchema = z.object({
  workflow_id: z.string().min(1),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  entity_type: z.string().optional(),
  entity_id: z.string().optional(),
  related_project_id: z.string().optional(),
});

const approveStepSchema = z.object({
  comment: z.string().max(2000).optional(),
  step_id: z.string().optional(),
});

const rejectStepSchema = z.object({
  reason: z.string().min(1).max(2000),
  step_id: z.string().optional(),
});

module.exports = { createApprovalSchema, approveStepSchema, rejectStepSchema };
