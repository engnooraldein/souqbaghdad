import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import satori from 'npm:satori@0.10.11'
import { Resvg, initWasm } from 'npm:@resvg/resvg-wasm@2.6.2'
import { html } from "npm:satori-html@0.3.2"

let wasmInitialized = false;

const fontUrl = 'https://github.com/google/fonts/raw/main/ofl/tajawal/Tajawal-Bold.ttf'

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("type") || "post"; // "post" (1080x1350) or "story" (1080x1920)
    const title = url.searchParams.get("title") || "خط نقل جديد في بغداد";
    const subtitle = url.searchParams.get("subtitle") || "جامعة الرافدين";
    const subdesc = url.searchParams.get("subdesc") || "خط نقل طلاب وموظفين";
    const regions = url.searchParams.get("regions") || "صليخ 600 - سبع بكار - كريعات - حي تونس - القاهرة";
    const destination = url.searchParams.get("destination") || "جامعة الرافدين";
    const fare = url.searchParams.get("fare") || "حسب الاتفاق";
    const link = url.searchParams.get("link") || "https://www.souqbaghdad.store/transport";
    const shortId = url.searchParams.get("short_id") || "35AHU";
    
    // Dynamic themes to prevent duplicate pixel spam detection on Instagram/Facebook
    const themeIndex = Math.abs((shortId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % 4);
    const bgGradients = [
      'radial-gradient(circle at 50% 20%, #1e293b 0%, #030712 100%)',
      'radial-gradient(circle at 50% 20%, #0c4a6e 0%, #020617 100%)',
      'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #030712 100%)',
      'radial-gradient(circle at 50% 20%, #0f172a 0%, #030712 100%)'
    ];
    const currentBg = bgGradients[themeIndex];

    // 1. Initialize WASM for Resvg
    if (!wasmInitialized) {
      const wasmRes = await fetch('https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm');
      const wasmBuffer = await wasmRes.arrayBuffer();
      await initWasm(wasmBuffer);
      wasmInitialized = true;
    }

    // 2. Fetch Arabic Font
    const fontRes = await fetch(fontUrl);
    const fontData = await fontRes.arrayBuffer();

    const isPost = mode === "post";
    const canvasWidth = 1080;
    const canvasHeight = isPost ? 1350 : 1920;

    let markup;

    if (isPost) {
      // --- Instagram Post (1080 x 1350 px) ---
      markup = html`
        <div style="display: flex; flex-direction: column; width: 1080px; height: 1350px; background: ${currentBg}; color: white; padding: 45px 55px; font-family: 'Tajawal', sans-serif; box-sizing: border-box; justify-content: space-between; border: 8px solid #0284c7; border-radius: 40px;">
          
          <!-- Header Bar -->
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; border-bottom: 2px solid rgba(56, 189, 248, 0.25); padding-bottom: 20px;">
            <div style="display: flex; align-items: center;">
              <div style="display: flex; flex-direction: column; align-items: flex-start;">
                <span style="font-size: 32px; font-weight: bold; color: #38bdf8; letter-spacing: -0.5px;">سوق بغداد الرقمي</span>
                <span style="font-size: 18px; color: #94a3b8; letter-spacing: 2px;">SOUQ BAGHDAD</span>
              </div>
            </div>
            <div style="display: flex; background: rgba(56, 189, 248, 0.15); border: 2px solid #38bdf8; border-radius: 20px; padding: 8px 24px;">
              <span style="font-size: 24px; color: #38bdf8; font-weight: bold;">📢 إعلان خط جديد</span>
            </div>
          </div>

          <!-- Hero Main Title -->
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center; margin-top: 10px;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
              <span style="font-size: 56px; font-weight: bold; color: #f8fafc;">${title} 🚌</span>
            </div>
            <span style="font-size: 42px; font-weight: bold; color: #38bdf8; margin-top: 6px;">${subtitle}</span>
            <span style="font-size: 26px; color: #cbd5e1; margin-top: 4px;">${subdesc}</span>
          </div>

          <!-- 3-Column Info Cards -->
          <div style="display: flex; justify-content: space-between; width: 100%; gap: 20px; margin-top: 10px;">
            <!-- Start Regions -->
            <div style="display: flex; flex-direction: column; flex: 1.2; background: rgba(15, 23, 42, 0.85); border: 2px solid rgba(56, 189, 248, 0.4); border-radius: 24px; padding: 20px; text-align: right;">
              <span style="font-size: 24px; color: #38bdf8; font-weight: bold; margin-bottom: 8px;">📍 مناطق الانطلاق</span>
              <span style="font-size: 21px; color: #f1f5f9; line-height: 1.4;">${regions}</span>
            </div>
            <!-- Destination -->
            <div style="display: flex; flex-direction: column; flex: 1; background: rgba(15, 23, 42, 0.85); border: 2px solid rgba(56, 189, 248, 0.4); border-radius: 24px; padding: 20px; text-align: center; align-items: center;">
              <span style="font-size: 24px; color: #38bdf8; font-weight: bold; margin-bottom: 8px;">🏛️ الوجهة</span>
              <span style="font-size: 22px; color: #f1f5f9; font-weight: bold;">${destination}</span>
            </div>
            <!-- Fare -->
            <div style="display: flex; flex-direction: column; flex: 0.9; background: rgba(15, 23, 42, 0.85); border: 2px solid rgba(56, 189, 248, 0.4); border-radius: 24px; padding: 20px; text-align: center; align-items: center;">
              <span style="font-size: 24px; color: #38bdf8; font-weight: bold; margin-bottom: 8px;">💰 الأجرة</span>
              <span style="font-size: 22px; color: #fbbf24; font-weight: bold;">${fare}</span>
            </div>
          </div>

          <!-- Link & CTA Section -->
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; background: rgba(30, 41, 59, 0.7); border: 2px solid rgba(56, 189, 248, 0.3); border-radius: 24px; padding: 20px 30px; gap: 20px;">
            <div style="display: flex; flex-direction: column; flex: 1.4;">
              <span style="font-size: 22px; color: #38bdf8; font-weight: bold; margin-bottom: 4px;">🔗 رابط تفاصيل الخط والحجز:</span>
              <span style="font-size: 20px; color: #94a3b8; direction: ltr; text-align: right;">${link}</span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #0284c7, #0369a1); border-radius: 18px; padding: 14px 28px; border: 1px solid #38bdf8;">
              <span style="font-size: 22px; color: white; font-weight: bold;">للتفاصيل والاستفسار</span>
              <span style="font-size: 17px; color: #e0f2fe;">اضغط على الرابط ✨</span>
            </div>
          </div>

          <!-- Feature Trust Badges -->
          <div style="display: flex; justify-content: space-around; width: 100%; border-top: 1px solid rgba(255, 255, 255, 0.1); border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding: 15px 0;">
            <span style="font-size: 20px; color: #94a3b8;">🛡️ رحلات آمنة وسائقين معتمدين</span>
            <span style="font-size: 20px; color: #94a3b8;">💺 باصات وسيارات حديثة</span>
            <span style="font-size: 20px; color: #94a3b8;">⏰ التزام تام بالمواعيد</span>
          </div>

          <!-- Footer Bar -->
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span style="font-size: 22px; color: #38bdf8; font-weight: bold;">✈️ 📸 @souqbaghdad_lines</span>
            <span style="font-size: 20px; color: #cbd5e1;">منصة سوق بغداد الرقمية 🇮🇶</span>
          </div>

        </div>
      `;
    } else {
      // --- Instagram Story (1080 x 1920 px) ---
      markup = html`
        <div style="display: flex; flex-direction: column; width: 1080px; height: 1920px; background: ${currentBg}; color: white; padding: 80px 65px; font-family: 'Tajawal', sans-serif; box-sizing: border-box; justify-content: space-between; border: 10px solid #0284c7; border-radius: 50px;">
          
          <!-- Story Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; border-bottom: 2px solid rgba(56, 189, 248, 0.3); padding-bottom: 30px;">
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 40px; font-weight: bold; color: #38bdf8;">سوق بغداد الرقمي</span>
              <span style="font-size: 22px; color: #94a3b8; letter-spacing: 2px;">SOUQ BAGHDAD</span>
            </div>
            <div style="display: flex; background: rgba(56, 189, 248, 0.2); border: 2px solid #38bdf8; border-radius: 25px; padding: 12px 30px;">
              <span style="font-size: 28px; color: #38bdf8; font-weight: bold;">🚌 خط نقل</span>
            </div>
          </div>

          <!-- Story Hero Title -->
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center; margin: 30px 0;">
            <span style="font-size: 64px; font-weight: bold; color: #f8fafc;">${title} 🚌</span>
            <span style="font-size: 52px; font-weight: bold; color: #38bdf8; margin-top: 15px;">${subtitle}</span>
            <span style="font-size: 34px; color: #cbd5e1; margin-top: 10px;">${subdesc}</span>
          </div>

          <!-- Info Box Stack -->
          <div style="display: flex; flex-direction: column; width: 100%; gap: 30px;">
            <!-- Start Regions -->
            <div style="display: flex; flex-direction: column; background: rgba(15, 23, 42, 0.9); border: 2px solid rgba(56, 189, 248, 0.5); border-radius: 30px; padding: 35px; text-align: right;">
              <span style="font-size: 32px; color: #38bdf8; font-weight: bold; margin-bottom: 10px;">📍 مناطق الانطلاق:</span>
              <span style="font-size: 28px; color: #f8fafc; line-height: 1.5;">${regions}</span>
            </div>

            <!-- Destination & Fare in 2 Columns -->
            <div style="display: flex; justify-content: space-between; gap: 25px;">
              <div style="display: flex; flex-direction: column; flex: 1; background: rgba(15, 23, 42, 0.9); border: 2px solid rgba(56, 189, 248, 0.5); border-radius: 30px; padding: 30px; text-align: center; align-items: center;">
                <span style="font-size: 30px; color: #38bdf8; font-weight: bold; margin-bottom: 8px;">🏛️ الوجهة</span>
                <span style="font-size: 28px; color: white; font-weight: bold;">${destination}</span>
              </div>
              <div style="display: flex; flex-direction: column; flex: 1; background: rgba(15, 23, 42, 0.9); border: 2px solid rgba(56, 189, 248, 0.5); border-radius: 30px; padding: 30px; text-align: center; align-items: center;">
                <span style="font-size: 30px; color: #38bdf8; font-weight: bold; margin-bottom: 8px;">💰 الأجرة</span>
                <span style="font-size: 28px; color: #fbbf24; font-weight: bold;">${fare}</span>
              </div>
            </div>

            <!-- Link Box -->
            <div style="display: flex; flex-direction: column; background: rgba(30, 41, 59, 0.8); border: 2px solid rgba(56, 189, 248, 0.4); border-radius: 30px; padding: 30px; text-align: right;">
              <span style="font-size: 26px; color: #38bdf8; font-weight: bold; margin-bottom: 8px;">🔗 تفاصيل الخط والتواصل:</span>
              <span style="font-size: 24px; color: #cbd5e1; direction: ltr; text-align: right;">${link}</span>
            </div>
          </div>

          <!-- Story CTA Bubble -->
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #0284c7, #0369a1); border: 2px solid #38bdf8; border-radius: 35px; padding: 35px 50px; text-align: center; margin-top: 20px;">
            <span style="font-size: 36px; font-weight: bold; color: white;">💬 اسحب للأعلى أو راسلنا للتفاصيل</span>
            <span style="font-size: 26px; color: #e0f2fe; margin-top: 6px;">نتمنى لكم رحلة آمنة ومريحة ✨</span>
          </div>

          <!-- Story Footer -->
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 25px;">
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
