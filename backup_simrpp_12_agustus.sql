PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL,
  teacher_id TEXT,
  santri_id TEXT
);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('user-admin-1','Aqli','aidilibnusalam3@gmail.com','$2b$10$parabek123hashed','Admin',NULL,NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('user-admin-2','Admin MQBA','admin@mqba.sch.id','$2b$10$admin123hashed','Admin',NULL,NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-0','Ust. Abdul Malik','guru0@mqba.sch.id','$2b$10$guru123hashed','Guru','t-0',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-1','Ust. Umar','guru1@mqba.sch.id','$2b$10$guru123hashed','Guru','t-1',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-2','Ust. Dzulfikar','guru2@mqba.sch.id','$2b$10$guru123hashed','Guru','t-2',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-3','Ust. Karim','guru3@mqba.sch.id','$2b$10$guru123hashed','Guru','t-3',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-4','Ust. Fredy','guru4@mqba.sch.id','$2b$10$guru123hashed','Guru','t-4',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-5','Ust. Abdullah','guru5@mqba.sch.id','$2b$10$guru123hashed','Guru','t-5',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-6','Usth.Anim','guru6@mqba.sch.id','$2b$10$guru123hashed','Guru','t-6',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-7','Ust. Agib','guru7@mqba.sch.id','$2b$10$guru123hashed','Guru','t-7',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-8','Usth.Iffah','guru8@mqba.sch.id','$2b$10$guru123hashed','Guru','t-8',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-9','Ust. Yunan','guru9@mqba.sch.id','$2b$10$guru123hashed','Guru','t-9',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-10','Ust. Faqih','guru10@mqba.sch.id','$2b$10$guru123hashed','Guru','t-10',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-11','Usth. Indri','guru11@mqba.sch.id','$2b$10$guru123hashed','Guru','t-11',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-12','Ust. Aidil','guru12@mqba.sch.id','$2b$10$guru123hashed','Guru','t-12',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-13','Usth. Saiba Musyaiya','guru13@mqba.sch.id','$2b$10$guru123hashed','Guru','t-13',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-14','Ust. Arya','guru14@mqba.sch.id','$2b$10$guru123hashed','Guru','t-14',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-15','Ust. Kholif','guru15@mqba.sch.id','$2b$10$guru123hashed','Guru','t-15',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-16','Usth. Bela','guru16@mqba.sch.id','$2b$10$guru123hashed','Guru','t-16',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-17','Ust. Farhan','guru17@mqba.sch.id','$2b$10$guru123hashed','Guru','t-17',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-18','Ust. Tubagus','guru18@mqba.sch.id','$2b$10$guru123hashed','Guru','t-18',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-19','Ust. Hafizh','guru19@mqba.sch.id','$2b$10$guru123hashed','Guru','t-19',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-20','Usth. Fani','guru20@mqba.sch.id','$2b$10$guru123hashed','Guru','t-20',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-21','Ust. Azri','guru21@mqba.sch.id','$2b$10$guru123hashed','Guru','t-21',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-22','Usth. Dila','guru22@mqba.sch.id','$2b$10$guru123hashed','Guru','t-22',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-23','Usth. Azizah','guru23@mqba.sch.id','$2b$10$guru123hashed','Guru','t-23',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-24','Usth. Hasri','guru24@mqba.sch.id','$2b$10$guru123hashed','Guru','t-24',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-25','Ust. Latief','guru25@mqba.sch.id','$2b$10$guru123hashed','Guru','t-25',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-26','Ust. Akmal','guru26@mqba.sch.id','$2b$10$guru123hashed','Guru','t-26',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-27','Usth. Lina','guru27@mqba.sch.id','$2b$10$guru123hashed','Guru','t-27',NULL);
INSERT INTO "users" ("id","name","email","passwordHash","role","teacher_id","santri_id") VALUES('u-28','Ust. Rezkidar','guru28@mqba.sch.id','$2b$10$guru123hashed','Guru','t-28',NULL);
CREATE TABLE teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  nip TEXT,
  subjects TEXT,
  classes TEXT
);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-0','Ust. Muhammad Abdul Malik Ibrahim, S.Kom','guru0@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-1','Ust. Umar Alamuddin, Lc., Al-Hafizh','guru1@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-2','Ust. Dzulfikar Tri Baskara, S.Ag, M.Pd','guru2@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-3','Ust. Nashiruddin Karim, Lc., Al-Hafizh','guru3@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-4','Ust. Fredy Susilo Supriyanto, S.Ag., Al Hafizh','guru4@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-5','Ust. Muhammad Ilyas Abdullah','guru5@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-6','Usth. Aulia Anim Amanillah','guru6@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-7','Ustadz Sahmura Maulana al-Maghribi, S.Mat, M.Mat','guru7@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-8','Usth. Iffah Luthfiyah','guru8@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-9','Ust. Yunan Hidayat, Al Hafizh','guru9@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-10','Ust. Faqih Hidayat,Lc','guru10@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-11','Usth. Indri Nur Bidari, S.Si','guru11@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-12','Ust. Aidil Aqli, S.Ag.','guru12@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-13','Ustadzah Saiba Musyaiya','guru13@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-14','Ust. M. Arya Mukti, S.Pd al-Hafizh','guru14@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-15','Ust. Abdul Kholif al-Hafizh','guru15@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-16','Usth. Bela Dwi Lestari,S.pd., Gr','guru16@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-17','Ust. Farhan Akhandi, S.Ag','guru17@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-18','Ust. Tubagus Ahadiyat Rachmadi Luhur, S. Ag.','guru18@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-19','Ust. Muhammad Hafizh, S.Si','guru19@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-20','Usth. Rifanisa Nurulfitria, S.Hum., M.Si.','guru20@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-21','Ust. Azri Robani Indra Robbi, S.Ag.','guru21@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-22','Ustadzah Extika Nur Fadhillah','guru22@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-23','Usth. Azizah Nur Aini, S.Pd., Gr','guru23@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-24','Usth. Hasri Haryani Direja, S.Ds','guru24@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-25','Ust. Muhammad Latief Amiruddin, S.T.','guru25@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-26','Ust. Akmal Firmana, ST','guru26@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-27','Usth. Lina Ayu Fitriyyah, S. Ag.','guru27@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-28','Ust. Rezkidar','guru28@mqba.sch.id',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-29','Usth. Hasna Halimatun Basyaria, S.Ag., Al Hafizhah',NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-30','Ust. Sahmura Maulana al-Maghribi, S.Mat, M.Mat',NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-31','Ust. Fuad Hanafi, S.Pd',NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-32','Ust. Ahmad al Musthofa, S.Pd',NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "teachers" ("id","name","email","phone","address","nip","subjects","classes") VALUES('t-33','Ust. Abdullah Kristianto, S.Sos.',NULL,NULL,NULL,NULL,NULL,NULL);
CREATE TABLE subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL
);
INSERT INTO "subjects" ("id","name","category") VALUES('s-0','Khot','Al-Qur''an');
INSERT INTO "subjects" ("id","name","category") VALUES('s-1','Aqidah','Diniyah');
INSERT INTO "subjects" ("id","name","category") VALUES('s-2','Bhs. Inggris','Bahasa');
INSERT INTO "subjects" ("id","name","category") VALUES('s-3','Fiqih','Diniyah');
INSERT INTO "subjects" ("id","name","category") VALUES('s-4','ABY','Bahasa');
INSERT INTO "subjects" ("id","name","category") VALUES('s-5','Matematika','Umum');
INSERT INTO "subjects" ("id","name","category") VALUES('s-6','Tajwid','Al-Qur''an');
INSERT INTO "subjects" ("id","name","category") VALUES('s-7','Akhlaq','Diniyah');
INSERT INTO "subjects" ("id","name","category") VALUES('s-8','Tahsin','Al-Qur''an');
INSERT INTO "subjects" ("id","name","category") VALUES('s-9','Tilawah','Al-Qur''an');
INSERT INTO "subjects" ("id","name","category") VALUES('s-10','Siroh','Diniyah');
INSERT INTO "subjects" ("id","name","category") VALUES('s-11','IPA','Umum');
INSERT INTO "subjects" ("id","name","category") VALUES('s-12','Bhs. Indonesia','Bahasa');
INSERT INTO "subjects" ("id","name","category") VALUES('s-13','Adab','Diniyah');
INSERT INTO "subjects" ("id","name","category") VALUES('subjects-1786502385716','Furusiyyah','Diniyah');
INSERT INTO "subjects" ("id","name","category") VALUES('subjects-1786502401572','Tai Chi','Umum');
CREATE TABLE classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL
);
INSERT INTO "classes" ("id","name","level") VALUES('cls-1','I''dad Putra','I''dad');
INSERT INTO "classes" ("id","name","level") VALUES('cls-2','I''dad Putri','I''dad');
INSERT INTO "classes" ("id","name","level") VALUES('cls-3','Kelas VII Putra','Wustho');
INSERT INTO "classes" ("id","name","level") VALUES('cls-4','Kelas VII Putri','Wustho');
INSERT INTO "classes" ("id","name","level") VALUES('cls-5','Kelas VIII Putra','Wustho');
INSERT INTO "classes" ("id","name","level") VALUES('cls-6','Kelas VIII Putri','Wustho');
INSERT INTO "classes" ("id","name","level") VALUES('cls-7','Kelas IX Putra','Wustho');
CREATE TABLE academic_years (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
INSERT INTO "academic_years" ("id","name") VALUES('ay-1','2026 / 2027');
INSERT INTO "academic_years" ("id","name") VALUES('academic_years-1786519227456','2027 - 2028');
CREATE TABLE semesters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  academic_year_id TEXT
);
INSERT INTO "semesters" ("id","name","academic_year_id") VALUES('sem-1','Ganjil',NULL);
INSERT INTO "semesters" ("id","name","academic_year_id") VALUES('sem-2','Genap',NULL);
CREATE TABLE teaching_schedules (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  class_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  academic_year_id TEXT NOT NULL,
  semester_id TEXT NOT NULL
);
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-1','Sabtu','10:00 - 11:30','cls-3','t-0','s-0','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-2','Sabtu','10:00 - 11:30','cls-4','t-1','s-1','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-3','Sabtu','10:00 - 11:30','cls-5','t-2','s-2','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-4','Sabtu','10:00 - 11:30','cls-6','t-3','s-3','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-5','Sabtu','10:00 - 11:30','cls-7','t-4','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-6','Sabtu','10:00 - 11:30','cls-1','t-5','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-7','Sabtu','10:00 - 11:30','cls-2','t-6','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-8','Sabtu','12:30 - 13:30','cls-3','t-7','s-5','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-9','Sabtu','12:30 - 13:30','cls-4','t-0','s-0','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-10','Sabtu','12:30 - 13:30','cls-5','t-4','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-11','Sabtu','12:30 - 13:30','cls-6','t-8','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-12','Sabtu','12:30 - 13:30','cls-7','t-2','s-2','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-13','Sabtu','12:30 - 13:30','cls-1','t-5','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-14','Minggu','10:00 - 11:30','cls-3','t-9','s-6','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-15','Minggu','10:00 - 11:30','cls-4','t-8','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-16','Minggu','10:00 - 11:30','cls-5','t-10','s-1','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-17','Minggu','10:00 - 11:30','cls-6','t-11','s-2','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-18','Minggu','10:00 - 11:30','cls-7','t-4','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-19','Minggu','10:00 - 11:30','cls-1','t-9','s-6','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-20','Minggu','10:00 - 11:30','cls-2','t-6','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-21','Minggu','12:30 - 13:30','cls-3','t-12','s-7','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-22','Minggu','12:30 - 13:30','cls-4','t-13','s-8','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-23','Minggu','12:30 - 13:30','cls-5','t-9','s-9','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-24','Minggu','12:30 - 13:30','cls-6','t-13','s-8','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-25','Minggu','12:30 - 13:30','cls-7','t-14','s-8','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-26','Minggu','12:30 - 13:30','cls-1','t-14','s-8','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-27','Minggu','12:30 - 13:30','cls-2','t-13','s-8','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-28','Senin','10:00 - 11:30','cls-3','t-10','s-1','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-29','Senin','10:00 - 11:30','cls-4','t-8','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-30','Senin','10:00 - 11:30','cls-5','t-15','s-8','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-31','Senin','10:00 - 11:30','cls-6','t-16','s-5','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-32','Senin','10:00 - 11:30','cls-7','t-17','s-3','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-33','Senin','10:00 - 11:30','cls-1','t-5','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-34','Senin','10:00 - 11:30','cls-2','t-6','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-35','Senin','12:30 - 13:30','cls-3','t-5','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-36','Senin','12:30 - 13:30','cls-4','t-13','s-8','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-37','Senin','12:30 - 13:30','cls-5','t-18','s-10','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-38','Senin','12:30 - 13:30','cls-6','t-8','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-39','Senin','12:30 - 13:30','cls-7','t-19','s-11','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-40','Senin','12:30 - 13:30','cls-1','t-14','s-8','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-41','Senin','12:30 - 13:30','cls-2','t-13','s-8','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-42','Selasa','10:00 - 11:30','cls-3','t-5','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-43','Selasa','10:00 - 11:30','cls-4','t-8','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-44','Selasa','10:00 - 11:30','cls-6','t-20','s-10','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-45','Selasa','10:00 - 11:30','cls-7','t-4','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-46','Selasa','10:00 - 11:30','cls-1','t-5','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-47','Selasa','10:00 - 11:30','cls-2','t-6','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-48','Selasa','12:30 - 13:30','cls-3','t-21','s-8','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-49','Selasa','12:30 - 13:30','cls-4','t-22','s-6','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-50','Selasa','12:30 - 13:30','cls-5','t-19','s-11','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-51','Selasa','12:30 - 13:30','cls-6','t-23','s-11','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-52','Selasa','12:30 - 13:30','cls-7','t-12','s-12','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-53','Selasa','12:30 - 13:30','cls-2','t-22','s-6','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-54','Rabu','10:00 - 11:30','cls-3','t-5','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-55','Rabu','10:00 - 11:30','cls-4','t-13','s-8','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-56','Rabu','10:00 - 11:30','cls-5','t-4','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-57','Rabu','10:00 - 11:30','cls-6','t-13','s-8','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-58','Rabu','10:00 - 11:30','cls-7','t-14','s-8','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-59','Rabu','10:00 - 11:30','cls-1','t-5','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-60','Rabu','10:00 - 11:30','cls-2','t-13','s-8','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-61','Rabu','12:30 - 13:30','cls-3','t-5','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-62','Rabu','12:30 - 13:30','cls-4','t-22','s-6','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-63','Rabu','12:30 - 13:30','cls-5','t-15','s-8','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-64','Rabu','12:30 - 13:30','cls-6','t-8','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-65','Rabu','12:30 - 13:30','cls-7','t-18','s-10','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-66','Rabu','12:30 - 13:30','cls-1','t-5','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-67','Rabu','12:30 - 13:30','cls-2','t-22','s-6','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-68','Kamis','10:00 - 11:30','cls-3','t-21','s-8','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-69','Kamis','10:00 - 11:30','cls-4','t-24','s-5','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-70','Kamis','10:00 - 11:30','cls-5','t-25','s-5','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-71','Kamis','10:00 - 11:30','cls-6','t-1','s-1','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-72','Kamis','10:00 - 11:30','cls-7','t-26','s-5','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-73','Kamis','10:00 - 11:30','cls-1','t-21','s-8','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-74','Kamis','10:00 - 11:30','cls-2','t-6','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-75','Kamis','12:30 - 13:30','cls-3','t-21','s-8','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-76','Kamis','12:30 - 13:30','cls-4','t-27','s-7','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-77','Kamis','12:30 - 13:30','cls-5','t-28','s-3','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-78','Kamis','12:30 - 13:30','cls-6','t-8','s-4','ay-1','sem-1');
INSERT INTO "teaching_schedules" ("id","day","time","class_id","teacher_id","subject_id","academic_year_id","semester_id") VALUES('sch-exact-79','Kamis','12:30 - 13:30','cls-7','t-3','s-13','ay-1','sem-1');
CREATE TABLE rpps (
  id TEXT PRIMARY KEY,
  teacher_id TEXT,
  subject_id TEXT,
  class_id TEXT,
  academic_year_id TEXT,
  status TEXT DEFAULT 'Draft',
  profil_pelajar TEXT,
  sarana TEXT,
  capaian_pembelajaran TEXT,
  tujuan_pembelajaran TEXT,
  alur_tp TEXT,
  materi_ganjil TEXT,
  materi_genap TEXT,
  total_meetings_ganjil INTEGER DEFAULT 0,
  total_meetings_genap INTEGER DEFAULT 0,
  pendahuluan TEXT,
  kegiatan_inti TEXT,
  penutup TEXT,
  metode TEXT,
  media TEXT,
  asesmen_diagnostik TEXT,
  asesmen_formatif TEXT,
  asesmen_sumatif TEXT,
  diferensiasi TEXT,
  pengayaan TEXT,
  catatan TEXT,
  syllabus_items TEXT,
  revision_notes TEXT,
  updated_at TEXT,
  created_at TEXT
);
CREATE TABLE attendances (
  id TEXT PRIMARY KEY,
  teacher_id TEXT,
  date TEXT,
  status TEXT,
  notes TEXT,
  academic_year_id TEXT,
  semester_id TEXT,
  recorded_by TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE santri (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  class_id TEXT,
  nis TEXT,
  gender TEXT,
  birth_date TEXT,
  address TEXT,
  wali_name TEXT,
  wali_phone TEXT
);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-1','Ahmad Ajyad Syamil Sutrisno','cls-3','2026001',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-2','Ahmad Fakhry Athallah','cls-3','2026002',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-3','Athilasyah Rifqi Sulistyo','cls-3','2026003',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-4','Baihaqi Hanif Abrorni','cls-3','2026004',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-5','Fairuz Fahri Firmansyah','cls-3','2026005',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-6','Hasbi Nafsi Jalalullah','cls-3','2026006',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-7','Hisyam Zuhdi','cls-3','2026007',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-8','Israr At Taufik','cls-3','2026008',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-9','Keven Maghribi Darmaresta','cls-3','2026009',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-10','Khoirul Akbar Nur Hidayatulloh','cls-3','2026010',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-11','M Rajendra Ali Mudzakir','cls-3','2026011',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-12','Muhammad Fatih Izzan An-Naqy','cls-3','2026012',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-13','Muhammad Ilyas Anrisyab','cls-3','2026013',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-14','Muhammad Yahya Izzuddin','cls-3','2026014',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-15','Muhammad Yusuf Rifa''i','cls-3','2026015',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-16','Ramdhan Ridhwanullah','cls-3','2026016',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-17','Shofyan Abdillah Achmad','cls-3','2026017',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-18','Tsaabit Qawiyyul Himmah','cls-3','2026018',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-19','Yahya','cls-3','2026019',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-20','Abigail Madhalee Ariya Fatihah','cls-4','2026020',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-21','Alya Mukhbita','cls-4','2026021',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-22','Ammara taqiyya khoirunnisa','cls-4','2026022',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-23','Annisauzzahro as-salamah Parapat','cls-4','2026023',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-24','Ayesha khayla Salsabila','cls-4','2026024',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-25','Cataleya Azzahwa Fieary','cls-4','2026025',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-26','Filzah Taqy Hilmiyah Hanief','cls-4','2026026',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-27','Marwa Az Zahira Ibrahim Pribadi','cls-4','2026027',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-28','Maryam Muthiah Tafdlila','cls-4','2026028',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-29','Shabiha Nadira Azzahra','cls-4','2026029',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-30','Syakila Nada Salsabila','cls-4','2026030',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-31','Attahir Zarkasya Ramadhan','cls-1','2026031',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-32','Bintang Bumi Langit Biru','cls-1','2026032',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-33','Handade Yonca Satya Harjuna','cls-1','2026033',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-34','Kenzie Iffat Itoniwa','cls-1','2026034',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-35','Miqdaad Dzakiyy Hasan Faishal','cls-1','2026035',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-36','Sae Sibghotallah','cls-1','2026036',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-37','Imtihan Syarifatul ''Ula','cls-2','2026037',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-38','Iskanda Aulia Neisya','cls-2','2026038',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-39','Naura Auni Qonita','cls-2','2026039',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-40','Adit Wahyu Pratama','cls-5','2026040',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-41','Azka Rasya Darmawan','cls-5','2026041',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-42','Badar Farisul Qital','cls-5','2026042',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-43','Farzan Fiza Ananta','cls-5','2026043',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-44','Hamidurohman Hudzaifi','cls-5','2026044',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-45','Hilmi Dzabihulloh','cls-5','2026045',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-46','Muhammad Faathir Rusyada Azhar','cls-5','2026046',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-47','Nizar Haidar Rahman','cls-5','2026047',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-48','Raushan Akhtar Majid','cls-5','2026048',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-49','Tristan Firafisa Parsa','cls-5','2026049',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-50','Yafiq Alvaro','cls-5','2026050',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-51','Yuwhay Haura Anbiiya','cls-5','2026051',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-52','Raisa Shakila Putri','cls-6','2026052',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-53','Shofiyyah Afnan','cls-6','2026053',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-54','Dzakira Tsania Fahmi','cls-6','2026054',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-55','Rafanda Rayyan Adeeva','cls-6','2026055',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-56','Hafidzah Mumtaazah Ni''matullah','cls-6','2026056',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-57','Hurin Iin Luluil Maknun','cls-6','2026057',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-58','Queena Kayyisa Nararya','cls-6','2026058',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-59','Abdurrahman Az Zubair','cls-7','2026059',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-60','Achmad Akmal Alhakim','cls-7','2026060',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-61','Ahza Ibnu Hafiz','cls-7','2026061',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-62','Albanna Sheeva','cls-7','2026062',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-63','Arman Abdurrahman Nasution','cls-7','2026063',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-64','Faiq Kamal Yazid Al-Bara','cls-7','2026064',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-65','Jaisy Aliy Al Khalil','cls-7','2026065',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-66','Mirza Alzam Azhari','cls-7','2026066',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-67','Moh Khalifatullah Rosyad Al Amin','cls-7','2026067',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-68','Muhammad Faruq Baharta','cls-7','2026068',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-69','Muhammad Faqih Multazim','cls-7','2026069',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-70','Muhammad Zidan Dhiyauddin','cls-7','2026070',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-71','Rafasya Muhammad Firdaus An''Naba','cls-7','2026071',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-72','Vajradhatu Keinan Noor','cls-7','2026072',NULL,NULL,NULL,NULL,NULL);
INSERT INTO "santri" ("id","name","class_id","nis","gender","birth_date","address","wali_name","wali_phone") VALUES('santri-73','Ziyad Alhaq','cls-7','2026073',NULL,NULL,NULL,NULL,NULL);
CREATE TABLE santri_attendances (
  id TEXT PRIMARY KEY,
  class_id TEXT,
  date TEXT,
  jumlah_hadir INTEGER DEFAULT 0,
  jumlah_izin INTEGER DEFAULT 0,
  jumlah_sakit INTEGER DEFAULT 0,
  jumlah_alpha INTEGER DEFAULT 0,
  jumlah_total INTEGER DEFAULT 0,
  notes TEXT,
  academic_year_id TEXT,
  semester_id TEXT,
  recorded_by TEXT,
  teacher_id TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE TABLE wali_kelas (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  academic_year_id TEXT,
  semester_id TEXT
);
INSERT INTO "wali_kelas" ("id","teacher_id","class_id","academic_year_id","semester_id") VALUES('w-1','t-33','cls-1','ay-1','sem-1');
INSERT INTO "wali_kelas" ("id","teacher_id","class_id","academic_year_id","semester_id") VALUES('w-2','t-33','cls-1','ay-1','sem-2');
INSERT INTO "wali_kelas" ("id","teacher_id","class_id","academic_year_id","semester_id") VALUES('w-3','t-29','cls-2','ay-1','sem-1');
INSERT INTO "wali_kelas" ("id","teacher_id","class_id","academic_year_id","semester_id") VALUES('w-4','t-29','cls-2','ay-1','sem-2');
INSERT INTO "wali_kelas" ("id","teacher_id","class_id","academic_year_id","semester_id") VALUES('w-5','t-12','cls-3','ay-1','sem-1');
INSERT INTO "wali_kelas" ("id","teacher_id","class_id","academic_year_id","semester_id") VALUES('w-6','t-12','cls-3','ay-1','sem-2');
INSERT INTO "wali_kelas" ("id","teacher_id","class_id","academic_year_id","semester_id") VALUES('w-7','t-27','cls-4','ay-1','sem-1');
INSERT INTO "wali_kelas" ("id","teacher_id","class_id","academic_year_id","semester_id") VALUES('w-8','t-27','cls-4','ay-1','sem-2');
INSERT INTO "wali_kelas" ("id","teacher_id","class_id","academic_year_id","semester_id") VALUES('w-9','t-4','cls-5','ay-1','sem-1');
INSERT INTO "wali_kelas" ("id","teacher_id","class_id","academic_year_id","semester_id") VALUES('w-10','t-4','cls-5','ay-1','sem-2');
INSERT INTO "wali_kelas" ("id","teacher_id","class_id","academic_year_id","semester_id") VALUES('w-11','t-29','cls-6','ay-1','sem-1');
INSERT INTO "wali_kelas" ("id","teacher_id","class_id","academic_year_id","semester_id") VALUES('w-12','t-29','cls-6','ay-1','sem-2');
INSERT INTO "wali_kelas" ("id","teacher_id","class_id","academic_year_id","semester_id") VALUES('w-13','t-25','cls-7','ay-1','sem-1');
INSERT INTO "wali_kelas" ("id","teacher_id","class_id","academic_year_id","semester_id") VALUES('w-14','t-25','cls-7','ay-1','sem-2');
CREATE TABLE nilai (
  id TEXT PRIMARY KEY,
  santri_id TEXT,
  subject_id TEXT,
  class_id TEXT,
  academic_year_id TEXT,
  semester_id TEXT,
  harian REAL DEFAULT 0,
  bulanan REAL DEFAULT 0,
  uts REAL DEFAULT 0,
  uas REAL DEFAULT 0,
  uas_lisan REAL DEFAULT 0
);
CREATE TABLE rapor_detail (
  id TEXT PRIMARY KEY,
  santri_id TEXT,
  academic_year_id TEXT,
  semester_id TEXT,
  kepribadian TEXT,
  ketahfizhan TEXT,
  ekstrakurikuler TEXT,
  ketidakhadiran TEXT,
  catatan_wali_kelas TEXT
);
CREATE TABLE activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  user_role TEXT,
  action TEXT,
  details TEXT,
  timestamp TEXT
);
CREATE TABLE pengumuman (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT,
  author_name TEXT,
  created_at TEXT
);
CREATE TABLE evaluasi_pembelajaran (
  id TEXT PRIMARY KEY,
  teacher_id TEXT,
  class_id TEXT,
  subject_id TEXT,
  academic_year_id TEXT,
  semester_id TEXT,
  bulan TEXT,
  tahun TEXT,
  capaian_materi TEXT,
  kendala TEXT,
  solusi TEXT,
  rencana_bulan_depan TEXT,
  nilai_rata_santri REAL DEFAULT 0,
  persentase_kehadiran REAL DEFAULT 0,
  created_at TEXT
);
CREATE TABLE password_reset_requests (
  id TEXT PRIMARY KEY,
  teacher_id TEXT,
  teacher_name TEXT,
  teacher_email TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TEXT,
  resolved_at TEXT
);
