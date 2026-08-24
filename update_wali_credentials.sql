UPDATE users SET email = REPLACE(email, '@isykarima.com', ''), passwordHash = 'wali123' WHERE role = 'WaliKelas';
