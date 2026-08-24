-- Fix class ID mappings in teaching_schedules
-- Use temporary names to avoid collision

UPDATE teaching_schedules SET class_id = 'temp-1' WHERE class_id = 'cls-1';
UPDATE teaching_schedules SET class_id = 'temp-2' WHERE class_id = 'cls-2';
UPDATE teaching_schedules SET class_id = 'temp-3' WHERE class_id = 'cls-3';
UPDATE teaching_schedules SET class_id = 'temp-4' WHERE class_id = 'cls-4';
UPDATE teaching_schedules SET class_id = 'temp-5' WHERE class_id = 'cls-5';
UPDATE teaching_schedules SET class_id = 'temp-6' WHERE class_id = 'cls-6';
UPDATE teaching_schedules SET class_id = 'temp-7' WHERE class_id = 'cls-7';

-- Now assign the correct class_id based on the columns
-- Col 1: Wustho 1 PA -> cls-3
UPDATE teaching_schedules SET class_id = 'cls-3' WHERE class_id = 'temp-1';
-- Col 2: Wustho 1 PI -> cls-4
UPDATE teaching_schedules SET class_id = 'cls-4' WHERE class_id = 'temp-2';
-- Col 3: Wustho 2 PA -> cls-5
UPDATE teaching_schedules SET class_id = 'cls-5' WHERE class_id = 'temp-3';
-- Col 4: Wustho 2 PI -> cls-6
UPDATE teaching_schedules SET class_id = 'cls-6' WHERE class_id = 'temp-4';
-- Col 5: Wustho 3 -> cls-7
UPDATE teaching_schedules SET class_id = 'cls-7' WHERE class_id = 'temp-5';
-- Col 6: I'dad PA -> cls-1
UPDATE teaching_schedules SET class_id = 'cls-1' WHERE class_id = 'temp-6';
-- Col 7: I'dad PI -> cls-2
UPDATE teaching_schedules SET class_id = 'cls-2' WHERE class_id = 'temp-7';
