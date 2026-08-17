import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Sparkles, Image as ImageIcon, Smartphone, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SocialImageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: {
    id: string | number;
    short_id?: string;
    university?: string;
    city?: string;
    regions?: string;
    location?: string;
    fare?: string;
    price?: string | number;
    type?: string;
    description?: string;
    images?: string[];
  };
}

export const SocialImageGeneratorModal: React.FC<SocialImageGeneratorModalProps> = ({
  isOpen,
  onClose,
  ad
}) => {
  const [templateType, setTemplateType] = useState<'post' | 'story'>('post');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  if (!isOpen || !ad) return null;

  const shortId = ad.short_id || String(ad.id);
  const title = 'خط نقل جديد في بغداد';
  const subtitle = ad.university || ad.city || 'جامعة الرافدين';
  let catType = 'خط نقل طلاب وموظفين';
  try {
    if (ad.description && typeof ad.description === 'string' && ad.description.startsWith('{')) {
      const p = JSON.parse(ad.description);
      if (p.categoryType === 'employee') catType = 'خط موظفين';
      else if (p.categoryType === 'emergency') catType = 'نقل خاص';
      else if (p.targetAudience) catType = `خط ${p.targetAudience}`;
    }
  } catch {}

  const rawReg = ad.regions || ad.location || 'صليخ 600 - سبع بكار - كريعات - حي تونس - القاهرة';
  const regions = rawReg.replace(/<[^>]*>?/gm, '').replace(/&lt;.*?&gt;/gm, '').trim();
  const destination = (ad.city || ad.university || 'جامعة الرافدين').replace(/<[^>]*>?/gm, '').trim();
  
  let fare = 'حسب الاتفاق';
  if (ad.price) {
    const rawNum = String(ad.price).replace(/[^0-9]/g, '');
    if (rawNum && Number(rawNum) > 0) {
      fare = `${Number(rawNum).toLocaleString('en-US')} د.ع`;
    } else if (typeof ad.price === 'string' && ad.price.trim()) {
      fare = ad.price.trim();
    }
  } else if (ad.fare) {
    fare = `${ad.fare} د.ع`;
  }
  const link = `https://www.souqbaghdad.store/transport/card/${shortId}`;

  const imageUrl = `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=${templateType}&title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(subtitle)}&subdesc=${encodeURIComponent(catType)}&regions=${encodeURIComponent(regions)}&destination=${encodeURIComponent(destination)}&fare=${encodeURIComponent(fare)}&link=${encodeURIComponent(link)}&short_id=${encodeURIComponent(shortId)}`;

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `souqbaghdad_${templateType}_${shortId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (e) {
      window.open(imageUrl, '_blank');
    }
  };

  const handleDirectPublish = async () => {
    setIsPublishing(true);
    setPublishSuccess(false);
    try {
      const { error } = await supabase.functions.invoke('telegram-bot', {
        body: {
          type: 'INSERT',
          table: 'transport_ads',
          record: ad,
          targets: { facebook: true, instagram: true, threads: true, telegram: true }
        }
      });
      if (error) throw error;
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 4000);
    } catch (err: any) {
      alert('خطأ أثناء النشر: ' + (err.message || err));
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-sky-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-black text-base sm:text-lg">مولّد بوست وستوري إنستقرام الديناميكي</h3>
                <p className="text-xs text-slate-400">تصميم تلقائي وهوية موحدة مع حماية الوصول وحظر التكرار</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Controls Left */}
            <div className="md:col-span-5 flex flex-col gap-4">
              {/* Type Switcher */}
              <div className="bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setTemplateType('post')}
                  className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                    templateType === 'post'
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  بوست (1080×1350)
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateType('story')}
                  className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                    templateType === 'story'
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  ستوري (1080×1920)
                </button>
              </div>

              {/* Data Summary Card */}
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
                <div className="text-slate-400 font-bold mb-2">📋 البيانات المسحوبة من الاستمارة:</div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">الوجهة:</span>
                  <span className="text-white font-bold">{destination}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">الانطلاق:</span>
                  <span className="text-white font-bold line-clamp-1 max-w-[180px]">{regions}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">الأجرة:</span>
                  <span className="text-amber-400 font-bold">{fare}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">كود الإعلان:</span>
                  <span className="text-sky-400 font-bold">#{shortId}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mt-auto">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-2xl border border-slate-700 flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98]"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  تحميل الصورة بدقة كاملة (PNG)
                </button>

                <button
                  type="button"
                  onClick={handleDirectPublish}
                  disabled={isPublishing}
                  className="w-full py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري النشر عبر السيرفر...
                    </>
                  ) : publishSuccess ? (
                    <>
                      <Check className="w-5 h-5 text-green-300" />
                      تم النشر بنجاح!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-5 h-5" />
                      نشر فوري (إنستقرام • فيسبوك • ثريدز)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Preview Right */}
            <div className="md:col-span-7 bg-slate-950 rounded-2xl border border-slate-800/80 p-3 flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden">
              <div className="text-[11px] text-slate-500 mb-2">معاينة حية للتصميم المولد تلقائياً:</div>
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-sky-500/20 max-h-[500px] flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt="Instagram Preview"
                  className="max-h-[480px] w-auto object-contain rounded-lg"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
