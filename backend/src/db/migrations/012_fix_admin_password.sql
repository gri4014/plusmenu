-- Fix admin password hash
UPDATE developers
SET password_hash = '$2a$10$YcmQGOcBF3MEYnfj/sBHPuZxZtO5AExl4.qpXEfvrPhKMnHVGD.Hy'
WHERE login = 'admin';
