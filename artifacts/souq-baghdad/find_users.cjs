const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const start = content.indexOf('tab === \'users\'');
if (start > -1) {
  console.log(content.substring(start, start + 3000));
}
