import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Difficulty, Vocabulary } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';
import { ListVocabularyQueryDto } from './dto/list-vocabulary.query.dto';
import { ReviewResult } from './dto/review-vocab.dto';
import { UpdateVocabularyDto } from './dto/update-vocabulary.dto';
import { deriveVocabState } from './vocab-derivation';
import {
  addDaysUtc,
  initialVocabularyLearningFields,
  nextReviewAfterEasy,
} from './vocab-learning-defaults';

/** Same shape as translate API dictionary (full meaning from Free Dictionary API). */
export type DictionaryEntry = {
  word?: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
  origin?: string;
  meanings?: Array<{
    partOfSpeech?: string;
    definitions?: Array<{
      definition?: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }>;
  }>;
  [key: string]: unknown;
};

export type VocabularyWithDictionary = Vocabulary & {
  dictionary?: DictionaryEntry[] | null;
  isNew: boolean;
  isDue: boolean;
  isMastered: boolean;
};

/** Last path segment of URL (e.g. "high" from ".../wiki/high"). */
function lastPathSegment(urlStr: string): string {
  try {
    const pathname = new URL(urlStr).pathname;
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    return last ? decodeURIComponent(last).toLowerCase() : '';
  } catch {
    return '';
  }
}

/** Keep only entries that match the word. Exclude homographs using sourceUrls. */
function filterDictionaryForWord(
  entries: DictionaryEntry[] | null,
  word: string,
): DictionaryEntry[] | null {
  if (!entries?.length) return entries;
  const normalized = word.trim().toLowerCase();
  const filtered = entries.filter((e) => {
    if ((e.word ?? '').trim().toLowerCase() !== normalized) return false;
    const urls = e.sourceUrls as string[] | undefined;
    if (!urls?.length) return true;
    return urls.every((url) => lastPathSegment(url) === normalized);
  });
  return filtered.length > 0 ? filtered : entries;
}

function attachDerived(
  v: Vocabulary,
  now = new Date(),
): Omit<VocabularyWithDictionary, 'dictionary'> {
  const d = deriveVocabState(v, now);
  return { ...v, ...d };
}

@Injectable()
export class VocabularyService {
  constructor(private readonly prisma: PrismaService) {}

  /** Find existing vocabulary by user and word (case-insensitive). */
  async findOneByUserAndWord(
    userId: string,
    word: string,
  ): Promise<Vocabulary | null> {
    const w = word.trim();
    if (!w) return null;
    return this.prisma.vocabulary.findFirst({
      where: {
        userId,
        word: { equals: w, mode: 'insensitive' },
      },
    });
  }

  async create(userId: string, dto: CreateVocabularyDto) {
    const existing = await this.findOneByUserAndWord(userId, dto.word);
    if (existing) return attachDerived(existing);
    const now = new Date();
    const init = initialVocabularyLearningFields(now);
    const row = await this.prisma.vocabulary.create({
      data: {
        userId,
        word: dto.word,
        meaning: dto.meaning,
        example: dto.example ?? null,
        sourceText: dto.sourceText ?? null,
        ...init,
      },
    });
    return attachDerived(row);
  }

  private buildListWhere(
    userId: string,
    query: ListVocabularyQueryDto,
    now: Date,
  ): Prisma.VocabularyWhereInput {
    const parts: Prisma.VocabularyWhereInput[] = [{ userId }];

    if (!query.includeArchived) {
      parts.push({ isArchived: false });
    }

    if (query.difficulty) {
      parts.push({ difficulty: query.difficulty });
    }

    if (query.search?.length) {
      const s = query.search.trim();
      parts.push({
        OR: [
          { word: { contains: s, mode: 'insensitive' } },
          { meaning: { contains: s, mode: 'insensitive' } },
        ],
      });
    }

    if (query.isDue === true) {
      parts.push({ nextReviewAt: { lte: now } });
    } else if (query.isDue === false) {
      parts.push({
        OR: [{ nextReviewAt: null }, { nextReviewAt: { gt: now } }],
      });
    }

    if (query.isNew === true) {
      parts.push({ reviewCount: 0 });
    } else if (query.isNew === false) {
      parts.push({ reviewCount: { gt: 0 } });
    }

    return parts.length === 1 ? parts[0] : { AND: parts };
  }

  async list(
    userId: string,
    query: ListVocabularyQueryDto,
  ): Promise<{
    items: VocabularyWithDictionary[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const skip = (page - 1) * limit;
    const now = new Date();

    const where = this.buildListWhere(userId, query, now);

    const allRows = await this.prisma.vocabulary.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    const seen = new Set<string>();
    const rows: Vocabulary[] = [];
    for (const r of allRows) {
      const key = r.word.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(r);
    }
    const total = rows.length;
    const pageRows = rows.slice(skip, skip + limit);

    const words = [
      ...new Set(pageRows.map((r) => r.word.trim().toLowerCase())),
    ];
    const dictRows =
      words.length > 0
        ? await this.prisma.dictionaryCache.findMany({
            where: { word: { in: words } },
          })
        : [];
    const dictByWord = new Map<string, DictionaryEntry[]>(
      dictRows.map((d) => [d.word, (d.data as DictionaryEntry[]) ?? []]),
    );

    const items: VocabularyWithDictionary[] = pageRows.map((v) => {
      const raw = dictByWord.get(v.word.trim().toLowerCase()) ?? null;
      const dictionary = filterDictionaryForWord(raw, v.word);
      return { ...attachDerived(v, now), dictionary };
    });

    return { items, total, page, pageSize: limit };
  }

  async getReviewQueue(userId: string): Promise<VocabularyWithDictionary[]> {
    const now = new Date();
    const rows = await this.prisma.vocabulary.findMany({
      where: {
        userId,
        isArchived: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    const words = [...new Set(rows.map((r) => r.word.trim().toLowerCase()))];
    const dictRows =
      words.length > 0
        ? await this.prisma.dictionaryCache.findMany({
            where: { word: { in: words } },
          })
        : [];
    const dictByWord = new Map<string, DictionaryEntry[]>(
      dictRows.map((d) => [d.word, (d.data as DictionaryEntry[]) ?? []]),
    );
    return rows.map((v) => {
      const raw = dictByWord.get(v.word.trim().toLowerCase()) ?? null;
      const dictionary = filterDictionaryForWord(raw, v.word);
      return { ...attachDerived(v, now), dictionary };
    });
  }

  async getById(userId: string, id: string) {
    const vocab = await this.prisma.vocabulary.findFirst({
      where: { id, userId },
    });
    if (!vocab) throw new NotFoundException('vocabulary not found');
    return attachDerived(vocab);
  }

  async update(userId: string, id: string, dto: UpdateVocabularyDto) {
    await this.getById(userId, id);

    const row = await this.prisma.vocabulary.update({
      where: { id },
      data: {
        word: dto.word ?? undefined,
        meaning: dto.meaning ?? undefined,
        example: dto.example ?? undefined,
        sourceText: dto.sourceText ?? undefined,
      },
    });
    return attachDerived(row);
  }

  async review(userId: string, id: string, result: ReviewResult) {
    const vocab = await this.prisma.vocabulary.findFirst({
      where: { id, userId },
    });
    if (!vocab) throw new NotFoundException('vocabulary not found');
    if (vocab.isArchived) {
      throw new BadRequestException('cannot review archived vocabulary');
    }

    const now = new Date();
    let difficulty: Difficulty;
    const reviewCountInc = 1;
    let correctCountInc = 0;
    let nextReviewAt: Date;

    switch (result) {
      case ReviewResult.HARD:
        difficulty = 'HARD';
        nextReviewAt = addDaysUtc(now, 1);
        break;
      case ReviewResult.MEDIUM:
        difficulty = 'MEDIUM';
        correctCountInc = 1;
        nextReviewAt = addDaysUtc(now, 3);
        break;
      case ReviewResult.EASY:
        difficulty = 'EASY';
        correctCountInc = 1;
        nextReviewAt = nextReviewAfterEasy(now);
        break;
      default:
        throw new BadRequestException('invalid result');
    }

    const row = await this.prisma.vocabulary.update({
      where: { id },
      data: {
        difficulty,
        reviewCount: { increment: reviewCountInc },
        correctCount: { increment: correctCountInc },
        lastReviewedAt: now,
        nextReviewAt,
      },
    });
    return attachDerived(row);
  }

  async archive(userId: string, id: string) {
    await this.getById(userId, id);
    const row = await this.prisma.vocabulary.update({
      where: { id },
      data: { isArchived: true },
    });
    return attachDerived(row);
  }

  /** Soft-delete: marks archived (no permanent delete). */
  async remove(userId: string, id: string) {
    return this.archive(userId, id);
  }
}
