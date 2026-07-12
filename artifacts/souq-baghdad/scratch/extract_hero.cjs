const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '../src/App.tsx');
let content = fs.readFileSync(appPath, 'utf-8');

const heroStart = content.indexOf('{/* Hero */}');
const heroEnd = content.indexOf('</section>', heroStart) + '</section>'.length;

if (heroStart !== -1 && heroEnd > heroStart) {
  const heroCode = content.substring(heroStart, heroEnd);
  
  const componentCode = `import React from 'react';
import { motion } from 'framer-motion';
import { Search, Car, ChevronLeft, Smartphone } from 'lucide-react';
import { CATEGORIES } from '../App';
import LiveVisitorCounter from './LiveVisitorCounter';

interface HeroSectionProps {
  search: string;
  setSearch: (s: string) => void;
  cat: string;
  setCat: (c: string) => void;
  onTransportClick?: () => void;
  isStandalone?: boolean;
  onInstallClick?: () => void;
}

export function HeroSection({
  search, setSearch,
  cat, setCat,
  onTransportClick,
  isStandalone,
  onInstallClick
}: HeroSectionProps) {
  return (
    ${heroCode.replace('{/* Hero */}', '').trim()}
  );
}
`;

  fs.writeFileSync(path.join(__dirname, '../src/components/HeroSection.tsx'), componentCode, 'utf-8');
  console.log('Created HeroSection.tsx');

  // Replace in App.tsx
  const replacement = `{/* Hero */}
      <HeroSection 
        search={search}
        setSearch={setSearch}
        cat={cat}
        setCat={setCat}
        onTransportClick={onTransportClick}
        isStandalone={isStandalone}
        onInstallClick={onInstallClick}
      />`;
      
  content = content.substring(0, heroStart) + replacement + content.substring(heroEnd);
  
  // Add import
  const lastImportMatch = [...content.matchAll(/^import .*?(?:;|\\n)/gm)];
  if (lastImportMatch.length > 0) {
    const last = lastImportMatch[lastImportMatch.length - 1];
    const importIdx = last.index + last[0].length;
    content = content.substring(0, importIdx) + "\\nimport { HeroSection } from './components/HeroSection';\\n" + content.substring(importIdx);
  }
  
  fs.writeFileSync(appPath, content, 'utf-8');
  console.log('Successfully replaced Hero section in App.tsx');
} else {
  console.log('Could not find Hero section in App.tsx');
}
