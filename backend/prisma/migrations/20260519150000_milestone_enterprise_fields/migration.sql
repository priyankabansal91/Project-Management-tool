-- Milestone enterprise fields: budget, effort tracking, type, approval workflow
ALTER TABLE "milestones" ADD COLUMN IF NOT EXISTS "budget" DECIMAL(65,30);
ALTER TABLE "milestones" ADD COLUMN IF NOT EXISTS "effort_estimate" DECIMAL(65,30);
ALTER TABLE "milestones" ADD COLUMN IF NOT EXISTS "actual_effort" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "milestones" ADD COLUMN IF NOT EXISTS "milestone_type" TEXT NOT NULL DEFAULT 'general';
ALTER TABLE "milestones" ADD COLUMN IF NOT EXISTS "approval_required" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "milestones" ADD COLUMN IF NOT EXISTS "approval_id" TEXT;
ALTER TABLE "milestones" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'INR';

-- Approval model: entity linking and workflow type
ALTER TABLE "approvals" ADD COLUMN IF NOT EXISTS "entity_type" TEXT;
ALTER TABLE "approvals" ADD COLUMN IF NOT EXISTS "entity_id" TEXT;
ALTER TABLE "approvals" ADD COLUMN IF NOT EXISTS "workflow_type" TEXT NOT NULL DEFAULT 'general';

-- Make workflow_id nullable (for milestone closure approvals that don't reference a workflow template)
ALTER TABLE "approvals" ALTER COLUMN "workflow_id" DROP NOT NULL;
