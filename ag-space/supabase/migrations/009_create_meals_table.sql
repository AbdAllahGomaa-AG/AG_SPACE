-- 009_create_meals_table.sql
CREATE TABLE IF NOT EXISTS meals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_name text NOT NULL,
    meal_type text NOT NULL DEFAULT 'other'
        CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'other')),
    logged_at timestamptz NOT NULL DEFAULT now(),
    input_mode text NOT NULL CHECK (input_mode IN ('image', 'text')),
    source_text text,
    image_path text,
    analysis_confidence numeric(3,2),
    assumptions_json jsonb,
    ai_raw_response_json jsonb,
    is_confirmed boolean DEFAULT false,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_logged_at ON meals(logged_at);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, logged_at);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meals"
    ON meals FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals"
    ON meals FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals"
    ON meals FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals"
    ON meals FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

CREATE TRIGGER update_meals_updated_at
    BEFORE UPDATE ON meals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
