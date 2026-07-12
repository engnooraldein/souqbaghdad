const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '../src/App.tsx');
let sourceCode = fs.readFileSync(appPath, 'utf-8');

const sourceFile = ts.createSourceFile(
    'App.tsx',
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
);

const componentsToRemove = [
    'AdDetailModal',
    'ProductDetailModal',
    'MyLinesTab',
    'OnboardingModal',
    'CongratulationsModal',
    'SkeletonCard',
    'AdCard',
    'ProductCard',
    'TransportAdCard',
    'InterestTimer',
    'TimeAgo',
    'Logo',
    'Toast'
];

let extractions = [];

ts.forEachChild(sourceFile, node => {
    if (ts.isFunctionDeclaration(node) && node.name) {
        const name = node.name.text;
        if (componentsToRemove.includes(name)) {
            const start = node.getStart(sourceFile);
            const end = node.getEnd();
            extractions.push({ name, start, end });
        }
    }
});

if (extractions.length === 0) {
    console.log('No components found to remove.');
    process.exit(0);
}

// Sort in reverse order to splice safely
extractions.sort((a, b) => b.start - a.start);

let importsToAdd = [];

for (const ext of extractions) {
    // Remove from App.tsx
    sourceCode = sourceCode.substring(0, ext.start) + sourceCode.substring(ext.end);
    
    // Schedule import
    importsToAdd.push(`import { ${ext.name} } from './components/${ext.name}';`);
    
    console.log(`Successfully removed ${ext.name}`);
}

// Prepend imports
sourceCode = importsToAdd.reverse().join('\n') + '\n' + sourceCode;

fs.writeFileSync(appPath, sourceCode, 'utf-8');
console.log('All removals complete.');
