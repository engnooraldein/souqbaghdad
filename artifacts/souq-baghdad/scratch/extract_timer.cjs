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
      else if (char === '"' || char === "'" || char === '\`') {
        inString = true;
        stringChar = char;
      }
      else if (char === '/' && str[i+1] === '/') {
        inComment = true;
        i++;
      }
    } else if (inString) {
      if (char === stringChar && str[i-1] !== '\\\\') inString = false;
    } else if (inComment) {
      if (char === '\\n') inComment = false;
    }
    i++;
  }
  return i;
}

const comp = { name: 'InterestTimer', search: 'function InterestTimer(' };
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
    
    let compCode = content.substring(actualStart, endIdx);
    if (!compCode.startsWith('export ')) {
       compCode = compCode.replace(/^function/, 'export function');
    }
    
    const filePath = path.join(__dirname, '../src/components/InterestTimer.tsx');
    const fileContent = "import React, { useState, useEffect } from 'react';\\nimport { motion, AnimatePresence } from 'framer-motion';\\nimport { useSound } from '../hooks/useSound';\\n\\n" + compCode + '\\n';
    fs.writeFileSync(filePath, fileContent, 'utf-8');
    
    content = content.substring(0, actualStart) + '\\n' + content.substring(endIdx);
    
    // Add import
    const lastImportMatch = [...content.matchAll(/^import .*?(?:;|\\n)/gm)];
    if (lastImportMatch.length > 0) {
      const last = lastImportMatch[lastImportMatch.length - 1];
      const importIdx = last.index + last[0].length;
      content = content.substring(0, importIdx) + "\\nimport { InterestTimer } from './components/InterestTimer';\\n" + content.substring(importIdx);
    }
    
    fs.writeFileSync(appPath, content, 'utf-8');
    console.log("Successfully extracted InterestTimer.");
  }
}

// Ensure useSound is extracted!
const useSoundIdx = content.indexOf('const useSound = () => {');
if (useSoundIdx !== -1) {
  let i = useSoundIdx + 'const useSound = () => {'.length - 1;
  const endIdx = findFunctionEnd(content, i);
  const useSoundCode = content.substring(useSoundIdx, endIdx);
  
  const hookPath = path.join(__dirname, '../src/hooks/useSound.ts');
  const hookContent = "import { useRef, useEffect, useState } from 'react';\\n\\nexport " + useSoundCode + '\\n';
  if (!fs.existsSync(path.dirname(hookPath))) fs.mkdirSync(path.dirname(hookPath));
  fs.writeFileSync(hookPath, hookContent, 'utf-8');
  
  content = content.substring(0, useSoundIdx) + '\\n' + content.substring(endIdx);
  
  const lastImportMatch = [...content.matchAll(/^import .*?(?:;|\\n)/gm)];
  if (lastImportMatch.length > 0) {
    const last = lastImportMatch[lastImportMatch.length - 1];
    const importIdx = last.index + last[0].length;
    content = content.substring(0, importIdx) + "\\nimport { useSound } from '../hooks/useSound';\\n" + content.substring(importIdx);
  }
  
  fs.writeFileSync(appPath, content, 'utf-8');
  console.log("Successfully extracted useSound.");
}
