const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add imports
if (!content.includes("import { useAdActions } from './hooks/useAdActions';")) {
  content = content.replace(
    /import \{ useNotifications \} from '\.\/hooks\/useNotifications';/,
    "import { useNotifications } from './hooks/useNotifications';\nimport { useAdActions } from './hooks/useAdActions';\nimport { useProductActions } from './hooks/useProductActions';\nimport { useTransportActions } from './hooks/useTransportActions';\nimport { handleUniversalShare } from './hooks/useAppInteractions';"
  );
}

// Remove the global handleUniversalShare from App.tsx
const handleShareRegex = /export function handleUniversalShare[\s\S]*?\}\n\}\n/;
content = content.replace(handleShareRegex, '');

// Inject hook calls for AdActions, ProductActions, TransportActions
const hooksToInject = `
  const {
    handleToggleFav,
    handleAddOrEditAd,
    handleMarkAdSold,
    handleDeleteAd
  } = useAdActions({
    user, setUser, adCosts, checkPostRateLimit, showToast, playSound,
    triggerOnlineStatusesSync, fetchAds, setAllAds,
    editingAd, setEditingAd, setFavorites, setCongratulationsItem
  });

  const {
    handleAddOrEditProduct,
    handleMarkProductSold,
    handleDeleteProduct
  } = useProductActions({
    user, setUser, adCosts, checkPostRateLimit, showToast, playSound,
    fetchProducts, setAllProducts,
    editingProduct, setEditingProduct, setCongratulationsItem
  });

  const {
    handlePostTransportAd,
    handleUpdateTransportStatus,
    handleDeleteTransportAd
  } = useTransportActions({
    user, setUser, adCosts, checkPostRateLimit, showToast,
    fetchTransportAds, allTransportAds
  });
`;

if (!content.includes('const { handleToggleFav,')) {
  // Inject right after useNotifications call
  content = content.replace(
    /handleClearAllNotifications\n  \} = useNotifications\(user, unreadChatCount, playSound\);\n/,
    `handleClearAllNotifications\n  } = useNotifications(user, unreadChatCount, playSound);\n${hooksToInject}\n`
  );
}

// Now remove all the extracted functions!
// 1. handleToggleFav
content = content.replace(/const handleToggleFav = \(id:number\)=>\{[\s\S]*?\};\n/, '');

// 2. handleAddOrEditAd
const handleAddOrEditAdRegex = /const handleAddOrEditAd = async \(ad: Ad\) => \{[\s\S]*?fetchAds\(\);\n\s*\};\n/;
content = content.replace(handleAddOrEditAdRegex, '');

// 3. handlePostTransportAd
const handlePostTransportAdRegex = /const handlePostTransportAd = async \(ad: TransportAd\) => \{[\s\S]*?fetchAds\(\);\n\s*\};\n/;
content = content.replace(handlePostTransportAdRegex, '');

// 4. handleUpdateTransportStatus
const handleUpdateTransportStatusRegex = /const handleUpdateTransportStatus = async \(id: number, status: string, reason: string \| null = null\) => \{[\s\S]*?fetchAds\(\);\n\s*\};\n/;
content = content.replace(handleUpdateTransportStatusRegex, '');

// 5. handleDeleteTransportAd
const handleDeleteTransportAdRegex = /const handleDeleteTransportAd = async \(id: number\) => \{[\s\S]*?fetchAds\(\);\n\s*\};\n/;
content = content.replace(handleDeleteTransportAdRegex, '');

// 6. handleAddOrEditProduct
const handleAddOrEditProductRegex = /const handleAddOrEditProduct = async \(p: Product\) => \{[\s\S]*?fetchProducts\(\);\n\s*\};\n/;
content = content.replace(handleAddOrEditProductRegex, '');

// 7. handleMarkAdSold
const handleMarkAdSoldRegex = /const handleMarkAdSold = async \(ad: Ad\) => \{[\s\S]*?fetchAds\(\);\n\s*\};\n/;
content = content.replace(handleMarkAdSoldRegex, '');

// 8. handleMarkProductSold
const handleMarkProductSoldRegex = /const handleMarkProductSold = async \(p: Product\) => \{[\s\S]*?fetchProducts\(\);\n\s*\};\n/;
content = content.replace(handleMarkProductSoldRegex, '');

// 9. handleDeleteAd
const handleDeleteAdRegex = /const handleDeleteAd = async \(id: number\) => \{[\s\S]*?showToast\('تم حذف الإعلان', 'delete'\);\n\s*\};\n/;
content = content.replace(handleDeleteAdRegex, '');

// 10. handleDeleteProduct
const handleDeleteProductRegex = /const handleDeleteProduct = async \(id: number\) => \{[\s\S]*?showToast\('تم حذف المنتج', 'delete'\);\n\s*\};\n/;
content = content.replace(handleDeleteProductRegex, '');


fs.writeFileSync(filePath, content, 'utf8');
console.log('Done refactoring Action Handlers!');
