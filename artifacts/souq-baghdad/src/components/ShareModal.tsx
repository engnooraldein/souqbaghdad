import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Copy, Check, Share2, MessageCircle, Send, Facebook, 
  Smartphone, Download, Sparkles, Image as ImageIcon, 
  Layers, CheckCircle2, Zap, Users, ShieldCheck, ArrowRight
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

type PlatformType = 'whatsapp' | 'instagram' | 'facebook' | 'telegram';

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
  const [activeMode, setActiveMode] = useState<'smart' | 'manual'>('smart');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('whatsapp');
  
  // Smart Targets (Checkboxes)
  const [targets, setTargets] = useState({
    story: true,
    post: true,
    friends: false,
  });

  const [cardFormat, setCardFormat] = useState<'story' | 'post'>('story');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  
  // Execution Wizard State
  const [isExecuting, setIsExecuting] = useState(false);
  const [execStep, setExecStep] = useState<number>(0);

  const locText = governorate || location || 'العراق';
  const idBadge = short_id ? `#${short_id}` : '';
  const fullUrl = url.startsWith('http') ? url : `https://www.souqbaghdad.store${url.startsWith('/') ? url : '/' + url}`;

  // Optimized formatted text
  const shareText = `📢 *عرض خاص من منصة سوق بغداد:* 🇮🇶\n\n🛍️ *${title}* ${idBadge}\n📍 *الموقع:* ${locText}${price ? `\n🏷️ *السعر:* ${price} د.ع` : ''}\n\nتواصل مباشر وسريع بين البائع والمشتري! 🚀🤝\n\n🔗 *رابط التفاصيل:* ${fullUrl}`;

  useEffect(() => {
    if (isOpen) {
      generateCanvasCard(cardFormat);
    }
  }, [isOpen, cardFormat, title, price, image, locText]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Canvas Drawing Function
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

      // Background Gradient (Dark Baghdad Theme)
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0a1128');
      bgGrad.addColorStop(0.5, '#0f172a');
      bgGrad.addColorStop(1, '#070b19');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Decorative Background Circles
      ctx.save();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
      ctx.beginPath();
      ctx.arc(width * 0.9, height * 0.1, 400, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
      ctx.beginPath();
      ctx.arc(width * 0.1, height * 0.85, 500, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Header Branding Badge
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

      // Image Card Area
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

      // Title & Details Box
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

  // Smart Execution Wizard Flow
  const executeSmartShare = async () => {
    setIsExecuting(true);
    setExecStep(1);

    // Step 1: Copy caption to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
    } catch (e) {
      console.log('Clipboard error:', e);
    }

    // Step 2: Download image card if story or post checked
    if (targets.story || targets.post) {
      setExecStep(2);
      if (cardDataUrl) {
        const a = document.createElement('a');
        a.href = cardDataUrl;
        a.download = `souq-baghdad-${selectedPlatform}-${(title || 'item').replace(/\s+/g, '-')}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }

    // Step 3: Launch Platform
    setExecStep(3);
    setTimeout(() => {
      openPlatform(selectedPlatform);
      setIsExecuting(false);
      setExecStep(0);
    }, 1200);
  };

  const openPlatform = (platform: PlatformType) => {
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, '_blank');
        break;
      case 'instagram':
        // Instagram direct web share link or fallback
        window.open(`https://www.instagram.com/`, '_blank');
        break;
    }
  };

  if (!isOpen) return null;

  const platformsList: { id: PlatformType; name: string; icon: any; color: string; bg: string }[] = [
    { id: 'whatsapp', name: 'واتساب', icon: <MessageCircle className="w-6 h-6" />, color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/40' },
    { id: 'instagram', name: 'انستغرام', icon: <ImageIcon className="w-6 h-6" />, color: 'text-pink-400', bg: 'bg-pink-500/15 border-pink-500/40' },
    { id: 'facebook', name: 'فيسبوك', icon: <Facebook className="w-6 h-6" />, color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/40' },
    { id: 'telegram', name: 'تليجرام', icon: <Send className="w-6 h-6" />, color: 'text-sky-400', bg: 'bg-sky-500/15 border-sky-500/40' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[400] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }}
          className="relative bg-gray-900/95 border border-gray-700/60 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl z-10 text-right dir-rtl max-h-[92vh] flex flex-col my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-2xl text-amber-400 border border-amber-500/30">
                <Zap className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                  <span>المساعد الذكي للمشاركة 🚀</span>
                </h3>
                <p className="text-gray-400 text-xs mt-0.5">انشر على الستوري والبوست والخاص بنقرة واحدة</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-2 my-4 p-1.5 bg-gray-950 rounded-2xl border border-gray-800 shrink-0">
            <button
              onClick={() => setActiveMode('smart')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeMode === 'smart'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>⚡ المشاركة التلقائية الذكية</span>
            </button>
            <button
              onClick={() => setActiveMode('manual')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeMode === 'manual'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>🎨 مصمم بطاقات الصور</span>
            </button>
          </div>

          {/* SMART MODE */}
          {activeMode === 'smart' && (
            <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar flex-1">
              {/* Step 1: Select Platform */}
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-2">1️⃣ اختر التطبيق المراد النشر فيه:</label>
                <div className="grid grid-cols-4 gap-2">
                  {platformsList.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlatform(p.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                        selectedPlatform === p.id
                          ? `${p.bg} ${p.color} ring-2 ring-amber-400 scale-105 shadow-lg`
                          : 'bg-gray-800/40 border-gray-700/50 text-gray-400 hover:text-white'
                      }`}
                    >
                      {p.icon}
                      <span className="text-xs font-bold mt-1.5">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Select Targets */}
              <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700/60">
                <label className="text-xs font-bold text-amber-400 block mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>2️⃣ حدد أين تريد النشر (حدد ما يناسبك):</span>
                </label>

                <div className="space-y-2.5">
                  <label className="flex items-center justify-between p-3 bg-gray-900/80 rounded-xl border border-gray-700/50 cursor-pointer hover:border-amber-500/40 transition-all">
                    <div className="flex items-center gap-2.5">
                      <ImageIcon className="w-4 h-4 text-pink-400" />
                      <div>
                        <span className="text-xs font-bold text-white block">📸 قصة / ستوري (Story)</span>
                        <span className="text-[10px] text-gray-400 block">توليد بطاقة تصميم عمودية عالية الجودة</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={targets.story}
                      onChange={(e) => {
                        setTargets({ ...targets, story: e.target.checked });
                        if (e.target.checked) generateCanvasCard('story');
                      }}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-900/80 rounded-xl border border-gray-700/50 cursor-pointer hover:border-amber-500/40 transition-all">
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <div>
                        <span className="text-xs font-bold text-white block">📝 منشور / بوست (Feed Post)</span>
                        <span className="text-[10px] text-gray-400 block">توليد بطاقة مربعة مع كابشن وهاشتاقات جاهزة</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={targets.post}
                      onChange={(e) => {
                        setTargets({ ...targets, post: e.target.checked });
                        if (e.target.checked && !targets.story) generateCanvasCard('post');
                      }}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-900/80 rounded-xl border border-gray-700/50 cursor-pointer hover:border-amber-500/40 transition-all">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-xs font-bold text-white block">💬 إرسال للأصدقاء / الخاص (Direct Message)</span>
                        <span className="text-[10px] text-gray-400 block">تجهيز رسالة نصية مباشرة مع رابط الإعلان</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={targets.friends}
                      onChange={(e) => setTargets({ ...targets, friends: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Execution Status Wizard overlay */}
              {isExecuting && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center space-y-2"
                >
                  <Sparkles className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
                  <div className="text-xs font-bold text-white">جاري التنفيذ الذكي لطلبك...</div>
                  <div className="text-[11px] text-amber-300">
                    {execStep === 1 && '📋 تم نسخ نص الإعلان والرابط التلقائي إلى الحافظة!'}
                    {execStep === 2 && '📸 تم تجهيز وتنزيل بطاقة التصميم!'}
                    {execStep === 3 && `🚀 جاري فتح تطبيق ${platformsList.find(p=>p.id===selectedPlatform)?.name}... فقط اضغط لصق (Paste)`}
                  </div>
                </motion.div>
              )}

              {/* Action Button */}
              {!isExecuting && (
                <button
                  onClick={executeSmartShare}
                  className="w-full py-4 px-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black font-bold rounded-2xl flex items-center justify-center gap-2 text-sm shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-[0.99] transition-all"
                >
                  <Zap className="w-5 h-5 fill-current" />
                  <span>🚀 ابدأ المشاركة الذكية بضغطة واحدة</span>
                </button>
              )}
            </div>
          )}

          {/* MANUAL MODE */}
          {activeMode === 'manual' && (
            <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar flex-1 flex flex-col">
              <div className="flex items-center justify-between bg-gray-800/80 p-2 rounded-2xl border border-gray-700/60 shrink-0">
                <span className="text-xs text-gray-300 font-bold pr-2">حجم التصميم:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setCardFormat('story'); generateCanvasCard('story'); }}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      cardFormat === 'story'
                        ? 'bg-amber-500 text-black'
                        : 'text-gray-400 hover:text-white bg-gray-900/50'
                    }`}
                  >
                    📱 ستوري (9:16)
                  </button>
                  <button
                    onClick={() => { setCardFormat('post'); generateCanvasCard('post'); }}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      cardFormat === 'post'
                        ? 'bg-amber-500 text-black'
                        : 'text-gray-400 hover:text-white bg-gray-900/50'
                    }`}
                  >
                    🖼️ بوست مربع (1:1)
                  </button>
                </div>
              </div>

              <div className="relative bg-gray-950 rounded-2xl p-3 border border-gray-800 flex items-center justify-center min-h-[220px] flex-1 overflow-hidden">
                {isGeneratingCard ? (
                  <div className="flex flex-col items-center justify-center py-8 text-amber-400 gap-2">
                    <Sparkles className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-bold">جاري تصميم البطاقة...</span>
                  </div>
                ) : cardDataUrl ? (
                  <div className="relative group max-h-[300px] flex items-center justify-center">
                    <img 
                      src={cardDataUrl} 
                      alt="Story Preview" 
                      className="max-h-[280px] w-auto rounded-xl object-contain border border-gray-700/80 shadow-xl"
                    />
                  </div>
                ) : null}
              </div>

              <div className="space-y-2 shrink-0">
                <button
                  onClick={() => {
                    if (cardDataUrl) {
                      const a = document.createElement('a');
                      a.href = cardDataUrl;
                      a.download = `souq-baghdad-card.jpg`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }
                  }}
                  disabled={!cardDataUrl || isGeneratingCard}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black font-bold rounded-2xl flex items-center justify-center gap-2 text-xs shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل البطاقة صورة 📸</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopyCaption}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      copiedText ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-gray-800 border-gray-700 text-gray-300'
                    }`}
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>نسخ النص والرابط</span>
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      copiedLink ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-gray-800 border-gray-700 text-gray-300'
                    }`}
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>نسخ الرابط فقط</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
