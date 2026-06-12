const { z } = require('zod');

const createOkrSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  type: z.enum(['objective', 'key_result']).default('objective'),
  parent_id: z.string().optional().nullable(),
  target_value: z.number().optional().nullable(),
  current_value: z.number().optional().nullable(),
  due_date: z.string().optional().nullable(),
  owner_id: z.string().optional().nullable(),
});

const updateOkrSchema = createOkrSchema.partial().extend({
  status: z.enum(['on_track', 'at_risk', 'behind', 'completed']).optional(),
  progress: z.number().min(0).max(100).optional(),
});

module.exports = { createOkrSchema, updateOkrSchema };
