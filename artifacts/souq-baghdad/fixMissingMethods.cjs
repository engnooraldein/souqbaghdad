const fs = require('fs');

const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

// Fix handleInstallClick
code = code.replace(/handlePwaInstall=\{handlePwaInstall\}/g, 'handleInstallClick={() => setShowInstallGuide(true)}');
code = code.replace(/handleInstallClick=\{handleInstallClick\}/g, 'handleInstallClick={() => setShowInstallGuide(true)}');

// Fix myAds and myProducts
code = code.replace(/myAds=\{myAds\}/g, 'myAds={allAds.filter(a => a.postedBy === user?.id)}');
code = code.replace(/myProducts=\{myProducts\}/g, 'myProducts={allProducts.filter(p => p.postedBy === user?.id)}');

// Fix handleDeleteProfile
if (!code.includes('const handleDeleteProfile')) {
  const replacement = `  const handleDeleteProfile = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الحساب نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      // Server-side logic should handle actual auth deletion if possible, or trigger cloud function
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      showToast('تم حذف الحساب بنجاح', 'success');
      setView('home');
    } catch (err: any) {
      console.error(err);
      showToast('حدث خطأ أثناء الحذف', 'error');
    }
  };

  const handleViewDurationLogged = async (itemId: number | string, itemTitle: string, ownerId: string, itemType: string, seconds: number) => {
    // Disabled to stop heavy DB bandwidth usage and save egress costs
    return;
  };

  const handleSellerClick =`;
  code = code.replace('  const handleSellerClick =', replacement);
}

fs.writeFileSync(path, code);
console.log('Fixed missing methods in App.tsx');
