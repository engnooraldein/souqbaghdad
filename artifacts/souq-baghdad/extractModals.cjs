const fs = require('fs');
const path = require('path');

const appFilePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appFilePath, 'utf8');

const startMarker = "{/* Modals */}";
const endMarker = "    </div>\n  );\n}";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log('Markers not found');
  process.exit(1);
}

const modalsCode = content.substring(startIndex, endIndex);

// Extract used variables via simple regex. This won't be perfect but will catch most.
// It's easier to explicitly define the props needed based on the previous observation.

const propsList = [
  'showOnboarding', 'setShowOnboarding',
  'showAuth', 'setShowAuth', 'handleLogin',
  'selectedAd', 'setSelectedAd', 'favorites', 'handleToggleFav', 'user', 'storedUsers', 'requireAuth', 'handleSellerClick', 'handleViewDurationLogged', 'setActiveLightbox', 'setAllAds',
  'selectedProduct', 'setSelectedProduct', 'setAllProducts',
  'selectedTransportAd', 'setSelectedTransportAd',
  'showCreateAd', 'setShowCreateAd', 'setEditingAd', 'handleAddOrEditAd', 'editingAd', 'adCosts',
  'showCreateProduct', 'setShowCreateProduct', 'setEditingProduct', 'handleAddOrEditProduct', 'editingProduct',
  'showNotifs', 'setShowNotifs', 'notifications', 'handleHistoryClick', 'markNotifAsRead', 'handleArchiveAllNotifications',
  'showChatModal', 'setShowChatModal', 'chatViewport', 'activeChatId', 'setActiveChatId', 'setSelectedSellerId',
  'activeDocTab', 'setActiveDocTab',
  'activeLightbox',
  'congratulationsItem', 'setCongratulationsItem',
  'shareModalData', 'setShareModalData',
  'showInstallGuide', 'setShowInstallGuide',
  'showInstallOptions', 'setShowInstallOptions', 'handlePwaInstall',
  'showStoreGuide', 'setShowStoreGuide'
];

const globalModalsContent = `import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Plus, AlertCircle, Smartphone, X } from 'lucide-react';
import { handleUniversalShare } from '../hooks/useAppInteractions';

// Modals
import { OnboardingModal } from './OnboardingModal';
import { AuthModal } from './AuthModal';
const AdDetailModal = React.lazy(() => import('./AdDetailModal').then(m => ({ default: m.AdDetailModal })));
const ProductDetailModal = React.lazy(() => import('./ProductDetailModal').then(m => ({ default: m.ProductDetailModal })));
const TransportDetailModal = React.lazy(() => import('./TransportDetailModal').then(m => ({ default: m.TransportDetailModal })));
const AdFormModal = React.lazy(() => import('./AdFormModal').then(m => ({ default: m.AdFormModal })));
const ProductFormModal = React.lazy(() => import('./ProductFormModal').then(m => ({ default: m.ProductFormModal })));
const InfoDocsModal = React.lazy(() => import('./InfoDocsModal').then(m => ({ default: m.InfoDocsModal })));
const ShareModal = React.lazy(() => import('./ShareModal').then(m => ({ default: m.ShareModal })));
import { NotifPanel } from './NotifPanel';
import { ChatView } from './ChatView';
import { ImageLightboxModal } from './ImageLightboxModal';
import { CongratulationsModal } from './CongratulationsModal';
import { InstallOptionsModal } from './InstallOptionsModal';
import { StoreShareGuideModal } from './StoreShareGuideModal';

const DEFAULT_AVATAR = "https://i.ibb.co/hRyMhcc/avatar.png";

export interface GlobalModalsProps {
${propsList.map(p => `  ${p}: any;`).join('\n')}
}

export const GlobalModals: React.FC<GlobalModalsProps> = (props) => {
  const {
${propsList.map(p => `    ${p},`).join('\n')}
  } = props;

  return (
    <>
${modalsCode.split('\\n').map(line => '      ' + line).join('\\n')}
    </>
  );
};
`;

fs.writeFileSync(path.join(__dirname, 'src', 'components', 'GlobalModals.tsx'), globalModalsContent, 'utf8');

// Replace in App.tsx
const propsPassed = propsList.map(p => `${p}={${p}}`).join(' ');
const newAppContent = content.substring(0, startIndex) + `      <GlobalModals ${propsPassed} />\n` + content.substring(endIndex);

fs.writeFileSync(appFilePath, newAppContent, 'utf8');

// Also inject import in App.tsx
if (!newAppContent.includes('import { GlobalModals }')) {
  const finalContent = newAppContent.replace(
    "import { OnboardingModal }",
    "import { GlobalModals } from './components/GlobalModals';\nimport { OnboardingModal }"
  );
  fs.writeFileSync(appFilePath, finalContent, 'utf8');
}

console.log('Extracted GlobalModals');
