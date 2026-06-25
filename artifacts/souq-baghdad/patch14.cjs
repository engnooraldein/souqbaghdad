const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Transport Archival
// Replace: <button onClick={() => setShowConfirmModal({ id: line.id, action: line.type === 'request' ? 'found_line' : 'line_full' })}
const transportConfirmModalText = `
                <h3 className="text-xl font-bold text-white mb-2">
                  {showConfirmModal.action === 'found_line' ? 'هل حصلت على خط؟' : 'هل اكتمل الخط أو تم حجز المقاعد؟'}
                </h3>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  {showConfirmModal.action === 'found_line'
                    ? 'شكراً على استخدامك سوق بغداد! سيتم إخفاء إعلانك من قائمة الخطوط العامة. سيتم خزن إعلانك في قسم خطوطي ويمكنك إعادة فتح الإعلان في أي وقت.'
                    : 'إذا تم إغلاق الخط، سيتم إخفاء الإعلان من قائمة الخطوط العامة ونقله إلى قسم "مكتمل" داخل حسابك.'}
                </p>
`;
content = content.replace(
  /<h3 className="text-xl font-bold text-white mb-2">\s*\{showConfirmModal\.action === 'found_line' \? 'هل حصلت على خط؟' : 'هل اكتمل الخط أو تم حجز المقاعد؟'\}\s*<\/h3>\s*<p className="text-gray-400 text-sm mb-6 leading-relaxed">.*?<\/p>/s,
  transportConfirmModalText.trim()
);

// 2. Cover Watermark in Profile
const profileWatermark = `
          <img src={coverPreview} alt="Cover" className="relative w-full h-full object-cover z-0"/>
          {/* Watermark */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 opacity-60 select-none pointer-events-none drop-shadow-xl">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-900 rounded-lg flex items-center justify-center border border-amber-500/40">
              <span className="text-white font-bold text-[10px] sm:text-xs">سوك</span>
            </div>
            <span className="text-white font-bold text-xs sm:text-sm drop-shadow-md">سوك بغداد</span>
          </div>
`;
content = content.replace(
  /<img src=\{coverPreview\} alt="Cover" className="relative w-full h-full object-cover z-0"\/>/,
  profileWatermark.trim()
);

// Cover Watermark in SellerPublicPage
const publicWatermark = `
        <img 
          src={sellerUser?.cover || DEFAULT_COVER} 
          alt="Cover" 
          className="relative w-full h-full object-cover z-0"
        />
        {/* Watermark */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 opacity-60 select-none pointer-events-none drop-shadow-xl">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-900 rounded-lg flex items-center justify-center border border-amber-500/40">
            <span className="text-white font-bold text-[10px] sm:text-xs">سوك</span>
          </div>
          <span className="text-white font-bold text-xs sm:text-sm drop-shadow-md">سوك بغداد</span>
        </div>
`;
content = content.replace(
  /<img\s+src=\{sellerUser\?\.cover \|\| DEFAULT_COVER\}\s+alt="Cover"\s+className="relative w-full h-full object-cover z-0"\s*\/>/,
  publicWatermark.trim()
);


// 3. Delete Account in User Profile
const dangerZone = `
                {editing&&<div className="flex gap-3 pt-2">
                  <button onClick={handleSave} className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2"><Save className="w-4 h-4"/>حفظ التغييرات</button>
                  <button onClick={()=>setEditing(false)} className="px-4 py-3 bg-gray-700 text-gray-300 rounded-xl text-sm">إلغاء</button>
                </div>}
              </div>
              
              <div className="mt-8 pt-6 border-t border-red-500/20">
                <h4 className="text-red-400 font-bold mb-2 flex items-center gap-2"><Trash2 className="w-4 h-4"/> منطقة الخطر</h4>
                <p className="text-xs text-gray-500 mb-4">عند حذف حسابك، سيتم إزالة كافة إعلاناتك، منتجاتك، وبياناتك الشخصية بشكل نهائي ولا يمكن التراجع عن هذا الإجراء.</p>
                <button onClick={() => {
                  if(window.confirm('تنبيه: سيتم حذف حسابك نهائياً مع كافة إعلاناتك المرتبطة به. هل أنت متأكد؟')) {
                    handleDeleteProfile(user.id);
                    handleLogout();
                  }
                }} className="w-full sm:w-auto px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4"/> حذف حسابي نهائياً
                </button>
              </div>
            </div>
          </div>
`;
content = content.replace(
  /\{editing&&<div className="flex gap-3 pt-2">\s*<button onClick=\{handleSave\}.*?<\/button>\s*<button onClick=\{.*?<\/button>\s*<\/div>\}\s*<\/div>\s*<\/div>\s*<\/div>/,
  dangerZone.trim() + '\n        )}' // Note: adding back closing tags depending on match
);


// 4. Delete User in Owner Dashboard
// Right after <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0 flex-wrap">
const ownerDeleteBtn = `
                  <button onClick={() => alert('تفاصيل المستخدم: \\n' + JSON.stringify(u, null, 2))} className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl" title="معلومات المستخدم"><Eye className="w-4 h-4"/></button>
                  {u.role !== 'owner' && (
                    <button onClick={() => {
                      if(window.confirm('تنبيه: سيتم حذف هذا الحساب نهائياً مع كافة إعلاناته المرتبطة به. هل أنت متأكد؟')) {
                        handleDeleteProfile(u.id);
                        setStoredUsers(prev => prev.filter(usr => usr.id !== u.id));
                      }
                    }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 border bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20" title="حذف الحساب">
                      <Trash2 className="w-3.5 h-3.5"/> حذف الحساب
                    </button>
                  )}
`;
content = content.replace(
  /<button onClick=\{\(\) => alert\('تفاصيل المستخدم: \\n' \+ JSON\.stringify\(u, null, 2\)\)\} className="p-2 bg-blue-500\/20 text-blue-400 hover:bg-blue-500\/30 rounded-xl" title="معلومات المستخدم"><Eye className="w-4 h-4"\/><\/button>/,
  ownerDeleteBtn.trim()
);

fs.writeFileSync(file, content, 'utf8');
console.log('App.tsx patched successfully with 3 new features!');
