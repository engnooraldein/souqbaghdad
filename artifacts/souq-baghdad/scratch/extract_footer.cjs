const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '../src/App.tsx');
let content = fs.readFileSync(appPath, 'utf-8');

const footerStart = content.indexOf('{/* Footer */}');
const footerEnd = content.indexOf('</footer>', footerStart) + '</footer>'.length;

if (footerStart !== -1 && footerEnd > footerStart) {
  content = content.substring(0, footerStart) + '{/* Footer */}\\n      <Footer setActiveDocTab={setActiveDocTab} />' + content.substring(footerEnd);
  
  // Add import
  const lastImportMatch = [...content.matchAll(/^import .*?(?:;|\\n)/gm)];
  if (lastImportMatch.length > 0) {
    const last = lastImportMatch[lastImportMatch.length - 1];
    const importIdx = last.index + last[0].length;
    content = content.substring(0, importIdx) + "\\nimport { Footer } from './components/Footer';\\n" + content.substring(importIdx);
  }
  
  fs.writeFileSync(appPath, content, 'utf-8');
  console.log('Successfully replaced inline footer with Footer component.');
} else {
  console.log('Could not find Footer in App.tsx');
}
