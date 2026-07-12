const fs = require('fs');

// ==========================================
// 1. Apply React.memo to AdCard
// ==========================================
let adCard = fs.readFileSync('src/components/AdCard.tsx', 'utf-8').replace(/\r\n/g, '\n');

// Change: export function AdCard(...) { to export const AdCard = React.memo(function AdCard(...) {
adCard = adCard.replace(
  `export function AdCard({ ad, onSelect, isFav, onFav, onSellerClick, onActionMenu, sellerRole }:{`,
  `export const AdCard = React.memo(function AdCard({ ad, onSelect, isFav, onFav, onSellerClick, onActionMenu, sellerRole }:{`
);

// Close memo: replace last closing } before blank line at end
// Find the last closing `}` of the function and wrap it
adCard = adCard.replace(
  /^}\r?\n$/m,
  `});\n`
);

fs.writeFileSync('src/components/AdCard.tsx', adCard.replace(/\n/g, '\r\n'), 'utf-8');
console.log('✅ AdCard.tsx: Applied React.memo');

// ==========================================
// 2. Apply React.memo to ProductCard
// ==========================================
let productCard = fs.readFileSync('src/components/ProductCard.tsx', 'utf-8').replace(/\r\n/g, '\n');

productCard = productCard.replace(
  `export function ProductCard({ product, onSelect, isFav, onFav, onSellerClick, onActionMenu, sellerRole }:{`,
  `export const ProductCard = React.memo(function ProductCard({ product, onSelect, isFav, onFav, onSellerClick, onActionMenu, sellerRole }:{`
);

productCard = productCard.replace(
  /^}\r?\n$/m,
  `});\n`
);

fs.writeFileSync('src/components/ProductCard.tsx', productCard.replace(/\n/g, '\r\n'), 'utf-8');
console.log('✅ ProductCard.tsx: Applied React.memo');

// ==========================================
// 3. Remove debug console.logs from App.tsx
// Keep only console.error (error handling)
// ==========================================
let appContent = fs.readFileSync('src/App.tsx', 'utf-8').replace(/\r\n/g, '\n');

// Replace debug console.logs (keep console.error)
const debugLogs = [
  `            console.log('?? Transport Deep Link ? fetched row:', row, 'error:', error);\n`,
  `        console.log('[DeepLink] Product lookup:', { actualId, isUUID, isNumeric, targetId: targetId.substring(0, 50) });\n`,
  `          console.log('[DeepLink] Product query result:', { found: !!data, error: error?.message, actualId });\n`,
  `      console.log('[DeepLink] Initial parse, path:', window.location.pathname);\n`,
  `      console.log('[DeepLink] Retry check:', { linkType, linkId, adsLen: allAds.length, prodsLen: allProducts.length });\n`,
  `          console.log('[DeepLink] Retry found ad:', found.id);\n`,
  `          console.log('[DeepLink] Retry found product:', found.id);\n`,
  `          console.log('[DeepLink] Retry: product NOT found in allProducts. IDs:', allProducts.map(p => String(p.id).substring(0, 8)));\n`,
];

let removedCount = 0;
for (const log of debugLogs) {
  if (appContent.includes(log)) {
    appContent = appContent.replace(log, '');
    removedCount++;
  } else {
    // Try without exact whitespace (trim-match approach)
    const trimmed = log.trim();
    const regex = new RegExp(`[ \t]*${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n`, 'g');
    const before = appContent.length;
    appContent = appContent.replace(regex, '');
    if (appContent.length < before) removedCount++;
  }
}

fs.writeFileSync('src/App.tsx', appContent.replace(/\n/g, '\r\n'), 'utf-8');
console.log(`✅ App.tsx: Removed ${removedCount}/8 debug console.log statements`);

// ==========================================
// 4. Remove duplicate slugify from inside useEffect in App.tsx
//    (it already exists in src/utils/helpers.ts)
// ==========================================
let appContent2 = fs.readFileSync('src/App.tsx', 'utf-8').replace(/\r\n/g, '\n');

const duplicateSlugify = `    const slugify = (text: string) => {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\\s_]+/g, '-')
        .replace(/[^\\w\\u0621-\\u064A0-9-]+/g, '')
        .replace(/--+/g, '-');
    };

`;

if (appContent2.includes(duplicateSlugify)) {
  appContent2 = appContent2.replace(duplicateSlugify, '');
  fs.writeFileSync('src/App.tsx', appContent2.replace(/\n/g, '\r\n'), 'utf-8');
  console.log('✅ App.tsx: Removed duplicate slugify function from useEffect');
} else {
  console.warn('⚠️  Could not find exact duplicate slugify to remove — check manually');
}
