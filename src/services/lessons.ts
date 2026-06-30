import { supabase } from '@/lib/supabase';

export interface Lesson {
  id: string;
  order_num: number;
  level: string;
  title: string;
  objective: string;
  explanation: string;
  examples: { en: string; pt: string }[];
  quiz: { question: string; options: string[]; answer: number }[];
  tutor_topic: string;
  estimated_minutes: number;
}

export interface UserProgress {
  lesson_id: string;
  completed: boolean;
  quiz_score: number | null;
  quiz_attempts: number;
  completed_at: string | null;
}

export async function getLessons(): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('course_lessons')
    .select('*')
    .order('order_num');
  if (error) throw error;
  return data;
}

export async function getLessonById(id: string): Promise<Lesson> {
  const { data, error } = await supabase
    .from('course_lessons')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  const { data, error } = await supabase
    .from('user_lesson_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

export async function completeLesson(
  userId: string,
  lessonId: string,
  score: number
): Promise<void> {
  const completed = score >= 4;
  const { error } = await supabase
    .from('user_lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      completed,
      quiz_score: score,
      quiz_attempts: 1,
      completed_at: completed ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,lesson_id' });
  if (error) throw error;

  if (completed) {
    await supabase.rpc('check_and_award_badges', { p_user_id: userId });
  }
}

export async function getUserBadges(userId: string) {
  const { data, error } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at');
  if (error) throw error;
  return data || [];
}

export async function incrementAttempts(userId: string, lessonId: string): Promise<void> {
  const { data } = await supabase
    .from('user_lesson_progress')
    .select('quiz_attempts')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single();

  const attempts = (data?.quiz_attempts || 0) + 1;
  await supabase
    .from('user_lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      quiz_attempts: attempts,
    }, { onConflict: 'user_id,lesson_id' });
}
