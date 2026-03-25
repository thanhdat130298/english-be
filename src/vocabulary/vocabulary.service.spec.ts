import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewResult } from './dto/review-vocab.dto';
import { VocabularyService } from './vocabulary.service';

describe('VocabularyService', () => {
  let service: VocabularyService;
  const vocabulary = {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const dictionaryCache = { findMany: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VocabularyService,
        {
          provide: PrismaService,
          useValue: {
            vocabulary,
            dictionaryCache,
          },
        },
      ],
    }).compile();

    service = module.get(VocabularyService);
  });

  it('create sets reviewCount 0 via initial fields', async () => {
    vocabulary.findFirst.mockResolvedValue(null);
    vocabulary.create.mockResolvedValue({
      id: '1',
      userId: 'u',
      word: 'test',
      meaning: 'm',
      example: null,
      sourceText: null,
      difficulty: null,
      reviewCount: 0,
      correctCount: 0,
      lastReviewedAt: null,
      nextReviewAt: new Date(),
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service.create('u', {
      word: 'test',
      meaning: 'm',
    });

    expect(vocabulary.create).toHaveBeenCalled();
    const firstCall = vocabulary.create.mock.calls[0] as [
      { data: Record<string, unknown> },
    ];
    const data = firstCall[0].data;
    expect(data.reviewCount).toBe(0);
    expect(data.correctCount).toBe(0);
    expect(data.nextReviewAt).toBeInstanceOf(Date);
  });

  it('review HARD increments reviewCount and sets nextReviewAt +1 day', async () => {
    const base = new Date('2026-03-15T12:00:00.000Z');
    jest.useFakeTimers();
    jest.setSystemTime(base);

    vocabulary.findFirst.mockResolvedValue({
      id: 'v1',
      userId: 'u',
      word: 'w',
      meaning: 'm',
      example: null,
      sourceText: null,
      difficulty: null,
      reviewCount: 0,
      correctCount: 0,
      lastReviewedAt: null,
      nextReviewAt: new Date('2026-03-16'),
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vocabulary.update.mockImplementation(() =>
      Promise.resolve({
        id: 'v1',
        userId: 'u',
        word: 'w',
        meaning: 'm',
        example: null,
        sourceText: null,
        difficulty: 'HARD',
        reviewCount: 1,
        correctCount: 0,
        lastReviewedAt: base,
        nextReviewAt: new Date('2026-03-16T12:00:00.000Z'),
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await service.review('u', 'v1', ReviewResult.HARD);

    expect(vocabulary.update).toHaveBeenCalled();
    const hardCall = vocabulary.update.mock.calls[0] as [
      { data: { difficulty: string; nextReviewAt: Date } },
    ];
    expect(hardCall[0].data.difficulty).toBe('HARD');
    const next = hardCall[0].data.nextReviewAt;
    expect(next.getUTCDate()).toBe(16);

    jest.useRealTimers();
  });

  it('review EASY increments correctCount', async () => {
    const base = new Date('2026-03-15T12:00:00.000Z');
    jest.useFakeTimers();
    jest.setSystemTime(base);

    vocabulary.findFirst.mockResolvedValue({
      id: 'v1',
      userId: 'u',
      word: 'w',
      meaning: 'm',
      example: null,
      sourceText: null,
      difficulty: 'MEDIUM',
      reviewCount: 2,
      correctCount: 1,
      lastReviewedAt: null,
      nextReviewAt: new Date('2026-03-14'),
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vocabulary.update.mockResolvedValue({
      id: 'v1',
      userId: 'u',
      word: 'w',
      meaning: 'm',
      example: null,
      sourceText: null,
      difficulty: 'EASY',
      reviewCount: 3,
      correctCount: 2,
      lastReviewedAt: base,
      nextReviewAt: new Date('2026-03-22'),
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service.review('u', 'v1', ReviewResult.EASY);

    const easyCall = vocabulary.update.mock.calls[0] as [
      { data: { correctCount: { increment: number } } },
    ];
    expect(easyCall[0].data.correctCount).toEqual({ increment: 1 });

    jest.useRealTimers();
  });

  it('review throws NotFound when missing', async () => {
    vocabulary.findFirst.mockResolvedValue(null);
    await expect(
      service.review('u', 'missing', ReviewResult.HARD),
    ).rejects.toThrow(NotFoundException);
  });

  it('getReviewQueue returns active items and limit 20', async () => {
    vocabulary.findMany.mockResolvedValue([]);
    dictionaryCache.findMany.mockResolvedValue([]);
    await service.getReviewQueue('u');
    const fm = vocabulary.findMany.mock.calls[0] as [
      {
        where: {
          userId: string;
          isArchived: boolean;
        };
        orderBy: { createdAt: string };
        take: number;
      },
    ];
    expect(fm[0].where.userId).toBe('u');
    expect(fm[0].where.isArchived).toBe(false);
    expect(fm[0].orderBy).toEqual({ createdAt: 'desc' });
    expect(fm[0].take).toBe(20);
  });
});
