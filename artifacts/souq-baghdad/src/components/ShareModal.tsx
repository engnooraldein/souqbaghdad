import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Copy, Check, Share2, MessageCircle, Send, Facebook, 
  Smartphone, Download, Sparkles, Image as ImageIcon, 
  ExternalLink, Layers, CheckCircle2
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
  const [activeTab, setActiveTab] = useState<'quick' | 'card'>('quick');
  const [cardFormat, setCardFormat] = useState<'story' | 'post'>('story');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const locText = governorate || location || 'العراق';
  const idBadge = short_id ? `#${short_id}` : '';
  const fullUrl = url.startsWith('http') ? url : `https://www.souqbaghdad.store${url.startsWith('/') ? url : '/' + url}`;

  // Formatted captions
  const shareText = `📢 *رسالة من منصة سوق بغداد:* 🇮🇶\n\nشاهد تفاصيل (${title}) ${idBadge}\n📍 الموقع: ${locText}${price ? `\n🏷️ السعر: ${price} د.ع` : ''}\n\nسوق بغداد هو السوق الرقمي العراقي الحديث لتسهيل التجارة والتواصل المباشر. 🚀🤝\n\n🔗 الرابط: ${fullUrl}`;

  useEffect(() => {
    if (isOpen && activeTab === 'card') {
      generateCanvasCard();
    }
  }, [isOpen, activeTab, cardFormat, title, price, image, locText]);

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

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: fullUrl,
        });
      } catch (err) {
        console.log('Native share cancelled/error:', err);
      }
    } else {
      handleCopyCaption();
    }
  };

  // Generate dynamic story / post image card via Canvas
  const generateCanvasCard = async () => {
    setIsGeneratingCard(true);
    try {
      const isStory = cardFormat === 'story';
      const width = isStory ? 1080 : 1080;
      const height = isStory ? 1920 : 1080;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background Gradient (Dark Baghdad Theme)
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0a1128');
      bgGrad.addColorStop(0.5, '#101f42');
      bgGrad.addColorStop(1, '#070b19');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Decorative Background Patterns (Gold & Blue Circles)
      ctx.save();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.04)';
      ctx.beginPath();
      ctx.arc(width * 0.9, height * 0.1, 400, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
      ctx.beginPath();
      ctx.arc(width * 0.1, height * 0.85, 500, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Header Branding Badge (Top)
      const headerY = isStory ? 120 : 70;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.roundRect ? ctx.roundRect(width / 2 - 260, headerY, 520, 90, 45) : ctx.fillRect(width / 2 - 260, headerY, 520, 90);
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 42px system-ui, sans-serif';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('سوك بغداد 🇮🇶 SOUQ BAGHDAD', width / 2, headerY + 45);

      // Product Image Area
      const imgSize = isStory ? 760 : 540;
      const imgX = (width - imgSize) / 2;
      const imgY = isStory ? 270 : 190;

      // Draw shadow for image container
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 15;
      ctx.fillStyle = '#1e293b';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(imgX, imgY, imgSize, imgSize, 36);
        ctx.fill();
      } else {
        ctx.fillRect(imgX, imgY, imgSize, imgSize);
      }
      ctx.restore();

      // Load Product Image if available
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
          
          // Center crop cover image
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

          // Image Border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 4;
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(imgX, imgY, imgSize, imgSize, 36);
            ctx.stroke();
          }
        } catch {
          // Fallback if image fails to load
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 120px system-ui';
          ctx.fillText('🛍️', width / 2, imgY + imgSize / 2);
        }
      } else {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 120px system-ui';
        ctx.fillText('🛍️', width / 2, imgY + imgSize / 2);
      }

      // Title & Content Details Box
      const contentY = imgY + imgSize + (isStory ? 70 : 40);
      
      // Title
      ctx.font = 'bold 52px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      
      // Truncate title if too long
      let displayTitle = title;
      if (displayTitle.length > 35) {
        displayTitle = displayTitle.substring(0, 32) + '...';
      }
      ctx.fillText(displayTitle, width / 2, contentY);

      // Location & Info Badges
      const badgeY = contentY + 75;
      ctx.font = 'bold 34px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`📍 ${locText} ${idBadge}`, width / 2, badgeY);

      // Price Tag (Prominent Gold Pill)
      if (price) {
        const priceY = badgeY + (isStory ? 100 : 75);
        const priceText = `${price} د.ع`;
        ctx.font = 'bold 60px system-ui, sans-serif';
        const pWidth = ctx.measureText(priceText).width + 100;
        
        ctx.fillStyle = 'linear-gradient(90deg, #f59e0b, #d97706)';
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

      // Bottom Call To Action Footer
      const footerY = isStory ? height - 140 : height - 60;
      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('تصفح الإعلان والتواصل المباشر عبر المنصة 🚀', width / 2, footerY);
      
      ctx.font = 'bold 32px system-ui, sans-serif';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('www.souqbaghdad.store', width / 2, footerY + 50);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCardDataUrl(dataUrl);
      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        const mainCtx = canvasRef.current.getContext('2d');
        mainCtx?.drawImage(canvas, 0, 0);
      }
    } catch (e) {
      console.error('Failed card creation', e);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const downloadCardImage = () => {
    if (!cardDataUrl) return;
    const a = document.createElement('a');
    a.href = cardDataUrl;
    a.download = `souq-baghdad-${cardFormat}-${(title || 'item').replace(/\s+/g, '-')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  const socialLinks = [
    {
      id: 'wa_chat',
      name: 'واتساب دردشة',
      subtitle: 'إرسال للمحادثات',
      icon: <MessageCircle className="w-6 h-6 text-emerald-400" />,
      color: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
      action: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank'),
    },
    {
      id: 'wa_story',
      name: 'واتساب ستوري',
      subtitle: 'نسخ وتحميل للستوري',
      icon: <Sparkles className="w-6 h-6 text-emerald-400" />,
      color: 'bg-emerald-600/20 hover:bg-emerald-600/30 border-emerald-500/40 text-emerald-200',
      action: () => {
        handleCopyCaption();
        setActiveTab('card');
        setCardFormat('story');
      },
    },
    {
      id: 'insta_story',
      name: 'انستغرام ستوري',
      subtitle: 'تحميل بطاقة الستوري',
      icon: <ImageIcon className="w-6 h-6 text-pink-400" />,
      color: 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border-pink-500/30 text-pink-200',
      action: () => {
        handleCopyCaption();
        setActiveTab('card');
        setCardFormat('story');
      },
    },
    {
      id: 'insta_post',
      name: 'انستغرام بوست',
      subtitle: 'تحميل بطاقة المربع',
      icon: <Layers className="w-6 h-6 text-purple-400" />,
      color: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-300',
      action: () => {
        handleCopyCaption();
        setActiveTab('card');
        setCardFormat('post');
      },
    },
    {
      id: 'fb_post',
      name: 'فيسبوك بوست',
      subtitle: 'مشاركة على الفيسبوك',
      icon: <Facebook className="w-6 h-6 text-blue-400" />,
      color: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-300',
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, '_blank'),
    },
    {
      id: 'telegram',
      name: 'تليجرام',
      subtitle: 'إرسال للقنوات والدردشات',
      icon: <Send className="w-6 h-6 text-sky-400" />,
      color: 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-300',
      action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`, '_blank'),
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[400] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      >
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }}
          className="relative bg-gray-900/95 border border-gray-700/60 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl z-10 text-right dir-rtl max-h-[92vh] flex flex-col my-auto"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                  <span>مشاركة الإعلان والتصميم</span>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] rounded-full font-normal border border-amber-500/30">جديد 🇮🇶</span>
                </h3>
                <p className="text-gray-400 text-xs mt-0.5">انشر على الستوري أو الدردشات ببطاقات احترافية</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 gap-2 my-4 p-1.5 bg-gray-950 rounded-2xl border border-gray-800 shrink-0">
            <button
              onClick={() => setActiveTab('quick')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'quick'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة سريعة</span>
            </button>
            <button
              onClick={() => setActiveTab('card')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'card'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>مصمم الستوري والبوست 📸</span>
            </button>
          </div>

          {/* Tab 1: Quick Share Links */}
          {activeTab === 'quick' && (
            <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar">
              {/* Item Summary Card */}
              <div className="p-3 bg-gray-800/60 rounded-2xl border border-gray-700/50 flex items-center gap-3">
                {image ? (
                  <img src={image} alt="" className="w-14 h-14 rounded-xl object-cover border border-gray-600 shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gray-700 flex items-center justify-center text-2xl shrink-0">🛍️</div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold text-sm truncate">{title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    {price && <span className="text-amber-400 font-bold text-xs">{price} د.ع</span>}
                    <span className="text-gray-400 text-[11px]">• {locText}</span>
                  </div>
                </div>
              </div>

              {/* Social Options Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {socialLinks.map((s) => (
                  <button
                    key={s.id}
                    onClick={s.action}
                    className={`flex flex-col text-right p-3 rounded-2xl border transition-all text-right ${s.color}`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      {s.icon}
                      <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                    </div>
                    <span className="font-bold text-xs">{s.name}</span>
                    <span className="text-[10px] opacity-75 mt-0.5">{s.subtitle}</span>
                  </button>
                ))}
              </div>

              {/* Mobile Native Share Button */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-2xl flex items-center justify-center gap-2 text-xs shadow-lg shadow-amber-500/20"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>مشاركة عبر تطبيقات الهاتف الأُخرى</span>
                </button>
              )}

              {/* Copy Actions */}
              <div className="space-y-2 pt-2 border-t border-gray-800">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={fullUrl}
                    className="flex-1 bg-gray-950 text-gray-300 text-xs rounded-2xl py-3 px-3 border border-gray-800 outline-none truncate"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all ${
                      copiedLink ? 'bg-emerald-500 text-black' : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                    }`}
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'تم!' : 'نسخ الرابط'}</span>
                  </button>
                </div>

                <button
                  onClick={handleCopyCaption}
                  className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    copiedText 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                      : 'bg-gray-800/80 hover:bg-gray-700/80 border-gray-700 text-gray-300'
                  }`}
                >
                  {copiedText ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                  <span>{copiedText ? 'تم نسخ نص الإعلان بالكامل مع الهاشتاقات!' : '📋 نسخ الكابشن الكامل للنشر'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Story & Post Card Generator */}
          {activeTab === 'card' && (
            <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar flex-1 flex flex-col">
              {/* Story vs Post Toggle */}
              <div className="flex items-center justify-between bg-gray-800/80 p-2 rounded-2xl border border-gray-700/60 shrink-0">
                <span className="text-xs text-gray-300 font-bold pr-2">حجم البطاقة:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCardFormat('story')}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      cardFormat === 'story'
                        ? 'bg-amber-500 text-black'
                        : 'text-gray-400 hover:text-white bg-gray-900/50'
                    }`}
                  >
                    📱 ستوري (9:16)
                  </button>
                  <button
                    onClick={() => setCardFormat('post')}
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

              {/* Card Preview Container */}
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
                ) : (
                  <div className="text-gray-500 text-xs py-8">اضغط على إعادة التوليد لإظهار البطاقة</div>
                )}
              </div>

              {/* Download & Action Buttons */}
              <div className="space-y-2 shrink-0">
                <button
                  onClick={downloadCardImage}
                  disabled={!cardDataUrl || isGeneratingCard}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black font-bold rounded-2xl flex items-center justify-center gap-2 text-xs shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل البطاقة عالية الجودة (صورة 📸)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopyCaption}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      copiedText ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-gray-800 border-gray-700 text-gray-300'
                    }`}
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>نسخ نص الإعلان</span>
                  </button>
                  <button
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>فتح واتساب</span>
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
