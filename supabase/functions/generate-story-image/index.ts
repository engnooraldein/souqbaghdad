import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import satori from 'npm:satori@0.10.11'
import { Resvg, initWasm } from 'npm:@resvg/resvg-wasm@2.6.2'
import { html } from "npm:satori-html@0.3.2"

let wasmInitialized = false;

const fontUrl = 'https://github.com/google/fonts/raw/main/ofl/tajawal/Tajawal-Bold.ttf'

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("type") || "post";
    const title = url.searchParams.get("title") || "خط نقل جديد في بغداد";
    const subtitle = url.searchParams.get("subtitle") || "جامعة الرافدين";
    const subdesc = url.searchParams.get("subdesc") || "خط طلاب وموظفين";
    const regions = url.searchParams.get("regions") || "صليخ 600 • سبع بكار • كريعات • حي تونس";
    const destination = url.searchParams.get("destination") || "جامعة الرافدين";
    const fare = url.searchParams.get("fare") || "حسب الاتفاق";
    const link = url.searchParams.get("link") || "https://www.souqbaghdad.store/transport";
    const shortId = url.searchParams.get("short_id") || "35AHU";

    // 4 anti-duplicate themes
    const themeIndex = Math.abs(shortId.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0)) % 4;
    const themes = [
      { bg1: '#0c1a2e', bg2: '#0a0f1e', accent: '#f59e0b', accent2: '#38bdf8' },
      { bg1: '#0b1120', bg2: '#060c1a', accent: '#a78bfa', accent2: '#60a5fa' },
      { bg1: '#0d1f14', bg2: '#071210', accent: '#34d399', accent2: '#38bdf8' },
      { bg1: '#1a0c0c', bg2: '#120606', accent: '#f87171', accent2: '#fbbf24' },
    ];
    const t = themes[themeIndex];

    // Pre-process regions as simple bullet text (NO HTML inside)
    const regionParts = regions.split(/[-،,•]/).map((r: string) => r.trim()).filter(Boolean).slice(0, 5);
    const regionLine1 = regionParts.slice(0, 2).join('  •  ');
    const regionLine2 = regionParts.slice(2, 4).join('  •  ');
    const regionLine3 = regionParts[4] || '';

    // Shorten displayed link (max 45 chars)
    const displayLink = link.length > 48 ? link.substring(0, 45) + '...' : link;

    // QR code image URL (direct - no base64)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=38bdf8&bgcolor=0f172a&margin=4&data=${encodeURIComponent(link)}`;

    // 1. Init WASM
    if (!wasmInitialized) {
      const wasmRes = await fetch('https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm');
      const wasmBuffer = await wasmRes.arrayBuffer();
      await initWasm(wasmBuffer);
      wasmInitialized = true;
    }

    // 2. Fetch Font
    const fontRes = await fetch(fontUrl);
    const fontData = await fontRes.arrayBuffer();

    const isPost = mode === "post";
    const canvasWidth = 1080;
    const canvasHeight = isPost ? 1350 : 1920;

    let markup;

    if (isPost) {
      // ====== POST 1080×1350 ======
      markup = html`
        <div style="display:flex;flex-direction:column;width:1080px;height:1350px;background:linear-gradient(145deg,${t.bg1} 0%,${t.bg2} 100%);color:white;font-family:'Tajawal',sans-serif;padding:44px 52px;box-sizing:border-box;">

          <!-- Header -->
          <div style="display:flex;justify-content:space-between;align-items:center;width:100%;border-bottom:2px solid rgba(255,255,255,0.08);padding-bottom:24px;margin-bottom:28px;">
            <div style="display:flex;flex-direction:column;">
              <span style="font-size:30px;font-weight:bold;color:${t.accent};">سوق بغداد الرقمي</span>
              <span style="font-size:15px;color:#475569;letter-spacing:2px;">SOUQ BAGHDAD</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.06);border:2px solid ${t.accent};border-radius:18px;padding:10px 22px;">
              <span style="font-size:18px;color:${t.accent};font-weight:bold;">🚌 خط جديد  #${shortId}</span>
            </div>
          </div>

          <!-- Hero Title -->
          <div style="display:flex;flex-direction:column;align-items:center;text-align:center;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.09);border-radius:28px;padding:30px 28px;margin-bottom:24px;">
            <span style="font-size:50px;font-weight:bold;color:white;line-height:1.2;">${title}</span>
            <span style="font-size:38px;font-weight:bold;color:${t.accent};margin-top:10px;">${subtitle}</span>
            <span style="font-size:22px;color:#94a3b8;margin-top:6px;">${subdesc}</span>
          </div>

          <!-- Fare — Big -->
          <div style="display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.06);border:2.5px solid ${t.accent};border-radius:22px;padding:20px 40px;margin-bottom:22px;gap:18px;">
            <span style="font-size:28px;color:${t.accent};font-weight:bold;">💰 الأجرة</span>
            <span style="font-size:52px;font-weight:bold;color:${t.accent};">${fare}</span>
          </div>

          <!-- Info Row: Regions + Destination -->
          <div style="display:flex;gap:18px;width:100%;margin-bottom:20px;">
            <!-- Regions -->
            <div style="display:flex;flex-direction:column;flex:1.6;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:22px;padding:22px 24px;">
              <span style="font-size:22px;color:${t.accent2};font-weight:bold;margin-bottom:12px;">📍 مناطق الانطلاق</span>
              <span style="font-size:21px;color:#f1f5f9;line-height:1.6;">${regionLine1}</span>
              ${regionLine2 ? `<span style="font-size:21px;color:#f1f5f9;line-height:1.6;margin-top:4px;">${regionLine2}</span>` : ''}
              ${regionLine3 ? `<span style="font-size:21px;color:#f1f5f9;line-height:1.6;margin-top:4px;">${regionLine3}</span>` : ''}
            </div>
            <!-- Destination -->
            <div style="display:flex;flex-direction:column;flex:1;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:22px;padding:22px;align-items:center;justify-content:center;text-align:center;">
              <span style="font-size:22px;color:${t.accent2};font-weight:bold;margin-bottom:10px;">🏛️ الوجهة</span>
              <span style="font-size:28px;color:white;font-weight:bold;">${destination}</span>
            </div>
          </div>

          <!-- Link + QR -->
          <div style="display:flex;align-items:center;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:22px;padding:18px 24px;margin-bottom:22px;gap:18px;">
            <div style="display:flex;flex-direction:column;flex:1;">
              <span style="font-size:20px;color:${t.accent2};font-weight:bold;margin-bottom:4px;">🔗 رابط التفاصيل والحجز</span>
              <span style="font-size:17px;color:#94a3b8;direction:ltr;text-align:right;">${displayLink}</span>
            </div>
            <img src="${qrUrl}" style="width:92px;height:92px;border-radius:10px;border:2px solid ${t.accent}44;" />
          </div>

          <!-- Trust Badges -->
          <div style="display:flex;justify-content:space-around;width:100%;border-top:1px solid rgba(255,255,255,0.08);border-bottom:1px solid rgba(255,255,255,0.08);padding:14px 0;margin-bottom:22px;">
            <span style="font-size:18px;color:#64748b;">🛡️ رحلات آمنة</span>
            <span style="font-size:18px;color:#64748b;">💺 سيارات حديثة</span>
            <span style="font-size:18px;color:#64748b;">⏰ التزام بالمواعيد</span>
          </div>

          <!-- Footer -->
          <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
            <span style="font-size:20px;color:${t.accent};font-weight:bold;">📸 @souqbaghdad_lines</span>
            <span style="font-size:18px;color:#475569;">منصة سوق بغداد الرقمية 🇮🇶</span>
          </div>

        </div>
      `;

    } else {
      // ====== STORY 1080×1920 ======
      markup = html`
        <div style="display:flex;flex-direction:column;width:1080px;height:1920px;background:linear-gradient(145deg,${t.bg1} 0%,${t.bg2} 100%);color:white;font-family:'Tajawal',sans-serif;padding:80px 70px;box-sizing:border-box;">

          <!-- Header -->
          <div style="display:flex;justify-content:space-between;align-items:center;width:100%;border-bottom:2px solid rgba(255,255,255,0.08);padding-bottom:32px;margin-bottom:50px;">
            <div style="display:flex;flex-direction:column;">
              <span style="font-size:38px;font-weight:bold;color:${t.accent};">سوق بغداد الرقمي</span>
              <span style="font-size:20px;color:#475569;letter-spacing:2px;">SOUQ BAGHDAD</span>
            </div>
            <div style="display:flex;align-items:center;background:rgba(255,255,255,0.06);border:2px solid ${t.accent};border-radius:22px;padding:14px 28px;">
              <span style="font-size:22px;color:${t.accent};font-weight:bold;">🚌 خط جديد  #${shortId}</span>
            </div>
          </div>

          <!-- Hero -->
          <div style="display:flex;flex-direction:column;align-items:center;text-align:center;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.09);border-radius:36px;padding:42px 36px;margin-bottom:42px;">
            <span style="font-size:64px;font-weight:bold;color:white;line-height:1.2;">${title}</span>
            <span style="font-size:50px;font-weight:bold;color:${t.accent};margin-top:14px;">${subtitle}</span>
            <span style="font-size:32px;color:#94a3b8;margin-top:10px;">${subdesc}</span>
          </div>

          <!-- Fare Hero -->
          <div style="display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.06);border:3px solid ${t.accent};border-radius:30px;padding:28px 50px;margin-bottom:38px;gap:22px;">
            <span style="font-size:36px;color:${t.accent};font-weight:bold;">💰 الأجرة</span>
            <span style="font-size:66px;font-weight:bold;color:${t.accent};">${fare}</span>
          </div>

          <!-- Regions -->
          <div style="display:flex;flex-direction:column;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:32px;padding:36px 42px;margin-bottom:30px;">
            <span style="font-size:30px;color:${t.accent2};font-weight:bold;margin-bottom:16px;">📍 مناطق الانطلاق</span>
            <span style="font-size:28px;color:#f1f5f9;line-height:1.7;">${regionLine1}</span>
            ${regionLine2 ? `<span style="font-size:28px;color:#f1f5f9;line-height:1.7;margin-top:6px;">${regionLine2}</span>` : ''}
            ${regionLine3 ? `<span style="font-size:28px;color:#f1f5f9;line-height:1.7;margin-top:6px;">${regionLine3}</span>` : ''}
          </div>

          <!-- Destination + QR -->
          <div style="display:flex;gap:24px;width:100%;margin-bottom:30px;">
            <div style="display:flex;flex-direction:column;flex:1;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:32px;padding:34px;align-items:center;justify-content:center;text-align:center;">
              <span style="font-size:28px;color:${t.accent2};font-weight:bold;margin-bottom:10px;">🏛️ الوجهة</span>
              <span style="font-size:36px;color:white;font-weight:bold;">${destination}</span>
            </div>
            <div style="display:flex;flex-direction:column;background:rgba(255,255,255,0.04);border:1.5px solid ${t.accent}44;border-radius:32px;padding:24px;align-items:center;justify-content:center;">
              <img src="${qrUrl}" style="width:130px;height:130px;border-radius:14px;" />
              <span style="font-size:18px;color:#64748b;margin-top:10px;">امسح للتفاصيل</span>
            </div>
          </div>

          <!-- Link -->
          <div style="display:flex;flex-direction:column;background:rgba(255,255,255,0.03);border:1.5px solid rgba(255,255,255,0.08);border-radius:28px;padding:28px 36px;margin-bottom:30px;">
            <span style="font-size:26px;color:${t.accent2};font-weight:bold;margin-bottom:8px;">🔗 رابط تفاصيل الخط</span>
            <span style="font-size:22px;color:#94a3b8;direction:ltr;text-align:right;">${displayLink}</span>
          </div>

          <!-- CTA -->
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;background:${t.accent};border-radius:36px;padding:36px 56px;text-align:center;margin-bottom:36px;">
            <span style="font-size:36px;font-weight:bold;color:#0f172a;">💬 راسلنا الآن للتفاصيل والحجز</span>
            <span style="font-size:24px;color:#0f172a;margin-top:8px;opacity:0.75;">نتمنى لكم رحلة آمنة ومريحة ✨</span>
          </div>

          <!-- Footer -->
          <div style="display:flex;justify-content:space-between;align-items:center;width:100%;border-top:1px solid rgba(255,255,255,0.08);padding-top:26px;">
            <span style="font-size:28px;color:${t.accent};font-weight:bold;">📸 @souqbaghdad_lines</span>
            <span style="font-size:22px;color:#475569;">سوق بغداد الرقمية 🇮🇶</span>
          </div>

        </div>
      `;
    }

    // Render
    const svg = await satori(markup, {
      width: canvasWidth,
      height: canvasHeight,
      fonts: [{ name: 'Tajawal', data: fontData, weight: 700, style: 'normal' }],
    });

    const resvg = new Resvg(svg, { fitTo: { mode: 'original' } });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return new Response(pngBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      },
    });

  } catch (error: any) {
    console.error('generate-story-image error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
})
