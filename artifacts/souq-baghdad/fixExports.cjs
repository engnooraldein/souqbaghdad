const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Instead of rewriting 24 files, just re-export handleUniversalShare from App.tsx
if (!content.includes("export { handleUniversalShare } from './hooks/useAppInteractions';")) {
  content = content + "\nexport { handleUniversalShare } from './hooks/useAppInteractions';\n";
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed export!');
