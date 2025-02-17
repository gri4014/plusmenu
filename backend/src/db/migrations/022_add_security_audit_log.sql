-- Create enum for audit action types
CREATE TYPE audit_action AS ENUM (
  'LOGIN_ATTEMPT',
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'PERMISSION_CHECK',
  'PERMISSION_DENIED',
  'PERMISSION_GRANTED',
  'PERMISSION_CHANGE',
  'ADMIN_CREATED',
  'ADMIN_MODIFIED',
  'ADMIN_DEACTIVATED'
);

-- Create table for security audit logs
CREATE TABLE security_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID,  -- Can be null for failed login attempts
  action audit_action NOT NULL,
  resource_type VARCHAR(50),  -- e.g., 'restaurant', 'menu', 'order'
  resource_id UUID,  -- ID of the affected resource
  old_value JSONB,  -- Previous state (for changes)
  new_value JSONB,  -- New state (for changes)
  ip_address INET,  -- Client IP address
  user_agent TEXT,  -- Client user agent
  metadata JSONB,   -- Additional context (e.g., request path, query params)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Add foreign key to users (if exists)
  CONSTRAINT fk_user FOREIGN KEY (user_id)
    REFERENCES restaurant_admins(id)
    ON DELETE SET NULL
);

-- Create indexes for common queries
CREATE INDEX idx_audit_timestamp ON security_audit_logs(timestamp);
CREATE INDEX idx_audit_user ON security_audit_logs(user_id);
CREATE INDEX idx_audit_action ON security_audit_logs(action);
CREATE INDEX idx_audit_resource ON security_audit_logs(resource_type, resource_id);

-- Create function to clean old audit logs (older than 90 days)
CREATE OR REPLACE FUNCTION clean_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM security_audit_logs
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON TABLE security_audit_logs IS 'Stores security-related events for auditing purposes';
