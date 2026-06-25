const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

// AdDetailModal fix
content = content.replace(/function AdDetailModal\(\{[^}]+\}\:\{[^\}]+\}\)\s*\{/m, (match) => {
  return match + '\n  const onlineStatuses = useOnlineStatuses();';
});

// ProductDetailModal fix
content = content.replace(/function ProductDetailModal\(\{[^}]+\}\:\{[^\}]+\}\)\s*\{/m, (match) => {
  return match + '\n  const onlineStatuses = useOnlineStatuses();';
});

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed useOnlineStatuses in AdDetailModal and ProductDetailModal');
