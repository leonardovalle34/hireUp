import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getQuizDailyLimit,
  getNextQuestions,
  saveAnswer,
  getQuizUsageToday,
} from '@/services/quiz';
import { supabase } from '@/lib/supabase';

describe('quiz service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getQuizDailyLimit', () => {
    it('returns 20 for the free plan', () => {
      expect(getQuizDailyLimit('free')).toBe(20);
    });

    it('returns 50 for the practice plan', () => {
      expect(getQuizDailyLimit('practice')).toBe(50);
    });

    it('returns null (unlimited) for the fluent plan', () => {
      expect(getQuizDailyLimit('fluent')).toBeNull();
    });
  });

  describe('getQuizUsageToday', () => {
    it('sums the questions answered today across all sessions', async () => {
      const gteMock = vi.fn().mockResolvedValue({
        data: [{ questions_answered: 5 }, { questions_answered: 3 }],
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ gte: gteMock }),
        }),
      } as any);

      const result = await getQuizUsageToday('user-1');

      expect(result).toBe(8);
      expect(supabase.from).toHaveBeenCalledWith('user_quiz_sessions');
    });

    it('returns 0 when there are no sessions today', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      } as any);

      const result = await getQuizUsageToday('user-1');

      expect(result).toBe(0);
    });
  });

  describe('getNextQuestions', () => {
    function mockQuestionsAndHistory(
      allQuestions: any[],
      correctlyAnswered: { question_id: string }[],
    ) {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'quiz_questions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: allQuestions, error: null }),
            }),
          } as any;
        }
        if (table === 'user_quiz_history') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: correctlyAnswered, error: null }),
              }),
            }),
          } as any;
        }
        throw new Error(`unexpected table: ${table}`);
      });
    }

    it('excludes questions already answered correctly', async () => {
      const allQuestions = [
        { id: 'q1', level: 'beginner' },
        { id: 'q2', level: 'beginner' },
        { id: 'q3', level: 'beginner' },
      ];
      mockQuestionsAndHistory(allQuestions, [{ question_id: 'q1' }]);

      const result = await getNextQuestions('user-1', 'beginner', 10);

      expect(result).toHaveLength(2);
      expect(result.some((q) => q.id === 'q1')).toBe(false);
      expect(result.map((q) => q.id).sort()).toEqual(['q2', 'q3']);
      expect(supabase.from).toHaveBeenCalledWith('quiz_questions');
      expect(supabase.from).toHaveBeenCalledWith('user_quiz_history');
    });

    it('respects the count parameter, limiting the returned amount', async () => {
      const allQuestions = Array.from({ length: 5 }, (_, i) => ({
        id: `q${i}`,
        level: 'beginner',
      }));
      mockQuestionsAndHistory(allQuestions, []);

      const result = await getNextQuestions('user-1', 'beginner', 2);

      expect(result).toHaveLength(2);
    });

    it('throws an error when fetching questions fails', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'quiz_questions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
            }),
          } as any;
        }
        return { select: vi.fn().mockReturnThis() } as any;
      });

      await expect(getNextQuestions('user-1', 'beginner', 10)).rejects.toThrow('DB error');
    });
  });

  describe('saveAnswer', () => {
    it('saves the answer to the user history', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as any);

      await saveAnswer('user-1', 'q1', true);

      expect(supabase.from).toHaveBeenCalledWith('user_quiz_history');
      expect(insertMock).toHaveBeenCalledWith({
        user_id: 'user-1',
        question_id: 'q1',
        correct: true,
      });
    });
  });
});
