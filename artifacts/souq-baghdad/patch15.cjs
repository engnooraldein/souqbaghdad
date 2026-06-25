const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add onDeleteProfile to OwnerDashboard props signature
content = content.replace(
  /function OwnerDashboard\(\{ ads, products, transportAds, onDeleteAd, onDeleteProduct, onDeleteTransportAd, onClose \}: \{/,
  'function OwnerDashboard({ ads, products, transportAds, onDeleteAd, onDeleteProduct, onDeleteTransportAd, onClose, onDeleteProfile }: {'
);

// Add to the TypeScript interface of OwnerDashboard
content = content.replace(
  /onDeleteTransportAd:\(id:number\)=>void;\n\s*onClose:\(\)=>void;\n\}\) \{/,
  'onDeleteTransportAd:(id:number)=>void;\n  onClose:()=>void;\n  onDeleteProfile?:(id:string)=>void;\n}) {'
);

// Fallback in case of \r\n
content = content.replace(
  /onDeleteTransportAd:\(id:number\)=>void;\r\n\s*onClose:\(\)=>void;\r\n\}\) \{/,
  'onDeleteTransportAd:(id:number)=>void;\r\n  onClose:()=>void;\r\n  onDeleteProfile?:(id:string)=>void;\r\n}) {'
);

// Fix handleDeleteProfile call inside OwnerDashboard
content = content.replace(
  /handleDeleteProfile\(u\.id\);/g,
  'if(onDeleteProfile) onDeleteProfile(u.id);'
);

// Add the prop when OwnerDashboard is rendered
content = content.replace(
  /<OwnerDashboard ads=\{allAds\} products=\{allProducts\} transportAds=\{allTransportAds\} onDeleteAd=\{handleDeleteAd\} onDeleteProduct=\{handleDeleteProduct\} onDeleteTransportAd=\{handleDeleteTransportAd\} onClose=\{\(\)=>setShowOwnerDashboard\(false\)\}\/>/,
  '<OwnerDashboard ads={allAds} products={allProducts} transportAds={allTransportAds} onDeleteAd={handleDeleteAd} onDeleteProduct={handleDeleteProduct} onDeleteTransportAd={handleDeleteTransportAd} onClose={()=>setShowOwnerDashboard(false)} onDeleteProfile={handleDeleteProfile}/>'
);


fs.writeFileSync(file, content, 'utf8');
console.log('App.tsx patched successfully for OwnerDashboard!');
