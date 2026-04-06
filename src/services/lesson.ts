import { supabase } from '@/lib/supabase';

export async function canUserTakeLesson(userId: string) {
  const { data, error } = await supabase.rpc('can_user_take_lesson', {
    uid: userId,
  });

  if (error) throw error;

  return data;
}

export async function getLesson({
  userId,
  focus,
  level,
}: {
  userId: number;
  focus: string;
  level: string;
}) {
  const { data, error } = await supabase.rpc('get_random_question', {
    uid: userId,
    p_focus: focus,
    p_level: level,
  });

  if (error) throw error;

  return data;
}

export async function createLessonSession(userId: string, lessonId: string) {
  const { data, error } = await supabase
    .from('lesson_sessions')
    .insert([{ user_id: userId, lesson_id: lessonId }])
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function submitAudio(
  audioBlob: Blob,
  lessonId: string,
  token: string,
) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('lessonId', String(lessonId));
  console.log('fiormData', formData);

  for (let pair of formData.entries()) {
    console.log('FORM FRONT:', pair[0], pair[1]);
  }

  const res = await fetch(
    'https://kuczdljitnzixxzflhil.supabase.co/functions/v1/answer',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  );

  if (!res.ok) {
    throw new Error('Erro ao enviar áudio');
  }

  return res.json();
}
