const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

// 8. Restore DEVICE_COLORS
content = content.replace(/const deviceData/g, "const DEVICE_COLORS = ['#f59e0b','#3b82f6','#8b5cf6'];\n  const deviceData");

fs.writeFileSync(file, content, 'utf8');
console.log('App.tsx patched successfully');
