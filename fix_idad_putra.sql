INSERT OR IGNORE INTO teachers (id, name) VALUES ('t-33', 'Ust. Abdullah Kristianto, S.Sos.');
UPDATE wali_kelas SET teacher_id = 't-33' WHERE class_id = 'cls-1';
