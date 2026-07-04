const potrace = require('potrace'); 
const fs = require('fs'); 
potrace.trace('public/logo.jpg', { 
  threshold: 110, 
  optTolerance: 0.2, 
  turdSize: 50,
  alphaMax: 1,
  optCurve: true
}, function(err, svg) { 
  if (err) throw err; 
  let match = svg.match(/d=\"([^\"]+)\"/); 
  if(match) { 
    let d = match[1];
    // Remove the first few M ... components that might be the bounding box
    // A bounding box will likely have coordinates near 0 and 1024.
    // Let's split by 'M' and filter out paths that touch the edges.
    const subpaths = d.split('M').filter(p => p.trim() !== '');
    const cleanPaths = subpaths.filter(p => {
      // If it contains 1024 or 0 (with some padding), it's probably the border
      if (p.includes('1024') || p.includes('1023') || p.includes('0 0') || p.includes('1025')) {
        return false;
      }
      return true;
    });
    
    d = 'M' + cleanPaths.join('M');
    
    const code = `export const LionPath = "${d}";`; 
    fs.writeFileSync('src/components/LionPaths.ts', code); 
    console.log('Successfully extracted and cleaned paths'); 
  } 
});
