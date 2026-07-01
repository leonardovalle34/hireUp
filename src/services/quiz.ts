import { supabase } from '@/lib/supabase';
import type { QuizQuestion } from '@/interfaces/IQuiz';

export type { QuizQuestion };

export function getQuizDailyLimit(plan: string): number | null {
  if (plan === 'free') return 20;
  if (plan === 'practice') return 50;
  return null; // fluent = unlimited
}

export async function getQuizUsageToday(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('user_quiz_sessions')
    .select('questions_answered')
    .eq('user_id', userId)
    .gte('created_at', today + 'T00:00:00Z');
  return data?.reduce((acc, s) => acc + (s.questions_answered || 0), 0) || 0;
}

export async function incrementQuizUsage(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('user_quiz_sessions')
    .select('id, questions_answered')
    .eq('user_id', userId)
    .gte('created_at', today + 'T00:00:00Z')
    .maybeSingle();

  if (data) {
    await supabase
      .from('user_quiz_sessions')
      .update({ questions_answered: data.questions_answered + 1 })
      .eq('id', data.id);
  } else {
    await supabase
      .from('user_quiz_sessions')
      .insert({ user_id: userId, questions_answered: 1 });
  }
}

export async function getNextQuestions(
  userId: string,
  level: string,
  count: number = 10
): Promise<QuizQuestion[]> {
  // Fetch all questions for the level
  const { data: allQuestions, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('level', level);

  if (error) throw error;

  // Fetch IDs already answered correctly
  const { data: correctlyAnswered } = await supabase
    .from('user_quiz_history')
    .select('question_id')
    .eq('user_id', userId)
    .eq('correct', true);

  const excludeSet = new Set((correctlyAnswered || []).map(r => r.question_id));

  // Filter in JavaScript instead of SQL
  const available = (allQuestions || []).filter(q => !excludeSet.has(q.id));

  console.log(`Level ${level}: ${allQuestions?.length} total, ${excludeSet.size} excluded, ${available.length} available`);

  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function saveAnswer(userId: string, questionId: string, correct: boolean): Promise<void> {
  await supabase
    .from('user_quiz_history')
    .insert({ user_id: userId, question_id: questionId, correct });
}
