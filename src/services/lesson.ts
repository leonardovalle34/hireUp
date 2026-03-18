import { supabase } from '@/lib/supabase'

export async function canUserTakeLesson(userId: string) {
  const { data, error } = await supabase.rpc('can_user_take_lesson', {
    uid: userId,
  })

  if (error) throw error

  return data
}

export async function getLesson() {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (error) throw error

  return data
}

export async function createLessonSession(userId: string, lessonId: number) {
  const { data, error } = await supabase
    .from('lesson_sessions')
    .insert([{ user_id: userId, lesson_id: lessonId }])
    .select()
    .single()

  if (error) throw error

  return data
}

export async function saveAnswer(
  userId: number,
  lessonId: number,
  answer: string
) {
  const { data, error } = await supabase.from('user_answers').insert({
    user_id: userId,
    lesson_id: lessonId,
    answer: answer,
  }).select().single()

  if (error) throw error

  return data
}
