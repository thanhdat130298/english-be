import type { Difficulty } from '@prisma/client';

/** Threshold for isMastered (correctCount >= this and difficulty EASY). */
export const MASTERED_CORRECT_THRESHOLD = 5;

export type VocabRowForDerivation = {
  reviewCount: number;
  correctCount: number;
  difficulty: Difficulty | null;
  nextReviewAt: Date | null;
};

export type DerivedVocabState = {
  isNew: boolean;
  isDue: boolean;
  isMastered: boolean;
};

/**
 * Derived learning state — not stored in DB.
 * - isNew: never reviewed
 * - isDue: nextReviewAt is set and due (<= now)
 * - isMastered: enough correct answers at EASY difficulty
 */
export function deriveVocabState(
  v: VocabRowForDerivation,
  now: Date = new Date(),
): DerivedVocabState {
  const isNew = v.reviewCount === 0;
  const isDue =
    v.nextReviewAt != null && v.nextReviewAt.getTime() <= now.getTime();
  const isMastered =
    v.correctCount >= MASTERED_CORRECT_THRESHOLD && v.difficulty === 'EASY';

  return { isNew, isDue, isMastered };
}
