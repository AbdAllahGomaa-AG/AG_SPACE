-- Add hierarchical subtask support to tasks table
-- parent_id enables self-referencing parent-child relationships
-- sort_order enables stable drag-and-drop reordering

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0 NOT NULL;

-- Index for efficient subtask lookups and ordering
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(parent_id, sort_order);

-- Update RLS: users can only access tasks that belong to them
-- (parent tasks are already covered by existing user_id check)
-- Subtasks inherit the same user_id as parent, so existing RLS applies automatically

-- Ensure parent and child belong to the same user via trigger
CREATE OR REPLACE FUNCTION validate_subtask_parent_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM tasks
            WHERE id = NEW.parent_id
            AND user_id = NEW.user_id
        ) THEN
            RAISE EXCEPTION 'Subtask parent must belong to the same user';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_subtask_parent_check ON tasks;
CREATE TRIGGER on_subtask_parent_check
    BEFORE INSERT OR UPDATE OF parent_id ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION validate_subtask_parent_user();
