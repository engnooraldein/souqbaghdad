const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

// 1. Rename User to User as UserIcon in lucide-react imports
const oldLucideImport = `  Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, Check,`;
const newLucideImport = `  Eye, EyeOff, Mail, Lock, User as UserIcon, Phone, AlertCircle, Check,`;

if (content.includes(oldLucideImport)) {
  content = content.replace(oldLucideImport, newLucideImport);
  console.log("Renamed import in lucide-react.");
} else {
  console.error("Could not find lucide-react User import line!");
  process.exit(1);
}

// 2. Rename <User to <UserIcon for the 3 occurrences
const target1 = `signup' && <div className="relative"><User className="absolute right-4 top-1/2`;
const replacement1 = `signup' && <div className="relative"><UserIcon className="absolute right-4 top-1/2`;

const target2 = `flex items-center gap-2"><User className="w-4 h-4 text-amber-400"/>`;
const replacement2 = `flex items-center gap-2"><UserIcon className="w-4 h-4 text-amber-400"/>`;

const target3 = `text-white text-sm"><User className="w-5 h-5 text-gray-400"/>`;
const replacement3 = `text-white text-sm"><UserIcon className="w-5 h-5 text-gray-400"/>`;

content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);
content = content.replace(target3, replacement3);

fs.writeFileSync(appPath, content, 'utf8');
console.log("Successfully renamed User icon references to UserIcon in App.tsx!");
