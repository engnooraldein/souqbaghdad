import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import satori from 'npm:satori@0.10.11'
import { Resvg, initWasm } from 'npm:@resvg/resvg-wasm@2.6.2'
import { html } from "npm:satori-html@0.3.2"

import ArabicShaper from 'npm:arabic-persian-reshaper@1.0.1'

let wasmInitialized = false;

// Aggressive text cleanup - WHITELIST approach: only keep renderable characters
// Strips ALL characters the font can't render (emojis, special Unicode, pipes, etc.)
function cleanText(val: string | null, fallback: string): string {
  if (!val) return fallback;
  let s = val
    // Strip HTML tags and entities
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&lt;.*?&gt;/gm, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    // Strip base64 images
    .replace(/data:image\/[a-zA-Z+]+;base64,[a-zA-Z0-9+/=]+/g, '')
    .replace(/img\s+src=[^\s>]+/gi, '')
    // WHITELIST: Only keep Arabic (0600-06FF, 0750-077F, FB50-FDFF, FE70-FEFF),
    // Latin (a-zA-Z), digits (0-9), spaces, and basic punctuation
    .replace(/[^\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s.,;:!?\-\/()@#_•=+%'"\u060C\u061B\u061F]/g, ' ')
    // Collapse multiple spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
  return s.length > 0 ? s : fallback;
}

// Check if a character is Arabic (or Arabic presentation form)
function isArabicChar(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (
    (code >= 0x0600 && code <= 0x06FF) ||  // Arabic
    (code >= 0x0750 && code <= 0x077F) ||  // Arabic Supplement
    (code >= 0xFB50 && code <= 0xFDFF) ||  // Arabic Presentation Forms-A
    (code >= 0xFE70 && code <= 0xFEFF)     // Arabic Presentation Forms-B
  );
}

// Segment text into runs of Arabic vs non-Arabic characters
function segmentText(text: string): { text: string; isArabic: boolean }[] {
  const segments: { text: string; isArabic: boolean }[] = [];
  let current = '';
  let currentIsArabic = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const charIsArabic = isArabicChar(ch);
    // Treat spaces and common punctuation as part of current segment
    const isNeutral = /[\s\u060C\u061B\u061F•،.:!\-\/|()]/.test(ch);

    if (current.length === 0) {
      currentIsArabic = charIsArabic;
      current = ch;
    } else if (charIsArabic === currentIsArabic || isNeutral) {
      current += ch;
    } else {
      segments.push({ text: current, isArabic: currentIsArabic });
      current = ch;
      currentIsArabic = charIsArabic;
    }
  }
  if (current.length > 0) {
    segments.push({ text: current, isArabic: currentIsArabic });
  }
  return segments;
}

// Reshape connected Arabic letters and fix bidirectional sequence for SVG canvas
// Satori renders LTR by default, so we must:
// 1. Reshape Arabic glyphs (connect letters)
// 2. Reverse each Arabic segment so it reads RTL
// 3. Reverse the overall segment order so the rightmost segment appears first
function fixAr(text: string): string {
  if (!text) return '';
  try {
    const clean = cleanText(text, '');
    if (!clean) return '';

    const fn = (ArabicShaper as any).convertArabic || (ArabicShaper as any)?.ArabicShaper?.convertArabic || (ArabicShaper as any);

    const segments = segmentText(clean);

    const processedSegments = segments.map(seg => {
      if (seg.isArabic && typeof fn === 'function') {
        const reshaped = fn(seg.text);
        // Reverse the Arabic segment for LTR canvas
        return reshaped.split('').reverse().join('');
      }
      // Non-Arabic segments (numbers, English, URLs) stay as-is
      return seg.text;
    });

    // Reverse segment order so Arabic reads right-to-left in LTR canvas
    return processedSegments.reverse().join('');
  } catch (e) {
    return text;
  }
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("type") || "post"; // "post" (1080x1350) or "story" (1080x1920)
    
    const category = (url.searchParams.get("category") || "transport").toLowerCase();
    
    const adType = (url.searchParams.get("ad_type") || url.searchParams.get("type_mode") || "offer").toLowerCase(); // "offer" (توفير خط) vs "request" (مطلوب خط)
    
    let defaultTitle = adType === "request" ? "مطلوب خط نقل في بغداد" : "توفير خط نقل جديد في بغداد";
    let badgeText = adType === "request" ? "إعلان مطلوب خط" : "إعلان توفير خط نقل";
    let emoji = "";
    let fareLabel = "الأجرة الشهرية:";
    let box1Label = "مناطق الانطلاق والمرور:";
    let box2Label = "الوجهة والكلية:";
    let footerTag = "@souqbaghdad_lines";

    if (category === "cars" || category === "vehicles") {
      defaultTitle = "سيارة معروضة للبيع";
      badgeText = "إعلان سيارة معروضة";
      emoji = "";
      fareLabel = "السعر المطلوب:";
      box1Label = "المحافظة والموقع:";
      box2Label = "المواصفات والتفاصيل:";
      footerTag = "@souqbaghdad_car";
    } else if (category === "products") {
      defaultTitle = "منتج معروض للبيع";
      badgeText = "منتج معروض في سوق بغداد";
      emoji = "";
      fareLabel = "السعر المطلوب:";
      box1Label = "المحافظة / الموقع:";
      box2Label = "الحالة والتفاصيل:";
      footerTag = "@souqbaghdad_iq";
    } else if (category === "general") {
      defaultTitle = "إعلان معروض في سوق بغداد";
      badgeText = "إعلان جديد";
      emoji = "";
      fareLabel = "السعر المطلوب:";
      box1Label = "الموقع والمدينة:";
      box2Label = "تفاصيل الإعلان:";
      footerTag = "@souqbaghdad_iq";
    }

    const title = cleanText(url.searchParams.get("title"), defaultTitle);
    const subtitle = cleanText(url.searchParams.get("subtitle"), category === "cars" ? "وارد ومواصفات ممتازة" : "سوق بغداد الرقمي");
    const subdesc = cleanText(url.searchParams.get("subdesc"), adType === "request" ? "طلب نقل مباشر عبر المنصة" : "متوفر الآن للتسجيل والحجز");
    const regions = cleanText(url.searchParams.get("regions"), "بغداد وعموم العراق");
    const destination = cleanText(url.searchParams.get("destination"), "متوفر للتواصل والشراء");
    const fare = cleanText(url.searchParams.get("fare"), "حسب الاتفاق");
    let link = cleanText(url.searchParams.get("link"), "https://www.souqbaghdad.store");
    if (link.includes('data:image')) {
      link = "https://www.souqbaghdad.store";
    }
    const shortId = cleanText(url.searchParams.get("short_id"), "BGHD1");
    
    // Dynamic themes to distinguish offer vs request and categories with gorgeous gradients
    let bgGradients = [
      'linear-gradient(180deg, #0b1528 0%, #030712 100%)',
      'linear-gradient(180deg, #082138 0%, #020617 100%)',
      'linear-gradient(180deg, #0e1a33 0%, #030712 100%)',
      'linear-gradient(180deg, #071927 0%, #020617 100%)'
    ];

    let borderAccent = '#0284c7';
    let badgeBorder = '#38bdf8';
    let badgeBg = 'rgba(56, 189, 248, 0.15)';
    let badgeTextColor = '#38bdf8';

    if (adType === "request") {
      // Emerald / Teal theme for requests (مطلوب خط)
      bgGradients = [
        'linear-gradient(180deg, #06231c 0%, #02120e 100%)',
        'linear-gradient(180deg, #042f2e 0%, #021312 100%)',
        'linear-gradient(180deg, #062b25 0%, #01140f 100%)'
      ];
      borderAccent = '#059669';
      badgeBorder = '#10b981';
      badgeBg = 'rgba(16, 185, 129, 0.2)';
      badgeTextColor = '#34d399';
    } else if (category === "cars") {
      // Violet / Indigo theme for cars
      bgGradients = [
        'linear-gradient(180deg, #1e1b4b 0%, #0a0a18 100%)',
        'linear-gradient(180deg, #17153b 0%, #050510 100%)'
      ];
      borderAccent = '#6366f1';
      badgeBorder = '#818cf8';
      badgeBg = 'rgba(129, 140, 248, 0.2)';
      badgeTextColor = '#a5b4fc';
    }

    const themeIndex = Math.abs((shortId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % bgGradients.length);
    const currentBg = bgGradients[themeIndex];

    // 1. Initialize WASM for Resvg
    if (!wasmInitialized) {
      const wasmRes = await fetch('https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm');
      const wasmBuffer = await wasmRes.arrayBuffer();
      await initWasm(wasmBuffer);
      wasmInitialized = true;
    }

    // 2. Fetch Arabic Font (Noto Sans Arabic - Full Glyphs Support)
    const fontUrl = 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansArabic/NotoSansArabic-Bold.ttf';
    const fontRes = await fetch(fontUrl);
    const fontData = await fontRes.arrayBuffer();

    const isPost = mode === "post";
    const canvasWidth = 1080;
    const canvasHeight = isPost ? 1350 : 1920;

    let audience = cleanText(url.searchParams.get("audience"), "الطلبة");
    if (audience.startsWith('ل')) audience = audience.substring(1);
    
    let rawDays = cleanText(url.searchParams.get("days"), "الأحد إلى الخميس");
    let workDays = rawDays.replace(/-/g, ' إلى ').replace(/\s{2,}/g, ' ').trim();
    if (!workDays.includes('إلى')) workDays = "الأحد إلى الخميس";

    const shiftTime = cleanText(url.searchParams.get("time"), "صباحاً ومساءً");

    // Dynamic clean titles
    const line1 = adType === "request" ? "مطلوب خط نقل مباشر" : "توفير خط نقل جديد";
    const line2 = `لل${audience} في بغداد`;

    // Short display link for clean presentation (guaranteed no special chars)
    const cleanId = shortId.replace(/[^a-zA-Z0-9]/g, '');
    const displayLink = `souqbaghdad.store/transport/card/${cleanId}`;

    let markup;

    if (isPost) {
      // --- Exact 1:1 Match of Post Reference (1080 x 1350 px) ---
      markup = html`
        <div style="display: flex; flex-direction: column; width: 1080px; height: 1350px; background: #07152b; color: white; padding: 55px 60px; font-family: 'Noto Sans Arabic', sans-serif; box-sizing: border-box; justify-content: space-between; border: 4px solid #0f294d; border-radius: 36px; position: relative;">
          
          <!-- Background Grid / Map Accent Pattern -->
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.12; display: flex; background-image: radial-gradient(#38bdf8 1px, transparent 1px); background-size: 32px 32px;"></div>

          <!-- Top Header Brand & Badge -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%;">
            <div style="display: flex; flex-direction: column; align-items: flex-start; text-align: left;">
              <span style="font-size: 30px; font-weight: bold; color: #ffffff;">${fixAr('سوق بغداد الرقمي')}</span>
              <span style="font-size: 15px; color: #94a3b8; letter-spacing: 2px; font-weight: bold;">SOUQ BAGHDAD</span>
            </div>
            
            <div style="display: flex; background: #0284c7; border-radius: 16px; padding: 8px 24px;">
              <span style="font-size: 24px; color: #ffffff; font-weight: bold;">${fixAr(badgeText)}</span>
            </div>
          </div>

          <!-- Main Headline -->
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; margin: 10px 0;">
            <span style="font-size: 56px; font-weight: bold; color: #ffffff; margin-bottom: 6px;">${fixAr(line1)}</span>
            <span style="font-size: 48px; font-weight: bold; color: #38bdf8;">${fixAr(line2)}</span>
          </div>

          <!-- Highlight Amber Banner (الأجرة الشهرية: 45,000 د.ع) -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; background: linear-gradient(90deg, #b45309, #d97706); border: 2px solid #f59e0b; border-radius: 22px; padding: 18px 36px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
            <span style="font-size: 36px; color: #fef3c7; font-weight: bold;">${fixAr(fare)}</span>
            <span style="font-size: 34px; color: #ffffff; font-weight: bold;">${fixAr(fareLabel)}</span>
          </div>

          <!-- Two-Box Grid: الوجهة والكلية (يمين) + الانطلاق ومناطق المرور (يسار) -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; width: 100%; gap: 20px;">
            <!-- Left Box: الانطلاق ومناطق المرور (على اليسار) -->
            <div style="display: flex; flex-direction: column; flex: 1.2; background: #0c203c; border: 2px solid #1e40af; border-radius: 20px; padding: 22px 24px; text-align: right;">
              <span style="font-size: 24px; color: #38bdf8; font-weight: bold; margin-bottom: 8px;">${fixAr('الانطلاق ومناطق المرور:')}</span>
              <span style="font-size: 26px; color: #ffffff; font-weight: bold; line-height: 1.4;">${fixAr(regions)}</span>
            </div>

            <!-- Right Box: الوجهة والكلية (على اليمين) -->
            <div style="display: flex; flex-direction: column; flex: 1; background: #0c203c; border: 2px solid #1e40af; border-radius: 20px; padding: 22px 24px; text-align: right;">
              <span style="font-size: 24px; color: #38bdf8; font-weight: bold; margin-bottom: 8px;">${fixAr('الوجهة والكلية:')}</span>
              <span style="font-size: 26px; color: #ffffff; font-weight: bold; line-height: 1.4;">${fixAr(destination)}</span>
            </div>
          </div>

          <!-- Pill Attributes Badges (نوع الخط + الأيام + الوقت) من اليمين لليسار -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; width: 100%; gap: 12px;">
            <div style="display: flex; flex: 1; justify-content: center; align-items: center; background: #0f274a; border: 1.5px solid #2563eb; border-radius: 50px; padding: 12px 16px;">
              <span style="font-size: 21px; color: #ffffff; font-weight: bold;"><span style="color: #38bdf8; font-weight: bold;">${fixAr('الوقت: ')}</span>${fixAr(shiftTime)}</span>
            </div>
            <div style="display: flex; flex: 1.2; justify-content: center; align-items: center; background: #0f274a; border: 1.5px solid #2563eb; border-radius: 50px; padding: 12px 16px;">
              <span style="font-size: 21px; color: #ffffff; font-weight: bold;"><span style="color: #38bdf8; font-weight: bold;">${fixAr('الأيام: ')}</span>${fixAr(workDays)}</span>
            </div>
            <div style="display: flex; flex: 1.3; justify-content: center; align-items: center; background: #0f274a; border: 1.5px solid #2563eb; border-radius: 50px; padding: 12px 16px;">
              <span style="font-size: 21px; color: #ffffff; font-weight: bold;"><span style="color: #38bdf8; font-weight: bold;">${fixAr('نوع الخط: ')}</span>${fixAr(`نقل ${audience}`)}</span>
            </div>
          </div>

          <!-- Bottom Action Link Box -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; background: #0c203c; border: 2px solid #1e40af; border-radius: 20px; padding: 18px 26px;">
            <div style="display: flex; flex-direction: column; text-align: left;">
              <span style="font-size: 20px; color: #38bdf8; font-weight: bold; margin-bottom: 2px;">${fixAr('للتفاصيل والتواصل المباشر:')}</span>
              <span style="font-size: 19px; color: #ffffff; font-family: monospace; letter-spacing: 0.5px;">https://${displayLink}</span>
            </div>
            <div style="display: flex; background: #0284c7; border: 1.5px solid #38bdf8; border-radius: 14px; padding: 12px 26px;">
              <span style="font-size: 22px; color: #ffffff; font-weight: bold;">${fixAr('اضغط على الرابط')}</span>
            </div>
          </div>

          <!-- Footer Information -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; padding-top: 10px;">
            <span style="font-size: 24px; color: #38bdf8; font-weight: bold;">${footerTag}</span>
            <span style="font-size: 22px; color: #e2e8f0; font-weight: bold;">${fixAr('إعلانات موثوقة - تواصل مباشر - نشر سريع')}</span>
          </div>

        </div>
      `;
    } else {
      // --- Exact 1:1 Match of Story Reference (1080 x 1920 px) ---
      markup = html`
        <div style="display: flex; flex-direction: column; width: 1080px; height: 1920px; background: #07152b; color: white; padding: 75px 65px; font-family: 'Noto Sans Arabic', sans-serif; box-sizing: border-box; justify-content: space-between; border: 6px solid #0f294d; border-radius: 46px; position: relative;">
          
          <!-- Background Grid / Map Pattern -->
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.12; display: flex; background-image: radial-gradient(#38bdf8 1px, transparent 1px); background-size: 36px 36px;"></div>

          <!-- Top Brand Header -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%;">
            <div style="display: flex; flex-direction: column; align-items: flex-start; text-align: left;">
              <span style="font-size: 38px; font-weight: bold; color: #ffffff;">${fixAr('سوق بغداد الرقمي')}</span>
              <span style="font-size: 18px; color: #94a3b8; letter-spacing: 2px; font-weight: bold;">SOUQ BAGHDAD</span>
            </div>
            <div style="display: flex; background: #0284c7; border-radius: 20px; padding: 12px 30px;">
              <span style="font-size: 28px; color: #ffffff; font-weight: bold;">${fixAr(badgeText)}</span>
            </div>
          </div>

          <!-- Story Headline -->
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; margin: 25px 0;">
            <span style="font-size: 64px; font-weight: bold; color: #ffffff; margin-bottom: 10px;">${fixAr(line1)}</span>
            <span style="font-size: 54px; font-weight: bold; color: #38bdf8;">${fixAr(line2)}</span>
          </div>

          <!-- Highlight Amber Banner -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; background: linear-gradient(90deg, #b45309, #d97706); border: 3px solid #f59e0b; border-radius: 28px; padding: 26px 45px; box-shadow: 0 12px 30px rgba(0,0,0,0.35);">
            <span style="font-size: 46px; color: #fef3c7; font-weight: bold;">${fixAr(fare)}</span>
            <span style="font-size: 42px; color: #ffffff; font-weight: bold;">${fixAr(fareLabel)}</span>
          </div>

          <!-- Vertical Info Cards Stack: الوجهة أولاً ثم الانطلاق -->
          <div style="display: flex; flex-direction: column; width: 100%; gap: 22px;">
            <div style="display: flex; flex-direction: column; background: #0c203c; border: 2.5px solid #1e3a63; border-radius: 26px; padding: 30px 34px; text-align: right;">
              <span style="font-size: 28px; color: #38bdf8; font-weight: bold; margin-bottom: 10px;">${fixAr('الوجهة والكلية:')}</span>
              <span style="font-size: 30px; color: #ffffff; font-weight: bold; line-height: 1.4;">${fixAr(destination)}</span>
            </div>

            <div style="display: flex; flex-direction: column; background: #0c203c; border: 2.5px solid #1e3a63; border-radius: 26px; padding: 30px 34px; text-align: right;">
              <span style="font-size: 28px; color: #38bdf8; font-weight: bold; margin-bottom: 10px;">${fixAr('الانطلاق ومناطق المرور:')}</span>
              <span style="font-size: 30px; color: #ffffff; font-weight: bold; line-height: 1.4;">${fixAr(regions)}</span>
            </div>
          </div>

          <!-- Story Pill Attributes Row -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; width: 100%; gap: 14px;">
            <div style="display: flex; flex: 1; justify-content: center; align-items: center; background: #0f274a; border: 2px solid #2563eb; border-radius: 50px; padding: 16px 20px;">
              <span style="font-size: 24px; color: #ffffff; font-weight: bold;"><span style="color: #38bdf8; font-weight: bold;">${fixAr('الوقت: ')}</span>${fixAr(shiftTime)}</span>
            </div>
            <div style="display: flex; flex: 1.2; justify-content: center; align-items: center; background: #0f274a; border: 2px solid #2563eb; border-radius: 50px; padding: 16px 20px;">
              <span style="font-size: 24px; color: #ffffff; font-weight: bold;"><span style="color: #38bdf8; font-weight: bold;">${fixAr('الأيام: ')}</span>${fixAr(workDays)}</span>
            </div>
            <div style="display: flex; flex: 1.3; justify-content: center; align-items: center; background: #0f274a; border: 2px solid #2563eb; border-radius: 50px; padding: 16px 20px;">
              <span style="font-size: 24px; color: #ffffff; font-weight: bold;"><span style="color: #38bdf8; font-weight: bold;">${fixAr('النوع: ')}</span>${fixAr(audience)}</span>
            </div>
          </div>

          <!-- Story Link Box -->
          <div style="display: flex; flex-direction: column; background: #0c203c; border: 2.5px solid #1e3a63; border-radius: 26px; padding: 26px 34px; text-align: left;">
            <span style="font-size: 24px; color: #38bdf8; font-weight: bold; margin-bottom: 6px;">${fixAr('للتفاصيل والتواصل المباشر:')}</span>
            <span style="font-size: 22px; color: #ffffff; font-family: monospace;">https://${displayLink}</span>
          </div>

          <!-- Story Bottom Footer -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; border-top: 1px solid rgba(255, 255, 255, 0.15); padding-top: 20px;">
            <span style="font-size: 26px; color: #38bdf8; font-weight: bold;">${footerTag}</span>
            <span style="font-size: 24px; color: #cbd5e1;">${fixAr('إعلانات موثوقة - تواصل مباشر')}</span>
          </div>

        </div>
      `;
    }

    // 4. Render to SVG using Satori
    const svg = await satori(markup, {
      width: canvasWidth,
      height: canvasHeight,
      fonts: [
        {
          name: 'Noto Sans Arabic',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
    });

    // 5. Render to PNG using Resvg
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'original' }
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // 6. Return the image
    return new Response(pngBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      },
    });

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
})
