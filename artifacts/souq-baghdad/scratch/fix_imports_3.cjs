const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '../src/App.tsx');
let appContent = fs.readFileSync(appPath, 'utf-8');
appContent = appContent.replace(/^const DEFAULT_AVATAR =/m, 'export const DEFAULT_AVATAR =');
fs.writeFileSync(appPath, appContent, 'utf-8');


const componentsDir = path.join(__dirname, '../src/components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

for (const file of files) {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    let importsToAdd = [];

    // Check usage
    if (content.includes('useOnlineStatuses') && !content.includes('import { useOnlineStatuses }')) {
        importsToAdd.push(`import { useOnlineStatuses } from '../hooks/useOnlineStatuses';`);
    }
    if (content.includes('useRelativeTime') && !content.includes('import { useRelativeTime }')) {
        importsToAdd.push(`import { useRelativeTime } from '../utils/time';`);
    }
    if (content.includes('<InterestTimer') && !content.includes('import { InterestTimer }')) {
        importsToAdd.push(`import { InterestTimer } from './InterestTimer';`);
    }
    if (content.includes('<TimeAgo') && !content.includes('import { TimeAgo }')) {
        importsToAdd.push(`import { TimeAgo } from './TimeAgo';`);
    }
    if (content.includes('DEFAULT_AVATAR') && !content.includes('DEFAULT_AVATAR } from')) {
        // Find existing App import
        if (content.match(/import\s+{([^}]*)}\s+from\s+['"]\.\.\/App['"]/)) {
            content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]\.\.\/App['"]/, (match, p1) => {
                if (p1.includes('DEFAULT_AVATAR')) return match;
                return `import { ${p1.trim() ? p1.trim() + ', ' : ''}DEFAULT_AVATAR } from '../App'`;
            });
        } else {
            importsToAdd.push(`import { DEFAULT_AVATAR } from '../App';`);
        }
    }
    if (content.includes('<XCircle') && !content.includes('XCircle } from')) {
        if (content.match(/import\s+{([^}]*)}\s+from\s+['"]lucide-react['"]/)) {
            content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]lucide-react['"]/, (match, p1) => {
                if (p1.includes('XCircle')) return match;
                return `import { ${p1.trim() ? p1.trim() + ', ' : ''}XCircle } from 'lucide-react'`;
            });
        } else {
            importsToAdd.push(`import { XCircle } from 'lucide-react';`);
        }
    }

    if (importsToAdd.length > 0) {
        content = importsToAdd.join('\n') + '\n' + content;
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
}
console.log('Fixed imports in components');
