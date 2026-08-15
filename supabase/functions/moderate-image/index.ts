import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageBase64 } = await req.json()
    
    const isEnabled = Deno.env.get('ENABLE_IMAGE_MODERATION') === 'true'
    
    // If feature is disabled, bypass moderation
    if (!isEnabled) {
      return new Response(JSON.stringify({ isSafe: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!imageBase64) {
      return new Response(JSON.stringify({ isSafe: false, reason: "لم يتم توفير صورة." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY is not set.")
    }

    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const payload = {
      contents: [{
        parts: [
          { text: "حلل هذه الصورة بدقة شديدة. هل تحتوي على أي من الممنوعات التالية: (1) عري أو محتوى جنسي (2) سجائر، تدخين، أرجيلة، أو سجائر إلكترونية بجميع أنواعها (3) أدوية، حبوب طبية، مخدرات، أو كحول (4) أسلحة، عنف، أو دماء. يجب أن يكون الرد عبارة عن ملف JSON صالح فقط يحتوي على مفتاحين: isSafe (قيمة منطقية false إذا كان هناك أي ممنوعات، و true إذا كانت الصورة آمنة تماماً) و reason (شرح قصير باللغة العربية لسبب الرفض إذا كانت isSafe تساوي false، أو نص فارغ إذا كانت آمنة)." },
          { inline_data: { mime_type: "image/jpeg", data: base64Data } }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 1,
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error: ${errText}`);
    }

    const data = await response.json();

    if (data.candidates?.[0]?.finishReason === 'SAFETY') {
      return new Response(JSON.stringify({ isSafe: false, reason: "الصورة تحتوي على محتوى مخالف لشروط السلامة وتم حظرها بواسطة النظام." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up potential markdown formatting in JSON response
    textResult = textResult.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    let result = { isSafe: false, reason: "فشل في تحليل محتوى الصورة." };
    if (textResult) {
      try {
        result = JSON.parse(textResult);
      } catch (e) {
        console.warn("Could not parse Gemini response as JSON:", textResult);
        result = { isSafe: true, reason: "" }; // Allow if it was just a weirdly formatted text that didn't trip safety
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Moderation error:', error)
    
    // SEND TELEGRAM ALERT ON FAILURE
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
    // Notify the product channel or fallback if not provided
    const notifyChannel = Deno.env.get('PRODUCT_CHANNEL_ID') || '@souqbaghdad_iq'; 
    if (botToken && notifyChannel) {
      const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const msg = `⚠️ <b>تنبيه من نظام الحماية (Gemini):</b>\n\nتوقف نظام فحص الصور عن العمل أو حدث خطأ أثناء التحقق من صورة جديدة.\n\n<b>الخطأ:</b>\n<code>${error.message}</code>\n\n<i>تم السماح برفع الصورة مؤقتاً لتجنب تعطيل المستخدمين. يرجى مراجعة الخطأ.</i>`;
      fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: notifyChannel, text: msg, parse_mode: 'HTML' })
      }).catch(e => console.error("Failed to send telegram alert:", e));
    }

    // FALLBACK: ALLOW UPLOAD IF GEMINI CRASHES
    return new Response(JSON.stringify({ isSafe: true, fallback: true, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
