-- Add updated_at column to restaurant_admins table
ALTER TABLE restaurant_admins
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_restaurant_admins_updated_at
    BEFORE UPDATE ON restaurant_admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
