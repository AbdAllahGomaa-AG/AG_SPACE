-- Trigger to create default categories for new users after signup
-- This runs automatically when a new auth.users row is created

-- Function to create default categories for a user
CREATE OR REPLACE FUNCTION create_default_categories_for_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default categories for the new user
    INSERT INTO categories (user_id, name, color, icon, is_default)
    VALUES 
        (NEW.id, 'Personal', '#10b981', 'pi pi-user', true),
        (NEW.id, 'Work', '#3b82f6', 'pi pi-briefcase', true),
        (NEW.id, 'Health', '#f59e0b', 'pi pi-heart', true),
        (NEW.id, 'Learning', '#8b5cf6', 'pi pi-book', true);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run after a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_categories_for_user();

-- Note: For existing users, you can manually run:
-- SELECT create_default_categories_for_user() FROM auth.users;
-- (This would need to be run as a separate migration or admin script)
