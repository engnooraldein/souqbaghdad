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

    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
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
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 150
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API Error: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      result = { isSafe: true, reason: 'Failed to parse OpenAI JSON response' };
    }

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
        const text = `⚠️ *تنبيه من نظام الحماية (ChatGPT):*\n\nتوقف نظام فحص الصور عن العمل أو حدث خطأ أثناء التحقق من صورة جديدة.\n\n*الخطأ:*\n\`${error.message}\`\n\nتم السماح برفع الصورة مؤقتاً لتجنب تعطيل المستخدمين. يرجى مراجعة الخطأ.`;
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
