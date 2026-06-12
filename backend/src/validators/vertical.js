const { z } = require('zod');

const createVerticalSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  color: z.string().optional(),
  status: z.string().optional(),
  division_id: z.string().optional().nullable(),
  divisionId: z.string().optional().nullable(),
  head_id: z.string().optional().nullable(),
  headId: z.string().optional().nullable(),
  budget: z.union([z.number(), z.string()]).optional().nullable(),
});

const updateVerticalSchema = createVerticalSchema.partial().extend({
  lifecycleStatus: z.enum(['active', 'inactive', 'archived']).optional(),
});

module.exports = { createVerticalSchema, updateVerticalSchema };
