const fs = require('fs');
let code = fs.readFileSync('functions/api/[[route]].ts', 'utf8');

const santriRoute = `app.get('/santri', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(\`
      SELECT s.*, c.name as className
      FROM santri s
      LEFT JOIN classes c ON s.class_id = c.id
      ORDER BY s.id DESC
    \`).all();
    
    const mapped = results.map((r: any) => ({
       id: r.id,
       nis: r.nis,
       name: r.name,
       classId: r.class_id,
       gender: r.gender,
       birthDate: r.birth_date,
       address: r.address,
       waliName: r.wali_name,
       waliPhone: r.wali_phone,
       class: r.className ? { id: r.class_id, name: r.className } : undefined
    }));
    return c.json(mapped);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});
`;

code = code.replace(santriRoute, '');
code = code.replace('// --- GENERIC CRUD ---', '// --- GENERIC CRUD ---\n\n' + santriRoute + '\n');
fs.writeFileSync('functions/api/[[route]].ts', code);
console.log('Fixed route');
