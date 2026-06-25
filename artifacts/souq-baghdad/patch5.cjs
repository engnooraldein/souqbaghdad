const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const DEVICE_COLORS = \['#f59e0b','#3b82f6','#8b5cf6'\];\s*const DEVICE_COLORS = \['#f59e0b','#3b82f6','#8b5cf6'\];/g, "const DEVICE_COLORS = ['#f59e0b','#3b82f6','#8b5cf6'];");

fs.writeFileSync(file, content, 'utf8');
console.log('Duplicate DEVICE_COLORS removed successfully');
