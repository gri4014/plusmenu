-- Create notification status change reason enum
CREATE TYPE notification_status_change_reason AS ENUM (
  'initial',
  'delivery_success',
  'delivery_failure',
  'retry_limit_exceeded',
  'target_disconnected',
  'target_reconnected',
  'manual_update',
  'system_cleanup'
);

-- Create notification status history table
CREATE TABLE notification_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  from_status notification_status,
  to_status notification_status NOT NULL,
  reason notification_status_change_reason NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Add constraint to ensure from_status is different from to_status
  CONSTRAINT different_status CHECK (from_status IS NULL OR from_status != to_status)
);

-- Add indexes for common query patterns
CREATE INDEX idx_notification_status_history_notification_id 
  ON notification_status_history(notification_id);
CREATE INDEX idx_notification_status_history_created_at 
  ON notification_status_history(created_at);

-- Add function to automatically record status changes in notifications table
CREATE OR REPLACE FUNCTION record_notification_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- For new notifications, record initial status
    INSERT INTO notification_status_history (
      notification_id,
      from_status,
      to_status,
      reason,
      metadata
    ) VALUES (
      NEW.id,
      NULL,
      NEW.status,
      'initial',
      jsonb_build_object(
        'priority', NEW.priority,
        'type', NEW.type,
        'target_type', NEW.target_type,
        'target_id', NEW.target_id
      )
    );
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    -- For status updates, record the change
    INSERT INTO notification_status_history (
      notification_id,
      from_status,
      to_status,
      reason,
      metadata
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      CASE
        WHEN NEW.status = 'delivered' THEN 'delivery_success'
        WHEN NEW.status = 'failed' AND NEW.attempts >= CASE 
          WHEN NEW.type = 'order_status' THEN 5
          ELSE 3
        END THEN 'retry_limit_exceeded'
        WHEN NEW.status = 'failed' THEN 'delivery_failure'
        ELSE 'manual_update'
      END,
      jsonb_build_object(
        'attempts', NEW.attempts,
        'delivered_at', NEW.delivered_at,
        'updated_at', NEW.updated_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status change tracking
CREATE TRIGGER track_notification_status_changes
  AFTER INSERT OR UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION record_notification_status_change();

-- Add function to get status history for a notification
CREATE OR REPLACE FUNCTION get_notification_status_history(notification_uuid UUID)
RETURNS TABLE (
  status notification_status,
  reason notification_status_change_reason,
  metadata JSONB,
  changed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_status as status,
    reason,
    metadata,
    created_at as changed_at
  FROM notification_status_history
  WHERE notification_id = notification_uuid
  ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Add function to get status transition metrics
CREATE OR REPLACE FUNCTION get_status_transition_metrics(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  notification_type notification_type,
  from_status notification_status,
  to_status notification_status,
  transition_count BIGINT,
  avg_transition_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  WITH transitions AS (
    SELECT 
      n.type as notification_type,
      h1.to_status as from_status,
      h2.to_status as to_status,
      h2.created_at - h1.created_at as transition_time
    FROM notification_status_history h1
    JOIN notification_status_history h2 
      ON h1.notification_id = h2.notification_id
      AND h1.created_at < h2.created_at
    JOIN notifications n ON n.id = h1.notification_id
    WHERE NOT EXISTS (
      SELECT 1 
      FROM notification_status_history h3
      WHERE h3.notification_id = h1.notification_id
        AND h3.created_at > h1.created_at 
        AND h3.created_at < h2.created_at
    )
    AND h1.created_at BETWEEN start_date AND end_date
  )
  SELECT 
    notification_type,
    from_status,
    to_status,
    COUNT(*) as transition_count,
    AVG(transition_time) as avg_transition_time
  FROM transitions
  GROUP BY notification_type, from_status, to_status;
END;
$$ LANGUAGE plpgsql;

-- Add function to get delivery success rates
CREATE OR REPLACE FUNCTION get_delivery_success_rates(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  notification_type notification_type,
  total_count BIGINT,
  delivered_count BIGINT,
  failed_count BIGINT,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_statuses AS (
    SELECT DISTINCT ON (notification_id)
      notification_id,
      to_status as final_status
    FROM notification_status_history
    WHERE created_at BETWEEN start_date AND end_date
    ORDER BY notification_id, created_at DESC
  )
  SELECT 
    n.type,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE ls.final_status = 'delivered') as delivered_count,
    COUNT(*) FILTER (WHERE ls.final_status = 'failed') as failed_count,
    ROUND(
      COUNT(*) FILTER (WHERE ls.final_status = 'delivered')::NUMERIC / 
      COUNT(*)::NUMERIC * 100,
      2
    ) as success_rate
  FROM latest_statuses ls
  JOIN notifications n ON n.id = ls.notification_id
  GROUP BY n.type;
END;
$$ LANGUAGE plpgsql;
