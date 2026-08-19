// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = (Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) ?? "";
const BOT_TOKEN = (Deno.env.get("TELEGRAM_BOT_TOKEN") ?? Deno.env.get("BOT_TOKEN")) ?? "";
const GENERAL_CHANNEL = (Deno.env.get("PRODUCT_CHANNEL_ID") ?? Deno.env.get("GENERAL_CHANNEL")) ?? "-1004381673206";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const FB_ACCESS_TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN") || Deno.env.get("FB_ACCESS_TOKEN") || "";
const FB_PAGE_ID = Deno.env.get("META_PAGE_ID") || Deno.env.get("FB_PAGE_ID") || "";

const THREADS_USER_ID = Deno.env.get("THREADS_USER_ID") || "28119436894335542";
const THREADS_ACCESS_TOKEN = Deno.env.get("THREADS_ACCESS_TOKEN") || "";

// ── 1. النشر على Facebook ──
const sendFacebookPost = async (message: string, imageUrl?: string) => {
  if (!FB_ACCESS_TOKEN || !FB_PAGE_ID) return;
  try {
    let url = `https://graph.facebook.com/v21.0/${FB_PAGE_ID}/feed`;
    let body: any = { message, access_token: FB_ACCESS_TOKEN };
    
    if (imageUrl) {
      url = `https://graph.facebook.com/v21.0/${FB_PAGE_ID}/photos`;
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
    } else {
      console.log("Facebook Post Published:", data.id);
    }
  } catch (err) {
    console.error("Facebook Fetch Error:", err);
  }
};

// ── 2. النشر على Threads ──
const sendThreadsPost = async (message: string, imageUrl?: string) => {
  if (!THREADS_ACCESS_TOKEN || !THREADS_USER_ID) return;
  try {
    let containerUrl = `https://graph.threads.net/v1.0/${THREADS_USER_ID}/threads`;
    let params = new URLSearchParams();
    params.append('access_token', THREADS_ACCESS_TOKEN);
    params.append('text', message);

    if (imageUrl) {
      params.append('media_type', 'IMAGE');
      params.append('image_url', imageUrl);
    } else {
      params.append('media_type', 'TEXT');
    }

    const cRes = await fetch(`${containerUrl}?${params.toString()}`, { method: 'POST' });
    const cData = await cRes.json();

    if (cData.id) {
      // نشر الحاوية (Publish)
      const pUrl = `https://graph.threads.net/v1.0/${THREADS_USER_ID}/threads_publish?creation_id=${cData.id}&access_token=${encodeURIComponent(THREADS_ACCESS_TOKEN)}`;
      const pRes = await fetch(pUrl, { method: 'POST' });
      const pData = await pRes.json();
      console.log("Threads Post Published Successfully:", pData.id);
    } else {
      console.error("Threads Container Error:", cData);
    }
  } catch (err) {
    console.error("Threads Publish Error:", err);
  }
};

// ── 3. النشر على Telegram Channel ──
const sendTelegramPhoto = async (chatId: string, photoUrl: string, caption: string) => {
  if (!BOT_TOKEN) return;
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption: caption, disable_web_page_preview: true })
    });
  } catch (err) {
    console.error("Telegram Send Error:", err);
  }
};

serve(async (req: any) => {
  try {
    console.log("Starting Auto Publisher across Telegram, Facebook & Threads...");

    // اختيار أفضل الإعلانات النشطة
    const { data: topAds, error } = await supabase
      .from("ads")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(3);

    if (error || !topAds || topAds.length === 0) {
      return new Response(JSON.stringify({ message: "No active ads found" }), { status: 200 });
    }

    for (const ad of topAds) {
      let smartCaption = `🚗 ${ad.title}\n💰 السعر: ${ad.price || 'حسب الاتفاق'} د.ع\n📍 ${ad.location || ad.city || 'بغداد'}\n\n🔗 تفاصيل الإعلان والتواصل مع البائع:\nhttps://www.souqbaghdad.store/product/${ad.short_id || ad.id}\n\n#سوق_بغداد #العراق #سيارات_للبيع #بغداد`;
      
      let specsText = '';
      let conditionText = '';
      if (ad.category === 'vehicles' || ad.category === 'cars' || ad.category === 'car' || (ad.category || '').toLowerCase().includes('car')) {
        let carSpecs: any = {};
        try {
          carSpecs = typeof ad.description === 'string' && ad.description.startsWith('{') 
            ? JSON.parse(ad.description) 
            : { note: ad.description };
        } catch(e) {
          carSpecs = { note: ad.description };
        }
        const year = carSpecs.year || '';
        const mileage = carSpecs.mileage ? `${parseInt(carSpecs.mileage).toLocaleString('en-US')} كم` : '';
        const origin = carSpecs.origin || '';
        const note = carSpecs.note || carSpecs.description || '';
        specsText = `سنة الصنع: ${year}\nالمسافة المقطوعة: ${mileage}\nالمواصفات: ${origin}\nالتفاصيل: ${note}`;
      } else {
        let descText = ad.description || '';
        if (typeof descText === 'string' && descText.startsWith('{')) {
          try {
            const p = JSON.parse(descText);
            descText = p.note || p.description || p.details || '';
          } catch(e){}
        }
        conditionText = ad.condition === 'new' ? 'الحالة: جديد ✨' : (ad.condition === 'used' ? 'الحالة: مستعمل 👌' : '');
        specsText = `التفاصيل: ${descText}`;
      }
      const rawPhone = ad.phone || '';

      // كتابة وصف تسويقي ذكي بالذكاء الاصطناعي
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
                        text: `اكتب منشور تسويقي قصير وجذاب جداً بالعامية العراقية لمنصات التواصل الاجتماعي (Facebook, Threads, Telegram):
العنوان: ${ad.title}
${conditionText ? conditionText + '\n' : ''}${specsText}
السعر: ${ad.price}
الموقع: ${ad.city || ad.location || 'بغداد'}
الرابط: https://www.souqbaghdad.store/product/${ad.short_id || ad.id}
${rawPhone ? 'الهاتف للتواصل المباشر: ' + rawPhone : ''}

الشروط:
1. اذكر مواصفات المنتج أو السيارة والحالة بوضوح.
2. ضع السعر والموقع والتفاصيل.
3. ضع رابط المعاينة والتواصل المباشر في الأسفل.
4. ضع هاشتاقات عراقية ذكية.
5. لا تستخدم علامات النجمة (*).`
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
            smartCaption = generatedCaption.replace(/[*]/g, '');
          }
        } catch (e) {
          console.error("AI Caption error:", e);
        }
      }

      // نشر المنشور مع الصورة على قنوات تيليكرام وفيسبوك وثريدز
      const img = ad.images && ad.images.length > 0 ? ad.images[0] : undefined;
      if (img) {
        await sendTelegramPhoto(GENERAL_CHANNEL, img, smartCaption);
        await sendFacebookPost(smartCaption, img);
        await sendThreadsPost(smartCaption, img);
      } else {
        await sendFacebookPost(smartCaption);
        await sendThreadsPost(smartCaption);
      }
    }

    return new Response(JSON.stringify({ success: true, published_count: topAds.length }), { status: 200 });
  } catch (err: any) {
    console.error("Error in auto-publisher:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
