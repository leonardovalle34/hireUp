-- Tabela de aulas
CREATE TABLE IF NOT EXISTS course_lessons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_num integer NOT NULL UNIQUE,
  level text NOT NULL CHECK (level IN ('beginner', 'elementary', 'intermediate', 'advanced', 'business')),
  title text NOT NULL,
  objective text NOT NULL,
  explanation text NOT NULL,
  examples jsonb NOT NULL DEFAULT '[]',
  quiz jsonb NOT NULL DEFAULT '[]',
  image_url text,
  tutor_topic text,
  estimated_minutes integer DEFAULT 90,
  created_at timestamptz DEFAULT now()
);

-- Progresso do usuário nas aulas
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES course_lessons(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  quiz_score integer,
  quiz_attempts integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Badges do usuário
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type text NOT NULL,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

-- RLS
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lessons are public" ON course_lessons FOR SELECT USING (true);

CREATE POLICY "Users manage own progress" ON user_lesson_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own badges" ON user_badges
  FOR ALL USING (auth.uid() = user_id);
