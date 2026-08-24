DELETE FROM users WHERE role = 'WaliKelas';

INSERT INTO users (id, name, email, passwordHash, role, teacher_id) VALUES
('user-' || lower(hex(randomblob(4))), 'Ust. Abdullah Kristianto, S.Sos.', 'wali.abdullah', 'wali123', 'WaliKelas', 't-33'),
('user-' || lower(hex(randomblob(4))), 'Usth. Hasna Halimatun Basyaria, S.Ag., Al Hafizhah', 'wali.hasna', 'wali123', 'WaliKelas', 't-29'),
('user-' || lower(hex(randomblob(4))), 'Ust. Aidil Aqli, S.Ag.', 'wali.aidil', 'wali123', 'WaliKelas', 't-12'),
('user-' || lower(hex(randomblob(4))), 'Usth. Lina Ayu Fitriyyah, S. Ag.', 'wali.lina', 'wali123', 'WaliKelas', 't-27'),
('user-' || lower(hex(randomblob(4))), 'Ust. Fredy Susilo Supriyanto, S.Ag., Al Hafizh', 'wali.fredy', 'wali123', 'WaliKelas', 't-4'),
('user-' || lower(hex(randomblob(4))), 'Ust. Muhammad Latief Amiruddin, S.T.', 'wali.latief', 'wali123', 'WaliKelas', 't-25');
