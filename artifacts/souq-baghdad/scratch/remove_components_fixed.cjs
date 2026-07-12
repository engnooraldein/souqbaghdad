const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '../src/App.tsx');
let content = fs.readFileSync(appPath, 'utf-8');

function findFunctionEnd(str, startIdx) {
  let openBraces = 0;
  let inString = false;
  let stringChar = '';
  let inComment = false;
  
  // startIdx should point to the opening '{' of the function body
  let i = startIdx;
  openBraces = 1;
  i++;
  
  while (i < str.length && openBraces > 0) {
    const char = str[i];
    
    if (!inString && !inComment) {
      if (char === '{') openBraces++;
      else if (char === '}') openBraces--;
      else if (char === '"' || char === "'" || char === '`') {
        inString = true;
        stringChar = char;
      }
      else if (char === '/' && str[i+1] === '/') {
        inComment = true;
        i++;
      }
    } else if (inString) {
      if (char === stringChar && str[i-1] !== '\\') inString = false;
    } else if (inComment) {
      if (char === '\n') inComment = false;
    }
    
    i++;
  }
  
  return i;
}

const components = [
  { name: 'TimeAgo', search: 'function TimeAgo(' },
  { name: 'SkeletonCard', search: 'function SkeletonCard(' },
  { name: 'AdCard', search: 'function AdCard(' },
  { name: 'ProductCard', search: 'function ProductCard(' },
  { name: 'TransportAdCard', search: 'function TransportAdCard(' }
];

let modified = false;

for (const comp of components) {
  const funcIdx = content.indexOf(comp.search);
  if (funcIdx !== -1) {
    // Find the body '{' by balancing parentheses first?
    // Actually, just find the ')' that closes the arguments, then the next '{'
    let i = funcIdx + comp.search.length;
    let openParens = 1;
    while (i < content.length && openParens > 0) {
      if (content[i] === '(') openParens++;
      else if (content[i] === ')') openParens--;
      i++;
    }
    
    // Now find the opening '{' for the function body
    while (i < content.length && content[i] !== '{') {
      i++;
    }
    
    if (i < content.length) {
      const endIdx = findFunctionEnd(content, i);
      
      let actualStart = funcIdx;
      // Also remove preceding export if present
      const exportStr = 'export ';
      if (content.substring(actualStart - exportStr.length, actualStart) === exportStr) {
        actualStart -= exportStr.length;
      }
      
      // Remove preceding comments
      while (actualStart > 0 && (content[actualStart-1] === '\n' || content[actualStart-1] === '\r' || content[actualStart-1] === ' ' || content[actualStart-1] === '/' || content[actualStart-1] === '─' || content.substring(actualStart-15, actualStart).includes('// ' + comp.name))) {
         actualStart--;
         if (content.substring(actualStart, funcIdx).split('\n').length > 8) break;
      }
      
      content = content.substring(0, actualStart) + '\n' + content.substring(endIdx);
      console.log(`Removed ${comp.name}`);
      modified = true;
    } else {
      console.log(`Could not find opening brace for ${comp.name}`);
    }
  } else {
    console.log(`Could not find ${comp.name}`);
  }
}

// Ensure isNewItem, detectDevice, getWhatsAppLink are really removed
// We already imported them, we must remove their local definitions
const helpersToRemove = [
  'const isNewItem = ',
  'function detectDevice(',
  'function getWhatsAppLink('
];

for (const helper of helpersToRemove) {
  const funcIdx = content.indexOf(helper);
  if (funcIdx !== -1) {
    let i = funcIdx + helper.length;
    
    // If it's a const arrow func, we need to find the '{' after '=>'
    // If it's a function, find '{' after arguments
    while (i < content.length && content[i] !== '{') {
      i++;
    }
    
    if (i < content.length) {
      const endIdx = findFunctionEnd(content, i);
      content = content.substring(0, funcIdx) + '\n' + content.substring(endIdx);
      console.log(`Removed helper: ${helper}`);
      modified = true;
    }
  }
}

if (modified) {
  fs.writeFileSync(appPath, content, 'utf-8');
  console.log("Successfully cleaned up components and helpers.");
}
