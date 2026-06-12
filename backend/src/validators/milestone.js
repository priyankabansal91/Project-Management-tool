const { z } = require('zod');

const createMilestoneSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  status: z.string().optional(),
  progress: z.number().optional(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  budget: z.union([z.number(), z.string()]).optional().nullable(),
  actualBudget: z.union([z.number(), z.string()]).optional().nullable(),
  budgetLocked: z.boolean().optional(),
  expenseHeads: z.array(z.object({
    name: z.string().min(1).optional(),
    head: z.string().optional(),
    label: z.string().optional(),
    planned_amount: z.union([z.number(), z.string()]).optional(),
    amount: z.union([z.number(), z.string()]).optional(),
  })).optional(),
  effortEstimate: z.union([z.number(), z.string()]).optional().nullable(),
  milestoneType: z.string().optional(),
  approvalRequired: z.boolean().optional(),
  currency: z.string().optional(),
  waterfallStatus: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'PENDING_APPROVAL']).optional(),
  sequence_order: z.number().int().optional(),
});

const updateMilestoneSchema = createMilestoneSchema.partial().extend({
  status: z.enum(['pending', 'in_progress', 'completed', 'blocked', 'review']).optional(),
  waterfallStatus: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'PENDING_APPROVAL']).optional(),
  blockedReason: z.string().optional().nullable(),
});

const closeMilestoneSchema = z.object({
  completionNotes: z.string().max(2000).optional(),
  reason: z.string().min(1).max(2000).optional(),
  actual_amount: z.union([z.number(), z.string()]).optional().nullable(),
});

module.exports = { createMilestoneSchema, updateMilestoneSchema, closeMilestoneSchema };
