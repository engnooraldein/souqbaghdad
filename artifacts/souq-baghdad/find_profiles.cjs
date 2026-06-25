const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const start = content.indexOf('contentTab');
if (start > -1) {
  const parts = content.split('contentTab');
  for (let i = 0; i < Math.min(10, parts.length); i++) {
    const s = parts[i];
    if (s.includes('profiles')) {
       console.log('---MATCH---');
       console.log(s.substring(0, 1500));
    }
  }
}
