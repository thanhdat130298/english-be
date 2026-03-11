import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddWordlistItemDto } from './dto/add-wordlist-item.dto';
import { CreateWordlistDto } from './dto/create-wordlist.dto';
import { UpdateWordlistDto } from './dto/update-wordlist.dto';

@Injectable()
export class WordlistsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateWordlistDto) {
    return this.prisma.wordlist.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description ?? null,
      },
    });
  }

  async list(userId: string) {
    return this.prisma.wordlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(userId: string, id: string) {
    const wl = await this.prisma.wordlist.findFirst({
      where: { id, userId },
    });
    if (!wl) throw new NotFoundException('wordlist not found');
    return wl;
  }

  async update(userId: string, id: string, dto: UpdateWordlistDto) {
    await this.getById(userId, id);
    return this.prisma.wordlist.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        description: dto.description ?? undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await this.prisma.wordlist.delete({ where: { id } });
    return { deleted: true };
  }

  async listItems(userId: string, wordlistId: string) {
    await this.getById(userId, wordlistId);
    return this.prisma.vocabulary.findMany({
      where: {
        userId,
        wordlistItems: {
          some: { wordlistId },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addItem(userId: string, wordlistId: string, dto: AddWordlistItemDto) {
    await this.getById(userId, wordlistId);

    const vocab = await this.prisma.vocabulary.findFirst({
      where: { id: dto.vocabularyId, userId },
    });
    if (!vocab) throw new NotFoundException('vocabulary not found');

    try {
      await this.prisma.wordlistItem.create({
        data: {
          wordlistId,
          vocabularyId: dto.vocabularyId,
        },
      });
    } catch (err: unknown) {
      // If membership already exists, treat as idempotent success.
      const code = (err as { code?: unknown } | null)?.code;
      if (code !== 'P2002') throw err;
    }

    return { added: true };
  }

  async removeItem(userId: string, wordlistId: string, vocabularyId: string) {
    await this.getById(userId, wordlistId);

    // Also ensure the vocab is owned, otherwise we leak existence via "removed: false".
    const vocab = await this.prisma.vocabulary.findFirst({
      where: { id: vocabularyId, userId },
    });
    if (!vocab) throw new NotFoundException('vocabulary not found');

    const res = await this.prisma.wordlistItem.deleteMany({
      where: { wordlistId, vocabularyId },
    });

    return { removed: res.count > 0 };
  }
}
