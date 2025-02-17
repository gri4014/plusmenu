-- Add initial parameters
INSERT INTO item_parameters (name, data_type, min_value, max_value, is_active)
VALUES
  ('Spiciness Level', 'scale', 0, 5, true),
  ('Gluten Free', 'boolean', NULL, NULL, true),
  ('Vegetarian', 'boolean', NULL, NULL, true),
  ('Vegan', 'boolean', NULL, NULL, true),
  ('Cooking Time (minutes)', 'integer', 5, 60, true),
  ('Portion Size (grams)', 'integer', 100, 1000, true),
  ('Allergen Info', 'text', NULL, NULL, true),
  ('Calories', 'integer', 0, 2000, true),
  ('Sugar Content (g)', 'float', 0, 100, true),
  ('Protein Content (g)', 'float', 0, 100, true);
