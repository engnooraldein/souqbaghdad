const fs = require('fs');

const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove isNewItem
content = content.replace(/const isNewItem = \(createdAtISO\?: string\) => \{[\s\S]*?\};\n/, '');

// 2. Remove getWhatsAppLink
content = content.replace(/function getWhatsAppLink[\s\S]*?return `https:\/\/wa\.me\/\$\{cleanPhone\}\?text=\$\{encodeURIComponent\(text\)\}`;\n\}/, '');

// 3. Remove detectDevice
content = content.replace(/function detectDevice\(\): Visit\['device'\] \{[\s\S]*?return 'desktop';\n\}/, '');

// 4. Remove all slugify definitions
// "const slugify = (text: string) => {\n ... };"
content = content.replace(/const slugify = \(text: string\) => \{[\s\S]*?\.replace\(\/--\+\/g, '-'\);\n\s*};\n/g, '');

// 5. Update the helpers import at the top
content = content.replace(
  /import \{ getGlowClass, getWhatsAppResetLink \} from '\.\/utils\/helpers';/,
  `import { getGlowClass, getWhatsAppResetLink, isNewItem, getWhatsAppLink, detectDevice, slugify } from './utils/helpers';`
);

fs.writeFileSync(path, content);
console.log('Helpers removed and imports added');
