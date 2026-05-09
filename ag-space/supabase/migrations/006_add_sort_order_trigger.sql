-- Auto-assign sort_order for new tasks if not provided
CREATE OR REPLACE FUNCTION assign_task_sort_order()
RETURNS TRIGGER AS $$
DECLARE
    next_order integer;
BEGIN
    IF NEW.sort_order IS NULL OR NEW.sort_order = 0 THEN
        SELECT COALESCE(MAX(sort_order), -1) + 1 INTO next_order
        FROM tasks
        WHERE (NEW.parent_id IS NULL AND parent_id IS NULL)
           OR (parent_id IS NOT NULL AND parent_id = NEW.parent_id);
        NEW.sort_order = next_order;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_task_sort_order ON tasks;
CREATE TRIGGER on_task_sort_order
    BEFORE INSERT ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION assign_task_sort_order();
