-- Revert time mappings for teaching_schedules to match the official PDF

-- SABTU & MINGGU
UPDATE teaching_schedules SET time = '10:00 - 10:45' WHERE day IN ('Sabtu', 'Minggu') AND time = '07:30 - 08:30';
UPDATE teaching_schedules SET time = '10:45 - 11:30' WHERE day IN ('Sabtu', 'Minggu') AND time = '08:30 - 09:30';
UPDATE teaching_schedules SET time = '12:30 - 13:00' WHERE day IN ('Sabtu', 'Minggu') AND time = '09:30 - 10:30';
UPDATE teaching_schedules SET time = '13:00 - 13:30' WHERE day IN ('Sabtu', 'Minggu') AND time = '10:30 - 11:30';

-- SENIN, SELASA, RABU, KAMIS
UPDATE teaching_schedules SET time = '10:00 - 10:45' WHERE day NOT IN ('Sabtu', 'Minggu') AND time = '13:30 - 14:15';
UPDATE teaching_schedules SET time = '10:45 - 11:30' WHERE day NOT IN ('Sabtu', 'Minggu') AND time = '14:15 - 15:00';
UPDATE teaching_schedules SET time = '12:30 - 13:00' WHERE day NOT IN ('Sabtu', 'Minggu') AND time = '15:00 - 15:45';
UPDATE teaching_schedules SET time = '13:00 - 13:30' WHERE day NOT IN ('Sabtu', 'Minggu') AND time = '16:30 - 17:15';
