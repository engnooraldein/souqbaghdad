const fs = require('fs');
const path = require('path');

// 1. Append getWhatsAppLink to helpers.ts
const helpersFilePath = path.join(__dirname, 'src', 'utils', 'helpers.ts');
let helpersContent = fs.readFileSync(helpersFilePath, 'utf8');

if (!helpersContent.includes('getWhatsAppLink')) {
  helpersContent += `\n
export function getWhatsAppLink(phone: string, itemType: 'product' | 'transport', details: any) {
  if (!phone) return '#';
  let cleanPhone = phone.replace(/[^0-9+]/g, '');
  if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
  if (!cleanPhone.startsWith('964') && !cleanPhone.startsWith('+964')) {
    cleanPhone = '964' + cleanPhone;
  }
  cleanPhone = cleanPhone.replace('+', '');
  const idStr = details.short_id ? \`#\${details.short_id}\` : \`#\${String(details.id).substring(0, 5)}\`;
  const title = details.title || details.university || 'إعلان';
  const location = details.location || details.governorate || 'غير محدد';
  
  const text = \`السلام عليكم 🌹
شفت إعلان (*\${title}*) وحاب أستفسر عنه إذا متوفر حالياً.

*تفاصيل الإعلان:*
📌 *\${title}*
🆔 *رمز الإعلان:* \${idStr}
📍 *\${location}*

*رسالة من منصة سوق بغداد:*
سوق بغداد هو السوق الرقمي العراقي الحديث، نسهل عليكم التواصل المباشر بين البائع والمشتري بكل سرعة وأمان.
🌐 تصفحوا المزيد من العروض عبر موقعنا:
www.souqbaghdad.store
بانتظار ردكم، شكراً 🙏\`;
  
  return \`https://wa.me/\${cleanPhone}?text=\${encodeURIComponent(text)}\`;
}
`;
  fs.writeFileSync(helpersFilePath, helpersContent, 'utf8');
}

// 2. Remove them from App.tsx
const appFilePath = path.join(__dirname, 'src', 'App.tsx');
let appContent = fs.readFileSync(appFilePath, 'utf8');

// Regex patterns to remove blocks
const removePatterns = [
  /export const DEFAULT_AD_IMAGE = [\s\S]*?<\/svg>'\)}`\s*;\n/,
  /export const getCoverImage = [\s\S]*?};\n/,
  /export const IRAQI_GOVERNORATES = \[[\s\S]*?\];\n/,
  /export const CATEGORIES = \[[\s\S]*?\];\n/,
  /export const GAMES_DATA = \[[\s\S]*?\];\n/,
  /export const UNIVERSITIES = \[[\s\S]*?\];\n/,
  /export const EMPLOYEE_WORKPLACES = \[[\s\S]*?\];\n/,
  /export async function compressImage[\s\S]*?\}\s*\n\}\s*\n/,
  /export async function uploadImageToStorage[\s\S]*?catch \(err\) \{\n\s*console\.error[\s\S]*?throw err;\n\s*\}\n\}\n/,
  /function detectDevice\(\): Visit\['device'\] \{[\s\S]*?return 'desktop';\n\}\n/,
  /function recordVisit[\s\S]*?try \{ const prev[\s\S]*?catch \{\}\n\}\n/,
  /function saveStoredUser[\s\S]*?try \{[\s\S]*?catch \{\}\n\}\n/,
  /function isBanned[\s\S]*?try \{ return[\s\S]*?catch \{ return false; \}\n\}\n/,
  /const useSound = \(\) => \{[\s\S]*?catch \{\}\n\s*\};\n\};\n/,
  /function getWhatsAppLink[\s\S]*?return `https:\/\/wa\.me\/\$\{cleanPhone\}\?text=\$\{encodeURIComponent\(text\)\}`;\n\}\n/,
  /export async function recordItemView[\s\S]*?catch \(e\) \{\n\s*console\.error\('Failed to record view', e\);\n\s*\}\n\}\n/
];

removePatterns.forEach(pattern => {
  appContent = appContent.replace(pattern, '');
});

// Update imports
if (!appContent.includes('import { useSound } from')) {
  appContent = appContent.replace(
    /import \{ useAdActions \} from '.\/hooks\/useAdActions';/,
    `import { useAdActions } from './hooks/useAdActions';\nimport { useSound } from './hooks/useSound';`
  );
}

if (!appContent.includes('import { CATEGORIES, IRAQI_GOVERNORATES')) {
  const importsStr = `import { CATEGORIES, IRAQI_GOVERNORATES, EMPLOYEE_WORKPLACES, UNIVERSITIES, DEFAULT_AD_IMAGE, getCoverImage, GAMES_DATA } from './constants';
import { compressImage, uploadImageToStorage } from './utils/image';
import { recordItemView, recordVisit, saveStoredUser, isBanned, detectDevice } from './utils/analytics';
`;
  appContent = appContent.replace(
    /import \{ getGlowClass, getWhatsAppResetLink, slugify \} from '.\/utils\/helpers';/,
    `import { getGlowClass, getWhatsAppResetLink, slugify, getWhatsAppLink } from './utils/helpers';\n${importsStr}`
  );
}

fs.writeFileSync(appFilePath, appContent, 'utf8');
console.log('Finished refactoring utils and constants.');
