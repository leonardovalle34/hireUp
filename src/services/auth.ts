import { supabase } from '@/lib/supabase';

export async function getFullUser() {
  const { data } = await supabase.auth.getUser();

  const user = data?.user;
  if (!user) return null;

  const { data: dashboard } = await supabase.rpc('get_user_dashboard', {
    uid: user.id,
  });

  return {
    user,
    dashboard,
  };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.user;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}
