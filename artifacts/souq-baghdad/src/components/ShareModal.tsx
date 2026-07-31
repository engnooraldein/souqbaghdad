import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { 
  X, Copy, Check, Share2, MessageCircle, Send, Facebook, 
  Smartphone, Download, Sparkles, PlusCircle, PlayCircle, SendHorizontal, Lightbulb, HelpCircle, Info, ChevronDown, ChevronUp,
  FileText, Palette, CheckCircle2, Layers, Link2, Eye, Maximize2
} from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
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
  const [activeTab, setActiveTab] = useState<'text' | 'card'>('card');
  const [cardTemplate, setCardTemplate] = useState<TemplateType>('story');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showAllApps, setShowAllApps] = useState(false);
  const [showFullPreviewModal, setShowFullPreviewModal] = useState(false);
  
  const [customCaption, setCustomCaption] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const locText = governorate || location || 'العراق';
  const idBadge = short_id ? `#${short_id}` : '';
  const cleanUrl = (raw: string) => {
    if (!raw) return 'https://www.souqbaghdad.store';
    let base = raw;
    if (!base.startsWith('http')) {
      base = `https://www.souqbaghdad.store${base.startsWith('/') ? base : '/' + base}`;
    }
    // Clean trailing slashes or duplicate hashes for Telegram & Social Preview
    return base.replace(/([^:]\/)\/+/g, "$1");
  };
  const fullUrl = cleanUrl(url);

  const formatSharePrice = (p?: string) => {
    if (!p) return '';
    const cleanStr = String(p).trim();
    const rawNum = cleanStr.replace(/[^\d]/g, '');
    if (!rawNum) return `${cleanStr} دينار عراقي`;
    const num = Number(rawNum);
    const formattedNum = num.toLocaleString('en-US');
    if (cleanStr.includes('مليون') || num >= 100000000) {
      return `${formattedNum} مليون دينار عراقي`;
    } else if (cleanStr.includes('الف') || cleanStr.includes('ألف') || num < 1000000) {
      return `${formattedNum} الف دينار عراقي`;
    }
    return `${formattedNum} دينار عراقي`;
  };

  const getShareText = () => {
    const descSnippet = description ? `\n📝 *الوصف:* ${description.slice(0, 100)}${description.length > 100 ? '...' : ''}` : '';
    return `✨ *أهلاً بك في منصة سوق بغداد الرقمية* 🇮🇶✨\n\n🛍️ *${title}* ${idBadge}\n📍 *الموقع:* ${locText}${price ? `\n🏷️ *السعر:* ${formatSharePrice(price)}` : ''}${descSnippet}\n\nتواصل مباشر وسريع بين البائع والمشتري! 🚀🤝\n\n🔗 *رابط التفاصيل:* ${fullUrl}`;
  };

  const telegramText = `✨ *أهلاً بك في منصة سوق بغداد الرقمية* 🇮🇶✨\n\n🛍️ *${title}* ${idBadge}\n📍 *الموقع:* ${locText}${price ? `\n🏷️ *السعر:* ${formatSharePrice(price)}` : ''}\n\nتصفح كافة التفاصيل وتواصل مباشر مع البائع عبر المنصة 🚀\n👇🔗\n${fullUrl}`;

  useEffect(() => {
    if (isOpen) {
      setActiveTab('card');
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

  // ── Safe image loader: fetch as Blob → createObjectURL (never taints canvas) ──
  const loadSafeImage = async (src: string): Promise<HTMLImageElement | null> => {
    if (!src) return null;
    let blobUrl: string | null = null;
    try {
      const res = await fetch(src, { cache: 'force-cache' });
      if (res.ok) {
        const blob = await res.blob();
        blobUrl = URL.createObjectURL(blob);
      }
    } catch {}
    const srcToLoad = blobUrl ?? src;
    const img = await new Promise<HTMLImageElement | null>((resolve) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => resolve(null);
      el.src = srcToLoad;
    });
    // keep blobUrl alive until canvas drawing is done – caller revokes via cleanup
    if (img) (img as any).__blobUrl = blobUrl;
    else if (blobUrl) URL.revokeObjectURL(blobUrl);
    return img;
  };

  // Revoke all blob URLs stored on images after canvas drawing
  const revokeBlobUrls = (...imgs: (HTMLImageElement | null)[]) => {
    imgs.forEach(img => { if (img && (img as any).__blobUrl) URL.revokeObjectURL((img as any).__blobUrl); });
  };

  // ── Modern iPhone-style card canvas builder → returns Blob (not DataURL) ──
  const createCardCanvas = async (template: TemplateType, targetImage: string | undefined): Promise<Blob | null> => {
      const width = 1080;
      let height = 1920;
      if (template === 'facebook') height = 1350;
      if (template === 'whatsapp') height = 1080;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // ── Color scheme by template + category ──
      let bgGradColor1 = '#0d1117';
      let bgGradColor2 = '#161b22';
      let accentColor  = '#f59e0b';
      let accentDark   = '#d97706';
      let textColor    = '#f1f5f9';
      let textMuted    = '#94a3b8';

      if (template === 'luxury') {
        bgGradColor1 = '#0a0a0a'; bgGradColor2 = '#1a1008'; accentColor = '#fbbf24'; accentDark = '#92400e';
      } else if (template === 'simple') {
        bgGradColor1 = '#f0f4f8'; bgGradColor2 = '#dbe4ee'; accentColor = '#1e293b'; accentDark = '#334155'; textColor = '#0f172a'; textMuted = '#475569';
      } else {
        switch (category) {
          case 'cars':          bgGradColor1='#0c0a1e'; bgGradColor2='#1e0a1a'; accentColor='#ef4444'; accentDark='#9f1239'; break;
          case 'real-estate':   bgGradColor1='#031a0f'; bgGradColor2='#082018'; accentColor='#10b981'; accentDark='#065f46'; break;
          case 'electronics':   bgGradColor1='#050d24'; bgGradColor2='#0a1a3c'; accentColor='#60a5fa'; accentDark='#1d4ed8'; break;
          case 'phones':        bgGradColor1='#0f0724'; bgGradColor2='#1a0a38'; accentColor='#a78bfa'; accentDark='#6d28d9'; break;
          case 'furniture':     bgGradColor1='#1a0e00'; bgGradColor2='#2d1a00'; accentColor='#f97316'; accentDark='#9a3412'; break;
          case 'animals':       bgGradColor1='#0a1a0a'; bgGradColor2='#142a10'; accentColor='#4ade80'; accentDark='#15803d'; break;
          case 'jobs':          bgGradColor1='#0f1923'; bgGradColor2='#1a2d3d'; accentColor='#38bdf8'; accentDark='#0369a1'; break;
          case 'services':      bgGradColor1='#16001e'; bgGradColor2='#2a0038'; accentColor='#e879f9'; accentDark='#86198f'; break;
          default:              bgGradColor1='#0d1117'; bgGradColor2='#161b22'; accentColor='#f59e0b'; accentDark='#d97706'; break;
        }
      }

      // ── Background ──
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, bgGradColor1);
      bgGrad.addColorStop(1, bgGradColor2);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // ── Subtle radial accent glows ──
      if (template !== 'simple') {
        const g1 = ctx.createRadialGradient(width * 0.85, height * 0.1, 0, width * 0.85, height * 0.1, width * 0.6);
        g1.addColorStop(0, `${accentColor}22`); g1.addColorStop(1, 'transparent');
        ctx.fillStyle = g1; ctx.fillRect(0, 0, width, height);
        const g2 = ctx.createRadialGradient(width * 0.15, height * 0.9, 0, width * 0.15, height * 0.9, width * 0.6);
        g2.addColorStop(0, `${accentDark}18`); g2.addColorStop(1, 'transparent');
        ctx.fillStyle = g2; ctx.fillRect(0, 0, width, height);
      }

      // ── Top bar: Hot views banner ──

      let cursorY = 0;
      if (views && views > 10) {
        ctx.fillStyle = `${accentColor}dd`;
        ctx.fillRect(0, 0, width, 68);
        ctx.fillStyle = template === 'simple' ? '#fff' : '#000';
        ctx.font = 'bold 28px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`🔥 ${views.toLocaleString()} شخص شاهدوا هذا الإعلان!`, width / 2, 34);
        cursorY = 68;
      }

      // ── Header: Logo + Brand ──
      const isSmall = template === 'whatsapp';
      const headerPad = isSmall ? 32 : 52;
      cursorY += headerPad;

      const logoImg = await loadSafeImage('/logo-512.webp');
      const logoSize = isSmall ? 72 : 110;
      if (logoImg) {
        ctx.save();
        ctx.shadowColor = `${accentColor}66`; ctx.shadowBlur = 28;
        ctx.drawImage(logoImg, width / 2 - logoSize / 2, cursorY, logoSize, logoSize);
        ctx.restore();
        revokeBlobUrls(logoImg);
      }
      cursorY += logoSize + (isSmall ? 18 : 26);

      // Brand name
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `900 ${isSmall ? 32 : 42}px system-ui, sans-serif`;
      ctx.fillStyle = accentColor;
      ctx.fillText('سوق بغداد  🇮🇶  SOUQ BAGHDAD', width / 2, cursorY);
      cursorY += isSmall ? 22 : 30;

      // Tagline
      ctx.font = `${isSmall ? 22 : 28}px system-ui, sans-serif`;
      ctx.fillStyle = textMuted;
      ctx.fillText('السوق الرقمي العراقي الأول • souqbaghdad.store', width / 2, cursorY);
      cursorY += isSmall ? 30 : 46;

      // ── Category badge ──
      const catLabels: Record<string, string> = {
        cars: '🚗 سيارات', 'real-estate': '🏠 عقارات', electronics: '💻 إلكترونيات',
        phones: '📱 هواتف', furniture: '🛋️ أثاث', animals: '🐾 حيوانات',
        jobs: '💼 وظائف', services: '🔧 خدمات', transport: '🚐 مواصلات',
        general: '🛍️ إعلانات عامة'
      };
      const catLabel = catLabels[category ?? 'general'] ?? '🛍️ إعلان';
      ctx.font = `bold ${isSmall ? 22 : 28}px system-ui, sans-serif`;
      const catW = Math.max(260, ctx.measureText(catLabel).width + 60);
      const catH = isSmall ? 46 : 56;
      ctx.fillStyle = `${accentColor}22`;
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(width/2 - catW/2, cursorY, catW, catH, catH/2); ctx.fill(); }
      else ctx.fillRect(width/2 - catW/2, cursorY, catW, catH);
      ctx.strokeStyle = `${accentColor}66`; ctx.lineWidth = 2;
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(width/2 - catW/2, cursorY, catW, catH, catH/2); ctx.stroke(); }
      ctx.fillStyle = accentColor;
      ctx.fillText(catLabel, width / 2, cursorY + catH / 2);
      cursorY += catH + (isSmall ? 28 : 40);

      // ── Main image ──
      const imgAreaH = isSmall ? 320 : template === 'facebook' ? 420 : 660;
      const imgX = 60, imgW = width - 120, imgH = imgAreaH;
      const imgY = cursorY;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
      const r = 32;
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(imgX, imgY, imgW, imgH, r); ctx.clip(); }
      else { ctx.rect(imgX, imgY, imgW, imgH); ctx.clip(); }

      const loadedImg = targetImage ? await loadSafeImage(targetImage) : null;
      if (loadedImg) {
        const asp = loadedImg.naturalWidth / loadedImg.naturalHeight;
        const tAsp = imgW / imgH;
        let dW = imgW, dH = imgH, dX = imgX, dY = imgY;
        if (asp > tAsp) { dW = imgH * asp; dX = imgX - (dW - imgW) / 2; }
        else { dH = imgW / asp; dY = imgY - (dH - imgH) / 2; }
        ctx.drawImage(loadedImg, dX, dY, dW, dH);
        revokeBlobUrls(loadedImg);
      } else if (category === 'transport' || university) {
        // Boarding pass style placeholder
        const bg2 = ctx.createLinearGradient(imgX, imgY, imgX, imgY + imgH);
        bg2.addColorStop(0, '#f8f6f0'); bg2.addColorStop(1, '#e8e0cc');
        ctx.fillStyle = bg2; ctx.fillRect(imgX, imgY, imgW, imgH);
        const splitY2 = imgY + imgH * 0.72;
        ctx.strokeStyle = '#c0a060'; ctx.lineWidth = 3;
        ctx.setLineDash([14, 14]);
        ctx.beginPath(); ctx.moveTo(imgX + 30, splitY2); ctx.lineTo(imgX + imgW - 30, splitY2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#92400e'; ctx.font = 'bold 32px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🚐 تذكرة خط جامعي — BOARDING PASS', imgX + imgW/2, imgY + 45);
        ctx.fillStyle = '#1e293b'; ctx.font = '900 44px system-ui';
        ctx.fillText((regions || 'الانطلاق').slice(0, 22), imgX + imgW/2, imgY + imgH * 0.25);
        ctx.fillStyle = '#92400e'; ctx.font = '32px system-ui';
        ctx.fillText('⬇', imgX + imgW/2, imgY + imgH * 0.44);
        ctx.fillStyle = '#1e293b'; ctx.font = '900 44px system-ui';
        ctx.fillText((university || 'الوصول').slice(0, 22), imgX + imgW/2, imgY + imgH * 0.60);
        if (price) {
          ctx.fillStyle = '#92400e'; ctx.font = '900 46px system-ui'; ctx.textAlign = 'right';
          ctx.fillText(`${price} د.ع`, imgX + imgW - 40, splitY2 + (imgH - splitY2 + imgY) / 2);
          ctx.textAlign = 'center';
        }
      } else {
        const ph = ctx.createLinearGradient(imgX, imgY, imgX, imgY + imgH);
        ph.addColorStop(0, '#1e293b'); ph.addColorStop(1, '#0f172a');
        ctx.fillStyle = ph; ctx.fillRect(imgX, imgY, imgW, imgH);
        ctx.fillStyle = `${accentColor}30`; ctx.fillRect(imgX, imgY, imgW, imgH);
        ctx.fillStyle = `${accentColor}44`; ctx.font = '100px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(catLabel.split(' ')[0] || '🛍️', imgX + imgW/2, imgY + imgH/2);
      }
      ctx.restore();

      // Thin accent bottom line on image
      ctx.fillStyle = accentColor;
      ctx.fillRect(imgX, imgY + imgH - 6, imgW, 6);

      cursorY = imgY + imgH + (isSmall ? 28 : 42);

      // ── Title (Clean 2-line wrap if long to prevent squeezing) ──
      const titleFontSize = isSmall ? 40 : template === 'facebook' ? 48 : 54;
      ctx.font = `900 ${titleFontSize}px system-ui, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';

      const maxTitleWidth = width - 120;
      if (ctx.measureText(title).width <= maxTitleWidth) {
        ctx.fillText(title, width / 2, cursorY);
        cursorY += titleFontSize + (isSmall ? 18 : 26);
      } else {
        // Split into 2 lines
        const words = title.split(' ');
        let line1 = '', line2 = '';
        for (const w of words) {
          if (ctx.measureText(line1 + ' ' + w).width <= maxTitleWidth) {
            line1 += (line1 ? ' ' : '') + w;
          } else {
            line2 += (line2 ? ' ' : '') + w;
          }
        }
        if (!line2) { line1 = title.slice(0, 30); line2 = title.slice(30); }
        ctx.fillText(line1, width / 2, cursorY);
        cursorY += titleFontSize + 10;
        ctx.fillText(line2.length > 30 ? line2.slice(0, 28) + '…' : line2, width / 2, cursorY);
        cursorY += titleFontSize + (isSmall ? 18 : 26);
      }

      // ── Description snippet ──
      if (description && !isSmall && template !== 'facebook') {
        const descSnip = description.length > 65 ? description.slice(0, 63) + '…' : description;
        ctx.font = '28px system-ui, sans-serif';
        ctx.fillStyle = textMuted;
        ctx.fillText(descSnip, width / 2, cursorY);
        cursorY += 40;
      }

      // ── Price badge (Strict top-to-bottom layout, zero overlap) ──
      if (price) {
        cursorY += 12; // top spacing before price box
        const priceText = formatSharePrice(price);
        const priceFontSize = isSmall ? 40 : template === 'facebook' ? 46 : 52;
        ctx.font = `900 ${priceFontSize}px system-ui, sans-serif`;
        const pW = Math.min(width - 120, ctx.measureText(priceText).width + 80);
        const pH = priceFontSize + 32;

        ctx.save();
        ctx.shadowColor = accentColor; ctx.shadowBlur = 28;
        ctx.fillStyle = `${accentColor}22`;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(width/2 - pW/2, cursorY, pW, pH, 24); ctx.fill(); }
        else ctx.fillRect(width/2 - pW/2, cursorY, pW, pH);
        ctx.strokeStyle = `${accentColor}88`; ctx.lineWidth = 2.5;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(width/2 - pW/2, cursorY, pW, pH, 24); ctx.stroke(); }
        ctx.restore();

        ctx.fillStyle = accentColor;
        ctx.textBaseline = 'middle';
        ctx.fillText(priceText, width / 2, cursorY + pH / 2);
        cursorY += pH + (isSmall ? 20 : 30);
      } else {
        cursorY += 16;
      }

      // ── Location + Views row ──
      ctx.font = `${isSmall ? 24 : 28}px system-ui, sans-serif`;
      ctx.fillStyle = textMuted;
      ctx.textBaseline = 'top';
      const infoRow = `📍 ${locText}   •   👀 ${(views || 0).toLocaleString()} مشاهدة${isVerified ? '   •   ✅ موثق' : ''}`;
      ctx.fillText(infoRow, width / 2, cursorY);
      cursorY += isSmall ? 38 : 48;

      // ── CTA button ──
      if (!isSmall || cursorY < height - 180) {
        const ctaW = 460, ctaH = isSmall ? 74 : 82;
        const ctaY = cursorY;
        ctx.save();
        ctx.shadowColor = '#10b981'; ctx.shadowBlur = 24;
        const ctaG = ctx.createLinearGradient(width/2 - ctaW/2, 0, width/2 + ctaW/2, 0);
        ctaG.addColorStop(0, '#059669'); ctaG.addColorStop(1, '#10b981');
        ctx.fillStyle = ctaG;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(width/2 - ctaW/2, ctaY, ctaW, ctaH, ctaH/2); ctx.fill(); }
        else ctx.fillRect(width/2 - ctaW/2, ctaY, ctaW, ctaH);
        ctx.restore();
        ctx.fillStyle = '#ffffff'; ctx.font = `bold ${isSmall ? 28 : 34}px system-ui`;
        ctx.textBaseline = 'middle';
        ctx.fillText('اضغط لمشاهدة الإعلان كاملاً →', width / 2, ctaY + ctaH / 2);
        cursorY = ctaY + ctaH + 28;
      }

      // ── Footer ──
      const footH = isSmall ? 100 : 140;
      const footY = height - footH;
      ctx.fillStyle = template === 'simple' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
      ctx.fillRect(0, footY, width, footH);
      ctx.fillStyle = accentColor;
      ctx.fillRect(0, footY, width, 4);

      // QR code (non-small templates only)
      if (!isSmall) {
        try {
          const qrData = await QRCode.toDataURL(fullUrl, { margin: 1, width: 130, color: { dark: '#000', light: '#fff' } });
          const qrImg2 = await loadSafeImage(qrData);
          if (qrImg2) { ctx.drawImage(qrImg2, width - 168, footY + 5, 128, 128); revokeBlobUrls(qrImg2); }
        } catch {}
        ctx.textAlign = 'right'; ctx.font = 'bold 28px system-ui'; ctx.fillStyle = textColor;
        ctx.fillText('souqbaghdad.store', width - 180, footY + 48);
        ctx.font = '22px system-ui'; ctx.fillStyle = textMuted;
        ctx.fillText('السوق الرقمي العراقي الأول 🇮🇶', width - 180, footY + 85);
        ctx.textAlign = 'left'; ctx.font = 'bold 26px system-ui'; ctx.fillStyle = accentColor;
        ctx.fillText(idBadge || '🛍️ سوق بغداد', 44, footY + 60);
      } else {
        ctx.textAlign = 'center'; ctx.font = 'bold 28px system-ui'; ctx.fillStyle = textColor;
        ctx.fillText('آلاف الإعلانات بانتظارك 🛒  souqbaghdad.store', width/2, footY + footH/2);
      }

      // ── Return Blob (not DataURL) so canvas is never read cross-origin ──
      return new Promise<Blob | null>((resolve) => {
        try { canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92); }
        catch { resolve(null); }
      });
  }; // end createCardCanvas

  const generateCanvasCardPreview = async () => {

    setIsGeneratingCard(true);
    setCardDataUrl(null);
    try {
      const blob = await createCardCanvas(cardTemplate, image);
      if (blob) {
        // For preview we use a temporary Object URL (revoked when modal closes or template changes)
        const previewUrl = URL.createObjectURL(blob);
        setCardDataUrl(previewUrl);
      }
    } catch (e) {
      console.error('Failed card creation', e);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const blobToFile = (blob: Blob, filename: string): File =>
    new File([blob], filename, { type: 'image/jpeg' });

  // Save Blob via Native Share (Capacitor App), Web Share API (Mobile Safari/Chrome/PWA), or <a download> (desktop)
  const saveBlobImage = async (blob: Blob, fileName: string, shareTitle: string) => {
    // Path 0: Native Capacitor Android / iOS App
    if (Capacitor.isNativePlatform()) {
      try {
        const base64WithHeader = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const base64Data = base64WithHeader.replace(/^data:image\/\w+;base64,/, '');
        const cleanFileName = fileName.endsWith('.jpg') ? fileName : `${fileName}.jpg`;
        const savedFile = await Filesystem.writeFile({
          path: cleanFileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        await Share.share({
          title: shareTitle,
          text: shareTitle,
          dialogTitle: 'حفظ / مشاركة الصورة 🖼️',
          files: [savedFile.uri],
        });
        return true;
      } catch (e: any) {
        if (e?.name === 'AbortError') return true;
        console.warn('Capacitor native share error', e);
      }
    }

    const file = blobToFile(blob, fileName);
    // Path 1: Web Share API (iOS Safari + Android Chrome including PWA)
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ title: shareTitle, files: [file] });
        return true;
      } catch (e: any) {
        if (e?.name === 'AbortError') return true; // user cancelled = success
        console.warn('share failed', e);
      }
    }
    // Path 2: <a download> with blob URL (desktop)
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl; a.download = fileName; a.target = '_blank';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 15_000);
    return true;
  };

  const downloadSingleCard = async () => {
    setIsGeneratingCard(true);
    triggerToast('⏳ جاري إنشاء التصميم...');
    try {
      const blob = await createCardCanvas(cardTemplate, image);
      if (!blob) { triggerToast('❌ تعذر إنشاء التصميم.'); return; }
      const safeTitle = (title || 'card').replace(/[^\w\d\u0600-\u06FF-]/g, '_').slice(0, 30);
      const fileName = `souq-baghdad-${cardTemplate}-${safeTitle}.jpg`;
      await saveBlobImage(blob, fileName, `سوق بغداد | ${title}`);
      triggerToast('✅ تم! اختر «حفظ الصورة» لحفظها في الاستوديو 🖼️');
    } catch (err) {
      console.error('downloadSingleCard error', err);
      triggerToast('❌ فشل التحميل، حاول مرة أخرى.');
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const downloadAllStories = async () => {
    if (!images || images.length === 0) return;
    setIsGeneratingZip(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < images.length; i++) {
        triggerToast(`⏳ تصميم الصورة ${i + 1} من ${images.length}...`);
        const blob = await createCardCanvas(cardTemplate, images[i]);
        if (blob) {
          const buf = await blob.arrayBuffer();
          zip.file(`souq-baghdad-story-${i + 1}.jpg`, buf);
        }
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const blobUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `souq-baghdad-stories-${(title || 'item').replace(/\s+/g, '-')}.zip`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
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
      triggerToast('⏳ جاري إعداد التصميم للمشاركة...');
      const brandTitle = `سوق بغداد 🇮🇶 | ${title}`;
      try {
        const blob = await createCardCanvas(cardTemplate, image);
        if (blob) {
          if (Capacitor.isNativePlatform()) {
            const base64WithHeader = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            const base64Data = base64WithHeader.replace(/^data:image\/\w+;base64,/, '');
            const savedFile = await Filesystem.writeFile({
              path: `souq-baghdad-card-${Date.now()}.jpg`,
              data: base64Data,
              directory: Directory.Cache,
            });
            await Share.share({
              title: brandTitle,
              text: customCaption,
              dialogTitle: 'مشاركة الصورة المباشرة 📱',
              files: [savedFile.uri]
            });
            triggerToast('✅ تم فتح نافذة المشاركة!');
            return;
          }
          const file = blobToFile(blob, 'Souq-Baghdad.jpg');
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ title: brandTitle, files: [file] });
            triggerToast('✅ تم فتح نافذة المشاركة!');
            return;
          }
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') console.warn('native share error', e);
        else return;
      }
      if (navigator.share) navigator.share({ title: brandTitle, text: customCaption, url: fullUrl }).catch(() => {});
      else handleCopyCaption();
      return;
    }

    try { await navigator.clipboard.writeText(customCaption); } catch {}

    if (platform === 'insta_story' || platform === 'insta_reels') {
      triggerToast('⏳ جاري إعداد تصميم الستوري...');
      try {
        const blob = await createCardCanvas(cardTemplate, image);
        if (blob) {
          const file = blobToFile(blob, `souq-baghdad-${platform}.jpg`);
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ title, files: [file] });
            triggerToast('✅ تم! انشر التصميم على ستوري انستغرام 🚀');
            return;
          }
        }
      } catch (e: any) { if (e?.name !== 'AbortError') console.warn(e); else return; }
      window.open('https://www.instagram.com/', '_blank');
    } else if (platform === 'insta_direct') {
      triggerToast('💬 تم نسخ نص الإعلان! جاري فتح انستغرام...');
      window.open('https://www.instagram.com/direct/inbox/', '_blank');
    } else if (platform === 'facebook') {
      triggerToast('🚀 تم نسخ النص والرابط! جاري تحويلك لفيسبوك...');
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, '_blank');
    } else if (platform === 'whatsapp') {
      triggerToast('💬 تم نسخ النص والرابط! جاري فتح واتساب...');
      const waUri = `whatsapp://send?text=${encodeURIComponent(customCaption)}`;
      const waWeb = `https://wa.me/?text=${encodeURIComponent(customCaption)}`;
      try {
        window.location.href = waUri;
        setTimeout(() => window.open(waWeb, '_blank'), 1500);
      } catch {
        window.open(waWeb, '_blank');
      }
    } else if (platform === 'telegram') {
      triggerToast('✈️ تم نسخ الإعلان المرفق! جاري فتح تليجرام...');
      const tgUri = `tg://msg_url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(telegramText)}`;
      const tgWeb = `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(telegramText)}`;
      try {
        window.location.href = tgUri;
        setTimeout(() => window.open(tgWeb, '_blank'), 1500);
      } catch {
        window.open(tgWeb, '_blank');
      }
    }
  };

  // Keyboard Escape listener & Back handling for PWA / Mobile
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showFullPreviewModal) {
          setShowFullPreviewModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showFullPreviewModal, onClose]);

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
          className="relative bg-gray-900 border-t sm:border border-gray-800 rounded-t-[2.5rem] sm:rounded-3xl p-5 w-full max-w-lg shadow-2xl z-10 text-right dir-rtl max-h-[94vh] flex flex-col overflow-hidden"
          style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
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
              <button 
                onClick={onClose} 
                className="px-3 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-black rounded-xl shadow-lg border border-amber-400 flex items-center gap-1 text-xs transition-all shrink-0" 
                title="إغلاق النافذة"
              >
                <X className="w-4 h-4 stroke-[3]" />
                <span>إغلاق</span>
              </button>
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
                    <div 
                      onClick={() => setShowFullPreviewModal(true)}
                      className="relative w-full overflow-hidden rounded-2xl mt-2 select-none shadow-lg cursor-pointer group"
                    >
                      <img src={cardDataUrl} alt="Design Card Preview" className="w-full h-auto object-contain bg-slate-950" draggable={false} />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 backdrop-blur-[2px] p-2 text-center">
                        <Maximize2 className="w-6 h-6 text-amber-400" />
                        <span className="bg-amber-500 text-black px-3 py-1 rounded-full text-[10px] font-black shadow-lg">اضغط للتكبير والحفظ المباشر 🔍</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full aspect-[9/16] max-h-[350px] flex items-center justify-center text-gray-500 text-xs">فشل تحميل التصميم.</div>
                  )}
                </div>

                <div className="w-full grid grid-cols-1 gap-2.5">
                  {/* Highlighted Direct Image Share Button — Priority #1 */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAppClick('native')}
                    disabled={!cardDataUrl}
                    className="w-full py-4 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:from-amber-500 hover:to-yellow-600 text-black font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/20 border-2 border-amber-300 transition-all active:scale-[0.99] disabled:opacity-50 relative overflow-hidden group"
                  >
                    <span className="absolute -top-1 right-3 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-b-md shadow-md animate-pulse">
                      🔥 الأكثر استخداماً والمفضل
                    </span>
                    <Share2 className="w-5 h-5 shrink-0 text-black stroke-[2.5]" />
                    <span>مشاركة الصورة المباشرة للتطبيقات 📱🚀</span>
                  </motion.button>

                  <button
                    onClick={downloadSingleCard}
                    disabled={!cardDataUrl || isGeneratingCard}
                    className="w-full py-3.5 bg-gray-850 hover:bg-gray-800 border border-gray-750 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>حفظ وتنزيل التصميم الحالي 📸</span>
                  </button>

                  <button
                    onClick={() => setShowFullPreviewModal(true)}
                    disabled={!cardDataUrl}
                    className="w-full py-3.5 bg-gray-850 hover:bg-gray-800 border border-gray-750 text-amber-400 font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span>معاينة مكبرة وتنزيل عالي الدقة 🔍</span>
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
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-800 shrink-0 space-y-2">
            <button
              onClick={handleCopyLink}
              className={`w-full py-3.5 border rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 ${
                copiedLink ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-black' : 'bg-gray-850 hover:bg-gray-800 border-gray-800 text-gray-200 font-bold'
              }`}
            >
              {copiedLink ? <Check className="w-4.5 h-4.5 text-emerald-400" /> : <Link2 className="w-4.5 h-4.5 text-amber-400" />}
              <span>{copiedLink ? 'تم نسخ رابط الإعلان مباشر!' : 'نسخ الرابط المباشر للإعلان'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-950 hover:bg-gray-850 border border-gray-800 text-gray-400 hover:text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <X className="w-4 h-4 text-gray-500" />
              <span>إغلاق الشاشة ✕</span>
            </button>
          </div>
        </motion.div>

        {/* High Resolution Preview & Save Lightbox Overlay for Native Mobile PWA / Add to Home */}
        <AnimatePresence>
          {showFullPreviewModal && cardDataUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[500] flex flex-col items-center justify-between p-3 sm:p-5 bg-black/97 backdrop-blur-2xl dir-rtl overflow-hidden"
            >
              {/* Top Bar with Safe Area Inset for PWA iOS Notch */}
              <div 
                className="w-full max-w-4xl mx-auto flex items-center justify-between pb-3 border-b border-gray-800 shrink-0 z-50"
                style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 0px))' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                  <h3 className="text-white font-black text-xs sm:text-sm truncate">معاينة وتنزيل بطاقة الإعلان بدقة عالية 🖼️</h3>
                </div>

                {/* Large Prominent Close Button for PWA Notch Safe Area */}
                <button
                  onClick={() => setShowFullPreviewModal(false)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-black rounded-2xl shadow-xl border border-amber-400 flex items-center gap-1.5 text-xs transition-all shrink-0"
                  aria-label="إغلاق المعاينة المكبرة"
                >
                  <X className="w-4 h-4 stroke-[3]" />
                  <span>رجوع / إغلاق</span>
                </button>
              </div>

              {/* Main Image View */}
              <div 
                className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center my-auto overflow-hidden p-2"
                onClick={() => setShowFullPreviewModal(false)}
              >
                <div 
                  className="relative max-w-full max-h-[66vh] rounded-3xl overflow-hidden shadow-2xl border border-gray-800 bg-gray-950 flex items-center justify-center cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={cardDataUrl}
                    alt="High Resolution Preview"
                    className="max-w-full max-h-[64vh] object-contain rounded-2xl"
                  />
                </div>
                <p className="text-[11px] text-amber-300 font-bold text-center mt-3 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
                  💡 للحفظ في الاستوديو على الأجهزة الذكية: إضغط مطولاً على الصورة أعلاه واختر (حفظ الصورة / Save Image) 📥
                </p>
              </div>

              <div 
                className="w-full max-w-md space-y-2.5 pt-3 border-t border-gray-800 shrink-0"
                style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
              >
                <button
                  onClick={() => {
                    downloadSingleCard();
                  }}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.99]"
                >
                  <Download className="w-5 h-5 shrink-0 text-black" />
                  <span>تنزيل/حفظ الصورة إلى استوديو الهاتف 📥</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAppClick('whatsapp')}
                    className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>مشاركة واتساب 💬</span>
                  </button>
                  <button
                    onClick={() => handleAppClick('telegram')}
                    className="py-3 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>مشاركة تليجرام ✈️</span>
                  </button>
                </div>

                {/* Dedicated Bottom Close Button for PWA */}
                <button
                  onClick={() => setShowFullPreviewModal(false)}
                  className="w-full py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700/80 text-gray-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <X className="w-4 h-4 text-gray-400" />
                  <span>إغلاق المعاينة المكبرة ✕</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
