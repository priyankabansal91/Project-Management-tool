-- AlterTable: add expense_heads column to projects
ALTER TABLE "projects" ADD COLUMN "expense_heads" JSONB;
