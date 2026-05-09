-- 012_create_analysis_events_table.sql
CREATE TABLE IF NOT EXISTS analysis_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_id uuid REFERENCES meals(id) ON DELETE SET NULL,
    model_name text NOT NULL DEFAULT 'gemini-2.0-flash',
    input_type text NOT NULL CHECK (input_type IN ('image', 'text')),
    status text NOT NULL CHECK (status IN ('success', 'error', 'low_confidence')),
    latency_ms int,
    error_message text,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analysis_events_user_id ON analysis_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_events_meal_id ON analysis_events(meal_id);

ALTER TABLE analysis_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analysis events"
    ON analysis_events FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis events"
    ON analysis_events FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
