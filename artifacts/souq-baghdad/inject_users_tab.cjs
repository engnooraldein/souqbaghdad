const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add state variables
const stateHookPos = content.indexOf('const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);');
if (stateHookPos > -1 && !content.includes('const [usersSearch')) {
  const insertState = `
  const [usersSearch, setUsersSearch] = useState('');
  const [usersFilter, setUsersFilter] = useState<'all'|'vendor'|'pro'|'admin'|'banned'>('all');
  const [usersSort, setUsersSort] = useState<'last_seen'|'newest'|'alphabetical'>('last_seen');
`;
  content = content.slice(0, stateHookPos + 69) + insertState + content.slice(stateHookPos + 69);
}

// 2. Replace tab==='users' render block
const tabUsersStart = content.indexOf('{tab===\'users\'&&(');
const tabContentStart = content.indexOf('{tab===\'content\'&&(');

if (tabUsersStart > -1 && tabContentStart > -1) {
  const replacement = `{tab==='users'&&(
          <div className="space-y-4">
            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 flex flex-col items-center">
                <span className="text-gray-400 text-xs mb-1">الكل</span>
                <span className="text-white font-bold text-lg">{dbUsers.length}</span>
              </div>
              <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20 flex flex-col items-center">
                <span className="text-green-400 text-xs mb-1">التجار</span>
                <span className="text-green-400 font-bold text-lg">{dbUsers.filter(u => u.role === 'vendor').length}</span>
              </div>
              <div className="bg-purple-500/10 rounded-xl p-3 border border-purple-500/20 flex flex-col items-center">
                <span className="text-purple-400 text-xs mb-1">برو</span>
                <span className="text-purple-400 font-bold text-lg">{dbUsers.filter(u => u.role === 'pro').length}</span>
              </div>
              <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20 flex flex-col items-center">
                <span className="text-red-400 text-xs mb-1">المحظورين</span>
                <span className="text-red-400 font-bold text-lg">{dbUsers.filter(u => u.is_banned).length}</span>
              </div>
            </div>

            {/* شريط البحث والفلاتر */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-3">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                  <input type="text" placeholder="ابحث عن مستخدم بالاسم، الهاتف، الايميل..." 
                    value={usersSearch} onChange={e => setUsersSearch(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg pl-3 pr-9 py-2 text-sm outline-none focus:border-amber-500" />
                </div>
                <select value={usersSort} onChange={e => setUsersSort(e.target.value as any)} className="bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500">
                  <option value="last_seen">آخر ظهور</option>
                  <option value="newest">تاريخ التسجيل</option>
                  <option value="alphabetical">أبجدياً</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'vendor', label: 'تجار موثقين', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
                  { id: 'pro', label: 'برو (Pro)', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
                  { id: 'admin', label: 'مدراء', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                  { id: 'banned', label: 'محظورين', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
                ].map(f => (
                  <button key={f.id} onClick={() => setUsersFilter(f.id as any)} 
                    className={\`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors \${usersFilter === f.id ? (f.color || 'bg-amber-500 text-black border-amber-500') : 'bg-gray-900 text-gray-400 border-gray-700 hover:bg-gray-800'}\`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedUserIds.length > 0 && (
               <div className="flex justify-between items-center bg-gray-800 p-3 rounded-xl border border-red-500/30 mb-3 flex-wrap gap-2">
                 <span className="text-red-400 font-bold text-sm">تم تحديد {selectedUserIds.length} حسابات</span>
                 <div className="flex gap-2">
                   <button onClick={async () => {
                      if (window.confirm(\`هل أنت متأكد من حظر \${selectedUserIds.length} حسابات؟\`)) {
                        for (const uid of selectedUserIds) {
                          try { await supabase.from('profiles').update({ is_banned: true }).eq('id', uid); } catch(e){}
                        }
                        setDbUsers(prev => prev.map(u => selectedUserIds.includes(u.id) ? { ...u, is_banned: true } : u));
                        setSelectedUserIds([]);
                      }
                   }} className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-red-500/30">
                      <UserX className="w-3.5 h-3.5"/> حظر جماعي
                   </button>
                   <button onClick={async () => {
                      if (window.confirm(\`هل أنت متأكد من حذف \${selectedUserIds.length} حسابات نهائياً؟\`)) {
                        for (const uid of selectedUserIds) {
                           if (onDeleteProfile) onDeleteProfile(uid);
                        }
                        setDbUsers(prev => prev.filter(u => !selectedUserIds.includes(u.id)));
                        setSelectedUserIds([]);
                      }
                   }} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-red-600">
                      <Trash2 className="w-3.5 h-3.5"/> حذف الكل
                   </button>
                 </div>
               </div>
            )}
            
            <div className="space-y-3">
            {(()=>{
              let filtered = dbUsers.filter(u => {
                if (usersFilter === 'vendor' && u.role !== 'vendor') return false;
                if (usersFilter === 'pro' && u.role !== 'pro') return false;
                if (usersFilter === 'admin' && u.role !== 'admin' && u.role !== 'owner') return false;
                if (usersFilter === 'banned' && !u.is_banned) return false;
                
                if (usersSearch) {
                  const s = usersSearch.toLowerCase();
                  const matchName = u.full_name?.toLowerCase().includes(s);
                  const matchPhone = u.phone?.toLowerCase().includes(s);
                  const matchEmail = u.email?.toLowerCase().includes(s);
                  if (!matchName && !matchPhone && !matchEmail) return false;
                }
                return true;
              });

              filtered.sort((a, b) => {
                if (usersSort === 'alphabetical') {
                  return (a.full_name || '').localeCompare(b.full_name || '', 'ar');
                } else if (usersSort === 'newest') {
                  return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                } else {
                  return new Date(b.last_seen || 0).getTime() - new Date(a.last_seen || 0).getTime();
                }
              });

              if (filtered.length === 0) return <div className="bg-gray-800 rounded-2xl p-10 text-center border border-gray-700"><Users className="w-12 h-12 text-gray-600 mx-auto mb-3"/><p className="text-gray-400">لا يوجد مستخدمون مطابقون</p></div>;

              return filtered.map(u=>{
              const isOnline = new Date().getTime() - new Date(u.last_seen || 0).getTime() < 5 * 60 * 1000;
              
              return (
              <div key={u.id} className={\`bg-gray-800 rounded-2xl p-4 border \${u.is_banned?'border-red-500/30':'border-gray-700'} flex items-center gap-3 flex-wrap relative\`}>
                {u.role !== 'owner' && (
                  <input type="checkbox" className="w-5 h-5 accent-red-500 rounded cursor-pointer hidden sm:block flex-shrink-0" checked={selectedUserIds.includes(u.id)} onChange={(e) => {
                    if (e.target.checked) setSelectedUserIds(prev => [...prev, u.id]);
                    else setSelectedUserIds(prev => prev.filter(id => id !== u.id));
                  }} />
                )}
                <div className="relative flex-shrink-0">
                  <img src={u.avatar_url || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100'} alt="" className={\`w-12 h-12 rounded-full object-cover border-2 \${u.is_banned?'border-red-500/50':'border-gray-600'}\`}/>
                  <div className={\`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-gray-800 \${isOnline ? 'bg-green-500' : 'bg-gray-500'}\`} title={isOnline ? 'متصل الآن' : 'غير متصل'}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {u.role !== 'owner' && (
                      <input type="checkbox" className="w-4 h-4 accent-red-500 rounded cursor-pointer sm:hidden flex-shrink-0" checked={selectedUserIds.includes(u.id)} onChange={(e) => {
                        if (e.target.checked) setSelectedUserIds(prev => [...prev, u.id]);
                        else setSelectedUserIds(prev => prev.filter(id => id !== u.id));
                      }} />
                    )}
                    <p className="text-white font-bold text-sm">{u.full_name}</p>
                    {u.is_banned&&<span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded-full font-bold">موقوف</span>}
                    {u.role==='owner'&&<span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded-full flex items-center gap-0.5"><Crown className="w-2.5 h-2.5"/>مالك</span>}
                    {u.role==='admin'&&<span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded-full flex items-center gap-0.5"><Shield className="w-2.5 h-2.5"/>مشرف</span>}
                    {u.role==='vendor'&&<span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full flex items-center gap-0.5"><UserCheck className="w-2.5 h-2.5"/>تاجر موثق</span>}
                    {u.role==='pro'&&<span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] rounded-full flex items-center gap-0.5"><Star className="w-2.5 h-2.5"/>برو</span>}
                  </div>
                  <p className="text-gray-400 text-xs">{u.email || u.phone}</p>
                  <p className="text-gray-500 text-[10px] mt-0.5">{u.city} • آخر ظهور: {u.last_seen ? new Date(u.last_seen).toLocaleString('ar-IQ') : 'غير معروف'}</p>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0 flex-wrap">
                  <button onClick={() => alert('تفاصيل المستخدم: \\n' + JSON.stringify(u, null, 2))} className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl" title="معلومات المستخدم"><Eye className="w-4 h-4"/></button>
                  {u.role !== 'owner' && (
                    <button onClick={() => {
                      if(window.confirm('تنبيه: سيتم حذف هذا الحساب نهائياً مع كافة إعلاناته المرتبطة به. هل أنت متأكد؟')) {
                        if(onDeleteProfile) onDeleteProfile(u.id);
                        setDbUsers(prev => prev.filter(usr => usr.id !== u.id));
                      }
                    }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 border bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20" title="حذف الحساب">
                      <Trash2 className="w-3.5 h-3.5"/> حذف الحساب
                    </button>
                  )}
                  {u.role !== 'owner' && (
                    <select 
                      value={u.role || 'user'} 
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className="bg-gray-900 border border-gray-700 text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:border-amber-500"
                    >
                      <option value="user">مستخدم عادي</option>
                      <option value="vendor">تاجر موثق</option>
                      <option value="admin">مشرف منصة</option>
                      <option value="pro">برو (Pro)</option>
                    </select>
                  )}
                  {u.role !== 'owner' && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={async () => {
                          if(confirm('هل أنت متأكد من إعادة تعيين كلمة المرور إلى 123456؟')) {
                            try {
                              const { error } = await supabase.rpc('admin_reset_password', { target_user_id: u.id, new_password: '123456' });
                              if(error) throw error;
                              alert('تم تغيير كلمة المرور بنجاح إلى: 123456');
                            } catch(e) {
                              alert('فشل في إعادة التعيين: ' + e.message);
                            }
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 border bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                      >
                        <Key className="w-3.5 h-3.5"/> تصفير الرمز (123456)
                      </button>
                      {u.phone && (
                        <a 
                          href={getWhatsAppResetLink(u.phone)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 border bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
                          title="إرسال رسالة واتساب بالتفاصيل الجديدة"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg> واتساب
393:                         </a>
394:                       )}
395:                     </div>
396:                   )}
397:                   {u.role!=='owner'&&<button onClick={()=>toggleBan(u.id)} className={\`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 border \${u.is_banned?'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20':'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'}\`}>
398:                     {u.is_banned?<><UserCheck className="w-3.5 h-3.5"/>رفع الإيقاف</>:<><UserX className="w-3.5 h-3.5"/>حظر</>}</button>}
399:                 </div>
400:               </div>
401:               );
402:               })
403:             })()}
404:             </div>
405:           </div>
406:         )}
`;
  content = content.slice(0, tabUsersStart) + replacement + content.slice(tabContentStart);
  fs.writeFileSync('src/App.tsx', content);
  console.log('Successfully updated users tab!');
} else {
  console.log('Failed to find boundaries:', tabUsersStart, tabContentStart);
}
