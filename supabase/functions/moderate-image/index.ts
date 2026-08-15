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
          { text: "Analyze this image. Does it contain any prohibited content? Prohibited content includes: Nudity or sexual content, Smoking, tobacco, e-cigarettes, Alcohol or drugs, Weapons or violence, Any illegal or highly inappropriate items. Respond ONLY with a valid JSON in this format: {\"isSafe\": boolean, \"reason\": \"short explanation in Arabic if false\"}" },
          { inline_data: { mime_type: "image/jpeg", data: base64Data } }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 1,
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
    let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up potential markdown formatting in JSON response
    textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let result = { isSafe: true, reason: "" };
    try {
      result = JSON.parse(textResult);
    } catch (e) {
      console.warn("Could not parse Gemini response as JSON:", textResult);
      // If we can't parse it but it didn't crash, we'll assume safe to not block users erroneously
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
