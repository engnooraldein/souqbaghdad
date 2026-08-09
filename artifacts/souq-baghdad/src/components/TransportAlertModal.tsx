import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, Bell, MapPin, Plus, GraduationCap, Briefcase, Ambulance, Check, ShieldCheck } from 'lucide-react';
import { UNIVERSITIES, PUBLIC_UNIVERSITIES, PRIVATE_UNIVERSITIES, EMPLOYEE_WORKPLACES, BAGHDAD_REGIONS } from '../App';
import { supabase } from '../lib/supabase';

export function TransportAlertModal({ onClose, user }: { onClose: () => void; user: any }) {
  const [activeTab, setActiveTab] = useState<'create'|'my_alerts'>('create');
  const [type, setType] = useState<'offer'|'request'>('request');
  const [categoryType, setCategoryType] = useState<'student'|'employee'|'emergency'>('student');
  const [university, setUniversity] = useState('');
  
  // ── Multi-region chip state ──────────────────────────────────────
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [regionInput, setRegionInput] = useState('');
  const regionInputRef = useRef<HTMLInputElement>(null);

  // ── Terms & Legal Compliance State ──────────────────────────────
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [dbError, setDbError] = useState('');

  // ── My Alerts State ─────────────────────────────────────────────
  const [myAlerts, setMyAlerts] = useState<any[]>([]);
  const [isFetchingAlerts, setIsFetchingAlerts] = useState(false);
  const [deletingId, setDeletingId] = useState<number|null>(null);

  useEffect(() => {
    // Lock background scrolling when modal is open safely without touchAction lock
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const fetchMyAlerts = async () => {
    if (!user) return;
    setIsFetchingAlerts(true);
    try {
      const { data, error } = await supabase
        .from('transport_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyAlerts(data || []);
    } catch (err) {
      console.error('Error fetching user alerts:', err);
    } finally {
      setIsFetchingAlerts(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my_alerts') {
      fetchMyAlerts();
    }
  }, [activeTab, user]);

  const handleDeleteAlert = async (alertId: number) => {
    if (!confirm('هل أنت تأكد من إلغاء هذا التنبيه؟')) return;
    setDeletingId(alertId);
    try {
      const { error } = await supabase
        .from('transport_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;
      setMyAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err: any) {
      alert(`تعذر إلغاء التنبيه: ${err.message || err}`);
    } finally {
      setDeletingId(null);
    }
  };

  const dynamicFormUniversities = categoryType === 'employee' 
    ? [...EMPLOYEE_WORKPLACES, 'أخرى'] 
    : categoryType === 'emergency' 
      ? ['أي مكان / حسب الطلب', 'أخرى']
      : [...UNIVERSITIES, 'أخرى'];

  const handleCategoryChange = (cat: 'student'|'employee'|'emergency') => {
    setCategoryType(cat);
    if (cat === 'student') setUniversity(UNIVERSITIES[1]);
    else if (cat === 'employee') setUniversity(EMPLOYEE_WORKPLACES[1]);
    else if (cat === 'emergency') setUniversity('أي مكان / حسب الطلب');
  };

  // ── Region chip helpers ──────────────────────────────────────────
  const addRegion = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed || selectedRegions.includes(trimmed)) return;
    setSelectedRegions(prev => [...prev, trimmed]);
    setRegionInput('');
    regionInputRef.current?.focus();
  };

  const removeRegion = (r: string) => {
    setSelectedRegions(prev => prev.filter(x => x !== r));
  };

  const handleRegionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && regionInput.trim()) {
      e.preventDefault();
      addRegion(regionInput);
    } else if (e.key === 'Backspace' && !regionInput && selectedRegions.length > 0) {
      setSelectedRegions(prev => prev.slice(0, -1));
    }
  };

  const filteredSuggestions = regionInput.trim()
    ? BAGHDAD_REGIONS.filter(r =>
        r.includes(regionInput.trim()) && !selectedRegions.includes(r)
      ).slice(0, 6)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("يجب تسجيل الدخول أولاً");
      return;
    }
    
    const finalDest = university.trim();
    if (!finalDest || selectedRegions.length === 0) {
      alert("الرجاء اختيار منطقة واحدة على الأقل وتحديد الوجهة");
      return;
    }

    setIsLoading(true);
    try {
      // حفظ كل المناطق المختارة كنص واحد مفصول بفاصلة
      const { error } = await supabase.from('transport_alerts').insert({
        user_id: user.id,
        region_keyword: selectedRegions.join('، '),
        destination: finalDest,
        category_type: categoryType,
        type: type
      });

      if (error) throw error;
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setActiveTab('my_alerts');
      }, 1800);
    } catch (err: any) {
      console.error(err);
      const errorText = typeof err === 'object' ? JSON.stringify(err) : String(err);
      setDbError(`تفاصيل الخطأ: ${errorText} | الرسالة: ${err.message || 'غير معروف'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-gray-950/80 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative bg-gray-950/95 border border-emerald-500/30 rounded-3xl w-full max-w-md sm:max-w-lg my-auto overflow-hidden shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[85vh] z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0" dir="rtl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Bell className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">تنبيهات الخطوط الذكية 🔔</h2>
              <p className="text-xs text-gray-400 font-semibold">إدارة وتفعيل تنبيهات الخطوط المطلوبة</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-gray-900/60 border border-gray-800 hover:border-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors" title="إغلاق" aria-label="إغلاق">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Tab Bar: Create Alert vs My Active Alerts vs Test Preview */}
        <div className="p-2 bg-gray-900/80 border-b border-gray-800 flex gap-1.5 shrink-0" dir="rtl">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 ${
              activeTab === 'create'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <span>+ تفعيل تنبيه</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my_alerts')}
            className={`flex-1 py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 ${
              activeTab === 'my_alerts'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <span>تنبيهاتي 🔔</span>
            {myAlerts.length > 0 && (
              <span className="bg-black/20 text-black px-1.5 py-0.5 rounded-full text-[10px] font-black">
                {myAlerts.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('test_demo')}
            className={`py-2 px-2.5 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 ${
              activeTab === 'test_demo'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 border border-sky-500/20'
            }`}
            title="تجربة نموذج الإشعار التجريبي للمالك"
          >
            <span>نموذج تجريبي 🧪</span>
          </button>
        </div>

        {/* DEMO TEST NOTIFICATION TAB */}
        {activeTab === 'test_demo' ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4" dir="rtl">
            <div className="p-4 bg-gradient-to-br from-slate-900 via-gray-950 to-slate-950 border border-sky-500/40 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-sky-500/20 pb-2">
                <span className="bg-sky-500 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <span>🧪</span> نموذج إشعار تجريبي (معاينة المالك)
                </span>
                <span className="text-gray-400 text-[10px] font-bold">الآن ⏱️</span>
              </div>

              <div className="space-y-2 text-right">
                <h4 className="text-white font-black text-sm flex items-center gap-1.5">
                  <span className="text-emerald-400">🚌</span> تم العثور على خط يطابق طلبك!
                </h4>
                <div className="p-3 bg-gray-900/90 rounded-xl border border-gray-800 space-y-1.5 text-xs">
                  <p className="text-gray-300 font-bold">
                    <span className="text-amber-400 font-black">الانطلاق:</span> المنصور / اليرموك / الداودي
                  </p>
                  <p className="text-gray-300 font-bold">
                    <span className="text-emerald-400 font-black">الوجهة:</span> جامعة بغداد (الجادرية)
                  </p>
                  <p className="text-gray-300 font-bold">
                    <span className="text-sky-400 font-black">المركبة:</span> كيا سيراتو 2023 - خط طلابي صباحي (مكيفة)
                  </p>
                  <p className="text-gray-400 text-[11px] italic pt-1 border-t border-gray-800">
                    ملاحظة السائق: "التزام تام بالمواعيد والأجور الشهرية، متوفر 3 مقاعد متبقية للطلاب."
                  </p>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => alert("هذا إشعار تجريبي لاختبار التنبيهات! يعمل الإشعار الحقيقي تلقائياً فور توفر سائق طابق اختيارك.")}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1 shadow-md"
                >
                  💬 فتح وتواصل مباشر (معاينة)
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-bold leading-relaxed">
              💡 <strong>ملاحظة للمالك:</strong> هذا النموذج التجريبي يوضح شكل الرسالة الحقيقية التي تصل لهاتف الزبون ولتليكرام ولجرس الإشعارات فور نشر أي خط يطابق تنبيهاته!
            </div>
          </div>
        ) : activeTab === 'my_alerts' ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-3" dir="rtl">
            {!user ? (
              <div className="py-12 text-center space-y-3">
                <p className="text-gray-300 font-bold text-sm">يرجى تسجيل الدخول لعرض وإدارة تنبيهاتك المسجلة 🔐</p>
              </div>
            ) : isFetchingAlerts ? (
              <div className="py-12 text-center text-gray-400 text-sm font-bold animate-pulse">
                جاري تحميل تنبيهاتك المسجلة...
              </div>
            ) : myAlerts.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="text-4xl">🔔</div>
                <h3 className="text-white font-bold text-base">لا توجد لديك تنبيهات نشطة حالياً</h3>
                <p className="text-gray-400 text-xs font-semibold max-w-xs mx-auto">
                  يمكنك تفعيل تنبيه لخط معين ليقوم النظام بإشعارك فور توفر سائق أو راكب يطابق طلبك!
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  + تفعيل تنبيه جديد الآن
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-400 text-xs font-bold mb-1">تنبيهاتك المسجلة ({myAlerts.length}):</p>
                {myAlerts.map((alt: any) => (
                  <div 
                    key={alt.id}
                    className="p-3.5 rounded-2xl bg-gray-900/90 border border-gray-800 flex flex-col justify-between gap-2.5 shadow-md hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
                            {alt.destination}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                            {alt.type === 'offer' ? 'صاحب خط' : 'طلب خط'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-300 text-[10px] font-bold">
                            {alt.category_type === 'employee' ? '👔 موظفين' : alt.category_type === 'emergency' ? '⚡ طوارئ' : '🎓 طلاب'}
                          </span>
                        </div>
                        <p className="text-white text-xs font-bold mt-1">
                          <span className="text-gray-400 font-normal">المناطق: </span>
                          <span className="text-emerald-400 font-extrabold">{alt.region_keyword}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteAlert(alt.id)}
                        disabled={deletingId === alt.id}
                        className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 disabled:opacity-50"
                        title="إلغاء التنبيه"
                      >
                        <span>{deletingId === alt.id ? 'جاري الإلغاء...' : 'إلغاء التنبيه 🗑️'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
              <Bell className="w-10 h-10 text-emerald-400 animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-white">تم تفعيل التنبيه بنجاح!</h3>
            <p className="text-sm text-gray-400 font-semibold">
              سيصلك إشعار عبر التطبيق وتليكرام بمجرد نشر خط يطابق طلبك.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} dir="rtl" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 overscroll-contain">

            {/* نوع التنبيه */}
            <div className="space-y-1.5">
              <label className="text-gray-300 text-xs font-black block">نوع التنبيه (ماذا تحتاج؟)</label>
              <div className="flex bg-gray-950/60 p-1.5 rounded-2xl border border-gray-900/80 gap-2">
                <button type="button" onClick={()=>setType('request')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${type==='request'?'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/15':'text-gray-400 hover:text-white'}`}>أبحث عن خط (راكب)</button>
                <button type="button" onClick={()=>setType('offer')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${type==='offer'?'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/15':'text-gray-400 hover:text-white'}`}>صاحب خط (أوفر مقاعد)</button>
              </div>
            </div>

            {/* الفئة */}
            <div className="space-y-1.5">
              <label className="text-gray-300 text-xs font-black block">الفئة المستهدفة</label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => handleCategoryChange('student')}
                  className={`py-2.5 px-1 rounded-2xl font-black text-[11px] flex items-center justify-center gap-1 transition-all duration-300 ${categoryType==='student'?'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20':'bg-gray-900/40 text-gray-400 border border-gray-900/80'}`}>
                  <GraduationCap className="w-4 h-4" /> طلاب
                </button>
                <button type="button" onClick={() => handleCategoryChange('employee')}
                  className={`py-2.5 px-1 rounded-2xl font-black text-[11px] flex items-center justify-center gap-1 transition-all duration-300 ${categoryType==='employee'?'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20':'bg-gray-900/40 text-gray-400 border border-gray-900/80'}`}>
                  <Briefcase className="w-4 h-4" /> موظفين
                </button>
                <button type="button" onClick={() => handleCategoryChange('emergency')}
                  className={`py-2.5 px-1 rounded-2xl font-black text-[11px] flex items-center justify-center gap-1 transition-all duration-300 ${categoryType==='emergency'?'bg-rose-600 text-white shadow-lg shadow-rose-600/20':'bg-gray-900/40 text-gray-400 border border-gray-900/80'}`}>
                  <Ambulance className="w-4 h-4" /> طوارئ
                </button>
              </div>
            </div>

            {/* ── المناطق متعددة الاختيار ─────────────────────────── */}
            <div className="space-y-2">
              <label className="text-gray-300 text-xs font-black block flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  مناطق الانطلاق
                </span>
                <span className="text-emerald-400 font-black text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">اختر أكثر من منطقة</span>
              </label>

              {/* Chips Box */}
              <div
                className="min-h-[52px] w-full bg-gray-950/60 rounded-2xl border border-gray-900/80 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all duration-300 px-3 py-2 flex flex-wrap gap-2 cursor-text"
                onClick={() => regionInputRef.current?.focus()}
              >
                {selectedRegions.map(r => (
                  <span
                    key={r}
                    className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl px-2.5 py-1 text-xs font-black"
                  >
                    {r}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); removeRegion(r); }}
                      className="text-emerald-400 hover:text-white transition-colors ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  ref={regionInputRef}
                  type="text"
                  value={regionInput}
                  onChange={e => setRegionInput(e.target.value)}
                  onKeyDown={handleRegionKeyDown}
                  placeholder={selectedRegions.length === 0 ? "اكتب اسم المنطقة ثم Enter أو اختر من القائمة..." : "أضف منطقة أخرى..."}
                  className="flex-1 min-w-[140px] bg-transparent text-white placeholder-gray-500 text-base sm:text-sm font-semibold outline-none"
                  style={{ fontSize: '16px' }}
                />
              </div>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {filteredSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl"
                  >
                    {filteredSuggestions.map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => addRegion(r)}
                        className="w-full text-right px-4 py-2.5 text-sm text-gray-200 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors flex items-center gap-2 font-semibold"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {r}
                        <Plus className="w-3.5 h-3.5 text-gray-500 mr-auto" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick region chips */}
              {selectedRegions.length === 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {BAGHDAD_REGIONS.slice(0, 8).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => addRegion(r)}
                      className="px-2.5 py-1 rounded-xl bg-gray-900/60 border border-gray-800 text-gray-400 hover:border-emerald-500/30 hover:text-emerald-300 text-[11px] font-bold transition-all"
                    >
                      + {r}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-gray-500 font-semibold px-1">
                اضغط <kbd className="bg-gray-800 text-gray-300 px-1 rounded text-[9px]">Enter</kbd> بعد كل منطقة لإضافتها. يمكنك اختيار مناطق متعددة.
              </p>
            </div>

            {/* الجامعة / الوجهة */}
            <div className="space-y-1.5">
              <label className="text-gray-300 text-xs font-black block">
                {categoryType==='employee'?'مكان العمل (الوجهة)':categoryType==='emergency'?'الوجهة المطلوبة':'الجامعة / الكلية (الوجهة)'}
              </label>
              <input 
                list="alert-univ-list"
                value={university} 
                onChange={e=>setUniversity(e.target.value)} 
                placeholder={categoryType==='employee'?'اكتب أو اختر اسم الدائرة / مكان العمل':'اكتب أو اختر اسم الجامعة / الكلية'}
                required
                className="w-full bg-gray-950/60 text-white placeholder-gray-500 rounded-2xl py-3 px-3.5 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-base sm:text-sm font-semibold transition-all duration-300"
                style={{ fontSize: '16px' }}
              />
              <datalist id="alert-univ-list">
                {categoryType === 'student' ? (
                  <>
                    {PUBLIC_UNIVERSITIES.map(c => <option key={`pub-${c}`} value={c} />)}
                    {PRIVATE_UNIVERSITIES.map(c => <option key={`priv-${c}`} value={c} />)}
                  </>
                ) : (
                  dynamicFormUniversities.filter(c => c !== 'الكل' && c !== 'أخرى').map(c => <option key={c} value={c} />)
                )}
              </datalist>
            </div>

            {dbError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold leading-relaxed break-words">
                {dbError}
              </div>
            )}

            {/* 🛡️ مربع الموافقة على الشروط والتعهد القانوني */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={e => setAcceptedTerms(e.target.checked)}
                    className="sr-only"
                    required
                  />
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-200 ${acceptedTerms ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-gray-900 border-gray-700 group-hover:border-emerald-500/50'}`}>
                    {acceptedTerms && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
                <div className="flex-1 text-xs font-bold text-gray-200 leading-snug">
                  <span>أوافق على </span>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setShowTermsModal(!showTermsModal); }}
                    className="text-emerald-400 hover:text-emerald-300 underline font-black underline-offset-2 ml-0.5"
                  >
                    الشروط والأحكام والتعهد القانوني 🛡️
                  </button>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                    موافقتك تعني الالتزام بشرعية البيانات وتنزيه المنصة من أي مسألة.
                  </p>
                </div>
              </label>

              {/* التفاصيل القانونية الموسعة عند الضغط */}
              <AnimatePresence>
                {showTermsModal && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2 border-t border-emerald-500/20 text-[11px] text-gray-300 font-medium space-y-1.5 leading-relaxed bg-black/30 p-3 rounded-xl mt-1"
                  >
                    <p className="font-bold text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> التعهد والتزامات استخدام الخدمة:
                    </p>
                    <p>1️⃣ <strong>إخلاء مسؤولية المنصة</strong>: منصة (سوق بغداد الرقمي) وسيط تقني لعرض الإشعار والتنبيهات، ولا تتحمل أي مسؤولية قانونية أو مالية عن التعامل المباشر.</p>
                    <p>2️⃣ <strong>الالتزام بالسلامة والقوانين</strong>: التزام كامل بالآداب والسلامة العامة والتعليمات القانونية النافذة.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="pt-2 pb-2">
              <button 
                type="submit" 
                disabled={!acceptedTerms || isLoading || selectedRegions.length === 0}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black py-3.5 sm:py-4 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isLoading ? <span className="animate-pulse">جاري الحفظ...</span> : (
                  <>
                    <Bell className="w-5 h-5" />
                    <span>تفعيل التنبيه الذكي</span>
                    {selectedRegions.length > 0 && (
                      <span className="bg-white/20 text-white text-[11px] font-black px-2 py-0.5 rounded-full ml-1">
                        {selectedRegions.length} منطقة
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );

  return createPortal(
    <AnimatePresence>
      {modalContent}
    </AnimatePresence>,
    document.body
  );
}
