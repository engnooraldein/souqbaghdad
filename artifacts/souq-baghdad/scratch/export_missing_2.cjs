const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '../src/App.tsx');
let content = fs.readFileSync(appPath, 'utf-8');

// Fix ViewersModal
content = content.replace(/^const ViewersModal = lazy/m, 'export const ViewersModal = lazy');

// Fix recordItemView
content = content.replace(/^async function recordItemView\(/m, 'export async function recordItemView(');

fs.writeFileSync(appPath, content, 'utf-8');
console.log('Exported ViewersModal and recordItemView from App.tsx');
