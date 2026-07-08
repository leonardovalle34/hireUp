import { supabase } from '@/lib/supabase';
import type { VideoLesson, VideoFilters } from '@/interfaces/IVideo';

export async function getVideos(filters: VideoFilters = {}): Promise<VideoLesson[]> {
  let query = supabase.from('video_lessons').select('*').order('published_at', { ascending: false }) as any;

  if (filters.level && filters.level !== 'all') {
    query = query.eq('level', filters.level);
  }

  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
