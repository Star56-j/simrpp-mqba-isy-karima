const fs = require('fs');
let code = fs.readFileSync('src/components/LoginScreen.tsx', 'utf8');
code = code.replace(/dark:[^\s"']+/g, '');
fs.writeFileSync('src/components/LoginScreen.tsx', code);
