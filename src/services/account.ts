import { supabase } from '@/lib/supabase';

export async function deleteAccount() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Não autenticado');

  const res = await fetch(
    'https://kuczdljitnzixxzflhil.supabase.co/functions/v1/delete-account',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    },
  );

  if (!res.ok) throw new Error('Erro ao deletar conta');
  return true;
}
