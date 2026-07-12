const fs = require('fs');

const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace slugify 
content = content.replace(/[ \t]*const slugify = \(text: string\) => \{[\s\S]*?\};[ \t]*\n/g, '');

fs.writeFileSync(path, content);
console.log('Helpers removed and imports added');
