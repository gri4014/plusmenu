-- Make theme_colors column nullable
ALTER TABLE restaurants ALTER COLUMN theme_colors DROP NOT NULL;
