const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf-8').split('\n');
const targets = ['function AuthModal', 'function InfoDocsModal', 'function ImageLightboxModal', 'function AdCard'];

for (const target of targets) {
  let start = -1;
  let end = -1;
  let braceCount = 0;
  let inFunction = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!inFunction && line.startsWith(target)) {
      start = i;
      inFunction = true;
    }
    
    if (inFunction) {
      // count braces
      for (const char of line) {
        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
      }
      
      if (braceCount === 0) {
        end = i;
        console.log(`${target} found from line ${start + 1} to ${end + 1}`);
        inFunction = false;
        break; // found this target, move to next? actually, what if it's not the end? 
        // wait, if braceCount == 0, and we started a block, it's the end.
      }
    }
  }
}
