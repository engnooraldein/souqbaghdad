const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. DEFAULT_COVER to '/logo.jpg' and add getCoverImage
content = content.replace(
  /const DEFAULT_COVER\s*=\s*'https:\/\/images\.unsplash\.com[^']+';/,
  `const DEFAULT_COVER = '/logo.jpg';\n\nexport const getCoverImage = (user: {role?: string, cover?: string}) => {\n  if (['pro', 'vendor', 'admin', 'owner'].includes(user?.role || '')) {\n    return user?.cover || DEFAULT_COVER;\n  }\n  return DEFAULT_COVER;\n};`
);

// 2. Profile View Cover
content = content.replace(
  /const \[coverPreview, setCoverPreview\] = useState\(user\.cover\|\|DEFAULT_COVER\);/,
  `const [coverPreview, setCoverPreview] = useState(getCoverImage(user));`
);

// 3. Edit Cover logic in Profile View
content = content.replace(
  /\{editing&&<label className="absolute top-4 left-4 flex items-center gap-1\.5 px-3 py-1\.5 bg-black\/60 text-white text-xs rounded-xl cursor-pointer hover:bg-black\/80 backdrop-blur-md z-20">\s*<Camera className="w-4 h-4"\/> تغيير الغلاف\s*<input type="file" accept="image\/\*" onChange=\{e=>openCrop\(e,'cover'\)\} className="hidden"\/><\/label>\}/,
  `{editing && ['pro','vendor','admin','owner'].includes(user.role) && <label className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 text-white text-xs rounded-xl cursor-pointer hover:bg-black/80 backdrop-blur-md z-20">
            <Camera className="w-4 h-4"/> تغيير الغلاف
            <input type="file" accept="image/*" onChange={e=>openCrop(e,'cover')} className="hidden"/></label>}`
);

// 4. SellerPublicPage Cover
content = content.replace(
  /\{seller\.cover \? \(\s*<img src=\{seller\.cover\} alt="سوق بغداد" className="w-full h-full object-cover" \/>\s*\) : \(\s*<img src="\/logo\.jpg" alt="سوق بغداد" className="w-full h-full object-cover" \/>\s*\)\}/,
  `<img src={getCoverImage(seller as any)} alt="سوق بغداد" className="w-full h-full object-cover blur-xl opacity-30 absolute inset-0 scale-110"/>
          <img src={getCoverImage(seller as any)} alt="سوق بغداد" className="w-full h-full object-cover relative z-10" />`
);

// 5. handleDeleteProfile
content = content.replace(
  /const handleDeleteProfile = async \(profileId: string\) => \{[\s\S]*?showToast\('تم حذف الملف الشخصي وجميع محتوياته', 'success'\);\s*setView\('home'\);\s*\};/,
  `const handleDeleteProfile = async (profileId: string) => {
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
  };`
);

// 6. OwnerDashboard Multi-delete state
content = content.replace(
  /const \[visits, setVisits\] = useState<Visit\[\]>\(\[\]\);/,
  `const [visits, setVisits] = useState<Visit[]>([]);\n  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);`
);

// 7. OwnerDashboard users list checkboxes and multi-delete button
content = content.replace(
  /\{storedUsers\.map\(u=>\{\s*return \(\s*<div key=\{u\.id\} className="bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-700 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 relative">\s*<div className="relative">/,
  `{selectedUserIds.length > 0 && (
               <div className="flex justify-between items-center bg-gray-800 p-3 rounded-xl border border-red-500/30 mb-3">
                 <span className="text-red-400 font-bold">تم تحديد {selectedUserIds.length} حسابات</span>
                 <button onClick={async () => {
                    if (window.confirm(\`هل أنت متأكد من حذف \${selectedUserIds.length} حسابات نهائياً؟ لا يمكن التراجع عن هذا الإجراء.\`)) {
                      for (const uid of selectedUserIds) {
                         if (onDeleteProfile) onDeleteProfile(uid);
                      }
                      setStoredUsers(prev => prev.filter(u => !selectedUserIds.includes(u.id)));
                      setSelectedUserIds([]);
                    }
                 }} className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-600">
                    <Trash2 className="w-4 h-4"/> حذف الكل
                 </button>
               </div>
            )}
            {storedUsers.map(u=>{
              return (
                <div key={u.id} className="bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-700 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 relative">
                  {u.role !== 'owner' && (
                    <input type="checkbox" className="w-5 h-5 accent-red-500 rounded cursor-pointer hidden sm:block flex-shrink-0" checked={selectedUserIds.includes(u.id)} onChange={(e) => {
                      if (e.target.checked) setSelectedUserIds(prev => [...prev, u.id]);
                      else setSelectedUserIds(prev => prev.filter(id => id !== u.id));
                    }} />
                  )}
                  <div className="relative">`
);

content = content.replace(
  /<div className="flex flex-col">\s*<span className="text-white font-bold text-sm sm:text-base">\{u\.name\|\|'مستخدم'\} \{u\.role==='pro'\?'🌟':u\.role==='vendor'\?'🏪':''\}<\/span>/,
  `<div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        {u.role !== 'owner' && (
                          <input type="checkbox" className="w-4 h-4 accent-red-500 rounded cursor-pointer sm:hidden flex-shrink-0" checked={selectedUserIds.includes(u.id)} onChange={(e) => {
                            if (e.target.checked) setSelectedUserIds(prev => [...prev, u.id]);
                            else setSelectedUserIds(prev => prev.filter(id => id !== u.id));
                          }} />
                        )}
                        <span className="text-white font-bold text-sm sm:text-base">{u.name||'مستخدم'} {u.role==='pro'?'🌟':u.role==='vendor'?'🏪':''}</span>
                      </div>`
);

fs.writeFileSync(file, content, 'utf8');
console.log('App.tsx patched with deletion fixes and multi-delete');
