-- 011_create_daily_summaries_table.sql
CREATE TABLE IF NOT EXISTS daily_summaries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    summary_date date NOT NULL,
    calories_total numeric NOT NULL DEFAULT 0,
    protein_total_g numeric NOT NULL DEFAULT 0,
    carbs_total_g numeric NOT NULL DEFAULT 0,
    fat_total_g numeric NOT NULL DEFAULT 0,
    fiber_total_g numeric NOT NULL DEFAULT 0,
    sugars_total_g numeric NOT NULL DEFAULT 0,
    sodium_total_mg numeric NOT NULL DEFAULT 0,
    meal_count int NOT NULL DEFAULT 0,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(user_id, summary_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON daily_summaries(user_id, summary_date);

ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own summaries"
    ON daily_summaries FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summaries"
    ON daily_summaries FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own summaries"
    ON daily_summaries FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
