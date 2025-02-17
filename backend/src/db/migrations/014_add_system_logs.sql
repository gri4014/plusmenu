-- Add system_logs table for health monitoring
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level VARCHAR(10) NOT NULL CHECK (level IN ('info', 'warning', 'error')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Add index for faster querying of recent logs
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);

-- Add some initial data
INSERT INTO system_logs (level, message) VALUES
  ('info', 'System initialized successfully'),
  ('info', 'Database connection established'),
  ('info', 'WebSocket server started');
