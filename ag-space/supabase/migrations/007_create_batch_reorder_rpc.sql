-- Atomic batch reorder for drag-and-drop operations
-- Accepts an array of {id, sort_order, parent_id, status} updates
-- Executes in a single transaction

CREATE OR REPLACE FUNCTION batch_reorder_tasks(items JSONB)
RETURNS void AS $$
BEGIN
    UPDATE tasks t
    SET
        sort_order = (item->>'sort_order')::integer,
        parent_id = CASE
            WHEN item ? 'parent_id' THEN (item->>'parent_id')::uuid
            ELSE t.parent_id
        END,
        status = CASE
            WHEN item ? 'status' THEN (item->>'status')::text
            ELSE t.status
        END
    FROM JSONB_ARRAY_ELEMENTS(items) AS item
    WHERE t.id = (item->>'id')::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
