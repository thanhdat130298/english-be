-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- AlterTable
ALTER TABLE "Vocabulary" ADD COLUMN "difficulty" "Difficulty",
ADD COLUMN "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "correctCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN "nextReviewAt" TIMESTAMP(3),
ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: first review scheduled 1 day after creation
UPDATE "Vocabulary" SET "nextReviewAt" = "createdAt" + INTERVAL '1 day' WHERE "nextReviewAt" IS NULL;

-- CreateIndex
CREATE INDEX "Vocabulary_nextReviewAt_idx" ON "Vocabulary"("nextReviewAt");
