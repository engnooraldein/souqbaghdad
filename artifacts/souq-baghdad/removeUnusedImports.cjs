const fs = require('fs');
const path = require('path');

const appFilePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appFilePath, 'utf8');

const modalsToRemove = [
  'OnboardingModal', 'AuthModal', 'AdDetailModal', 'ProductDetailModal',
  'TransportDetailModal', 'AdFormModal', 'ProductFormModal', 'InfoDocsModal',
  'ShareModal', 'NotifPanel', 'ChatView', 'ImageLightboxModal',
  'CongratulationsModal', 'InstallOptionsModal', 'StoreShareGuideModal'
];

modalsToRemove.forEach(modal => {
  const regex = new RegExp(`import\\s+\\{\\s*${modal}\\s*\\}\\s+from\\s+['"]./components/${modal}['"];?\\n?`);
  content = content.replace(regex, '');
  
  // also handle React.lazy dynamically imported modals (if any exist in App.tsx)
  const lazyRegex = new RegExp(`const\\s+${modal}\\s*=\\s*React\\.lazy\\([^\\)]+\\);?\\n?`);
  content = content.replace(lazyRegex, '');
});

fs.writeFileSync(appFilePath, content, 'utf8');
console.log('Removed unused modal imports from App.tsx');
