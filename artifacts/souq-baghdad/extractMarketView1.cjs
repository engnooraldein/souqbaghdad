const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src', 'components', 'MarketView.tsx');
let code = fs.readFileSync(srcPath, 'utf8');

// We want to extract:
// 1. function getAdTimestamp
// 2. function PaginationDots
// 3. function HorizontalCarousel
// and create a new MarketView.tsx that imports them.

// Create a helpers file in market dir
const helpersCode = `export function getAdTimestamp(a: any): number {
  if (!a) return 0;
  if (a.createdAtISO) {
    const t = new Date(a.createdAtISO).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (a.created_at) {
    if (typeof a.created_at === 'number' && !isNaN(a.created_at) && a.created_at > 0) {
      return a.created_at > 1e11 ? a.created_at : a.created_at * 1000;
    }
    const t = new Date(a.created_at).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (a.createdAt) {
    if (typeof a.createdAt === 'number' && !isNaN(a.createdAt) && a.createdAt > 0) {
      return a.createdAt > 1e11 ? a.createdAt : a.createdAt * 1000;
    }
    if (typeof a.createdAt === 'string') {
      const t = new Date(a.createdAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
  }
  if (a.timestamp) {
    if (typeof a.timestamp === 'number' && !isNaN(a.timestamp) && a.timestamp > 0) {
      return a.timestamp > 1e11 ? a.timestamp : a.timestamp * 1000;
    }
    const t = new Date(a.timestamp).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (typeof a.id === 'number' && a.id > 1000000000) {
    return a.id;
  }
  if (typeof a.id === 'string' && /^\\d{10,13}$/.test(a.id)) {
    const num = Number(a.id);
    if (!isNaN(num) && num > 1000000000) return num;
  }
  return 0;
}`;

fs.writeFileSync(path.join(__dirname, 'src', 'components', 'market', 'marketHelpers.ts'), helpersCode);

// Remove these from MarketView.tsx
let startIdx = code.indexOf('function getAdTimestamp(');
let endIdx = code.indexOf('export function MarketView(');
if (startIdx !== -1 && endIdx !== -1) {
  let header = code.substring(0, startIdx);
  let componentCode = code.substring(endIdx);
  
  // add imports
  header += `import { PaginationDots } from './market/PaginationDots';\n`;
  header += `import { HorizontalCarousel } from './market/HorizontalCarousel';\n`;
  header += `import { getAdTimestamp } from './market/marketHelpers';\n\n`;
  
  fs.writeFileSync(srcPath, header + componentCode);
  console.log("Successfully extracted PaginationDots, HorizontalCarousel and getAdTimestamp");
} else {
  console.log("Could not find boundaries");
}
