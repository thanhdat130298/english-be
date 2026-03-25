import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

const DAILY_LIMIT = 5;
const TOTAL_LIMIT = 20;

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateFeedbackDto) {
    const message = dto.message.trim();
    if (!message.length) {
      throw new BadRequestException('message must not be empty');
    }

    const now = new Date();
    const start = startOfUtcDay(now);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const [totalCount, dailyCount] = await this.prisma.$transaction([
      this.prisma.feedback.count({ where: { userId } }),
      this.prisma.feedback.count({
        where: { userId, createdAt: { gte: start, lt: end } },
      }),
    ]);

    if (totalCount >= TOTAL_LIMIT) {
      throw new BadRequestException(
        `feedback limit reached: max ${TOTAL_LIMIT} per user`,
      );
    }

    if (dailyCount >= DAILY_LIMIT) {
      throw new BadRequestException(
        `feedback daily limit reached: max ${DAILY_LIMIT} per day`,
      );
    }

    return this.prisma.feedback.create({
      data: {
        userId,
        message,
      },
    });
  }

  async listMine(userId: string) {
    return this.prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
