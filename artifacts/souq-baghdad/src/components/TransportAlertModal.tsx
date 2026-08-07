import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, Bell, Search, MapPin } from 'lucide-react';
import { UNIVERSITIES, PUBLIC_UNIVERSITIES, PRIVATE_UNIVERSITIES, EMPLOYEE_WORKPLACES, BAGHDAD_REGIONS } from '../App';
import { supabase } from '../lib/supabase';

export function TransportAlertModal({ onClose, user }: { onClose: () => void; user: any }) {
  const [type, setType] = useState<'offer'|'request'>('request');
  const [categoryType, setCategoryType] = useState<'student'|'employee'|'emergency'>('student');
  const [university, setUniversity] = useState('');
  const [regions, setRegions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("يجب تسجيل الدخول أولاً");
      return;
    }
    
    const finalDest = university.trim();
    if (!finalDest || !regions.trim()) {
      alert("الرجاء ملء كافة الحقول");
      return;
    }

    setIsLoading(true);
    try {
      // Create table transport_alerts in your Supabase DB if not exists
      const { error } = await supabase.from('transport_alerts').insert({
        user_id: user.id,
        region_keyword: regions.trim(),
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
            <div className="space-y-1">
              <label className="text-gray-300 text-xs font-black block">نوع التنبيه (ماذا تحتاج؟)</label>
              <div className="flex bg-gray-950/40 p-1.5 rounded-2xl border border-gray-900/60 gap-2">
                <button type="button" onClick={()=>setType('request')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${type==='request'?'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/15':'text-gray-400 hover:text-white'}`}>أبحث عن خط (راكب)</button>
                <button type="button" onClick={()=>setType('offer')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${type==='offer'?'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/15':'text-gray-400 hover:text-white'}`}>صاحب خط (أوفر مقاعد)</button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-gray-300 text-xs font-black block">الفئة المستهدفة</label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => handleCategoryChange('student')}
                  className={`py-2.5 px-1 rounded-2xl font-black text-[11px] flex items-center justify-center gap-1 transition-all duration-300 ${categoryType==='student'?'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20':'bg-gray-950/30 text-gray-400 border border-gray-900/60'}`}>
                  🎓 طلاب
                </button>
                <button type="button" onClick={() => handleCategoryChange('employee')}
                  className={`py-2.5 px-1 rounded-2xl font-black text-[11px] flex items-center justify-center gap-1 transition-all duration-300 ${categoryType==='employee'?'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20':'bg-gray-950/30 text-gray-400 border border-gray-900/60'}`}>
                  👔 موظفين
                </button>
                <button type="button" onClick={() => handleCategoryChange('emergency')}
                  className={`py-2.5 px-1 rounded-2xl font-black text-[11px] flex items-center justify-center gap-1 transition-all duration-300 ${categoryType==='emergency'?'bg-rose-600 text-white shadow-lg shadow-rose-600/20':'bg-gray-950/30 text-gray-400 border border-gray-900/60'}`}>
                  🚗 طوارئ
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-gray-300 text-xs font-black block">منطقة الانطلاق (منين تطلع؟)</label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                <input 
                  list="alert-regions-list"
                  value={regions} 
                  onChange={e=>setRegions(e.target.value)} 
                  placeholder="مثال: جميلة، السيدية، بغداد الجديدة" 
                  required
                  className="w-full bg-gray-950/40 text-white placeholder-gray-500 rounded-2xl py-3 pr-10 pl-3 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm font-semibold transition-all duration-300"
                />
                <datalist id="alert-regions-list">
                  {BAGHDAD_REGIONS.map(r => <option key={`r-${r}`} value={r} />)}
                </datalist>
              </div>
              <p className="text-[10px] text-gray-500 font-semibold px-2">اكتب اسم المنطقة بشكل دقيق ليصلك الإشعار الصحيح.</p>
            </div>

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
                className="w-full bg-gray-950/40 text-white placeholder-gray-500 rounded-2xl py-3 px-3 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm font-semibold transition-all duration-300"
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
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <span className="animate-pulse">جاري الحفظ...</span> : (
                  <>
                    <Bell className="w-5 h-5" />
                    <span>تفعيل التنبيه الذكي</span>
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
