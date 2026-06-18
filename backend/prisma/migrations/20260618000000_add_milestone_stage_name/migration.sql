-- AlterTable: add stage_name column to milestones
ALTER TABLE "milestones" ADD COLUMN IF NOT EXISTS "stage_name" TEXT;
