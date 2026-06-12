const { z } = require('zod');

const ROLES = ['org_admin', 'division_admin', 'vertical_head', 'project_manager', 'team_lead', 'member', 'viewer', 'executive'];

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(ROLES).default('member'),
  division_id: z.string().optional(),
  message: z.string().max(500).optional(),
});

const createDirectMemberSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  password: z.string().min(8),
  role: z.enum(ROLES).default('member'),
  division_id: z.string().optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(ROLES),
});

const updateStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'inactive']),
  reason: z.string().optional(),
});

module.exports = { inviteMemberSchema, createDirectMemberSchema, updateRoleSchema, updateStatusSchema };
