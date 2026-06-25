const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add getWhatsAppResetLink just before OwnerDashboard
const funcCode = `
const getWhatsAppResetLink = (phone: string) => {
  if (!phone) return '#';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('07')) clean = '964' + clean.slice(1);
  else if (clean.startsWith('7')) clean = '964' + clean;
  const msg = \`🌟 *أهلاً بك في سوق بغداد - السوق الرقمي العراقي*\\n\\nتم تصفير كلمة سر حسابك بنجاح.\\n🔑 الرمز السري الجديد هو: *123456*\\n\\n💡 *ملاحظة:* يمكنك تغيير كلمة السر في أي وقت من خلال:\\n(حسابي الشخصي > الملف الشخصي > قسم الحساب).\\n\\nشكراً لاستخدامك منصتنا، ونتمنى لك تجربة تسوق رائعة! 🛒\\n🌐 رابط الموقع: www.souqbaghdad.store\`;
  return \`https://wa.me/\${clean}?text=\${encodeURIComponent(msg)}\`;
};

function OwnerDashboard({ ads, products, transportAds, onDeleteAd, onDeleteProduct, onDeleteTransportAd, onClose, onDeleteProfile }: {`;

content = content.replace(/function OwnerDashboard\(\{ ads, products, transportAds, onDeleteAd, onDeleteProduct, onDeleteTransportAd, onClose, onDeleteProfile \}: \{/g, funcCode);

// 2. Add WhatsApp icon button next to "تصفير الرمز" in Users List
const resetBtnRegex = /\{\s*u\.role !== 'owner' && \(\s*<button\s*onClick=\{async \(\) => \{\s*if\(confirm\('هل أنت متأكد من إعادة تعيين كلمة المرور إلى 123456؟'\)\) \{\s*try \{\s*const \{ error \} = await supabase\.rpc\('admin_reset_password', \{ target_user_id: u\.id, new_password: '123456' \}\);\s*if\(error\) throw error;\s*alert\('تم تغيير كلمة المرور بنجاح إلى: 123456'\);\s*\} catch\(e:any\) \{\s*alert\('فشل في إعادة التعيين: ' \+ e\.message\);\s*\}\s*\}\s*\}\}\s*className="flex items-center gap-1 px-3 py-1\.5 rounded-lg text-xs font-bold flex-shrink-0 border bg-amber-500\/10 border-amber-500\/20 text-amber-400 hover:bg-amber-500\/20"\s*>\s*<Key className="w-3\.5 h-3\.5"\/> تصفير الرمز \(123456\)\s*<\/button>\s*\)\}/g;

const newResetBtn = `{u.role !== 'owner' && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={async () => {
                          if(confirm('هل أنت متأكد من إعادة تعيين كلمة المرور إلى 123456؟')) {
                            try {
                              const { error } = await supabase.rpc('admin_reset_password', { target_user_id: u.id, new_password: '123456' });
                              if(error) throw error;
                              alert('تم تغيير كلمة المرور بنجاح إلى: 123456');
                            } catch(e:any) {
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
                        </a>
                      )}
                    </div>
                  )}`;

content = content.replace(resetBtnRegex, newResetBtn);

// 3. Update WhatsApp link in Recovery requests tab
const oldRecoveryLink = /<a href=\{`https:\/\/wa\.me\/\$\{req\.profiles\.phone\.replace\(\/\[\^0-9\]\/g, ''\)\}\?text=\$\{encodeURIComponent\('مرحباً بك، نتواصل معك من إدارة منصة سوق بغداد بخصوص طلب استعادة حسابك\.\.\.'\)\}\`\} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-green-500\/20 text-green-400 border border-green-500\/30 rounded-lg text-sm font-bold flex items-center justify-center gap-2">/g;

const newRecoveryLink = `<a href={getWhatsAppResetLink(req.profiles.phone)} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm font-bold flex items-center justify-center gap-2">`;

content = content.replace(oldRecoveryLink, newRecoveryLink);

fs.writeFileSync(file, content, 'utf8');
console.log('App.tsx patched successfully for WhatsApp feature!');
