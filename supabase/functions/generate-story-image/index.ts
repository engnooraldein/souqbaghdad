import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import satori from 'npm:satori@0.10.11'
import { Resvg, initWasm } from 'npm:@resvg/resvg-wasm@2.6.2'
import { html } from "npm:satori-html@0.3.2"

let wasmInitialized = false;

const fontUrls = [
  'https://raw.githubusercontent.com/google/fonts/main/ofl/tajawal/Tajawal-Bold.ttf',
  'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansArabic/NotoSansArabic-Bold.ttf'
];

let cachedFontData: ArrayBuffer | null = null;

// Helper to sanitize any raw HTML, base64 or garbage strings
function cleanText(val: string | null, fallback: string): string {
  if (!val) return fallback;
  let s = val
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&lt;.*?&gt;/gm, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/data:image\/[a-zA-Z+]+;base64,[a-zA-Z0-9+/=]+/g, '')
    .replace(/img\s+src=[^\s>]+/gi, '')
    .trim();
  return s.length > 0 ? s : fallback;
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("type") || "post"; // "post" (1080x1350) or "story" (1080x1920)
    
    const title = cleanText(url.searchParams.get("title"), "خط نقل جديد في بغداد");
    const subtitle = cleanText(url.searchParams.get("subtitle") || url.searchParams.get("destination"), "كلية الرافدين");
    const subdesc = cleanText(url.searchParams.get("subdesc") || url.searchParams.get("audience"), "خط نقل طلاب وموظفين");
    const regions = cleanText(url.searchParams.get("regions") || url.searchParams.get("location"), "صليخ 600 - سبع بكار - كريعات - حي تونس - القاهرة");
    const destination = cleanText(url.searchParams.get("destination") || url.searchParams.get("city"), "كلية الرافدين");
    const fare = cleanText(url.searchParams.get("fare") || url.searchParams.get("price"), "حسب الاتفاق");
    let link = cleanText(url.searchParams.get("link"), "https://www.souqbaghdad.store/transport");
    if (link.includes('data:image')) {
      link = "https://www.souqbaghdad.store/transport";
    }
    const shortId = cleanText(url.searchParams.get("short_id"), "35AHU");
    
    // Dynamic themes to prevent duplicate pixel spam detection on Meta
    const themeIndex = Math.abs((shortId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % 4);
    const bgGradients = [
      'linear-gradient(180deg, #0b1528 0%, #030712 100%)',
      'linear-gradient(180deg, #082138 0%, #020617 100%)',
      'linear-gradient(180deg, #0e1a33 0%, #030712 100%)',
      'linear-gradient(180deg, #071927 0%, #020617 100%)'
    ];
    const currentBg = bgGradients[themeIndex];

    // 1. Initialize WASM for Resvg
    if (!wasmInitialized) {
      const wasmRes = await fetch('https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm');
      const wasmBuffer = await wasmRes.arrayBuffer();
      await initWasm(wasmBuffer);
      wasmInitialized = true;
    }

    // 2. Fetch Arabic Font with resilient fallback
    if (!cachedFontData) {
      for (const fUrl of fontUrls) {
        try {
          const fontRes = await fetch(fUrl);
          if (fontRes.ok) {
            cachedFontData = await fontRes.arrayBuffer();
            break;
          }
        } catch(e) {
          console.warn('Font fetch fail from', fUrl, e);
        }
      }
    }
    const fontData = cachedFontData!;

    const isPost = mode === "post";
    const canvasWidth = 1080;
    const canvasHeight = isPost ? 1350 : 1920;

    let markup;

    if (isPost) {
      // --- Instagram Post (1080 x 1350 px, 4:5 ratio) ---
      markup = html`
        <div style="display: flex; flex-direction: column; width: 1080px; height: 1350px; background: ${currentBg}; color: white; padding: 50px 60px; font-family: 'Tajawal', sans-serif; box-sizing: border-box; justify-content: space-between; border: 8px solid #0284c7; border-radius: 40px; direction: rtl;">
          
          <!-- Top Header Bar -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; border-bottom: 2px solid rgba(56, 189, 248, 0.25); padding-bottom: 20px; direction: rtl;">
            <div style="display: flex; flex-direction: column; align-items: flex-start; text-align: right;">
              <span style="font-size: 32px; font-weight: bold; color: #38bdf8;">سوق بغداد الرقمي</span>
              <span style="font-size: 16px; color: #94a3b8; letter-spacing: 2px; direction: ltr;">SOUQ BAGHDAD</span>
            </div>
            <div style="display: flex; background: rgba(56, 189, 248, 0.15); border: 2px solid #38bdf8; border-radius: 20px; padding: 10px 26px;">
              <span style="font-size: 24px; color: #38bdf8; font-weight: bold;">📢 إعلان خط جديد</span>
            </div>
          </div>

          <!-- Hero Main Title -->
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; margin: 15px 0; direction: rtl;">
            <span style="font-size: 54px; font-weight: bold; color: #ffffff; margin-bottom: 8px;">${title} 🚌</span>
            <span style="font-size: 44px; font-weight: bold; color: #38bdf8; margin-bottom: 6px;">${subtitle}</span>
            <span style="font-size: 26px; color: #cbd5e1;">${subdesc}</span>
          </div>

          <!-- Main Fare Highlight Card -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; background: linear-gradient(90deg, rgba(2, 132, 199, 0.25), rgba(245, 158, 11, 0.2)); border: 2px solid rgba(245, 158, 11, 0.5); border-radius: 26px; padding: 18px 35px; direction: rtl;">
            <span style="font-size: 28px; color: #cbd5e1; font-weight: bold;">الأجرة الشهرية:</span>
            <span style="font-size: 40px; color: #fbbf24; font-weight: bold;">${fare}</span>
          </div>

          <!-- 2-Column Info Cards (Regions + Destination) -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; width: 100%; gap: 20px; direction: rtl;">
            <!-- Start Regions -->
            <div style="display: flex; flex-direction: column; flex: 1.3; background: rgba(15, 23, 42, 0.85); border: 2px solid rgba(56, 189, 248, 0.4); border-radius: 24px; padding: 24px; text-align: right; direction: rtl;">
              <span style="font-size: 24px; color: #38bdf8; font-weight: bold; margin-bottom: 10px;">📍 مناطق الانطلاق والمرور:</span>
              <span style="font-size: 22px; color: #f1f5f9; line-height: 1.5;">${regions}</span>
            </div>
            <!-- Destination -->
            <div style="display: flex; flex-direction: column; flex: 0.9; background: rgba(15, 23, 42, 0.85); border: 2px solid rgba(56, 189, 248, 0.4); border-radius: 24px; padding: 24px; text-align: right; direction: rtl;">
              <span style="font-size: 24px; color: #38bdf8; font-weight: bold; margin-bottom: 10px;">🏛️ الوجهة والكلية:</span>
              <span style="font-size: 24px; color: #f1f5f9; font-weight: bold; line-height: 1.4;">${destination}</span>
            </div>
          </div>

          <!-- Link & CTA Section -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; background: rgba(30, 41, 59, 0.7); border: 2px solid rgba(56, 189, 248, 0.3); border-radius: 24px; padding: 20px 30px; gap: 20px; direction: rtl;">
            <div style="display: flex; flex-direction: column; flex: 1.4; text-align: right; direction: rtl;">
              <span style="font-size: 22px; color: #38bdf8; font-weight: bold; margin-bottom: 4px;">🔗 رابط تفاصيل الخط والحجز:</span>
              <span style="font-size: 20px; color: #94a3b8; direction: ltr; text-align: right;">${link}</span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #0284c7, #0369a1); border-radius: 18px; padding: 14px 28px; border: 1px solid #38bdf8;">
              <span style="font-size: 22px; color: white; font-weight: bold;">للتفاصيل والحجز</span>
              <span style="font-size: 16px; color: #e0f2fe;">اضغط على الرابط ✨</span>
            </div>
          </div>

          <!-- Feature Trust Badges -->
          <div style="display: flex; flex-direction: row; justify-content: space-around; width: 100%; border-top: 1px solid rgba(255, 255, 255, 0.1); border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding: 14px 0; direction: rtl;">
            <span style="font-size: 20px; color: #94a3b8;">🛡️ رحلات آمنة</span>
            <span style="font-size: 20px; color: #94a3b8;">💺 سيارات وباصات حديثة</span>
            <span style="font-size: 20px; color: #94a3b8;">⏰ التزام بالمواعيد</span>
          </div>

          <!-- Footer Bar -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; direction: rtl;">
            <span style="font-size: 22px; color: #38bdf8; font-weight: bold;">✈️ @souqbaghdad_lines</span>
            <span style="font-size: 20px; color: #cbd5e1;">منصة سوق بغداد الرقمية 🇮🇶</span>
          </div>

        </div>
      `;
    } else {
      // --- Instagram Story (1080 x 1920 px, 9:16 ratio) ---
      markup = html`
        <div style="display: flex; flex-direction: column; width: 1080px; height: 1920px; background: ${currentBg}; color: white; padding: 80px 65px; font-family: 'Tajawal', sans-serif; box-sizing: border-box; justify-content: space-between; border: 10px solid #0284c7; border-radius: 50px; direction: rtl;">
          
          <!-- Story Header -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; border-bottom: 2px solid rgba(56, 189, 248, 0.3); padding-bottom: 30px; direction: rtl;">
            <div style="display: flex; flex-direction: column; text-align: right;">
              <span style="font-size: 40px; font-weight: bold; color: #38bdf8;">سوق بغداد الرقمي</span>
              <span style="font-size: 20px; color: #94a3b8; letter-spacing: 2px; direction: ltr;">SOUQ BAGHDAD</span>
            </div>
            <div style="display: flex; background: rgba(56, 189, 248, 0.2); border: 2px solid #38bdf8; border-radius: 25px; padding: 12px 30px;">
              <span style="font-size: 28px; color: #38bdf8; font-weight: bold;">🚌 خط نقل</span>
            </div>
          </div>

          <!-- Story Hero Title -->
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; margin: 25px 0; direction: rtl;">
            <span style="font-size: 64px; font-weight: bold; color: #ffffff; margin-bottom: 12px;">${title} 🚌</span>
            <span style="font-size: 52px; font-weight: bold; color: #38bdf8; margin-bottom: 10px;">${subtitle}</span>
            <span style="font-size: 34px; color: #cbd5e1;">${subdesc}</span>
          </div>

          <!-- Fare Highlight Card -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; background: linear-gradient(90deg, rgba(2, 132, 199, 0.3), rgba(245, 158, 11, 0.25)); border: 3px solid rgba(245, 158, 11, 0.6); border-radius: 30px; padding: 25px 40px; direction: rtl;">
            <span style="font-size: 34px; color: #cbd5e1; font-weight: bold;">الأجرة الشهرية:</span>
            <span style="font-size: 48px; color: #fbbf24; font-weight: bold;">${fare}</span>
          </div>

          <!-- Info Box Stack -->
          <div style="display: flex; flex-direction: column; width: 100%; gap: 25px; direction: rtl;">
            <!-- Start Regions -->
            <div style="display: flex; flex-direction: column; background: rgba(15, 23, 42, 0.9); border: 2px solid rgba(56, 189, 248, 0.5); border-radius: 30px; padding: 35px; text-align: right; direction: rtl;">
              <span style="font-size: 32px; color: #38bdf8; font-weight: bold; margin-bottom: 10px;">📍 مناطق الانطلاق والمرور:</span>
              <span style="font-size: 28px; color: #f8fafc; line-height: 1.5;">${regions}</span>
            </div>

            <!-- Destination -->
            <div style="display: flex; flex-direction: column; background: rgba(15, 23, 42, 0.9); border: 2px solid rgba(56, 189, 248, 0.5); border-radius: 30px; padding: 30px; text-align: right; direction: rtl;">
              <span style="font-size: 30px; color: #38bdf8; font-weight: bold; margin-bottom: 8px;">🏛️ الوجهة والكلية:</span>
              <span style="font-size: 30px; color: white; font-weight: bold;">${destination}</span>
            </div>

            <!-- Link Box -->
            <div style="display: flex; flex-direction: column; background: rgba(30, 41, 59, 0.8); border: 2px solid rgba(56, 189, 248, 0.4); border-radius: 30px; padding: 30px; text-align: right; direction: rtl;">
              <span style="font-size: 26px; color: #38bdf8; font-weight: bold; margin-bottom: 8px;">🔗 تفاصيل الخط والتواصل:</span>
              <span style="font-size: 24px; color: #cbd5e1; direction: ltr; text-align: right;">${link}</span>
            </div>
          </div>

          <!-- Story CTA Bubble -->
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #0284c7, #0369a1); border: 2px solid #38bdf8; border-radius: 35px; padding: 35px 50px; text-align: center; margin-top: 15px; direction: rtl;">
            <span style="font-size: 36px; font-weight: bold; color: white;">💬 اسحب للأعلى أو اضغط الرابط للحجز</span>
            <span style="font-size: 26px; color: #e0f2fe; margin-top: 6px;">نتمنى لكم رحلة آمنة ومريحة ✨</span>
          </div>

          <!-- Story Footer -->
          <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 25px; direction: rtl;">
            <span style="font-size: 26px; color: #38bdf8; font-weight: bold;">📸 @souqbaghdad.iq</span>
            <span style="font-size: 26px; color: #94a3b8;">✈️ @souqbaghdad_lines</span>
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
          name: 'Tajawal',
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
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*'
      },
    });

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
})
