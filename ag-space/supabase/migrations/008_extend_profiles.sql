-- 008_extend_profiles.sql
-- Add nutrition target columns to profiles table

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calorie_target numeric DEFAULT 2000;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS protein_target_g numeric DEFAULT 150;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS carbs_target_g numeric DEFAULT 250;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fat_target_g numeric DEFAULT 65;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fiber_target_g numeric DEFAULT 25;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goal_type text DEFAULT 'maintain'
    CHECK (goal_type IN ('lose', 'maintain', 'gain'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age int;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sex text CHECK (sex IN ('male', 'female', 'other'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height_cm numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight_kg numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS activity_level text DEFAULT 'moderate'
    CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unit_system text DEFAULT 'metric'
    CHECK (unit_system IN ('metric', 'imperial'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
