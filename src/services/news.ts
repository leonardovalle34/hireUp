import { supabase } from '@/lib/supabase';
import type { NewsArticle } from '@/interfaces/INews';

export async function getNews(limit: number = 30): Promise<NewsArticle[]> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}
