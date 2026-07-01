import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNextQuestions } from '@/services/quiz';
import { supabase } from '@/lib/supabase';

describe('Quiz — Performance with a large volume of questions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters, shuffles and limits 405 questions quickly, without duplicates or repeated correct answers', async () => {
    const TOTAL = 405;
    const ANSWERED_CORRECTLY = 200;

    const allQuestions = Array.from({ length: TOTAL }, (_, i) => ({
      id: `${i}`,
      level: 'beginner',
      question: `Question ${i}`,
    }));
    const correctlyAnswered = Array.from({ length: ANSWERED_CORRECTLY }, (_, i) => ({
      question_id: `${i}`,
    }));

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
      throw new Error(`tabela inesperada: ${table}`);
    });

    const start = performance.now();
    const result = await getNextQuestions('user-1', 'beginner', 10);
    const elapsed = performance.now() - start;

    expect(result).toHaveLength(10);
    expect(elapsed).toBeLessThan(50);

    const ids = result.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length); // no duplicates
    ids.forEach((id) => expect(Number(id)).toBeGreaterThanOrEqual(ANSWERED_CORRECTLY)); // none already answered correctly
  });
});
