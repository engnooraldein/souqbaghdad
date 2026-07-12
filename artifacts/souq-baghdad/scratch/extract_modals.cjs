const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '../src/App.tsx');
let content = fs.readFileSync(appPath, 'utf-8');

function findFunctionEnd(str, startIdx) {
  let openBraces = 0;
  let inString = false;
  let stringChar = '';
  let inComment = false;
  
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
  { name: 'OnboardingModal', search: 'function OnboardingModal(' },
  { name: 'CongratulationsModal', search: 'function CongratulationsModal(' },
  { name: 'AdDetailModal', search: 'function AdDetailModal(' },
  // Let's also check for ProductDetailModal and FullScreenGallery
  { name: 'ProductDetailModal', search: 'function ProductDetailModal(' },
  { name: 'FullScreenGallery', search: 'function FullScreenGallery(' },
  { name: 'ShareModal', search: 'function ShareModal(' },
  { name: 'ViewersModal', search: 'function ViewersModal(' },
];

let modified = false;
const extractedComponents = {};

for (const comp of components) {
  const funcIdx = content.indexOf(comp.search);
  if (funcIdx !== -1) {
    let i = funcIdx + comp.search.length;
    let openParens = 1;
    while (i < content.length && openParens > 0) {
      if (content[i] === '(') openParens++;
      else if (content[i] === ')') openParens--;
      i++;
    }
    
    while (i < content.length && content[i] !== '{') {
      i++;
    }
    
    if (i < content.length) {
      const endIdx = findFunctionEnd(content, i);
      
      let actualStart = funcIdx;
      const exportStr = 'export ';
      if (content.substring(actualStart - exportStr.length, actualStart) === exportStr) {
        actualStart -= exportStr.length;
      }
      
      let commentStart = actualStart;
      while (commentStart > 0 && (content[commentStart-1] === '\n' || content[commentStart-1] === '\r' || content[commentStart-1] === ' ' || content[commentStart-1] === '/' || content[commentStart-1] === '─' || content.substring(commentStart-15, commentStart).includes('// ' + comp.name))) {
         commentStart--;
         if (content.substring(commentStart, funcIdx).split('\n').length > 8) break;
      }
      
      const componentCode = content.substring(actualStart, endIdx);
      extractedComponents[comp.name] = componentCode;
      
      content = content.substring(0, commentStart) + '\n' + content.substring(endIdx);
      console.log(`Extracted and removed ${comp.name}`);
      modified = true;
    }
  } else {
    console.log(`Could not find ${comp.name}`);
  }
}

if (modified) {
  // Add imports
  let importsToAdd = '';
  for (const name of Object.keys(extractedComponents)) {
    importsToAdd += `import { ${name} } from './components/${name}';\n`;
    
    // Create the file with basic imports
    const filePath = path.join(__dirname, `../src/components/${name}.tsx`);
    let fileContent = `import React, { useState, useEffect, useRef } from 'react';\nimport { motion, AnimatePresence } from 'framer-motion';\nimport { X, CheckCircle, Search, Trash2, Camera, Download, AlertCircle, Share2, Copy } from 'lucide-react';\nimport { formatPrice } from '../utils/format';\nimport { useRelativeTime } from '../utils/time';\nimport { getGlowClass } from '../utils/helpers';\nimport { Ad, Product, User } from '../types';\nimport { useOnlineStatuses } from '../hooks/useOnlineStatuses';\n\n`;
    
    if (name === 'OnboardingModal') {
       fileContent = `import { useState } from 'react';\nimport { motion } from 'framer-motion';\nimport { X } from 'lucide-react';\n\n`;
    } else if (name === 'CongratulationsModal') {
       fileContent = `import { motion } from 'framer-motion';\nimport { CheckCircle } from 'lucide-react';\n\n`;
    }
    
    // Change function to export function if it wasn't
    let compCode = extractedComponents[name];
    if (!compCode.startsWith('export ')) {
       compCode = compCode.replace(/^function/, 'export function');
    }
    
    fileContent += compCode + '\n';
    fs.writeFileSync(filePath, fileContent, 'utf-8');
  }
  
  const lastImportMatch = [...content.matchAll(/^import .*?(?:;|\n)/gm)];
  if (lastImportMatch.length > 0) {
    const last = lastImportMatch[lastImportMatch.length - 1];
    const importIdx = last.index + last[0].length;
    content = content.substring(0, importIdx) + '\n' + importsToAdd + content.substring(importIdx);
  } else {
    content = importsToAdd + '\n' + content;
  }
  
  fs.writeFileSync(appPath, content, 'utf-8');
  console.log("Successfully updated App.tsx and created component files.");
}
