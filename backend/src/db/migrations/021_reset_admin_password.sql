-- Reset admin password to the state before any changes
UPDATE developers 
SET password_hash = '$2a$10$YcmQGOcBF3MEYnfj/sBHPuZxZtO5AExl4.qpXEfvrPhKMnHVGD.Hy'
WHERE login = 'admin';
