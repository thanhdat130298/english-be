import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { ProgressService } from '../src/progress/progress.service';

describe('ProgressController (e2e)', () => {
  let app: INestApplication<App>;

  const progressServiceMock = {
    getSummary: jest.fn().mockResolvedValue({
      date: '2026-03-23',
      totalVocabularyCount: 12,
      dailyAddedVocabularyCount: 3,
    }),
    getDashboard: jest.fn().mockResolvedValue({
      summary: {
        date: '2026-03-23',
        totalVocabularyCount: 120,
        dailyAddedVocabularyCount: 5,
      },
      activitySeries: [{ date: '2026-03-23', addedCount: 5 }],
      streak: {
        currentStreakDays: 6,
        longestStreakDays: 12,
        lastActiveDate: '2026-03-23',
      },
      wordlistsSummary: {
        wordlistCount: 8,
        categoryCount: 5,
      },
      recentActivity: [
        {
          id: 'a',
          type: 'VOCAB_ADDED',
          target: 'serendipity',
          createdAt: '2026-03-23T09:00:00.000Z',
        },
        {
          id: 'b',
          type: 'WORDLIST_CREATED',
          target: 'IELTS Prep',
          createdAt: '2026-03-23T08:10:00.000Z',
        },
      ],
    }),
    getLeaderboard: jest.fn().mockResolvedValue({
      topStreakUsers: [{ userId: 'u1', username: 'alice', value: 32 }],
      topAddedUsers: [{ userId: 'u2', username: 'bob', value: 180 }],
      topReviewUsers: [{ userId: 'u3', username: 'charlie', value: 420 }],
      topTranslatedWords: [
        { userId: 'word-1', username: 'serendipity', value: 92 },
      ],
    }),
  };

  beforeEach(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest<{
            headers?: { authorization?: string };
            user?: { userId: string; username: string };
          }>();
          const auth = req.headers?.authorization ?? '';
          if (!auth.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid token');
          }
          req.user = { userId: 'u-test', username: 'tester' };
          return true;
        },
      })
      .overrideProvider(ProgressService)
      .useValue(progressServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /api/progress/dashboard returns data with JWT', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/progress/dashboard')
      .set('Authorization', 'Bearer token')
      .expect(200);

    expect(res.body.summary.totalVocabularyCount).toBe(120);
    expect(res.body.recentActivity[1].type).toBe('WORDLIST_CREATED');
    expect(progressServiceMock.getDashboard).toHaveBeenCalled();
  });

  it('GET /api/progress/dashboard validates from/to format', async () => {
    await request(app.getHttpServer())
      .get('/api/progress/dashboard?from=2026/03/01')
      .set('Authorization', 'Bearer token')
      .expect(400);
  });

  it('GET /api/progress/leaderboard returns leaderboard data', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/progress/leaderboard?limit=5')
      .set('Authorization', 'Bearer token')
      .expect(200);

    expect(res.body.topStreakUsers[0].value).toBe(32);
    expect(res.body.topAddedUsers[0].value).toBe(180);
    expect(res.body.topTranslatedWords[0].username).toBe('serendipity');
    expect(progressServiceMock.getLeaderboard).toHaveBeenCalledWith(
      'u-test',
      undefined,
      5,
    );
  });

  it('GET /api/progress/leaderboard validates limit', async () => {
    await request(app.getHttpServer())
      .get('/api/progress/leaderboard?limit=0')
      .set('Authorization', 'Bearer token')
      .expect(400);
  });

  it('GET /api/progress/leaderboard requires JWT', async () => {
    await request(app.getHttpServer())
      .get('/api/progress/leaderboard')
      .expect(401);
  });
});
