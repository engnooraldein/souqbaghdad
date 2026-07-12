const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // If the file uses `import { ... } from 'lucide-react';` we need `Eye as ViewIcon`
    // If the file uses `const { ... } = LucideIcons;` we need `Eye: ViewIcon`

    if (content.includes("from 'lucide-react'")) {
        content = content.replace(/Eye: ViewIcon/g, 'Eye as ViewIcon');
        content = content.replace(/Phone: PhoneIcon/g, 'Phone as PhoneIcon');
        content = content.replace(/Image: ImageIcon/g, 'Image as ImageIcon');
        content = content.replace(/User: UserIcon/g, 'User as UserIcon');
    }

    if (content.includes("= LucideIcons;")) {
        content = content.replace(/Eye as ViewIcon/g, 'Eye: ViewIcon');
        content = content.replace(/Phone as PhoneIcon/g, 'Phone: PhoneIcon');
        content = content.replace(/Image as ImageIcon/g, 'Image: ImageIcon');
        content = content.replace(/User as UserIcon/g, 'User: UserIcon');
    }

    fs.writeFileSync(filePath, content, 'utf-8');
}

console.log('Fixed syntax in all components.');
