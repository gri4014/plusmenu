-- Add initial admin user
INSERT INTO developers (id, login, password_hash, created_at, last_login, is_active)
VALUES (
  uuid_generate_v4(),
  'admin',
  -- Password: Admin@123
  '$2b$10$3IKJ0LRixRtJPT9t1.zEK.DMY3gAUwuVHVic3pbqJqxEYAQM0TBdm',
  CURRENT_TIMESTAMP,
  NULL,
  true
)
ON CONFLICT (login) DO NOTHING;
