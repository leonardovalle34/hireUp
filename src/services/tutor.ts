import { supabase } from '@/lib/supabase';

export interface TutorResponse {
  transcription: string;
  tutor_response: string;
  tutor_response_clean: string;
  tutor_name: string;
  history: { role: string; content: string }[];
}

export async function sendTutorMessage(form: FormData): Promise<TutorResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Não autenticado');

  const res = await fetch(
    'https://kuczdljitnzixxzflhil.supabase.co/functions/v1/tutor',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: form,
    },
  );

  if (!res.ok) {
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
