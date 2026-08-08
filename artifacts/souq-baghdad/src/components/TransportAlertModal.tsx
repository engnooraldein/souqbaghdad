import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, Bell, MapPin, Plus, GraduationCap, Briefcase, Ambulance } from 'lucide-react';
import { UNIVERSITIES, PUBLIC_UNIVERSITIES, PRIVATE_UNIVERSITIES, EMPLOYEE_WORKPLACES, BAGHDAD_REGIONS } from '../App';
import { supabase } from '../lib/supabase';

export function TransportAlertModal({ onClose, user }: { onClose: () => void; user: any }) {
  const [type, setType] = useState<'offer'|'request'>('request');
  const [categoryType, setCategoryType] = useState<'student'|'employee'|'emergency'>('student');
  const [university, setUniversity] = useState('');
  
  // ── Multi-region chip state ──────────────────────────────────────
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [regionInput, setRegionInput] = useState('');
  const regionInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Lock background scrolling when modal is open
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, []);

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
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert("حدث خطأ أثناء حفظ التنبيه. يرجى المحاولة لاحقاً.");
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-gray-950/90 border border-emerald-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">تفعيل التنبيهات</h2>
              <p className="text-xs text-gray-400 font-semibold">سنخبرك فور توفر الخط المطلوب</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <Bell className="w-10 h-10 text-emerald-400 animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-white">تم تفعيل التنبيه بنجاح!</h3>
            <p className="text-sm text-gray-400 font-semibold">
              سيصلك إشعار عبر التطبيق وتليكرام بمجرد نشر خط يطابق طلبك.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} dir="rtl" className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* نوع التنبيه */}
            <div className="space-y-1">
              <label className="text-gray-300 text-xs font-black block">نوع التنبيه (ماذا تحتاج؟)</label>
              <div className="flex bg-gray-950/40 p-1.5 rounded-2xl border border-gray-900/60 gap-2">
                <button type="button" onClick={()=>setType('request')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${type==='request'?'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/15':'text-gray-400 hover:text-white'}`}>أبحث عن خط (راكب)</button>
                <button type="button" onClick={()=>setType('offer')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${type==='offer'?'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/15':'text-gray-400 hover:text-white'}`}>صاحب خط (أوفر مقاعد)</button>
              </div>
            </div>

            {/* الفئة */}
            <div className="space-y-1">
              <label className="text-gray-300 text-xs font-black block">الفئة المستهدفة</label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => handleCategoryChange('student')}
                  className={`py-2.5 px-1 rounded-2xl font-black text-[11px] flex items-center justify-center gap-1 transition-all duration-300 ${categoryType==='student'?'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20':'bg-gray-950/30 text-gray-400 border border-gray-900/60'}`}>
                  <GraduationCap className="w-4 h-4" /> طلاب
                </button>
                <button type="button" onClick={() => handleCategoryChange('employee')}
                  className={`py-2.5 px-1 rounded-2xl font-black text-[11px] flex items-center justify-center gap-1 transition-all duration-300 ${categoryType==='employee'?'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20':'bg-gray-950/30 text-gray-400 border border-gray-900/60'}`}>
                  <Briefcase className="w-4 h-4" /> موظفين
                </button>
                <button type="button" onClick={() => handleCategoryChange('emergency')}
                  className={`py-2.5 px-1 rounded-2xl font-black text-[11px] flex items-center justify-center gap-1 transition-all duration-300 ${categoryType==='emergency'?'bg-rose-600 text-white shadow-lg shadow-rose-600/20':'bg-gray-950/30 text-gray-400 border border-gray-900/60'}`}>
                  <Ambulance className="w-4 h-4" /> طوارئ
                </button>
              </div>
            </div>

            {/* ── المناطق متعددة الاختيار ─────────────────────────── */}
            <div className="space-y-2">
              <label className="text-gray-300 text-xs font-black block flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                مناطق الانطلاق
                <span className="text-emerald-400 font-black text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">اختر أكثر من منطقة</span>
              </label>

              {/* Chips Box */}
              <div
                className="min-h-[52px] w-full bg-gray-950/40 rounded-2xl border border-gray-900/80 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all duration-300 px-3 py-2 flex flex-wrap gap-2 cursor-text"
                onClick={() => regionInputRef.current?.focus()}
              >
                {selectedRegions.map(r => (
                  <span
                    key={r}
                    className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl px-3 py-1 text-xs font-black"
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
                      className="px-3 py-1 rounded-xl bg-gray-900/60 border border-gray-800 text-gray-400 hover:border-emerald-500/30 hover:text-emerald-300 text-[11px] font-bold transition-all"
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
            <div className="space-y-2">
              <label className="text-gray-300 text-xs font-black block">
                {categoryType==='employee'?'مكان العمل (الوجهة)':categoryType==='emergency'?'الوجهة المطلوبة':'الجامعة / الكلية (الوجهة)'}
              </label>
              <input 
                list="alert-univ-list"
                value={university} 
                onChange={e=>setUniversity(e.target.value)} 
                placeholder={categoryType==='employee'?'اكتب أو اختر اسم الدائرة / مكان العمل':'اكتب أو اختر اسم الجامعة / الكلية'}
                required
                className="w-full bg-gray-950/40 text-white placeholder-gray-500 rounded-2xl py-3 px-3 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-base sm:text-sm font-semibold transition-all duration-300"
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

            <div className="pt-4 pb-2">
              <button 
                type="submit" 
                disabled={isLoading || selectedRegions.length === 0}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <span className="animate-pulse">جاري الحفظ...</span> : (
                  <>
                    <Bell className="w-5 h-5" />
                    <span>تفعيل التنبيه الذكي</span>
                    {selectedRegions.length > 0 && (
                      <span className="bg-white/20 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
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
