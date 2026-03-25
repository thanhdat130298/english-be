/** UTC-safe add days (calendar days in local UTC date). */
export function addDaysUtc(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Initial learning fields for new vocabulary (create / translate). */
export function initialVocabularyLearningFields(now: Date = new Date()) {
  return {
    reviewCount: 0,
    correctCount: 0,
    nextReviewAt: addDaysUtc(now, 1),
    isArchived: false,
  };
}

/** Next review for EASY: random 5–7 days (SRS-friendly spread). */
export function nextReviewAfterEasy(now: Date): Date {
  const days = 5 + Math.floor(Math.random() * 3);
  return addDaysUtc(now, days);
}
