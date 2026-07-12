const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '../src/components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    let importsToInject = [];
    
    // Check if we need to add new App imports
    if (content.includes('import { CATEGORIES')) {
        content = content.replace(
            `import { CATEGORIES, IRAQI_GOVERNORATES, EMPLOYEE_WORKPLACES, UNIVERSITIES, uploadImageToStorage, recordItemView, handleUniversalShare, ViewersModal } from '../App';`,
            `import { CATEGORIES, IRAQI_GOVERNORATES, EMPLOYEE_WORKPLACES, UNIVERSITIES, uploadImageToStorage, recordItemView, handleUniversalShare, ViewersModal, LiveVisitorCounter, InfiniteScrollTrigger, GAMES_DATA, compressImage } from '../App';`
        );
    }
    
    if (content.includes('import { slugify')) {
        content = content.replace(
            `import { slugify, getWhatsAppLink, detectDevice, isNewItem, getWhatsAppResetLink, getGlowClass } from '../utils/helpers';`,
            `import { slugify, getWhatsAppLink, detectDevice, isNewItem, getWhatsAppResetLink, getGlowClass, getCoverImage } from '../utils/helpers';`
        );
    }
    
    if (content.includes('import { User, Ad, Product, TransportAd } from \'../types\';')) {
        content = content.replace(
            `import { User, Ad, Product, TransportAd } from '../types';`,
            `import { User, Ad, Product, TransportAd, SellerInfo } from '../types';`
        );
    }
    
    if (content.includes('import { \n  X, Heart,')) {
        content = content.replace(
            `} from 'lucide-react';`,
            `  FileText, Gamepad2, Copy, Crown, View, Eye as ViewIcon, \n} from 'lucide-react';`
        );
    }
    
    if (content.includes('import { TimeAgo } from \'./TimeAgo\';')) {
        content = content.replace(
            `import { TimeAgo } from './TimeAgo';`,
            `import { TimeAgo } from './TimeAgo';\nimport { MyLinesTab } from './MyLinesTab';\nimport { ImageCropModal } from './ImageCropModal';\nimport { PasswordChangeModal } from './PasswordChangeModal';\nimport { LoadingScreen } from './LoadingScreen';\nimport { TransportFormModal } from './TransportFormModal';`
        );
    }
    
    // Missing constants imports
    if (content.includes('DEFAULT_AVATAR') && !content.includes('DEFAULT_AVATAR\'') && !content.includes('import { DEFAULT_AVATAR')) {
        importsToInject.push(`import { DEFAULT_AVATAR, DEFAULT_COVER } from '../constants';`);
    }
    
    if (content.includes('useOnlineStatuses') && !content.includes('import { useOnlineStatuses')) {
        importsToInject.push(`import { useOnlineStatuses } from '../hooks/useOnlineStatuses';`);
    }

    if (importsToInject.length > 0) {
        content = importsToInject.join('\n') + '\n' + content;
    }

    fs.writeFileSync(filePath, content, 'utf-8');
}
console.log('Fixed imports in components.');
