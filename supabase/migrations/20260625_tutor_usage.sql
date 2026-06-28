CREATE TABLE IF NOT EXISTS tutor_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  duration_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tutor_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own tutor sessions" ON tutor_sessions;
CREATE POLICY "Users can manage own tutor sessions" ON tutor_sessions
  FOR ALL USING (auth.uid() = user_id);
