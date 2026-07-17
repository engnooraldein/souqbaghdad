import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Copy, Check, Share2, MessageCircle, Send, Facebook, 
  Smartphone, Download, Sparkles, PlusCircle, PlayCircle, SendHorizontal, Lightbulb, HelpCircle, Info, ChevronDown, ChevronUp,
  FileText, Palette, CheckCircle2, Layers, Link2
} from 'lucide-react';
import QRCode from 'qrcode';
import JSZip from 'jszip';

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
  category?: string;
  views?: number;
  createdAt?: string;
  isVerified?: boolean;
  images?: string[];
  university?: string;
  regions?: string;
  type?: string;
}

type PlatformType = 'insta_story' | 'insta_direct' | 'insta_reels' | 'facebook' | 'whatsapp' | 'telegram' | 'copy_link' | 'native' | 'show_more';
type TemplateType = 'luxury' | 'simple' | 'story' | 'facebook' | 'whatsapp';

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
  description,
  category = 'general',
  views,
  createdAt,
  isVerified,
  images,
  university,
  regions,
  type
}: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'card'>('text');
  const [cardTemplate, setCardTemplate] = useState<TemplateType>('story');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showAllApps, setShowAllApps] = useState(false);
  
  const [customCaption, setCustomCaption] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const locText = governorate || location || 'العراق';
  const idBadge = short_id ? `#${short_id}` : '';
  const fullUrl = url.startsWith('http') ? url : `https://www.souqbaghdad.store${url.startsWith('/') ? url : '/' + url}`;

  const getShareText = () => {
    const descSnippet = description ? `\n📝 *الوصف:* ${description.slice(0, 100)}${description.length > 100 ? '...' : ''}` : '';
    return `✨ *أهلاً بك في منصة سوق بغداد الرقمية* 🇮🇶✨\n\n🛍️ *${title}* ${idBadge}\n📍 *الموقع:* ${locText}${price ? `\n🏷️ *السعر:* ${price} د.ع` : ''}${descSnippet}\n\nتواصل مباشر وسريع بين البائع والمشتري! 🚀🤝\n\n🔗 *رابط التفاصيل:* ${fullUrl}`;
  };

  const telegramText = `✨ *أهلاً بك في منصة سوق بغداد الرقمية* 🇮🇶✨\n\n🛍️ *${title}* ${idBadge}\n📍 *الموقع:* ${locText}${price ? `\n🏷️ *السعر:* ${price} د.ع` : ''}\n\nتصفح كافة التفاصيل وتواصل مباشر مع البائع عبر المنصة 🚀\n👇🔗\n${fullUrl}`;

  useEffect(() => {
    if (isOpen) {
      setCustomCaption(getShareText());
    }
  }, [isOpen, title, price, locText, description, fullUrl]);

  useEffect(() => {
    if (isOpen) {
      generateCanvasCardPreview();
    }
  }, [isOpen, cardTemplate, title, price, image, locText, category, views]);

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

  const createCardCanvas = async (template: TemplateType, targetImage: string | undefined): Promise<string | null> => {
      const width = 1080;
      let height = 1920; 
      if (template === 'facebook') height = 1350; 
      if (template === 'whatsapp') height = 1080; 

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      let bgGradColor1 = '#1e293b';
      let bgGradColor2 = '#020617';
      let accentColor = '#f59e0b'; 
      let secondaryColor = '#d97706';
      let textColor = '#ffffff';
      let textSecondaryColor = '#94a3b8';
      let footerBg = 'rgba(255, 255, 255, 0.05)';

      if (template === 'luxury') {
         bgGradColor1 = '#1a1a1a';
         bgGradColor2 = '#000000';
         accentColor = '#ffd700'; 
         secondaryColor = '#b8860b';
      } else if (template === 'simple') {
         bgGradColor1 = '#f8fafc';
         bgGradColor2 = '#e2e8f0';
         accentColor = '#0f172a'; 
         secondaryColor = '#334155';
         textColor = '#020617';
         textSecondaryColor = '#475569';
         footerBg = 'rgba(0, 0, 0, 0.05)';
      } else {
         switch(category) {
            case 'cars':
               bgGradColor1 = '#1e1b4b'; bgGradColor2 = '#0f172a'; accentColor = '#ef4444'; secondaryColor = '#b91c1c'; break;
            case 'real-estate':
               bgGradColor1 = '#064e3b'; bgGradColor2 = '#022c22'; accentColor = '#10b981'; secondaryColor = '#047857'; break;
            case 'electronics':
               bgGradColor1 = '#172554'; bgGradColor2 = '#020617'; accentColor = '#3b82f6'; secondaryColor = '#1d4ed8'; break;
         }
      }

      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, bgGradColor1);
      bgGrad.addColorStop(1, bgGradColor2);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      if (template !== 'simple') {
         ctx.save();
         const glowGrad1 = ctx.createRadialGradient(width, 0, 0, width, 0, 600);
         glowGrad1.addColorStop(0, `${accentColor}30`);
         glowGrad1.addColorStop(1, 'transparent');
         ctx.fillStyle = glowGrad1;
         ctx.fillRect(0, 0, width, height);
         
         const glowGrad2 = ctx.createRadialGradient(0, height, 0, 0, height, 800);
         glowGrad2.addColorStop(0, `${secondaryColor}20`);
         glowGrad2.addColorStop(1, 'transparent');
         ctx.fillStyle = glowGrad2;
         ctx.fillRect(0, 0, width, height);
         ctx.restore();
      }

      let headerY = 100;
      if (views && views > 10) {
         ctx.fillStyle = '#ef4444'; 
         ctx.fillRect(0, 0, width, 70);
         ctx.fillStyle = '#ffffff';
         ctx.font = 'bold 30px system-ui, sans-serif';
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         ctx.fillText(`🔥 أكثر من ${views} شخص شاهدوا هذا الإعلان اليوم`, width / 2, 35);
      } else {
         headerY = 60;
      }

      if (template === 'whatsapp') headerY = 40; 

      try {
         const logoImg = new Image();
         logoImg.crossOrigin = 'anonymous';
         logoImg.src = '/logo-512.webp';
         await new Promise((res, rej) => { logoImg.onload = res; logoImg.onerror = rej; });
         const logoSize = template === 'whatsapp' ? 80 : 120;
         ctx.drawImage(logoImg, width / 2 - logoSize / 2, headerY, logoSize, logoSize);
      } catch (e) { }

      let siteTitleY = headerY + (template === 'whatsapp' ? 100 : 150);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${template === 'whatsapp' ? '28px' : '36px'} system-ui, sans-serif`;
      ctx.fillStyle = accentColor;
      ctx.fillText('سوق بغداد 🇮🇶 SOUQ BAGHDAD', width / 2, siteTitleY);

      let badgeY = siteTitleY + 50;
      ctx.fillStyle = template === 'luxury' ? '#ffd700' : accentColor;
      if (ctx.roundRect) {
         ctx.beginPath();
         ctx.roundRect(width / 2 - 140, badgeY - 25, 280, 50, 25);
         ctx.fill();
      } else {
         ctx.fillRect(width / 2 - 140, badgeY - 25, 280, 50);
      }
      ctx.fillStyle = template === 'simple' ? '#ffffff' : (template === 'luxury' ? '#000000' : '#ffffff');
      ctx.font = 'bold 24px system-ui';
      ctx.fillText(views && views > 50 ? '⭐ فرصة اليوم' : '🔥 إعلان جديد', width / 2, badgeY);

      const availableImageH = template === 'whatsapp' ? 400 : (template === 'facebook' ? 550 : 800);
      const imgSizeW = 900;
      const imgSizeH = availableImageH;
      const imgX = (width - imgSizeW) / 2;
      const imgY = badgeY + 60;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 20;
      if (ctx.roundRect) {
         ctx.beginPath();
         ctx.roundRect(imgX, imgY, imgSizeW, imgSizeH, 40);
         ctx.clip();
      } else {
         ctx.rect(imgX, imgY, imgSizeW, imgSizeH);
         ctx.clip();
      }

      if (targetImage) {
         try {
            const img = new Image();
            if (!targetImage.startsWith('data:')) img.crossOrigin = 'anonymous';
            img.src = targetImage;
            await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
            const aspect = img.width / img.height;
            const targetAspect = imgSizeW / imgSizeH;
            let drawW = imgSizeW, drawH = imgSizeH, offX = 0, offY = 0;
            if (aspect > targetAspect) {
               drawW = imgSizeH * aspect;
               offX = -(drawW - imgSizeW) / 2;
            } else {
               drawH = imgSizeW / aspect;
               offY = -(drawH - imgSizeH) / 2;
            }
            ctx.drawImage(img, imgX + offX, imgY + offY, drawW, drawH);
         } catch (err) {
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(imgX, imgY, imgSizeW, imgSizeH);
         }
      } else {
         if (category === 'transport' || university) {
            const bgGrad = ctx.createLinearGradient(imgX, imgY, imgX, imgY + imgSizeH);
            bgGrad.addColorStop(0, '#1a1a1a');
            bgGrad.addColorStop(1, '#000000');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(imgX, imgY, imgSizeW, imgSizeH);

            const scale = imgSizeH / 800;
            const tX = imgX + 30 * scale;
            const tY = imgY + 30 * scale;
            const tW = imgSizeW - 60 * scale;
            const tH = imgSizeH - 60 * scale;
            const radius = 20 * scale;
            const bottomH = tH * 0.28; 
            const splitY = tY + tH - bottomH;

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(tX + radius, tY);
            ctx.lineTo(tX + tW - radius, tY);
            ctx.quadraticCurveTo(tX + tW, tY, tX + tW, tY + radius);
            ctx.lineTo(tX + tW, splitY - 15 * scale);
            ctx.arc(tX + tW, splitY, 15 * scale, Math.PI * 1.5, Math.PI * 0.5, true); 
            ctx.lineTo(tX + tW, tY + tH - radius);
            ctx.quadraticCurveTo(tX + tW, tY + tH, tX + tW - radius, tY + tH);
            ctx.lineTo(tX + radius, tY + tH);
            ctx.quadraticCurveTo(tX, tY + tH, tX, tY + tH - radius);
            ctx.lineTo(tX, splitY + 15 * scale);
            ctx.arc(tX, splitY, 15 * scale, Math.PI * 0.5, Math.PI * 1.5, true); 
            ctx.lineTo(tX, tY + radius);
            ctx.quadraticCurveTo(tX, tY, tX + radius, tY);
            ctx.fill();

            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 3 * scale;
            ctx.setLineDash([12 * scale, 12 * scale]);
            ctx.beginPath();
            ctx.moveTo(tX + 20 * scale, splitY);
            ctx.lineTo(tX + tW - 20 * scale, splitY);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#b8860b';
            ctx.font = `bold ${24 * scale}px system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('🚐 تذكرة خط جامعي - BOARDING PASS', imgX + imgSizeW / 2, tY + 20 * scale);

            const shortRegions = (regions || 'نقطة الانطلاق').substring(0, 30);
            const shortUniv = (university || 'نقطة الوصول').substring(0, 30);

            let contentY = tY + 70 * scale;
            ctx.fillStyle = '#64748b';
            ctx.font = `${18 * scale}px system-ui`;
            ctx.fillText('من (FROM):', imgX + imgSizeW / 2, contentY);
            
            contentY += 25 * scale;
            ctx.fillStyle = '#0f172a';
            ctx.font = `900 ${38 * scale}px system-ui`;
            ctx.fillText(shortRegions, imgX + imgSizeW / 2, contentY);

            contentY += 50 * scale;
            ctx.fillStyle = '#b8860b';
            ctx.font = `${30 * scale}px system-ui`;
            ctx.fillText('⬇️', imgX + imgSizeW / 2, contentY);

            contentY += 45 * scale;
            ctx.fillStyle = '#64748b';
            ctx.font = `${18 * scale}px system-ui`;
            ctx.fillText('إلى (TO):', imgX + imgSizeW / 2, contentY);

            contentY += 25 * scale;
            ctx.fillStyle = '#0f172a';
            ctx.font = `900 ${38 * scale}px system-ui`;
            ctx.fillText(shortUniv, imgX + imgSizeW / 2, contentY);

            contentY += 60 * scale;
            if (description && (description.includes('مقعد') || description.includes('مجال'))) {
               ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
               const bW = 200 * scale, bH = 35 * scale;
               if (ctx.roundRect) {
                  ctx.beginPath(); ctx.roundRect(imgX + imgSizeW/2 - bW/2, contentY, bW, bH, bH/2); ctx.fill();
               } else {
                  ctx.fillRect(imgX + imgSizeW/2 - bW/2, contentY, bW, bH);
               }
               ctx.fillStyle = '#10b981';
               ctx.font = `bold ${18 * scale}px system-ui`;
               ctx.fillText('🟢 مقاعد متوفرة', imgX + imgSizeW / 2, contentY + bH/2 - 2*scale);
               contentY += 45 * scale;
            } else if (views && views > 20) {
               ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
               const bW = 200 * scale, bH = 35 * scale;
               if (ctx.roundRect) {
                  ctx.beginPath(); ctx.roundRect(imgX + imgSizeW/2 - bW/2, contentY, bW, bH, bH/2); ctx.fill();
               } else {
                  ctx.fillRect(imgX + imgSizeW/2 - bW/2, contentY, bW, bH);
               }
               ctx.fillStyle = '#ef4444';
               ctx.font = `bold ${18 * scale}px system-ui`;
               ctx.fillText('🔥 خط مطلوب', imgX + imgSizeW / 2, contentY + bH/2 - 2*scale);
               contentY += 45 * scale;
            }

            if (price) {
               ctx.fillStyle = '#b8860b';
               ctx.font = `900 ${46 * scale}px system-ui`;
               ctx.textAlign = 'right';
               ctx.textBaseline = 'middle';
               ctx.fillText(`${price} د.ع`, tX + tW - 40 * scale, splitY + bottomH / 2);
            }

            try {
               const ticketQr = await QRCode.toDataURL(fullUrl, { margin: 1, width: 140 * scale, color: { dark: '#000000', light: '#ffffff' } });
               const qrImg = new Image();
               qrImg.src = ticketQr;
               await new Promise((res) => { qrImg.onload = res; });
               ctx.drawImage(qrImg, tX + 40 * scale, splitY + bottomH/2 - (70*scale), 140 * scale, 140 * scale);
            } catch(e) {}
         } else {
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(imgX, imgY, imgSizeW, imgSizeH);
         }
      }
      ctx.restore();

      const catBadgeW = 240;
      const catBadgeH = 50;
      const catBadgeX = imgX + imgSizeW - catBadgeW - 20;
      const catBadgeY = imgY - 25; 
      ctx.fillStyle = textColor;
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 10;
      if (ctx.roundRect) {
         ctx.beginPath();
         ctx.roundRect(catBadgeX, catBadgeY, catBadgeW, catBadgeH, 25);
         ctx.fill();
      } else {
         ctx.fillRect(catBadgeX, catBadgeY, catBadgeW, catBadgeH);
      }
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = template === 'simple' ? '#000000' : '#1e293b';
      ctx.font = 'bold 22px system-ui';
      ctx.fillText(`${category === 'cars' ? '🚗 سيارات' : '🛍️ إعلان'} | 📍 ${locText}`, catBadgeX + catBadgeW/2, catBadgeY + 25);

      let contentY = imgY + imgSizeH + (template === 'whatsapp' ? 60 : 80);
      
      ctx.font = `900 ${template === 'whatsapp' ? '48px' : '64px'} system-ui, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      let displayTitle = title;
      if (displayTitle.length > 30) displayTitle = displayTitle.substring(0, 28) + '...';
      ctx.fillText(displayTitle, width / 2, contentY);

      contentY += (template === 'whatsapp' ? 80 : 110);
      if (price) {
         const priceText = `${price} د.ع`;
         ctx.font = `900 ${template === 'whatsapp' ? '60px' : '72px'} system-ui, sans-serif`;
         const pWidth = ctx.measureText(priceText).width + 160;
         
         ctx.save();
         ctx.shadowColor = template === 'luxury' ? '#ffd700' : accentColor;
         ctx.shadowBlur = 30;
         ctx.fillStyle = template === 'luxury' ? 'rgba(255,215,0,0.15)' : 'rgba(245,158,11,0.15)';
         if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(width/2 - pWidth/2, contentY - 60, pWidth, 120, 30);
            ctx.fill();
         } else {
            ctx.fillRect(width/2 - pWidth/2, contentY - 60, pWidth, 120);
         }
         ctx.restore();

         ctx.fillStyle = template === 'luxury' ? '#ffd700' : (template === 'simple' ? accentColor : accentColor);
         ctx.fillText(priceText, width / 2, contentY);
         contentY += (template === 'whatsapp' ? 80 : 100);
      }

      if (template !== 'whatsapp') {
         contentY += 30;
         ctx.font = 'bold 28px system-ui, sans-serif';
         ctx.fillStyle = textSecondaryColor;
         const infoText = `📍 ${locText}   🕒 ${createdAt ? 'حديث' : 'متاح'}   👀 ${views || 0} مشاهدة   ${isVerified ? '❤️ موثق' : ''}`;
         ctx.fillText(infoText, width / 2, contentY);
         contentY += 80;
      }

      const ctaColor = '#10b981'; 
      ctx.fillStyle = ctaColor;
      const ctaW = 420;
      if (ctx.roundRect) {
         ctx.beginPath();
         ctx.roundRect(width/2 - ctaW/2, contentY - 45, ctaW, 90, 45);
         ctx.fill();
      } else {
         ctx.fillRect(width/2 - ctaW/2, contentY - 45, ctaW, 90);
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px system-ui';
      ctx.fillText('اضغط لمشاهدة الإعلان', width / 2, contentY);

      const footerY = height - 120;
      if (template !== 'whatsapp') {
         ctx.fillStyle = footerBg;
         ctx.fillRect(0, footerY - 60, width, 180);

         try {
            const qrDataUrl = await QRCode.toDataURL(fullUrl, { margin: 1, width: 140, color: { dark: '#000000', light: '#ffffff' } });
            const qrImg = new Image();
            qrImg.src = qrDataUrl;
            await new Promise((res) => { qrImg.onload = res; });
            ctx.drawImage(qrImg, width - 180, footerY - 40, 140, 140);
         } catch(e) {}

         ctx.textAlign = 'right';
         ctx.fillStyle = textColor;
         ctx.font = 'bold 32px system-ui';
         ctx.fillText('مو لَكيت اللي تريده؟', width - 200, footerY);
         ctx.font = '28px system-ui';
         ctx.fillStyle = textSecondaryColor;
         ctx.fillText('داخل سوق بغداد أكو آلاف الإعلانات غيره', width - 200, footerY + 45);
         
         ctx.textAlign = 'left';
         ctx.font = 'bold 30px system-ui';
         ctx.fillStyle = accentColor;
         ctx.fillText('souqbaghdad.store', 40, footerY + 25);
      } else {
         ctx.fillStyle = footerBg;
         ctx.fillRect(0, footerY - 30, width, 150);
         ctx.textAlign = 'center';
         ctx.font = 'bold 32px system-ui';
         ctx.fillStyle = textColor;
         ctx.fillText('آلاف الإعلانات بانتظارك داخل سوق بغداد 🛒', width/2, footerY + 20);
         ctx.font = 'bold 28px system-ui';
         ctx.fillStyle = accentColor;
         ctx.fillText('souqbaghdad.store', width/2, footerY + 70);
      }

      return canvas.toDataURL('image/jpeg', 0.92);
  };

  const generateCanvasCardPreview = async () => {
    setIsGeneratingCard(true);
    try {
      const dataUrl = await createCardCanvas(cardTemplate, image);
      setCardDataUrl(dataUrl);
    } catch (e) {
      console.error('Failed card creation', e);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File | null> => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      return new File([blob], filename, { type: 'image/jpeg' });
    } catch {
      return null;
    }
  };

  const downloadSingleCard = async () => {
    if (!cardDataUrl) return;
    if (typeof navigator !== 'undefined' && navigator.share) {
      const file = await dataUrlToFile(cardDataUrl, `souq-baghdad-${(title || 'item').replace(/\s+/g, '-')}.jpg`);
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ title: title, files: [file] });
          triggerToast('📸 اختر "حفظ الصورة" لحفظها فوراً بالاستوديو!');
          return;
        } catch (e) {}
      }
    }
    const a = document.createElement('a');
    a.href = cardDataUrl;
    a.download = `souq-baghdad-${cardTemplate}-${(title || 'item').replace(/\s+/g, '-')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerToast('📸 تم تنزيل الصورة! اضغط عليها واختر "إضافة للصور"');
  };

  const downloadAllStories = async () => {
      if (!images || images.length === 0) return;
      setIsGeneratingZip(true);
      try {
          const zip = new JSZip();
          for (let i = 0; i < images.length; i++) {
              const dataUrl = await createCardCanvas(cardTemplate, images[i]);
              if (dataUrl) {
                  const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
                  zip.file(`souq-baghdad-story-${i+1}.jpg`, base64Data, {base64: true});
              }
          }
          const content = await zip.generateAsync({ type: 'blob' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(content);
          a.download = `souq-baghdad-stories-${(title || 'item').replace(/\s+/g, '-')}.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          triggerToast('📦 تم تحميل ملف الستوريات (ZIP) بنجاح!');
      } catch (err) {
          triggerToast('❌ حدث خطأ أثناء تحميل الستوريات المتعددة.');
      } finally {
          setIsGeneratingZip(false);
      }
  };

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
            await navigator.share({ title: brandTitle, files: [file] });
            return;
          }
        } catch (e) {}
      }
      if (navigator.share) navigator.share({ title: brandTitle, text: customCaption, url: fullUrl }).catch(()=>{});
      else handleCopyCaption();
      return;
    }

    try { await navigator.clipboard.writeText(customCaption); } catch {}

    if (platform === 'insta_story' || platform === 'insta_reels') {
      triggerToast('🚀 جاري مشاركة التصميم والرابط مع انستغرام...');
      const targetUrl = cardDataUrl;
      if (targetUrl && typeof navigator !== 'undefined' && navigator.share) {
        try {
          const file = await dataUrlToFile(targetUrl, `souq-baghdad-${platform}.jpg`);
          if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ title: title, files: [file] });
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

  const primaryApps: { id: PlatformType; name: string; tag: string; icon: any; bg: string }[] = [
    { id: 'native', name: 'تطبيقات الهاتف', tag: 'القائمة الأصلية 📱', icon: <Smartphone className="w-6 h-6 text-black" />, bg: 'bg-amber-400 shadow-amber-500/30 ring-2 ring-amber-300' },
    { id: 'copy_link', name: 'نسخ الرابط', tag: 'رابط مباشر 🔗', icon: <Link2 className="w-6 h-6 text-white" />, bg: 'bg-gray-800 shadow-gray-800/30' },
    { id: 'whatsapp', name: 'واتساب', tag: 'ستوري / خاص 💬', icon: <MessageCircle className="w-6 h-6 text-white" />, bg: 'bg-emerald-500 shadow-emerald-500/30' },
    { id: 'telegram', name: 'تليجرام', tag: 'إعلان كامل ✈️', icon: <Send className="w-6 h-6 text-white" />, bg: 'bg-sky-500 shadow-sky-500/30' },
  ];

  const secondaryApps: { id: PlatformType; name: string; tag: string; icon: any; bg: string }[] = [
    { id: 'insta_story', name: 'انستا ستوري', tag: 'تصميم + رابط 📸', icon: <PlusCircle className="w-6 h-6 text-white" />, bg: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shadow-pink-500/30' },
    { id: 'insta_direct', name: 'انستا دايركت', tag: 'نص ورابط 💬', icon: <SendHorizontal className="w-6 h-6 text-white" />, bg: 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-500/30' },
    { id: 'insta_reels', name: 'انستا ريلز/بوست', tag: 'صورة + كابشن 🖼️', icon: <PlayCircle className="w-6 h-6 text-white" />, bg: 'bg-gradient-to-tr from-pink-600 to-purple-800 shadow-pink-500/30' },
    { id: 'facebook', name: 'فيسبوك', tag: 'بوست / ستوري 📘', icon: <Facebook className="w-6 h-6 text-white" />, bg: 'bg-gray-800 shadow-gray-800/30' },
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
          <div className="w-14 h-1.5 bg-gray-800 rounded-full mx-auto mb-4 shrink-0 cursor-pointer hover:bg-gray-700 transition-colors" onClick={onClose} />

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
              <button onClick={() => setShowGuide(!showGuide)} className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${ showGuide ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/10' : 'bg-gray-850 hover:bg-gray-800 text-amber-400 border-amber-500/20' }`}>
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">كيف أشارك؟</span>
              </button>
              <button onClick={onClose} className="p-2.5 bg-gray-850 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white border border-gray-800 transition-colors" title="إغلاق"><X className="w-4 h-4" /></button>
            </div>
          </div>

          <AnimatePresence>
            {showGuide && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-200 space-y-2.5 dir-rtl overflow-hidden shrink-0">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-sm border-b border-amber-500/10 pb-2"><Info className="w-4 h-4" /><span>دليل الاستفادة القصوى من ميزات النشر السريع 📱</span></div>
                <div className="grid grid-cols-1 gap-2.5 text-[11px] text-gray-300 leading-relaxed">
                  <div className="flex items-start gap-2"><span className="bg-amber-500 text-black font-black w-5 h-5 flex items-center justify-center rounded-full text-[10px] shrink-0">١</span><span><strong>مشاركة الرابط والنص 🔗:</strong> يمكنك نسخ وتخصيص كابشن الإعلان الجاهز ثم إرساله لواتساب أو تليجرام مباشرة.</span></div>
                  <div className="flex items-start gap-2"><span className="bg-amber-500 text-black font-black w-5 h-5 flex items-center justify-center rounded-full text-[10px] shrink-0">٢</span><span><strong>بطاقات التصميم للنشر 📸:</strong> تتيح لك تنزيل بطاقة إعلانية جذابة مجهزة تلقائياً بمعلومات وسعر المنتج لنشرها في ستوري إنستغرام أو فيسبوك بنقرة واحدة.</span></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex bg-gray-950 border border-gray-850 rounded-2xl p-1 my-4 shrink-0 shadow-inner">
            <button onClick={() => setActiveTab('text')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${ activeTab === 'text' ? 'bg-amber-500 text-black font-black shadow-md shadow-amber-500/10' : 'text-gray-400 hover:text-white' }`}><FileText className="w-4 h-4" /><span>مشاركة الرابط والوصف</span></button>
            <button onClick={() => setActiveTab('card')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${ activeTab === 'card' ? 'bg-amber-500 text-black font-black shadow-md shadow-amber-500/10' : 'text-gray-400 hover:text-white' }`}><Palette className="w-4 h-4" /><span>تصاميم بطاقات النشر 📸</span></button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 pl-1 custom-scrollbar space-y-4 pb-2">
            
            {activeTab === 'text' ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-gray-950 border border-gray-850 rounded-2xl p-3 shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-gray-400 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /><span>الكابشن الجاهز (تعديل مباشر ✍️)</span></span>
                    <button onClick={handleCopyCaption} className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[10px] font-black rounded-lg flex items-center gap-1.5 transition-all"><Copy className="w-3.5 h-3.5" /><span>{copiedText ? 'تم النسخ!' : 'نسخ الكابشن'}</span></button>
                  </div>
                  <textarea value={customCaption} onChange={(e) => setCustomCaption(e.target.value)} className="w-full h-32 bg-transparent text-gray-200 text-xs leading-relaxed font-medium focus:outline-none resize-none scrollbar-none custom-scrollbar" placeholder="اكتب كابشن الإعلان هنا..." dir="rtl" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5"><Share2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" /><span>اختر وجهة الإرسال والمشاركة 🚀</span></span>
                    <button onClick={() => setShowAllApps(!showAllApps)} className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"><span>{showAllApps ? 'إخفاء' : 'المزيد'}</span>{showAllApps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>
                  </div>

                  <div className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 px-1 no-scrollbar scroll-smooth">
                    {currentSliderItems.map((item) => (
                      <button key={item.id} onClick={() => handleAppClick(item.id)} className="flex flex-col items-center shrink-0 group focus:outline-none">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all group-hover:scale-105 group-active:scale-95 ${item.bg}`}>{item.icon}</div>
                        <span className="text-[11px] font-black text-white mt-1.5">{item.name}</span>
                        <span className="text-[9px] text-gray-400 font-medium">{item.tag}</span>
                      </button>
                    ))}
                    {!showAllApps && (
                      <button onClick={() => setShowAllApps(true)} className="flex flex-col items-center shrink-0 group focus:outline-none">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all group-hover:scale-105 group-active:scale-95 bg-gray-800 border border-gray-750 text-amber-400"><ChevronDown className="w-6 h-6" /></div>
                        <span className="text-[11px] font-black text-white mt-1.5">المزيد</span>
                        <span className="text-[9px] text-gray-400 font-medium">باقي المنصات</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-gray-800/10 border border-gray-800/20 rounded-2xl text-xs text-blue-200 flex items-start gap-2.5 text-right dir-rtl">
                  <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex-1">
                    <span className="font-bold block text-blue-300 text-xs mb-0.5">💡 نصيحة للنشر الذكي والسريع:</span>
                    <span className="text-[11px] leading-relaxed text-gray-300 block font-medium">رابط هذا المنتج منسوخ وجاهز! عند توجيهك لإنستغرام، استخدم **ملصق الرابط (Link Sticker 🔗)** والصق الرابط ليدخل المتابعون لإعلانك مباشرة بلمسة واحدة!</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn flex flex-col items-center">
                
                <div className="w-full flex overflow-x-auto gap-2 bg-gray-950 border border-gray-850 p-2 rounded-2xl shadow-inner shrink-0 no-scrollbar scroll-smooth snap-x">
                  {[
                    { id: 'luxury', label: '🖤 فاخر' },
                    { id: 'simple', label: '⚪ أبيض' },
                    { id: 'story', label: '📱 ستوري' },
                    { id: 'facebook', label: '🟦 فيسبوك' },
                    { id: 'whatsapp', label: '🟢 واتساب' }
                  ].map(tmpl => (
                    <button
                      key={tmpl.id}
                      onClick={() => setCardTemplate(tmpl.id as TemplateType)}
                      className={`px-4 py-2 shrink-0 snap-center text-xs font-black rounded-xl transition-all duration-200 ${
                        cardTemplate === tmpl.id ? 'bg-gray-850 text-amber-400 border border-amber-500/30 shadow-md shadow-amber-500/10' : 'text-gray-400 hover:bg-gray-900 border border-transparent'
                      }`}
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>

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
                      <img src={cardDataUrl} alt="Design Card Preview" className="w-full h-auto object-contain bg-slate-950" draggable={false} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <span className="bg-amber-500 text-black px-3 py-1.5 rounded-full text-[10px] font-black shadow-lg">معاينة حية للتصميم 🎨</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full aspect-[9/16] max-h-[350px] flex items-center justify-center text-gray-500 text-xs">فشل تحميل التصميم.</div>
                  )}
                </div>

                <div className="w-full grid grid-cols-1 gap-2.5">
                  <button
                    onClick={downloadSingleCard}
                    disabled={!cardDataUrl || isGeneratingCard}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10 active:scale-[0.99] disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 shrink-0 text-black" />
                    <span>حفظ وتنزيل التصميم الحالي 📸</span>
                  </button>

                  {images && images.length > 1 && (
                     <button
                        onClick={downloadAllStories}
                        disabled={isGeneratingZip}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.99] disabled:opacity-50"
                     >
                        {isGeneratingZip ? (
                           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                           <Layers className="w-4 h-4 text-indigo-200" />
                        )}
                        <span>تنزيل جميع الصور كستوريات متتالية (ZIP) 📦</span>
                     </button>
                  )}
                  
                  <button
                    onClick={() => handleAppClick('native')}
                    disabled={!cardDataUrl}
                    className="w-full py-3.5 bg-gray-800/80 hover:bg-gray-800 border border-gray-700/80 text-gray-200 font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <Share2 className="w-4 h-4 text-amber-400" />
                    <span>مشاركة الصورة المباشرة عبر الهاتف</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-800 shrink-0">
            <button
              onClick={handleCopyLink}
              className={`w-full py-3.5 border rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 ${
                copiedLink ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-black' : 'bg-gray-850 hover:bg-gray-800 border-gray-800 text-gray-200 font-bold'
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
