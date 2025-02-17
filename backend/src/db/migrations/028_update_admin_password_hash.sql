-- Update admin password hash
UPDATE developers
SET password_hash = '$2b$10$Wtu29UUr5F1N7RdX1cTZM.yn2ruZl8/bvyK1FqIRaPgE8dfQ4Dn0a'
WHERE login = 'admin';
