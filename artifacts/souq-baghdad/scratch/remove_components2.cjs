const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '../src/App.tsx');
let content = fs.readFileSync(appPath, 'utf-8');

const components = ['TimeAgo', 'AdCard', 'ProductCard', 'TransportAdCard'];

let modified = false;

for (const comp of components) {
  const match = content.match(new RegExp(`^function ${comp}\\b`, 'm'));
  
  if (match) {
    const startIdx = match.index;
    
    let openBraces = 0;
    let i = startIdx;
    let started = false;
    
    while (i < content.length) {
      if (content[i] === '{') {
        openBraces++;
        started = true;
      } else if (content[i] === '}') {
        openBraces--;
      }
      
      if (started && openBraces === 0) {
        break;
      }
      i++;
    }
    
    const endIdx = i + 1;
    
    let actualStart = startIdx;
    while (actualStart > 0 && content.substring(actualStart - 50, actualStart).includes('// ─')) {
      actualStart = content.lastIndexOf('// ─', actualStart) - 1;
      if (actualStart < 0) actualStart = 0;
    }
    // ensure actualStart is not too far
    if (startIdx - actualStart > 200) {
      actualStart = startIdx;
    }

    content = content.substring(0, startIdx) + content.substring(endIdx);
    console.log(`Removed ${comp}`);
    modified = true;
  }
}

if (modified) {
  fs.writeFileSync(appPath, content, 'utf-8');
  console.log("Successfully removed components.");
} else {
  console.log("No components were removed.");
}
