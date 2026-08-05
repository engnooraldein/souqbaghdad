const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes('import { useAuth, OWNER_EMAIL, DEFAULT_AVATAR, DEFAULT_COVER }')) {
  content = content.replace(
    /import \{ getNumericHash \} from '\.\/utils\/helpers';/,
    "import { getNumericHash } from './utils/helpers';\nimport { useAuth, OWNER_EMAIL, DEFAULT_AVATAR, DEFAULT_COVER } from './hooks/useAuth';"
  );
}

// 2. Remove constants from App.tsx
content = content.replace(/const OWNER_EMAIL = 'nooraldeinsbah@gmail\.com';\n/, '');
content = content.replace(/export const DEFAULT_AVATAR = `data:image[^;]+;\n/, '');
content = content.replace(/const DEFAULT_COVER = '\/logo-512\.webp';\n/, '');
content = content.replace(/let hasShownLoginToast = false;\n/, '');

// 3. Remove user state
const userStatePattern = /const \[user, setUser\] = useState<User\|null>\(\(\) => \{[\s\S]*?\}\);\n\n/;
content = content.replace(userStatePattern, '');

// 4. Remove storedUsers state
content = content.replace(/const \[storedUsers, setStoredUsers\] = useState<any\[\]>\(\[\]\);\n/, '');

// 5. Remove showAuth state (it's declared twice! Wait, App.tsx has const [showAuth, setShowAuth] = useState(false);)
content = content.replace(/const \[showAuth, setShowAuth\] = useState\(false\);\n/, '');

// 6. Add useAuth call inside App component
// Find setToast definition
content = content.replace(
  /const \[toast, setToast\] = useState<\{[^\}]+\}>\(\{([^\}]+)\}\);\n/,
  "const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info'; visible: boolean; icon?: any }>({ msg: '', type: 'info', visible: false });\n\n  const { user, setUser, storedUsers, fetchProfiles, isAdmin, isOwner, showAuth, setShowAuth, handleLogout } = useAuth(setToast);\n"
);

// 7. Remove fetchProfiles
const fetchProfilesPattern = /const fetchProfiles = async \(\) => \{[\s\S]*?\}\s*\}\s*};\n/;
content = content.replace(fetchProfilesPattern, '');

// 8. Remove isAdmin / isOwner
content = content.replace(/const isAdmin = user\?\.role === 'owner' \|\| user\?\.role === 'admin';\n/, '');
content = content.replace(/const isOwner = user\?\.role === 'owner';\n/, '');

// 9. Remove loadUserFromSupabase
const loadUserPattern = /\/\/ ── دالة تحميل بيانات المستخدم من Supabase \(ربط تلقائي ورسمي بـ Google Gmail\) ──\n\s*const loadUserFromSupabase = async \(authUser: any\) => \{[\s\S]*?\n\s*};\n/g;
content = content.replace(loadUserPattern, '');

// 10. Remove Auth useEffect
const lines = content.split('\n');
let newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.includes('// فحص أي أخطاء في الـ URL قادمة من Google OAuth')) {
    // Look backward to find the useEffect start
    if (newLines[newLines.length - 1].includes('useEffect(() => {')) {
      newLines.pop(); // remove useEffect line
    }
    skip = true;
  }

  if (skip && line.includes('// Notifications handlers and effects')) {
    // end of the auth useEffect block
    // the previous few lines were `  }, []);`
    // just resume copying here
    skip = false;
  }

  if (!skip) {
    newLines.push(line);
  }
}
content = newLines.join('\n');

// 11. Remove handleLogout
const handleLogoutPattern = /const handleLogout = async \(\) => \{[\s\S]*?\n\s*};\n/;
content = content.replace(handleLogoutPattern, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Refactoring done via script!');
