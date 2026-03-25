import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly leaderboardFallback = {
    topStreakUsers: [
      { userId: 'sample-1', username: 'alice', value: 32 },
      { userId: 'sample-2', username: 'bob', value: 27 },
      { userId: 'sample-3', username: 'charlie', value: 19 },
    ],
    topAddedUsers: [
      { userId: 'sample-4', username: 'david', value: 180 },
      { userId: 'sample-5', username: 'eva', value: 156 },
      { userId: 'sample-6', username: 'frank', value: 149 },
    ],
    topReviewUsers: [
      { userId: 'sample-7', username: 'grace', value: 420 },
      { userId: 'sample-8', username: 'henry', value: 380 },
      { userId: 'sample-9', username: 'irene', value: 355 },
    ],
    topTranslatedWords: [
      { userId: 'word-1', username: 'practice', value: 48 },
      { userId: 'word-2', username: 'synchronize', value: 35 },
      { userId: 'word-3', username: 'pathway', value: 27 },
    ],
  };

  private formatUtcDate(date: Date): string {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  }

  private parseUtcDate(date: string): Date {
    const [yStr, mStr, dStr] = date.split('-');
    const y = Number(yStr);
    const m = Number(mStr);
    const d = Number(dStr);
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  }

  private getUtcDayRange(date?: string): {
    date: string;
    start: Date;
    end: Date;
  } {
    if (!date) {
      const now = new Date();
      const y = now.getUTCFullYear();
      const m = now.getUTCMonth();
      const d = now.getUTCDate();
      const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
      const end = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0));
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      return { date: dateStr, start, end };
    }

    const start = this.parseUtcDate(date);
    const y = start.getUTCFullYear();
    const m = start.getUTCMonth() + 1;
    const d = start.getUTCDate();
    const end = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0, 0));
    return { date, start, end };
  }

  async getSummary(userId: string, date?: string) {
    const { start, end, date: day } = this.getUtcDayRange(date);

    const [totalVocabularyCount, dailyAddedVocabularyCount] = await Promise.all(
      [
        this.prisma.vocabulary.count({ where: { userId } }),
        this.prisma.vocabulary.count({
          where: {
            userId,
            createdAt: {
              gte: start,
              lt: end,
            },
          },
        }),
      ],
    );

    return {
      date: day,
      totalVocabularyCount,
      dailyAddedVocabularyCount,
    };
  }

  private getDashboardRange(from?: string, to?: string): {
    from: string;
    to: string;
    start: Date;
    endExclusive: Date;
  } {
    const today = this.getUtcDayRange().start;
    const defaultFrom = new Date(today);
    defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 6);

    const start = from ? this.parseUtcDate(from) : defaultFrom;
    const endStart = to ? this.parseUtcDate(to) : today;

    if (endStart < start) {
      throw new BadRequestException('to must be greater than or equal to from');
    }

    const endExclusive = new Date(endStart);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

    return {
      from: this.formatUtcDate(start),
      to: this.formatUtcDate(endStart),
      start,
      endExclusive,
    };
  }

  async getDashboard(userId: string, from?: string, to?: string) {
    const todaySummary = await this.getSummary(userId);
    const range = this.getDashboardRange(from, to);

    const [vocabInRange, allVocabDates, wordlists, recentVocabulary, recentWordlists] =
      await Promise.all([
        this.prisma.vocabulary.findMany({
          where: {
            userId,
            createdAt: { gte: range.start, lt: range.endExclusive },
          },
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.vocabulary.findMany({
          where: { userId },
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.wordlist.findMany({
          where: { userId },
          select: { name: true },
        }),
        this.prisma.vocabulary.findMany({
          where: { userId },
          select: { id: true, word: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        this.prisma.wordlist.findMany({
          where: { userId },
          select: { id: true, name: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
      ]);

    const dayCount = new Map<string, number>();
    for (const row of vocabInRange) {
      const day = this.formatUtcDate(row.createdAt);
      dayCount.set(day, (dayCount.get(day) ?? 0) + 1);
    }

    const activitySeries: Array<{ date: string; addedCount: number }> = [];
    for (
      let d = new Date(range.start);
      d < range.endExclusive;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      const day = this.formatUtcDate(d);
      activitySeries.push({ date: day, addedCount: dayCount.get(day) ?? 0 });
    }

    const activeDays = new Set<string>(
      allVocabDates.map((row) => this.formatUtcDate(row.createdAt)),
    );
    const sortedDays = [...activeDays].sort();

    let longestStreakDays = 0;
    let running = 0;
    let prev: Date | null = null;
    for (const day of sortedDays) {
      const current = this.parseUtcDate(day);
      if (!prev) {
        running = 1;
      } else {
        const diffMs = current.getTime() - prev.getTime();
        running = diffMs === 24 * 60 * 60 * 1000 ? running + 1 : 1;
      }
      if (running > longestStreakDays) longestStreakDays = running;
      prev = current;
    }

    let currentStreakDays = 0;
    const today = this.getUtcDayRange().start;
    for (
      let d = new Date(today);
      activeDays.has(this.formatUtcDate(d));
      d.setUTCDate(d.getUTCDate() - 1)
    ) {
      currentStreakDays += 1;
    }

    const wordlistCount = wordlists.length;
    const categoryCount = new Set(
      wordlists
        .map((w) => w.name.trim().toLowerCase())
        .filter((name) => name.length > 0),
    ).size;

    const recentActivity = [
      ...recentVocabulary.map((v) => ({
        id: v.id,
        type: 'VOCAB_ADDED' as const,
        target: v.word,
        createdAt: v.createdAt.toISOString(),
      })),
      ...recentWordlists.map((w) => ({
        id: w.id,
        type: 'WORDLIST_CREATED' as const,
        target: w.name,
        createdAt: w.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20);

    return {
      summary: todaySummary,
      activitySeries,
      streak: {
        currentStreakDays,
        longestStreakDays,
        lastActiveDate: sortedDays.length ? sortedDays[sortedDays.length - 1] : null,
      },
      wordlistsSummary: {
        wordlistCount,
        categoryCount,
      },
      recentActivity,
    };
  }

  async getLeaderboard(_viewerUserId: string, _date?: string, limit = 10) {
    const [users, translations] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true,
          username: true,
          _count: { select: { vocabularies: true } },
          vocabularies: {
            select: {
              createdAt: true,
              reviewCount: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      this.prisma.translationCache.findMany({
        select: { normalizedText: true },
      }),
    ]);

    const hasAnyData =
      users.some((u) => u.vocabularies.length > 0) || translations.length > 0;
    if (!hasAnyData) {
      return this.leaderboardFallback;
    }

    const ranked = users
      .map((u) => {
        const dayKeys = new Set(
          u.vocabularies.map((v) => this.formatUtcDate(v.createdAt)),
        );
        const days = [...dayKeys].sort();

        let longestStreak = 0;
        let running = 0;
        let prev: Date | null = null;
        for (const day of days) {
          const current = this.parseUtcDate(day);
          if (!prev) {
            running = 1;
          } else {
            const diffMs = current.getTime() - prev.getTime();
            running = diffMs === 24 * 60 * 60 * 1000 ? running + 1 : 1;
          }
          if (running > longestStreak) longestStreak = running;
          prev = current;
        }

        const totalAdded = u._count.vocabularies;
        const totalReviewed = u.vocabularies.reduce(
          (sum, v) => sum + v.reviewCount,
          0,
        );
        return {
          userId: u.id,
          username: u.username,
          longestStreak,
          totalAdded,
          totalReviewed,
        };
      })
      .filter((u) => u.totalAdded > 0);

    const wordCounts = new Map<string, number>();
    for (const item of translations) {
      const word = item.normalizedText.trim().toLowerCase();
      if (!word.length) continue;
      wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
    }
    const topTranslatedWords = [...wordCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit)
      .map(([word, value], idx) => ({
        userId: `word-${idx + 1}`,
        username: word,
        value,
      }));

    const topN = (
      items: typeof ranked,
      selector: (item: (typeof ranked)[number]) => number,
    ) =>
      [...items]
        .sort((a, b) => {
          const bv = selector(b);
          const av = selector(a);
          if (bv !== av) return bv - av;
          return a.username.localeCompare(b.username);
        })
        .slice(0, limit)
        .map((item) => ({
          userId: item.userId,
          username: item.username,
          value: selector(item),
        }));

    return {
      topStreakUsers: topN(ranked, (u) => u.longestStreak),
      topAddedUsers: topN(ranked, (u) => u.totalAdded),
      topReviewUsers: topN(ranked, (u) => u.totalReviewed),
      topTranslatedWords,
    };
  }
}
