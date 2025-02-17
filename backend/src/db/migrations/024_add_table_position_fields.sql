-- Add position and section fields to tables
ALTER TABLE tables
ADD COLUMN x_position INTEGER DEFAULT 0,
ADD COLUMN y_position INTEGER DEFAULT 0,
ADD COLUMN section VARCHAR(255);

-- Add index for faster section queries
CREATE INDEX idx_tables_section ON tables(section);
