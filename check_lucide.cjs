const fs = require('fs');
const path = require('path');
const lucide = require('lucide-react');

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Match all import { ... } from 'lucide-react'
      const regex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const imports = match[1].split(',').map(i => i.trim().split(' as ')[0].trim()).filter(i => i);
        imports.forEach(i => {
          if (!lucide[i]) {
            console.log('MISSING:', i, 'in', fullPath);
          }
        });
      }
    }
  });
}

walk('src');
console.log('Done checking lucide icons.');
