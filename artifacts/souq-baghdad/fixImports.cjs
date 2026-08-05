const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');

fs.readdirSync(componentsDir).forEach(file => {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // We can just add the import from ../hooks/useAuth if DEFAULT_AVATAR is present
    // but better: replace `DEFAULT_AVATAR` in the `../App` import string.
    if (content.includes("import {") && content.includes("../App'") && content.includes("DEFAULT_AVATAR")) {
      // Find the import line for App
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("../App'") && lines[i].includes("DEFAULT_AVATAR")) {
          // Remove DEFAULT_AVATAR from this line
          lines[i] = lines[i].replace(/,\s*DEFAULT_AVATAR/, '').replace(/DEFAULT_AVATAR\s*,/, '').replace(/DEFAULT_AVATAR/, '');
          if (lines[i].includes('import { } from')) {
            lines[i] = '';
          }
          // Add new import for DEFAULT_AVATAR
          lines.splice(i + 1, 0, "import { DEFAULT_AVATAR } from '../hooks/useAuth';");
          changed = true;
          break;
        }
      }
      if (changed) {
        content = lines.join('\n');
        // also fix DEFAULT_COVER if needed (not shown in grep, but good to be safe)
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed', file);
      }
    }
  }
});
