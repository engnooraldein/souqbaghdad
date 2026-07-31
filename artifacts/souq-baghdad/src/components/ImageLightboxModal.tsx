import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { X, ChevronRight, ChevronLeft, Loader2, Download, Layers, Share2 } from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

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
  const srcToLoad = blobUrl ?? imgSrc;

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

  // ── Bottom banner (الشريط السفلي المتقدم والفاخر) ──
  const grad = ctx.createLinearGradient(0, h, w, h + bannerH);
  grad.addColorStop(0, '#020617'); 
  grad.addColorStop(0.5, '#0f172a'); 
  grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad;
  ctx.fillRect(0, h, w, bannerH);

  // Golden top accent line
  const accentH = Math.max(3, Math.round(bannerH * 0.05));
  const accentGrad = ctx.createLinearGradient(0, h, w, h);
  accentGrad.addColorStop(0, '#f59e0b');
  accentGrad.addColorStop(0.5, '#fbbf24');
  accentGrad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, h, w, accentH);

  const logoSz = Math.round(bannerH * 0.65);
  const paddingX = Math.round(w * 0.03);
  const logoX = w - paddingX - logoSz;
  const logoY = h + (bannerH - logoSz) / 2;

  // 1. Draw Full Complete Logo Icon Circle & Crest Text (الشعار الذهبي المكتمل)
  ctx.save();
  ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
  ctx.shadowBlur = 8;
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = Math.max(2, Math.round(logoSz * 0.06));
  ctx.beginPath();
  ctx.arc(logoX + logoSz / 2, logoY + logoSz / 2, logoSz / 2 - 2, 0, Math.PI * 2);
  ctx.stroke();

  // Inner logo text inside circle
  ctx.fillStyle = '#fbbf24';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `black ${Math.round(logoSz * 0.28)}px Cairo, system-ui, sans-serif`;
  ctx.fillText('سوق', logoX + logoSz / 2, logoY + logoSz * 0.38);
  ctx.font = `bold ${Math.round(logoSz * 0.22)}px Cairo, system-ui, sans-serif`;
  ctx.fillText('بغداد', logoX + logoSz / 2, logoY + logoSz * 0.68);
  ctx.restore();

  // 2. Right Side Text (Domain & Tagline)
  const mainTextX = logoX - Math.round(w * 0.02);
  const domFontSize = Math.max(14, Math.round(bannerH * 0.26));

  ctx.save();
  ctx.fillStyle = '#f59e0b';
  ctx.font = `black ${domFontSize}px system-ui, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('souqbaghdad.store', mainTextX, h + bannerH * 0.48);

  ctx.font = `bold ${Math.round(domFontSize * 0.75)}px Cairo, system-ui, sans-serif`;
  ctx.fillStyle = '#e2e8f0';
  ctx.textBaseline = 'top';
  ctx.fillText('السوق الرقمي العراقي الأول 🇮🇶', mainTextX, h + bannerH * 0.54);
  ctx.restore();

  // 3. Left Side Item Title & Details (تفاصيل الإعلان كاملاً على اليسار)
  ctx.save();
  const leftTextX = paddingX;
  ctx.textAlign = 'left';
  
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(domFontSize * 0.82)}px Cairo, system-ui, sans-serif`;
  ctx.textBaseline = 'bottom';
  const cleanTitle = itemTitle.length > 35 ? itemTitle.slice(0, 35) + '...' : itemTitle;
  ctx.fillText(cleanTitle, leftTextX, h + bannerH * 0.48);

  ctx.fillStyle = '#94a3b8';
  ctx.font = `600 ${Math.round(domFontSize * 0.68)}px Cairo, system-ui, sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillText('محمية بحقوق النشر • تصفح وحجز مباشر', leftTextX, h + bannerH * 0.54);
  ctx.restore();

  return { canvas, cleanup };
}

async function canvasToBlob(canvas: HTMLCanvasElement, quality = 0.88): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
    } catch {
      resolve(null);
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   blobToBase64 — helper to convert Blob to base64 data string
───────────────────────────────────────────────────────────── */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.replace(/^data:image\/\w+;base64,/, ''));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/* ─────────────────────────────────────────────────────────────
   saveImageBlob — SAVE TO GALLERY (no share sheet on Android)
   Capacitor Android: writes to Documents/SouqBaghdad/
   Browser/PWA: <a download> or Web Share API
───────────────────────────────────────────────────────────── */
async function saveImageBlob(blob: Blob, fileName: string): Promise<'saved' | 'share_sheet' | 'fallback'> {
  const cleanFileName = fileName.endsWith('.jpg') ? fileName : `${fileName}.jpg`;

  // ── Capacitor Android / iOS ──
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = await blobToBase64(blob);
      // Write directly to Documents/SouqBaghdad — no share sheet, saves silently
      await Filesystem.writeFile({
        path: `SouqBaghdad/${cleanFileName}`,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });
      return 'saved';
    } catch (e: any) {
      console.warn('Direct Filesystem save failed, falling back to share sheet:', e);
      // Fallback: write to cache and open share sheet
      try {
        const base64Data = await blobToBase64(blob);
        const savedFile = await Filesystem.writeFile({
          path: cleanFileName,
          data: base64Data,
          directory: Directory.Cache,
        });
        await Share.share({
          title: 'سوق بغداد',
          dialogTitle: 'احفظ الصورة في الاستوديو 🖼️',
          files: [savedFile.uri],
        });
        return 'share_sheet';
      } catch (e2: any) {
        if (e2?.name === 'AbortError') return 'share_sheet';
        console.warn('Share fallback also failed:', e2);
        return 'fallback';
      }
    }
  }

  // ── Web: Web Share API (PWA / Android Chrome) ──
  const file = new File([blob], cleanFileName, { type: 'image/jpeg' });
  if (
    typeof navigator !== 'undefined' &&
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ title: 'سوق بغداد', files: [file] });
      return 'saved';
    } catch (e: any) {
      if (e?.name === 'AbortError') return 'saved';
    }
  }

  // ── Web: <a download> (desktop browsers) ──
  const blobUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href     = blobUrl;
    a.download = cleanFileName;
    a.target   = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
    return 'saved';
  } catch {
    URL.revokeObjectURL(blobUrl);
    window.open(URL.createObjectURL(blob), '_blank');
    return 'fallback';
  }
}

/* ─────────────────────────────────────────────────────────────
   shareImageBlob — OPEN SHARE SHEET (sends to WhatsApp, Telegram, etc.)
───────────────────────────────────────────────────────────── */
async function shareImageBlob(blob: Blob, fileName: string, shareTitle: string): Promise<void> {
  const cleanFileName = fileName.endsWith('.jpg') ? fileName : `${fileName}.jpg`;

  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = await blobToBase64(blob);
      const savedFile = await Filesystem.writeFile({
        path: cleanFileName,
        data: base64Data,
        directory: Directory.Cache,
      });
      await Share.share({
        title: shareTitle,
        text: `${shareTitle} | سوق بغداد`,
        dialogTitle: 'مشاركة الصورة 📤',
        files: [savedFile.uri],
      });
    } catch (e: any) {
      if (e?.name !== 'AbortError') console.warn('Native share error:', e);
    }
    return;
  }

  // Web fallback
  const file = new File([blob], cleanFileName, { type: 'image/jpeg' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ title: shareTitle, files: [file] }); } catch {}
    return;
  }
  // Last resort: download
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl; a.download = cleanFileName;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
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
  const [currentIdx, setCurrentIdx]          = useState(initialIdx);
  const [downloading, setDownloading]        = useState(false);
  const [downloadAllProgress, setDlProgress] = useState<number | null>(null);
  const [statusMsg, setStatusMsg]            = useState<string | null>(null);

  const galleryList = images && images.length > 0 ? images : [src];
  const activeSrc   = galleryList[currentIdx] || src;
  const totalCount  = galleryList.length;

  // Escape key close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  // Clear status after 4s
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showStatus(msg: string) {
    setStatusMsg(msg);
    clearTimeout(statusTimer.current ?? undefined);
    statusTimer.current = setTimeout(() => setStatusMsg(null), 4000);
  }

  /* ── Build blob helper ── */
  async function buildBlob(imgSrc: string, imgTitle: string, label: string): Promise<{ blob: Blob; fileName: string } | null> {
    const safeTitle = (label || 'item').replace(/[^\w\d\u0600-\u06FF-]/g, '_').slice(0, 30);
    const fileName  = `souq-baghdad-${safeTitle}.jpg`;
    const result = await buildWatermarkedCanvas(imgSrc, imgTitle);
    if (result) {
      const { canvas, cleanup } = result;
      const blob = await canvasToBlob(canvas);
      cleanup();
      if (blob) return { blob, fileName };
    }
    // Fallback: original image without watermark
    const blobUrl = await fetchAsBlobUrl(imgSrc);
    if (blobUrl) {
      const res  = await fetch(blobUrl);
      const blob = await res.blob();
      URL.revokeObjectURL(blobUrl);
      return { blob, fileName };
    }
    return null;
  }

  /* ── Save current image to device (no share sheet on Android) ── */
  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    showStatus('⏳ جاري معالجة الصورة...');
    try {
      const safeTitle = (title || 'item').replace(/[^\w\d\u0600-\u06FF-]/g, '_').slice(0, 30);
      const fileName  = `souq-baghdad-${safeTitle}-${currentIdx + 1}.jpg`;
      const blobData  = await buildBlob(activeSrc, title, `${safeTitle}-${currentIdx + 1}`);

      if (blobData) {
        const outcome = await saveImageBlob(blobData.blob, fileName);
        if (outcome === 'saved') {
          showStatus(
            Capacitor.isNativePlatform()
              ? '✅ تم الحفظ! ابحث في تطبيق الملفات ← Documents ← SouqBaghdad'
              : '✅ تم الحفظ بنجاح!'
          );
        } else if (outcome === 'share_sheet') {
          showStatus('اختر «حفظ الصورة» من القائمة التي ظهرت');
        } else {
          showStatus('✅ تم فتح الصورة — اضغط مطولاً لحفظها');
        }
      } else {
        window.open(activeSrc, '_blank');
        showStatus('💡 اضغط مطولاً على الصورة واختر حفظ.');
      }
    } catch (err) {
      console.error('Save error:', err);
      showStatus('❌ فشل الحفظ. حاول مطولاً على الصورة.');
    } finally {
      setDownloading(false);
    }
  };

  /* ── Share current image via Android share sheet ── */
  const handleShare = async () => {
    if (downloading) return;
    setDownloading(true);
    showStatus('⏳ جاري تجهيز الصورة للمشاركة...');
    try {
      const safeTitle = (title || 'item').replace(/[^\w\d\u0600-\u06FF-]/g, '_').slice(0, 30);
      const fileName  = `souq-baghdad-${safeTitle}-${currentIdx + 1}.jpg`;
      const blobData  = await buildBlob(activeSrc, title, `${safeTitle}-${currentIdx + 1}`);

      if (blobData) {
        await shareImageBlob(blobData.blob, fileName, title);
        showStatus('✅ تمت المشاركة!');
      } else {
        showStatus('❌ لم يمكن تجهيز الصورة للمشاركة.');
      }
    } catch (err) {
      console.error('Share error:', err);
      showStatus('❌ فشلت المشاركة.');
    } finally {
      setDownloading(false);
    }
  };

  /* ── Save ALL images to device ── */
  const handleDownloadAll = async () => {
    if (downloading) return;
    setDownloading(true);
    const safeTitle = (title || 'item').replace(/[^\w\d\u0600-\u06FF-]/g, '_').slice(0, 30);
    try {
      for (let i = 0; i < totalCount; i++) {
        setDlProgress(i + 1);
        showStatus(`⏳ حفظ ${i + 1} من ${totalCount}...`);
        const fileName = `souq-baghdad-${safeTitle}-${i + 1}.jpg`;
        const blobData = await buildBlob(galleryList[i], `${title} - ${i + 1}`, `${safeTitle}-${i + 1}`);
        if (blobData) {
          await saveImageBlob(blobData.blob, fileName);
        }
        await new Promise((r) => setTimeout(r, 600));
      }
      showStatus(
        Capacitor.isNativePlatform()
          ? `✅ تم حفظ ${totalCount} صورة في Documents/SouqBaghdad`
          : `✅ تم تحميل ${totalCount} صور!`
      );
    } catch (err) {
      console.error('Download all error:', err);
      showStatus('❌ حدث خطأ أثناء الحفظ.');
    } finally {
      setDownloading(false);
      setDlProgress(null);
    }
  };

  const handleNext = () => setCurrentIdx((i) => (i + 1) % totalCount);
  const handlePrev = () => setCurrentIdx((i) => (i - 1 + totalCount) % totalCount);

  const isNative = Capacitor.isNativePlatform();

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
            className="text-center text-xs font-bold py-2 px-4 bg-gray-900/95 text-amber-300 border-b border-gray-800 shrink-0"
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
        className="w-full max-w-xl mx-auto flex flex-col items-center gap-2 pt-2 px-3 shrink-0"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Helper tip */}
        <p className="text-gray-500 text-[10px] text-center leading-tight">
          {isNative
            ? '💾 الحفظ: يحفظ في الملفات ← Documents/SouqBaghdad   |   📤 المشاركة: يرسل للتطبيقات'
            : '💡 اضغط حفظ الصورة لتنزيلها أو مشاركة لإرسالها'}
        </p>

        {/* Row 1: Save + Share */}
        <div className="flex gap-2 w-full">
          {/* SAVE button — writes to Files directly, no share sheet */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 py-3.5 px-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 text-black font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg border border-amber-400/30 transition-all"
            title="حفظ الصورة في ملفات الجهاز"
          >
            {downloading && downloadAllProgress === null ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>حفظ 💾</span>
          </motion.button>

          {/* SHARE button — opens Android/iOS share sheet */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleShare}
            disabled={downloading}
            className="flex-1 py-3.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg border border-blue-500/30 transition-all"
            title="مشاركة الصورة عبر التطبيقات"
          >
            {downloading && downloadAllProgress === null ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            <span>مشاركة 📤</span>
          </motion.button>
        </div>

        {/* Row 2: Save All (if multiple images) + Close */}
        <div className="flex gap-2 w-full">
          {totalCount > 1 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleDownloadAll}
              disabled={downloading}
              className="flex-1 py-3 px-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg border border-gray-700 transition-all"
            >
              {downloading && downloadAllProgress !== null ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              ) : (
                <Layers className="w-4 h-4 text-amber-400" />
              )}
              <span>
                {downloadAllProgress !== null
                  ? `حفظ ${downloadAllProgress}/${totalCount}...`
                  : `حفظ الكل (${totalCount}) 📦`}
              </span>
            </motion.button>
          )}

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
