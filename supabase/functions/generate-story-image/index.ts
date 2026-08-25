import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import satori from 'npm:satori@0.10.11'
import { Resvg, initWasm } from 'npm:@resvg/resvg-wasm@2.6.2'
import { html } from "npm:satori-html@0.3.2"
import ArabicShaper from 'npm:arabic-persian-reshaper@1.0.1'

let wasmInitialized = false;

// Aggressive text cleanup - WHITELIST approach
function cleanText(val: string | null, fallback: string): string {
  if (!val) return fallback;
  let s = val
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&lt;.*?&gt;/gm, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/data:image\/[a-zA-Z+]+;base64,[a-zA-Z0-9+/=]+/g, '')
    .replace(/img\s+src=[^\s>]+/gi, '')
    .replace(/[^\u0600-\u06FF\u0750-\u077Fa-zA-Z0-9\s.,;:!?\-\/()@#_=+%'"]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return s.length > 0 ? s : fallback;
}

// Convert and connect Arabic glyphs, with proper character and number ordering
function fixAr(text: string): string {
  if (!text) return '';
  const clean = cleanText(text, '');
  if (!clean) return '';
  try {
    const fn = (ArabicShaper as any)?.convertArabic || (ArabicShaper as any)?.ArabicShaper?.convertArabic || (ArabicShaper as any)?.default?.convertArabic || (typeof ArabicShaper === 'function' ? ArabicShaper : null);
    if (typeof fn === 'function') {
      const shaped = fn(clean);
      if (shaped && typeof shaped === 'string') {
        return shaped.split('').reverse().join('').replace(/[0-9]+([.:,/-][0-9]+)*/g, (num: string) => {
          return num.split('').reverse().join('');
        });
      }
    }
    return clean;
  } catch (err) {
    console.error('ArabicShaper error:', err);
    return clean;
  }
}

// Helper to convert SVG markup to safe data-uri image source
function svgImg(svgStr: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
}

const SVGS = {
  logo: `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 40 40"><rect width="40" height="40" rx="12" fill="#7c3aed"/><path d="M20 9C14 9 11 12 11 15C11 18.5 15 19.5 20 20.5C25 21.5 29 22.5 29 26C29 29.5 25 32 20 32C14 32 11 29 11 29" stroke="white" stroke-width="4" stroke-linecap="round"/><circle cx="27" cy="12" r="3" fill="#c084fc"/></svg>`,
  
  pin: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  
  exchange: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>`,
  
  wallet: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>`,
  
  code: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-8"/><path d="M16 12h-8"/><path d="M12 16h-4"/></svg>`,
  
  clock: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  
  bus: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.2 6 18.2 6H5.8C4.8 6 3.9 6.8 3.6 7.8l-1.4 5c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>`,
  
  users: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  
  phone: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  
  link: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  
  shield: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  
  timeCommit: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><path d="m9 12 2 2 4-4"/></svg>`,
  
  tag: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><circle cx="7" cy="7" r=".5" fill="#c084fc"/></svg>`,
  
  star: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
};

let cachedNotoData: ArrayBuffer | null = null;
let cachedAlmaraiData: ArrayBuffer | null = null;

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("type") || "post"; // "post" (1080x1350) or "story" (1080x1920)
    const category = (url.searchParams.get("category") || "transport").toLowerCase();
    const adType = (url.searchParams.get("ad_type") || "offer").toLowerCase();
    const imageUrl = url.searchParams.get("image_url") || "";

    // 1. Initialize WASM for Resvg
    if (!wasmInitialized) {
      const wasmRes = await fetch('https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm');
      const wasmBuffer = await wasmRes.arrayBuffer();
      await initWasm(wasmBuffer);
      wasmInitialized = true;
    }

    // 2. Fetch & Cache Complete Arabic (Noto) + Latin (Almarai) Fonts
    if (!cachedNotoData || !cachedAlmaraiData) {
      const [notoRes, almaraiRes] = await Promise.all([
        fetch('https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansArabic/NotoSansArabic-Bold.ttf'),
        fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/almarai/Almarai-Bold.ttf')
      ]);
      const [nData, aData] = await Promise.all([
        notoRes.arrayBuffer(),
        almaraiRes.arrayBuffer()
      ]);
      cachedNotoData = nData;
      cachedAlmaraiData = aData;
    }
    const notoData = cachedNotoData;
    const almaraiData = cachedAlmaraiData;

    const isPost = mode === "post";
    const canvasWidth = 1080;
    const canvasHeight = isPost ? 1350 : 1920;

    // 3. Clean Input Parameters
    const rawTitle = cleanText(url.searchParams.get("title"), category === 'car' ? 'سيارة للبيع' : 'إعلان جديد');
    const shortId = cleanText(url.searchParams.get("short_id"), "GVR37#");
    const formattedId = shortId.endsWith('#') ? shortId : `${shortId}#`;
    
    const audience = cleanText(url.searchParams.get("audience"), "طالبات نقل");
    const rawDays = cleanText(url.searchParams.get("days"), "الأحد إلى الخميس");
    let workDays = rawDays.replace(/-/g, ' إلى ').replace(/\s{2,}/g, ' ').trim();
    if (!workDays.includes('إلى')) workDays = "الأحد إلى الخميس";

    const shiftTime = cleanText(url.searchParams.get("time"), "من 08:00 ص إلى 02:00 م");
    const regions = cleanText(url.searchParams.get("regions"), "بغداد");
    const destination = cleanText(url.searchParams.get("destination"), "بغداد");
    
    let rawFare = cleanText(url.searchParams.get("fare"), category === 'transport' ? '45,000 د.ع' : 'السعر حسب الاتفاق');
    // Format any raw number inside fare string with standard comma separation (e.g. 45000 -> 45,000, 45656 -> 45,656)
    rawFare = rawFare.replace(/\b\d{4,}\b/g, (match) => {
      return Number(match).toLocaleString('en-US');
    });
    if (!rawFare.includes('د.ع') && !rawFare.includes('$') && !rawFare.includes('دولار') && !rawFare.includes('الاتفاق')) {
      rawFare = `${rawFare} د.ع`;
    }

    let phone = cleanText(url.searchParams.get("phone"), "0780 000 0000");
    if (phone === "0780 000 0000" || phone.length < 5) {
      phone = "0780 000 0000";
    }

    const cleanShortId = shortId.replace(/[^a-zA-Z0-9]/g, '');
    const shortUrlDisplay = `souqbaghdad.store/ad/${cleanShortId || 'view'}`;
    const directAdUrl = category === 'transport' 
      ? `https://www.souqbaghdad.store/transport/card/${cleanShortId}`
      : `https://www.souqbaghdad.store/ad/${cleanShortId}`;

    // Generate QR Code data URL using public API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&format=png&data=${encodeURIComponent(directAdUrl)}`;

    // Badges & Titles
    const badgeLabel = adType === "request" ? "مطلوب" : (category === 'car' ? "🚗 سيارات" : (category === 'general' ? "📦 سوق عام" : "جديد"));
    const mainTitle1 = category === 'car' ? "إعلان" : (adType === "request" ? "طلب نقل" : "نقل خط");
    const mainTitle2 = category === 'car' ? "سيارة" : (adType === "request" ? "مباشر" : "توفير");
    const subHeadline = category === 'car' ? "فحص ومعاينة وضمان البيع المباشر" : (adType === "request" ? "بحث عن خط نقل مريح وآمن" : "رحلتك مريحة.. بسعر أوفر");
    const fareTitle = category === 'car' ? "السعر المطلوب" : (adType === "request" ? "الأجرة المقترحة" : "سعر الأجرة");

    // 4. Build Exact Editorial Template HTML (Clean LTR Flow with Pre-shaped Arabic)
    let innerContent = '';
    if ((category === 'car' || category === 'general') && imageUrl) {
      innerContent = `
        <!-- 2. Car / Product Hero Visual Photo Card (9:16 Optimized) -->
        <div style="display: flex; flex-direction: column; width: 100%; height: ${isPost ? '600px' : '900px'}; background: #ffffff; border: 2px solid #e9d5ff; border-radius: 32px; overflow: hidden; box-shadow: 0 15px 40px rgba(76,29,149,0.12); position: relative; z-index: 10;">
          <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(0deg, rgba(20,5,40,0.92) 0%, rgba(20,5,40,0.6) 60%, rgba(20,5,40,0) 100%); padding: 24px 30px; display: flex; flex-direction: column; align-items: flex-start;">
            <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%;">
              <span style="font-size: 38px; font-weight: bold; color: #ffffff; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">${fixAr(rawTitle)}</span>
              <div style="display: flex; background: #7c3aed; border-radius: 16px; padding: 8px 20px;">
                <span style="font-size: 24px; color: #ffffff; font-weight: bold;">${fixAr(regions)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Price & Ad Code Row (Two Cards) -->
        <div style="display: flex; flex-direction: row; justify-content: space-between; width: 100%; gap: 20px; position: relative; z-index: 10;">
          <!-- Price Card (Dark Purple) -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; flex: 1.1; background: #230b3d; border-radius: 24px; padding: 20px 28px; box-shadow: 0 10px 25px rgba(35,11,61,0.25);">
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <span style="font-size: 20px; color: #d8b4fe; font-weight: bold; margin-bottom: 4px;">${fixAr(fareTitle)}</span>
              <span style="font-size: 38px; color: #ffffff; font-weight: bold;">${fixAr(rawFare)}</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #3b0764; border: 1.5px solid #7c3aed; border-radius: 28px;">
              <img src="${svgImg(SVGS.wallet)}" width="30" height="30" />
            </div>
          </div>

          <!-- Ad Code Card (White) -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; flex: 0.9; background: #ffffff; border: 1.5px solid #e9d5ff; border-radius: 24px; padding: 20px 28px; box-shadow: 0 8px 20px rgba(76,29,149,0.04);">
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <span style="font-size: 20px; color: #6b7280; font-weight: bold; margin-bottom: 4px;">${fixAr('كود الإعلان')}</span>
              <span style="font-size: 32px; color: #2e0854; font-weight: bold; letter-spacing: 1px;">${formattedId}</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #faf5ff; border: 1.5px solid #e9d5ff; border-radius: 28px;">
              <img src="${svgImg(SVGS.code)}" width="30" height="30" />
            </div>
          </div>
        </div>
      `;
    } else {
      innerContent = `
        <!-- 2. Route Card (Floating White Card) -->
        <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; background: #ffffff; border: 1.5px solid #e9d5ff; border-radius: 28px; padding: 22px 32px; box-shadow: 0 10px 30px rgba(76,29,149,0.06); position: relative; z-index: 10;">
          
          <!-- الانطلاق من (Right in layout) -->
          <div style="display: flex; flex-direction: column; align-items: flex-start; flex: 1;">
            <div style="display: flex; background: #2e0854; border-radius: 14px; padding: 6px 18px; margin-bottom: 8px;">
              <span style="font-size: 20px; color: #ffffff; font-weight: bold;">${fixAr('الانطلاق من')}</span>
            </div>
            <div style="display: flex; flex-direction: row; align-items: center; gap: 8px;">
              <span style="font-size: 32px; font-weight: bold; color: #1e1b4b;">${fixAr(regions.split('،')[0] || regions.split(',')[0] || regions)}</span>
              <img src="${svgImg(SVGS.pin)}" width="24" height="24" />
            </div>
            <span style="font-size: 20px; color: #6b7280; font-weight: bold; margin-top: 2px;">${fixAr('نقطة الانطلاق')}</span>
          </div>

          <!-- Middle Exchange Arrow -->
          <div style="display: flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: #f5f3ff; border: 1.5px solid #ddd6fe; border-radius: 32px;">
            <img src="${svgImg(SVGS.exchange)}" width="32" height="32" />
          </div>

          <!-- الوجهة إلى (Left in layout) -->
          <div style="display: flex; flex-direction: column; align-items: flex-end; flex: 1;">
            <div style="display: flex; background: #2e0854; border-radius: 14px; padding: 6px 18px; margin-bottom: 8px;">
              <span style="font-size: 20px; color: #ffffff; font-weight: bold;">${fixAr('الوجهة إلى')}</span>
            </div>
            <div style="display: flex; flex-direction: row; align-items: center; gap: 8px;">
              <img src="${svgImg(SVGS.pin)}" width="24" height="24" />
              <span style="font-size: 32px; font-weight: bold; color: #1e1b4b;">${fixAr(destination)}</span>
            </div>
            <span style="font-size: 20px; color: #6b7280; font-weight: bold; margin-top: 2px;">${fixAr(destination)}</span>
          </div>
        </div>

        <!-- 3. Price & Ad Code Row (Two Cards) -->
        <div style="display: flex; flex-direction: row; justify-content: space-between; width: 100%; gap: 20px; position: relative; z-index: 10;">
          
          <!-- Price Card (Dark Purple) -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; flex: 1.1; background: #230b3d; border-radius: 24px; padding: 20px 28px; box-shadow: 0 10px 25px rgba(35,11,61,0.25);">
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <span style="font-size: 20px; color: #d8b4fe; font-weight: bold; margin-bottom: 4px;">${fixAr(fareTitle)}</span>
              <span style="font-size: 38px; color: #ffffff; font-weight: bold;">${fixAr(rawFare)}</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #3b0764; border: 1.5px solid #7c3aed; border-radius: 28px;">
              <img src="${svgImg(SVGS.wallet)}" width="30" height="30" />
            </div>
          </div>

          <!-- Ad Code Card (White) -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; flex: 0.9; background: #ffffff; border: 1.5px solid #e9d5ff; border-radius: 24px; padding: 20px 28px; box-shadow: 0 8px 20px rgba(76,29,149,0.04);">
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <span style="font-size: 20px; color: #6b7280; font-weight: bold; margin-bottom: 4px;">${fixAr('كود الإعلان')}</span>
              <span style="font-size: 32px; color: #2e0854; font-weight: bold; letter-spacing: 1px;">${formattedId}</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #faf5ff; border: 1.5px solid #e9d5ff; border-radius: 28px;">
              <img src="${svgImg(SVGS.code)}" width="30" height="30" />
            </div>
          </div>
        </div>

        <!-- 4. Schedule & Details Pill Row (3 Columns Card) -->
        <div style="display: flex; flex-direction: row; justify-content: space-between; width: 100%; background: #ffffff; border: 1.5px solid #e9d5ff; border-radius: 24px; padding: 18px 24px; box-shadow: 0 8px 20px rgba(76,29,149,0.04); position: relative; z-index: 10;">
          
          <!-- Column 1: نوع الخط -->
          <div style="display: flex; flex-direction: row; align-items: center; gap: 12px; flex: 0.95;">
            <div style="display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #faf5ff; border: 1.5px solid #e9d5ff; border-radius: 24px;">
              <img src="${svgImg(SVGS.bus)}" width="24" height="24" />
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <span style="font-size: 17px; color: #6b7280; font-weight: bold;">${fixAr('نوع الخط')}</span>
              <span style="font-size: 20px; color: #1e1b4b; font-weight: bold;">${fixAr(audience)}</span>
            </div>
          </div>

          <!-- Column 2: أيام الدوام -->
          <div style="display: flex; flex-direction: row; align-items: center; gap: 12px; flex: 1.15; border-right: 1.5px solid #f3e8ff; border-left: 1.5px solid #f3e8ff; padding: 0 16px;">
            <div style="display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #faf5ff; border: 1.5px solid #e9d5ff; border-radius: 24px;">
              <img src="${svgImg(SVGS.calendar)}" width="24" height="24" />
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <span style="font-size: 17px; color: #6b7280; font-weight: bold;">${fixAr('أيام الدوام')}</span>
              <span style="font-size: 20px; color: #1e1b4b; font-weight: bold;">${fixAr(workDays)}</span>
            </div>
          </div>

          <!-- Column 3: أوقات الدوام -->
          <div style="display: flex; flex-direction: row; align-items: center; gap: 12px; flex: 1.4;">
            <div style="display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #faf5ff; border: 1.5px solid #e9d5ff; border-radius: 24px;">
              <img src="${svgImg(SVGS.clock)}" width="24" height="24" />
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <span style="font-size: 17px; color: #6b7280; font-weight: bold;">${fixAr('أوقات الدوام')}</span>
              <span style="font-size: 18px; color: #1e1b4b; font-weight: bold; white-space: nowrap;">${fixAr(shiftTime)}</span>
            </div>
          </div>
        </div>

        <!-- 5. Secondary Details (2 Columns) -->
        <div style="display: flex; flex-direction: row; justify-content: space-between; width: 100%; gap: 20px; position: relative; z-index: 10;">
          
          <!-- Right Box: المرور والمناطق -->
          <div style="display: flex; flex-direction: row; align-items: flex-start; gap: 16px; flex: 1.3; background: #ffffff; border: 1.5px solid #e9d5ff; border-radius: 24px; padding: 18px 24px; box-shadow: 0 8px 20px rgba(76,29,149,0.04);">
            <div style="display: flex; align-items: center; justify-content: center; width: 50px; height: 50px; background: #faf5ff; border: 1.5px solid #e9d5ff; border-radius: 25px;">
              <img src="${svgImg(SVGS.pin)}" width="24" height="24" />
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-start; flex: 1;">
              <span style="font-size: 18px; color: #6b7280; font-weight: bold; margin-bottom: 4px;">${fixAr('المرور والمناطق')}</span>
              <span style="font-size: 21px; color: #1e1b4b; font-weight: bold; line-height: 1.4;">${fixAr(regions)}</span>
            </div>
          </div>

          <!-- Left Box: الفئة المستهدفة -->
          <div style="display: flex; flex-direction: row; align-items: flex-start; gap: 16px; flex: 1; background: #ffffff; border: 1.5px solid #e9d5ff; border-radius: 24px; padding: 18px 24px; box-shadow: 0 8px 20px rgba(76,29,149,0.04);">
            <div style="display: flex; align-items: center; justify-content: center; width: 50px; height: 50px; background: #faf5ff; border: 1.5px solid #e9d5ff; border-radius: 25px;">
              <img src="${svgImg(SVGS.users)}" width="26" height="26" />
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <span style="font-size: 18px; color: #6b7280; font-weight: bold; margin-bottom: 4px;">${fixAr('الفئة المستهدفة')}</span>
              <span style="font-size: 21px; color: #1e1b4b; font-weight: bold;">${fixAr(audience)}</span>
            </div>
          </div>
        </div>

        <!-- 6. Contact & QR Code Card -->
        <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; background: #ffffff; border: 1.5px solid #e9d5ff; border-radius: 24px; padding: 18px 28px; box-shadow: 0 8px 20px rgba(76,29,149,0.04); position: relative; z-index: 10;">
          
          <!-- Contact Phone -->
          <div style="display: flex; flex-direction: row; align-items: center; gap: 14px;">
            <div style="display: flex; align-items: center; justify-content: center; width: 52px; height: 52px; background: #7c3aed; border-radius: 26px; box-shadow: 0 4px 12px rgba(124,58,237,0.3);">
              <img src="${svgImg(SVGS.phone)}" width="24" height="24" />
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <span style="font-size: 18px; color: #6b7280; font-weight: bold;">${fixAr('للتفاصيل والتواصل')}</span>
              <span style="font-size: 26px; color: #1e1b4b; font-weight: bold; letter-spacing: 0.5px;">${phone}</span>
            </div>
          </div>

          <!-- QR Code (Center) -->
          <div style="display: flex; align-items: center; justify-content: center; width: 84px; height: 84px; background: #ffffff; border: 1.5px solid #ddd6fe; border-radius: 14px; padding: 4px;">
            <img src="${qrUrl}" width="76" height="76" style="border-radius: 8px;" />
          </div>

          <!-- Direct Link Pill -->
          <div style="display: flex; flex-direction: row; align-items: center; gap: 14px;">
            <div style="display: flex; flex-direction: column; align-items: flex-end;">
              <span style="font-size: 18px; color: #6b7280; font-weight: bold; margin-bottom: 4px;">${fixAr('اضغط على الرابط')}</span>
              <div style="display: flex; background: #7c3aed; border-radius: 12px; padding: 6px 18px;">
                <span style="font-size: 17px; color: #ffffff; font-weight: bold;">${shortUrlDisplay}</span>
              </div>
            </div>
            <div style="display: flex; align-items: center; justify-content: center; width: 52px; height: 52px; background: #7c3aed; border-radius: 26px; box-shadow: 0 4px 12px rgba(124,58,237,0.3);">
              <img src="${svgImg(SVGS.link)}" width="24" height="24" />
            </div>
          </div>
        </div>
      `;
    }

    let storyCtaBox = '';
    if (mode === 'story') {
      storyCtaBox = `
        <!-- 6b. SPECIAL INTERACTIVE STORY CTA BOX (Only for Story 9:16) -->
        <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; background: linear-gradient(135deg, #2e0854 0%, #4c1d95 100%); border-radius: 28px; padding: 24px 32px; box-shadow: 0 12px 30px rgba(46,8,84,0.35); position: relative; z-index: 10; border: 2px solid #a855f7;">
          
          <!-- Left: Big High-Contrast QR Code -->
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; background: #ffffff; padding: 10px; border-radius: 20px; box-shadow: 0 6px 20px rgba(0,0,0,0.2);">
            <img src="${qrUrl}" width="130" height="130" style="border-radius: 12px;" />
            <span style="font-size: 15px; color: #4c1d95; font-weight: bold;">${fixAr('امسح لفتح الإعلان')}</span>
          </div>

          <!-- Right: Smart DM & Bio Action Prompt -->
          <div style="display: flex; flex-direction: column; align-items: flex-end; flex: 1; padding-left: 24px; gap: 10px;">
            <div style="display: flex; background: #a855f7; border-radius: 14px; padding: 6px 20px;">
              <span style="font-size: 20px; color: #ffffff; font-weight: bold;">${fixAr(category === 'car' ? '🚗 لمعاينة وتفاصيل السيارة' : '📲 للتفاصيل والتواصل فوراً')}</span>
            </div>
            <span style="font-size: 23px; color: #f3e8ff; font-weight: bold; text-align: right; line-height: 1.3;">${fixAr('امسح الباركود أو افتح الرابط في البايو')}</span>
            <div style="display: flex; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); border-radius: 12px; padding: 6px 18px;">
              <span style="font-size: 19px; color: #ffffff; font-weight: bold;">${fixAr(`💬 أو دز #${cleanShortId} بالخاص ونرسلك الرابط`)}</span>
            </div>
          </div>
        </div>
      `;
    }

    const rawHtml = `
      <div style="display: flex; flex-direction: column; width: 1080px; height: ${canvasHeight}px; background: #fbfbfe; color: #1e1b4b; padding: 48px 52px; font-family: 'Noto Sans Arabic', 'Almarai', sans-serif; box-sizing: border-box; justify-content: space-between; position: relative;">
        
        <!-- Decorative Header Background Curves -->
        <div style="position: absolute; top: 0; right: 0; left: 0; height: 380px; background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-bottom-left-radius: 60px; border-bottom-right-radius: 60px; opacity: 0.8; display: flex;"></div>
        <div style="position: absolute; top: -50px; left: -50px; width: 350px; height: 350px; border-radius: 175px; background: radial-gradient(circle, rgba(124,58,237,0.15) 0%, rgba(245,243,255,0) 70%); display: flex;"></div>

        <!-- 1. Top Header Row (Logo Left + Main Title Right) -->
        <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: flex-start; width: 100%; position: relative; z-index: 10; margin-bottom: 20px; margin-top: 8px;">
          
          <!-- Right side: Title & Headline -->
          <div style="display: flex; flex-direction: column; align-items: flex-start;">
            <!-- Badge "جديد" -->
            <div style="display: flex; background: #2e0854; border-radius: 20px; padding: 6px 28px; margin-bottom: 14px;">
              <span style="font-size: 24px; color: #ffffff; font-weight: bold;">${fixAr(badgeLabel)}</span>
            </div>
            <!-- Huge Title -->
            <div style="display: flex; flex-direction: row; align-items: baseline; gap: 14px; margin-top: 6px; margin-bottom: 6px;">
              <span style="font-size: 72px; font-weight: bold; color: #1e1b4b; line-height: 1;">${fixAr(mainTitle1)}</span>
              <span style="font-size: 72px; font-weight: bold; color: #7c3aed; line-height: 1;">${fixAr(mainTitle2)}</span>
            </div>
            <!-- Subtitle -->
            <span style="font-size: 26px; color: #4b5563; font-weight: bold; margin-top: 8px;">${fixAr(subHeadline)}</span>
          </div>

          <!-- Left side: Brand Logo -->
          <div style="display: flex; flex-direction: row; align-items: center; gap: 12px; background: #ffffff; padding: 12px 22px; border-radius: 22px; box-shadow: 0 4px 15px rgba(124,58,237,0.08); border: 1.5px solid #ede9fe; margin-top: 4px;">
            <div style="display: flex; flex-direction: column; align-items: flex-end;">
              <span style="font-size: 26px; font-weight: bold; color: #1e1b4b; line-height: 1.1;">${fixAr('سوق بغداد')}</span>
              <span style="font-size: 13px; color: #6b7280; letter-spacing: 1.5px; font-weight: bold;">SOUQ BAGHDAD</span>
            </div>
            <img src="${svgImg(SVGS.logo)}" width="44" height="44" />
          </div>
        </div>

        ${innerContent}

        ${storyCtaBox}

        <!-- 7. Bottom Dark Purple Footer Bar -->
        <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; background: #1e0836; border-radius: 24px; padding: 18px 30px; position: relative; z-index: 10;">
          
          <!-- Feature 1 -->
          <div style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
            <img src="${svgImg(SVGS.shield)}" width="24" height="24" />
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <span style="font-size: 18px; color: #ffffff; font-weight: bold;">${fixAr('راحة وأمان')}</span>
              <span style="font-size: 13px; color: #c084fc;">${fixAr('رحلات مريحة وآمنة')}</span>
            </div>
          </div>

          <!-- Feature 2 -->
          <div style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
            <img src="${svgImg(SVGS.timeCommit)}" width="24" height="24" />
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <span style="font-size: 18px; color: #ffffff; font-weight: bold;">${fixAr('التزام بالوقت')}</span>
              <span style="font-size: 13px; color: #c084fc;">${fixAr('نصل بك في الوقت المحدد')}</span>
            </div>
          </div>

          <!-- Feature 3 -->
          <div style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
            <img src="${svgImg(SVGS.tag)}" width="24" height="24" />
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <span style="font-size: 18px; color: #ffffff; font-weight: bold;">${fixAr('أسعار مناسبة')}</span>
              <span style="font-size: 13px; color: #c084fc;">${fixAr('أفضل الأسعار للجميع')}</span>
            </div>
          </div>

          <!-- Feature 4 -->
          <div style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
            <img src="${svgImg(SVGS.star)}" width="24" height="24" />
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <span style="font-size: 18px; color: #ffffff; font-weight: bold;">${fixAr('خدمة مميزة')}</span>
              <span style="font-size: 13px; color: #c084fc;">${fixAr('نهتم براحتك دائماً')}</span>
            </div>
          </div>

        </div>

      </div>
    `;

    const markup = html(rawHtml);

    // 5. Render to SVG using Satori
    const svg = await satori(markup, {
      width: canvasWidth,
      height: canvasHeight,
      fonts: [
        {
          name: 'Noto Sans Arabic',
          data: notoData,
          weight: 700,
          style: 'normal',
        },
        {
          name: 'Almarai',
          data: almaraiData,
          weight: 700,
          style: 'normal',
        },
      ],
    });

    // 6. Render to PNG using Resvg
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'original' }
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // 7. Return the image
    return new Response(pngBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      },
    });

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });
  }
})
