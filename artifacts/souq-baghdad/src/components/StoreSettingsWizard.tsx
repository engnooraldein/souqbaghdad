import React, { useMemo, useState } from 'react';
import { User } from '../types';
import { Store, User as UserIcon, Briefcase, GraduationCap, MapPin, Globe, LayoutTemplate, Wand2, Loader2, Sparkles } from 'lucide-react';

interface StoreSettingsWizardProps {
  ef: User;
  setEf: React.Dispatch<React.SetStateAction<User>>;
  editing: boolean;
  isDarkMode: boolean;
}

export const StoreSettingsWizard: React.FC<StoreSettingsWizardProps> = ({ ef, setEf, editing, isDarkMode }) => {
  // Ensure store_metadata exists
  const meta = ef.store_metadata || {};
  const setMeta = (key: string, value: any) => {
    setEf(prev => ({ ...prev, store_metadata: { ...(prev.store_metadata || {}), [key]: value } }));
  };

  const storeType = ef.store_type || 'personal';
  const specialty = ef.specialty || '';

  const SPECIALTIES = ['طبيب', 'صيدلي', 'مهندس', 'مبرمج', 'محامي', 'مصور', 'حلاق', 'تجارة عامة', 'سيارات', 'عقارات', 'ملابس', 'إلكترونيات'];

  const [isGeneratingBio, setIsGeneratingBio] = useState(false);

  const handleGenerateAIBio = async () => {
    if (!ef.store_name) {
      alert('يرجى إدخال اسم المتجر أولاً لنتمكن من توليد وصف دقيق.');
      return;
    }
    setIsGeneratingBio(true);
    try {
      // Simulate API call to AI
      await new Promise(resolve => setTimeout(resolve, 1500));
      let generatedText = `مرحباً بك في ${ef.store_name}، وجهتك الأولى للخدمات المتميزة. نحن نفخر بتقديم أفضل الحلول وتلبية احتياجات عملائنا بجودة عالية واحترافية لا مثيل لها.`;
      
      if (storeType === 'business' && specialty) {
        if (specialty === 'طبيب' || specialty === 'صيدلي') {
          generatedText = `مرحباً بكم في ${ef.store_name}. نحن نلتزم بتقديم أفضل رعاية صحية وطبية لمرضانا، معتمدين على خبراتنا المتراكمة${ef.specialty_detail ? ` في مجال ${ef.specialty_detail}` : ''} لضمان صحتكم وسلامتكم.`;
        } else if (specialty === 'سيارات') {
          generatedText = `أهلاً بك في ${ef.store_name}، المكان الأمثل لاختيار سيارتك القادمة. نقدم لك خيارات واسعة تلبي تطلعاتك مع ضمان الشفافية والمصداقية في التعامل.`;
        } else if (specialty === 'مهندس' || specialty === 'عقارات') {
          generatedText = `مرحباً بك في ${ef.store_name}. نحول رؤيتك إلى واقع ملموس من خلال أحدث الحلول وأعلى معايير الجودة${ef.specialty_detail ? ` في تخصص ${ef.specialty_detail}` : ''}.`;
        }
      }
      setEf(prev => ({ ...prev, bio: generatedText }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingBio(false);
    }
  };

  // Dynamic templates based on specialty
  const suggestedTemplates = useMemo(() => {
    if (specialty === 'طبيب' || specialty === 'صيدلي') return ['medical', 'default'];
    if (specialty === 'مهندس' || specialty === 'عقارات') return ['tech', 'default'];
    if (specialty === 'سيارات') return ['auto', 'default'];
    if (specialty === 'حلاق' || specialty === 'منتجات تجميل') return ['beauty', 'default'];
    return ['default', 'tech', 'beauty', 'auto', 'medical'];
  }, [specialty]);

  return (
    <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white border-slate-200'} shadow-lg space-y-6 mt-6`}>
      <div className="flex items-center justify-between border-b pb-3 border-gray-700/50">
        <h3 className={`font-black text-lg flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
          <Store className="w-5 h-5 text-amber-500" />
          إعدادات المتجر الاحترافي
        </h3>
      </div>
      
      {/* 1. Account Type */}
      <div>
        <label className={`text-sm font-bold block mb-3 ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>نوع الحساب</label>
        <div className="flex gap-3">
          <button
            disabled={!editing}
            onClick={() => setEf({...ef, store_type: 'personal'})}
            className={`flex-1 py-4 px-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
              storeType === 'personal'
                ? 'bg-blue-500/10 border-blue-500 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500'
                : isDarkMode 
                  ? 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600' 
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
            } ${!editing ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <UserIcon className="w-7 h-7" />
            <span className="font-black text-base">حساب شخصي</span>
            <span className="text-xs opacity-70">لبيع الأغراض المستعملة</span>
          </button>
          <button
            disabled={!editing}
            onClick={() => setEf({...ef, store_type: 'business'})}
            className={`flex-1 py-4 px-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
              storeType === 'business'
                ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500'
                : isDarkMode 
                  ? 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600' 
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
            } ${!editing ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <Store className="w-7 h-7" />
            <span className="font-black text-base">متجر تجاري</span>
            <span className="text-xs opacity-70">لأصحاب المهن والمحلات</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Store Name */}
        <div>
          <label className={`text-sm font-bold block mb-2 ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>اسم المتجر / النشاط</label>
          <div className="relative">
            <Store className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`} />
            <input 
              disabled={!editing} 
              value={ef.store_name || ''} 
              onChange={e=>setEf({...ef, store_name:e.target.value})} 
              placeholder={storeType === 'personal' ? "مثال: حساب محمد العراقي" : "مثال: معرض الهدى للسيارات"}
              className={`w-full pl-4 pr-10 py-3 rounded-xl border outline-none text-sm font-semibold transition-all ${isDarkMode ? 'bg-gray-900 text-white border-gray-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50' : 'bg-slate-50 text-slate-900 border-slate-200 focus:border-amber-500'}`}
            />
          </div>
        </div>

        {/* Store URL */}
        <div>
          <label className={`text-sm font-bold block mb-2 ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>رابط المتجر المخصص</label>
          <div className={`flex items-center w-full rounded-xl border transition-all ${isDarkMode ? 'bg-gray-900 border-gray-700 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/50' : 'bg-slate-50 border-slate-200 focus-within:border-amber-500'}`}>
            <span className={`px-3 py-3 text-xs border-l font-mono ${isDarkMode ? 'border-gray-700 text-gray-500 bg-gray-800 rounded-r-xl' : 'border-slate-200 text-slate-500 bg-slate-100 rounded-r-xl'}`} dir="ltr">souqbaghdad.store/seller/</span>
            <input 
              disabled={!editing} 
              value={ef.username || ''} 
              onChange={e=>setEf({...ef, username:e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})} 
              placeholder="my_store_123" 
              dir="ltr"
              className="flex-1 bg-transparent border-none outline-none px-3 py-3 text-sm text-left font-mono font-bold"
            />
          </div>
        </div>
      </div>

      {/* Store Bio / Description */}
      <div>
        <label className={`text-sm font-bold block mb-2 flex justify-between items-end ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>
          <span>وصف المتجر (النبذة التعريفية)</span>
          {editing && (
            <button
              onClick={handleGenerateAIBio}
              disabled={isGeneratingBio}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-bold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGeneratingBio ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              {isGeneratingBio ? 'جاري التوليد...' : 'توليد بالذكاء الاصطناعي ✨'}
            </button>
          )}
        </label>
        <div className="relative">
          <textarea
            disabled={!editing}
            value={ef.bio || ''}
            onChange={e => setEf({ ...ef, bio: e.target.value })}
            placeholder="اكتب نبذة عن متجرك أو استخدم الذكاء الاصطناعي لكتابتها..."
            className={`w-full p-4 rounded-xl border outline-none text-sm transition-all min-h-[100px] resize-y ${
              isDarkMode 
                ? 'bg-gray-900/50 text-white border-gray-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50' 
                : 'bg-slate-50 text-slate-900 border-slate-200 focus:border-amber-500'
            }`}
          />
          {isGeneratingBio && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] rounded-xl rounded-b-none border-b border-transparent z-10">
              <div className="flex flex-col items-center gap-2 text-indigo-500 bg-white/90 p-3 rounded-lg shadow-lg">
                <Sparkles className="w-6 h-6 animate-pulse" />
                <span className="text-xs font-bold animate-pulse">جاري صياغة الوصف...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Business Section */}
      {storeType === 'business' && (
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-slate-50 border-slate-200'} space-y-5`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Specialty (Datalist) */}
            <div>
              <label className={`text-sm font-bold block mb-2 ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>التخصص الرئيسي</label>
              <div className="relative">
                <Briefcase className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`} />
                <input 
                  list="specialties-list"
                  disabled={!editing} 
                  value={specialty} 
                  onChange={e=>setEf({...ef, specialty:e.target.value})} 
                  placeholder="اختر أو اكتب تخصصك..." 
                  className={`w-full pl-4 pr-10 py-3 rounded-xl border outline-none text-sm font-semibold transition-all ${isDarkMode ? 'bg-gray-800 text-white border-gray-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50' : 'bg-white text-slate-900 border-slate-200 focus:border-amber-500'}`}
                />
                <datalist id="specialties-list">
                  {SPECIALTIES.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
            </div>

            {/* Specialty Detail */}
            <div>
              <label className={`text-sm font-bold block mb-2 ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>التخصص الدقيق</label>
              <input 
                list="specialty-detail-list"
                disabled={!editing} 
                value={ef.specialty_detail || ''} 
                onChange={e=>setEf({...ef, specialty_detail:e.target.value})} 
                placeholder="مثال: تقويم وتجميل الأسنان" 
                className={`w-full px-4 py-3 rounded-xl border outline-none text-sm font-semibold transition-all ${isDarkMode ? 'bg-gray-800 text-white border-gray-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50' : 'bg-white text-slate-900 border-slate-200 focus:border-amber-500'}`}
              />
              <datalist id="specialty-detail-list">
                {specialty === 'طبيب' && ['أسنان', 'قلبية', 'أطفال', 'جراحة عامة', 'باطنية', 'عيون', 'نسائية وتوليد'].map(s=><option key={s} value={s}/>)}
                {specialty === 'مهندس' && ['معماري', 'مدني', 'كهرباء', 'ميكانيك', 'حاسبات'].map(s=><option key={s} value={s}/>)}
                {specialty === 'تجارة عامة' && ['ملابس', 'أحذية', 'إلكترونيات', 'مواد غذائية'].map(s=><option key={s} value={s}/>)}
              </datalist>
            </div>
          </div>

          {/* Dynamic Extra Fields Based on Specialty */}
          {specialty === 'طبيب' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-700/50">
              <div>
                <label className={`text-xs font-bold block mb-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>الدرجة العلمية</label>
                <select 
                  disabled={!editing}
                  value={meta?.medical_degree || ''}
                  onChange={e => setMeta('medical_degree', e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm font-semibold ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-slate-200'}`}
                >
                  <option value="">اختر الدرجة...</option>
                  <option value="مقيم دوري">مقيم دوري</option>
                  <option value="مقيم أقدم">مقيم أقدم</option>
                  <option value="أخصائي">أخصائي</option>
                  <option value="استشاري">استشاري</option>
                </select>
              </div>
              <div>
                <label className={`text-xs font-bold block mb-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>الجامعة المتخرج منها</label>
                <div className="relative">
                  <GraduationCap className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`} />
                  <input 
                    disabled={!editing}
                    value={meta?.university || ''}
                    onChange={e => setMeta('university', e.target.value)}
                    placeholder="اسم الجامعة"
                    className={`w-full pr-9 pl-3 py-2.5 rounded-lg border text-sm font-semibold ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-slate-200'}`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Location / GPS Field (Applies to all businesses) */}
          <div className="pt-3 border-t border-gray-700/50">
            <label className={`text-sm font-bold block mb-2 ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>رابط الموقع الجغرافي (Google Maps)</label>
            <div className="relative">
              <MapPin className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500`} />
              <input 
                disabled={!editing}
                value={meta?.maps_link || ''}
                onChange={e => setMeta('maps_link', e.target.value)}
                placeholder="https://maps.google.com/..."
                dir="ltr"
                className={`w-full pr-10 pl-4 py-3 rounded-xl border outline-none text-sm text-left transition-all ${isDarkMode ? 'bg-gray-800 text-emerald-400 border-gray-600 focus:border-emerald-500' : 'bg-white text-emerald-600 border-slate-200 focus:border-emerald-500'}`}
              />
            </div>
          </div>

          {/* Display Language */}
          <div className="pt-3 border-t border-gray-700/50">
             <label className={`text-sm font-bold block mb-2 ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>لغة العرض للزبائن</label>
             <div className="flex gap-2">
                {['auto', 'ar', 'en'].map(lang => (
                  <button
                    key={lang}
                    disabled={!editing}
                    onClick={() => setEf({...ef, store_language: lang as any})}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      (ef.store_language || 'auto') === lang
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                        : isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-400' : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    {lang === 'auto' ? 'تلقائي (حسب المستخدم)' : lang === 'ar' ? 'العربية دائماً' : 'English Always'}
                  </button>
                ))}
             </div>
          </div>

          {/* Theme Selection */}
          <div className="pt-3 border-t border-gray-700/50">
             <label className={`text-sm font-bold block mb-2 ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>قالب المتجر</label>
             <div className="flex flex-wrap gap-3">
               {suggestedTemplates.map(tpl => (
                  <button
                    key={tpl}
                    disabled={!editing}
                    onClick={() => setEf({...ef, store_template: tpl})}
                    className={`px-4 py-3 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all ${
                      (ef.store_template || 'default') === tpl
                        ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20'
                        : isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <LayoutTemplate className="w-4 h-4" />
                    {tpl === 'default' ? 'الأساسي' : tpl === 'medical' ? 'عيادة طبية' : tpl === 'tech' ? 'مشاريع وأعمال' : tpl === 'auto' ? 'معرض سيارات' : 'صالون وتجميل'}
                  </button>
               ))}
             </div>
          </div>

        </div>
      )}
    </div>
  );
};
