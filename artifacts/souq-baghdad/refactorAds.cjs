const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add import
if (!content.includes("import { useAds } from './hooks/useAds';")) {
  content = content.replace(
    /import \{ useAuth, OWNER_EMAIL, DEFAULT_AVATAR, DEFAULT_COVER \} from '\.\/hooks\/useAuth';/,
    "import { useAuth, OWNER_EMAIL, DEFAULT_AVATAR, DEFAULT_COVER } from './hooks/useAuth';\nimport { useAds } from './hooks/useAds';"
  );
}

// Remove static functions (getDefaultAds, etc.) if they were left inside App.tsx or just leave them since they are not causing bugs.
content = content.replace(/const getDefaultAds = \(\): Ad\[\] => \[\];\n/, '');
content = content.replace(/const getDefaultProducts = \(\): Product\[\] => \[\];\n/, '');

// Remove states
content = content.replace(/const \[allAds, setAllAds\] = useState<Ad\[\]>\(getDefaultAds\);\n/, '');
content = content.replace(/const \[loadingMoreAds, setLoadingMoreAds\] = useState\(false\);\n/, '');
content = content.replace(/const \[adsPage, setAdsPage\] = useState\(0\);\n/, '');
content = content.replace(/const \[hasMoreAds, setHasMoreAds\] = useState\(true\);\n/, '');
content = content.replace(/const \[totalAdsCount, setTotalAdsCount\] = useState\(0\);\n/, '');

content = content.replace(/const \[allProducts, setAllProducts\] = useState<Product\[\]>\(getDefaultProducts\);\n/, '');
content = content.replace(/const \[loadingMoreProducts, setLoadingMoreProducts\] = useState\(false\);\n/, '');
content = content.replace(/const \[productsPage, setProductsPage\] = useState\(0\);\n/, '');
content = content.replace(/const \[hasMoreProducts, setHasMoreProducts\] = useState\(true\);\n/, '');
content = content.replace(/const \[totalProductsCount, setTotalProductsCount\] = useState\(0\);\n/, '');

content = content.replace(/const \[isInitialLoading, setIsInitialLoading\] = useState\(true\);\n/, '');
content = content.replace(/const isFirstLoadDone = useRef\(false\);\n/, '');

// Add useAds hook call AFTER the filter states.
// find the line with `const [hasNewNotifications, setHasNewNotifications] = useState(false);` and put the hook before it.
// or just find `const [priceMax, setPriceMax] = useState('');`
const hookCall = `
  const {
    allAds, setAllAds,
    allProducts, setAllProducts,
    fetchAds, fetchProducts,
    loadingMoreAds, loadingMoreProducts, isInitialLoading,
    hasMoreAds, hasMoreProducts,
    totalAdsCount, totalProductsCount
  } = useAds({ search, cat, gov, sort, priceMin, priceMax });
`;
if (!content.includes('useAds({ search')) {
  content = content.replace(
    /const \[priceMax, setPriceMax\] = useState\(''\);\n/,
    `const [priceMax, setPriceMax] = useState('');\n${hookCall}\n`
  );
}

// Now the hardest part: remove fetchAds and fetchProducts
// We can use a regex to match the whole block from fetchAds down to fetchProducts
const fetchRegex = /const fetchAds = useCallback\(async \(reset = true\) => \{[\s\S]*?\}, \[productsPage, search, cat, gov, sort, priceMin, priceMax\]\);\n/;
content = content.replace(fetchRegex, '');

// Save
fs.writeFileSync(filePath, content, 'utf8');
console.log('Done refactoring Ads!');
