import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Copy, Check, Share2, MessageCircle, Send, Facebook, 
  Smartphone, Download, Sparkles, Image as ImageIcon, 
  Layers, Link2, PlusCircle, PlayCircle, SendHorizontal, Lightbulb, HelpCircle, Info
} from 'lucide-react';

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  image?: string;
  price?: string;
  governorate?: string;
  location?: string;
  short_id?: string;
  description?: string;
}

type PlatformType = 'insta_story' | 'insta_direct' | 'insta_reels' | 'facebook' | 'whatsapp' | 'telegram' | 'copy_link' | 'native';

export function ShareModal({ 
  isOpen, 
  onClose, 
  title, 
  url, 
  image, 
  price, 
  governorate, 
  location,
  short_id,
  description 
}: ShareModalProps) {
  const [cardFormat, setCardFormat] = useState<'story' | 'post'>('story');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const locText = governorate || location || 'العراق';
  const idBadge = short_id ? `#${short_id}` : '';
  const fullUrl = url.startsWith('http') ? url : `https://www.souqbaghdad.store${url.startsWith('/') ? url : '/' + url}`;

  // Formatted captions
  const descSnippet = description ? `\n📝 *الوصف:* ${description.slice(0, 100)}${description.length > 100 ? '...' : ''}` : '';
  const shareText = `📢 *عرض خاص من منصة سوق بغداد:* 🇮🇶\n\n🛍️ *${title}* ${idBadge}\n📍 *الموقع:* ${locText}${price ? `\n🏷️ *السعر:* ${price} د.ع` : ''}${descSnippet}\n\nتواصل مباشر وسريع بين البائع والمشتري! 🚀🤝\n\n🔗 *رابط التفاصيل:* ${fullUrl}`;
  const telegramText = `🛍️ *${title}* ${idBadge}\n📍 الموقع: ${locText}${price ? `\n🏷️ السعر: ${price} د.ع` : ''}\n\nتصفح الإعلان والتواصل المباشر عبر المنصة 🚀\n👇🔗\n${fullUrl}`;

  useEffect(() => {
    if (isOpen) {
      generateCanvasCard(cardFormat);
    }
  }, [isOpen, cardFormat, title, price, image, locText, description]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    triggerToast('📋 تم نسخ رابط الإعلان المباشر بنجاح!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedText(true);
    triggerToast('📝 تم نسخ نص الإعلان والتفاصيل بالكامل!');
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Canvas Drawing Generator (Fixing Base64 CORS & Adding Description)
  const generateCanvasCard = async (format: 'story' | 'post') => {
    setIsGeneratingCard(true);
    try {
      const isStory = format === 'story';
      const width = 1080;
      const height = isStory ? 1920 : 1080;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0a1128');
      bgGrad.addColorStop(0.5, '#0f172a');
      bgGrad.addColorStop(1, '#070b19');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Circles
      ctx.save();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
      ctx.beginPath();
      ctx.arc(width * 0.9, height * 0.1, 400, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Header Badge
      const headerY = isStory ? 110 : 50;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.roundRect ? ctx.roundRect(width / 2 - 270, headerY, 540, 90, 45) : ctx.fillRect(width / 2 - 270, headerY, 540, 90);
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 40px system-ui, sans-serif';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('سوك بغداد 🇮🇶 SOUQ BAGHDAD', width / 2, headerY + 45);

      // Image Area
      const imgSize = isStory ? 720 : 480;
      const imgX = (width - imgSize) / 2;
      const imgY = isStory ? 240 : 160;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 35;
      ctx.shadowOffsetY = 18;
      ctx.fillStyle = '#1e293b';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(imgX, imgY, imgSize, imgSize, 36);
        ctx.fill();
      } else {
        ctx.fillRect(imgX, imgY, imgSize, imgSize);
      }
      ctx.restore();

      // Fix Base64 image loading on Canvas (Do NOT set crossOrigin for base64 data URLs)
      if (image) {
        try {
          const img = new Image();
          if (!image.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
          }
          img.src = image;
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
          });

          ctx.save();
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(imgX, imgY, imgSize, imgSize, 36);
            ctx.clip();
          }
          
          const aspect = img.width / img.height;
          let drawW = imgSize;
          let drawH = imgSize;
          let offX = 0;
          let offY = 0;

          if (aspect > 1) {
            drawW = imgSize * aspect;
            offX = -(drawW - imgSize) / 2;
          } else {
            drawH = imgSize / aspect;
            offY = -(drawH - imgSize) / 2;
          }

          ctx.drawImage(img, imgX + offX, imgY + offY, drawW, drawH);
          ctx.restore();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 4;
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(imgX, imgY, imgSize, imgSize, 36);
            ctx.stroke();
          }
        } catch (err) {
          console.error('Image draw error:', err);
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 120px system-ui';
          ctx.fillText('🛍️', width / 2, imgY + imgSize / 2);
        }
      } else {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 120px system-ui';
        ctx.fillText('🛍️', width / 2, imgY + imgSize / 2);
      }

      // Content Box
      const contentY = imgY + imgSize + (isStory ? 60 : 35);
      ctx.font = 'bold 48px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      
      let displayTitle = title;
      if (displayTitle.length > 35) {
        displayTitle = displayTitle.substring(0, 32) + '...';
      }
      ctx.fillText(displayTitle, width / 2, contentY);

      const badgeY = contentY + 65;
      ctx.font = 'bold 32px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`📍 ${locText} ${idBadge}`, width / 2, badgeY);

      // Render Description Snippet
      let nextY = badgeY + 55;
      if (description) {
        ctx.font = '28px system-ui, sans-serif';
        ctx.fillStyle = '#cbd5e1';
        let cleanDesc = description.replace(/[\r\n]+/g, ' ').trim();
        if (cleanDesc.length > 60) {
          cleanDesc = cleanDesc.substring(0, 57) + '...';
        }
        ctx.fillText(cleanDesc, width / 2, nextY);
        nextY += 55;
      }

      if (price) {
        const priceY = nextY + (isStory ? 35 : 20);
        const priceText = `${price} د.ع`;
        ctx.font = 'bold 56px system-ui, sans-serif';
        const pWidth = ctx.measureText(priceText).width + 90;
        
        const pGrad = ctx.createLinearGradient(width/2 - pWidth/2, priceY - 45, width/2 + pWidth/2, priceY + 45);
        pGrad.addColorStop(0, '#fbbf24');
        pGrad.addColorStop(1, '#d97706');
        ctx.fillStyle = pGrad;

        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(width / 2 - pWidth / 2, priceY - 45, pWidth, 90, 45);
          ctx.fill();
        } else {
          ctx.fillRect(width / 2 - pWidth / 2, priceY - 45, pWidth, 90);
        }

        ctx.fillStyle = '#0f172a';
        ctx.fillText(priceText, width / 2, priceY + 4);
      }

      const footerY = isStory ? height - 130 : height - 50;
      ctx.font = 'bold 34px system-ui, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('تصفح الإعلان والتواصل المباشر عبر المنصة 🚀', width / 2, footerY);
      
      ctx.font = 'bold 30px system-ui, sans-serif';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('www.souqbaghdad.store', width / 2, footerY + 45);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCardDataUrl(dataUrl);
    } catch (e) {
      console.error('Failed card creation', e);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  // Helper to convert base64 dataUrl to File object
  const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File | null> => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      return new File([blob], filename, { type: 'image/jpeg' });
    } catch {
      return null;
    }
  };

  const downloadCard = async () => {
    if (!cardDataUrl) return;

    // Check if on mobile with native Web Share API supporting files (iOS Safari / Android Chrome)
    if (typeof navigator !== 'undefined' && navigator.share) {
      const file = await dataUrlToFile(cardDataUrl, `souq-baghdad-${(title || 'item').replace(/\s+/g, '-')}.jpg`);
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: title,
            files: [file],
          });
          triggerToast('📸 اختر "حفظ الصورة (Save Image)" لحفظها فوراً بالاستوديو!');
          return;
        } catch (e) {
          // Fallback
        }
      }
    }

    // Standard Download Fallback
    const a = document.createElement('a');
    a.href = cardDataUrl;
    a.download = `souq-baghdad-${cardFormat}-${(title || 'item').replace(/\s+/g, '-')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerToast('📸 تم تنزيل الصورة! اضغط عليها واختر "إضافة للصور"');
  };

  // Immediate App Launcher & Target Handler
  const handleAppClick = async (platform: PlatformType) => {
    if (platform === 'copy_link') {
      handleCopyLink();
      return;
    }

    if (platform === 'native') {
      triggerToast('📱 جاري فتح نافذة تطبيقات الهاتف الرسمية...');
      if (cardDataUrl && typeof navigator !== 'undefined' && navigator.share) {
        try {
          const file = await dataUrlToFile(cardDataUrl, `souq-baghdad-share.jpg`);
          if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: title,
              text: shareText,
              files: [file],
            });
            return;
          }
        } catch (e) {}
      }
      if (navigator.share) navigator.share({ title, text: shareText, url: fullUrl }).catch(()=>{});
      else handleCopyCaption();
      return;
    }

    // Copy caption & link immediately
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      // ignore
    }

    if (platform === 'insta_story' || platform === 'insta_reels') {
      triggerToast('🚀 جاري تحويل بطاقة التصميم والرابط للانستغرام...');
      
      const targetUrl = cardDataUrl;
      if (targetUrl && typeof navigator !== 'undefined' && navigator.share) {
        try {
          const file = await dataUrlToFile(targetUrl, `souq-baghdad-${platform}.jpg`);
          if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: title,
              text: shareText,
              files: [file],
            });
            return;
          }
        } catch (e) {
          console.log('Native share closed:', e);
        }
      }
      window.open('https://www.instagram.com/', '_blank');
    } else if (platform === 'insta_direct') {
      triggerToast('💬 تم نسخ نص الإعلان والرابط! جاري فتح خاص انستغرام...');
      window.open('https://www.instagram.com/direct/inbox/', '_blank');
    } else if (platform === 'facebook') {
      triggerToast('🚀 تم نسخ النص والرابط! جاري تحويلك لفيسبوك...');
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, '_blank');
    } else if (platform === 'whatsapp') {
      triggerToast('💬 تم نسخ النص والرابط! جاري فتح واتساب...');
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform === 'telegram') {
      triggerToast('✈️ تم نسخ الإعلان الكامل! جاري فتح تليجرام...');
      window.open(`https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(telegramText)}`, '_blank');
    }
  };

  if (!isOpen) return null;

  // TikTok Style App Slider Items
  const appSliderItems: { id: PlatformType; name: string; tag: string; icon: any; bg: string }[] = [
    { 
      id: 'native', 
      name: 'تطبيقات الهاتف', 
      tag: 'القائمة الأصلية 📱', 
      icon: <Smartphone className="w-7 h-7 text-black" />, 
      bg: 'bg-amber-400 shadow-amber-500/30 ring-2 ring-amber-300' 
    },
    { 
      id: 'copy_link', 
      name: 'نسخ الرابط', 
      tag: 'رابط مباشر 🔗', 
      icon: <Link2 className="w-7 h-7 text-white" />, 
      bg: 'bg-blue-500 shadow-blue-500/30' 
    },
    { 
      id: 'insta_story', 
      name: 'انستا ستوري', 
      tag: 'تصميم + رابط 📸', 
      icon: <PlusCircle className="w-7 h-7 text-white" />, 
      bg: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shadow-pink-500/30' 
    },
    { 
      id: 'insta_direct', 
      name: 'انستا دايركت', 
      tag: 'نص ورابط 💬', 
      icon: <SendHorizontal className="w-7 h-7 text-white" />, 
      bg: 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/30' 
    },
    { 
      id: 'insta_reels', 
      name: 'انستا ريلز/بوست', 
      tag: 'صورة + كابشن 🖼️', 
      icon: <PlayCircle className="w-7 h-7 text-white" />, 
      bg: 'bg-gradient-to-tr from-pink-600 to-purple-800 shadow-pink-500/30' 
    },
    { 
      id: 'facebook', 
      name: 'فيسبوك', 
      tag: 'بوست / ستوري', 
      icon: <Facebook className="w-7 h-7 text-white" />, 
      bg: 'bg-blue-600 shadow-blue-500/30' 
    },
    { 
      id: 'whatsapp', 
      name: 'واتساب', 
      tag: 'ستوري / خاص', 
      icon: <MessageCircle className="w-7 h-7 text-white" />, 
      bg: 'bg-emerald-500 shadow-emerald-500/30' 
    },
    { 
      id: 'telegram', 
      name: 'تليجرام', 
      tag: 'إعلان كامل ✈️', 
      icon: <Send className="w-7 h-7 text-white" />, 
      bg: 'bg-sky-500 shadow-sky-500/30' 
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
      >
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative bg-gray-900/98 border-t sm:border border-gray-700/80 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl z-10 text-right dir-rtl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Sheet Drag Handle Bar */}
          <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-3 shrink-0" />

          {/* Active Toast Notification */}
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-center text-xs font-bold text-amber-300 flex items-center justify-center gap-2 shrink-0 shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>{toastMsg}</span>
            </motion.div>
          )}

          {/* MAIN TIKTOK SLIDER SCREEN */}
          <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar flex-1 pb-2">
            {/* Header Preview Item */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {image ? (
                  <img src={image} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-700 shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-xl shrink-0">🛍️</div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-white font-bold text-sm truncate">{title}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    {price && <span className="text-amber-400 font-bold text-xs">{price} د.ع</span>}
                    <span className="text-gray-400 text-[11px]">• {locText}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 mr-2 shrink-0">
                <button
                  onClick={() => setShowGuide(!showGuide)}
                  className={`p-2 rounded-xl border transition-colors flex items-center gap-1 text-xs font-bold ${
                    showGuide ? 'bg-amber-500 text-black border-amber-400' : 'bg-gray-800 hover:bg-gray-700 text-amber-400 border-amber-500/30'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>دليل الشرح</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* INTERACTIVE GUIDE BOX (HOW TO USE) */}
            <AnimatePresence>
              {showGuide && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 bg-gradient-to-r from-amber-500/15 to-amber-600/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200 space-y-2 dir-rtl overflow-hidden shrink-0"
                >
                  <div className="flex items-center gap-2 font-bold text-amber-300 text-sm border-b border-amber-500/20 pb-2">
                    <Info className="w-4 h-4 text-amber-400" />
                    <span>📖 دليل استخدام ميزات المشاركة:</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-[11px] text-gray-300 leading-relaxed">
                    <div className="flex items-start gap-2">
                      <span className="bg-amber-500 text-black font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0 mt-0.5">1</span>
                      <span><strong>تطبيقات الهاتف 📱:</strong> يفتح قائمة الموبايل الرسمية لمشاركة بطاقة التصميم مباشرة مع أي تطبيق أو جهة اتصال.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="bg-amber-500 text-black font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0 mt-0.5">2</span>
                      <span><strong>حفظ التصميم بالاستوديو 📸:</strong> يحفظ بطاقة إعلانك الفاخرة مباشرة في ألبوم صور جهازك.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="bg-amber-500 text-black font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0 mt-0.5">3</span>
                      <span><strong>نسخ الرابط 🔗:</strong> ينسخ رابط الإعلان المباشر لشاركه في أي مكان.</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* TIKTOK APPS SLIDER ROW */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>اختر المنصة والوجهة للمشاركة 🚀</span>
                </span>
                <span className="text-[10px] text-gray-500">سحب لليمين/اليسار ➔</span>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 px-1 no-scrollbar scroll-smooth">
                {appSliderItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleAppClick(item.id)}
                    className="flex flex-col items-center shrink-0 group focus:outline-none"
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all group-hover:scale-110 group-active:scale-95 ${item.bg}`}>
                      {item.icon}
                    </div>
                    <span className="text-xs font-bold text-white mt-1.5">{item.name}</span>
                    <span className="text-[9px] text-gray-400 font-medium">{item.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* PROMINENT USER TIP BOX FOR STORY LINK STICKER */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-xs text-blue-200 flex items-start gap-2.5 my-2 text-right dir-rtl">
              <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1">
                <span className="font-bold block text-blue-300 text-xs mb-0.5">💡 نصيحة للنشر الذكي في الستوري:</span>
                <span className="text-[11px] leading-relaxed text-gray-300 block">
                  تم نسخ رابط إعلانك تلقائياً! عند تحويلك للانستغرام، اضغط على **ملصق الرابط (Link Sticker 🔗)** واضغط **لصق (Paste)** حتى يسهل على المتابعين الدخول لإعلانك بنقرة واحدة!
                </span>
              </div>
            </div>

            {/* ACTION UTILITIES ROW */}
            <div className="pt-2 border-t border-gray-800/80">
              <div className="mb-2 px-1">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>أدوات وتصاميم سريعة</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyCaption}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 transition-all ${
                    copiedText 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                      : 'bg-gray-800/60 hover:bg-gray-800 border-gray-700/60 text-gray-200'
                  }`}
                >
                  {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                  <span className="text-xs font-bold">نسخ الكابشن والتفاصيل</span>
                </button>

                <button
                  onClick={downloadCard}
                  disabled={!cardDataUrl || isGeneratingCard}
                  className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold">حفظ التصميم بالاستوديو 📸</span>
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
