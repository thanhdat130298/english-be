import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

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

    const [yStr, mStr, dStr] = date.split('-');
    const y = Number(yStr);
    const m = Number(mStr);
    const d = Number(dStr);
    const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
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
}
