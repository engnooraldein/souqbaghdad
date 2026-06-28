import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Copy, Check, Share2, MessageCircle, Send, Facebook, 
  Smartphone, Download, Sparkles, Image as ImageIcon, 
  Layers, CheckCircle2, Zap, Users, ShieldCheck, Link2, ExternalLink
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
}

type ShareActionType = 'wa_chat' | 'wa_story' | 'insta_story' | 'insta_post' | 'fb_post' | 'telegram' | 'native';

export function ShareModal({ 
  isOpen, 
  onClose, 
  title, 
  url, 
  image, 
  price, 
  governorate, 
  location,
  short_id 
}: ShareModalProps) {
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [cardFormat, setCardFormat] = useState<'story' | 'post'>('story');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);

  // Smart Execution Toast Status
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const locText = governorate || location || 'العراق';
  const idBadge = short_id ? `#${short_id}` : '';
  const fullUrl = url.startsWith('http') ? url : `https://www.souqbaghdad.store${url.startsWith('/') ? url : '/' + url}`;

  // Formatted caption
  const shareText = `📢 *عرض خاص من منصة سوق بغداد:* 🇮🇶\n\n🛍️ *${title}* ${idBadge}\n📍 *الموقع:* ${locText}${price ? `\n🏷️ *السعر:* ${price} د.ع` : ''}\n\nتواصل مباشر وسريع بين البائع والمشتري! 🚀🤝\n\n🔗 *رابط التفاصيل:* ${fullUrl}`;

  useEffect(() => {
    if (isOpen && showCardPreview) {
      generateCanvasCard(cardFormat);
    }
  }, [isOpen, showCardPreview, cardFormat, title, price, image, locText]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    triggerToast('📋 تم نسخ رابط الإعلان بنجاح!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedText(true);
    triggerToast('📝 تم نسخ نص الإعلان بالكامل مع الهاشتاقات!');
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
      const headerY = isStory ? 120 : 60;
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
      const imgSize = isStory ? 760 : 520;
      const imgX = (width - imgSize) / 2;
      const imgY = isStory ? 270 : 180;

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
          img.crossOrigin = 'anonymous';
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
        } catch {
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
      const contentY = imgY + imgSize + (isStory ? 70 : 40);
      ctx.font = 'bold 50px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      
      let displayTitle = title;
      if (displayTitle.length > 35) {
        displayTitle = displayTitle.substring(0, 32) + '...';
      }
      ctx.fillText(displayTitle, width / 2, contentY);

      const badgeY = contentY + 75;
      ctx.font = 'bold 34px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`📍 ${locText} ${idBadge}`, width / 2, badgeY);

      if (price) {
        const priceY = badgeY + (isStory ? 100 : 70);
        const priceText = `${price} د.ع`;
        ctx.font = 'bold 60px system-ui, sans-serif';
        const pWidth = ctx.measureText(priceText).width + 100;
        
        const pGrad = ctx.createLinearGradient(width/2 - pWidth/2, priceY - 50, width/2 + pWidth/2, priceY + 50);
        pGrad.addColorStop(0, '#fbbf24');
        pGrad.addColorStop(1, '#d97706');
        ctx.fillStyle = pGrad;

        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(width / 2 - pWidth / 2, priceY - 50, pWidth, 100, 50);
          ctx.fill();
        } else {
          ctx.fillRect(width / 2 - pWidth / 2, priceY - 50, pWidth, 100);
        }

        ctx.fillStyle = '#0f172a';
        ctx.fillText(priceText, width / 2, priceY + 5);
      }

      const footerY = isStory ? height - 140 : height - 55;
      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('تصفح الإعلان والتواصل المباشر عبر المنصة 🚀', width / 2, footerY);
      
      ctx.font = 'bold 32px system-ui, sans-serif';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('www.souqbaghdad.store', width / 2, footerY + 50);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCardDataUrl(dataUrl);
    } catch (e) {
      console.error('Failed card creation', e);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const downloadCard = () => {
    if (!cardDataUrl) return;
    const a = document.createElement('a');
    a.href = cardDataUrl;
    a.download = `souq-baghdad-${cardFormat}-${(title || 'item').replace(/\s+/g, '-')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerToast('📸 تم تنزيل بطاقة التصميم بنجاح!');
  };

  // Execute App Share Action
  const handleAppClick = (action: ShareActionType) => {
    switch (action) {
      case 'wa_chat':
        handleCopyCaption();
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'wa_story':
        handleCopyCaption();
        setShowCardPreview(true);
        setCardFormat('story');
        triggerToast('📸 تم تجهيز بطاقة الستوري ونسخ النص للواتساب!');
        break;
      case 'insta_story':
        handleCopyCaption();
        setShowCardPreview(true);
        setCardFormat('story');
        triggerToast('📸 تم تجهيز بطاقة الستوري ونسخ النص للانستغرام!');
        break;
      case 'insta_post':
        handleCopyCaption();
        setShowCardPreview(true);
        setCardFormat('post');
        triggerToast('🖼️ تم تجهيز بطاقة المنشور ونسخ الكابشن!');
        break;
      case 'fb_post':
        handleCopyCaption();
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, '_blank');
        break;
      case 'telegram':
        handleCopyCaption();
        window.open(`https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'native':
        if (navigator.share) {
          navigator.share({ title, text: shareText, url: fullUrl }).catch(() => {});
        } else {
          handleCopyCaption();
        }
        break;
    }
  };

  if (!isOpen) return null;

  // TikTok Style App Slider Items
  const appSliderItems: { id: ShareActionType; name: string; tag: string; icon: any; bg: string }[] = [
    { 
      id: 'wa_chat', 
      name: 'واتساب', 
      tag: 'محادثة', 
      icon: <MessageCircle className="w-7 h-7 text-white" />, 
      bg: 'bg-emerald-500 shadow-emerald-500/30' 
    },
    { 
      id: 'wa_story', 
      name: 'واتساب', 
      tag: 'ستوري 📸', 
      icon: <Sparkles className="w-7 h-7 text-white" />, 
      bg: 'bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-emerald-500/30' 
    },
    { 
      id: 'insta_story', 
      name: 'انستغرام', 
      tag: 'ستوري 📸', 
      icon: <ImageIcon className="w-7 h-7 text-white" />, 
      bg: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shadow-pink-500/30' 
    },
    { 
      id: 'insta_post', 
      name: 'انستغرام', 
      tag: 'منشور 📝', 
      icon: <Layers className="w-7 h-7 text-white" />, 
      bg: 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/30' 
    },
    { 
      id: 'fb_post', 
      name: 'فيسبوك', 
      tag: 'بوست / ستوري', 
      icon: <Facebook className="w-7 h-7 text-white" />, 
      bg: 'bg-blue-600 shadow-blue-500/30' 
    },
    { 
      id: 'telegram', 
      name: 'تليجرام', 
      tag: 'قنوات وخاص', 
      icon: <Send className="w-7 h-7 text-white" />, 
      bg: 'bg-sky-500 shadow-sky-500/30' 
    },
    { 
      id: 'native', 
      name: 'المزيد', 
      tag: 'تطبيقات الهاتف', 
      icon: <Smartphone className="w-7 h-7 text-black" />, 
      bg: 'bg-amber-400 shadow-amber-500/30' 
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
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative bg-gray-900/98 border-t sm:border border-gray-700/80 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl z-10 text-right dir-rtl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* TikTok Sheet Drag Handle */}
          <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mb-3 shrink-0" />

          {/* Header Preview Item */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-800 shrink-0">
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
            <button
              onClick={onClose}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 transition-colors shrink-0 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Active Toast Notification */}
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-center text-xs font-bold text-amber-300 flex items-center justify-center gap-2 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>{toastMsg}</span>
            </motion.div>
          )}

          {/* Main Body: TikTok Scroll Sliders */}
          <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar flex-1 pb-2">
            
            {/* ROW 1: TIKTOK STYLE SOCIAL APPS SLIDER */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>المشاركة عبر التطبيقات 🚀</span>
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

            {/* ROW 2: ACTION UTILITIES SLIDER */}
            <div className="pt-2 border-t border-gray-800/80">
              <div className="mb-2 px-1">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>خيارات سريعة وأدوات التصميم</span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { setShowCardPreview(!showCardPreview); if (!showCardPreview) generateCanvasCard('story'); }}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                    showCardPreview 
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                      : 'bg-gray-800/60 hover:bg-gray-800 border-gray-700/60 text-gray-200'
                  }`}
                >
                  <ImageIcon className="w-5 h-5 text-pink-400 mb-1" />
                  <span className="text-xs font-bold">مصمم الستوري</span>
                  <span className="text-[9px] text-gray-400">معاينة وتنزيل</span>
                </button>

                <button
                  onClick={handleCopyCaption}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                    copiedText 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                      : 'bg-gray-800/60 hover:bg-gray-800 border-gray-700/60 text-gray-200'
                  }`}
                >
                  {copiedText ? <Check className="w-5 h-5 text-emerald-400 mb-1" /> : <Copy className="w-5 h-5 text-amber-400 mb-1" />}
                  <span className="text-xs font-bold">نسخ الكابشن</span>
                  <span className="text-[9px] text-gray-400">مع الهاشتاقات</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                    copiedLink 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                      : 'bg-gray-800/60 hover:bg-gray-800 border-gray-700/60 text-gray-200'
                  }`}
                >
                  {copiedLink ? <Check className="w-5 h-5 text-emerald-400 mb-1" /> : <Link2 className="w-5 h-5 text-sky-400 mb-1" />}
                  <span className="text-xs font-bold">نسخ الرابط</span>
                  <span className="text-[9px] text-gray-400">رابط قصير</span>
                </button>
              </div>
            </div>

            {/* EXPANDABLE CARD PREVIEW BOX */}
            {showCardPreview && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-3 border-t border-gray-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>بطاقة الستوري والمنشور الجاهزة:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setCardFormat('story'); generateCanvasCard('story'); }}
                      className={`py-1 px-2.5 rounded-lg text-[11px] font-bold ${cardFormat==='story'?'bg-amber-500 text-black':'bg-gray-800 text-gray-400'}`}
                    >
                      ستوري 📱
                    </button>
                    <button
                      onClick={() => { setCardFormat('post'); generateCanvasCard('post'); }}
                      className={`py-1 px-2.5 rounded-lg text-[11px] font-bold ${cardFormat==='post'?'bg-amber-500 text-black':'bg-gray-800 text-gray-400'}`}
                    >
                      بوست 🖼️
                    </button>
                  </div>
                </div>

                <div className="bg-gray-950 rounded-2xl p-2 border border-gray-800 flex items-center justify-center min-h-[180px]">
                  {isGeneratingCard ? (
                    <div className="text-xs text-amber-400 font-bold py-6 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 animate-spin" />
                      <span>جاري التوليد...</span>
                    </div>
                  ) : cardDataUrl ? (
                    <img src={cardDataUrl} alt="Preview" className="max-h-[220px] w-auto rounded-xl object-contain border border-gray-700" />
                  ) : null}
                </div>

                <button
                  onClick={downloadCard}
                  disabled={!cardDataUrl || isGeneratingCard}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-2xl flex items-center justify-center gap-2 text-xs shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل البطاقة للرسائل أو الستوري (صورة 📸)</span>
                </button>
              </motion.div>
            )}

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
