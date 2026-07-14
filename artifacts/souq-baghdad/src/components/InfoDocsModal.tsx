// ===========================================
// مسؤولية هذا الملف:
// نافذة المعلومات والوثائق (Info & Docs Modal).
// تعرض سياسة الاستخدام، الشروط، وطريقة الاستخدام.
//
// تم تحسين الأداء وإلغاء الاستيرادات المكررة والدائرية لتجنب مشاكل العرض.
// ===========================================
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Phone, Mail, Check, AlertCircle, Info, Shield, Lock, Sparkles, CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export function InfoDocsModal({ activeTab, onClose, user }: { activeTab: string; onClose: () => void; user?: any }) {
  const [tab, setTab] = useState(activeTab);
  const [contactForm, setContactForm] = useState({ name: '', email: '', msg: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setTab(activeTab);
    setSent(false);
  }, [activeTab]);

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.msg.trim()) return;
    setSending(true);
    try {
      const payload: any = {
        name: contactForm.name.trim(),
        contact_info: contactForm.email.trim(),
        message: contactForm.msg.trim()
      };
      if (user) {
        payload.user_id = user.id;
      }
      const { error } = await supabase.from('support_messages').insert([payload]);
      if (error) throw error;
      setSent(true);
      setContactForm({ name: '', email: '', msg: '' });
    } catch (err: any) {
      alert('حدث خطأ أثناء إرسال الرسالة: ' + (err?.message || err));
    } finally {
      setSending(false);
    }
  };

  const tabs = [
    { id: 'من نحن', icon: <Info className="w-4 h-4" /> },
    { id: 'الشروط والأحكام', icon: <Shield className="w-4 h-4" /> },
    { id: 'سياسة الخصوصية', icon: <Lock className="w-4 h-4" /> },
    { id: 'تواصل معنا', icon: <Mail className="w-4 h-4" /> },
    { id: 'سجل التحديثات', icon: <Sparkles className="w-4 h-4" /> }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-gray-900 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col border border-gray-700 shadow-2xl z-[210] overflow-hidden text-right" dir="rtl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-white font-bold text-lg">مركز المعلومات والسياسات</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 transition-colors" title="إغلاق" aria-label="إغلاق">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-800 bg-[#0c2b5e] p-2 gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setSent(false); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                tab === t.id ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              {t.icon}
              <span>{t.id}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence mode="wait">
            {tab === 'من نحن' && (
              <motion.div key="about" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <div className="text-center py-4">
                  <span className="text-5xl">🇮🇶</span>
                  <h4 className="text-lg font-bold text-white mt-2">سوك بغداد — Souq Baghdad</h4>
                  <p className="text-amber-400 text-xs mt-1">المنصة العراقية الرقمية المتكاملة للإعلانات والمتاجر</p>
                </div>
                <p>
                  <strong>سوك بغداد</strong> هو منصة رقمية وتطبيق إعلانات مجاني مصمم خصيصاً للمجتمع العراقي لتقديم خدمات الإعلانات المبوبة والمتاجر الإلكترونية وحلول النقل الجامعي والوظيفي في كافة محافظات جمهورية العراق الـ 18 من زاخو إلى الفاو.
                </p>
                <p>
                  هدفنا الأساسي هو دعم الشباب، أصحاب المشاريع الصغيرة، والمتاجر المحلية في تسويق منتجاتهم وخدماتهم مجاناً وبكل شفافية، بالإضافة إلى توفير قسم فريد لخطوط النقل والتوصيل اليومي لتسهيل حركة الطلاب والموظفين.
                </p>
                <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50">
                  <h5 className="font-bold text-white mb-2">💡 رؤيتنا ورسالتنا:</h5>
                  <p className="text-xs text-gray-400">بناء اقتصاد رقمي عراقي محلي متين يربط البائع بالمشتري مباشرة دون أي وسيط أو عمولة، مع توفير أقصى درجات الشفافية والراحة للمستخدم في تلبية احتياجاته اليومية.</p>
                </div>
              </motion.div>
            )}

            {tab === 'الشروط والأحكام' && (
              <motion.div key="terms" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-red-400 font-bold text-xs mb-1">تنبيه قانوني وإخلاء مسؤولية حاسم للمستخدمين</h4>
                    <p className="text-xs text-gray-400">منصة "سوك بغداد" هي مساحة إعلانية وسيطة فقط (لوحة إعلانات مبوبة رقمية). نحن لا نملك السلع، ولا نتحقق من سلامتها، ولا نضمن أي بائع أو مشتري أو ناقل. كافة الاتفاقات والصفقات تتم مباشرة بين الأطراف على مسؤوليتهم الشخصية والقانونية المطلقة.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">1. إخلاء المسؤولية التام للمنصة ومالكها:</h4>
                  <p className="text-xs text-gray-400">
                    تخلي إدارة منصة سوك بغداد ومالكها ومطوروها مسؤوليتهم القانونية، الجنائية، والمالية بشكل كامل ومطلق عن أي عملية احتيال، سرقة، تزييف، أو تضليل مالي أو عيني قد يتعرض لها أي مستخدم. كافة الصفقات والخطوط والمنتجات تتم بنظام نظير إلى نظير (P2P) خارج نطاق وسيطرة التطبيق تماماً.
                  </p>
                  <p className="text-xs text-gray-400">
                    <strong>إبراء ذمة وتعويض:</strong> يقر مستخدم التطبيق إقراراً باتاً ونهائياً بإبراء ذمة مالك التطبيق وإدارته من أي مطالبات بالتعويض المالي أو الملاحقة القانونية أو الغرامات الناتجة عن تواصله مع مستخدمين آخرين أو إبرامه لأي صفقات عبر التطبيق، ويتعهد بتعويض إدارة التطبيق عن أي ضرر مادي أو معنوي قد يلحق بها بسبب إساءة استخدامه للمنصة.
                  </p>
                  <p className="text-xs text-gray-400">
                    <strong>القانون الحاكم والاختصاص القضائي:</strong> تخضع هذه الاتفاقية وتفسر وفقاً للقوانين النافذة في جمهورية العراق، وتختص محاكم بغداد حصرياً بالنظر في كافة المنازعات التي تنشأ عن استخدام المنصة.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">2. إرشادات الأمان والمعاينة الإلزامية:</h4>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-400 pr-2">
                    <li><strong>المقابلة في أماكن عامة:</strong> نلزم كافة المستخدمين بإجراء المقابلات والمعاينات والتبادلات المالية وجهاً لوجه في <strong>أماكن عامة، آمنة، ومزدحمة داخل العراق</strong> (مثل المولات التجارية الشهيرة، المطاعم الكبرى، أو الساحات العامة تحت رقابة الكاميرات).</li>
                    <li><strong>حظر الدفع المسبق:</strong> يُمنع منعاً باتاً تحويل أي مبالغ مالية مسبقة كـ (عربون، حجز، سلفة، أو أجور شحن وتوصيل) قبل فحص السلعة بدقة واستلامها يدوياً.</li>
                    <li><strong>فحص العقود والأوراق:</strong> بالنسبة للسيارات والعقارات والمقتنيات الثمينة، يقع على عاتق المشتري وحده فحص السندات واللوحات والأوراق الرسمية والوكالات المرورية للتأكد من خلوها من أي حجز أو مانع قانوني في الدوائر الحكومية الرسمية قبل دفع أي دينار.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">3. المواد والأنشطة المحظورة تماماً:</h4>
                  <p className="text-xs text-gray-400">يُمنع منعاً باتاً نشر أو بيع السلع والخدمات التالية على المنصة، وتحت طائلة الملاحقة القانونية:</p>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-400 pr-2">
                    <li>الأسلحة والمعدات العسكرية والذخائر بجميع أنواعها.</li>
                    <li>المواد المخدرة والمنشطات الطبية والمسكرات والتبغ ومستلزمات الشيشة الإلكترونية.</li>
                    <li>الأدوية والخلطات الطبية ومستحضرات التجميل مجهولة المصدر أو غير الحاصلة على ترخيص وزارة الصحة العراقية.</li>
                    <li>السلع المسروقة، أو مجهولة الملكية، أو المعروضة دون إذن صاحبها الشرعي.</li>
                    <li>الإعلانات الوهمية، أو التسويق الشبكي والهرمي، أو العروض الربحية المشبوهة.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">4. الحظر والتعاون الأمني والقضائي العراقي:</h4>
                  <p className="text-xs text-gray-400">
                    تمتلك إدارة التطبيق الحق الكامل والسيادي في حذف أي إعلان أو تجميد وحظر أي حساب يشتبه في قيامه بسلوك احتيالي أو تضليلي. كما تؤكد الإدارة أنها ستتعاون بشكل كامل ومباشر مع **وزارة الداخلية العراقية، جهاز الأمن الوطني، ومحاكم تحقيق مكافحة الجريمة الإلكترونية** في تزويدهم بكافة البيانات وسجلات الدخول والاتصال لأي مستخدم يرتكب جرائم نصب واحتيال عبر المنصة عند تقديم أي طلب رسمي أو شكوى قضائية معتمدة.
                  </p>
                </div>
              </motion.div>
            )}

            {tab === 'سياسة الخصوصية' && (
              <motion.div key="privacy" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>
                  نحن في إدارة <strong>سوك بغداد</strong> نلتزم بأعلى معايير حماية بياناتك الشخصية واحترام خصوصيتك. توضح هذه السياسة طبيعة التعامل مع بياناتك:
                </p>

                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">1. البيانات التي يتم جمعها:</h4>
                  <p className="text-xs text-gray-400">
                    عند تسجيل حسابك، نقوم بحفظ (الاسم، البريد الإلكتروني، رقم الهاتف، والمحافظة). نستخدم هذه البيانات لتمكينك من رفع الإعلانات وإرسال الإشعارات، وتأمين حسابك ضد محاولات الاختراق.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">2. علانية وشفافية معلومات الإعلان:</h4>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400">
                    ⚠️ <strong>تنبيه الخصوصية الهام:</strong> نظراً لطبيعة المنصة القائمة على التجارة المباشرة والتواصل الحر، فإن <strong>اسمك، رقم الهاتف الذي تدخله، والمحافظة</strong> ستكون معلومات **علنية ومرئية لكافة الزوار والمستخدمين** على التطبيق والموقع لتمكين المشترين من الاتصال بك أو مراسلتك على واتساب مباشرة. يعتبر رفعك لأي إعلان موافقة صريحة منك على نشر هذه البيانات.
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">3. حماية البيانات وعدم المشاركة التجارية:</h4>
                  <p className="text-xs text-gray-400">
                    تتعهد المنصة بعدم بيع، تأجير، أو مشاركة بيانات المستخدمين الخاصة مع أي شركات تسويق أو جهات خارجية. البيانات آمنة ومحمية في قواعد البيانات السحابية المؤمنة ولا يتم الإفصاح عنها إلا للجهات القضائية والأمنية العراقية الرسمية عند الاقتضاء القانوني وبطلب رسمي.
                  </p>
                </div>
              </motion.div>
            )}

            {tab === 'تواصل معنا' && (
              <motion.div key="contact" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <p className="text-gray-300 text-sm leading-relaxed">
                  هل لديك اقتراح، استفسار، مشكلة أمنية أو ترغب في الإبلاغ الفوري عن إعلان احتيالي أو بائع مخالف؟ يرجى ملء النموذج أدناه أو استخدام قنوات الدعم المباشرة:
                </p>

                {sent ? (
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6 text-center space-y-2">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                    <h4 className="text-green-400 font-bold">شكراً لتواصلك معنا!</h4>
                    <p className="text-gray-300 text-xs">تم استلام بلاغك / رسالتك بنجاح من قبل فريق الرقابة والدعم الفني. سنقوم بمراجعتها والاتصال بك بأسرع وقت ممكن.</p>
                    <button type="button" onClick={() => setSent(false)} className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-xl text-xs hover:bg-gray-700 transition-colors">إرسال رسالة أخرى</button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmitContact} className="space-y-3">
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">الاسم الكريم</label>
                      <input type="text" required value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500" placeholder="اكتب اسمك هنا" />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">رقم الهاتف أو البريد الإلكتروني</label>
                      <input type="text" required value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500" placeholder="للتواصل معك" />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">تفاصيل الرسالة أو البلاغ عن إعلان مخالف</label>
                      <textarea required rows={3} value={contactForm.msg} onChange={e => setContactForm({ ...contactForm, msg: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500 resize-none" placeholder="اكتب تفاصيل بلاغك أو استفسارك هنا لمراجعته فوراً..." />
                    </div>
                    <motion.button type="submit" disabled={sending} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                      {sending ? 'جاري الإرسال والمراجعة...' : 'إرسال الرسالة / البلاغ'}
                    </motion.button>
                  </form>
                )}

                <div className="pt-4 border-t border-gray-800 space-y-3">
                  <p className="text-gray-400 text-xs text-center font-bold">قنوات الدعم الفني المباشر لحماية المستهلك:</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <a 
                      href="tel:07700028170" 
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 font-bold rounded-2xl border border-blue-500/20 transition-all text-xs"
                    >
                      <Phone className="w-4 h-4" />
                      <span>اتصال هاتفي مباشر</span>
                    </a>
                    
                    <a 
                      href="https://wa.me/9647700028170" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 font-bold rounded-2xl border border-green-500/20 transition-all text-xs"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                      <span>واتساب الدعم السريع</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'سجل التحديثات' && (
              <motion.div key="changelog" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 text-right">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
                  <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-amber-400"/>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-white font-bold text-xl">سجل التحديثات والإصدارات</h2>
                      <span className="px-2.5 py-0.5 bg-amber-500 text-black font-extrabold text-xs rounded-full">v1.9.0</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">تتبع آخر التحسينات والميزات المضافة لخدمتك</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* v1.9.0 */}
                  <div className="bg-gradient-to-br from-gray-800 via-gray-800 to-emerald-950/20 border border-emerald-500/40 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[9px] font-extrabold px-2.5 py-1 rounded-bl-xl uppercase tracking-wider">
                      الإصدار الأخير
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold text-sm">⚡ الإصدار v1.9.0 - تحسين الأداء والأمان</span>
                      <span className="text-gray-400 text-xs font-mono">(13/07/2026)</span>
                    </div>
                    <ul className="text-gray-350 text-xs space-y-1.5 list-disc list-inside pr-1">
                      <li><strong>تقسيم الحزم البرمجية (Code Splitting):</strong> تطبيق تقنية `React.lazy` وتحميل الصفحات والمكونات الكبيرة عند الطلب، مما قلل حجم التحميل الأولي للتطبيق بنسبة 80% لتجربة تصفح سريعة وخفيفة على شبكات الجيل الثالث والرابع الضعيفة في العراق.</li>
                      <li><strong>تحميل الصور البطيء (Lazy Load Images):</strong> إضافة خاصية التحميل الكسول للصور لعدم استهلاك باقات الإنترنت إلا عند ظهور الصور في شاشة المستخدم.</li>
                      <li><strong>إخلاء مسؤولية قانوني مشدد:</strong> تحديث كافة البنود والوثائق القانونية لضمان الحماية التامة لصاحب المنصة ووضع إرشادات الأمان للمستهلكين.</li>
                      <li><strong>حل مشكلة العرض:</strong> حل مشكلة تداخل الملفات والواجهات وإلغاء الارتباطات المكررة لضمان فتح مركز السياسات بسلاسة.</li>
                    </ul>
                  </div>

                  {/* v1.7.0 */}
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 font-bold text-sm">⚡ الإصدار v1.7.0 (نظام الدفع والمحفظة)</span>
                      <span className="text-gray-400 text-xs font-mono">(06/07/2026)</span>
                    </div>
                    <ul className="text-gray-350 text-xs space-y-1.5 list-disc list-inside pr-1">
                      <li><strong>نظام المحفظة الرقمية:</strong> شحن الرصيد لتثبيت الإعلانات وحفظ سجل المعاملات المالية.</li>
                      <li><strong>سجل التحديثات:</strong> إتاحة سجل التحديثات لجميع المستخدمين من خلال الفوتر.</li>
                      <li><strong>مشاركة الروابط:</strong> إصلاح وتحسين نظام مشاركة روابط الملفات الشخصية.</li>
                    </ul>
                  </div>

                  {/* v1.5.0 */}
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 font-bold text-sm">🤖 الإصدار v1.5.0 (المساعد الذكي)</span>
                      <span className="text-gray-500 text-xs font-mono">(04/07/2026)</span>
                    </div>
                    <ul className="text-gray-400 text-xs space-y-1.5 list-disc list-inside pr-1">
                      <li>تحويل بوت التيليكرام إلى مساعد تفاعلي ذكي للاستعادة.</li>
                      <li>نظام توليد آمن لكلمات المرور بضغطة زر.</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
