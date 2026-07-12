const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '../src/App.tsx');
let content = fs.readFileSync(appPath, 'utf-8');

const regexes = [
  // TimeAgo leftover
  /: \{ iso:string; className\?:string \}\) \{\s*return <span className=\{className\}>\{useRelativeTime\(iso\)\}<\/span>;\s*\}/,
  
  // AdCard leftover
  /:\{\s*ad:Ad; onSelect:\(\)=>void; isFav:boolean; onFav:\(e:React\.MouseEvent\)=>void; onSellerClick\?:\(id:string\)=>void; onActionMenu\?:\(e:React\.MouseEvent\)=>void;\s*sellerRole\?: string;\s*\}\) \{[\s\S]*?className="p-3 flex-1 flex flex-col"[\s\S]*?<\/motion\.div>\s*\}/,

  // ProductCard leftover
  /:\{\s*product:Product; onSelect:\(\)=>void; isFav:boolean; onFav:\(e:React\.MouseEvent\)=>void; onSellerClick\?:\(id:string\)=>void; onActionMenu\?:\(e:React\.MouseEvent\)=>void;\s*sellerRole\?: string;\s*\}\) \{[\s\S]*?className="p-3 flex-1 flex flex-col"[\s\S]*?<\/motion\.div>\s*\}/,

  // TransportAdCard leftover
  /: \{ ad: TransportAd, onSelect: \(\) => void, onActionMenu\?: \(e: any\) => void, onShare\?: \(\) => void, seller\?: any \}\) \{[\s\S]*?className="p-4 pt-6"[\s\S]*?<\/motion\.div>\s*\}/
];

let modified = false;

for (let i = 0; i < regexes.length; i++) {
  const match = content.match(regexes[i]);
  if (match) {
    content = content.replace(regexes[i], '');
    console.log(`Matched and removed leftover ${i + 1}`);
    modified = true;
  } else {
    console.log(`Could not find leftover ${i + 1}`);
  }
}

if (modified) {
  fs.writeFileSync(appPath, content, 'utf-8');
  console.log("Successfully cleaned up.");
}
