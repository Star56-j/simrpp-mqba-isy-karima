UPDATE users
SET name = (SELECT name FROM teachers WHERE teachers.id = users.teacher_id)
WHERE role = 'Guru' AND EXISTS (SELECT 1 FROM teachers WHERE teachers.id = users.teacher_id);
