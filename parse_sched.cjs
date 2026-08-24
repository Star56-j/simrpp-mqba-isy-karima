const fs = require('fs');

const rawData = [
// SABTU
{ day: 'Sabtu', startTime: '10:00', endTime: '10:45', class: 1, subject: 'Khot', teacher: 'Ust. Abdul Malik' },
{ day: 'Sabtu', startTime: '10:00', endTime: '10:45', class: 2, subject: 'Aqidah', teacher: 'Ust. Umar' },
{ day: 'Sabtu', startTime: '10:00', endTime: '10:45', class: 3, subject: 'Bhs. Inggris', teacher: 'Ust. Dzulfikar' },
{ day: 'Sabtu', startTime: '10:00', endTime: '10:45', class: 4, subject: 'Fiqih', teacher: 'Ust. Karim' },
{ day: 'Sabtu', startTime: '10:00', endTime: '10:45', class: 5, subject: 'ABY', teacher: 'Ust. Fredy' },
{ day: 'Sabtu', startTime: '10:00', endTime: '10:45', class: 6, subject: 'ABY', teacher: 'Ust. Abdullah' },
{ day: 'Sabtu', startTime: '10:00', endTime: '10:45', class: 7, subject: 'ABY', teacher: 'Usth.Anim' },
{ day: 'Sabtu', startTime: '10:45', endTime: '11:30', class: 1, subject: 'Khot', teacher: 'Ust. Abdul Malik' },
{ day: 'Sabtu', startTime: '10:45', endTime: '11:30', class: 2, subject: 'Aqidah', teacher: 'Ust. Umar' },
{ day: 'Sabtu', startTime: '10:45', endTime: '11:30', class: 3, subject: 'Bhs. Inggris', teacher: 'Ust. Dzulfikar' },
{ day: 'Sabtu', startTime: '10:45', endTime: '11:30', class: 4, subject: 'Fiqih', teacher: 'Ust. Karim' },
{ day: 'Sabtu', startTime: '10:45', endTime: '11:30', class: 5, subject: 'ABY', teacher: 'Ust. Fredy' },
{ day: 'Sabtu', startTime: '10:45', endTime: '11:30', class: 6, subject: 'ABY', teacher: 'Ust. Abdullah' },
{ day: 'Sabtu', startTime: '10:45', endTime: '11:30', class: 7, subject: 'ABY', teacher: 'Usth.Anim' },
{ day: 'Sabtu', startTime: '12:30', endTime: '13:00', class: 1, subject: 'Matematika', teacher: 'Ust. Agib' },
{ day: 'Sabtu', startTime: '12:30', endTime: '13:00', class: 2, subject: 'Khot', teacher: 'Ust. Abdul Malik' },
{ day: 'Sabtu', startTime: '12:30', endTime: '13:00', class: 3, subject: 'ABY', teacher: 'Ust. Fredy' },
{ day: 'Sabtu', startTime: '12:30', endTime: '13:00', class: 4, subject: 'ABY', teacher: 'Usth.Iffah' },
{ day: 'Sabtu', startTime: '12:30', endTime: '13:00', class: 5, subject: 'Bhs. Inggris', teacher: 'Ust. Dzulfikar' },
{ day: 'Sabtu', startTime: '12:30', endTime: '13:00', class: 6, subject: 'ABY', teacher: 'Ust. Abdullah' },
{ day: 'Sabtu', startTime: '13:00', endTime: '13:30', class: 1, subject: 'Matematika', teacher: 'Ust. Agib' },
{ day: 'Sabtu', startTime: '13:00', endTime: '13:30', class: 2, subject: 'Khot', teacher: 'Ust. Abdul Malik' },
{ day: 'Sabtu', startTime: '13:00', endTime: '13:30', class: 3, subject: 'ABY', teacher: 'Ust. Fredy' },
{ day: 'Sabtu', startTime: '13:00', endTime: '13:30', class: 4, subject: 'ABY', teacher: 'Usth.Iffah' },
{ day: 'Sabtu', startTime: '13:00', endTime: '13:30', class: 5, subject: 'Bhs. Inggris', teacher: 'Ust. Dzulfikar' },
{ day: 'Sabtu', startTime: '13:00', endTime: '13:30', class: 6, subject: 'ABY', teacher: 'Ust. Abdullah' },

// AHAD
{ day: 'Minggu', startTime: '10:00', endTime: '10:45', class: 1, subject: 'Tajwid', teacher: 'Ust. Yunan' },
{ day: 'Minggu', startTime: '10:00', endTime: '10:45', class: 2, subject: 'ABY', teacher: 'Usth.Iffah' },
{ day: 'Minggu', startTime: '10:00', endTime: '10:45', class: 3, subject: 'Aqidah', teacher: 'Ust. Faqih' },
{ day: 'Minggu', startTime: '10:00', endTime: '10:45', class: 4, subject: 'Bhs. Inggris', teacher: 'Usth. Indri' },
{ day: 'Minggu', startTime: '10:00', endTime: '10:45', class: 5, subject: 'ABY', teacher: 'Ust. Fredy' },
{ day: 'Minggu', startTime: '10:00', endTime: '10:45', class: 6, subject: 'Tajwid', teacher: 'Ust. Yunan' },
{ day: 'Minggu', startTime: '10:00', endTime: '10:45', class: 7, subject: 'ABY', teacher: 'Usth.Anim' },
{ day: 'Minggu', startTime: '10:45', endTime: '11:30', class: 1, subject: 'Tajwid', teacher: 'Ust. Yunan' },
{ day: 'Minggu', startTime: '10:45', endTime: '11:30', class: 2, subject: 'ABY', teacher: 'Usth.Iffah' },
{ day: 'Minggu', startTime: '10:45', endTime: '11:30', class: 3, subject: 'Aqidah', teacher: 'Ust. Faqih' },
{ day: 'Minggu', startTime: '10:45', endTime: '11:30', class: 4, subject: 'Bhs. Inggris', teacher: 'Usth. Indri' },
{ day: 'Minggu', startTime: '10:45', endTime: '11:30', class: 5, subject: 'ABY', teacher: 'Ust. Fredy' },
{ day: 'Minggu', startTime: '10:45', endTime: '11:30', class: 6, subject: 'Tajwid', teacher: 'Ust. Yunan' },
{ day: 'Minggu', startTime: '10:45', endTime: '11:30', class: 7, subject: 'ABY', teacher: 'Usth.Anim' },
{ day: 'Minggu', startTime: '12:30', endTime: '13:00', class: 1, subject: 'Akhlaq', teacher: 'Ust. Aidil' },
{ day: 'Minggu', startTime: '12:30', endTime: '13:00', class: 2, subject: 'Tahsin', teacher: 'Usth. Saiba Musyaiya' },
{ day: 'Minggu', startTime: '12:30', endTime: '13:00', class: 3, subject: 'Tilawah', teacher: 'Ust. Yunan' },
{ day: 'Minggu', startTime: '12:30', endTime: '13:00', class: 4, subject: 'Tahsin', teacher: 'Usth. Saiba Musyaiya' },
{ day: 'Minggu', startTime: '12:30', endTime: '13:00', class: 5, subject: 'Tahsin', teacher: 'Ust. Arya' },
{ day: 'Minggu', startTime: '12:30', endTime: '13:00', class: 6, subject: 'Tahsin', teacher: 'Ust. Arya' },
{ day: 'Minggu', startTime: '12:30', endTime: '13:00', class: 7, subject: 'Tahsin', teacher: 'Usth. Saiba Musyaiya' },
{ day: 'Minggu', startTime: '13:00', endTime: '13:30', class: 1, subject: 'Akhlaq', teacher: 'Ust. Aidil' },
{ day: 'Minggu', startTime: '13:00', endTime: '13:30', class: 2, subject: 'Tahsin', teacher: 'Usth. Saiba Musyaiya' },
{ day: 'Minggu', startTime: '13:00', endTime: '13:30', class: 3, subject: 'Tilawah', teacher: 'Ust. Yunan' },
{ day: 'Minggu', startTime: '13:00', endTime: '13:30', class: 4, subject: 'Tahsin', teacher: 'Usth. Saiba Musyaiya' },
{ day: 'Minggu', startTime: '13:00', endTime: '13:30', class: 5, subject: 'Tahsin', teacher: 'Ust. Arya' },
{ day: 'Minggu', startTime: '13:00', endTime: '13:30', class: 6, subject: 'Tahsin', teacher: 'Ust. Arya' },
{ day: 'Minggu', startTime: '13:00', endTime: '13:30', class: 7, subject: 'Tahsin', teacher: 'Usth. Saiba Musyaiya' },

// SENIN
{ day: 'Senin', startTime: '10:00', endTime: '10:45', class: 1, subject: 'Aqidah', teacher: 'Ust. Faqih' },
{ day: 'Senin', startTime: '10:00', endTime: '10:45', class: 2, subject: 'ABY', teacher: 'Usth.Iffah' },
{ day: 'Senin', startTime: '10:00', endTime: '10:45', class: 3, subject: 'Tahsin', teacher: 'Ust. Kholif' },
{ day: 'Senin', startTime: '10:00', endTime: '10:45', class: 4, subject: 'Matematika', teacher: 'Usth. Bela' },
{ day: 'Senin', startTime: '10:00', endTime: '10:45', class: 5, subject: 'Fiqih', teacher: 'Ust. Farhan' },
{ day: 'Senin', startTime: '10:00', endTime: '10:45', class: 6, subject: 'ABY', teacher: 'Ust. Abdullah' },
{ day: 'Senin', startTime: '10:00', endTime: '10:45', class: 7, subject: 'ABY', teacher: 'Usth.Anim' },
{ day: 'Senin', startTime: '10:45', endTime: '11:30', class: 1, subject: 'Aqidah', teacher: 'Ust. Faqih' },
{ day: 'Senin', startTime: '10:45', endTime: '11:30', class: 2, subject: 'ABY', teacher: 'Usth.Iffah' },
{ day: 'Senin', startTime: '10:45', endTime: '11:30', class: 3, subject: 'Tahsin', teacher: 'Ust. Kholif' },
{ day: 'Senin', startTime: '10:45', endTime: '11:30', class: 4, subject: 'Matematika', teacher: 'Usth. Bela' },
{ day: 'Senin', startTime: '10:45', endTime: '11:30', class: 5, subject: 'Fiqih', teacher: 'Ust. Farhan' },
{ day: 'Senin', startTime: '10:45', endTime: '11:30', class: 6, subject: 'ABY', teacher: 'Ust. Abdullah' },
{ day: 'Senin', startTime: '10:45', endTime: '11:30', class: 7, subject: 'ABY', teacher: 'Usth.Anim' },
{ day: 'Senin', startTime: '12:30', endTime: '13:00', class: 1, subject: 'ABY', teacher: 'Ust. Abdullah' },
{ day: 'Senin', startTime: '12:30', endTime: '13:00', class: 2, subject: 'Tahsin', teacher: 'Usth. Saiba Musyaiya' },
{ day: 'Senin', startTime: '12:30', endTime: '13:00', class: 3, subject: 'Siroh', teacher: 'Ust. Tubagus' },
{ day: 'Senin', startTime: '12:30', endTime: '13:00', class: 4, subject: 'ABY', teacher: 'Usth.Iffah' },
{ day: 'Senin', startTime: '12:30', endTime: '13:00', class: 5, subject: 'IPA', teacher: 'Ust. Hafizh' },
{ day: 'Senin', startTime: '12:30', endTime: '13:00', class: 6, subject: 'Tahsin', teacher: 'Ust. Arya' },
{ day: 'Senin', startTime: '12:30', endTime: '13:00', class: 7, subject: 'Tahsin', teacher: 'Usth. Saiba Musyaiya' },
{ day: 'Senin', startTime: '13:00', endTime: '13:30', class: 1, subject: 'ABY', teacher: 'Ust. Abdullah' },
{ day: 'Senin', startTime: '13:00', endTime: '13:30', class: 2, subject: 'Tahsin', teacher: 'Usth. Saiba Musyaiya' },
{ day: 'Senin', startTime: '13:00', endTime: '13:30', class: 3, subject: 'Siroh', teacher: 'Ust. Tubagus' },
{ day: 'Senin', startTime: '13:00', endTime: '13:30', class: 4, subject: 'ABY', teacher: 'Usth.Iffah' },
{ day: 'Senin', startTime: '13:00', endTime: '13:30', class: 5, subject: 'IPA', teacher: 'Ust. Hafizh' },
{ day: 'Senin', startTime: '13:00', endTime: '13:30', class: 6, subject: 'Tahsin', teacher: 'Ust. Arya' },
{ day: 'Senin', startTime: '13:00', endTime: '13:30', class: 7, subject: 'Tahsin', teacher: 'Usth. Saiba Musyaiya' },

// SELASA
{ day: 'Selasa', startTime: '10:00', endTime: '10:45', class: 1, subject: 'ABY', teacher: 'Ust. Abdullah' },
{ day: 'Selasa', startTime: '10:00', endTime: '10:45', class: 2, subject: 'ABY', teacher: 'Usth.Iffah' },
{ day: 'Selasa', startTime: '10:00', endTime: '10:45', class: 5, subject: 'Siroh', teacher: 'Usth. Fani' },
{ day: 'Selasa', startTime: '10:00', endTime: '10:45', class: 6, subject: 'ABY', teacher: 'Ust. Fredy' },
{ day: 'Selasa', startTime: '10:00', endTime: '10:45', class: 7, subject: 'ABY', teacher: 'Ust. Abdullah' },
{ day: 'Selasa', startTime: '10:45', endTime: '11:30', class: 1, subject: 'ABY', teacher: 'Ust. Abdullah' },
{ day: 'Selasa', startTime: '10:45', endTime: '11:30', class: 2, subject: 'ABY', teacher: 'Usth.Iffah' },
{ day: 'Selasa', startTime: '10:45', endTime: '11:30', class: 5, subject: 'Siroh', teacher: 'Usth. Fani' },
{ day: 'Selasa', startTime: '10:45', endTime: '11:30', class: 6, subject: 'ABY', teacher: 'Ust. Fredy' },
{ day: 'Selasa', startTime: '10:45', endTime: '11:30', class: 7, subject: 'ABY', teacher: 'Ust. Abdullah' },
{ day: 'Selasa', startTime: '12:30', endTime: '13:00', class: 1, subject: 'Tahsin', teacher: 'Ust. Azri' },
{ day: 'Selasa', startTime: '12:30', endTime: '13:00', class: 2, subject: 'Tajwid', teacher: 'Usth. Dila' },
{ day: 'Selasa', startTime: '12:30', endTime: '13:00', class: 3, subject: 'IPA', teacher: 'Ust. Hafizh' },
{ day: 'Selasa', startTime: '12:30', endTime: '13:00', class: 4, subject: 'IPA', teacher: 'Usth. Azizah' },
{ day: 'Selasa', startTime: '12:30', endTime: '13:00', class: 5, subject: 'Bhs. Indonesia', teacher: 'Ust. Aidil' },
{ day: 'Selasa', startTime: '12:30', endTime: '13:00', class: 7, subject: 'Tajwid', teacher: 'Usth. Dila' },
{ day: 'Selasa', startTime: '13:00', endTime: '13:30', class: 1, subject: 'Tahsin', teacher: 'Ust. Azri' },
{ day: 'Selasa', startTime: '13:00', endTime: '13:30', class: 2, subject: 'Tajwid', teacher: 'Usth. Dila' },
{ day: 'Selasa', startTime: '13:00', endTime: '13:30', class: 3, subject: 'IPA', teacher: 'Ust. Hafizh' },
{ day: 'Selasa', startTime: '13:00', endTime: '13:30', class: 4, subject: 'IPA', teacher: 'Usth. Azizah' },
{ day: 'Selasa', startTime: '13:00', endTime: '13:30', class: 5, subject: 'Bhs. Indonesia', teacher: 'Ust. Aidil' },
{ day: 'Selasa', startTime: '13:00', endTime: '13:30', class: 7, subject: 'Tajwid', teacher: 'Usth. Dila' },

// RABU
{ day: 'Rabu', startTime: '10:00', endTime: '10:45', class: 1, subject: 'ABY', teacher: 'Ust. Abdullah' },
{ day: 'Rabu', startTime: '10:00', endTime: '10:45', class: 2, subject: 'Tahsin', teacher: 'Usth. Saiba Musyaiya' },
{ day: 'Rabu', startTime: '10:00', endTime: '10:45', class: 3, subject: 'ABY', teacher: 'Ust. Fredy' },
{ day: 'Rabu', startTime: '10:00', endTime: '10:45', class: 4, subject: 'Tahsin', teacher: 'Usth. Saiba Musyaiya' },
{ day: 'Rabu', startTime: '10:00', endTime: '10:45', class: 5, subject: 'Tahsin', teacher: 'Ust. Arya' },
{ day: 'Rabu', startTime: '10:00', endTime: '10:45', class: 6, subject: 'ABY', teacher: 'Ust. Abdullah' },
{ day: 'Rabu', startTime: '10:00', endTime: '10:45', class: 7, subject: 'Tahsin', teacher: 'Usth. Saiba Musyaiya' },
{ day: 'Rabu', startTime: '10:45', endTime: '11:30', class: 1, subject: 'ABY', teacher: 'Ust. Abdullah' },
{ day: 'Rabu', startTime: '10:45', endTime: '11:30', class: 2, subject: 'Tahsin', teacher: 'Usth. Saiba Musyaiya' },
{ day: 'Rabu', startTime: '10:45', endTime: '11:30', class: 3, subject: 'ABY', teacher: 'Ust. Fredy' },
{ day: 'Rabu', startTime: '10:45', endTime: '11:30', class: 4, subject: 'Tahsin', teacher: 'Usth. Saiba Musyaiya' },
{ day: 'Rabu', startTime: '10:45', endTime: '11:30', class: 5, subject: 'Tahsin', teacher: 'Ust. Arya' },
{ day: 'Rabu', startTime: '10:45', endTime: '11:30', class: 6, subject: 'ABY', teacher: 'Ust. Abdullah' },
{ day: 'Rabu', startTime: '10:45', endTime: '11:30', class: 7, subject: 'Tahsin', teacher: 'Usth. Saiba Musyaiya' },
{ day: 'Rabu', startTime: '12:30', endTime: '13:00', class: 1, subject: 'ABY', teacher: 'Ust. Abdullah' },
{ day: 'Rabu', startTime: '12:30', endTime: '13:00', class: 2, subject: 'Tajwid', teacher: 'Usth. Dila' },
{ day: 'Rabu', startTime: '12:30', endTime: '13:00', class: 3, subject: 'Tahsin', teacher: 'Ust. Kholif' },
{ day: 'Rabu', startTime: '12:30', endTime: '13:00', class: 4, subject: 'ABY', teacher: 'Usth.Iffah' },
{ day: 'Rabu', startTime: '12:30', endTime: '13:00', class: 5, subject: 'Siroh', teacher: 'Ust. Tubagus' },
{ day: 'Rabu', startTime: '12:30', endTime: '13:00', class: 6, subject: 'ABY', teacher: 'Ust. Abdullah' },
{ day: 'Rabu', startTime: '12:30', endTime: '13:00', class: 7, subject: 'Tajwid', teacher: 'Usth. Dila' },
{ day: 'Rabu', startTime: '13:00', endTime: '13:30', class: 1, subject: 'ABY', teacher: 'Ust. Abdullah' },
{ day: 'Rabu', startTime: '13:00', endTime: '13:30', class: 2, subject: 'Tajwid', teacher: 'Usth. Dila' },
{ day: 'Rabu', startTime: '13:00', endTime: '13:30', class: 3, subject: 'Tahsin', teacher: 'Ust. Kholif' },
{ day: 'Rabu', startTime: '13:00', endTime: '13:30', class: 4, subject: 'ABY', teacher: 'Usth.Iffah' },
{ day: 'Rabu', startTime: '13:00', endTime: '13:30', class: 5, subject: 'Siroh', teacher: 'Ust. Tubagus' },
{ day: 'Rabu', startTime: '13:00', endTime: '13:30', class: 6, subject: 'ABY', teacher: 'Ust. Abdullah' },
{ day: 'Rabu', startTime: '13:00', endTime: '13:30', class: 7, subject: 'Tajwid', teacher: 'Usth. Dila' },

// KAMIS
{ day: 'Kamis', startTime: '10:00', endTime: '10:45', class: 1, subject: 'Tahsin', teacher: 'Ust. Azri' },
{ day: 'Kamis', startTime: '10:00', endTime: '10:45', class: 2, subject: 'Matematika', teacher: 'Usth. Hasri' },
{ day: 'Kamis', startTime: '10:00', endTime: '10:45', class: 3, subject: 'Matematika', teacher: 'Ust. Latief' },
{ day: 'Kamis', startTime: '10:00', endTime: '10:45', class: 4, subject: 'Aqidah', teacher: 'Ust. Umar' },
{ day: 'Kamis', startTime: '10:00', endTime: '10:45', class: 5, subject: 'Matematika', teacher: 'Ust. Akmal' },
{ day: 'Kamis', startTime: '10:00', endTime: '10:45', class: 6, subject: 'Tahsin', teacher: 'Ust. Azri' },
{ day: 'Kamis', startTime: '10:00', endTime: '10:45', class: 7, subject: 'ABY', teacher: 'Usth.Anim' },
{ day: 'Kamis', startTime: '10:45', endTime: '11:30', class: 1, subject: 'Tahsin', teacher: 'Ust. Azri' },
{ day: 'Kamis', startTime: '10:45', endTime: '11:30', class: 2, subject: 'Matematika', teacher: 'Usth. Hasri' },
{ day: 'Kamis', startTime: '10:45', endTime: '11:30', class: 3, subject: 'Matematika', teacher: 'Ust. Latief' },
{ day: 'Kamis', startTime: '10:45', endTime: '11:30', class: 4, subject: 'Aqidah', teacher: 'Ust. Umar' },
{ day: 'Kamis', startTime: '10:45', endTime: '11:30', class: 5, subject: 'Matematika', teacher: 'Ust. Akmal' },
{ day: 'Kamis', startTime: '10:45', endTime: '11:30', class: 6, subject: 'Tahsin', teacher: 'Ust. Azri' },
{ day: 'Kamis', startTime: '10:45', endTime: '11:30', class: 7, subject: 'ABY', teacher: 'Usth.Anim' },
{ day: 'Kamis', startTime: '12:30', endTime: '13:00', class: 1, subject: 'Tahsin', teacher: 'Ust. Azri' },
{ day: 'Kamis', startTime: '12:30', endTime: '13:00', class: 2, subject: 'Akhlaq', teacher: 'Usth. Lina' },
{ day: 'Kamis', startTime: '12:30', endTime: '13:00', class: 3, subject: 'Fiqih', teacher: 'Ust. Rezkidar' },
{ day: 'Kamis', startTime: '12:30', endTime: '13:00', class: 4, subject: 'ABY', teacher: 'Usth.Iffah' },
{ day: 'Kamis', startTime: '12:30', endTime: '13:00', class: 5, subject: 'Adab', teacher: 'Ust. Karim' },
{ day: 'Kamis', startTime: '13:00', endTime: '13:30', class: 1, subject: 'Tahsin', teacher: 'Ust. Azri' },
{ day: 'Kamis', startTime: '13:00', endTime: '13:30', class: 2, subject: 'Akhlaq', teacher: 'Usth. Lina' },
{ day: 'Kamis', startTime: '13:00', endTime: '13:30', class: 3, subject: 'Fiqih', teacher: 'Ust. Rezkidar' },
{ day: 'Kamis', startTime: '13:00', endTime: '13:30', class: 4, subject: 'ABY', teacher: 'Usth.Iffah' },
{ day: 'Kamis', startTime: '13:00', endTime: '13:30', class: 5, subject: 'Adab', teacher: 'Ust. Karim' },
];

async function main() {
  const [teachers, subjects, classes, academicYears, semesters] = await Promise.all([
    fetch('https://akademikmqbaisykarima.pages.dev/api/teachers').then(r=>r.json()),
    fetch('https://akademikmqbaisykarima.pages.dev/api/subjects').then(r=>r.json()),
    fetch('https://akademikmqbaisykarima.pages.dev/api/classes').then(r=>r.json()),
    fetch('https://akademikmqbaisykarima.pages.dev/api/academic_years').then(r=>r.json()),
    fetch('https://akademikmqbaisykarima.pages.dev/api/semesters').then(r=>r.json()),
  ]);

  const teacherMap = {};
  for (const t of teachers) {
    const norm = t.name.toLowerCase().replace(/ustadzah|ustadz|ust\.|usth\.|[^\w]/g, '').trim();
    teacherMap[norm] = t.id;
  }
  
  const resolveTeacher = (name) => {
    const norm = name.toLowerCase().replace(/ustadzah|ustadz|ust\.|usth\.|[^\w]/g, '').trim();
    if (norm.includes('abdulmalik')) return teachers.find(t=>t.name.includes('Abdul Malik')).id;
    if (norm.includes('umar')) return teachers.find(t=>t.name.includes('Umar')).id;
    if (norm.includes('dzulfikar')) return teachers.find(t=>t.name.includes('Dzulfikar')).id;
    if (norm.includes('karim')) return teachers.find(t=>t.name.includes('Karim')).id;
    if (norm.includes('fredy')) return teachers.find(t=>t.name.includes('Fredy')).id;
    if (norm.includes('abdullah')) return teachers.find(t=>t.name.includes('Abdullah')).id;
    if (norm.includes('anim')) return teachers.find(t=>t.name.includes('Anim')).id;
    if (norm.includes('agib') || norm.includes('aqib')) return teachers.find(t=>t.name.includes('Aqib')).id;
    if (norm.includes('iffah')) return teachers.find(t=>t.name.includes('Iffah')).id;
    if (norm.includes('yunan')) return teachers.find(t=>t.name.includes('Yunan')).id;
    if (norm.includes('faqih')) return teachers.find(t=>t.name.includes('Faqih')).id;
    if (norm.includes('indri')) return teachers.find(t=>t.name.includes('Indri')).id;
    if (norm.includes('aidil')) return teachers.find(t=>t.name.includes('Aidil')).id;
    if (norm.includes('saiba')) return teachers.find(t=>t.name.includes('Saiba')).id;
    if (norm.includes('arya')) return teachers.find(t=>t.name.includes('Arya')).id;
    if (norm.includes('kholif')) return teachers.find(t=>t.name.includes('Kholif')).id;
    if (norm.includes('bela')) return teachers.find(t=>t.name.includes('Bela')).id;
    if (norm.includes('farhan')) return teachers.find(t=>t.name.includes('Farhan')).id;
    if (norm.includes('tubagus')) return teachers.find(t=>t.name.includes('Tubagus')).id;
    if (norm.includes('hafizh') && !norm.includes('abdul')) return teachers.find(t=>t.name.includes('Hafizh')).id;
    if (norm.includes('fani')) return teachers.find(t=>t.name.includes('Rifanisa') || t.name.includes('Fani')).id;
    if (norm.includes('azri')) return teachers.find(t=>t.name.includes('Azri')).id;
    if (norm.includes('dila')) return teachers.find(t=>t.name.includes('Dila')).id;
    if (norm.includes('azizah')) return teachers.find(t=>t.name.includes('Azizah')).id;
    if (norm.includes('hasri')) return teachers.find(t=>t.name.includes('Hasri')).id;
    if (norm.includes('latief')) return teachers.find(t=>t.name.includes('Latief')).id;
    if (norm.includes('akmal')) return teachers.find(t=>t.name.includes('Akmal')).id;
    if (norm.includes('lina')) return teachers.find(t=>t.name.includes('Lina')).id;
    if (norm.includes('rezkidar')) return teachers.find(t=>t.name.includes('Rezkidar')).id;
    return teacherMap[norm] || null;
  };

  const resolveSubject = (name) => {
    const norm = name.toLowerCase();
    if (norm.includes('aby')) return subjects.find(s=>s.name.includes('Arab')).id;
    if (norm.includes('khot') || norm.includes('tulis')) return subjects.find(s=>s.name.includes('Khot')).id;
    if (norm.includes('aqidah')) return subjects.find(s=>s.name.includes('Aqidah')).id;
    if (norm.includes('inggris')) return subjects.find(s=>s.name.includes('Inggris'))?.id || subjects[0].id;
    if (norm.includes('fiqih')) return subjects.find(s=>s.name.includes('Fiqih')).id;
    if (norm.includes('matematika')) return subjects.find(s=>s.name.includes('Matematika')).id;
    if (norm.includes('tajwid') || norm.includes('tahsin') || norm.includes('tilawah')) return subjects.find(s=>s.name.includes('Tahsin'))?.id || subjects[0].id;
    if (norm.includes('akhlaq') || norm.includes('adab')) return subjects.find(s=>s.name.includes('Akhlaq'))?.id || subjects[0].id;
    if (norm.includes('ipa')) return subjects.find(s=>s.name.includes('IPA'))?.id || subjects[0].id;
    if (norm.includes('indonesia')) return subjects.find(s=>s.name.includes('Indonesia'))?.id || subjects[0].id;
    if (norm.includes('siroh')) return subjects.find(s=>s.name.includes('Tarikh'))?.id || subjects[0].id;
    return subjects[0].id;
  };

  const currentAy = { id: 'ay-2' }; // 2024/2025
  const currentSem = { id: 'sem-1' }; // Ganjil
  
  if (!currentAy || !currentSem) {
    console.error('No active academic year or semester found');
    return;
  }

  const payload = rawData.map(r => ({
    classId: 'cls-' + r.class,
    teacherId: resolveTeacher(r.teacher),
    subjectId: resolveSubject(r.subject),
    day: r.day,
    startTime: r.startTime,
    endTime: r.endTime,
    academicYearId: currentAy.id,
    semesterId: currentSem.id
  }));

  const failed = payload.filter(p => !p.teacherId || !p.subjectId || !p.classId);
  if (failed.length > 0) {
    console.error('Failed to resolve:', failed);
    return;
  }

  // delete all existing schedules first (if any)
  const existing = await fetch('https://akademikmqbaisykarima.pages.dev/api/schedules').then(r=>r.json());
  for (const s of existing) {
    await fetch('https://akademikmqbaisykarima.pages.dev/api/schedules/' + s.id, { method: 'DELETE' });
  }

  let count = 0;
  for (const p of payload) {
    await fetch('https://akademikmqbaisykarima.pages.dev/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    });
    count++;
    if (count % 10 === 0) console.log('Inserted ' + count + '/' + payload.length);
  }
  
  console.log('Successfully inserted', count, 'schedules!');
}
main();
