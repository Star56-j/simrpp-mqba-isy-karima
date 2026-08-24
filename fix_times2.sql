-- Fix time mappings for teaching_schedules to use unified blocks

-- Delete the second half of the blocks (the duplicates)
DELETE FROM teaching_schedules WHERE time = '10:45 - 11:30';
DELETE FROM teaching_schedules WHERE time = '13:00 - 13:30';

-- Update the first half of the blocks to span the full time
UPDATE teaching_schedules SET time = '10:00 - 11:30' WHERE time = '10:00 - 10:45';
UPDATE teaching_schedules SET time = '12:30 - 13:30' WHERE time = '12:30 - 13:00';
