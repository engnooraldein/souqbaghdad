const fs = require('fs');
const appTsx = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = appTsx.split('\n');

// We have the exact line numbers from our previous script
// function AuthModal found from line 608 to 824
// function InfoDocsModal found from line 828 to 1140
// function ImageLightboxModal found from line 1145 to 1337
// function AdCard found from line 1342 to 1382

function extractComponent(name, startIdx, endIdx) {
  // Add missing imports (guesswork based on common usage)
  const imports = `import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronLeft, ChevronRight, Eye, Phone, Share2, ZoomIn, ZoomOut } from 'lucide-react';
import { getCoverImage, getWhatsAppResetLink } from '../utils/helpers';
// You might need to add missing type imports like User, Ad, etc.
`;

  const componentCode = lines.slice(startIdx, endIdx + 1).join('\n');
  const exportCode = `export { ${name} };\nexport default ${name};\n`;
  
  fs.writeFileSync(`src/components/${name}.tsx`, imports + '\n' + componentCode + '\n\n' + exportCode);
}

// We just copy them out first, without deleting them from App.tsx yet.
extractComponent('AuthModal', 607, 823);
extractComponent('InfoDocsModal', 827, 1139);
extractComponent('ImageLightboxModal', 1144, 1336);
// We will replace them in App.tsx by commenting them out or removing, and adding React.lazy

console.log("Components extracted!");
