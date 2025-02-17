-- Add image_urls column to menu_items table
ALTER TABLE menu_items ADD COLUMN image_urls TEXT[] DEFAULT '{}';

-- Update existing items to have their image_url as the first element in image_urls
UPDATE menu_items 
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL;
