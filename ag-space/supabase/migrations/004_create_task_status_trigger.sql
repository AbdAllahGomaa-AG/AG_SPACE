-- Trigger to handle completed_at based on status changes
-- When status becomes 'done' -> set completed_at
-- When status changes away from 'done' -> clear completed_at

CREATE OR REPLACE FUNCTION handle_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changed to 'done', set completed_at
    IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
        NEW.completed_at = now();
    -- If status changed away from 'done', clear completed_at
    ELSIF OLD.status = 'done' AND NEW.status != 'done' THEN
        NEW.completed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tasks table
DROP TRIGGER IF EXISTS on_task_status_change ON tasks;
CREATE TRIGGER on_task_status_change
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION handle_task_status_change();

-- Also handle INSERT: if new task is created with status 'done', set completed_at
CREATE OR REPLACE FUNCTION handle_new_task_completed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'done' AND NEW.completed_at IS NULL THEN
        NEW.completed_at = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_new_task_done ON tasks;
CREATE TRIGGER on_new_task_done
    BEFORE INSERT ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_task_completed();
