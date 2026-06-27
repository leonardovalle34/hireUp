import { supabase } from '@/lib/supabase';

export interface PlacementTestResponse {
  // quiz
  correct?: boolean;
  correct_answer?: string;
  explanation?: string;
  score?: number;
  // pronunciation / interpretation / conversation
  transcription?: string;
  feedback?: string;
  phrase?: string;
  ai_response?: string;
  history?: { role: string; content: string }[];
  // result
  level?: string;
  level_label?: string;
  final_score?: number;
  breakdown?: Record<string, number>;
}

export async function callPlacementTest(form: FormData): Promise<PlacementTestResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Não autenticado');

  const res = await fetch(
    'https://kuczdljitnzixxzflhil.supabase.co/functions/v1/placement-test',
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
