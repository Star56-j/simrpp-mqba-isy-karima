import fs from 'fs';

const teachers = [
  { id: 'teacher-24', name: 'Usth. Hasri Haryani Direja, S.Ds', shortName: 'hasri' },
  { id: 'teacher-23', name: 'Usth. Azizah Nur Aini, S.Pd., Gr', shortName: 'azizah' },
  { id: 'teacher-20', name: 'Usth. Rifanisa Nurulfitria, S.Hum., M.Si.', shortName: 'rifanisa' },
  { id: 'teacher-28', name: 'Ust. Rezkidar', shortName: 'rezkidar' },
  { id: 'teacher-26', name: 'Ust. Akmal Firmana, ST', shortName: 'akmal' },
  { id: 'teacher-21', name: 'Ust. Azri Robani Indra Robbi, S.Ag.', shortName: 'azri' }
];

let sql = '';
teachers.forEach(t => {
  const id = `user-${crypto.randomUUID()}`;
  const email = `wali.${t.shortName}@isykarima.com`;
  sql += `INSERT INTO users (id, name, email, passwordHash, role, teacher_id) VALUES ('${id}', '${t.name}', '${email}', 'parabek123', 'WaliKelas', '${t.id}');\n`;
});

fs.writeFileSync('generate_wali_users.sql', sql);
console.log('SQL generated!');
