const potrace = require('potrace'); 
const fs = require('fs'); 
potrace.trace('public/logo.jpg', { 
  threshold: 110, 
  optTolerance: 0.2, 
  turdSize: 30,
  alphaMax: 1,
  optCurve: true
}, function(err, svg) { 
  if (err) throw err; 
  fs.writeFileSync('public/logo_traced_hq.svg', svg);
  const match = svg.match(/d=\"([^\"]+)\"/); 
  if(match) { 
    const code = `export const LionPath = "${match[1]}";`; 
    fs.writeFileSync('src/components/LionPaths.ts', code); 
    console.log('Successfully extracted paths'); 
  } 
});
