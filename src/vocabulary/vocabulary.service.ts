import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVocabularyDto } from './dto/create-vocabulary.dto';
import { ListVocabularyQueryDto } from './dto/list-vocabulary.query.dto';
import { UpdateVocabularyDto } from './dto/update-vocabulary.dto';

@Injectable()
export class VocabularyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateVocabularyDto) {
    return this.prisma.vocabulary.create({
      data: {
        userId,
        word: dto.word,
        meaning: dto.meaning,
        example: dto.example ?? null,
        sourceText: dto.sourceText ?? null,
      },
    });
  }

  async list(userId: string, query: ListVocabularyQueryDto) {
    const skip = query.skip ?? 0;
    const take = query.take ?? 50;

    return this.prisma.vocabulary.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(userId: string, id: string) {
    const vocab = await this.prisma.vocabulary.findFirst({
      where: { id, userId },
    });
    if (!vocab) throw new NotFoundException('vocabulary not found');
    return vocab;
  }

  async update(userId: string, id: string, dto: UpdateVocabularyDto) {
    await this.getById(userId, id);

    return this.prisma.vocabulary.update({
      where: { id },
      data: {
        word: dto.word ?? undefined,
        meaning: dto.meaning ?? undefined,
        example: dto.example ?? undefined,
        sourceText: dto.sourceText ?? undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await this.prisma.vocabulary.delete({ where: { id } });
    return { deleted: true };
  }
}
