const fs = require('fs');

const appTsxPath = 'src/App.tsx';
const lines = fs.readFileSync(appTsxPath, 'utf-8').split('\n');

const componentsToExtract = [
  { name: 'AuthModal', start: 607, end: 823 },
  { name: 'InfoDocsModal', start: 827, end: 1139 },
  { name: 'ImageLightboxModal', start: 1144, end: 1336 },
];

let newAppTsxLines = [...lines];

// Replace the lines with empty strings from bottom to top to avoid shifting indexes
componentsToExtract.sort((a, b) => b.start - a.start).forEach(comp => {
  // Replace the component body with empty lines so we don't mess up later indexes
  for (let i = comp.start; i <= comp.end; i++) {
    newAppTsxLines[i] = '';
  }
});

// Now we need to add the lazy imports at the top. Let's find the first lazy import line and add ours there.
let lazyImportIndex = newAppTsxLines.findIndex(line => line.includes('lazy(() =>'));
if (lazyImportIndex === -1) lazyImportIndex = 12; // fallback

const lazyImports = componentsToExtract.map(comp => 
  `const ${comp.name} = lazy(() => import('./components/${comp.name}').then(m => ({ default: m.default })));`
).join('\n');

newAppTsxLines.splice(lazyImportIndex, 0, lazyImports);

fs.writeFileSync(appTsxPath, newAppTsxLines.join('\n'));
console.log("App.tsx modified and lazy imports added!");
