-- Update admin password to Admin@123
UPDATE developers
SET password_hash = '$2b$10$VoKFzJjTnlZRqv/GX231I.qcJNZcXaOCVloePk4.rwOu9YBOOTh.K'
WHERE login = 'admin';
