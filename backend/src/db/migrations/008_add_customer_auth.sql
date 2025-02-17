-- Add customer_id to active_sessions
ALTER TABLE active_sessions
ADD COLUMN customer_id UUID REFERENCES customers(id);

-- Create index for customer sessions
CREATE INDEX idx_active_sessions_customer ON active_sessions(customer_id);
