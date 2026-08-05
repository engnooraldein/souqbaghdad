const fs = require('fs');
const path = require('path');

const appFilePath = path.join(__dirname, 'src', 'App.tsx');
let appContent = fs.readFileSync(appFilePath, 'utf8');

const exportStr = `\n
export * from './constants';
export * from './utils/image';
export * from './utils/analytics';
export { getWhatsAppLink } from './utils/helpers';
`;

if (!appContent.includes("export * from './constants';")) {
  appContent += exportStr;
  fs.writeFileSync(appFilePath, appContent, 'utf8');
}
console.log('Fixed exports in App.tsx');
