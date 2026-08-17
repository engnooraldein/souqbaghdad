import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import satori from 'npm:satori@0.10.11'
import { Resvg, initWasm } from 'npm:@resvg/resvg-wasm@2.6.2'
import { html } from "npm:satori-html@0.3.2"

let wasmInitialized = false;

const fontUrl = 'https://github.com/google/fonts/raw/main/ofl/tajawal/Tajawal-Bold.ttf'

// Generate mini QR code SVG as inline data URL (simple pattern – real URLs done via external API)
async function fetchQrSvg(link: string): Promise<string> {
  try {
    const res = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=160x160&format=svg&data=${encodeURIComponent(link)}&color=38bdf8&bgcolor=0f172a&margin=4`);
    if (!res.ok) return '';
    const svg = await res.text();
    const b64 = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${b64}`;
  } catch {
    return '';
  }
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("type") || "post";
    const title = url.searchParams.get("title") || "خط نقل جديد في بغداد";
    const subtitle = url.searchParams.get("subtitle") || "جامعة الرافدين";
    const subdesc = url.searchParams.get("subdesc") || "خط طلاب وموظفين";
    const regions = url.searchParams.get("regions") || "صليخ 600 - سبع بكار - كريعات - حي تونس";
    const destination = url.searchParams.get("destination") || "جامعة الرافدين";
    const fare = url.searchParams.get("fare") || "حسب الاتفاق";
    const link = url.searchParams.get("link") || "https://www.souqbaghdad.store/transport";
    const shortId = url.searchParams.get("short_id") || "35AHU";

    // 4 premium anti-spam themes: each ad gets a unique gradient based on its ID
    const themeIndex = Math.abs((shortId.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0)) % 4);
    const themes = [
      { bg: 'linear-gradient(145deg, #0c1a2e 0%, #0a0f1e 50%, #0d1f38 100%)', accent: '#f59e0b', accent2: '#38bdf8', glow: 'rgba(245,158,11,0.18)' },
      { bg: 'linear-gradient(145deg, #0b1120 0%, #060c1a 50%, #0e1830 100%)', accent: '#a78bfa', accent2: '#60a5fa', glow: 'rgba(167,139,250,0.18)' },
      { bg: 'linear-gradient(145deg, #0d1f14 0%, #071210 50%, #0c1d1a 100%)', accent: '#34d399', accent2: '#38bdf8', glow: 'rgba(52,211,153,0.18)' },
      { bg: 'linear-gradient(145deg, #1a0c0c 0%, #120606 50%, #1e0d0d 100%)', accent: '#f87171', accent2: '#fbbf24', glow: 'rgba(248,113,113,0.18)' },
    ];
    const theme = themes[themeIndex];

    // Iraqi eagle SVG logo (simplified vector)
    const eagleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" width="64" height="52"><g fill="${theme.accent}" opacity="0.95"><ellipse cx="50" cy="45" rx="18" ry="14"/><path d="M50 25 C44 30 32 30 20 22 C25 35 35 40 50 38 C65 40 75 35 80 22 C68 30 56 30 50 25Z"/><path d="M50 38 L42 65 L50 60 L58 65 Z" fill="${theme.accent2}"/><circle cx="43" cy="39" r="3" fill="#1a1a2e"/><circle cx="57" cy="39" r="3" fill="#1a1a2e"/><path d="M20 22 C15 20 8 25 5 30 C12 28 18 26 20 22Z"/><path d="M80 22 C82 18 88 22 95 28 C92 26 84 24 80 22Z"/><path d="M42 65 L36 72 L42 70 Z" fill="${theme.accent}"/><path d="M58 65 L64 72 L58 70 Z" fill="${theme.accent}"/></g></svg>`;
    const eagleB64 = `data:image/svg+xml;base64,${btoa(eagleSvg)}`;

    // QR code
    const qrDataUrl = await fetchQrSvg(link);

    // Format regions as bullet list
    const regionItems = regions.split(/[-،,]/).map(r => r.trim()).filter(Boolean);

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
      // === INSTAGRAM POST 1080×1350 — PREMIUM ===
      markup = html`
        <div style="display:flex;flex-direction:column;width:1080px;height:1350px;background:${theme.bg};color:white;font-family:'Tajawal',sans-serif;box-sizing:border-box;padding:40px 50px;position:relative;overflow:hidden;">
          
          <!-- Decorative glowing orb top-right -->
          <div style="display:flex;position:absolute;top:-120px;right:-120px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,${theme.glow} 0%,transparent 70%);pointer-events:none;"></div>
          <div style="display:flex;position:absolute;bottom:-80px;left:-80px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,${theme.glow} 0%,transparent 70%);pointer-events:none;"></div>

          <!-- HEADER -->
          <div style="display:flex;justify-content:space-between;align-items:center;width:100%;margin-bottom:28px;">
            <!-- Logo + Eagle -->
            <div style="display:flex;align-items:center;gap:14px;">
              <img src="${eagleB64}" style="width:56px;height:46px;object-fit:contain;" />
              <div style="display:flex;flex-direction:column;">
                <span style="font-size:28px;font-weight:bold;color:${theme.accent};line-height:1.1;">سوق بغداد الرقمي</span>
                <span style="font-size:15px;color:#64748b;letter-spacing:2px;">SOUQ BAGHDAD</span>
              </div>
            </div>
            <!-- Badge -->
            <div style="display:flex;flex-direction:column;align-items:center;background:linear-gradient(135deg,${theme.accent}22,${theme.accent}11);border:2px solid ${theme.accent};border-radius:20px;padding:10px 24px;">
              <span style="font-size:13px;color:${theme.accent};letter-spacing:1px;">🚌 خط نقل جديد</span>
              <span style="font-size:20px;font-weight:bold;color:white;">#${shortId}</span>
            </div>
          </div>

          <!-- HERO TITLE -->
          <div style="display:flex;flex-direction:column;align-items:center;text-align:center;background:linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02));border:1px solid rgba(255,255,255,0.08);border-radius:28px;padding:28px 30px;margin-bottom:22px;">
            <span style="font-size:54px;font-weight:bold;color:white;line-height:1.2;">${title}</span>
            <span style="font-size:40px;font-weight:bold;color:${theme.accent};margin-top:8px;">${subtitle}</span>
            <span style="font-size:24px;color:#94a3b8;margin-top:6px;">${subdesc}</span>
          </div>

          <!-- FARE — Big Bold Prominent -->
          <div style="display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,${theme.accent}30,${theme.accent}15);border:2.5px solid ${theme.accent};border-radius:24px;padding:22px 40px;margin-bottom:22px;gap:20px;">
            <span style="font-size:30px;color:${theme.accent};font-weight:bold;">💰 الأجرة</span>
            <span style="font-size:52px;font-weight:bold;color:${theme.accent};">${fare}</span>
          </div>

          <!-- INFO CARDS ROW -->
          <div style="display:flex;gap:18px;width:100%;margin-bottom:20px;">
            <!-- Regions -->
            <div style="display:flex;flex-direction:column;flex:1.5;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:22px;padding:20px 22px;backdrop-filter:blur(12px);">
              <span style="font-size:22px;color:${theme.accent2};font-weight:bold;margin-bottom:10px;">📍 مناطق الانطلاق</span>
              ${regionItems.slice(0, 5).map((r: string) => `
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                  <div style="display:flex;width:6px;height:6px;border-radius:50%;background:${theme.accent};flex-shrink:0;"></div>
                  <span style="font-size:20px;color:#f1f5f9;">${r}</span>
                </div>
              `).join('')}
            </div>
            <!-- Destination -->
            <div style="display:flex;flex-direction:column;flex:1;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:22px;padding:20px 22px;align-items:center;justify-content:center;text-align:center;backdrop-filter:blur(12px);">
              <span style="font-size:22px;color:${theme.accent2};font-weight:bold;margin-bottom:10px;">🏛️ الوجهة</span>
              <span style="font-size:26px;color:white;font-weight:bold;line-height:1.3;">${destination}</span>
            </div>
          </div>

          <!-- LINK + QR ROW -->
          <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:22px;padding:18px 24px;margin-bottom:20px;gap:16px;">
            <div style="display:flex;flex-direction:column;flex:1;">
              <span style="font-size:20px;color:${theme.accent2};font-weight:bold;margin-bottom:4px;">🔗 رابط التفاصيل والتواصل:</span>
              <span style="font-size:17px;color:#94a3b8;direction:ltr;text-align:right;">${link}</span>
            </div>
            ${qrDataUrl ? `<img src="${qrDataUrl}" style="width:90px;height:90px;border-radius:12px;border:2px solid ${theme.accent}44;" />` : `<div style="display:flex;width:90px;height:90px;border-radius:12px;background:${theme.accent}22;border:2px solid ${theme.accent};align-items:center;justify-content:center;"><span style="font-size:28px;">📲</span></div>`}
          </div>

          <!-- TRUST BADGES -->
          <div style="display:flex;justify-content:space-around;width:100%;border-top:1px solid rgba(255,255,255,0.08);border-bottom:1px solid rgba(255,255,255,0.08);padding:14px 0;margin-bottom:20px;">
            <span style="font-size:18px;color:#64748b;">🛡️ رحلات آمنة</span>
            <span style="font-size:18px;color:#64748b;">💺 سيارات حديثة</span>
            <span style="font-size:18px;color:#64748b;">⏰ التزام بالمواعيد</span>
          </div>

          <!-- FOOTER -->
          <div style="display:flex;justify-content:space-between;align-items:center;width:100%;">
            <span style="font-size:20px;color:${theme.accent};font-weight:bold;">📸 @souqbaghdad_lines</span>
            <span style="font-size:18px;color:#475569;">منصة سوق بغداد الرقمية 🇮🇶</span>
          </div>
        </div>
      `;
    } else {
      // === INSTAGRAM STORY 1080×1920 — PREMIUM ===
      markup = html`
        <div style="display:flex;flex-direction:column;width:1080px;height:1920px;background:${theme.bg};color:white;font-family:'Tajawal',sans-serif;box-sizing:border-box;padding:80px 70px;position:relative;overflow:hidden;">

          <!-- Decorative orbs -->
          <div style="display:flex;position:absolute;top:-150px;right:-150px;width:550px;height:550px;border-radius:50%;background:radial-gradient(circle,${theme.glow} 0%,transparent 70%);pointer-events:none;"></div>
          <div style="display:flex;position:absolute;bottom:-150px;left:-150px;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,${theme.glow} 0%,transparent 70%);pointer-events:none;"></div>

          <!-- HEADER -->
          <div style="display:flex;justify-content:space-between;align-items:center;width:100%;margin-bottom:50px;">
            <div style="display:flex;align-items:center;gap:18px;">
              <img src="${eagleB64}" style="width:72px;height:58px;object-fit:contain;" />
              <div style="display:flex;flex-direction:column;">
                <span style="font-size:36px;font-weight:bold;color:${theme.accent};">سوق بغداد الرقمي</span>
                <span style="font-size:18px;color:#64748b;letter-spacing:2px;">SOUQ BAGHDAD</span>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;background:${theme.accent}22;border:2px solid ${theme.accent};border-radius:24px;padding:14px 32px;">
              <span style="font-size:16px;color:${theme.accent};letter-spacing:1px;">🚌 خط نقل جديد</span>
              <span style="font-size:24px;font-weight:bold;color:white;">#${shortId}</span>
            </div>
          </div>

          <!-- HERO TITLE -->
          <div style="display:flex;flex-direction:column;align-items:center;text-align:center;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:36px;padding:40px 36px;margin-bottom:40px;">
            <span style="font-size:66px;font-weight:bold;color:white;line-height:1.2;">${title}</span>
            <span style="font-size:52px;font-weight:bold;color:${theme.accent};margin-top:14px;">${subtitle}</span>
            <span style="font-size:34px;color:#94a3b8;margin-top:10px;">${subdesc}</span>
          </div>

          <!-- FARE — Hero Size -->
          <div style="display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,${theme.accent}35,${theme.accent}18);border:3px solid ${theme.accent};border-radius:32px;padding:30px 50px;margin-bottom:40px;gap:24px;">
            <span style="font-size:38px;color:${theme.accent};font-weight:bold;">💰 الأجرة</span>
            <span style="font-size:68px;font-weight:bold;color:${theme.accent};">${fare}</span>
          </div>

          <!-- REGIONS CARD -->
          <div style="display:flex;flex-direction:column;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:32px;padding:38px 42px;margin-bottom:30px;backdrop-filter:blur(12px);">
            <span style="font-size:32px;color:${theme.accent2};font-weight:bold;margin-bottom:18px;">📍 مناطق الانطلاق</span>
            ${regionItems.slice(0, 5).map((r: string) => `
              <div style="display:flex;align-items:center;gap:14px;margin-bottom:10px;">
                <div style="display:flex;width:8px;height:8px;border-radius:50%;background:${theme.accent};flex-shrink:0;"></div>
                <span style="font-size:28px;color:#f1f5f9;">${r}</span>
              </div>
            `).join('')}
          </div>

          <!-- DESTINATION + QR ROW -->
          <div style="display:flex;gap:24px;width:100%;margin-bottom:32px;">
            <div style="display:flex;flex-direction:column;flex:1;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:32px;padding:34px;align-items:center;justify-content:center;text-align:center;backdrop-filter:blur(12px);">
              <span style="font-size:30px;color:${theme.accent2};font-weight:bold;margin-bottom:10px;">🏛️ الوجهة</span>
              <span style="font-size:34px;color:white;font-weight:bold;line-height:1.3;">${destination}</span>
            </div>
            <div style="display:flex;flex-direction:column;background:rgba(255,255,255,0.04);border:1.5px solid ${theme.accent}44;border-radius:32px;padding:24px;align-items:center;justify-content:center;">
              ${qrDataUrl ? `<img src="${qrDataUrl}" style="width:130px;height:130px;border-radius:16px;" />` : `<div style="display:flex;width:130px;height:130px;align-items:center;justify-content:center;font-size:56px;">📲</div>`}
              <span style="font-size:18px;color:#94a3b8;margin-top:8px;">امسح للتفاصيل</span>
            </div>
          </div>

          <!-- LINK BOX -->
          <div style="display:flex;flex-direction:column;background:rgba(255,255,255,0.03);border:1.5px solid rgba(255,255,255,0.1);border-radius:28px;padding:28px 36px;margin-bottom:30px;">
            <span style="font-size:28px;color:${theme.accent2};font-weight:bold;margin-bottom:8px;">🔗 رابط تفاصيل الخط:</span>
            <span style="font-size:23px;color:#94a3b8;direction:ltr;text-align:right;">${link}</span>
          </div>

          <!-- CTA BUTTON -->
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,${theme.accent},${theme.accent2});border-radius:36px;padding:36px 56px;text-align:center;margin-bottom:36px;">
            <span style="font-size:38px;font-weight:bold;color:#0f172a;">💬 راسلنا الآن للتفاصيل والحجز</span>
            <span style="font-size:26px;color:#0f172a;margin-top:8px;opacity:0.8;">نتمنى لكم رحلة آمنة ومريحة ✨</span>
          </div>

          <!-- FOOTER -->
          <div style="display:flex;justify-content:space-between;align-items:center;width:100%;border-top:1px solid rgba(255,255,255,0.1);padding-top:28px;">
            <span style="font-size:28px;color:${theme.accent};font-weight:bold;">📸 @souqbaghdad_lines</span>
            <span style="font-size:24px;color:#475569;">سوق بغداد الرقمية 🇮🇶</span>
          </div>
        </div>
      `;
    }

    // Render to SVG → PNG
    const svg = await satori(markup, {
      width: canvasWidth,
      height: canvasHeight,
      fonts: [{
        name: 'Tajawal',
        data: fontData,
        weight: 700,
        style: 'normal',
      }],
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
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
})
