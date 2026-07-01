import { describe, it, expect } from 'vitest';
import { getQuizDailyLimit } from '@/services/quiz';

describe('Quiz — Limits by Plan', () => {
  it('Free has a limit of 20 questions per day', () => {
    expect(getQuizDailyLimit('free')).toBe(20);
  });

  it('Practice has a limit of 50 questions per day', () => {
    expect(getQuizDailyLimit('practice')).toBe(50);
  });

  it('Fluent has an unlimited limit (null)', () => {
    expect(getQuizDailyLimit('fluent')).toBeNull();
  });

  it('an unknown plan is also treated as unlimited (real behavior: only free/practice have a limit)', () => {
    expect(getQuizDailyLimit('plano-inexistente')).toBeNull();
  });
});
