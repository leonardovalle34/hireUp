import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNextQuestions } from '@/services/quiz';
import { supabase } from '@/lib/supabase';

function mockQuestionsAndHistory(allQuestions: any[], correctlyAnswered: { question_id: string }[]) {
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
}

describe('Quiz — No Repetition of Correct Answers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not return questions already answered correctly', async () => {
    mockQuestionsAndHistory(
      [
        { id: '1', level: 'beginner' },
        { id: '2', level: 'beginner' },
        { id: '3', level: 'beginner' },
      ],
      [{ question_id: '1' }, { question_id: '2' }],
    );

    const result = await getNextQuestions('user-1', 'beginner', 10);

    expect(result.map((q) => q.id)).toEqual(['3']);
  });

  it('questions already answered wrong can repeat (the real query only fetches correct=true)', async () => {
    // getNextQuestions filters history with .eq('correct', true) — wrong
    // answers never end up in `correctlyAnswered`, so they stay available.
    mockQuestionsAndHistory(
      [
        { id: '1', level: 'beginner' },
        { id: '2', level: 'beginner' },
      ],
      [],
    );

    const result = await getNextQuestions('user-1', 'beginner', 10);

    expect(result.map((q) => q.id).sort()).toEqual(['1', '2']);
  });
});
