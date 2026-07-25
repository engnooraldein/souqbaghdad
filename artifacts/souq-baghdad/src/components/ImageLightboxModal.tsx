import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { X, ChevronRight, ChevronLeft, Loader2, Download, Layers } from 'lucide-react';

export function ImageLightboxModal({
  src,
  title,
  images,
  initialIdx = 0,
  onClose
}: {
  src: string;
  title: string;
  images?: string[];
  initialIdx?: number;
  onClose: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(initialIdx);
  const [downloading, setDownloading] = useState(false);
  const [downloadAllProgress, setDownloadAllProgress] = useState<number | null>(null);
  const [longPressActive, setLongPressActive] = useState(false);
  const timerRef = useRef<any>(null);

  const galleryList = images && images.length > 0 ? images : [src];
  const activeSrc = galleryList[currentIdx] || src;
  const totalCount = galleryList.length;

  const loadSafeImage = async (imgSrc: string): Promise<HTMLImageElement | null> => {
    if (!imgSrc) return null;
    const img1 = new Image();
    if (!imgSrc.startsWith('data:')) img1.crossOrigin = 'anonymous';
    const loaded1 = await new Promise<boolean>((resolve) => {
      img1.onload = () => resolve(true);
      img1.onerror = () => resolve(false);
      img1.src = imgSrc;
    });
    if (loaded1) return img1;

    try {
      const res = await fetch(imgSrc);
      if (res.ok) {
        const blob = await res.blob();
        const dataUrl = await new Promise<string | null>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
        if (dataUrl) {
          const img2 = new Image();
          const loaded2 = await new Promise<boolean>((resolve) => {
            img2.onload = () => resolve(true);
            img2.onerror = () => resolve(false);
            img2.src = dataUrl;
          });
          if (loaded2) return img2;
        }
      }
    } catch {}
    return null;
  };

  const generateWatermarkedCanvas = async (imgUrl: string, itemTitle: string): Promise<HTMLCanvasElement | null> => {
    try {
      const img = await loadSafeImage(imgUrl);
      if (!img) return null;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const w = img.naturalWidth || 800;
      const h = img.naturalHeight || 800;
      const bannerH = Math.max(70, Math.round(h * 0.09));

      canvas.width = w;
      canvas.height = h + bannerH;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // 1. OVERLAY WATERMARK ON IMAGE
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#ffffff';
      const fontSize = Math.max(14, Math.round(w * 0.025));
      ctx.font = `bold ${fontSize}px system-ui, sans-serif`;

      ctx.translate(w / 2, h / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.translate(-w / 2, -h / 2);

      const watermarkText = 'SOUQ BAGHDAD   سوق بغداد   souqbaghdad.store';
      const textWidth = ctx.measureText(watermarkText).width;

      for (let y = -h; y < h * 2; y += fontSize * 5) {
        for (let x = -w; x < w * 2; x += textWidth + 100) {
          ctx.fillText(watermarkText, x, y);
        }
      }
      ctx.restore();

      // Center Watermark Badge
      ctx.save();
      ctx.globalAlpha = 0.16;
      const centerWatermarkSize = Math.min(w, h) * 0.22;
      const centerX = w / 2;
      const centerY = h / 2;

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = Math.max(2, Math.round(centerWatermarkSize * 0.04));
      ctx.beginPath();
      ctx.arc(centerX, centerY, centerWatermarkSize / 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = `bold ${Math.round(centerWatermarkSize * 0.16)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('سوق بغداد', centerX, centerY - centerWatermarkSize * 0.1);
      ctx.font = `bold ${Math.round(centerWatermarkSize * 0.09)}px system-ui, sans-serif`;
      ctx.fillText('SOUQ BAGHDAD', centerX, centerY + centerWatermarkSize * 0.14);
      ctx.restore();

      // 2. PREMIUM BOTTOM BANNER
      const gradient = ctx.createLinearGradient(0, h, w, h + bannerH);
      gradient.addColorStop(0, '#040d21');
      gradient.addColorStop(0.5, '#081736');
      gradient.addColorStop(1, '#020712');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, h, w, bannerH);

      // Gold Top Line Accent
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, h, w, Math.max(3, Math.round(bannerH * 0.04)));

      const logoSize = Math.round(bannerH * 0.7);
      const margin = Math.round(bannerH * 0.15);
      const logoX = w - logoSize - margin;
      const logoY = h + margin;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#061129';
      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = Math.max(2, Math.round(logoSize * 0.05));
      ctx.stroke();
      ctx.restore();

      // Brand Title Right
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const titleFontSize = Math.max(14, Math.round(bannerH * 0.32));
      ctx.font = `bold ${titleFontSize}px system-ui, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText('سوق بغداد', logoX - margin, h + bannerH * 0.35);

      const subFontSize = Math.max(10, Math.round(bannerH * 0.22));
      ctx.font = `${subFontSize}px system-ui, sans-serif`;
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('السوق الرقمي العراقي الأول', logoX - margin, h + bannerH * 0.68);

      // Item Details Left
      ctx.textAlign = 'left';
      ctx.fillStyle = '#f8fafc';
      ctx.font = `bold ${subFontSize}px system-ui, sans-serif`;
      ctx.fillText(itemTitle.slice(0, 35), margin * 2, h + bannerH * 0.4);

      ctx.fillStyle = '#94a3b8';
      ctx.font = `${Math.max(8, Math.round(bannerH * 0.16))}px system-ui, sans-serif`;
      ctx.fillText('souqbaghdad.store', margin * 2, h + bannerH * 0.7);

      return canvas;
    } catch (err) {
      console.error('Failed to generate watermarked image', err);
      return null;
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const canvas = await generateWatermarkedCanvas(activeSrc, title);
      if (!canvas) {
        alert('تعذر معالجة الصورة بالشعار، يرجى المحاولة مرة أخرى.');
        return;
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const safeTitle = (title || 'item').replace(/[^\w\d\u0600-\u06FF-]/g, '_').slice(0, 30);
      const fileName = `souq-baghdad-${safeTitle}-${currentIdx + 1}.jpg`;

      // 1. Mobile Native App / PWA Share
      if (Capacitor.isNativePlatform()) {
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ title, files: [file] });
            return;
          }
        } catch (e) {
          console.warn('Native share failed:', e);
        }
      }

      // 2. Direct Web & Mobile Download Trigger
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download image', err);
      alert('اضغط مطولاً على الصورة للحفظ في الاستوديو.');
    } finally {
      setDownloading(false);
      setLongPressActive(false);
    }
  };

  const handleDownloadAll = async () => {
    try {
      setDownloading(true);
      for (let i = 0; i < totalCount; i++) {
        setDownloadAllProgress(i + 1);
        const canvas = await generateWatermarkedCanvas(galleryList[i], `${title} - ${i + 1}`);
        if (canvas) {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          const safeTitle = (title || 'item').replace(/[^\w\d\u0600-\u06FF-]/g, '_').slice(0, 30);
          const link = document.createElement('a');
          link.download = `souq-baghdad-${safeTitle}-${i + 1}.jpg`;
          link.href = dataUrl;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        await new Promise((r) => setTimeout(r, 250));
      }
    } catch (err) {
      console.error('Failed to download all images', err);
    } finally {
      setDownloading(false);
      setDownloadAllProgress(null);
    }
  };

  // Infinite Loop Prev/Next Navigation
  const handleNext = () => {
    setCurrentIdx((i) => (i + 1) % totalCount);
  };

  const handlePrev = () => {
    setCurrentIdx((i) => (i - 1 + totalCount) % totalCount);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-3 sm:p-4 select-none dir-rtl"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto z-10 pt-3 md:pt-4 border-b border-gray-800/80 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
          <div className="min-w-0">
            <h4 className="text-white font-black text-xs sm:text-sm truncate max-w-[220px] sm:max-w-sm">
              {title}
            </h4>
            {totalCount > 1 && (
              <span className="text-amber-400 text-[11px] font-bold block">
                الصورة {currentIdx + 1} من {totalCount}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-full text-white transition-colors shadow-lg border border-gray-700 shrink-0"
          title="إغلاق"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image Gallery Container with iOS Photos Infinite Swipe & Physics */}
      <div className="flex-1 flex items-center justify-center max-w-4xl w-full mx-auto relative overflow-hidden my-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            drag={totalCount > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(e, { offset }) => {
              const swipe = offset.x;
              if (swipe < -40) {
                handleNext();
              } else if (swipe > 40) {
                handlePrev();
              }
            }}
            className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <img
              src={activeSrc}
              alt={title}
              className="max-w-full max-h-[70vh] sm:max-h-[75vh] object-contain rounded-2xl shadow-2xl pointer-events-none select-none"
            />
          </motion.div>
        </AnimatePresence>

        {/* Infinite Navigation Arrows */}
        {totalCount > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/75 hover:bg-black text-amber-400 rounded-full transition-all border border-gray-800 shadow-xl backdrop-blur-md active:scale-90 z-20"
              title="الصورة السابقة (تكرار مفتوح)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/75 hover:bg-black text-amber-400 rounded-full transition-all border border-gray-800 shadow-xl backdrop-blur-md active:scale-90 z-20"
              title="الصورة التالية (تكرار مفتوح)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* iOS Photos Style Thumbnail Bar */}
      {totalCount > 1 && (
        <div className="w-full max-w-xl mx-auto flex items-center justify-center gap-2 overflow-x-auto py-2 px-2 shrink-0 no-scrollbar scroll-smooth">
          {galleryList.map((imgUrl, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className={`relative w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden shrink-0 transition-all duration-200 border-2 ${
                idx === currentIdx
                  ? 'border-amber-400 scale-110 shadow-lg shadow-amber-500/30 ring-2 ring-amber-500/20'
                  : 'border-gray-800 opacity-40 hover:opacity-100'
              }`}
            >
              <img src={imgUrl} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-3 pt-2 pb-4 z-10 px-2 shrink-0">
        {downloadAllProgress !== null && (
          <div className="text-amber-400 text-xs font-black animate-pulse mb-1">
            جاري معالجة وتحميل كافة الصور: {downloadAllProgress} من {totalCount} ... ⏳
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full justify-center">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 py-3.5 px-5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 text-black font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 border border-amber-400/30 transition-all"
          >
            {downloading && downloadAllProgress === null ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <Download className="w-4 h-4 text-black" />
            )}
            <span>تحميل الصورة الحالية بالشعار 🖼️</span>
          </motion.button>

          {totalCount > 1 && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownloadAll}
              disabled={downloading}
              className="flex-1 py-3.5 px-5 bg-gray-800 hover:bg-gray-750 disabled:opacity-50 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg border border-gray-700 transition-all"
            >
              {downloading && downloadAllProgress !== null ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              ) : (
                <Layers className="w-4 h-4 text-amber-400" />
              )}
              <span>تحميل الكل ({totalCount}) دفعة واحدة 📦</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
