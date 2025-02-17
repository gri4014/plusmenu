-- Add restaurant_id to categories table
ALTER TABLE categories
ADD COLUMN restaurant_id UUID REFERENCES restaurants(id);

-- Add index for better query performance
CREATE INDEX idx_categories_restaurant ON categories(restaurant_id);

-- Add display_order column for category ordering
ALTER TABLE categories
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Add unique constraint for category names within a restaurant
ALTER TABLE categories
ADD CONSTRAINT unique_category_name_per_restaurant UNIQUE (restaurant_id, name);
