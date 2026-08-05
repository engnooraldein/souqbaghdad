const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add import
if (!content.includes("import { useNotifications } from './hooks/useNotifications';")) {
  content = content.replace(
    /import \{ useTransportAds \} from '\.\/hooks\/useTransportAds';/,
    "import { useTransportAds } from './hooks/useTransportAds';\nimport { useNotifications } from './hooks/useNotifications';"
  );
}

// Inject hook call
const hookCall = `
  const {
    notifications,
    setNotifications,
    fetchNotifications,
    handleDeleteNotification,
    handleClearAllNotifications
  } = useNotifications(user, unreadChatCount, playSound);
`;

if (!content.includes('const { notifications,')) {
  // Inject right after useTransportAds call
  content = content.replace(
    /fetchTransportAds\n  \} = useTransportAds\(\);\n/,
    `fetchTransportAds\n  } = useTransportAds();\n${hookCall}`
  );
}

// Remove states and functions
content = content.replace(/const \[notifications, setNotifications\] = useState<any\[\]>\(\[\]\);\n/, '');

const fetchRegex = /const fetchNotifications = useCallback\(async \(\) => \{[\s\S]*?\}, \[user\]\);\n/;
content = content.replace(fetchRegex, '');

// Remove Effects
const effect1Regex = /\/\/ هذا useEffect يعمل عند تسجيل الدخول أو الخروج\.[\s\S]*?return \(\) => \{\n\s*clearInterval\(pollInterval\);\n\s*\};\n\s*\}, \[user, fetchNotifications\]\);\n/;
content = content.replace(effect1Regex, '');

const effect2Regex = /const prevNotifsLength = useRef\(0\);\n\s*\/\/ هذا useEffect يعمل عند تغيير قائمة الإشعارات\.[\s\S]*?prevNotifsLength\.current = notifications\.length;\n\s*\}, \[notifications\]\);\n/;
content = content.replace(effect2Regex, '');

const effect3Regex = /\/\/ ── تحديث شارة الأيقونة الخارجية \(App Icon Badge\) تلقائياً ────────────\n\s*useEffect\(\(\) => \{[\s\S]*?\}, \[notifications, unreadChatCount\]\);\n/;
content = content.replace(effect3Regex, '');

// Remove handleDeleteNotification
const delRegex = /const handleDeleteNotification = async \(notifId: string, sourceTable\?: string\) => \{[\s\S]*?\n\s*};\n/;
content = content.replace(delRegex, '');

// Remove handleClearAllNotifications
const clearRegex = /const handleClearAllNotifications = async \(\) => \{[\s\S]*?\n\s*};\n/;
content = content.replace(clearRegex, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done refactoring Notifications!');
