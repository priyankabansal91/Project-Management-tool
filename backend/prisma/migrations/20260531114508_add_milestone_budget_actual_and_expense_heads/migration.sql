-- AlterEnum: add vertical_head and team_lead roles
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.

ALTER TYPE "OrgRole" ADD VALUE IF NOT EXISTS 'vertical_head';
ALTER TYPE "OrgRole" ADD VALUE IF NOT EXISTS 'team_lead';

-- AlterTable: divisions setup fields
ALTER TABLE "divisions" ADD COLUMN IF NOT EXISTS "setup_checklist" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "setup_completed_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "setup_status" "DivisionLifecycle" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable: milestones updated_at — drop db-level default (managed by Prisma @updatedAt)
ALTER TABLE "milestones" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable: projects add phase, budget, vertical_id
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "budget" DECIMAL(65,30),
ADD COLUMN IF NOT EXISTS "phase" "ProjectPhase" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS "vertical_id" TEXT;

-- CreateTable: verticals
CREATE TABLE IF NOT EXISTS "verticals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "status" TEXT NOT NULL DEFAULT 'active',
    "org_id" TEXT NOT NULL,
    "division_id" TEXT,
    "head_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lifecycle_status" "VerticalLifecycle" NOT NULL DEFAULT 'ACTIVE',
    "setup_checklist" JSONB NOT NULL DEFAULT '{}',
    "budget" DECIMAL(65,30),

    CONSTRAINT "verticals_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "verticals" ADD CONSTRAINT "verticals_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "verticals" ADD CONSTRAINT "verticals_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "verticals" ADD CONSTRAINT "verticals_head_id_fkey" FOREIGN KEY ("head_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "projects" ADD CONSTRAINT "projects_vertical_id_fkey" FOREIGN KEY ("vertical_id") REFERENCES "verticals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
