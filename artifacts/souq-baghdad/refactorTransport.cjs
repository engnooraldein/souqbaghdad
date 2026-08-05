const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add import
if (!content.includes("import { useTransportAds } from './hooks/useTransportAds';")) {
  content = content.replace(
    /import \{ useAds \} from '\.\/hooks\/useAds';/,
    "import { useAds } from './hooks/useAds';\nimport { useTransportAds } from './hooks/useTransportAds';"
  );
}

// Remove states
content = content.replace(/const \[allTransportAds, setAllTransportAds\] = useState<any\[\]>\(\[\]\);\n/, '');
content = content.replace(/const \[loadingTransport, setLoadingTransport\] = useState\(false\);\n/, '');
content = content.replace(/const \[hasMoreTransport, setHasMoreTransport\] = useState\(true\);\n/, '');
content = content.replace(/const \[totalTransportCount, setTotalTransportCount\] = useState\(0\);\n/, '');
content = content.replace(/const transportPageRef = useRef\(0\);\n/, '');

// Inject hook call
const hookCall = `
  const {
    allTransportAds, setAllTransportAds,
    loadingTransport, setLoadingTransport,
    hasMoreTransport, totalTransportCount,
    fetchTransportAds
  } = useTransportAds();
`;

if (!content.includes('const { allTransportAds,')) {
  // Inject right after useAds call
  content = content.replace(
    /totalAdsCount, totalProductsCount\n  } = useAds\(\{ search, cat, gov, sort, priceMin, priceMax \}\);/,
    `totalAdsCount, totalProductsCount\n  } = useAds({ search, cat, gov, sort, priceMin, priceMax });\n${hookCall}`
  );
}

// Remove fetchTransportAds (it is from const fetchTransportAds = useCallback(async (reset = true) => { down to }, []);
const fetchRegex = /const fetchTransportAds = useCallback\(async \(reset = true\) => \{[\s\S]*?\}, \[\]\);\n/;
content = content.replace(fetchRegex, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done refactoring Transport Ads!');
