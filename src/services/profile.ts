import { supabase } from '@/lib/supabase';

export async function updateEnglishLevel(userId: string, level: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ english_level: level })
    .eq('id', userId);

  if (error) throw error;
  return true;
}
