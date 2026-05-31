-- CreateEnum (safe, idempotent)
DO $$ BEGIN
  CREATE TYPE "MilestoneWaterfallStatus" AS ENUM ('NOT_STARTED', 'BLOCKED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DivisionLifecycle" AS ENUM ('DRAFT', 'CONFIGURING', 'PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "VerticalLifecycle" AS ENUM ('DRAFT', 'CONFIGURING', 'ACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProjectPhase" AS ENUM ('DRAFT', 'SETUP_PENDING', 'PENDING_APPROVAL', 'ACTIVE', 'ON_HOLD', 'PENDING_CLOSURE', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ─── milestones table ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "milestones" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "due_date" TIMESTAMP(3),
    "start_date" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "budget" DECIMAL(65,30),
    "actual_budget" DECIMAL(65,30),
    "budget_locked" BOOLEAN NOT NULL DEFAULT false,
    "expense_heads" JSONB,
    "effort_estimate" DECIMAL(65,30),
    "actual_effort" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "milestone_type" TEXT NOT NULL DEFAULT 'general',
    "approval_required" BOOLEAN NOT NULL DEFAULT false,
    "approval_id" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "waterfall_status" "MilestoneWaterfallStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "sequence_order" INTEGER,
    "predecessor_id" TEXT,
    "blocked_reason" TEXT,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "milestones" ADD CONSTRAINT "milestones_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "milestones" ADD CONSTRAINT "milestones_predecessor_id_fkey"
    FOREIGN KEY ("predecessor_id") REFERENCES "milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ─── tasks: missing columns ──────────────────────────────────────────────────

ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "milestone_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "depends_on_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "blocked_reason" TEXT;

DO $$ BEGIN
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_milestone_id_fkey"
    FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_depends_on_id_fkey"
    FOREIGN KEY ("depends_on_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ─── approvals: missing columns ──────────────────────────────────────────────

ALTER TABLE "approvals" ALTER COLUMN "workflow_id" DROP NOT NULL;
ALTER TABLE "approvals" ADD COLUMN IF NOT EXISTS "related_milestone_id" TEXT;
ALTER TABLE "approvals" ADD COLUMN IF NOT EXISTS "related_vertical_id" TEXT;
ALTER TABLE "approvals" ADD COLUMN IF NOT EXISTS "related_division_id" TEXT;
ALTER TABLE "approvals" ADD COLUMN IF NOT EXISTS "hierarchy_level" TEXT;
ALTER TABLE "approvals" ADD COLUMN IF NOT EXISTS "entity_type" TEXT;
ALTER TABLE "approvals" ADD COLUMN IF NOT EXISTS "entity_id" TEXT;
ALTER TABLE "approvals" ADD COLUMN IF NOT EXISTS "workflow_type" TEXT NOT NULL DEFAULT 'general';
