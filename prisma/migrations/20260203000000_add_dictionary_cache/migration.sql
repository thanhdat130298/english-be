-- CreateTable
CREATE TABLE "DictionaryCache" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DictionaryCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DictionaryCache_word_key" ON "DictionaryCache"("word");

-- CreateIndex
CREATE INDEX "DictionaryCache_word_idx" ON "DictionaryCache"("word");
