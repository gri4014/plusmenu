-- Create notification type enum
CREATE TYPE notification_type AS ENUM (
  'order_status',
  'waiter_call', 
  'session_update'
);

-- Create notification status enum
CREATE TYPE notification_status AS ENUM (
  'pending',
  'delivered',
  'failed'
);

-- Create notification priority enum
CREATE TYPE notification_priority AS ENUM (
  'high',
  'normal',
  'low'
);

-- Create notification target type enum
CREATE TYPE notification_target_type AS ENUM (
  'room',
  'user',
  'role',
  'all'
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type notification_type NOT NULL,
  status notification_status NOT NULL DEFAULT 'pending',
  priority notification_priority NOT NULL DEFAULT 'normal',
  payload JSONB NOT NULL,
  target_type notification_target_type NOT NULL,
  target_id VARCHAR(255),
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Add indexes for common query patterns
  CONSTRAINT notifications_target_id_required CHECK (
    (target_type = 'all' AND target_id IS NULL) OR
    (target_type != 'all' AND target_id IS NOT NULL)
  )
);

-- Add indexes for common query patterns
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_notifications_target ON notifications(target_type, target_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Add function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days INTEGER)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM notifications 
    WHERE status IN ('delivered', 'failed')
      AND created_at < CURRENT_TIMESTAMP - (days || ' days')::INTERVAL
    RETURNING id
  )
  SELECT COALESCE(COUNT(*)::INTEGER, 0) INTO deleted_count FROM deleted;
  
  -- Return 0 if no rows were deleted
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql STRICT;
