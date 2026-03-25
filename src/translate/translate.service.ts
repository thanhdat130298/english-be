import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { initialVocabularyLearningFields } from '../vocabulary/vocab-learning-defaults';
import { TranslateDto } from './dto/translate.dto';

const DICTIONARY_API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';

/**
 * Translate flow:
 * 1. Normalize input text.
 * 2. Fetch dictionary data: DictionaryCache by word, or GET dictionaryapi.dev/entries/en/<word>; if 200 and array, cache and use.
 * 3. Translation: TranslationCache by (normalizedText, sourceLang, targetLang); if miss, call DeepL and cache.
 * 4. Return translation + dictionary. Save to Vocabulary only when saveToVocabulary=true (user clicks "lưu vào word list").
 */

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

/** Keep only entries that match the input word. Exclude homographs (e.g. "high" when searching "hi") using sourceUrls. */
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

type TranslateResponse = {
  text: string;
  sourceLang?: string;
  targetLang: string;
  detectedSourceLang?: string;
  translatedText: string;
  cached: boolean;
  dictionary?: DictionaryEntry[] | null;
  vocabulary?: {
    id: string;
  };
};

type DeeplResponse = {
  translations: Array<{
    detected_source_language?: string;
    text: string;
  }>;
};

@Injectable()
export class TranslateService {
  constructor(private readonly prisma: PrismaService) {}

  private getDeeplConfig() {
    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPL_API_KEY is not set');
    }

    const apiUrl =
      process.env.DEEPL_API_URL ?? 'https://api-free.deepl.com/v2/translate';
    return { apiKey, apiUrl };
  }

  /** Get dictionary data from cache or Free Dictionary API. Returns data + optional cacheItem to insert in transaction. */
  private async getDictionary(normalizedWord: string): Promise<{
    data: DictionaryEntry[] | null;
    cacheItem: { word: string; data: object } | null;
  }> {
    const word = normalizedWord.trim().toLowerCase();
    if (!word) return { data: null, cacheItem: null };

    const cached = await this.prisma.dictionaryCache.findUnique({
      where: { word },
    });
    if (cached && Array.isArray(cached.data)) {
      return { data: cached.data as DictionaryEntry[], cacheItem: null };
    }

    const url = `${DICTIONARY_API_BASE}/${encodeURIComponent(word)}`;
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) return { data: null, cacheItem: null };

    const data = (await resp.json()) as unknown;
    if (!Array.isArray(data) || data.length === 0)
      return { data: null, cacheItem: null };

    return {
      data: data as DictionaryEntry[],
      cacheItem: { word, data: data as object },
    };
  }

  async translate(
    userId: string,
    dto: TranslateDto,
  ): Promise<TranslateResponse> {
    const normalizedText = dto.text.trim().toLowerCase();
    const sourceLang = 'EN'; // Always English (Dictionary API is en)
    const targetLang = 'VI';

    const { data: dictionary, cacheItem: dictionaryCacheItem } =
      await this.getDictionary(normalizedText);

    // Lookup cache: match both sourceLang 'EN' and null (old rows) so we never call DeepL when a translation exists.
    const cached = await this.prisma.translationCache.findFirst({
      where: {
        normalizedText: normalizedText,
      },
    });

    if (cached) {
      const base: TranslateResponse = {
        text: normalizedText,
        sourceLang: sourceLang ?? undefined,
        targetLang,
        detectedSourceLang: cached.detectedSourceLang ?? undefined,
        translatedText: cached.translatedText,
        cached: true,
        dictionary:
          filterDictionaryForWord(dictionary, normalizedText) ?? undefined,
      };
      return this.maybeSaveVocabulary(userId, dto, base);
    }
    // Cache miss only: call DeepL (do not run when cached above to save quota).
    const { apiKey, apiUrl } = this.getDeeplConfig();

    const body = new URLSearchParams();
    body.set('text', normalizedText);
    body.set('target_lang', targetLang);
    if (sourceLang) body.set('source_lang', sourceLang);

    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // DeepL (Nov 2025+): legacy form-body auth_key is deprecated; use header-based auth.
        Authorization: `DeepL-Auth-Key ${apiKey}`,
      },
      body,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new BadGatewayException({
        message: 'DeepL request failed',
        status: resp.status,
        details: text.slice(0, 500),
      });
    }

    const json = (await resp.json()) as DeeplResponse;
    const translation = json?.translations?.[0];
    if (!translation?.text) {
      throw new InternalServerErrorException(
        'DeepL returned an unexpected response',
      );
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        if (dictionaryCacheItem) {
          try {
            await tx.dictionaryCache.create({
              data: dictionaryCacheItem,
            });
          } catch {
            // race: another request cached it, ignore
          }
        }

        let created;
        try {
          created = await tx.translationCache.create({
            data: {
              normalizedText,
              sourceLang,
              targetLang,
              translatedText: translation.text,
              detectedSourceLang: translation.detected_source_language ?? null,
              provider: 'deepl',
            },
          });
        } catch (createErr: unknown) {
          const code = (createErr as { code?: unknown } | null)?.code;
          if (code === 'P2002') {
            const reread = await tx.translationCache.findFirst({
              where: { normalizedText, sourceLang, targetLang },
            });
            if (reread) created = reread;
            else throw createErr;
          } else throw createErr;
        }

        let vocabularyId: string | undefined;
        if (dto.saveToVocabulary !== false) {
          const word = (dto.vocabularyWord?.trim() || normalizedText).trim();
          if (!word) {
            throw new BadRequestException('vocabulary word cannot be empty');
          }
          if (word.length > 128) {
            throw new BadRequestException(
              'text is too long to store as Vocabulary.word (max 128). Provide vocabularyWord (short) or save manually via /vocabulary.',
            );
          }
          const meaning = translation.text;
          if (meaning.length > 512) {
            throw new BadRequestException(
              'translatedText is too long to store as Vocabulary.meaning (max 512). Save manually via /vocabulary instead.',
            );
          }
          const existing = await tx.vocabulary.findFirst({
            where: { userId, word: { equals: word, mode: 'insensitive' } },
            select: { id: true },
          });
          if (existing) {
            vocabularyId = existing.id;
          } else {
            const init = initialVocabularyLearningFields();
            const vocab = await tx.vocabulary.create({
              data: {
                userId,
                word,
                meaning,
                example: dto.vocabularyExample ?? null,
                sourceText: dto.vocabularySourceText ?? null,
                ...init,
              },
              select: { id: true },
            });
            vocabularyId = vocab.id;
          }
        }

        return {
          created: created as {
            detectedSourceLang: string | null;
            translatedText: string;
          },
          vocabularyId,
        };
      });

      const { created: createdCache, vocabularyId: vocabId } = result;
      const base: TranslateResponse = {
        text: normalizedText,
        sourceLang,
        targetLang,
        detectedSourceLang: createdCache.detectedSourceLang ?? undefined,
        translatedText: createdCache.translatedText,
        cached: false,
        dictionary:
          filterDictionaryForWord(dictionary, normalizedText) ?? undefined,
        vocabulary: vocabId ? { id: vocabId } : undefined,
      };
      return base;
    } catch (err: unknown) {
      const code = (err as { code?: unknown } | null)?.code;
      if (code === 'P2002') {
        const reread = await this.prisma.translationCache.findFirst({
          where: { normalizedText, sourceLang, targetLang },
        });
        if (reread) {
          const base: TranslateResponse = {
            text: normalizedText,
            sourceLang,
            targetLang,
            detectedSourceLang: reread.detectedSourceLang ?? undefined,
            translatedText: reread.translatedText,
            cached: true,
            dictionary:
              filterDictionaryForWord(dictionary, normalizedText) ?? undefined,
          };
          return this.maybeSaveVocabulary(userId, dto, base);
        }
      }
      throw err;
    }
  }

  private async maybeSaveVocabulary(
    userId: string,
    dto: TranslateDto,
    base: TranslateResponse,
  ): Promise<TranslateResponse> {
    // Only skip saving when explicitly false; undefined/true => save to Vocabulary (default for word/phrase flow).
    if (dto.saveToVocabulary === false) return base;

    const word = (dto.vocabularyWord?.trim() || base.text).trim();
    if (!word) throw new BadRequestException('vocabulary word cannot be empty');
    if (word.length > 128) {
      throw new BadRequestException(
        'text is too long to store as Vocabulary.word (max 128). Provide vocabularyWord (short) or save manually via /vocabulary.',
      );
    }

    const meaning = base.translatedText;
    if (meaning.length > 512) {
      throw new BadRequestException(
        'translatedText is too long to store as Vocabulary.meaning (max 512). Save manually via /vocabulary instead.',
      );
    }

    const existing = await this.prisma.vocabulary.findFirst({
      where: { userId, word: { equals: word, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) {
      return { ...base, vocabulary: { id: existing.id } };
    }

    const init = initialVocabularyLearningFields();
    const created = await this.prisma.vocabulary.create({
      data: {
        userId,
        word,
        meaning,
        example: dto.vocabularyExample ?? null,
        sourceText: dto.vocabularySourceText ?? null,
        ...init,
      },
      select: { id: true },
    });

    return {
      ...base,
      vocabulary: { id: created.id },
    };
  }
}
