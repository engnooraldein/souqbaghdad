import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Share2, 
  Send, 
  Check, 
  Loader2, 
  Settings, 
  Radio, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Layers,
  Facebook,
  Instagram,
  RadioTower,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface SocialPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  category?: 'transport' | 'vehicles' | 'cars' | 'products' | 'general';
  table?: 'ads' | 'products' | 'transport_ads';
  onSuccess?: () => void;
}

export const SocialPublishModal: React.FC<SocialPublishModalProps> = ({
  isOpen,
  onClose,
  item,
  category = 'transport',
  table = 'ads',
  onSuccess
}) => {
  // Detect if item belongs to Al-Rafdain
  const descStr = typeof item?.description === 'string' ? item.description : JSON.stringify(item?.description || {});
  const isAlRafdain = ['الرافدين', 'الرفدين'].some(term => 
    (item?.university && item.university.includes(term)) ||
    (item?.city && item.city.includes(term)) ||
    (item?.destination && item.destination.includes(term)) ||
    descStr.includes(term)
  );

  // Targets state with granular channel selection
  const [publishTargets, setPublishTargets] = useState({
    facebook: true,
    facebookPage: isAlRafdain ? 'alrafdain' : 'souqbaghdad',
    instagram: true,
    instagramPage: isAlRafdain ? 'alrafdain' : 'souqbaghdad',
    threads: true,
    tiktok: false,
    telegram: true,
    telegramChannels: {
      souqLines: category === 'transport',
      rafdainLines: category === 'transport' && isAlRafdain,
      souqCars: category === 'vehicles' || category === 'cars',
      souqGeneral: category === 'products' || category === 'general'
    }
  });

  const [showSettings, setShowSettings] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Load saved default routing preferences if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('souq_social_publish_prefs');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPublishTargets(prev => ({
          ...prev,
          facebook: parsed.facebook ?? prev.facebook,
          instagram: parsed.instagram ?? prev.instagram,
          threads: parsed.threads ?? prev.threads,
          telegram: parsed.telegram ?? prev.telegram
        }));
      }
    } catch {}
  }, []);

  if (!isOpen || !item) return null;

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('souq_social_publish_prefs', JSON.stringify({
        facebook: publishTargets.facebook,
        instagram: publishTargets.instagram,
        threads: publishTargets.threads,
        telegram: publishTargets.telegram
      }));
      setPublishStatus({ success: true, message: 'تم حفظ إعدادات التوجيه الافتراضية بنجاح! ⚙️' });
      setTimeout(() => setPublishStatus(null), 3000);
    } catch {}
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishStatus(null);
    try {
      const targetTable = table === 'products' ? 'products' : (category === 'transport' ? 'transport_ads' : 'ads');
      
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: {
          type: 'INSERT',
          table: targetTable,
          record: item,
          targets: {
            facebook: publishTargets.facebook,
            forceFacebookPage: publishTargets.facebookPage,
            instagram: publishTargets.instagram,
            forceInstagramPage: publishTargets.instagramPage,
            threads: publishTargets.threads,
            tiktok: publishTargets.tiktok,
            telegram: publishTargets.telegram,
            telegramChannels: publishTargets.telegramChannels
          }
        }
      });

      if (error) throw error;

      setPublishStatus({
        success: true,
        message: '🎉 تم النشر بنجاح وتوليد التصميم على كافة القنوات والمنصات المحددة!'
      });

      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
        setPublishStatus(null);
      }, 2500);
    } catch (err: any) {
      console.error('Publish error:', err);
      setPublishStatus({
        success: false,
        message: 'خطأ في النشر: ' + (err.message || 'تعذر الاتصال بخادم النشر')
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4" dir="rtl">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-black/80 backdrop-blur-md" 
          onClick={onClose} 
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="relative bg-gray-950 border border-blue-500/40 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden text-right"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-black text-base sm:text-lg">نشر وترويج الإعلان على الشبكات</h3>
                <p className="text-xs text-gray-400">توليد تلقائي للتصميم ونشر بالقنوات المحددة</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="overflow-y-auto space-y-3.5 pr-1 scrollbar-thin scrollbar-thumb-gray-800 flex-1">
            
            {/* Status Alert if any */}
            {publishStatus && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-2xl text-xs font-black border flex items-center gap-2 ${
                  publishStatus.success 
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' 
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}
              >
                {publishStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
                <span>{publishStatus.message}</span>
              </motion.div>
            )}

            {/* 1. Telegram Section with Specific Channels */}
            <div className="bg-gray-900/90 border border-sky-500/30 rounded-2xl p-3.5 transition-all">
              <div className="flex items-center justify-between mb-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={publishTargets.telegram} 
                    onChange={e => setPublishTargets(p => ({ ...p, telegram: e.target.checked }))} 
                    className="w-5 h-5 rounded accent-sky-500" 
                  />
                  <span className="text-white font-black text-sm flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-sky-400" />
                    تيليجرام (Telegram)
                  </span>
                </label>
                <span className="text-[11px] font-bold text-sky-400 bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded-full">
                  🟢 متصل
                </span>
              </div>

              {publishTargets.telegram && (
                <div className="mr-6 space-y-2 pt-2 border-t border-gray-800/80">
                  <p className="text-[11px] font-bold text-gray-400">القنوات المربوطة والمستهدفة:</p>

                  {/* Channel: Transport Lines */}
                  {category === 'transport' && (
                    <>
                      <label className="flex items-center justify-between p-2 rounded-xl bg-gray-950/70 border border-gray-800 cursor-pointer hover:border-sky-500/40 transition-all text-xs">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={publishTargets.telegramChannels.souqLines}
                            onChange={e => setPublishTargets(p => ({
                              ...p, 
                              telegramChannels: { ...p.telegramChannels, souqLines: e.target.checked }
                            }))}
                            className="accent-sky-500 w-4 h-4"
                          />
                          <span className="text-gray-200 font-bold">🚌 قناة خطوط نقل سوق بغداد</span>
                        </div>
                        <span className="text-[10px] text-sky-400 font-mono" dir="ltr">@souqbaghdad_lines</span>
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-xl bg-gray-950/70 border border-gray-800 cursor-pointer hover:border-amber-500/40 transition-all text-xs">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={publishTargets.telegramChannels.rafdainLines}
                            onChange={e => setPublishTargets(p => ({
                              ...p, 
                              telegramChannels: { ...p.telegramChannels, rafdainLines: e.target.checked }
                            }))}
                            className="accent-amber-500 w-4 h-4"
                          />
                          <span className="text-gray-200 font-bold">🎓 قناة خطوط كلية الرافدين</span>
                        </div>
                        <span className="text-[10px] text-amber-400 font-mono" dir="ltr">@ruc_1</span>
                      </label>
                    </>
                  )}

                  {/* Channel: Cars */}
                  {(category === 'vehicles' || category === 'cars') && (
                    <label className="flex items-center justify-between p-2 rounded-xl bg-gray-950/70 border border-gray-800 cursor-pointer hover:border-emerald-500/40 transition-all text-xs">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={publishTargets.telegramChannels.souqCars}
                          onChange={e => setPublishTargets(p => ({
                            ...p, 
                            telegramChannels: { ...p.telegramChannels, souqCars: e.target.checked }
                          }))}
                          className="accent-emerald-500 w-4 h-4"
                        />
                        <span className="text-gray-200 font-bold">🚗 قناة سوق بغداد للسيارات</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono" dir="ltr">@souqbaghdad_car</span>
                    </label>
                  )}

                  {/* Channel: Products / General */}
                  {(category === 'products' || category === 'general') && (
                    <label className="flex items-center justify-between p-2 rounded-xl bg-gray-950/70 border border-gray-800 cursor-pointer hover:border-blue-500/40 transition-all text-xs">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={publishTargets.telegramChannels.souqGeneral}
                          onChange={e => setPublishTargets(p => ({
                            ...p, 
                            telegramChannels: { ...p.telegramChannels, souqGeneral: e.target.checked }
                          }))}
                          className="accent-blue-500 w-4 h-4"
                        />
                        <span className="text-gray-200 font-bold">🛍️ قناة سوق بغداد العامة</span>
                      </div>
                      <span className="text-[10px] text-blue-400 font-mono" dir="ltr">@souqbaghdad_iq</span>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* 2. Facebook Section */}
            <div className="bg-gray-900/90 border border-blue-600/30 rounded-2xl p-3.5 transition-all">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={publishTargets.facebook} 
                    onChange={e => setPublishTargets(p => ({ ...p, facebook: e.target.checked }))} 
                    className="w-5 h-5 rounded accent-blue-600" 
                  />
                  <span className="text-white font-black text-sm flex items-center gap-1.5">
                    <Facebook className="w-4 h-4 text-blue-500" />
                    فيسبوك (Facebook)
                  </span>
                </label>
                <span className="text-[11px] font-bold text-blue-400 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  {publishTargets.facebookPage === 'alrafdain' ? '🟢 بوست (Post)' : '🟢 متصل'}
                </span>
              </div>
              {publishTargets.facebook && (
                <div className="mr-6 pt-2 border-t border-gray-800/80">
                  <p className="text-[11px] font-bold text-gray-400 mb-1.5">الصفحة المستهدفة للنشر (فيسبوك):</p>
                  <select 
                    value={publishTargets.facebookPage} 
                    onChange={e => setPublishTargets(p => ({ ...p, facebookPage: e.target.value }))} 
                    className="bg-gray-950 text-xs text-gray-200 p-2.5 rounded-xl border border-gray-800 outline-none w-full font-bold focus:border-blue-500"
                  >
                    <option value="souqbaghdad">📘 بوست في صفحة سوق بغداد (Souq Baghdad)</option>
                    <option value="alrafdain">🎓 بوست في صفحة الرافدين (@alrafdain1)</option>
                  </select>
                </div>
              )}
            </div>

            {/* 3. Instagram Section */}
            <div className="bg-gray-900/90 border border-pink-500/30 rounded-2xl p-3.5 transition-all">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={publishTargets.instagram} 
                    onChange={e => setPublishTargets(p => ({ ...p, instagram: e.target.checked }))} 
                    className="w-5 h-5 rounded accent-pink-500" 
                  />
                  <span className="text-white font-black text-sm flex items-center gap-1.5">
                    <Instagram className="w-4 h-4 text-pink-400" />
                    انستقرام (Instagram)
                  </span>
                </label>
                <span className="text-[11px] font-bold text-pink-400 bg-pink-500/15 border border-pink-500/30 px-2 py-0.5 rounded-full">
                  {publishTargets.instagramPage === 'alrafdain' ? '🟢 ستوري فقط (Story)' : '🟢 بوست + ستوري'}
                </span>
              </div>
              {publishTargets.instagram && (
                <div className="mr-6 pt-2 border-t border-gray-800/80">
                  <p className="text-[11px] font-bold text-gray-400 mb-1.5">الحساب المستهدف (انستقرام):</p>
                  <select 
                    value={publishTargets.instagramPage} 
                    onChange={e => setPublishTargets(p => ({ ...p, instagramPage: e.target.value }))} 
                    className="bg-gray-950 text-xs text-gray-200 p-2.5 rounded-xl border border-gray-800 outline-none w-full font-bold focus:border-pink-500"
                  >
                    <option value="souqbaghdad">📸 بوست في حساب سوق بغداد (@souqbaghdad.iq)</option>
                    <option value="alrafdain">🎓 ستوري في حساب الرافدين (@al_rafdain)</option>
                  </select>
                </div>
              )}
            </div>

            {/* 4. Threads Section */}
            <div className="bg-gray-900/90 border border-gray-700/50 rounded-2xl p-3.5 flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={publishTargets.threads} 
                  onChange={e => setPublishTargets(p => ({ ...p, threads: e.target.checked }))} 
                  className="w-5 h-5 rounded accent-gray-400" 
                />
                <span className="text-white font-black text-sm">ثريدز (Threads) — @souqbaghdad.iq</span>
              </label>
              <span className="text-[11px] font-bold text-gray-300 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-full">
                🟢 متصل
              </span>
            </div>

            {/* 5. Auto-Publish Routing Settings Panel (Toggle) */}
            <div className="border border-gray-800 rounded-2xl overflow-hidden bg-gray-950/80">
              <button 
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="w-full p-3 flex items-center justify-between text-xs font-black text-gray-300 hover:text-white hover:bg-gray-900/60 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <span>⚙️ ضبط إعدادات التوجيه التلقائي للقنوات</span>
                </div>
                {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showSettings && (
                <div className="p-3.5 border-t border-gray-800 space-y-3 bg-gray-900/40 text-xs">
                  <p className="text-gray-400 leading-relaxed font-medium">
                    التحكم في الوجهة التلقائية للإعلانات عند قيام الزبائن بالنشر من الموقع أو البوت:
                  </p>
                  
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-between">
                      <span className="font-bold text-gray-200">🚌 إعلانات خطوط النقل العامة:</span>
                      <span className="text-sky-400 font-mono font-bold" dir="ltr">@souqbaghdad_lines</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-between">
                      <span className="font-bold text-gray-200">🎓 إعلانات خطوط كلية الرافدين:</span>
                      <span className="text-amber-400 font-mono font-bold" dir="ltr">@souqbaghdad_lines + @ruc_1</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-between">
                      <span className="font-bold text-gray-200">🚗 إعلانات قسم السيارات:</span>
                      <span className="text-emerald-400 font-mono font-bold" dir="ltr">@souqbaghdad_car</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-between">
                      <span className="font-bold text-gray-200">🛍️ إعلانات المنتجات وسوق بغداد:</span>
                      <span className="text-blue-400 font-mono font-bold" dir="ltr">@souqbaghdad_iq</span>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={handleSaveSettings}
                    className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-blue-300 font-bold rounded-xl border border-blue-500/30 transition-all text-xs flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>حفظ هذه الخيارات كافتراضية</span>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-800 mt-4 shrink-0">
            <button 
              onClick={handlePublish} 
              disabled={isPublishing} 
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 disabled:opacity-50 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 border border-blue-400/40 transition-all"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>جاري النشر والتوليد...</span>
                </>
              ) : (
                <>
                  <Send className="w-4.5 h-4.5" />
                  <span>نشر الآن على المنصات المحددة</span>
                </>
              )}
            </button>
            <button 
              onClick={onClose} 
              disabled={isPublishing}
              className="px-5 py-3 bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold text-sm rounded-2xl border border-gray-800 transition-all"
            >
              إلغاء
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
