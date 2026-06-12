const { z } = require('zod');

const createStageTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  division_id: z.string().optional().nullable(),
  divisionId: z.string().optional().nullable(),
  is_default: z.boolean().optional().default(false),
});

const updateStageTemplateSchema = createStageTemplateSchema.partial();

const bulkSubstagesSchema = z.object({
  names: z.array(z.string().min(1)).min(1).max(50),
});

const addSubstageSchema = z.object({
  name: z.string().min(1).max(255),
  order: z.number().int().optional(),
  description: z.string().max(1000).optional(),
});

module.exports = { createStageTemplateSchema, updateStageTemplateSchema, bulkSubstagesSchema, addSubstageSchema };
