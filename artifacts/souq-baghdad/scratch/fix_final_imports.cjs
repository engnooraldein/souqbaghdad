const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '../src/components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const componentName = file.replace('.tsx', '');
    
    // 1. Remove getCoverImage from helpers import
    content = content.replace(/, getCoverImage \} from '\.\.\/utils\/helpers';/g, "} from '../utils/helpers';");
    content = content.replace(/getCoverImage, /g, "");

    // 2. Add getCoverImage to constants import
    if (!content.includes('getCoverImage } from \'../constants\'')) {
        content = content.replace(
            `import { DEFAULT_AVATAR, DEFAULT_COVER } from '../constants';`,
            `import { DEFAULT_AVATAR, DEFAULT_COVER, getCoverImage } from '../constants';`
        );
        content = content.replace(
            `import { DEFAULT_AVATAR } from '../constants';`,
            `import { DEFAULT_AVATAR, getCoverImage } from '../constants';`
        );
    }
    
    // 3. Remove LiveVisitorCounter, InfiniteScrollTrigger from App import
    content = content.replace(/, LiveVisitorCounter, InfiniteScrollTrigger/g, "");
    
    // 4. Add them as default imports if used
    let newImports = [];
    if (content.includes('<LiveVisitorCounter')) {
        if (!content.includes('import LiveVisitorCounter')) {
            newImports.push(`import LiveVisitorCounter from './LiveVisitorCounter';`);
        }
    }
    if (content.includes('<InfiniteScrollTrigger')) {
        if (!content.includes('import InfiniteScrollTrigger')) {
            newImports.push(`import InfiniteScrollTrigger from './InfiniteScrollTrigger';`);
        }
    }
    
    // 5. Fix self imports
    const selfImportRegex = new RegExp(`import \\{ ${componentName} \\} from '\\.\\/${componentName}';\\n?`, 'g');
    content = content.replace(selfImportRegex, '');

    // 6. Fix MyLinesTab
    // MyLinesTab is actually in App.tsx right now. We will export it from App.tsx and import it.
    // Wait, let's just export it from App.tsx.
    content = content.replace(/import \{ MyLinesTab \} from '\.\/MyLinesTab';\n?/g, '');
    if (content.includes('<MyLinesTab')) {
        content = content.replace(
            /\} from '\.\.\/App';/,
            `, MyLinesTab } from '../App';`
        );
    }
    
    // Add new imports after the last import
    if (newImports.length > 0) {
        content = newImports.join('\n') + '\n' + content;
    }

    fs.writeFileSync(filePath, content, 'utf-8');
}
console.log('Fixed imports in components phase 6 issues.');
