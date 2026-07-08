export interface VideoLesson {
  id: string;
  youtube_id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  duration: string;
  duration_seconds: number;
  level: string;
  category: string;
  playlist: string;
  published_at: string;
}

export interface VideoFilters {
  level?: string;
  category?: string;
}
