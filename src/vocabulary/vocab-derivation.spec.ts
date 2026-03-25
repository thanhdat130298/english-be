import {
  deriveVocabState,
  MASTERED_CORRECT_THRESHOLD,
} from './vocab-derivation';

describe('deriveVocabState', () => {
  const now = new Date('2026-03-15T12:00:00.000Z');

  it('isNew when reviewCount === 0', () => {
    const s = deriveVocabState(
      {
        reviewCount: 0,
        correctCount: 0,
        difficulty: null,
        nextReviewAt: new Date('2026-03-16T12:00:00.000Z'),
      },
      now,
    );
    expect(s.isNew).toBe(true);
  });

  it('isDue when nextReviewAt <= now', () => {
    const s = deriveVocabState(
      {
        reviewCount: 1,
        correctCount: 0,
        difficulty: 'HARD',
        nextReviewAt: new Date('2026-03-14T12:00:00.000Z'),
      },
      now,
    );
    expect(s.isDue).toBe(true);
  });

  it('isMastered when correctCount >= threshold and EASY', () => {
    const s = deriveVocabState(
      {
        reviewCount: 10,
        correctCount: MASTERED_CORRECT_THRESHOLD,
        difficulty: 'EASY',
        nextReviewAt: new Date('2027-01-01T00:00:00.000Z'),
      },
      now,
    );
    expect(s.isMastered).toBe(true);
  });

  it('not mastered when EASY but correctCount below threshold', () => {
    const s = deriveVocabState(
      {
        reviewCount: 3,
        correctCount: 4,
        difficulty: 'EASY',
        nextReviewAt: null,
      },
      now,
    );
    expect(s.isMastered).toBe(false);
  });
});
