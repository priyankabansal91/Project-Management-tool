const { z } = require('zod');

const registerSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(
    /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/,
    'Password must contain uppercase, number, and special character'
  ),
  org_name: z.string().min(2).max(255),
  org_slug: z.string().regex(/^[a-z0-9-]{3,100}$/),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

module.exports = { registerSchema, loginSchema };
