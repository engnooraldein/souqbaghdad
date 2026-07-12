// ===========================================
// مسؤولية هذا الملف:
// نافذة المعلومات والوثائق (Info & Docs Modal).
// تعرض سياسة الاستخدام، الشروط، وطريقة الاستخدام.
//
// لا يتصل بـ Supabase. مكوّن UI بحت.
//
// آمن للتعديل:
// نعم، يمكن تحديث النصوص بحرية.
// ===========================================
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Heart, Share2, MapPin, Phone, Car, Home, Smartphone, Watch, 
  Bike, ShoppingBag, Wrench, Video, Store, Mail, ChevronRight, 
  ChevronLeft, Search, SlidersHorizontal, Grid, List, Check, 
  AlertCircle, AlertTriangle, Info, Bell, Settings, LogOut, 
  User as UserIcon, Plus, Camera, Trash2, Edit, Save, Upload, 
  MessageCircle, Star, Image as ImageIcon, Map, Calendar, 
  Shield, ShieldCheck, Activity, TrendingUp, Users, LogIn, 
  MessageSquare, ExternalLink, ThumbsUp, MoreVertical, Eye, Lock, Unlock, Zap, Sparkles, UserPlus, 
  Loader2, Wallet, EyeOff, ZoomOut, ZoomIn, CheckCircle, Key, Tag, Package, ImagePlus, Edit2, Phone as PhoneIcon,
  FileText, Gamepad2, Copy, Crown, View, Eye as ViewIcon, 
} from 'lucide-react';
import { User, Ad, Product, TransportAd, SellerInfo } from '../types';
import { CATEGORIES, IRAQI_GOVERNORATES, EMPLOYEE_WORKPLACES, UNIVERSITIES, uploadImageToStorage, recordItemView, handleUniversalShare, ViewersModal, GAMES_DATA, compressImage } from '../App';
import { slugify, getWhatsAppLink, detectDevice, isNewItem, getWhatsAppResetLink, getGlowClass} from '../utils/helpers';
import { formatPrice } from '../utils/format';
import { useSound } from '../hooks/useSound';
import { supabase } from '../lib/supabase';
import { TimeAgo } from './TimeAgo';

import { ImageCropModal } from './ImageCropModal';
import { PasswordChangeModal } from './PasswordChangeModal';
import { LoadingScreen } from './LoadingScreen';
import { TransportFormModal } from './TransportFormModal';
import { SkeletonCard } from './SkeletonCard';
import { AdCard } from './AdCard';
import { ProductCard } from './ProductCard';
import { TransportAdCard } from './TransportAdCard';
import { InterestTimer } from './InterestTimer';
import { IraqiEagle } from './Icons';

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
                  <p className="text-amber-400 text-xs mt-1">منصة الإعلانات الرقمية العراقية الأولى</p>
                </div>
                <p>
                  <strong>سوك بغداد</strong> هو سوق رقمي وتطبيق إعلانات مجاني مصمم خصيصاً للمستخدم العراقي. نحن نسهل على الجميع في كافة المحافظات العراقية الـ 18 عرض منتجاتهم وسياراتهم وعقاراتهم وخدماتهم للبيع أو الإيجار بكل سهولة ويسر.
                </p>
                <p>
                  كما ننفرد بتقديم <strong>قسم الخطوط</strong> لمساعدة الطلاب والموظفين في العثور على خطوط نقل نقل يومية تناسب أوقاتهم وجامعاتهم، دعماً منا لتسهيل الحركة اليومية والتنقل الآمن.
                </p>
                <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50">
                  <h5 className="font-bold text-white mb-2">💡 رؤيتنا:</h5>
                  <p className="text-xs text-gray-400">تمكين الأفراد وأصحاب المشاريع الصغيرة في العراق من الوصول لأكبر قاعدة عملاء ممكنة دون قيود أو عمولات مرتفعة، مع الحفاظ على هوية وطنية عراقية أصيلة.</p>
                </div>
              </motion.div>
            )}

            {tab === 'الشروط والأحكام' && (
              <motion.div key="terms" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-red-400 font-bold text-xs mb-1">تنبيه وإخلاء مسؤولية قانوني هام</h4>
                    <p className="text-xs text-gray-400">سوك بغداد هو مجرد منصة إعلانية وسيطة (لوحة إعلانات). لا نملك السلع المعروضة، ولا نتحقق منها، ولا نضمن أي بائع أو مشتري. كافة المعاملات والاتفاقات تتم مباشرة بين الأطراف على مسؤوليتهم الشخصية والقانونية.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">1. شروط الاستخدام والأمان:</h4>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-400 pr-2">
                    <li>يجب فحص السلع والممتلكات يدوياً وبدقة قبل إتمام أي عملية دفع.</li>
                    <li>ننصح بشدة بمقابلة الطرف الآخر وجهاً لوجه في <strong>أماكن عامة آمنة ومزدحمة</strong> (مثل المولات التجارية، المطاعم، أو الساحات العامة).</li>
                    <li>لا تقم بتحويل مبالغ مالية كعربون أو سلفة قبل استلام السلعة ومعاينتها.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">2. المحتوى والمواد المحظورة:</h4>
                  <p className="text-xs text-gray-400">يُمنع منعاً باتاً نشر أو بيع السلع والخدمات التالية:</p>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-400 pr-2">
                    <li>الأسلحة والمعدات العسكرية بجميع أنواعها.</li>
                    <li>المواد المخدرة والمسكرات والتبغ ومنتجاتها.</li>
                    <li>الأدوية والمستلزمات الطبية التي تتطلب ترخيصاً رسمياً.</li>
                    <li>السلع المسروقة أو المقلدة أو المقرصنة.</li>
                    <li>الإعلانات الوهمية أو الاحتيالية أو المضللة.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">3. حظر الحسابات والإعلانات:</h4>
                  <p className="text-xs text-gray-400">
                    لإدارة المنصة الحق الكامل في حذف أي إعلان أو إيقاف وحظر أي حساب مستخدم يتبين أنه يخالف هذه الشروط أو يقوم بسلوك مشبوه أو احتيالي، وذلك حماية لسلامة مجتمع "سوك بغداد".
                  </p>
                </div>
              </motion.div>
            )}

            {tab === 'سياسة الخصوصية' && (
              <motion.div key="privacy" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>
                  نحن في <strong>سوك بغداد</strong> نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيف نتعامل مع معلوماتك:
                </p>

                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">1. البيانات التي نجمعها:</h4>
                  <p className="text-xs text-gray-400">
                    عند إنشاء حساب أو نشر إعلان، نطلب منك تزويدنا بـ (الاسم، البريد الإلكتروني، رقم الهاتف، والمحافظة). تُخزن هذه المعلومات محلياً في متصفحك (localStorage) وفي قاعدة بياناتنا لتمكينك من إدارة إعلاناتك.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">2. علانية معلومات التواصل:</h4>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400">
                    ⚠️ <strong>تنبيه:</strong> نظراً لأن المنصة تهدف لتسهيل التجارة المباشرة، فإن <strong>رقم الهاتف</strong>، <strong>الاسم</strong>، و<strong>الموقع</strong> التي تدرجها في إعلانك ستكون معلنة ومرئية للجميع لكي يتمكن المشترون من الاتصال بك أو مراسلتك عبر واتساب.
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm">3. أمن البيانات:</h4>
                  <p className="text-xs text-gray-400">
                    نحن لا نقوم ببيع أو تأجير بياناتك لأي جهات خارجية. نستخدم تقنيات الحماية المتوفرة لتأمين قواعد البيانات ضد أي محاولة وصول غير مشروعة.
                  </p>
                </div>
              </motion.div>
            )}

            {tab === 'تواصل معنا' && (
              <motion.div key="contact" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <p className="text-gray-300 text-sm leading-relaxed">
                  إذا كان لديك استفسار، شكوى، أو ترغب في الإبلاغ عن إعلان مخالف، يرجى ملء النموذج أدناه أو الاتصال بنا مباشرة:
                </p>

                {sent ? (
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6 text-center space-y-2">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                    <h4 className="text-green-400 font-bold">شكراً لتواصلك معنا!</h4>
                    <p className="text-gray-300 text-xs">تم إرسال رسالتك بنجاح إلى فريق الدعم. سنقوم بمراجعتها والرد عليك في أقرب وقت ممكن.</p>
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
                      <label className="block text-gray-400 text-xs mb-1">البريد الإلكتروني أو رقم الهاتف</label>
                      <input type="text" required value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500" placeholder="للتواصل معك" />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-1">نص الرسالة أو البلاغ</label>
                      <textarea required rows={3} value={contactForm.msg} onChange={e => setContactForm({ ...contactForm, msg: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500 resize-none" placeholder="كيف يمكننا مساعدتك؟" />
                    </div>
                    <motion.button type="submit" disabled={sending} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50">
                      {sending ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                    </motion.button>
                  </form>
                )}

                                <div className="pt-4 border-t border-gray-800 space-y-3">
                  <p className="text-gray-400 text-xs text-center font-bold">تواصل معنا عبر منصاتنا الرسمية:</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <a 
                      href="tel:07700028170" 
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 font-bold rounded-2xl border border-blue-500/20 transition-all text-xs"
                    >
                      <Phone className="w-4 h-4" />
                      <span>اتصال هاتفي</span>
                    </a>
                    
                    <a 
                      href="https://wa.me/9647700028170" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 font-bold rounded-2xl border border-green-500/20 transition-all text-xs"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                      <span>واتساب الدعم</span>
                    </a>
                    
                    <a 
                      href="https://instagram.com/SOUQBAGHDAD.IQ" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 px-4 py-2.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 hover:text-pink-300 font-bold rounded-2xl border border-pink-500/20 transition-all text-xs"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                      <span>انستغرام المنصة</span>
                    </a>
                    
                    <a 
                      href="https://t.me/SOUQBAGHDA" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 px-4 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 font-bold rounded-2xl border border-sky-500/20 transition-all text-xs"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M11.944 0C5.344 0 0 5.344 0 12c0 6.656 5.344 12 12 12 6.656 0 12-5.344 12-12C24 5.344 18.656 0 11.944 0zm5.892 8.046c-.144.9-.99 5.874-1.44 8.286-.192 1.014-.564 1.356-.924 1.392-.786.072-1.386-.516-2.148-1.014-.762-.5-1.188-.81-1.926-1.296-.852-.564-.3-.876.186-1.38.126-.132 2.334-2.136 2.376-2.316.006-.024.012-.114-.042-.162-.054-.048-.132-.03-.186-.018-.084.018-1.392.882-3.924 2.592-.372.258-.708.384-1.008.378-.33-.006-.966-.186-1.44-.342-.582-.192-1.044-.294-1.002-.624.024-.168.252-.342.69-.516 2.688-1.17 4.482-1.938 5.388-2.31 2.562-1.056 3.096-1.242 3.444-1.248.078 0 .252.018.366.114.096.084.12.198.132.282.012.072.024.228.012.384z"/></svg>
                      <span>تليكرام المنصة</span>
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
                    <p className="text-gray-400 text-xs mt-1">تتبع التغييرات والميزات المضافة في كل إصدار</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* v1.9.0 */}
                  <div className="bg-gradient-to-br from-gray-800 via-gray-800 to-emerald-950/20 border border-emerald-500/40 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[9px] font-extrabold px-2.5 py-1 rounded-bl-xl uppercase tracking-wider">
                      الإصدار الأخير
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold text-sm">⚡ الإصدار v1.9.0 - أجمل إصدار</span>
                      <span className="text-gray-400 text-xs font-mono">(10/07/2026)</span>
                    </div>
                    <ul className="text-gray-300 text-xs space-y-1.5 list-disc list-inside pr-1">
                      <li><strong>حماية الاستهلاك:</strong> إيقاف الجلب التلقائي المكثف وإضافة زر مزامنة يدوي لتوفير استهلاك البيانات.</li>
                      <li><strong>تحسين الصفحة الرئيسية:</strong> تسريع التحميل وتقليص عدد المستخدمين المعروضين لتخفيف الضغط.</li>
                      <li><strong>الترتيب والفلترة:</strong> إصلاح مشكلة تداخل قائمة الترتيب المنسدلة مع بقية الأقسام.</li>
                    </ul>
                  </div>

                  {/* v1.7.0 */}
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 font-bold text-sm">⚡ الإصدار v1.7.0 (نظام الدفع والمحفظة)</span>
                      <span className="text-gray-400 text-xs font-mono">(06/07/2026)</span>
                    </div>
                    <ul className="text-gray-350 text-xs space-y-1.5 list-disc list-inside pr-1">
                      <li><strong>تحسين سرعة التحميل:</strong> تطبيق تقنية Lazy Loading والمكونات المنفصلة.</li>
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
                  
                  {/* v1.4.0 */}
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 font-bold text-sm">🚀 الإصدار v1.4.0 (النسخة الاحترافية)</span>
                      <span className="text-gray-500 text-xs font-mono">(02/07/2026)</span>
                    </div>
                    <ul className="text-gray-400 text-xs space-y-1.5 list-disc list-inside pr-1">
                      <li>تثبيت العدادات عند التمرير وإضافة رسالة التحميل التفاعلية.</li>
                      <li>توحيد فئات المنتجات في المتجر والفورم.</li>
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
