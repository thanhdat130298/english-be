import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** Delete all data except User (WordlistItem, Wordlist, Vocabulary, TranslationCache, DictionaryCache, Feedback). */
  async clearDataExceptUsers(): Promise<{
    deleted: true;
    counts: Record<string, number>;
  }> {
    const [
      wordlistItem,
      wordlist,
      vocabulary,
      translationCache,
      dictionaryCache,
      feedback,
    ] = await this.prisma.$transaction([
      this.prisma.wordlistItem.deleteMany(),
      this.prisma.wordlist.deleteMany(),
      this.prisma.vocabulary.deleteMany(),
      this.prisma.translationCache.deleteMany(),
      this.prisma.dictionaryCache.deleteMany(),
      this.prisma.feedback.deleteMany(),
    ]);

    return {
      deleted: true,
      counts: {
        wordlistItem: wordlistItem.count,
        wordlist: wordlist.count,
        vocabulary: vocabulary.count,
        translationCache: translationCache.count,
        dictionaryCache: dictionaryCache.count,
        feedback: feedback.count,
      },
    };
  }
}
