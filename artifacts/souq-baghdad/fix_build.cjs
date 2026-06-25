const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');
const oldFunc = `  const handleDeleteProfile = async (profileId: string) => {
    // Delete all user content
    await supabase.from('ads').delete().eq('seller_id', profileId);
    setAllAds(prev => prev.filter(a => a.postedBy !== profileId));
    
    setAllTransportAds(prev => prev.filter(a => a.postedBy !== profileId));
    
    await supabase.from('products').delete().eq('seller_id', profileId);
    setAllProducts(prev => prev.filter(p => p.postedBy !== profileId));

    // Delete user from profiles table
    await supabase.from('profiles').delete().eq('id', profileId);

    try {
      const users = JSON.parse(localStorage.getItem('souqUsers') || '[]');
      const filtered = users.filter((u: any) => u.id !== profileId);
      localStorage.setItem('souqUsers', JSON.stringify(filtered));
    } catch (e) {}

    // Only redirect and logout if the current user deletes their own account
    if (user?.id === profileId) {
      showToast('تم حذف حسابك وجميع محتوياته بنجاح', 'success');
      setView('home');
      handleLogout();
    } else {
      showToast('تم حذف الحساب ومحتوياته نهائياً', 'success');
    }
  };`;

c = c.replace(oldFunc, '');
fs.writeFileSync('src/App.tsx', c);
