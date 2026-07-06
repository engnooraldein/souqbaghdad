const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

const target = `{view==='owner'&&isOwner&&<motion.div key="owner" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>\r\n            <OwnerDashboard ads={allAds} products={allProducts} transportAds={allTransportAds} onDeleteAd={handleDeleteAd} onDeleteProduct={handleDeleteProduct} onDeleteTransportAd={handleDeleteTransportAd} onClose={()=>setView('home')} onDeleteProfile={handleDeleteProfile}/></motion.div>}`;
const targetLF = `{view==='owner'&&isOwner&&<motion.div key="owner" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>\n            <OwnerDashboard ads={allAds} products={allProducts} transportAds={allTransportAds} onDeleteAd={handleDeleteAd} onDeleteProduct={handleDeleteProduct} onDeleteTransportAd={handleDeleteTransportAd} onClose={()=>setView('home')} onDeleteProfile={handleDeleteProfile}/></motion.div>}`;

const replacement = `{view==='owner'&&isOwner&&<motion.div key="owner" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>\n            <Suspense fallback={<LoadingScreen />}>\n              <OwnerDashboard ads={allAds} products={allProducts} transportAds={allTransportAds} onDeleteAd={handleDeleteAd} onDeleteProduct={handleDeleteProduct} onDeleteTransportAd={handleDeleteTransportAd} onClose={()=>setView('home')} onDeleteProfile={handleDeleteProfile}/>\n            </Suspense></motion.div>}`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(appPath, content, 'utf8');
  console.log("Successfully wrapped OwnerDashboard in Suspense (CRLF)!");
} else if (content.includes(targetLF)) {
  content = content.replace(targetLF, replacement);
  fs.writeFileSync(appPath, content, 'utf8');
  console.log("Successfully wrapped OwnerDashboard in Suspense (LF)!");
} else {
  console.error("Could not find OwnerDashboard rendering target in App.tsx!");
  // Let's do a more robust substring matching if needed
  const startKeyword = "view==='owner'&&isOwner";
  const endKeyword = "onDeleteProfile={handleDeleteProfile}/></motion.div>}";
  const sIdx = content.indexOf(startKeyword);
  const eIdx = content.indexOf(endKeyword);
  if (sIdx !== -1 && eIdx !== -1) {
    const fullTarget = content.substring(sIdx - 11, eIdx + endKeyword.length);
    console.log("Found robust target:", fullTarget);
    const robustReplacement = `{view==='owner'&&isOwner&&<motion.div key="owner" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>\n            <Suspense fallback={<LoadingScreen />}>\n              <OwnerDashboard ads={allAds} products={allProducts} transportAds={allTransportAds} onDeleteAd={handleDeleteAd} onDeleteProduct={handleDeleteProduct} onDeleteTransportAd={handleDeleteTransportAd} onClose={()=>setView('home')} onDeleteProfile={handleDeleteProfile}/>\n            </Suspense></motion.div>}`;
    content = content.replace(fullTarget, robustReplacement);
    fs.writeFileSync(appPath, content, 'utf8');
    console.log("Successfully replaced with robust method!");
  } else {
    process.exit(1);
  }
}
