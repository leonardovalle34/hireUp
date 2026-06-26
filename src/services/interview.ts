import { supabase } from '@/lib/supabase';

export interface InterviewResponse {
  transcription: string;
  next_question: string | null;
  is_finished: boolean;
  feedback: any | null;
}

export async function sendInterviewTurn(
  form: FormData,
): Promise<InterviewResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Não autenticado');

  const res = await fetch(
    'https://kuczdljitnzixxzflhil.supabase.co/functions/v1/interview',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: form,
    },
  );

  if (!res.ok) {
    // Tenta pegar a mensagem real do erro
    try {
      const errData = await res.json();
      throw new Error(errData.error || `Erro no servidor: ${res.status}`);
    } catch (e: any) {
      if (e.message && !e.message.includes('JSON')) throw e;
      throw new Error(`Erro no servidor: ${res.status}`);
    }
  }

  return res.json();
}

export async function checkCanStartInterview(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_user_take_lesson', {
    uid: userId,
  });
  if (error) throw error;
  return data;
}
