import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const prompt = `You are a strict image moderation assistant. Analyze this image and determine if it contains any of the following prohibited content:
1. Cigarettes, vapes, hookahs, or any smoking-related products
2. Medicines, drugs, or medical equipment
3. Weapons or firearms
4. Nudity or sexually explicit content
5. Graphic violence or gore

Respond strictly in JSON format with two fields:
{
  "isSafe": boolean (false if any prohibited content is found, true otherwise),
  "reason": string (short explanation in Arabic of what was found, or "آمن" if safe)
}`;

    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: imageBase64
            }
          }
        ]
      }],
      generationConfig: {
        response_mime_type: "application/json",
      }
    };

    let response;
    
    // Check if the key is an OAuth token (starts with AQ. or ya29.) or a standard API key (AIza)
    if (geminiKey.startsWith('AQ.') || geminiKey.startsWith('ya29.')) {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${geminiKey}`
        },
        body: JSON.stringify(payload)
      });
    } else {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error: ${errText}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let result;
    try {
      result = JSON.parse(textContent);
    } catch (e) {
      result = { isSafe: true, reason: 'Failed to parse Gemini JSON response' };
    }

    // Ensure the fallback behavior triggers for unsafe images instead of returning 'safe' when AI marks it unsafe
    // If the image is not safe, we STILL want the UI to catch it.
    // The previous code returned a 200 OK with { isSafe: false, reason: "..." }
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in moderate-image:', error.message);
    
    // Send alert to Telegram Admin Channel
    try {
      const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
      const adminChatId = Deno.env.get('ADMIN_CHAT_ID');
      if (botToken && adminChatId) {
        const text = `⚠️ *تنبيه من نظام الحماية (Gemini Pro):*\n\nتوقف نظام فحص الصور عن العمل أو حدث خطأ أثناء التحقق من صورة جديدة.\n\n*الخطأ:*\n\`${error.message}\`\n\nتم السماح برفع الصورة مؤقتاً لتجنب تعطيل المستخدمين. يرجى مراجعة الخطأ.`;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: adminChatId, text: text, parse_mode: 'Markdown' })
        });
      }
    } catch (telegramError) {
      console.error('Failed to send Telegram alert:', telegramError.message);
    }

    // Fallback: allow upload if AI fails
    return new Response(JSON.stringify({ isSafe: true, reason: 'Error occurred during moderation. Allowed as fallback.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
