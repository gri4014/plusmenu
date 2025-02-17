-- Add permissions and is_admin fields to restaurant_admins
ALTER TABLE restaurant_admins
ADD COLUMN permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

-- Update existing records to be admins with all permissions
UPDATE restaurant_admins
SET is_admin = true,
    permissions = '["MENU", "ORDER", "TABLE", "ADMIN", "THEME"]'::jsonb;
