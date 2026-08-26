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

const IG_ACCOUNT_ID = Deno.env.get("META_IG_ACCOUNT_ID") || "17841461141753177";

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

const sendInstagramPost = async (message: string, imageUrl?: string) => {
  if (!FB_ACCESS_TOKEN || !IG_ACCOUNT_ID || !imageUrl) return;
  try {
    const cRes = await fetch(`https://graph.facebook.com/v21.0/${IG_ACCOUNT_ID}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, caption: message, access_token: FB_ACCESS_TOKEN })
    });
    const cData = await cRes.json();
    if (cData.id) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const pRes = await fetch(`https://graph.facebook.com/v21.0/${IG_ACCOUNT_ID}/media_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creation_id: cData.id, access_token: FB_ACCESS_TOKEN })
      });
      const pData = await pRes.json();
      console.log("Instagram Post Published:", pData.id);
    }
  } catch (err) {
    console.error("Instagram Fetch Error:", err);
  }
};

const sendFacebookStory = async (imageUrl: string) => {
  if (!FB_ACCESS_TOKEN || !FB_PAGE_ID || !imageUrl) return;
  try {
    const uploadRes = await fetch(`https://graph.facebook.com/v21.0/${FB_PAGE_ID}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ url: imageUrl, published: 'false', temporary: 'true', access_token: FB_ACCESS_TOKEN }).toString()
    });
    const uploadData = await uploadRes.json();
    if (uploadData.id) {
      const pRes = await fetch(`https://graph.facebook.com/v21.0/${FB_PAGE_ID}/photo_stories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_id: uploadData.id, access_token: FB_ACCESS_TOKEN })
      });
      const pData = await pRes.json();
      console.log("Facebook Story Published:", pData.id);
    }
  } catch (err) {
    console.error("Facebook Story Error:", err);
  }
};

const sendInstagramStory = async (imageUrl: string) => {
  if (!FB_ACCESS_TOKEN || !IG_ACCOUNT_ID || !imageUrl) return;
  try {
    const cRes = await fetch(`https://graph.facebook.com/v21.0/${IG_ACCOUNT_ID}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, media_type: 'STORIES', access_token: FB_ACCESS_TOKEN })
    });
    const cData = await cRes.json();
    if (cData.id) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const pRes = await fetch(`https://graph.facebook.com/v21.0/${IG_ACCOUNT_ID}/media_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creation_id: cData.id, access_token: FB_ACCESS_TOKEN })
      });
      const pData = await pRes.json();
      console.log("Instagram Story Published:", pData.id);
    }
  } catch (err) {
    console.error("Instagram Story Error:", err);
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

function extractImagesRaw(record: any): string[] {
  if (!record) return [];
  let list: any[] = [];
  if (Array.isArray(record.images)) {
    list = record.images;
  } else if (typeof record.images === 'string') {
    try {
      const parsed = JSON.parse(record.images);
      if (Array.isArray(parsed)) list = parsed;
      else if (typeof parsed === 'string') list = [parsed];
    } catch {
      if (record.images.startsWith('http') || record.images.startsWith('data:image/')) list = [record.images];
    }
  } else if (typeof record.image === 'string' && (record.image.startsWith('http') || record.image.startsWith('data:image/'))) {
    list = [record.image];
  } else if (Array.isArray(record.photos)) {
    list = record.photos;
  }
  return list.filter(u => typeof u === 'string' && (u.startsWith('http') || u.startsWith('data:image/')));
}

async function ensurePublicImages(record: any, table: 'ads' | 'products', supabase: any): Promise<string[]> {
  const rawImages = extractImagesRaw(record);
  const publicUrls: string[] = [];
  let updated = false;

  for (const img of rawImages) {
    if (typeof img === 'string' && img.startsWith('data:image/')) {
      try {
        const match = img.match(/^data:(image\/[a-z]+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1];
          const base64Data = match[2];
          const binaryString = atob(base64Data);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const ext = mimeType.split('/')[1] || 'jpg';
          const fileName = `social-${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${ext}`;
          
          const { data, error } = await supabase.storage
            .from('ad-images')
            .upload(fileName, bytes, {
              contentType: mimeType,
              upsert: true
            });
          
          if (error) {
            console.error('Error uploading base64 to storage:', error);
            continue;
          }

          if (data) {
            const { data: publicUrlData } = supabase.storage
              .from('ad-images')
              .getPublicUrl(fileName);
            publicUrls.push(publicUrlData.publicUrl);
            updated = true;
          }
        }
      } catch (err) {
        console.error('Failed to parse/upload base64 image:', err);
      }
    } else if (typeof img === 'string' && img.startsWith('http')) {
      publicUrls.push(img);
    }
  }

  if (updated) {
    console.log(`[STORAGE] Uploaded base64 images and updating table ${table} ID ${record.id}`);
    try {
      await supabase.from(table).update({ images: publicUrls }).eq('id', record.id);
    } catch (e) {
      console.error('Failed to update record images array in DB:', e);
    }
  }

  return publicUrls;
}

function getFallbackImage(record: any, type: 'car' | 'product' | 'ad'): string {
  if (type === 'car') {
    let p: any = {};
    if (typeof record.description === 'string') {
      try { p = JSON.parse(record.description); } catch {}
    } else if (typeof record.description === 'object' && record.description !== null) {
      p = record.description;
    }
    const brand = (p.brand || record.brand || '').toLowerCase().trim();
    const model = (p.model || record.model || '').toLowerCase().trim();
    const year = (p.year || record.year || '').trim();

    if (brand || model) {
      const tags = [brand, model, year, 'car'].filter(Boolean).map(t => t.replace(/[^a-zA-Z0-9]/g, '')).join(',');
      return `https://loremflickr.com/1080/1080/${tags}`;
    }
    return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1080&h=1080&fit=crop';
  }

  const category = (record.category || '').toLowerCase().trim();
  const title = (record.title || '').toLowerCase().trim();

  if (category.includes('phone') || category.includes('mobile') || title.includes('موبايل') || title.includes('تلفون') || title.includes('ايفون') || title.includes('آيفون')) {
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1080&h=1080&fit=crop';
  }
  if (category.includes('computer') || category.includes('laptop') || title.includes('كمبيوتر') || title.includes('حاسوب') || title.includes('لابتوب')) {
    return 'https://images.unsplash.com/photo-1496181130204-7552cc14AC1A?w=1080&h=1080&fit=crop';
  }
  if (category.includes('estate') || category.includes('property') || category.includes('house') || title.includes('بيت') || title.includes('شقة') || title.includes('عقار') || title.includes('اراضي') || title.includes('أرض')) {
    return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1080&h=1080&fit=crop';
  }
  if (category.includes('fashion') || category.includes('cloth') || title.includes('ملابس') || title.includes('فستان') || title.includes('قميص') || title.includes('جاكيت') || title.includes('بدلة')) {
    return 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1080&h=1080&fit=crop';
  }
  if (category.includes('watch') || title.includes('ساعة') || title.includes('ساعه')) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1080&h=1080&fit=crop';
  }
  if (category.includes('perfume') || title.includes('عطر') || title.includes('عطور')) {
    return 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1080&h=1080&fit=crop';
  }

  const englishTags = (category + ' ' + title).replace(/[^a-zA-Z]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  if (englishTags.length > 0) {
    return `https://loremflickr.com/1080/1080/${englishTags.slice(0, 3).join(',')},product`;
  }
  
  return 'https://images.unsplash.com/photo-1522204538064-f37f6c137f8e?w=1080&h=1080&fit=crop';
}

function buildStoryImageUrl(record: any, category: string, primaryImageOrImages?: string | string[]): string {
  const shortId = record.short_id || record.id || '';
  
  let imgParam = '';
  if (primaryImageOrImages) {
    const imgArray = Array.isArray(primaryImageOrImages) ? primaryImageOrImages : [primaryImageOrImages];
    if (imgArray.length > 0) {
      const urls = imgArray.slice(0, 3).map((u: string) => encodeURIComponent(u)).join(',');
      imgParam = `&images=${urls}`;
    }
  }

  const priceVal = record.price ? `${record.price} ${record.currency || 'د.ع'}` : '';

  const dynUrl = `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=story&category=${encodeURIComponent(category)}&title=${encodeURIComponent(record.title || '')}&regions=${encodeURIComponent(record.location || record.city || 'بغداد')}&destination=${encodeURIComponent(record.destination || record.city || 'بغداد')}&fare=${encodeURIComponent(priceVal)}&phone=${encodeURIComponent(record.phone || '')}&short_id=${shortId}${imgParam}`;
  
  return `https://wsrv.nl/?url=${encodeURIComponent(dynUrl)}&output=jpg`;
}

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
      const isCar = ad.category === 'vehicles' || ad.category === 'cars' || ad.category === 'car' || (ad.category || '').toLowerCase().includes('car');
      const rawImages = await ensurePublicImages(ad, isCar ? 'ads' : 'products', supabase);
      let img = rawImages && rawImages.length > 0 ? rawImages[0] : undefined;
      
      if (!img) {
        img = getFallbackImage(ad, isCar ? 'car' : 'product');
      }
      
      const storyImg = buildStoryImageUrl(ad, isCar ? 'car' : 'product', rawImages || img);

      if (img) {
        await sendTelegramPhoto(GENERAL_CHANNEL, img, smartCaption);
        await sendFacebookPost(smartCaption, img);
        await sendInstagramPost(smartCaption, img);
        await sendThreadsPost(smartCaption, img);
        await sendFacebookStory(storyImg);
        await sendInstagramStory(storyImg);
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
