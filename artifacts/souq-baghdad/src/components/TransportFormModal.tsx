import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  X, Car, MapPin, Plus, GraduationCap, Briefcase, Ambulance, 
  Phone, Wallet, Sparkles, Check, Bell, ShieldCheck
} from 'lucide-react';
import { TransportAd } from '../types';
import { 
  EMPLOYEE_WORKPLACES, UNIVERSITIES, PUBLIC_UNIVERSITIES, 
  PRIVATE_UNIVERSITIES, BAGHDAD_REGIONS 
} from '../App';

export function TransportFormModal({ onClose, onSubmit, user, lines = [], editAd, cost = 1 }: {
  onClose: () => void;
  onSubmit: (ad: TransportAd) => void;
  user: { id: string; name: string; avatar: string; phone: string; points?: number; role?: string };
  lines?: TransportAd[];
  editAd?: TransportAd | null;
  cost?: number;
}) {
  const isEdit = !!editAd;
  const [type, setType] = useState<'offer'|'request'>(editAd?.type || 'offer');
  const [categoryType, setCategoryType] = useState<'student'|'employee'|'emergency'>(editAd?.categoryType || 'student');
  
  // ── Dynamic destination options ──────────────────────────────────
  const dynamicFormUniversities = categoryType === 'employee'
    ? Array.from(new Set([
        ...EMPLOYEE_WORKPLACES.slice(1).filter(u => u !== 'أخرى'),
        ...lines.filter(l => l.status === 'published' && l.categoryType === 'employee').map(l => l.university)
      ])).filter(Boolean)
    : categoryType === 'emergency'
    ? Array.from(new Set([
        'أي مكان / حسب الطلب',
        ...UNIVERSITIES.slice(1).filter(u => u !== 'أخرى'),
        ...EMPLOYEE_WORKPLACES.slice(1).filter(u => u !== 'أخرى'),
        ...lines.filter(l => l.status === 'published' && l.categoryType === 'emergency').map(l => l.university)
      ])).filter(Boolean)
    : Array.from(new Set([
        ...UNIVERSITIES.slice(1).filter(u => u !== 'أخرى'),
        ...lines.filter(l => l.status === 'published' && l.categoryType === 'student').map(l => l.university)
      ])).filter(Boolean);

  const finalFormUniversities = [...dynamicFormUniversities, 'أخرى'];

  const initialUniv = editAd?.university || finalFormUniversities[0] || (categoryType === 'employee' ? EMPLOYEE_WORKPLACES[1] : UNIVERSITIES[1]);
  const isCustomUniv = editAd?.university && !finalFormUniversities.includes(editAd.university);
  const [university, setUniversity] = useState(isCustomUniv ? 'أخرى' : initialUniv);
  const [customUniversity, setCustomUniversity] = useState(isCustomUniv ? editAd.university : '');

  // ── Multi-region chip state ──────────────────────────────────────
  const initialRegions = useMemo(() => {
    if (!editAd?.regions) return [];
    return editAd.regions.split('،').map(r => r.trim()).filter(Boolean);
  }, [editAd]);

  const [selectedRegions, setSelectedRegions] = useState<string[]>(initialRegions);
  const [regionInput, setRegionInput] = useState('');
  const regionInputRef = useRef<HTMLInputElement>(null);

  // ── Other form states ───────────────────────────────────────────
  const [price, setPrice] = useState(editAd?.price ? editAd.price : '');
  const [seats, setSeats] = useState(editAd?.seats?.toString() || '4');
  const [shift, setShift] = useState(editAd?.shift || 'صباحي');
  const [vehicleType, setVehicleType] = useState(editAd?.vehicleType || 'خصوصي');
  const [targetAudience, setTargetAudience] = useState(editAd?.targetAudience || 'مختلط');
  const [phone, setPhone] = useState(editAd?.phone || user?.phone || '');
  const [note, setNote] = useState(editAd?.note || '');
  const [sugIndex, setSugIndex] = useState(0);

  // ── Terms & Legal Compliance State ──────────────────────────────
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // ── Smart note suggestions ──────────────────────────────────────
  const currentSuggestions = useMemo(() => {
    if (type === 'offer') {
      if (categoryType === 'student') {
        return [
          'السيارة حديثة ومكيفة، التزام تام بالمواعيد صباحاً ومساءً، التوصيل من وإلى باب الكلية.',
          'سواقة هادئة وآمنة، مقاعد مريحة ومكيفة، التزام بدقيق الساعات ومتابعة متبادلة مع الطلاب.',
          'خط طلابي مريح ومكيف، سيارة خصوصي حديثة، التزام تام بالمواعيد والأجور مناسبة.'
        ];
      } else if (categoryType === 'employee') {
        return [
          'سيارة مكيفة ومريحة، مواعيد دقيقة تتناسب مع أوقات الدوام الرسمي للموظفين، توصيل مباشر.',
          'خط موظفين مريح، التزام تام بالوقت، سيارة حديثة، التواصل مباشر وشفاف.',
          'خدمة نقل موظفين راقية، سيارة حديثة مكيفة، التزام بالمواعيد صباحاً ومساءً.'
        ];
      } else {
        return [
          'متوفر لرحلات اليوم والظروف الطارئة، استجابة سريعة، سيارة مكيفة ومستعدة فوراً.',
          'توصيل سريع وطارئ لجميع المناطق، سيارة خصوصي مكيفة ومريحة، جاهز فوراً.'
        ];
      }
    } else {
      if (categoryType === 'student') {
        return [
          'طالب ملتزم بالمواعيد والأجور الشهرية، هادئ ومحترم، أبحث عن خط مريح مع سائق أمين.',
          'طالبة أبحث عن خط مريح (بنات فقط) مع سائق التزامه تام بالمواعيد صباحاً ومساءً.',
          'أبحث عن خط طلابي راقي ومكيف، التزام تام بالأجور الشهرية والمواعيد.'
        ];
      } else if (categoryType === 'employee') {
        return [
          'موظف ملتزم بالدوام اليومي والأجور الشهرية، أبحث عن خط مريح مع سائق التزامه تام بالمواعيد.',
          'موظفة أبحث عن خط موظفين مريح ومكيف مع سائق ملتزم بمواعيد الدوام الرسمي.',
          'أبحث عن خط موظفين مباشر، ملتزم بالأجور والوقت التزاماً كاملاً.'
        ];
      } else {
        return [
          'أبحث عن توصيلة طارئة لليوم فقط، التزام تام بالأجور والاتفاق على نقطة الانطلاق فوراً.',
          'طلب رحلة طوارئ عاجلة، جاهز للانطلاق فوراً والتزام تام بالأجور المتفق عليها.'
        ];
      }
    }
  }, [type, categoryType]);

  const handleAutoSuggestNote = () => {
    const nextText = currentSuggestions[sugIndex % currentSuggestions.length];
    setNote(nextText);
    setSugIndex(prev => prev + 1);
  };

  // Lock background scroll on open safely
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleCategoryChange = (cat: 'student'|'employee'|'emergency') => {
    setCategoryType(cat);
    if (cat === 'student') setUniversity(UNIVERSITIES[1]);
    else if (cat === 'employee') setUniversity(EMPLOYEE_WORKPLACES[1]);
    else if (cat === 'emergency') setUniversity('أي مكان / حسب الطلب');
  };

  const formatPriceInput = (value: string) => {
    const raw = value.replace(/\D/g, '');
    if (!raw) return '';
    return Number(raw).toLocaleString('en-US');
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

  const filteredRegionSuggestions = regionInput.trim()
    ? BAGHDAD_REGIONS.filter(r =>
        r.includes(regionInput.trim()) && !selectedRegions.includes(r)
      ).slice(0, 6)
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUniversity = university === 'أخرى' ? customUniversity.trim() : university;
    const finalRegions = selectedRegions.join('، ');

    if (!finalUniversity || selectedRegions.length === 0 || !phone) {
      alert("الرجاء تحديد منطقة انطلاق واحدة على الأقل والوجهة ورقم الهاتف");
      return;
    }

    const generatedShortId = isEdit
      ? editAd.short_id
      : Math.random().toString(36).substring(2, 7).toUpperCase();

    onSubmit({
      id: isEdit ? editAd.id : Date.now(),
      type,
      categoryType,
      university: finalUniversity,
      regions: finalRegions,
      price,
      seats: type === 'offer' ? parseInt(seats) || 4 : 0,
      shift,
      vehicleType,
      targetAudience,
      phone,
      note,
      postedBy: isEdit ? editAd.postedBy : user.id,
      sellerName: isEdit ? editAd.sellerName : user.name,
      sellerAvatar: isEdit ? editAd.sellerAvatar : user.avatar,
      createdAt: isEdit ? editAd.createdAt : new Date().toISOString(),
      status: isEdit ? editAd.status : 'published',
      views: isEdit ? editAd.views : 0,
      interest: isEdit ? editAd.interest : 0,
      whatsappClicks: isEdit ? editAd.whatsappClicks : 0,
      short_id: generatedShortId
    });
    onClose();
  };

  const isPointDisabled = user?.role !== 'admin' && user?.role !== 'owner' && cost > 0 && (user?.points || 0) < cost;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-gray-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative bg-gray-950/95 border border-emerald-500/30 rounded-3xl w-full max-w-md sm:max-w-lg my-auto overflow-hidden shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[85vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center border border-emerald-500/30">
                <Car className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {isEdit ? 'تعديل إعلان الخط ✏️' : 'نشر خط نقل جديد 🚐'}
                </h2>
                <p className="text-xs text-emerald-400/90 font-semibold">
                  {categoryType === 'employee' 
                    ? 'خطوط الموظفين والشركات' 
                    : categoryType === 'emergency' 
                    ? 'رحلات وخطوط الطوارئ اليومية' 
                    : 'خطوط الجامعات والمدارس'}
                </p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={onClose} 
              className="p-2.5 bg-gray-900/60 border border-gray-800 hover:border-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors"
              title="إغلاق" 
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} dir="rtl" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 overscroll-contain">
            
            {/* نوع الإعلان */}
            <div className="space-y-1.5">
              <label className="text-gray-300 text-xs font-black block">نوع الإعلان</label>
              <div className="flex bg-gray-950/60 p-1.5 rounded-2xl border border-gray-900/80 gap-2">
                <button 
                  type="button" 
                  onClick={() => setType('offer')} 
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${type === 'offer' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/15' : 'text-gray-400 hover:text-white'}`}
                >
                  صاحب خط (أوفر مقاعد)
                </button>
                <button 
                  type="button" 
                  onClick={() => setType('request')} 
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${type === 'request' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/15' : 'text-gray-400 hover:text-white'}`}
                >
                  أبحث عن خط (راكب)
                </button>
              </div>
            </div>

            {/* فئة الخط */}
            <div className="space-y-1.5">
              <label className="text-gray-300 text-xs font-black block">فئة الخط والجمهور المستهدف</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  type="button" 
                  onClick={() => handleCategoryChange('student')}
                  className={`py-2.5 px-1 rounded-2xl font-black text-[11px] flex items-center justify-center gap-1 transition-all duration-300 ${categoryType === 'student' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-900/40 text-gray-400 border border-gray-900/80'}`}
                >
                  <GraduationCap className="w-4 h-4" /> طلاب
                </button>
                <button 
                  type="button" 
                  onClick={() => handleCategoryChange('employee')}
                  className={`py-2.5 px-1 rounded-2xl font-black text-[11px] flex items-center justify-center gap-1 transition-all duration-300 ${categoryType === 'employee' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-gray-900/40 text-gray-400 border border-gray-900/80'}`}
                >
                  <Briefcase className="w-4 h-4" /> موظفين
                </button>
                <button 
                  type="button" 
                  onClick={() => handleCategoryChange('emergency')}
                  className={`py-2.5 px-1 rounded-2xl font-black text-[11px] flex items-center justify-center gap-1 transition-all duration-300 ${categoryType === 'emergency' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-gray-900/40 text-gray-400 border border-gray-900/80'}`}
                >
                  <Ambulance className="w-4 h-4" /> طوارئ
                </button>
              </div>
            </div>

            {/* مناطق الانطلاق / المرور (نظام التاقات التفاعلية نفسه) */}
            <div className="space-y-2">
              <label className="text-gray-300 text-xs font-black block flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  {type === 'offer' ? 'مناطق المرور / الانطلاق' : 'منطقة الانطلاق'}
                </span>
                <span className="text-emerald-400 font-black text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">اختر أكثر من منطقة</span>
              </label>

              {/* Chips Input Container */}
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
                {filteredRegionSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl"
                  >
                    {filteredRegionSuggestions.map(r => (
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
                اضغط <kbd className="bg-gray-800 text-gray-300 px-1 rounded text-[9px]">Enter</kbd> بعد كل منطقة لإضافتها.
              </p>
            </div>

            {/* الوجهة / الجامعة */}
            <div className="space-y-1.5">
              <label className="text-gray-300 text-xs font-black block">
                {categoryType === 'employee' ? 'مكان العمل (دوائر / شركات)' : categoryType === 'emergency' ? 'الوجهة المطلوبة' : 'الجامعة / الكلية'}
              </label>
              <input 
                list="form-univ-list"
                value={university} 
                onChange={e => setUniversity(e.target.value)} 
                placeholder={categoryType === 'employee' ? 'اكتب أو اختر اسم الدائرة / مكان العمل' : 'اكتب أو اختر اسم الجامعة / الكلية'}
                required
                className="w-full bg-gray-950/60 text-white placeholder-gray-500 rounded-2xl py-3 px-3.5 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-base sm:text-sm font-semibold transition-all duration-300"
                style={{ fontSize: '16px' }}
              />
              <datalist id="form-univ-list">
                {categoryType === 'student' ? (
                  <>
                    {PUBLIC_UNIVERSITIES.map(c => <option key={`pub-${c}`} value={c} />)}
                    {PRIVATE_UNIVERSITIES.map(c => <option key={`priv-${c}`} value={c} />)}
                  </>
                ) : (
                  finalFormUniversities.filter(c => c !== 'الكل' && c !== 'أخرى').map(c => <option key={c} value={c} />)
                )}
              </datalist>

              {university === 'أخرى' && (
                <input 
                  type="text"
                  value={customUniversity}
                  onChange={e => setCustomUniversity(e.target.value)}
                  placeholder="ادخل اسم الوجهة بالتفصيل..."
                  required
                  className="w-full mt-2 bg-gray-950/60 text-white placeholder-gray-500 rounded-2xl py-3 px-3.5 border border-emerald-500/40 focus:border-emerald-500 outline-none text-base sm:text-sm font-semibold transition-all duration-300"
                  style={{ fontSize: '16px' }}
                />
              )}
            </div>

            {/* وقت الدوام + المقاعد */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-gray-300 text-xs font-black block">وقت الدوام</label>
                <input 
                  type="text" 
                  list="form-shift-options" 
                  value={shift} 
                  onChange={e => setShift(e.target.value)} 
                  placeholder="مثال: صباحي"
                  className="w-full bg-gray-950/60 text-white rounded-2xl py-3 px-3.5 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-base sm:text-sm font-semibold transition-all duration-300"
                  style={{ fontSize: '16px' }}
                />
                <datalist id="form-shift-options">
                  <option value="صباحي" />
                  <option value="مسائي" />
                  <option value="صباحي ومسائي" />
                  <option value="من 8 صباحاً إلى 2 ظهراً" />
                </datalist>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-300 text-xs font-black block">المقاعد المتاحة</label>
                <input 
                  type="number" 
                  min="1" 
                  max="50" 
                  value={seats} 
                  onChange={e => setSeats(e.target.value)} 
                  disabled={type === 'request'} 
                  placeholder="عدد المقاعد"
                  className="w-full bg-gray-950/60 text-white disabled:opacity-40 rounded-2xl py-3 px-3.5 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-base sm:text-sm font-bold transition-all duration-300"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            {/* نوع المركبة + الفئة المستهدفة */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-gray-300 text-xs font-black block">نوع المركبة</label>
                <select 
                  value={vehicleType} 
                  onChange={e => setVehicleType(e.target.value)} 
                  className="w-full bg-gray-950/60 text-white rounded-2xl py-3 px-3 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-base sm:text-sm font-bold transition-all duration-300"
                  style={{ fontSize: '16px' }}
                >
                  <option className="bg-gray-950 text-white">خصوصي</option>
                  <option className="bg-gray-950 text-white">أجرة</option>
                  <option className="bg-gray-950 text-white">فان 11 راكب</option>
                  <option className="bg-gray-950 text-white">كوستر</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-300 text-xs font-black block">الفئة المستهدفة</label>
                <select 
                  value={targetAudience} 
                  onChange={e => setTargetAudience(e.target.value)} 
                  className="w-full bg-gray-950/60 text-white rounded-2xl py-3 px-3 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-base sm:text-sm font-bold transition-all duration-300"
                  style={{ fontSize: '16px' }}
                >
                  <option className="bg-gray-950 text-white">مختلط</option>
                  <option className="bg-gray-950 text-white">بنات فقط</option>
                  <option className="bg-gray-950 text-white">شباب فقط</option>
                </select>
              </div>
            </div>

            {/* الأجور الشهرية */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-gray-300 text-xs font-black block">
                  {categoryType === 'emergency' ? 'الأجور التقديرية للرحلة (اختياري)' : 'الأجور الشهرية (اختياري)'}
                </label>
                <span className="text-[10px] text-emerald-400 font-black bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {categoryType === 'emergency' ? 'رحلة يومية' : '10,000 - 250,000 د.ع'}
                </span>
              </div>
              <input 
                value={price} 
                onChange={e => {
                  const val = formatPriceInput(e.target.value);
                  const rawNum = Number(val.replace(/\D/g, ''));
                  if (rawNum > 250000 && categoryType !== 'emergency') {
                    setPrice('250,000');
                  } else {
                    setPrice(val);
                  }
                }} 
                placeholder={categoryType === 'emergency' ? 'مثال: 5,000 د.ع' : 'مثال: 100,000 د.ع (النطاق المثالي: 10,000 - 250,000 د.ع)'}
                className="w-full bg-gray-950/60 text-white placeholder-gray-500 rounded-2xl py-3 px-3.5 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-base sm:text-sm font-semibold transition-all duration-300"
                style={{ fontSize: '16px' }}
              />

              {/* أزرار السعر السريع */}
              {categoryType !== 'emergency' && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['50,000', '75,000', '100,000', '125,000', '150,000', '200,000', '250,000'].map(pVal => (
                    <button
                      key={pVal}
                      type="button"
                      onClick={() => setPrice(pVal)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${price === pVal ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-emerald-300 hover:border-emerald-500/30'}`}
                    >
                      {pVal} د.ع
                    </button>
                  ))}
                </div>
              )}

              {/* تنبيه السعر المالي */}
              {price && categoryType !== 'emergency' && Number(price.replace(/\D/g, '')) < 10000 && (
                <p className="text-[11px] text-amber-400 font-semibold px-1">
                  ⚠️ النطاق الموصى به بين 10,000 د.ع و 250,000 د.ع
                </p>
              )}
            </div>

            {/* رقم هاتف السائق/التواصل */}
            <div className="space-y-1.5">
              <label className="text-gray-300 text-xs font-black block">رقم هاتف التواصل</label>
              <input 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="07XXXXXXXXX" 
                required
                className="w-full bg-gray-950/60 text-white placeholder-gray-500 rounded-2xl py-3 px-3.5 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-base sm:text-sm font-bold text-left transition-all duration-300" 
                dir="ltr"
                style={{ fontSize: '16px' }}
              />
            </div>

            {/* تفاصيل إضافية مع زر الاقتراح الذكي */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-gray-300 text-xs font-black block">تفاصيل إضافية (اختياري)</label>
                <button
                  type="button"
                  onClick={handleAutoSuggestNote}
                  className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-[11px] font-black bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-xl border border-emerald-500/30 transition-all active:scale-95 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>توليد نص مقترح ✨</span>
                </button>
              </div>

              {/* أزرار الاقتراحات السريعة */}
              <div className="flex flex-wrap gap-1.5 pb-1">
                {currentSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNote(sug)}
                    className="text-right text-[11px] font-semibold bg-gray-900/60 hover:bg-emerald-500/10 border border-gray-800 hover:border-emerald-500/30 text-gray-400 hover:text-emerald-300 px-2.5 py-1 rounded-xl transition-all"
                  >
                    💡 {sug.slice(0, 30)}...
                  </button>
                ))}
              </div>

              <textarea 
                value={note} 
                onChange={e => setNote(e.target.value)} 
                rows={3} 
                placeholder={type === 'offer' ? 'مثال: السيارة مكيفة، سواقة هادئة، التزام تام بالمواعيد...' : 'مثال: ملتزم بالمواعيد والأجور الشهرية، أبحث عن خط مريح...'}
                className="w-full bg-gray-950/60 text-white placeholder-gray-500 rounded-2xl py-3 px-3.5 border border-gray-900/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-base sm:text-sm font-medium resize-none transition-all duration-300 leading-relaxed"
                style={{ fontSize: '16px' }}
              />
            </div>

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
                    يتعهد الناشر بصحة البيانات وتحمل كافة المسؤولية القانونية وتنزيه المنصة من أي مسألة.
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
                      <ShieldCheck className="w-4 h-4" /> التعهد والمسؤولية القانونية:
                    </p>
                    <p>1️⃣ <strong>حماية الزبون والمستخدم</strong>: يتعهد الناشر التزاماً كاملاً بسلامة الأفراد، التعامل اللائق، ومراعاة الآداب العامة وقوانين السير.</p>
                    <p>2️⃣ <strong>إخلاء مسؤولية المنصة</strong>: منصة (سوق بغداد الرقمي) وسيط تقني لعرض الإعلانات فقط، ولا تتحمل أي مسؤولية قانونية أو مالية ناتجة عن الاتفاق والتعامل المباشر بين الطرفين.</p>
                    <p>3️⃣ <strong>مسؤولية الناشر</strong>: يتحمل صاحب الإعلان كافة المساءلة القانونية أمام الجهات الرسمية عن صحة بياناته ورخصته وتعامله.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit Button */}
            <div className="pt-2 pb-2">
              <button 
                type="submit" 
                disabled={!acceptedTerms || isPointDisabled || selectedRegions.length === 0}
                className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black rounded-2xl text-sm sm:text-base flex flex-col items-center justify-center gap-1 shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-[0.98]"
              >
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  <span>{isEdit ? 'تحديث إعلان الخط' : 'نشر الإعلان عن الخط'}</span>
                </div>

                {user?.role !== 'admin' && user?.role !== 'owner' && cost > 0 && (
                  <span className="text-[10px] opacity-90 font-bold bg-black/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 mt-0.5">
                    <Wallet className="w-3 h-3" /> يخصم {cost} نقطة (متبقي {user?.points || 0})
                  </span>
                )}
                {user?.role !== 'admin' && user?.role !== 'owner' && cost === 0 && (
                  <span className="text-[10px] opacity-90 font-bold bg-black/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 mt-0.5">
                    ✨ مجاني بالكامل
                  </span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
