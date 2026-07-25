import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { X, ChevronRight, ChevronLeft, Loader2, Download, Layers, Share2 } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Fetch an image URL as a same-origin Blob URL so the canvas
   is NEVER tainted regardless of the CDN's CORS headers.
───────────────────────────────────────────────────────────── */
async function fetchAsBlobUrl(imgSrc: string): Promise<string | null> {
  try {
    const res = await fetch(imgSrc, { cache: 'force-cache' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────
   Build a canvas from a safe blob-URL image.
   Returns both the canvas AND a cleanup function for the blob URL.
───────────────────────────────────────────────────────────── */
async function buildWatermarkedCanvas(
  imgSrc: string,
  itemTitle: string
): Promise<{ canvas: HTMLCanvasElement; cleanup: () => void } | null> {
  const blobUrl = await fetchAsBlobUrl(imgSrc);
  const srcToLoad = blobUrl ?? imgSrc; // fallback to original if fetch fails

  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => resolve(null);
    el.src = srcToLoad;
  });

  const cleanup = () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };

  if (!img) { cleanup(); return null; }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) { cleanup(); return null; }

  const w = img.naturalWidth  || 800;
  const h = img.naturalHeight || 800;
  const bannerH = Math.max(70, Math.round(h * 0.09));

  canvas.width  = w;
  canvas.height = h + bannerH;

  // ── Original image ──
  ctx.drawImage(img, 0, 0);

  // ── Diagonal watermark ──
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#ffffff';
  const fontSize = Math.max(14, Math.round(w * 0.025));
  ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.translate(-w / 2, -h / 2);
  const wText = 'SOUQ BAGHDAD   سوق بغداد   souqbaghdad.store';
  const tw = ctx.measureText(wText).width;
  for (let y = -h; y < h * 2; y += fontSize * 5)
    for (let x = -w; x < w * 2; x += tw + 100)
      ctx.fillText(wText, x, y);
  ctx.restore();

  // ── Centre badge ──
  ctx.save();
  ctx.globalAlpha = 0.16;
  const bSize = Math.min(w, h) * 0.22;
  const cx = w / 2, cy = h / 2;
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = Math.max(2, Math.round(bSize * 0.04));
  ctx.beginPath(); ctx.arc(cx, cy, bSize / 2, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#f59e0b';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.round(bSize * 0.16)}px system-ui, sans-serif`;
  ctx.fillText('سوق بغداد', cx, cy - bSize * 0.1);
  ctx.font = `bold ${Math.round(bSize * 0.09)}px system-ui, sans-serif`;
  ctx.fillText('SOUQ BAGHDAD', cx, cy + bSize * 0.14);
  ctx.restore();

  // ── Bottom banner ──
  const grad = ctx.createLinearGradient(0, h, w, h + bannerH);
  grad.addColorStop(0, '#040d21'); grad.addColorStop(0.5, '#081736'); grad.addColorStop(1, '#020712');
  ctx.fillStyle = grad;
  ctx.fillRect(0, h, w, bannerH);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, h, w, Math.max(3, Math.round(bannerH * 0.04)));

  const logoSz = Math.round(bannerH * 0.7);
  const mg     = Math.round(bannerH * 0.15);
  const logoX  = w - logoSz - mg;
  const logoY  = h + mg;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10;
  ctx.fillStyle = '#061129';
  ctx.beginPath(); ctx.arc(logoX + logoSz / 2, logoY + logoSz / 2, logoSz / 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = Math.max(2, Math.round(logoSz * 0.05)); ctx.stroke();
  ctx.restore();

  const titleFs = Math.max(14, Math.round(bannerH * 0.32));
  const subFs   = Math.max(10, Math.round(bannerH * 0.22));
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.font = `bold ${titleFs}px system-ui, sans-serif`; ctx.fillStyle = '#ffffff';
  ctx.fillText('سوق بغداد', logoX - mg, h + bannerH * 0.35);
  ctx.font = `${subFs}px system-ui, sans-serif`; ctx.fillStyle = '#f59e0b';
  ctx.fillText('السوق الرقمي العراقي الأول', logoX - mg, h + bannerH * 0.68);

  ctx.textAlign = 'left';
  ctx.font = `bold ${subFs}px system-ui, sans-serif`; ctx.fillStyle = '#f8fafc';
  ctx.fillText(itemTitle.slice(0, 35), mg * 2, h + bannerH * 0.4);
  ctx.font = `${Math.max(8, Math.round(bannerH * 0.16))}px system-ui, sans-serif`; ctx.fillStyle = '#94a3b8';
  ctx.fillText('souqbaghdad.store', mg * 2, h + bannerH * 0.7);

  return { canvas, cleanup };
}

/* ─────────────────────────────────────────────────────────────
   Convert canvas → JPEG Blob (async, never throws)
───────────────────────────────────────────────────────────── */
function canvasToBlob(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
    } catch {
      resolve(null);
    }
  });
}

import { Share } from '@capacitor/share';

/* ─────────────────────────────────────────────────────────────
   Multi-platform save strategy:
   0. Capacitor.isNativePlatform() -> Share.share({ files: [base64] }) Native Android/iOS share sheet (includes Save to Gallery)
   1. navigator.share({ files })  → iOS Safari / Android Chrome / PWA (saves to Photos)
   2. URL.createObjectURL + <a>   → Desktop browsers
   3. window.open fallback        → last resort
───────────────────────────────────────────────────────────── */
async function saveImageBlob(blob: Blob, fileName: string, shareTitle: string): Promise<void> {
  // Path 0 — Native Capacitor Android / iOS App
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      await Share.share({
        title: shareTitle,
        text: shareTitle,
        dialogTitle: 'حفظ / مشاركة الصورة 🖼️',
        files: [base64Data],
      });
      return;
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      console.warn('Capacitor native share error', e);
    }
  }

  const file = new File([blob], fileName, { type: 'image/jpeg' });

  // Path 1 — Web Share API (works on iOS Safari & Android Chrome including PWA)
  if (
    typeof navigator !== 'undefined' &&
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ title: shareTitle, files: [file] });
      return;
    } catch (e: any) {
      // AbortError = user cancelled share sheet → still succeeded
      if (e?.name === 'AbortError') return;
      console.warn('share failed, trying download link', e);
    }
  }

  // Path 2 — <a download> with blob URL (desktop Chrome / Firefox / Edge)
  const blobUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href     = blobUrl;
    a.download = fileName;
    a.target   = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
  } catch {
    URL.revokeObjectURL(blobUrl);
    window.open(URL.createObjectURL(blob), '_blank');
  }
}

/* ═══════════════════════════════════════════════════════════
   Component
═══════════════════════════════════════════════════════════ */
export function ImageLightboxModal({
  src,
  title,
  images,
  initialIdx = 0,
  onClose,
}: {
  src: string;
  title: string;
  images?: string[];
  initialIdx?: number;
  onClose: () => void;
}) {
  const [currentIdx, setCurrentIdx]           = useState(initialIdx);
  const [downloading, setDownloading]         = useState(false);
  const [downloadAllProgress, setDlProgress]  = useState<number | null>(null);
  const [statusMsg, setStatusMsg]             = useState<string | null>(null);

  const galleryList = images && images.length > 0 ? images : [src];
  const activeSrc   = galleryList[currentIdx] || src;
  const totalCount  = galleryList.length;

  // Escape key close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  // Clear status after 3 s
  const statusTimer = useRef<ReturnType<typeof setTimeout>>();
  function showStatus(msg: string) {
    setStatusMsg(msg);
    clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatusMsg(null), 3000);
  }

  /* ── Download current image with watermark ── */
  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    showStatus('⏳ جاري معالجة الصورة...');
    try {
      const safeTitle = (title || 'item').replace(/[^\w\d\u0600-\u06FF-]/g, '_').slice(0, 30);
      const fileName  = `souq-baghdad-${safeTitle}-${currentIdx + 1}.jpg`;

      const result = await buildWatermarkedCanvas(activeSrc, title);
      if (result) {
        const { canvas, cleanup } = result;
        const blob = await canvasToBlob(canvas);
        cleanup();
        if (blob) {
          await saveImageBlob(blob, fileName, title);
          showStatus('✅ تم الحفظ بنجاح!');
          return;
        }
      }

      // Fallback: fetch original blob without watermark
      showStatus('⚠️ لم يمكن إضافة الشعار، جاري حفظ الصورة الأصلية...');
      const blobUrl = await fetchAsBlobUrl(activeSrc);
      if (blobUrl) {
        const res  = await fetch(blobUrl);
        const blob = await res.blob();
        URL.revokeObjectURL(blobUrl);
        await saveImageBlob(blob, fileName, title);
        showStatus('✅ تم الحفظ!');
      } else {
        window.open(activeSrc, '_blank');
        showStatus('💡 اضغط مطولاً على الصورة واختر حفظ.');
      }
    } catch (err) {
      console.error('Download error', err);
      showStatus('❌ فشل التحميل. افتح الصورة وانقر مطولاً للحفظ.');
      window.open(activeSrc, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  /* ── Download ALL images ── */
  const handleDownloadAll = async () => {
    if (downloading) return;
    setDownloading(true);
    const safeTitle = (title || 'item').replace(/[^\w\d\u0600-\u06FF-]/g, '_').slice(0, 30);
    try {
      for (let i = 0; i < totalCount; i++) {
        setDlProgress(i + 1);
        showStatus(`⏳ تحميل ${i + 1} من ${totalCount}...`);
        const fileName = `souq-baghdad-${safeTitle}-${i + 1}.jpg`;
        const result   = await buildWatermarkedCanvas(galleryList[i], `${title} - ${i + 1}`);
        if (result) {
          const { canvas, cleanup } = result;
          const blob = await canvasToBlob(canvas);
          cleanup();
          if (blob) { await saveImageBlob(blob, fileName, title); }
        }
        await new Promise((r) => setTimeout(r, 400));
      }
      showStatus('✅ تم تحميل جميع الصور!');
    } catch (err) {
      console.error('Download all error', err);
      showStatus('❌ حدث خطأ أثناء التحميل.');
    } finally {
      setDownloading(false);
      setDlProgress(null);
    }
  };

  const handleNext = () => setCurrentIdx((i) => (i + 1) % totalCount);
  const handlePrev = () => setCurrentIdx((i) => (i - 1 + totalCount) % totalCount);

  /* ── Render ── */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] bg-black/97 backdrop-blur-2xl flex flex-col select-none dir-rtl overflow-hidden"
    >
      {/* ── Top bar ── */}
      <div
        className="w-full max-w-4xl mx-auto z-50 flex items-center justify-between border-b border-gray-800/80 px-4 pb-3 shrink-0"
        style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
          <div className="min-w-0">
            <h4 className="text-white font-black text-xs sm:text-sm truncate max-w-[200px] sm:max-w-sm">{title}</h4>
            {totalCount > 1 && (
              <span className="text-amber-400 text-[11px] font-bold block">
                الصورة {currentIdx + 1} من {totalCount}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-black rounded-2xl shadow-xl border border-amber-400 flex items-center gap-1.5 text-xs transition-all shrink-0"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4 stroke-[3]" />
          <span>إغلاق</span>
        </button>
      </div>

      {/* ── Status message ── */}
      <AnimatePresence>
        {statusMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-center text-xs font-bold py-1.5 px-4 bg-gray-900/90 text-amber-300 border-b border-gray-800 shrink-0"
          >
            {statusMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Image viewer ── */}
      <div
        className="flex-1 flex items-center justify-center max-w-4xl w-full mx-auto relative overflow-hidden my-2 px-2"
        onClick={onClose}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            drag={totalCount > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.22}
            onDragEnd={(_, { offset }) => {
              if (offset.x < -45) handleNext();
              else if (offset.x > 45) handlePrev();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <img
              src={activeSrc}
              alt={title}
              className="max-w-full max-h-[62vh] sm:max-h-[70vh] object-contain rounded-2xl shadow-2xl pointer-events-none select-none"
            />
          </motion.div>
        </AnimatePresence>

        {totalCount > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-black/80 hover:bg-black text-amber-400 rounded-full border border-gray-800 shadow-2xl backdrop-blur-md active:scale-90 z-20 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-black/80 hover:bg-black text-amber-400 rounded-full border border-gray-800 shadow-2xl backdrop-blur-md active:scale-90 z-20 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* ── Thumbnail strip ── */}
      {totalCount > 1 && (
        <div className="w-full max-w-xl mx-auto flex items-center justify-center gap-2 overflow-x-auto py-1 px-2 shrink-0 no-scrollbar">
          {galleryList.map((imgUrl, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className={`relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-200 ${
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

      {/* ── Action bar ── */}
      <div
        className="w-full max-w-xl mx-auto flex flex-col items-center gap-2.5 pt-2 px-3 shrink-0"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Helper tip */}
        <p className="text-gray-500 text-[10px] text-center leading-tight">
          💡 iOS: اضغط زر التحميل ← ستظهر نافذة المشاركة ← اختر «حفظ الصورة» لحفظها في الاستوديو
        </p>

        <div className="flex flex-col sm:flex-row gap-2 w-full">
          {/* Download current */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 py-3.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 text-black font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg border border-amber-400/30 transition-all"
          >
            {downloading && downloadAllProgress === null ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            <span>حفظ الصورة الحالية 🖼️</span>
          </motion.button>

          {/* Download all */}
          {totalCount > 1 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleDownloadAll}
              disabled={downloading}
              className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg border border-gray-700 transition-all"
            >
              {downloading && downloadAllProgress !== null ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              ) : (
                <Layers className="w-4 h-4 text-amber-400" />
              )}
              <span>تحميل الكل ({totalCount}) 📦</span>
            </motion.button>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="py-3 px-4 bg-gray-900 hover:bg-gray-800 border border-gray-700/80 text-gray-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <X className="w-4 h-4 text-gray-400" />
            <span>إغلاق</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
