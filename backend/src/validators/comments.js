const { z } = require('zod');

const createCommentSchema = z.object({
  body: z.string().min(1).max(10000),
  parent_id: z.string().optional().nullable(),
});

const updateCommentSchema = z.object({
  body: z.string().min(1).max(10000),
});

module.exports = { createCommentSchema, updateCommentSchema };
