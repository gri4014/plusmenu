-- Add session status enum type
DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('active', 'completed', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status column to active_sessions
ALTER TABLE active_sessions
ADD COLUMN status session_status NOT NULL DEFAULT 'active',
ADD COLUMN closed_by UUID REFERENCES restaurant_admins(id),
ADD COLUMN closed_at TIMESTAMP;

-- Add indexes for better query performance
CREATE INDEX idx_active_sessions_status ON active_sessions(status);
CREATE INDEX idx_active_sessions_phone ON active_sessions(phone_number);

-- Add trigger to update closed_at timestamp
CREATE OR REPLACE FUNCTION update_session_closed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.closed_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_session_closed_at_trigger
    BEFORE UPDATE ON active_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_closed_at();

-- Add constraint to ensure only one active session per table
CREATE UNIQUE INDEX idx_one_active_session_per_table 
ON active_sessions (table_id) 
WHERE status = 'active';
