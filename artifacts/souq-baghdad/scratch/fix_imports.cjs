const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '../src/components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

for (const file of files) {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Add missing imports to the top if they are used but not imported
    const hasUseOnlineStatuses = content.includes('useOnlineStatuses');
    const hasUseRelativeTime = content.includes('useRelativeTime');
    const hasInterestTimer = content.includes('<InterestTimer');
    const hasTimeAgo = content.includes('<TimeAgo');
    const hasDefaultAvatar = content.includes('DEFAULT_AVATAR');
    const hasMyLinesTab = content.includes('<MyLinesTab');
    const hasXCircle = content.includes('<XCircle');

    let newImports = [];
    if (hasUseOnlineStatuses && !content.includes('import { useOnlineStatuses }')) {
        newImports.push(`import { useOnlineStatuses } from '../hooks/useOnlineStatuses';`); // assuming it's in hooks, but wait, was it in App?
    }
    if (hasUseRelativeTime && !content.includes('import { useRelativeTime }')) {
        // useRelativeTime might be in hooks too? Or App?
    }
    
    // Let's just fix ProfileView.tsx MyLinesTab import first
    if (file === 'ProfileView.tsx') {
        content = content.replace(/MyLinesTab(,?)/, '$1'); // remove from App import
        content = `import { MyLinesTab } from './MyLinesTab';\n` + content;
    }

    fs.writeFileSync(filePath, content, 'utf-8');
}
console.log('Fixed MyLinesTab in ProfileView');
