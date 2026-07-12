const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '../src/App.tsx');
let content = fs.readFileSync(appPath, 'utf-8');

const thingsToExport = [
    'const CATEGORIES =',
    'const IRAQI_GOVERNORATES =',
    'const EMPLOYEE_WORKPLACES =',
    'const UNIVERSITIES =',
    'const GAMES_DATA =',
    'async function uploadImageToStorage\\(',
    'function recordItemView\\(',
    'function handleUniversalShare\\(',
    'async function compressImage\\('
];

for (const thing of thingsToExport) {
    const regex = new RegExp('^' + thing, 'gm');
    content = content.replace(regex, match => 'export ' + match.replace('export ', ''));
}

fs.writeFileSync(appPath, content, 'utf-8');
console.log('Exported missing constants and functions from App.tsx');
