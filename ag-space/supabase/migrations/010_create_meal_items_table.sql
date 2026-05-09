-- 010_create_meal_items_table.sql
CREATE TABLE IF NOT EXISTS meal_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    meal_id uuid NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    name text NOT NULL,
    estimated_quantity text,
    estimated_weight_grams numeric,
    calories numeric NOT NULL DEFAULT 0,
    protein_g numeric NOT NULL DEFAULT 0,
    carbs_g numeric NOT NULL DEFAULT 0,
    fat_g numeric NOT NULL DEFAULT 0,
    fiber_g numeric NOT NULL DEFAULT 0,
    sugars_g numeric NOT NULL DEFAULT 0,
    sodium_mg numeric NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON meal_items(meal_id);

ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal items"
    ON meal_items FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert own meal items"
    ON meal_items FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()
    ));

CREATE POLICY "Users can update own meal items"
    ON meal_items FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete own meal items"
    ON meal_items FOR DELETE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()
    ));
