// ===========================================
// مسؤولية هذا الملف:
// نافذة مشاركة الإعلان أو المنتج (Share Modal) المحدثة والمحسنة.
// تدعم مشاركة الرابط، نسخه، تخصيص الكابشن، وتصميم بطاقات احترافية للنشر في وسائل التواصل الاجتماعي.
//
// لا يتصل بـ Supabase مباشرة.
//
// آمن للتعديل:
// نعم.
// ===========================================
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Copy, Check, Share2, MessageCircle, Send, Facebook, 
  Smartphone, Download, Sparkles, Image as ImageIcon, 
  Layers, Link2, PlusCircle, PlayCircle, SendHorizontal, Lightbulb, HelpCircle, Info, ChevronDown, ChevronUp,
  FileText, Palette, SlidersHorizontal, CheckCircle2
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

type PlatformType = 'insta_story' | 'insta_direct' | 'insta_reels' | 'facebook' | 'whatsapp' | 'telegram' | 'copy_link' | 'native' | 'show_more';

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
  const [activeTab, setActiveTab] = useState<'text' | 'card'>('text');
  const [cardFormat, setCardFormat] = useState<'story' | 'post'>('story');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showAllApps, setShowAllApps] = useState(false);
  
  // Interactive Custom Caption State
  const [customCaption, setCustomCaption] = useState('');

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const locText = governorate || location || 'العراق';
  const idBadge = short_id ? `#${short_id}` : '';
  const fullUrl = url.startsWith('http') ? url : `https://www.souqbaghdad.store${url.startsWith('/') ? url : '/' + url}`;

  // Base captains
  const getShareText = () => {
    const descSnippet = description ? `\n📝 *الوصف:* ${description.slice(0, 100)}${description.length > 100 ? '...' : ''}` : '';
    return `✨ *أهلاً بك في منصة سوق بغداد الرقمية* 🇮🇶✨\n\n🛍️ *${title}* ${idBadge}\n📍 *الموقع:* ${locText}${price ? `\n🏷️ *السعر:* ${price} د.ع` : ''}${descSnippet}\n\nتواصل مباشر وسريع بين البائع والمشتري! 🚀🤝\n\n🔗 *رابط التفاصيل:* ${fullUrl}`;
  };

  const telegramText = `✨ *أهلاً بك في منصة سوق بغداد الرقمية* 🇮🇶✨\n\n🛍️ *${title}* ${idBadge}\n📍 *الموقع:* ${locText}${price ? `\n🏷️ *السعر:* ${price} د.ع` : ''}\n\nتصفح كافة التفاصيل وتواصل مباشر مع البائع عبر المنصة 🚀\n👇🔗\n${fullUrl}`;

  // Sync caption when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setCustomCaption(getShareText());
    }
  }, [isOpen, title, price, locText, description, fullUrl]);

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
    navigator.clipboard.writeText(customCaption);
    setCopiedText(true);
    triggerToast('📝 تم نسخ نص الإعلان والتفاصيل المخصصة بالكامل!');
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Canvas Drawing Generator
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
      ctx.fillText('سوق بغداد 🇮🇶 SOUQ BAGHDAD', width / 2, headerY + 45);

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

    if (typeof navigator !== 'undefined' && navigator.share) {
      const file = await dataUrlToFile(cardDataUrl, `souq-baghdad-${(title || 'item').replace(/\s+/g, '-')}.jpg`);
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: title,
            files: [file],
          });
          triggerToast('📸 اختر "حفظ الصورة" لحفظها فوراً بالاستوديو!');
          return;
        } catch (e) {
          // Fallback
        }
      }
    }

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
    if (platform === 'show_more') {
      setShowAllApps(!showAllApps);
      return;
    }

    if (platform === 'copy_link') {
      handleCopyLink();
      return;
    }

    if (platform === 'native') {
      triggerToast('📱 جاري فتح قائمة التطبيقات الرسمية...');
      const brandTitle = `سوق بغداد 🇮🇶 | ${title}`;
      if (cardDataUrl && typeof navigator !== 'undefined' && navigator.share) {
        try {
          const file = await dataUrlToFile(cardDataUrl, `Souq-Baghdad.jpg`);
          if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: brandTitle,
              files: [file],
            });
            return;
          }
        } catch (e) {}
      }
      if (navigator.share) navigator.share({ title: brandTitle, text: customCaption, url: fullUrl }).catch(()=>{});
      else handleCopyCaption();
      return;
    }

    // Copy caption & link immediately to clipboard
    try {
      await navigator.clipboard.writeText(customCaption);
    } catch {
      // ignore
    }

    if (platform === 'insta_story' || platform === 'insta_reels') {
      triggerToast('🚀 جاري مشاركة التصميم والرابط مع انستغرام...');
      
      const targetUrl = cardDataUrl;
      if (targetUrl && typeof navigator !== 'undefined' && navigator.share) {
        try {
          const file = await dataUrlToFile(targetUrl, `souq-baghdad-${platform}.jpg`);
          if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: title,
              files: [file],
            });
            return;
          }
        } catch (e) {}
      }
      window.open('https://www.instagram.com/', '_blank');
    } else if (platform === 'insta_direct') {
      triggerToast('💬 تم نسخ نص الإعلان! جاري فتح انستغرام...');
      window.open('https://www.instagram.com/direct/inbox/', '_blank');
    } else if (platform === 'facebook') {
      triggerToast('🚀 تم نسخ النص والرابط! جاري تحويلك لفيسبوك...');
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, '_blank');
    } else if (platform === 'whatsapp') {
      triggerToast('💬 تم نسخ النص والرابط! جاري فتح واتساب...');
      window.open(`https://wa.me/?text=${encodeURIComponent(customCaption)}`, '_blank');
    } else if (platform === 'telegram') {
      triggerToast('✈️ تم نسخ الإعلان المرفق! جاري فتح تليجرام...');
      window.open(`https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(telegramText)}`, '_blank');
    }
  };

  if (!isOpen) return null;

  // Primary Essential Apps
  const primaryApps: { id: PlatformType; name: string; tag: string; icon: any; bg: string }[] = [
    { 
      id: 'native', 
      name: 'تطبيقات الهاتف', 
      tag: 'القائمة الأصلية 📱', 
      icon: <Smartphone className="w-6 h-6 text-black" />, 
      bg: 'bg-amber-400 shadow-amber-500/30 ring-2 ring-amber-300' 
    },
    { 
      id: 'copy_link', 
      name: 'نسخ الرابط', 
      tag: 'رابط مباشر 🔗', 
      icon: <Link2 className="w-6 h-6 text-white" />, 
      bg: 'bg-blue-500 shadow-blue-500/30' 
    },
    { 
      id: 'whatsapp', 
      name: 'واتساب', 
      tag: 'ستوري / خاص 💬', 
      icon: <MessageCircle className="w-6 h-6 text-white" />, 
      bg: 'bg-emerald-500 shadow-emerald-500/30' 
    },
    { 
      id: 'telegram', 
      name: 'تليجرام', 
      tag: 'إعلان كامل ✈️', 
      icon: <Send className="w-6 h-6 text-white" />, 
      bg: 'bg-sky-500 shadow-sky-500/30' 
    },
  ];

  // Secondary Extra Apps
  const secondaryApps: { id: PlatformType; name: string; tag: string; icon: any; bg: string }[] = [
    { 
      id: 'insta_story', 
      name: 'انستا ستوري', 
      tag: 'تصميم + رابط 📸', 
      icon: <PlusCircle className="w-6 h-6 text-white" />, 
      bg: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shadow-pink-500/30' 
    },
    { 
      id: 'insta_direct', 
      name: 'انستا دايركت', 
      tag: 'نص ورابط 💬', 
      icon: <SendHorizontal className="w-6 h-6 text-white" />, 
      bg: 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/30' 
    },
    { 
      id: 'insta_reels', 
      name: 'انستا ريلز/بوست', 
      tag: 'صورة + كابشن 🖼️', 
      icon: <PlayCircle className="w-6 h-6 text-white" />, 
      bg: 'bg-gradient-to-tr from-pink-600 to-purple-800 shadow-pink-500/30' 
    },
    { 
      id: 'facebook', 
      name: 'فيسبوك', 
      tag: 'بوست / ستوري 📘', 
      icon: <Facebook className="w-6 h-6 text-white" />, 
      bg: 'bg-blue-600 shadow-blue-500/30' 
    },
  ];

  const currentSliderItems = showAllApps ? [...primaryApps, ...secondaryApps] : primaryApps;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md"
      >
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative bg-gray-900 border-t sm:border border-gray-800 rounded-t-[2.5rem] sm:rounded-3xl p-5 w-full max-w-lg shadow-2xl z-10 text-right dir-rtl max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Sheet Drag Handle Bar */}
          <div className="w-14 h-1.5 bg-gray-800 rounded-full mx-auto mb-4 shrink-0 cursor-pointer hover:bg-gray-700 transition-colors" onClick={onClose} />

          {/* Active Toast Notification */}
          <AnimatePresence>
            {toastMsg && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-4 left-4 right-4 z-50 p-3 bg-amber-500 text-black rounded-2xl text-center text-xs font-black flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{toastMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header Preview Item */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-800 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {image ? (
                <img src={image} alt="" className="w-12 h-12 rounded-2xl object-cover border border-gray-800 shrink-0 shadow-md" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gray-850 flex items-center justify-center text-xl shrink-0 border border-gray-800">🛍️</div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-amber-500 font-bold block mb-0.5">جاهز للمشاركة المباشرة ✨</span>
                <h4 className="text-white font-black text-sm truncate">{title}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  {price && <span className="text-amber-400 font-bold text-xs">{price} د.ع</span>}
                  <span className="text-gray-400 text-[11px]">• {locText}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 mr-2 shrink-0">
              <button
                onClick={() => setShowGuide(!showGuide)}
                className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                  showGuide ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/10' : 'bg-gray-850 hover:bg-gray-800 text-amber-400 border-amber-500/20'
                }`}
              >
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">كيف أشارك؟</span>
              </button>
              <button
                onClick={onClose}
                className="p-2.5 bg-gray-850 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white border border-gray-800 transition-colors"
                title="إغلاق"
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
                className="mt-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-200 space-y-2.5 dir-rtl overflow-hidden shrink-0"
              >
                <div className="flex items-center gap-2 font-bold text-amber-400 text-sm border-b border-amber-500/10 pb-2">
                  <Info className="w-4 h-4" />
                  <span>دليل الاستفادة القصوى من ميزات النشر السريع 📱</span>
                </div>
                <div className="grid grid-cols-1 gap-2.5 text-[11px] text-gray-300 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="bg-amber-500 text-black font-black w-5 h-5 flex items-center justify-center rounded-full text-[10px] shrink-0">١</span>
                    <span><strong>مشاركة الرابط والنص 🔗:</strong> يمكنك نسخ وتخصيص كابشن الإعلان الجاهز ثم إرساله لواتساب أو تليجرام مباشرة.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-amber-500 text-black font-black w-5 h-5 flex items-center justify-center rounded-full text-[10px] shrink-0">٢</span>
                    <span><strong>بطاقات التصميم للنشر 📸:</strong> تتيح لك تنزيل بطاقة إعلانية جذابة مجهزة تلقائياً بمعلومات وسعر المنتج لنشرها في ستوري إنستغرام أو فيسبوك بنقرة واحدة.</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TAB SWITCHER: TEXT VS DESIGN CARD */}
          <div className="flex bg-gray-950 border border-gray-850 rounded-2xl p-1 my-4 shrink-0 shadow-inner">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-3 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'text' 
                  ? 'bg-amber-500 text-black font-black shadow-md shadow-amber-500/10' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>مشاركة الرابط والوصف</span>
            </button>
            <button
              onClick={() => setActiveTab('card')}
              className={`flex-1 py-3 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'card' 
                  ? 'bg-amber-500 text-black font-black shadow-md shadow-amber-500/10' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>تصاميم بطاقات النشر 📸</span>
            </button>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 overflow-y-auto pr-1 pl-1 custom-scrollbar space-y-4 pb-2">
            
            {activeTab === 'text' ? (
              // TAB 1: EDITABLE CAPTION & SOCIAL APPS
              <div className="space-y-4 animate-fadeIn">
                
                {/* Customizable Text Area */}
                <div className="bg-gray-950 border border-gray-850 rounded-2xl p-3 shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-gray-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      <span>الكابشن الجاهز (تعديل مباشر ✍️)</span>
                    </span>
                    <button 
                      onClick={handleCopyCaption}
                      className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[10px] font-black rounded-lg flex items-center gap-1.5 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedText ? 'تم النسخ!' : 'نسخ الكابشن'}</span>
                    </button>
                  </div>
                  
                  <textarea
                    value={customCaption}
                    onChange={(e) => setCustomCaption(e.target.value)}
                    className="w-full h-32 bg-transparent text-gray-200 text-xs leading-relaxed font-medium focus:outline-none resize-none scrollbar-none custom-scrollbar"
                    placeholder="اكتب كابشن الإعلان هنا..."
                    dir="rtl"
                  />
                </div>

                {/* TIKTOK APPS SLIDER ROW */}
                <div>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>اختر وجهة الإرسال والمشاركة 🚀</span>
                    </span>
                    <button 
                      onClick={() => setShowAllApps(!showAllApps)}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                    >
                      <span>{showAllApps ? 'إخفاء' : 'المزيد'}</span>
                      {showAllApps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 px-1 no-scrollbar scroll-smooth">
                    {currentSliderItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleAppClick(item.id)}
                        className="flex flex-col items-center shrink-0 group focus:outline-none"
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all group-hover:scale-105 group-active:scale-95 ${item.bg}`}>
                          {item.icon}
                        </div>
                        <span className="text-[11px] font-black text-white mt-1.5">{item.name}</span>
                        <span className="text-[9px] text-gray-400 font-medium">{item.tag}</span>
                      </button>
                    ))}
                    
                    {!showAllApps && (
                      <button
                        onClick={() => setShowAllApps(true)}
                        className="flex flex-col items-center shrink-0 group focus:outline-none"
                      >
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all group-hover:scale-105 group-active:scale-95 bg-gray-800 border border-gray-750 text-amber-400">
                          <ChevronDown className="w-6 h-6" />
                        </div>
                        <span className="text-[11px] font-black text-white mt-1.5">المزيد</span>
                        <span className="text-[9px] text-gray-400 font-medium">باقي المنصات</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* PROMINENT USER TIP BOX FOR STORY LINK STICKER */}
                <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-200 flex items-start gap-2.5 text-right dir-rtl">
                  <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex-1">
                    <span className="font-bold block text-blue-300 text-xs mb-0.5">💡 نصيحة للنشر الذكي والسريع:</span>
                    <span className="text-[11px] leading-relaxed text-gray-300 block font-medium">
                      رابط هذا المنتج منسوخ وجاهز! عند توجيهك لإنستغرام، استخدم **ملصق الرابط (Link Sticker 🔗)** والصق الرابط ليدخل المتابعون لإعلانك مباشرة بلمسة واحدة!
                    </span>
                  </div>
                </div>

              </div>
            ) : (
              // TAB 2: LIVE CARD PREVIEW & GENERATION
              <div className="space-y-4 animate-fadeIn flex flex-col items-center">
                
                {/* Format Selector */}
                <div className="w-full flex bg-gray-950 border border-gray-850 p-1 rounded-2xl shadow-inner shrink-0">
                  <button
                    onClick={() => setCardFormat('story')}
                    className={`flex-1 py-2 text-xs font-black rounded-xl transition-all duration-200 ${
                      cardFormat === 'story' ? 'bg-gray-850 text-amber-400 border border-gray-750' : 'text-gray-400'
                    }`}
                  >
                    قصة ستوري (9:16)
                  </button>
                  <button
                    onClick={() => setCardFormat('post')}
                    className={`flex-1 py-2 text-xs font-black rounded-xl transition-all duration-200 ${
                      cardFormat === 'post' ? 'bg-gray-850 text-amber-400 border border-gray-750' : 'text-gray-400'
                    }`}
                  >
                    منشور بوست (1:1)
                  </button>
                </div>

                {/* Live Card Image frame */}
                <div className="relative w-full max-w-[280px] bg-gray-950 border border-gray-850 rounded-[2rem] p-3 shadow-2xl flex items-center justify-center overflow-hidden group">
                  <div className="absolute inset-x-0 top-0 h-4 bg-gray-900 border-b border-gray-850 rounded-t-[2rem] flex items-center justify-center z-10">
                    <div className="w-16 h-2 bg-gray-800 rounded-full" />
                  </div>

                  {isGeneratingCard ? (
                    <div className="w-full aspect-[9/16] max-h-[350px] flex flex-col items-center justify-center gap-3 bg-gray-950 rounded-2xl">
                      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-amber-400 font-bold">جاري تصميم بطاقة النشر...</span>
                    </div>
                  ) : cardDataUrl ? (
                    <div className="relative w-full overflow-hidden rounded-2xl mt-2 select-none shadow-lg">
                      <img 
                        src={cardDataUrl} 
                        alt="Design Card Preview" 
                        className="w-full h-auto object-contain bg-slate-950" 
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <span className="bg-amber-500 text-black px-3 py-1.5 rounded-full text-[10px] font-black shadow-lg">معاينة حية للتصميم 🎨</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full aspect-[9/16] max-h-[350px] flex items-center justify-center text-gray-500 text-xs">
                      فشل تحميل التصميم.
                    </div>
                  )}
                </div>

                {/* Actions Panel */}
                <div className="w-full grid grid-cols-1 gap-2.5">
                  <button
                    onClick={downloadCard}
                    disabled={!cardDataUrl || isGeneratingCard}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10 active:scale-[0.99] disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 shrink-0 text-black" />
                    <span>حفظ وتنزيل التصميم بالاستوديو 📸</span>
                  </button>
                  
                  <button
                    onClick={() => handleAppClick('native')}
                    disabled={!cardDataUrl}
                    className="w-full py-3.5 bg-gray-800/80 hover:bg-gray-800 border border-gray-700/80 text-gray-200 font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <Share2 className="w-4 h-4 text-amber-400" />
                    <span>مشاركة الصورة عبر تطبيقات الهاتف</span>
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* QUICK ACTION BUTTONS FLOOR */}
          <div className="pt-3 border-t border-gray-800 shrink-0">
            <button
              onClick={handleCopyLink}
              className={`w-full py-3.5 border rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 ${
                copiedLink 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-black' 
                  : 'bg-gray-850 hover:bg-gray-800 border-gray-800 text-gray-200 font-bold'
              }`}
            >
              {copiedLink ? <Check className="w-4.5 h-4.5 text-emerald-400" /> : <Link2 className="w-4.5 h-4.5 text-amber-400" />}
              <span>{copiedLink ? 'تم نسخ رابط الإعلان مباشر!' : 'نسخ الرابط المباشر للإعلان'}</span>
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
