const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.tsx');
const content = fs.readFileSync(appPath, 'utf8');

const startStr = 'function OwnerDashboard';
const endStr = 'function AdminPanel';

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find OwnerDashboard or AdminPanel in App.tsx!");
  process.exit(1);
}

const before = content.substring(0, startIdx);
const after = content.substring(endIdx);

const updatedContent = before + `// OwnerDashboard component has been extracted and is now lazy loaded.\n\n` + after;

fs.writeFileSync(appPath, updatedContent, 'utf8');
console.log("Successfully removed inline OwnerDashboard from src/App.tsx!");
