const { z } = require('zod');

const submitFormSchema = z.object({
  responses: z.record(z.any()).optional(),
}).passthrough(); // form submissions can have arbitrary fields

module.exports = { submitFormSchema };
