export interface IRecentSession {
  id: string;
  score: number;
  date: string;
  title: string;
  focus: string;
  question_type: string;
}

export interface IWeeklyChart {
  label: string;
  day: string;
  count: number;
}

export interface IScoreChart {
  score: number;
  date: string;
  idx: number;
}

export interface IUser {
  name: string;
  email: string;
  created_at: string;
  plan: string;
  lessons_today: number;
  can_take_lesson: boolean;
  limit: number | null;
  remaining: number | null;
  weekly_count: number;
  avg_score: number;
  streak: number;
  recent_sessions: IRecentSession[];
  weekly_chart: IWeeklyChart[];
  score_chart: IScoreChart[];
  active_days: string[];
  placement_test_done?: boolean;
  placement_test_done_at?: string | null;
  english_level?: string | null;
}
