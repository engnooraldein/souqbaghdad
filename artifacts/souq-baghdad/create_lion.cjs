const fs = require('fs');
const svg = fs.readFileSync('public/logo_traced.svg', 'utf8');
const match = svg.match(/d=\"([^\"]+)\"/);
if (match) {
  const d = match[1];
  const reactCode = `import React from 'react';\n\nexport const LionSvg = (props: React.SVGProps<SVGSVGElement>) => (\n  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" {...props}>\n    <path className="neon-stroke" d="${d}" fill="none" stroke="#BF9B30" strokeWidth="2" />\n  </svg>\n);\n`;
  fs.writeFileSync('src/components/LionSvg.tsx', reactCode);
  console.log('LionSvg.tsx created successfully');
} else {
  console.log('No path found');
}
