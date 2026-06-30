export interface Lesson {
  id: string;
  order_num: number;
  level: string;
  title: string;
  objective: string;
  explanation: string;
  examples: { en: string; pt: string }[];
  quiz: { question: string; options: string[]; answer: number }[];
  tutor_topic: string;
  estimated_minutes: number;
}

export interface UserProgress {
  lesson_id: string;
  completed: boolean;
  quiz_score: number | null;
  quiz_attempts: number;
  completed_at: string | null;
}
