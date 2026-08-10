const fs = require('fs');

const files = [
  'src/components/AdFormModal.tsx',
  'src/components/TransportFormModal.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace text-white with text-slate-800 dark:text-white
  content = content.replace(/text-white/g, 'text-slate-800 dark:text-white');
  
  // Replace text-gray-400 with text-slate-500 dark:text-gray-400
  content = content.replace(/text-gray-400/g, 'text-slate-500 dark:text-gray-400');
  
  // Replace text-gray-300 with text-slate-600 dark:text-gray-300
  content = content.replace(/text-gray-300/g, 'text-slate-600 dark:text-gray-300');
  
  // Replace bg-gray-950 with bg-white dark:bg-gray-950
  content = content.replace(/bg-gray-950/g, 'bg-white dark:bg-gray-950');
  
  // Replace bg-gray-900 with bg-slate-100 dark:bg-gray-900
  content = content.replace(/bg-gray-900/g, 'bg-slate-100 dark:bg-gray-900');
  
  // Replace border-gray-900 with border-slate-200 dark:border-gray-900
  content = content.replace(/border-gray-900/g, 'border-slate-200 dark:border-gray-900');
  
  // Replace border-gray-800 with border-slate-200 dark:border-gray-800
  content = content.replace(/border-gray-800/g, 'border-slate-200 dark:border-gray-800');

  // Fix specific hardcoded gradient in AdFormModal
  content = content.replace(/bg-gradient-to-b from-\[#0c1c38\] via-\[#071328\] to-\[#040b1a\]/g, 'bg-white/95 dark:bg-gradient-to-b dark:from-[#0c1c38] dark:via-[#071328] dark:to-[#040b1a]');

  // Fix the backdrops
  content = content.replace(/bg-slate-950\/80 backdrop-blur-sm/g, 'bg-slate-900/30 dark:bg-black/60 backdrop-blur-2xl');
  content = content.replace(/bg-gray-950\/80 backdrop-blur-md/g, 'bg-slate-900/30 dark:bg-black/60 backdrop-blur-2xl');
  
  // Fix the TransportFormModal container
  content = content.replace(/bg-gray-950\/95 border border-emerald-500\/30/g, 'bg-white/95 dark:bg-gray-950/95 border border-slate-200 dark:border-emerald-500/30');

  fs.writeFileSync(file, content, 'utf8');
});

console.log('Done replacing classes');
