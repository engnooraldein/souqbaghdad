const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(file, 'utf8');

const targetStr = `                      <Key className="w-3.5 h-3.5"/> تصفير الرمز (123456)
                    </button>
                  )}`;

const newContent = `                      <Key className="w-3.5 h-3.5"/> تصفير الرمز (123456)
                    </button>
                  )}
                  {u.role !== 'owner' && (
                    <a 
                      href={\`https://wa.me/\${(()=>{
                        const p = (u.phone || (u.email?.includes('@') ? u.email.split('@')[0] : '')).replace(/[^0-9]/g, '');
                        if(p.startsWith('0')) return '964' + p.substring(1);
                        if(!p.startsWith('964')) return '964' + p;
                        return p;
                      })()}?text=\${encodeURIComponent('مرحباً بك في سوق بغداد! المنصة الأولى للإعلانات.\\n\\nتم تغيير كلمة سر حسابك الخاص بسوق بغداد إلى 123456. يمكنك تغيير كلمة السر من خلال (حسابك الشخصي / الملف الشخصي / قسم الحساب).\\n\\nمع تحيات إدارة الموقع\\nwww.souqbaghdad.store')}\`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 bg-green-500 text-white hover:bg-green-600 shadow-md shadow-green-500/20"
                      title="إرسال رسالة تصفير عبر الواتساب"
                    >
                      <MessageSquare className="w-3.5 h-3.5"/> إبلاغ بالرمز
                    </a>
                  )}`;

content = content.replace(targetStr, newContent);

fs.writeFileSync(file, content, 'utf8');
console.log('App.tsx patched successfully with WhatsApp button');
