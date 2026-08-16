import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import satori from 'npm:satori@0.10.11'
import { Resvg, initWasm } from 'npm:@resvg/resvg-wasm@2.6.2'
import { html } from "npm:satori-html@0.3.2"

let wasmInitialized = false;

const fontUrl = 'https://github.com/google/fonts/raw/main/ofl/tajawal/Tajawal-Regular.ttf'

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const title = url.searchParams.get("title") || "إعلان جديد";
    const details = url.searchParams.get("details") || "تتوفر تفاصيل الإعلان";
    
    // 1. Initialize WASM for Resvg
    if (!wasmInitialized) {
      const wasmRes = await fetch('https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm');
      const wasmBuffer = await wasmRes.arrayBuffer();
      await initWasm(wasmBuffer);
      wasmInitialized = true;
    }

    // 2. Fetch Arabic Font (Cairo)
    const fontRes = await fetch(fontUrl);
    const fontData = await fontRes.arrayBuffer();

    // 3. Create JSX/HTML Template
    const markup = html`
      <div style="display: flex; flex-direction: column; width: 1080px; height: 1920px; background-color: #0f172a; color: white; padding: 100px; justify-content: center; align-items: center; font-family: 'Tajawal', sans-serif; text-align: center;">
        <div style="display: flex; background-color: #1e293b; border-radius: 60px; padding: 100px; width: 100%; height: 100%; flex-direction: column; justify-content: center; align-items: center; border: 4px solid #38bdf8;">
          <h1 style="font-size: 80px; color: #38bdf8; margin-bottom: 80px; font-weight: bold;">سوق بغداد الرقمي</h1>
          <h2 style="font-size: 65px; color: #f8fafc; margin-bottom: 60px; line-height: 1.4; white-space: pre-wrap; text-align: center;">${title}</h2>
          <p style="font-size: 45px; color: #cbd5e1; line-height: 1.6; white-space: pre-wrap; text-align: center;">${details}</p>
          
          <div style="display: flex; margin-top: auto; font-size: 45px; color: #facc15; background-color: #334155; padding: 30px 60px; border-radius: 30px;">
            💬 رد على هذا الستوري للحصول على الرابط 💬
          </div>
        </div>
      </div>
    `;

    // 4. Render to SVG using Satori
    const svg = await satori(markup, {
      width: 1080,
      height: 1920,
      fonts: [
        {
          name: 'Tajawal',
          data: fontData,
          weight: 400,
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
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
})
