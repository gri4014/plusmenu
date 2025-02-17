-- Add new QR code fields to tables table
ALTER TABLE tables
ADD COLUMN qr_code_identifier UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'inactive'));

-- Rename qr_code_url to qr_code_image_path
ALTER TABLE tables
RENAME COLUMN qr_code_url TO qr_code_image_path;

-- Add index for quick lookups
CREATE INDEX idx_tables_qr_code_identifier ON tables(qr_code_identifier);
CREATE INDEX idx_tables_status ON tables(status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tables_updated_at
    BEFORE UPDATE ON tables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
