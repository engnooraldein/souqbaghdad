import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = (Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) ?? "";
const BOT_TOKEN = (Deno.env.get("TELEGRAM_BOT_TOKEN") ?? Deno.env.get("BOT_TOKEN")) ?? "";
const GENERAL_CHANNEL = (Deno.env.get("PRODUCT_CHANNEL_ID") ?? Deno.env.get("GENERAL_CHANNEL")) ?? "-1004381673206";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const FB_ACCESS_TOKEN = Deno.env.get("FB_ACCESS_TOKEN") ?? "";
const FB_PAGE_ID = Deno.env.get("FB_PAGE_ID") ?? "";

const sendFacebookPost = async (message: string, imageUrl?: string) => {
  if (!FB_ACCESS_TOKEN || !FB_PAGE_ID) return;
  try {
    let url = `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/feed`;
    let body: any = { message, access_token: FB_ACCESS_TOKEN };
    
    if (imageUrl) {
      url = `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/photos`;
      body = { caption: message, url: imageUrl, access_token: FB_ACCESS_TOKEN };
    }
    
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.error) {
      console.error("Facebook API Error:", data.error);
    }
  } catch (err) {
    console.error("Facebook Fetch Error:", err);
  }
};

const sendTelegramPhoto = async (chatId: string, photoUrl: string, caption: string) => {
  if (!BOT_TOKEN) return;
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption: caption, disable_web_page_preview: true })
  });
};

serve(async (req) => {
  try {
    console.log("Starting Auto Publisher...");

    // 1. اختيار أفضل 3 إعلانات متميزة أو حديثة النشاط
    const { data: topAds, error } = await supabase
      .from("ads")
      .select("*")
      .eq("status", "active")
      .order("views_count", { ascending: false })
      .limit(3);

    if (error || !topAds || topAds.length === 0) {
      return new Response(JSON.stringify({ message: "No active ads found" }), { status: 200 });
    }

    for (const ad of topAds) {
      let smartCaption = `🛍️ **إعلان مميز اليوم في سوق بغداد**\n\n📌 ${ad.title}\n💰 السعر: ${ad.price || 'غير محدد'} د.ع\n📍 ${ad.location || ad.city || 'بغداد'}\n\n🔗 تفاصيل الإعلان والشراء:\nhttps://souqbaghdad.store/product/${ad.short_id || ad.id}\n\n#سوق_بغداد #العراق #تجارة #إعلانات`;

      // كتابة وصف إبداعي وجذاب بـ Gemini الذكاء الاصطناعي
      if (GEMINI_API_KEY) {
        try {
          const aiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: `اكتب منشور تسويقي قصير وجذاب جداً باللغة العربية والعامية العراقية للإعلان التالي لمنصات التواصل الاجتماعي:\nالعنوان: ${ad.title}\nالسعر: ${ad.price}\nالفئة: ${ad.category}\nالموقع: ${ad.city || 'بغداد'}\nضع هاشتاقات ممتازة ورابط الموقع https://souqbaghdad.store/product/${ad.short_id || ad.id}`
                      }
                    ]
                  }
                ]
              })
            }
          );
          const aiData = await aiRes.json();
          const generatedCaption = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedCaption) {
            smartCaption = generatedCaption;
          }
        } catch (e) {
          console.error("AI Caption error:", e);
        }
      }

      // نشر المنشور مع الصورة على قنوات تيليكرام وفيسبوك
      if (ad.images && ad.images.length > 0) {
        await sendTelegramPhoto(GENERAL_CHANNEL, ad.images[0], smartCaption);
        await sendFacebookPost(smartCaption, ad.images[0]);
      }
    }

    return new Response(JSON.stringify({ success: true, published_count: topAds.length }), { status: 200 });
  } catch (err: any) {
    console.error("Error in auto-publisher:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
