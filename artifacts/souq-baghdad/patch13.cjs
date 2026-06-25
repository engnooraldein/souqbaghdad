const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

// Fix React.useState and React.useEffect
content = content.replace(/React\.useState/g, 'useState');
content = content.replace(/React\.useEffect/g, 'useEffect');

// Fix AdCard type
content = content.replace(
  /onSellerClick\?:\(e:React\.MouseEvent\)=>void;/g,
  'onSellerClick?:(id:string)=>void;'
);

// Fix SellerPublicPage calls
// Line 3299 and 3312: `onSellerClick={(e) => { ... }}`
// I will find them using a generic regex:
content = content.replace(
  /onSellerClick=\{e=>\{e\.stopPropagation\(\);onSellerClick\(ad\);\}\}/g,
  'onSellerClick={()=>{onSellerClick(ad);}}'
);
content = content.replace(
  /onSellerClick=\{e=>\{e\.stopPropagation\(\);onSellerClick\(p\);\}\}/g,
  'onSellerClick={()=>{onSellerClick(p);}}'
);
// Actually, SellerPublicPage onSelectAd is taking `Ad` and `Product`. The error is on `onSellerClick`?
// Let's just fix the remaining generic errors safely.

fs.writeFileSync(file, content, 'utf8');
console.log('App.tsx final fixes applied!');
