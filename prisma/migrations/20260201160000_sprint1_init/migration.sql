-- This file was generated from the Prisma schema using:
--   prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script
-- It is intended to be applied to PostgreSQL.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationCache" (
    "id" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "sourceLang" TEXT,
    "targetLang" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "detectedSourceLang" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'deepl',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslationCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vocabulary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "example" TEXT,
    "sourceText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wordlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wordlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordlistItem" (
    "wordlistId" TEXT NOT NULL,
    "vocabularyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordlistItem_pkey" PRIMARY KEY ("wordlistId","vocabularyId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "TranslationCache_normalizedText_idx" ON "TranslationCache"("normalizedText");

-- CreateIndex
CREATE UNIQUE INDEX "TranslationCache_normalizedText_sourceLang_targetLang_key" ON "TranslationCache"("normalizedText", "sourceLang", "targetLang");

-- CreateIndex
CREATE INDEX "Vocabulary_userId_idx" ON "Vocabulary"("userId");

-- CreateIndex
CREATE INDEX "Vocabulary_createdAt_idx" ON "Vocabulary"("createdAt");

-- CreateIndex
CREATE INDEX "Wordlist_userId_idx" ON "Wordlist"("userId");

-- CreateIndex
CREATE INDEX "WordlistItem_vocabularyId_idx" ON "WordlistItem"("vocabularyId");

-- AddForeignKey
ALTER TABLE "Vocabulary" ADD CONSTRAINT "Vocabulary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wordlist" ADD CONSTRAINT "Wordlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordlistItem" ADD CONSTRAINT "WordlistItem_wordlistId_fkey" FOREIGN KEY ("wordlistId") REFERENCES "Wordlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordlistItem" ADD CONSTRAINT "WordlistItem_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;






