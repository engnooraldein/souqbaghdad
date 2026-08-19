import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import satori from 'npm:satori@0.10.11'
import { Resvg, initWasm } from 'npm:@resvg/resvg-wasm@2.6.2'
import { html } from "npm:satori-html@0.3.2"
import convertArabic from 'npm:arabic-reshaper@1.1.0'

let wasmInitialized = false;

const fontUrl = 'https://github.com/google/fonts/raw/main/ofl/tajawal/Tajawal-Bold.ttf'

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

// Helper to reshape Arabic letters so they connect properly
function fixArabic(val: string): string {
  if (!val) return val;
  return convertArabic(val);
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("type") || "post"; // "post" (1080x1350) or "story" (1080x1920)
    
    const category = (url.searchParams.get("category") || "transport").toLowerCase();
    
    let defaultTitle = fixArabic("خط نقل جديد في بغداد");
    let badgeText = fixArabic("📢 إعلان خط جديد");
    let emoji = "🚌";
    let fareLabel = fixArabic("الأجرة الشهرية:");
    let box1Label = fixArabic("📍 مناطق الانطلاق والمرور:");
    let box2Label = fixArabic("🏛️ الوجهة والكلية:");
    let footerTag = "@souqbaghdad_lines";

    if (category === "cars" || category === "vehicles") {
      defaultTitle = "سيارة معروضة للبيع";
      badgeText = "🚗 إعلان سيارة معروضة";
      emoji = "🚗";
      fareLabel = "السعر المطلوب:";
      box1Label = "📍 المحافظة والموقع:";
      box2Label = "🔧 المواصفات والتفاصيل:";
      footerTag = "@souqbaghdad_car";
    } else if (category === "products") {
      defaultTitle = "منتج معروض للبيع";
      badgeText = "📦 منتج معروض في سوق بغداد";
      emoji = "🛍️";
      fareLabel = "السعر المطلوب:";
      box1Label = "📍 المحافظة / الموقع:";
      box2Label = "🏷️ الحالة والتفاصيل:";
      footerTag = "@souqbaghdad_iq";
    } else if (category === "general") {
      defaultTitle = fixArabic("إعلان معروض في سوق بغداد");
      badgeText = fixArabic("📢 إعلان جديد");
      emoji = "✨";
      fareLabel = fixArabic("السعر المطلوب:");
      box1Label = fixArabic("📍 الموقع والمدينة:");
      box2Label = fixArabic("📝 تفاصيل الإعلان:");
      footerTag = "@souqbaghdad_iq";
    }

    let title = fixArabic(cleanText(url.searchParams.get("title"), defaultTitle));
    let subtitle = fixArabic(cleanText(url.searchParams.get("subtitle"), category === "cars" ? "وارد ومواصفات ممتازة" : "سوق بغداد الرقمي"));
    let subdesc = fixArabic(cleanText(url.searchParams.get("subdesc"), "معروض الآن عبر المنصة"));
    let regions = fixArabic(cleanText(url.searchParams.get("regions"), "بغداد وعموم العراق"));
    let destination = fixArabic(cleanText(url.searchParams.get("destination"), "متوفر للتواصل والشراء"));
    let fare = fixArabic(cleanText(url.searchParams.get("fare"), "حسب الاتفاق"));
    let link = cleanText(url.searchParams.get("link"), "https://www.souqbaghdad.store");
    if (link.includes('data:image')) {
      link = "https://www.souqbaghdad.store";
    }
    const shortId = cleanText(url.searchParams.get("short_id"), "BGHD1");
    
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

    // 2. Fetch Arabic Font (Tajawal-Bold)
    const fontRes = await fetch(fontUrl);
    const fontData = await fontRes.arrayBuffer();

    const isPost = mode === "post";
    const canvasWidth = 1080;
    const canvasHeight = isPost ? 1350 : 1920;

    let markup;

    if (isPost) {
      // --- Instagram Post (1080 x 1350 px, 4:5 ratio) ---
      markup = html`
        <div dir="rtl" style="display: flex; flex-direction: column; width: 1080px; height: 1350px; background: ${currentBg}; color: white; padding: 50px 60px; font-family: 'Tajawal', sans-serif; box-sizing: border-box; justify-content: space-between; border: 8px solid #0284c7; border-radius: 40px;">
          
          <!-- Top Header Bar -->
          <div dir="rtl" style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; border-bottom: 2px solid rgba(56, 189, 248, 0.25); padding-bottom: 20px;">
            <div style="display: flex; flex-direction: column; align-items: flex-start; text-align: right;">
              <span style="font-size: 32px; font-weight: bold; color: #38bdf8;">${fixArabic('سوق بغداد الرقمي')}</span>
              <span dir="ltr" style="font-size: 16px; color: #94a3b8; letter-spacing: 2px;">SOUQ BAGHDAD</span>
            </div>
            <div style="display: flex; background: rgba(56, 189, 248, 0.15); border: 2px solid #38bdf8; border-radius: 20px; padding: 10px 26px;">
              <span style="font-size: 24px; color: #38bdf8; font-weight: bold;">${badgeText}</span>
            </div>
          </div>

          <!-- Hero Main Title -->
          <div dir="rtl" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; margin: 15px 0;">
            <span style="font-size: 50px; font-weight: bold; color: #ffffff; margin-bottom: 8px;">${title} ${emoji}</span>
            <span style="font-size: 40px; font-weight: bold; color: #38bdf8; margin-bottom: 6px;">${subtitle}</span>
            <span style="font-size: 24px; color: #cbd5e1;">${subdesc}</span>
          </div>

          <!-- Main Fare / Price Highlight Card -->
          <div dir="rtl" style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; background: linear-gradient(90deg, rgba(2, 132, 199, 0.25), rgba(245, 158, 11, 0.2)); border: 2px solid rgba(245, 158, 11, 0.5); border-radius: 26px; padding: 18px 35px;">
            <span style="font-size: 28px; color: #cbd5e1; font-weight: bold;">${fareLabel}</span>
            <span dir="ltr" style="font-size: 40px; color: #fbbf24; font-weight: bold;">${fare}</span>
          </div>

          <!-- 2-Column Info Cards (Regions + Destination / Details) -->
          <div dir="rtl" style="display: flex; flex-direction: row; justify-content: space-between; width: 100%; gap: 20px;">
            <div dir="rtl" style="display: flex; flex-direction: column; flex: 1.2; background: rgba(15, 23, 42, 0.85); border: 2px solid rgba(56, 189, 248, 0.4); border-radius: 24px; padding: 24px; text-align: right;">
              <span style="font-size: 24px; color: #38bdf8; font-weight: bold; margin-bottom: 10px;">${box1Label}</span>
              <span style="font-size: 22px; color: #f1f5f9; line-height: 1.5;">${regions}</span>
            </div>
            <div dir="rtl" style="display: flex; flex-direction: column; flex: 1; background: rgba(15, 23, 42, 0.85); border: 2px solid rgba(56, 189, 248, 0.4); border-radius: 24px; padding: 24px; text-align: right;">
              <span style="font-size: 24px; color: #38bdf8; font-weight: bold; margin-bottom: 10px;">${box2Label}</span>
              <span style="font-size: 22px; color: #f1f5f9; font-weight: bold; line-height: 1.4;">${destination}</span>
            </div>
          </div>

          <!-- Link & CTA Section -->
          <div dir="rtl" style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; background: rgba(30, 41, 59, 0.7); border: 2px solid rgba(56, 189, 248, 0.3); border-radius: 24px; padding: 20px 30px; gap: 20px;">
            <div dir="rtl" style="display: flex; flex-direction: column; flex: 1.4; text-align: right;">
              <span style="font-size: 22px; color: #38bdf8; font-weight: bold; margin-bottom: 4px;">${fixArabic('🔗 رابط المعاينة والتواصل:')}</span>
              <span dir="ltr" style="font-size: 20px; color: #94a3b8; text-align: right;">${link}</span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #0284c7, #0369a1); border-radius: 18px; padding: 14px 28px; border: 1px solid #38bdf8;">
              <span style="font-size: 22px; color: white; font-weight: bold;">${fixArabic('للتفاصيل والتواصل')}</span>
              <span style="font-size: 16px; color: #e0f2fe;">${fixArabic('اضغط على الرابط ✨')}</span>
            </div>
          </div>

          <!-- Feature Trust Badges -->
          <div dir="rtl" style="display: flex; flex-direction: row; justify-content: space-around; width: 100%; border-top: 1px solid rgba(255, 255, 255, 0.1); border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding: 14px 0;">
            <span style="font-size: 20px; color: #94a3b8;">${fixArabic('🛡️ إعلان موثوق')}</span>
            <span style="font-size: 20px; color: #94a3b8;">${fixArabic('⚡ تواصل سريع ومباشر')}</span>
            <span style="font-size: 20px; color: #94a3b8;">${fixArabic('🇮🇶 سوق بغداد الرقمي')}</span>
          </div>

          <!-- Footer Bar -->
          <div dir="rtl" style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%;">
            <span style="font-size: 22px; color: #38bdf8; font-weight: bold;">✈️ ${footerTag}</span>
            <span style="font-size: 20px; color: #cbd5e1;">${fixArabic('منصة سوق بغداد الرقمية 🇮🇶')}</span>
          </div>

        </div>
      `;
    } else {
      // --- Instagram Story (1080 x 1920 px, 9:16 ratio) ---
      markup = html`
        <div dir="rtl" style="display: flex; flex-direction: column; width: 1080px; height: 1920px; background: ${currentBg}; color: white; padding: 80px 65px; font-family: 'Tajawal', sans-serif; box-sizing: border-box; justify-content: space-between; border: 10px solid #0284c7; border-radius: 50px;">
          
          <!-- Story Header -->
          <div dir="rtl" style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; border-bottom: 2px solid rgba(56, 189, 248, 0.3); padding-bottom: 30px;">
            <div style="display: flex; flex-direction: column; text-align: right;">
              <span style="font-size: 40px; font-weight: bold; color: #38bdf8;">${fixArabic('سوق بغداد الرقمي')}</span>
              <span dir="ltr" style="font-size: 20px; color: #94a3b8; letter-spacing: 2px;">SOUQ BAGHDAD</span>
            </div>
            <div style="display: flex; background: rgba(56, 189, 248, 0.2); border: 2px solid #38bdf8; border-radius: 25px; padding: 12px 30px;">
              <span style="font-size: 28px; color: #38bdf8; font-weight: bold;">${badgeText}</span>
            </div>
          </div>

          <!-- Story Hero Title -->
          <div dir="rtl" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; margin: 25px 0;">
            <span style="font-size: 60px; font-weight: bold; color: #ffffff; margin-bottom: 12px;">${title} ${emoji}</span>
            <span style="font-size: 48px; font-weight: bold; color: #38bdf8; margin-bottom: 10px;">${subtitle}</span>
            <span style="font-size: 30px; color: #cbd5e1;">${subdesc}</span>
          </div>

          <!-- Fare / Price Highlight Card -->
          <div dir="rtl" style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; background: linear-gradient(90deg, rgba(2, 132, 199, 0.3), rgba(245, 158, 11, 0.25)); border: 3px solid rgba(245, 158, 11, 0.6); border-radius: 30px; padding: 25px 40px;">
            <span style="font-size: 34px; color: #cbd5e1; font-weight: bold;">${fareLabel}</span>
            <span dir="ltr" style="font-size: 48px; color: #fbbf24; font-weight: bold;">${fare}</span>
          </div>

          <!-- Info Box Stack -->
          <div dir="rtl" style="display: flex; flex-direction: column; width: 100%; gap: 25px;">
            <div dir="rtl" style="display: flex; flex-direction: column; background: rgba(15, 23, 42, 0.9); border: 2px solid rgba(56, 189, 248, 0.5); border-radius: 30px; padding: 35px; text-align: right;">
              <span style="font-size: 32px; color: #38bdf8; font-weight: bold; margin-bottom: 10px;">${box1Label}</span>
              <span style="font-size: 28px; color: #f8fafc; line-height: 1.5;">${regions}</span>
            </div>

            <div dir="rtl" style="display: flex; flex-direction: column; background: rgba(15, 23, 42, 0.9); border: 2px solid rgba(56, 189, 248, 0.5); border-radius: 30px; padding: 30px; text-align: right;">
              <span style="font-size: 30px; color: #38bdf8; font-weight: bold; margin-bottom: 8px;">${box2Label}</span>
              <span style="font-size: 30px; color: white; font-weight: bold;">${destination}</span>
            </div>

            <div dir="rtl" style="display: flex; flex-direction: column; background: rgba(30, 41, 59, 0.8); border: 2px solid rgba(56, 189, 248, 0.4); border-radius: 30px; padding: 30px; text-align: right;">
              <span style="font-size: 26px; color: #38bdf8; font-weight: bold; margin-bottom: 8px;">${fixArabic('🔗 رابط الإعلان والتواصل:')}</span>
              <span dir="ltr" style="font-size: 24px; color: #cbd5e1; text-align: right;">${link}</span>
            </div>
          </div>

          <!-- Story CTA Bubble -->
          <div dir="rtl" style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #0284c7, #0369a1); border: 2px solid #38bdf8; border-radius: 35px; padding: 35px 50px; text-align: center; margin-top: 15px;">
            <span style="font-size: 36px; font-weight: bold; color: white;">${fixArabic('💬 اسحب للأعلى أو اضغط الرابط للتفاصيل')}</span>
            <span style="font-size: 26px; color: #e0f2fe; margin-top: 6px;">${fixArabic('سوق بغداد — المنصة الإعلانية الأولى في العراق 🇮🇶')}</span>
          </div>

          <!-- Story Footer -->
          <div dir="rtl" style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 25px;">
            <span style="font-size: 26px; color: #38bdf8; font-weight: bold;">📸 @souqbaghdad.iq</span>
            <span style="font-size: 26px; color: #94a3b8;">✈️ ${footerTag}</span>
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
