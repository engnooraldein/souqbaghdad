// @ts-nocheck
declare const Deno: any;

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const tgUrl = `https://api.telegram.org/bot${botToken}`;
const BOT_USERNAME = 'souqbaghda_bot';

async function sendMessage(chatId: string | number, text: string, replyMarkup?: any, disableWebPagePreview = true) {
  const body: any = { 
    chat_id: chatId, 
    text, 
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    link_preview_options: { is_disabled: true }
  };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const res = await fetch(`${tgUrl}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function answerCallbackQuery(callbackQueryId: string, text: string = '', showAlert = false) {
  await fetch(`${tgUrl}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: showAlert })
  });
}

async function sendPhoto(chatId: string | number, photoUrl: string, caption: string, replyMarkup?: any) {
  try {
    const body: any = { 
      chat_id: chatId, 
      photo: photoUrl, 
      caption, 
      parse_mode: 'HTML'
    };
    if (replyMarkup) body.reply_markup = replyMarkup;
    const res = await fetch(`${tgUrl}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.ok) {
      console.warn('sendPhoto failed, falling back to sendMessage:', data.description);
      return await sendMessage(chatId, caption, replyMarkup, true);
    }
    return data;
  } catch (e) {
    console.error('sendPhoto exception, falling back to sendMessage:', e);
    return await sendMessage(chatId, caption, replyMarkup, true);
  }
}

async function sendMediaGroup(chatId: string | number, photoUrls: string[], caption: string) {
  const media = photoUrls.slice(0, 10).map((url, index) => {
    const item: any = { type: 'photo', media: url };
    if (index === 0 && caption) {
      item.caption = caption;
      item.parse_mode = 'HTML';
    }
    return item;
  });
  const body: any = { chat_id: chatId, media };
  const res = await fetch(`${tgUrl}/sendMediaGroup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function editMessageCaption(chatId: string | number, messageId: number, caption: string, replyMarkup?: any) {
  const body: any = { chat_id: chatId, message_id: messageId, caption, parse_mode: 'HTML' };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const res = await fetch(`${tgUrl}/editMessageCaption`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function editMessageText(chatId: string | number, messageId: number, text: string, replyMarkup?: any) {
  const body: any = { chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML' };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const res = await fetch(`${tgUrl}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function deleteMessage(chatId: string | number, messageId: number) {
  const res = await fetch(`${tgUrl}/deleteMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId })
  });
  return res.json();
}

// Channel IDs from environment variables
const PRODUCT_CHANNEL = Deno.env.get('PRODUCT_CHANNEL_ID') || '@souqbaghdad_iq';
const TRANSPORT_CHANNEL = Deno.env.get('TRANSPORT_CHANNEL_ID') || '@souqbaghdad_lines';
const EXTRA_CHANNEL = '@souqbaghdad_iq';

// Specialized channels
const CAR_CHANNEL = '@souqbaghdad_car';           // Cars/Vehicles only
const CAR_CHANNEL_ID = '-1004369757057';          // Cars channel exact ID
const LINES_CHANNEL = '@souqbaghdad_lines';       // Transport lines username
const LINES_CHANNEL_ID = '-1004317618528';        // Transport lines ID

// Facebook, Instagram & Threads Publishing
const META_PAGE_ACCESS_TOKEN = Deno.env.get('META_PAGE_ACCESS_TOKEN') || '';
const META_PAGE_ID = Deno.env.get('META_PAGE_ID') || '';
const META_IG_ACCOUNT_ID = Deno.env.get('META_IG_ACCOUNT_ID') || '';
const THREADS_USER_ID = Deno.env.get('THREADS_USER_ID') || '28119436894335542';
const THREADS_ACCESS_TOKEN = Deno.env.get('THREADS_ACCESS_TOKEN') || '';

const ALRAFDAIN_FB_TOKEN = Deno.env.get('ALRAFDAIN_FB_TOKEN') || '';
const ALRAFDAIN_FB_PAGE_ID = Deno.env.get('ALRAFDAIN_FB_PAGE_ID') || '';
const ALRAFDAIN_IG_ID = Deno.env.get('ALRAFDAIN_IG_ID') || '';
const ALRAFDAIN_TELEGRAM_CHANNEL = '@ruc_1';

async function postToThreads(text: string, photoUrl: string | string[] | null) {
  if (!THREADS_ACCESS_TOKEN) return { error: { message: 'رمز الوصول لـ Threads مفقود أو غير صالح' } };
  const userId = THREADS_USER_ID || 'me';
  try {
    const urls = Array.isArray(photoUrl) ? photoUrl : (photoUrl ? [photoUrl] : []);
    const rawUrl = urls.length > 0 ? urls[0] : null;
    const singleUrl = rawUrl ? `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=1080&h=1080&fit=cover` : null;

    let containerUrl = `https://graph.threads.net/v1.0/${userId}/threads`;
    let params = new URLSearchParams();
    params.append('access_token', THREADS_ACCESS_TOKEN);
    params.append('text', text);

    if (singleUrl) {
      params.append('media_type', 'IMAGE');
      params.append('image_url', singleUrl);
    } else {
      params.append('media_type', 'TEXT');
    }

    let cRes = await fetch(`${containerUrl}?${params.toString()}`, { method: 'POST' });
    let cData = await cRes.json();

    // If userId failed, retry with 'me'
    if (cData.error && userId !== 'me') {
      console.warn(`Threads creation failed with userId ${userId}, retrying with 'me':`, cData.error);
      const meUrl = `https://graph.threads.net/v1.0/me/threads`;
      cRes = await fetch(`${meUrl}?${params.toString()}`, { method: 'POST' });
      cData = await cRes.json();
    }

    // Fallback: If image upload failed on Threads, try text-only post
    if (cData.error && singleUrl) {
      console.warn('Threads image creation failed, falling back to TEXT:', cData.error);
      params.set('media_type', 'TEXT');
      params.delete('image_url');
      cRes = await fetch(`${containerUrl}?${params.toString()}`, { method: 'POST' });
      cData = await cRes.json();
      if (cData.error && userId !== 'me') {
        const meUrl = `https://graph.threads.net/v1.0/me/threads`;
        cRes = await fetch(`${meUrl}?${params.toString()}`, { method: 'POST' });
        cData = await cRes.json();
      }
    }

    if (cData.id) {
      // Wait for Threads media processing before publishing
      if (singleUrl) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      let pUrl = `https://graph.threads.net/v1.0/${userId}/threads_publish?creation_id=${cData.id}&access_token=${encodeURIComponent(THREADS_ACCESS_TOKEN)}`;
      let pRes = await fetch(pUrl, { method: 'POST' });
      let pData = await pRes.json();
      if (pData.error && userId !== 'me') {
        pUrl = `https://graph.threads.net/v1.0/me/threads_publish?creation_id=${cData.id}&access_token=${encodeURIComponent(THREADS_ACCESS_TOKEN)}`;
        pRes = await fetch(pUrl, { method: 'POST' });
        pData = await pRes.json();
      }
      console.log('Threads Publish Response:', pData);
      return pData;
    }
    console.error('Threads Container Creation Error:', cData);
    return cData;
  } catch (err: any) {
    console.error('Threads Post Error:', err);
    return { error: { message: err.message || 'خطأ في النشر على Threads' } };
  }
}

async function postToFacebook(text: string, photoUrl: string | string[] | null, customToken?: string, customPageId?: string) {
  const token = customToken || META_PAGE_ACCESS_TOKEN;
  const pageId = customPageId || META_PAGE_ID;
  if (!token || !pageId) return { error: { message: 'رمز الوصول لفيسبوك مفقود أو غير صالح' } };
  try {
    const urls = Array.isArray(photoUrl) ? photoUrl : (photoUrl ? [photoUrl] : []);
    
    if (urls.length > 1) {
      const attachedMedia = [];
      for (const url of urls) {
        const uploadRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url, published: false, access_token: token })
        });
        const uploadData = await uploadRes.json();
        if (uploadData && uploadData.id) {
          attachedMedia.push({ media_fbid: uploadData.id });
        }
      }
      
      if (attachedMedia.length > 0) {
        const res = await fetch(`https://graph.facebook.com/v20.0/${pageId}/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, attached_media: attachedMedia, access_token: token })
        });
        const data = await res.json();
        if (data.error) console.error('FB API Error:', data.error);
        return data;
      }
    }

    const singleUrl = urls.length > 0 ? urls[0] : null;
    const url = singleUrl 
      ? `https://graph.facebook.com/v20.0/${pageId}/photos`
      : `https://graph.facebook.com/v20.0/${pageId}/feed`;
      
    let body: any = { message: text, access_token: token };
    if (singleUrl) {
      body = { caption: text, url: singleUrl, access_token: token };
    }
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    let data = await res.json();
    if (data.error) {
      console.error('FB API Error:', data.error);
      // Fallback: If photo post failed, try feed text post
      if (singleUrl) {
        console.warn('FB photo post failed, trying feed text fallback...');
        const fallbackRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, access_token: token })
        });
        data = await fallbackRes.json();
      }
    }
    return data;
  } catch (err: any) {
    console.error('FB Fetch Error:', err);
    return { error: { message: err.message || 'خطأ في الاتصال بفيسبوك' } };
  }
}

async function deleteFromFacebook(postId: string) {
  if (!META_PAGE_ACCESS_TOKEN) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${postId}?access_token=${META_PAGE_ACCESS_TOKEN}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.error('FB Delete Error:', err);
    return false;
  }
}

async function postToInstagramStory(photoUrl: string, igAccountId: string, accessToken: string) {
  if (!accessToken || !igAccountId || !photoUrl) return { error: { message: 'رمز الوصول لانستكرام أو الصورة مفقودة' } };
  try {
    const uploadBody = {
      image_url: photoUrl,
      media_type: 'STORIES',
      access_token: accessToken
    };
    const uploadRes = await fetch(`https://graph.facebook.com/v20.0/${igAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uploadBody)
    });
    const uploadData = await uploadRes.json();
    
    if (uploadData && uploadData.id) {
       await new Promise(resolve => setTimeout(resolve, 5000));
       const publishBody = {
         creation_id: uploadData.id,
         access_token: accessToken
       };
       const publishRes = await fetch(`https://graph.facebook.com/v20.0/${igAccountId}/media_publish`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(publishBody)
       });
       return await publishRes.json();
    }
    return uploadData;
  } catch (err: any) {
    console.error('IG Story Fetch Error:', err);
    return { error: { message: err.message || 'خطأ في الاتصال بانستكرام' } };
  }
}

async function postToInstagram(text: string, photoUrl: string | string[] | null) {
  if (!META_PAGE_ACCESS_TOKEN || !META_IG_ACCOUNT_ID || !photoUrl) return { error: { message: 'رمز الوصول لانستكرام أو الصورة مفقودة' } };
  try {
    const rawUrls = Array.isArray(photoUrl) ? photoUrl : [photoUrl];
    // Instagram carousel supports a max of 10 items
    const originalUrls = rawUrls.slice(0, 10);
    const urls = originalUrls.map(url => `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=1080&h=1080&fit=cover`);
    
    if (urls.length > 1) {
      const containerIds = [];
      for (const url of urls) {
        const uploadBody = {
          image_url: url,
          is_carousel_item: true,
          access_token: META_PAGE_ACCESS_TOKEN
        };
        const uploadRes = await fetch(`https://graph.facebook.com/v20.0/${META_IG_ACCOUNT_ID}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(uploadBody)
        });
        const uploadData = await uploadRes.json();
        if (uploadData && uploadData.id) {
          containerIds.push(uploadData.id);
        }
      }
      
      if (containerIds.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const carouselBody = {
          caption: text,
          media_type: 'CAROUSEL',
          children: containerIds.join(','),
          access_token: META_PAGE_ACCESS_TOKEN
        };
        
        const carouselRes = await fetch(`https://graph.facebook.com/v20.0/${META_IG_ACCOUNT_ID}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(carouselBody)
        });
        const carouselData = await carouselRes.json();
        
        if (carouselData && carouselData.id) {
           await new Promise(resolve => setTimeout(resolve, 5000));
           const publishBody = {
             creation_id: carouselData.id,
             access_token: META_PAGE_ACCESS_TOKEN
           };
           const publishRes = await fetch(`https://graph.facebook.com/v20.0/${META_IG_ACCOUNT_ID}/media_publish`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(publishBody)
           });
           return await publishRes.json();
        } else {
           return { error: { message: `Failed to create carousel: ${JSON.stringify(carouselData)}` } };
        }
      }
    }
    
    const singleUrl = urls[0];
    const uploadUrl = `https://graph.facebook.com/v20.0/${META_IG_ACCOUNT_ID}/media`;
    
    const uploadBody = {
      image_url: singleUrl,
      caption: text,
      access_token: META_PAGE_ACCESS_TOKEN
    };
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uploadBody)
    });
    const uploadData = await uploadRes.json();
    
    if (!uploadData.id) {
      console.error('IG Upload Error:', uploadData);
      return { error: { message: `Media ID not available. URL: ${singleUrl}. Response: ${JSON.stringify(uploadData)}` } };
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const publishUrl = `https://graph.facebook.com/v20.0/${META_IG_ACCOUNT_ID}/media_publish`;
    const publishBody = {
      creation_id: uploadData.id,
      access_token: META_PAGE_ACCESS_TOKEN
    };
    const publishRes = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publishBody)
    });
    const data = await publishRes.json();
    return data;
  } catch (err: any) {
    console.error('IG Error:', err);
    return { error: { message: err.message || 'خطأ في الاتصال بانستكرام' } };
  }
}

async function postToTikTok(text: string, photoUrl: string | string[] | null, supabaseClient: any) {
  if (!photoUrl) return { error: { message: 'الصورة مفقودة' } };
  
  try {
    const { data: authData, error: authError } = await supabaseClient
      .from('social_integrations')
      .select('access_token')
      .eq('platform', 'tiktok')
      .single();
      
    if (authError || !authData?.access_token) {
      return { error: { message: 'غير مسجل الدخول في تيك توك' } };
    }
    
    const token = authData.access_token;
    const originalUrls = Array.isArray(photoUrl) ? photoUrl : [photoUrl];
    
    const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post_info: {
          title: text.substring(0, 150),
          description: text.substring(0, 2200),
          privacy_level: "SELF_ONLY",
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          auto_add_music: true
        },
        source_info: {
          source: "PULL_FROM_URL",
          photo_cover_index: 1,
          photo_images: originalUrls
        },
        post_mode: "DIRECT_POST",
        media_type: "PHOTO"
      })
    });
    
    const initData = await initRes.json();
    return initData;
  } catch (err: any) {
    console.error('TikTok Error:', err);
    return { error: { message: err.message || 'خطأ في الاتصال بتيك توك' } };
  }
}

async function deleteFromInstagram(mediaId: string) {
  if (!META_PAGE_ACCESS_TOKEN) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${mediaId}?access_token=${META_PAGE_ACCESS_TOKEN}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.error('IG Delete Error:', err);
    return false;
  }
}

function formatTgPrice(val: any, currency = 'د.ع'): string {
  if (!val || val === '0' || val === 0) return 'حسب الاتفاق 🤝';
  let str = String(val).trim();
  const rawNum = str.replace(/[^\d]/g, '');
  if (!rawNum) return str;
  let num = parseInt(rawNum, 10);
  if (!isNaN(num) && num > 0 && num < 1000 && currency.includes('د.ع')) {
    num = num * 1000;
  }
  return isNaN(num) ? str : `${num.toLocaleString('en-US')} ${currency}`;
}

const generateSocialCaption = async (record: any, type: 'car' | 'product' | 'transport' | 'ad', link: string): Promise<string> => {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
  let title = record.title || (type === 'car' ? 'سيارة للبيع' : 'إعلان جديد');
  let price = formatTgPrice(record.price, record.currency || 'د.ع');
  let location = record.governorate || record.location || record.city || 'بغداد';
  let details = '';
  if (typeof record.description === 'string') {
    if (record.description.trim().startsWith('{')) {
      try {
        const p = JSON.parse(record.description);
        const parts = [];
        if (p.brand) parts.push(`الماركة: ${p.brand}`);
        if (p.model) parts.push(`الموديل: ${p.model}`);
        if (p.year) parts.push(`السنة: ${p.year}`);
        if (p.origin) parts.push(`المواصفات: ${p.origin}`);
        if (p.mileage) parts.push(`المسافة: ${p.mileage} كم`);
        if (p.note) parts.push(`ملاحظات: ${p.note}`);
        details = parts.join(' | ');
      } catch {
        details = record.description;
      }
    } else {
      details = record.description;
    }
  }
  details = details.substring(0, 250);

  if (GEMINI_API_KEY) {
    try {
      const prompt = `أنت خبير تسويق محتوى لمنصات التواصل (Instagram, Threads, Facebook) لـ "سوق بغداد".
اكتب منشوراً تسويقياً مرتباً وجذاباً باللغة العربية مع لمسة ودية باللهجة العراقية للإعلان التالي:
النوع: ${type}
العنوان: ${title}
السعر: ${price}
الموقع: ${location}
التفاصيل: ${details || 'متوفر الآن عبر المنصة'}

شروط إلزامية:
1. رتب النص بشكل أنيق ومريح للعين مع ترك سطر فارغ بين كل نقطة وأخرى.
2. لا تستخدم علامات النجمة (*) أو تنسيقات Markdown المعقدة.
3. ضع الهاشتاقات المناسبة في النهاية.
4. أضف دعوة تفاعل واضحة: "💬 اكتب تم أو تواصل بالتعليقات وتوصلك كافة التفاصيل على الخاص 📩".`;

      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
          })
        }
      );
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const generated = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generated && generated.length > 25) {
          const cleanText = generated.replace(/[*_#`]/g, '').trim();
          return `${cleanText}\n\n🔗 ${link}\n\n#سوق_بغداد #العراق #بغداد`;
        }
      }
    } catch (e) {
      console.error('AI Caption generation error:', e);
    }
  }

  // Fallback Clean Social Template (No flipped symbols or bot tags)
  if (type === 'car') {
    return `🚗 سيارة مميزة للبيع في سوق بغداد\n\n📌 النوع: ${title}\n💰 السعر: ${price}\n📍 الموقع: ${location}\n\n🔗 تفاصيل الإعلان والتواصل مع البائع:\n${link}\n\n💬 اكتب "تم" أو "تواصل" بالتعليقات وتوصلك كافة التفاصيل على الخاص 📩\n\n#سوق_بغداد #سيارات_العراق #بغداد`;
  } else if (type === 'transport') {
    return `🚌 خط نقل جديد في بغداد\n\n📍 مناطق الانطلاق: ${location}\n🏢 الوجهة: ${record.university || record.city || 'بغداد'}\n💰 الأجرة: ${price}\n\n🔗 تفاصيل الخط والتواصل:\n${link}\n\n💬 اكتب "تم" بالتعليقات وتوصلك التفاصيل على الخاص 📩\n\n#سوق_بغداد #خطوط_نقل #جامعات_العراق`;
  } else {
    return `🛍️ منتج مميز معروض في سوق بغداد\n\n📌 الاسم: ${title}\n💰 السعر: ${price}\n📍 الموقع: ${location}\n\n🔗 تفاصيل المنتج والشراء:\n${link}\n\n💬 اكتب "تم" أو "تواصل" بالتعليقات وتوصلك كافة التفاصيل على الخاص 📩\n\n#سوق_بغداد #تسوق_العراق #بغداد`;
  }
};

function generateHashtags(title: string, desc: string): string {
  const defaultTag = '#سوق_بغداد_الرقمي';
  if (!title) return defaultTag;
  const words = title.split(/\s+/).filter(w => w.length > 2).slice(0, 3);
  const tags = words.map(w => '#' + w.replace(/[^\w\u0600-\u06FF]/g, ''));
  return [defaultTag, ...tags].join(' ');
}

async function sendWhatsAppWelcome(phone: string, title: string, link: string) {
  const token = Deno.env.get('WHATSAPP_TOKEN');
  const phoneId = Deno.env.get('WHATSAPP_PHONE_ID');
  if (!token || !phoneId || !phone) return;

  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);

  const msg = `أهلاً بك في منصة سوق بغداد الرقمي! 👋\n\nشكراً لنشر إعلانك: "${title}" في منصتنا.\n\n✅ لقد تم نشره بنجاح في الموقع وتيليكرام وفيسبوك وانستكرام.\n\nيمكنك متابعة إعلانك ورؤية التفاصيل عبر الرابط:\n🔗 ${link}\n\nنتمنى لك التوفيق! 🚀`;

  try {
    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: msg }
      })
    });
  } catch(e) {
    console.error('WhatsApp Error:', e);
  }
}

function getLocalIraqiResponse(text: string): string {
  const clean = text.toLowerCase().trim();
  if (clean.includes('برومو') || clean.includes('كود') || clean.includes('رمز') || clean.includes('شحن كود')) {
    return '🎟️ هلا بيك عيوني! إذا عندك كود بروموكود لشحن النقاط، اضغط على زر <b>[🎟️ تعبئة بروموكود]</b> جوة، ودز الكود وراح تنزل النقاط بمحفظتك فوراً!';
  }
  if (clean.includes('سيار') || clean.includes('ابيع') || clean.includes('أبيع') || clean.includes('اعرض') || clean.includes('بيع')) {
    return '🚗 هلا بيك عيوني وتدلل! نشر السيارة كلش سهل وبدقايق.. بس اضغط على زر <b>[🚗 اعرض سيارتك للبيع مجاناً]</b> جوة، واختار الماركة والموديل وسنة الصنع والسعر ودزلنا صورها، ومباشرة راح ينزل إعلانك بالمنصة وقناة التليكرام!';
  }
  if (clean.includes('خط') || clean.includes('نقل') || clean.includes('جامع') || clean.includes('دوام') || clean.includes('سايق') || clean.includes('طالب')) {
    return '🚌 يا هلا بيك يالغالي! بخصوص خطوط النقل، اضغط على زر <b>[🚌 انشر خط نقل]</b> جوة، وحدد إذا إنت صاحب خط أو طالب/موظف تدور خط، واختار المناطق والجامعة والدوام، وراح ينشر إعلانك وتوصلك الطلبات فوراً!';
  }
  if (clean.includes('تعديل') || clean.includes('سعر') || clean.includes('حذف') || clean.includes('مسح') || clean.includes('نباعت') || clean.includes('مبيوع') || clean.includes('مباع')) {
    return '📋 تدلل حبيبي، تكدر تعدل السعر أو رقم التلفون أو تحذف الإعلان أو تبلغه كمباع بأي وقت وبسهولة من خلال زر <b>[📋 إدارة إعلاناتي وخطوطي]</b> جوة.';
  }
  if (clean.includes('نقط') || clean.includes('نقاط') || clean.includes('شحن') || clean.includes('محفظ')) {
    return '🪙 النشر مجاني بالكامل عيوني! وإذا حبيت تزيد نقاطك تكدر تضغط على <b>[🎟️ تعبئة بروموكود]</b> أو <b>[💳 شراء نقاط]</b> جوة أو تراسل الإدارة @rucno.';
  }
  if (clean.includes('سلام') || clean.includes('هلو') || clean.includes('مرحبا') || clean.includes('شلونك') || clean.includes('شخبارك') || clean.includes('مساء') || clean.includes('صباح')) {
    return '👋 أهلاً وسهلاً بيك نورت سوق بغداد يالغالي! شلون أقدر أساعدك اليوم؟ تكدر تعرض سيارتك أو تنشر خط نقل أو تعبي بروموكود من الأزرار جوة 👇';
  }
  return 'هلا بيك عيوني نورت سوق بغداد! 🇮🇶 شلون أقدر أساعدك اليوم؟ تكدر تختار مباشرة من الأزرار أدناه 👇';
}

async function fetchDatabaseContext(queryText: string): Promise<string> {
  try {
    const clean = queryText.toLowerCase().trim();
    let adsContext = '';

    // 1. إذا طلب المستخدم آخر الإعلانات أو أحدث المنشورات
    if (clean.includes('اخر') || clean.includes('اخير') || clean.includes('أحدث') || clean.includes('جديد') || clean.includes('شنو نزل') || clean.includes('اعلانات')) {
      const { data: latestAds } = await supabase
        .from('ads')
        .select('title, price, year, location, city, phone, short_id, category, type, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(4);

      if (latestAds && latestAds.length > 0) {
        adsContext += `\n[أحدث الإعلانات المعروضة حالياً في المنصة]:\n`;
        latestAds.forEach((ad, i) => {
          adsContext += `${i + 1}. ${ad.title} (موديل: ${ad.year || 'غير محدد'}) | السعر: ${ad.price} | الموقع: ${ad.city || ad.location || 'بغداد'} | رقم هاتف البائع: ${ad.phone || 'تواصل عبر الموقع'} | رقم الإعلان: #${ad.short_id || ad.title} | الرابط: https://www.souqbaghdad.store/product/${ad.short_id}\n`;
        });
      }
    }

    // 2. البحث عن سيارة محددة أو خط نقل أو كلمة مفتاحية (مثل النترا، كورولا، توسان، سنتافي، كيا، اوبتيما، كامري، تكسي، خط...)
    const keywords = queryText.replace(/[\?\؟\!\,]/g, '').trim().split(/\s+/).filter(w => w.length >= 2 && !['شنو', 'اكو', 'عندكم', 'ناشرين', 'اريد', 'أريد', 'ادور', 'أدور', 'شكد', 'بكم', 'سعر', 'هل', 'منو', 'على', 'في', 'عن'].includes(w));
    
    if (keywords.length > 0) {
      const searchTerms = keywords.slice(0, 3);
      let query = supabase.from('ads').select('title, price, year, location, city, phone, short_id, category, description, created_at').eq('status', 'active');
      
      const orConditions = searchTerms.map(t => `title.ilike.%${t}%,description.ilike.%${t}%,location.ilike.%${t}%`).join(',');
      const { data: searchAds } = await query.or(orConditions).order('created_at', { ascending: false }).limit(4);

      if (searchAds && searchAds.length > 0) {
        adsContext += `\n[إعلانات مطابقة لبحث المستخدم في قاعدة البيانات]:\n`;
        searchAds.forEach((ad, i) => {
          adsContext += `${i + 1}. ${ad.title} (سنة: ${ad.year || 'غير محدد'}) | السعر: ${ad.price} | الموقع: ${ad.city || ad.location || 'بغداد'} | هاتف البائع: ${ad.phone || 'متوفر بالموقع'} | رقم الإعلان: #${ad.short_id} | الرابط: https://www.souqbaghdad.store/product/${ad.short_id}\n`;
        });
      }
    }

    return adsContext;
  } catch (e) {
    console.error('Error fetching database context:', e);
    return '';
  }
}

async function callGemini(text: string | null, audioUrl: string | null = null, photoUrl: string | null = null): Promise<string | null> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

  // استرجاع معلومات حية من قاعدة البيانات
  const dbContext = text ? await fetchDatabaseContext(text) : '';

  const systemInstruction = `أنت المساعد الذكي الخبير لمنصة "سوق بغداد" (سوق رقمي عراقي متكامل لبيع وشراء السيارات، خطوط النقل، والمنتجات - موقعنا: https://www.souqbaghdad.store).
شخصيتك:
- تتحدث بلهجة عراقية بغدادية دارجة ومحببة جداً وذكية وخدومة (مثل: هلا بيك عيوني، تدلل يالغالي، من عيوني، تأمر أمر، حياك الله، عاشت ايدك).
- تفهم كل أسئلة المستخدم عن السيارات المعروضة، الأسعار، أحدث الإعلانات، وأرقام الهواتف، وخطوط النقل، وطريقة النشر والتعديل.
- إذا كان هناك معلومات مرفقة من قاعدة بيانات المنصة أدناه، استخدمها فوراً للإجابة بدقة متناهية وزوّد المستخدم باسم السيارة، السعر، رقم الإعلان، ورقم هاتف البائع إذا سأل عنه.
- إذا أرسل المستخدم صورة أو سكرين شوت، قم بقراءتها واستخراج اسم السيارة وسعرها ورقم الهاتف منها بذكاء.

${dbContext ? `معلومات حقيقية ومباشرة من قاعدة بيانات سوق بغداد حالياً:\n${dbContext}\n` : ''}

قواعد أساسية:
1. إذا سأل هل ناشرين سيارة معينة (مثل النترا، كورولا، سنتافي): تحقق من المعلومات أعلاه، إذا موجودة اذكره له بالتفصيل وسعرها ورقم الهاتف. إذا غير موجودة، أخبره بلطافة أن يدخل للموقع أو يبحث من الأزرار أو ينشر طلبه.
2. إذا سأل عن آخر إعلان أو أحدث السيارات: اعرض له الإعلانات الأخيرة من البيانات أعلاه.
3. إذا سأل عن بيع أو نشر سيارة: وضّح له أن النشر مجاني بالكامل وبدقائق بالضغط على زر [🚗 اعرض سيارتك للبيع مجاناً] جوة أو عبر الموقع.
4. إذا سأل عن كود أو بروموكود: وجّهه لزر [🎟️ تعبئة بروموكود] لشحن رصيده فوراً.
5. رابط المنصة الرسمي: https://www.souqbaghdad.store

ملاحظة: اجعل الرد جذاباً، دقيقاً، مدعوماً بإيموجيات لطيفة وبدون علامات نجمية كثيرة.`;

  // 1. Try Google Gemini (Vision + Audio + Text)
  if (GEMINI_API_KEY) {
    try {
      const parts: any[] = [];
      if (text) parts.push({ text: text });
      
      // صوت
      if (audioUrl) {
        try {
          const audioRes = await fetch(audioUrl);
          let mimeType = audioRes.headers.get('content-type') || 'audio/ogg';
          if (mimeType.includes('octet-stream')) mimeType = 'audio/ogg';
          const arrayBuffer = await audioRes.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binaryString = "";
          const chunkSize = 8192;
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            binaryString += String.fromCharCode.apply(null, Array.from(uint8Array.slice(i, i + chunkSize)));
          }
          parts.push({
            inlineData: { mimeType: mimeType, data: btoa(binaryString) }
          });
        } catch(e) {
          console.error('Audio processing error:', e);
        }
      }

      // صورة / سكرين شوت
      if (photoUrl) {
        try {
          const photoRes = await fetch(photoUrl);
          const mimeType = photoRes.headers.get('content-type') || 'image/jpeg';
          const arrayBuffer = await photoRes.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binaryString = "";
          const chunkSize = 8192;
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            binaryString += String.fromCharCode.apply(null, Array.from(uint8Array.slice(i, i + chunkSize)));
          }
          parts.push({
            inlineData: { mimeType: mimeType, data: btoa(binaryString) }
          });
          if (!text) {
            parts.push({ text: 'حلل هذا السكرين شوت أو الصورة المرفقة، واستخرج تفاصيل الإعلان أو السيارة ورقم الهاتف والسعر واشرحها للمستخدم باللهجة العراقية.' });
          }
        } catch(e) {
          console.error('Photo processing error:', e);
        }
      }

      const body = {
        contents: [{ role: 'user', parts }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
      };
      
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        const data = await res.json();
        const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generated && generated.trim().length > 0) {
          return generated.trim().replace(/[*#]/g, '');
        }
      } else {
        console.error('Gemini API returned error:', await res.text());
      }
    } catch (err) {
      console.error('Gemini Fetch Error:', err);
    }
  }

  // 2. Try OpenAI Fallback (gpt-4o-mini)
  if (OPENAI_API_KEY && text) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: text }
          ],
          max_tokens: 400,
          temperature: 0.7
        })
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply && reply.trim().length > 0) {
          return reply.trim().replace(/[*#]/g, '');
        }
      } else {
        console.error('OpenAI API returned error:', await res.text());
      }
    } catch(err) {
      console.error('OpenAI Fetch Error:', err);
    }
  }

  // 3. Fallback to Local Intelligent Iraqi Rules
  if (text) {
    if (dbContext) {
      return `يا هلا بيك عيوني! 🚗 بخصوص سؤالك، هاي بعض الإعلانات المعروضة حالياً بالمنصة:\n${dbContext}\nوتكدر تشوف كل التفاصيل والصور والتواصل مباشرة من خلال موقعنا: https://www.souqbaghdad.store`;
    }
    return getLocalIraqiResponse(text);
  }

  return 'هلا بيك عيوني نورت سوق بغداد! 🇮🇶 شلون أقدر أساعدك اليوم؟';
}

async function checkInterruption(text: string): Promise<boolean> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) return false;
  if (text.length < 2) return false;
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const body = {
      contents: [{ role: 'user', parts: [{ text: text }] }],
      systemInstruction: { parts: [{ text: `أجب بـ "نعم" أو "لا" فقط.
المستخدم كان يملأ استمارة لنشر إعلان سيارة أو خط نقل. هل الجملة التالية تبدو وكأنها مقاطعة، سؤال خارجي، أو تراجع عن النشر (مثلا: "شلون انشر"، "غلطت"، "بطلت"، "كيف اسوي")؟
أجب بـ "نعم" إذا كانت مقاطعة، وأجب بـ "لا" إذا كانت مجرد إجابة طبيعية للاستمارة.` }] }
    };
    
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return answer.includes('نعم');
  } catch (err) {
    return false;
  }
}

// --- Data Lists for Car Wizard ---
const CAR_BRANDS = [
  ['هيونداي', 'كيا', 'تويوتا'],
  ['نيسان', 'شفروليه', 'بي ام دبليو'],
  ['مرسيدس', 'هوندا', 'سوزوكي'],
  ['ميتسوبيشي', 'مازدا', 'فورد'],
  ['جي ام سي', 'دودج', 'جيب'],
  ['كاديلاك', 'كرايسلر', 'لكزس'],
  ['شيري', 'جيلي', 'هافال'],
  ['بايك', 'BYD', 'GAC'],
  ['MG', 'جيتور', 'شانجان'],
  ['فولكسفاغن', 'أودي', 'لاند روفر'],
  ['بورشه', 'رينو', 'بيجو'],
  ['أخرى 🔄']
];

const CAR_YEARS = [
  ['2026', '2025', '2024', '2023'],
  ['2022', '2021', '2020', '2019'],
  ['2018', '2017', '2016', '2015'],
  ['2014', '2013', '2012', '2011'],
  ['2010', 'موديل أقدم 📅']
];

const IRAQI_GOVERNORATES = [
  ['بغداد', 'البصرة', 'أربيل'],
  ['نينوى', 'السليمانية', 'دهوك'],
  ['كركوك', 'الأنبار', 'صلاح الدين'],
  ['بابل', 'كربلاء', 'النجف'],
  ['ديالى', 'واسط', 'ميسان'],
  ['ذي قار', 'المثنى', 'القادسية'],
  ['حلبجة']
];

const CAR_SPECS_ORIGINS = [
  ['وارد أمريكي 🇺🇸', 'وارد خليجي 🇦🇪'],
  ['وارد كندي 🇨🇦', 'وارد كوري 🇰🇷'],
  ['بدون صبغ ✨', 'صبغ عام 🎨'],
  ['صبغ قطع بسيطة 🔧', 'مواصفات أخرى 📝']
];

// --- Data Lists for Transport Wizard (خطوط النقل) ---
const TRANSPORT_AREAS_BAGHDAD = [
  ['الكرادة', 'المنصور', 'اليرموك'],
  ['الدورة', 'السيدية', 'البياع'],
  ['الشعب', 'الأعظمية', 'الكاظمية'],
  ['حي الجامعة', 'الغزالية', 'العامرية'],
  ['زيونة', 'شارع فلسطين', 'بغداد الجديدة'],
  ['الزعفرانية', 'مدينة الصدر', 'أبو غريب'],
  ['المحمودية', 'التاجي', 'مناطق أخرى 📝']
];

const TRANSPORT_DESTINATIONS_BAGHDAD = [
  ['كلية الرافدين الجامعة 🎓', 'جامعة بغداد (الجادرية)'],
  ['جامعة بغداد (باب المعظم)', 'الجامعة المستنصرية'],
  ['الجامعة التكنولوجية', 'جامعة النهرين'],
  ['الجامعة العراقية', 'جامعة الفراهيدي'],
  ['جامعة البيان', 'جامعة التراث'],
  ['جامعة أوروك', 'كلية دجلة / الإسراء'],
  ['كلية المنصور / المأمون', 'دوائر ومؤسسات الكرخ'],
  ['دوائر ومؤسسات الرصافة', 'وجهة أخرى 📝']
];

const TRANSPORT_SHIFTS = [
  ['☀️ صباحي (8:00 ص - 2:00 م)'],
  ['🌤️ صباحي متأخر (9:00 ص - 3:00 م)'],
  ['🌇 مسائي (1:00 م - 6:00 م)'],
  ['🔄 شفتات متغيرة / حسب الاتفاق']
];

const TRANSPORT_VEHICLES = [
  ['🚗 صالون خصوصي (4 ركاب)'],
  ['🚐 باص ستاركس / H1 (11 راكب)'],
  ['🚌 باص كوستر / كيا (21 راكب)'],
  ['✨ VIP مكيف وحديث']
];

const TRANSPORT_TARGETS = [
  ['👩 طالبات / إناث فقط'],
  ['👨 طلاب / ذكور فقط'],
  ['👥 مختلط / عوائل']
];

const TRANSPORT_FARES = [
  ['50,000 د.ع', '75,000 د.ع'],
  ['100,000 د.ع', '125,000 د.ع'],
  ['150,000 د.ع', 'حسب الاتفاق 🤝'],
  ['مبلغ آخر ✏️']
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    // Check if it's a Supabase Database Webhook (pg_net)
    if ((payload.type === 'INSERT' || payload.type === 'UPDATE' || payload.type === 'DELETE') && payload.table) {
      const record = payload.record || payload.old_record;
      const oldRecord = payload.old_record;
      
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      let shouldDelete = false;
      let shouldPublish = false;
      let shouldUpdateStatus = false;
      let finalSyncStatus: any = {};
      
      if (payload.type === 'INSERT') {
        shouldPublish = true;
      } else if (payload.type === 'DELETE') {
        shouldDelete = true;
      } else if (payload.type === 'UPDATE') {
        if (oldRecord && oldRecord.status === 'active' && (record.status === 'matched' || record.status === 'sold' || record.status === 'inactive')) {
          shouldUpdateStatus = true;
        }
        if (oldRecord && (oldRecord.status === 'matched' || oldRecord.status === 'sold' || oldRecord.status === 'inactive') && record.status === 'active') {
          shouldPublish = true;
        }
      }

      // Handle Sold / Matched status update on Telegram Channel
      if (shouldUpdateStatus) {
        const msgId = record?.telegram_message_id || oldRecord?.telegram_message_id;
        if (msgId) {
          const isTransport = record.category === 'transport';
          const targetChannel = isTransport ? TRANSPORT_CHANNEL : PRODUCT_CHANNEL;

          if (targetChannel) {
            try {
              const isCar = record.category === 'vehicles' || record.category === 'cars';
              const browseUrl = isCar ? 'https://www.souqbaghdad.store/vehicles' : (isTransport ? 'https://www.souqbaghdad.store/transport' : 'https://www.souqbaghdad.store');
              const soldTag = isTransport ? '✅ <b>[اكتمل العدد / الخط مغلق]</b>' : (isCar ? '⚠️ <b>[تم البيع / مباعة]</b>' : '⚠️ <b>[تم البيع / غير متوفر]</b>');
              const soldButtons = {
                inline_keyboard: [
                  [{ text: isTransport ? '🚌 تصفح خطوط أخرى متاحة' : '⚠️ تم البيع — تصفح المزيد 🛍️', url: browseUrl }],
                  [{ text: isTransport ? '🚌 اعرض خطك مجاناً عبر البوت' : '🚗 اعرض إعلانك مجاناً عبر البوت', url: `https://t.me/${BOT_USERNAME}` }]
                ]
              };
              const soldCaption = `${soldTag}\n\n` +
                                  `📌 <b>${record.title || 'إعلان'}</b>\n` +
                                  `💰 <b>تمت العملية بنجاح عبر منصة سوق بغداد</b>\n` +
                                  `📍 ${record.location || record.city || 'العراق'}\n\n` +
                                  `📣 لم يعد هذا الإعلان متاحاً للتواصل. يمكنك تصفح العروض المشابهة عبر الزر أدناه 👇`;
              
              await editMessageCaption(targetChannel, parseInt(msgId, 10), soldCaption, soldButtons);
              if (EXTRA_CHANNEL) {
                await editMessageCaption(EXTRA_CHANNEL, parseInt(msgId, 10), soldCaption, soldButtons);
              }
            } catch(e) {
              console.error('Failed to update caption to sold:', e);
            }
          }
        }
      }
      
      if (shouldDelete) {
        const msgId = record?.telegram_message_id || oldRecord?.telegram_message_id;
        if (msgId) {
          const channel = (payload.table === 'products' || record.category !== 'transport') ? PRODUCT_CHANNEL : TRANSPORT_CHANNEL;
          if (channel) {
            await deleteMessage(channel, parseInt(msgId, 10));
          }
          if (EXTRA_CHANNEL) {
            await deleteMessage(EXTRA_CHANNEL, parseInt(msgId, 10));
          }
        }
        
        // Delete from Social Media
        const fbPostId = record?.facebook_post_id || oldRecord?.facebook_post_id;
        if (fbPostId) await deleteFromFacebook(fbPostId);
        
        const igPostId = record?.instagram_post_id || oldRecord?.instagram_post_id;
        if (igPostId) await deleteFromInstagram(igPostId);
      }

      let publishTelegram = payload.targets ? payload.targets.telegram : true;
      let publishFacebook = payload.targets ? payload.targets.facebook : true;
      let publishInstagram = payload.targets ? payload.targets.instagram : true;
      let publishTiktok = payload.targets ? payload.targets.tiktok : true;
      let publishThreads = payload.targets ? payload.targets.threads : true;
      
      let forceFacebookPage = payload.targets ? payload.targets.facebookPage : null;
      let forceInstagramPage = payload.targets ? payload.targets.instagramPage : null;

      // Respect skip flags from initial insert (to prevent double publishing with bot wizard)
      if (record?.sync_status) {
        if (record.sync_status.telegram === 'skip' || record.sync_status.telegram === 'success') publishTelegram = false;
        if (record.sync_status.facebook === 'skip' || record.sync_status.facebook === 'success') publishFacebook = false;
        if (record.sync_status.instagram === 'skip' || record.sync_status.instagram === 'success') publishInstagram = false;
        if (record.sync_status.tiktok === 'skip' || record.sync_status.tiktok === 'success') publishTiktok = false;
        if (record.sync_status.threads === 'skip' || record.sync_status.threads === 'success') publishThreads = false;
      }

      if (!publishTelegram && !publishFacebook && !publishInstagram && !publishTiktok && !publishThreads) {
        shouldPublish = false;
      }

      if (shouldPublish) {
        // --- 1. CAR ADS (VEHICLES) ---
        if (payload.table === 'ads' && (record.category === 'vehicles' || record.category === 'cars' || record.category === 'car' || (record.category || '').toLowerCase().includes('car'))) {
          const adId = record.short_id || record.id;
          const link = `https://www.souqbaghdad.store/ad/${adId}`;
          
          let carSpecs: any = {};
          try {
            carSpecs = typeof record.description === 'string' && record.description.startsWith('{') 
              ? JSON.parse(record.description) 
              : { note: record.description };
          } catch(e) {
            carSpecs = { note: record.description };
          }

          const currencySymbol = carSpecs.currency || (record.price && String(record.price).length < 7 ? '$' : 'د.ع');
          const formattedPrice = formatTgPrice(record.price, currencySymbol);
          
          const brand = carSpecs.brand || '';
          const model = carSpecs.model || '';
          const year = carSpecs.year || '';
          const mileage = carSpecs.mileage ? `${parseInt(carSpecs.mileage).toLocaleString('en-US')} كم` : 'غير محدد';
          const origin = carSpecs.origin || 'وارد عام';
          const gov = record.location || record.city || 'العراق';
          const carTitle = `${brand} ${model} ${year}`.trim() || record.title || 'سيارة للبيع';

          const caption = `🚗 <b>النوع:</b> ${carTitle}\n` +
                          `📅 <b>السنة:</b> ${year || 'غير محدد'}\n` +
                          `🛣️ <b>الكيلومتر:</b> ${mileage}\n` +
                          `📍 <b>الموقع:</b> ${gov}\n` +
                          `📋 <b>المواصفات:</b> ${origin}\n` +
                          `💰 <b>السعر:</b> ${formattedPrice}\n` +
                          (record.phone ? `📞 <b>التواصل:</b> ${record.phone}\n\n` : `\n`) +
                          `📣 <b>#رقم_الإعلان_${adId}</b> | @${BOT_USERNAME}`;

          const imagesToPost = record.images && record.images.length > 0 ? record.images : [];
          const photoCount = imagesToPost.length;
          const detailsButtonText = photoCount > 1 
            ? `📸 تصفح كافة الصور (${photoCount} صور) والتفاصيل 🌐` 
            : `🌐 عرض التفاصيل بالمنصة`;

          // Beautiful, full-width balanced buttons
          let cleanPhone = (record.phone || '').replace(/[^0-9+]/g, '');
          if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
          else cleanPhone = cleanPhone.replace('+', '');

          const contactRow = [];
          if (cleanPhone) {
            contactRow.push({ text: '💬 تواصل واتساب', url: `https://wa.me/${cleanPhone}` });
            contactRow.push({ text: '✈️ تواصل تيليكرام', url: `https://t.me/+${cleanPhone}` });
          }

          const inlineKeyboard = [
            [{ text: detailsButtonText, url: link }]
          ];
          if (contactRow.length > 0) {
            inlineKeyboard.push(contactRow);
          }
          inlineKeyboard.push([{ text: '🚗 اعرض سيارتك للبيع مجاناً', url: `https://t.me/${BOT_USERNAME}` }]);

          const replyMarkup = { inline_keyboard: inlineKeyboard };

          const dynamicCarUrl = `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=post&category=cars&title=${encodeURIComponent(carTitle)}&subtitle=${encodeURIComponent(carSubtitle || 'مواصفات ممتازة')}&subdesc=${encodeURIComponent((details || 'معروضة الآن للبيع').substring(0, 100))}&fare=${encodeURIComponent(formattedPrice)}&regions=${encodeURIComponent(record.location || 'بغداد')}&destination=${encodeURIComponent(record.city || record.location || 'بغداد')}&link=${encodeURIComponent(link)}&short_id=${encodeURIComponent(adId)}`;

          let res;
          if (publishTelegram) {
            const mainPhoto = imagesToPost.length > 0 ? imagesToPost[0] : dynamicCarUrl;
            // Send exclusively to the dedicated car channel (once)
            const targetCarChannel = CAR_CHANNEL_ID || CAR_CHANNEL;
            res = await sendPhoto(targetCarChannel, mainPhoto, caption, replyMarkup);
          }

          const updates: any = {};
          let syncStatus = record.sync_status || { facebook: 'pending', instagram: 'pending', telegram: 'pending' };

          if (publishTelegram && res?.ok && res.result?.message_id) {
             updates.telegram_message_id = res.result.message_id.toString();
             syncStatus.telegram = 'success';
          }
          
          // Social Media Sync for Cars
          const fbIgPhotoUrl = imagesToPost.length > 0 ? imagesToPost : [dynamicCarUrl];
          const fbIgCaption = (publishFacebook || publishInstagram || publishThreads || publishTiktok)
            ? await generateSocialCaption(record, 'car', link)
            : '';

          if (publishFacebook) {
            const fbData = await postToFacebook(fbIgCaption, fbIgPhotoUrl);
            if (fbData && (fbData.post_id || fbData.id)) {
              updates.facebook_post_id = fbData.post_id || fbData.id;
              syncStatus.facebook = 'success';
            }
          }

          if (publishInstagram) {
            const igData = await postToInstagram(fbIgCaption, fbIgPhotoUrl);
            if (igData && (igData.id || igData.media_id)) {
              updates.instagram_post_id = igData.id || igData.media_id;
              syncStatus.instagram = 'success';
            }
          }

          if (publishTiktok) {
            const tkData = await postToTikTok(fbIgCaption, fbIgPhotoUrl, supabase);
            if (tkData?.data?.publish_id) {
              updates.tiktok_post_id = tkData.data.publish_id;
              syncStatus.tiktok = 'success';
            }
          }

          if (publishThreads) {
            const thData = await postToThreads(fbIgCaption, fbIgPhotoUrl);
            if (thData && (thData.id || thData.media_id)) {
              updates.threads_post_id = thData.id || thData.media_id;
              syncStatus.threads = 'success';
            } else {
              syncStatus.threads = 'failed';
              syncStatus.threads_error = thData?.error?.message || JSON.stringify(thData);
            }
          }

          updates.sync_status = syncStatus;
          finalSyncStatus = syncStatus;
          if (Object.keys(updates).length > 0) {
            await supabase.from('ads').update(updates).eq('id', record.id);
          }

          if (record.phone) {
            await sendWhatsAppWelcome(record.phone, carTitle, link);
          }
        }
        // --- 2. GENERAL PRODUCTS ---
        else if (payload.table === 'products' && PRODUCT_CHANNEL) {
          const prodId = record.short_id || record.id;
          const link = `https://www.souqbaghdad.store/product/${prodId}`;
          const condStr = record.condition === 'new' ? '✨ جديد' : '👌 مستعمل';
          let safeDesc = (record.description || '').substring(0, 200);
          if ((record.description || '').length > 200) safeDesc += '...';

          const caption = `📦 <b>منتج جديد: ${record.title || ''}</b>\n\n` +
                          `🏷️ <b>الحالة:</b> ${condStr}\n` +
                          `💰 <b>السعر:</b> ${formatTgPrice(record.price)}\n` +
                          `📍 <b>المحافظة:</b> ${record.governorate || 'بغداد'}\n` +
                          `📝 <b>التفاصيل:</b> ${safeDesc}\n\n` +
                          `👤 <b>البائع:</b> ${record.seller_name || 'بائع'}\n` +
                          `📞 <b>التواصل:</b> عبر المنصة مباشرة\n` +
                          `🔗 ${link}\n\n` +
                          `📣 @${BOT_USERNAME}`;

          const row1 = [{ text: 'عرض التفاصيل 🌐', url: link }];
          const row2 = [];
          if (record.phone) {
             let cleanPhone = record.phone.replace(/[^0-9+]/g, '');
             if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
             else cleanPhone = cleanPhone.replace('+', '');
             row2.push({ text: 'واتساب 💬', url: `https://wa.me/${cleanPhone}` });
             row2.push({ text: 'تيليكرام ✈️', url: `https://t.me/+${cleanPhone}` });
          }
          const replyMarkup = {
            inline_keyboard: row2.length > 0 ? [row1, row2] : [row1]
          };

          const dynamicProductUrl = `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=post&category=products&title=${encodeURIComponent(record.title || 'منتج معروض')}&subtitle=${encodeURIComponent(condStr)}&subdesc=${encodeURIComponent((safeDesc || 'متوفر الآن للشراء').substring(0, 100))}&fare=${encodeURIComponent(formatTgPrice(record.price))}&regions=${encodeURIComponent(record.governorate || 'بغداد')}&destination=${encodeURIComponent(record.seller_name || 'بائع موثوق')}&link=${encodeURIComponent(link)}&short_id=${encodeURIComponent(prodId)}`;

          const imageUrl = record.images && record.images.length > 0 ? record.images[0] : null;
          let res;
          if (publishTelegram) {
            const mainPhoto = imageUrl || dynamicProductUrl;
            // Send once to main product channel
            res = await sendPhoto(PRODUCT_CHANNEL, mainPhoto, caption, replyMarkup);
          }
          const updates: any = {};
          let syncStatus = record.sync_status || { facebook: 'pending', instagram: 'pending', telegram: 'pending' };

          if (publishTelegram && res?.ok && res.result?.message_id) {
             updates.telegram_message_id = res.result.message_id.toString();
             syncStatus.telegram = 'success';
          }
          
          const fbIgPhotoUrl = record.images && record.images.length > 0 ? record.images : [dynamicProductUrl];
          const fbIgCaption = (publishFacebook || publishInstagram || publishThreads || publishTiktok)
            ? await generateSocialCaption(record, 'product', link)
            : '';
                              
          if (publishFacebook) {
            const fbData = await postToFacebook(fbIgCaption, fbIgPhotoUrl);
            if (fbData && (fbData.post_id || fbData.id)) {
              updates.facebook_post_id = fbData.post_id || fbData.id;
              syncStatus.facebook = 'success';
            }
          }
          
          if (publishInstagram) {
            const igData = await postToInstagram(fbIgCaption, fbIgPhotoUrl);
            if (igData && (igData.id || igData.media_id)) {
               updates.instagram_post_id = igData.id || igData.media_id;
               syncStatus.instagram = 'success';
            }
          }
          
          if (publishTiktok) {
            const tkData = await postToTikTok(fbIgCaption, fbIgPhotoUrl, supabase);
            if (tkData?.data?.publish_id) {
               updates.tiktok_post_id = tkData.data.publish_id;
               syncStatus.tiktok = 'success';
            }
          }
          
          if (publishThreads) {
            const thData = await postToThreads(fbIgCaption, fbIgPhotoUrl);
            if (thData && (thData.id || thData.media_id)) {
               updates.threads_post_id = thData.id || thData.media_id;
               syncStatus.threads = 'success';
            }
          }
          
          updates.sync_status = syncStatus;
          finalSyncStatus = syncStatus;
          if (Object.keys(updates).length > 0) {
             await supabase.from('products').update(updates).eq('id', record.id);
          }
          
          if (record.phone) {
             await sendWhatsAppWelcome(record.phone, record.title || '', link);
          }
        }
        // --- 3. GENERAL ADS ---
        else if (payload.table === 'ads' && record.category !== 'transport' && record.category !== 'vehicles' && record.category !== 'cars' && PRODUCT_CHANNEL) {
          let descText = record.description || '';
          if (typeof descText !== 'string') {
            // If it's an object, try to extract a readable description
            try { 
              const parsed = descText;
              descText = parsed.note || parsed.description || parsed.details || JSON.stringify(parsed); 
            } catch(e){ descText = String(descText); }
          } else if (descText.startsWith('{') || descText.startsWith('[')) {
            // It's a JSON string, parse and extract readable text
            try {
              const parsed = JSON.parse(descText);
              descText = parsed.note || parsed.description || parsed.details || '';
            } catch(e){}
          }
          let safeDesc = descText.substring(0, 200);
          if (descText.length > 200) safeDesc += '...';

          const adId = record.short_id || record.id;
          const link = `https://www.souqbaghdad.store/ad/${adId}`;

          const caption = `📢 <b>إعلان جديد: ${record.title || ''}</b>\n\n` +
                          `💰 <b>السعر:</b> ${formatTgPrice(record.price)}\n` +
                          `📍 <b>المكان:</b> ${record.location || record.city || record.governorate || 'بغداد'}\n` +
                          `📝 <b>التفاصيل:</b> ${safeDesc}\n\n` +
                          `👤 <b>الناشر:</b> ${record.seller_name || 'مستخدم'}\n` +
                          `📞 <b>التواصل:</b> عبر المنصة مباشرة\n` +
                          `🔗 ${link}\n\n` +
                          `📣 @${BOT_USERNAME}`;

          const row1 = [{ text: 'عرض التفاصيل 🌐', url: link }];
          const row2 = [];
          if (record.phone) {
             let cleanPhone = record.phone.replace(/[^0-9+]/g, '');
             if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
             else cleanPhone = cleanPhone.replace('+', '');
             row2.push({ text: 'واتساب 💬', url: `https://wa.me/${cleanPhone}` });
             row2.push({ text: 'تيليكرام ✈️', url: `https://t.me/+${cleanPhone}` });
          }
          const replyMarkup = {
            inline_keyboard: row2.length > 0 ? [row1, row2] : [row1]
          };

          const dynamicAdUrl = `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=post&category=general&title=${encodeURIComponent(record.title || 'إعلان جديد')}&subtitle=${encodeURIComponent(record.location || 'بغداد')}&subdesc=${encodeURIComponent((safeDesc || 'متوفر للتواصل والشراء').substring(0, 100))}&fare=${encodeURIComponent(formatTgPrice(record.price))}&regions=${encodeURIComponent(record.location || 'بغداد')}&destination=${encodeURIComponent(record.seller_name || 'الناشر')}&link=${encodeURIComponent(link)}&short_id=${encodeURIComponent(adId)}`;

          const imageUrl = record.images && record.images.length > 0 ? record.images[0] : null;
          const fbIgPhotoUrl = record.images && record.images.length > 0 ? record.images : [dynamicAdUrl];
          
          let res;
          if (publishTelegram) {
            const mainPhoto = imageUrl || dynamicAdUrl;
            // Send once to main product/ads channel
            res = await sendPhoto(PRODUCT_CHANNEL, mainPhoto, caption, replyMarkup);
          }
          const updates: any = {};
          let syncStatus = record.sync_status || { facebook: 'pending', instagram: 'pending', telegram: 'pending' };

          if (publishTelegram && res?.ok && res.result?.message_id) {
             updates.telegram_message_id = res.result.message_id.toString();
             syncStatus.telegram = 'success';
          }
          
          const fbIgCaption = (publishFacebook || publishInstagram || publishThreads || publishTiktok)
            ? await generateSocialCaption(record, 'ad', link)
            : '';
                              
          if (publishFacebook) {
            const fbData = await postToFacebook(fbIgCaption, fbIgPhotoUrl);
            if (fbData && (fbData.post_id || fbData.id)) {
              updates.facebook_post_id = fbData.post_id || fbData.id;
              syncStatus.facebook = 'success';
            }
          }
          
          if (publishInstagram) {
            const igData = await postToInstagram(fbIgCaption, fbIgPhotoUrl);
            if (igData && (igData.id || igData.media_id)) {
              updates.instagram_post_id = igData.id || igData.media_id;
              syncStatus.instagram = 'success';
            }
          }
          
          if (publishTiktok) {
            const tkData = await postToTikTok(fbIgCaption, fbIgPhotoUrl, supabase);
            if (tkData?.data?.publish_id) {
               updates.tiktok_post_id = tkData.data.publish_id;
               syncStatus.tiktok = 'success';
            }
          }
          
          if (publishThreads) {
            const thData = await postToThreads(fbIgCaption, fbIgPhotoUrl);
            if (thData && (thData.id || thData.media_id)) {
               updates.threads_post_id = thData.id || thData.media_id;
               syncStatus.threads = 'success';
            } else {
               syncStatus.threads = 'failed';
               syncStatus.threads_error = thData?.error?.message || JSON.stringify(thData);
            }
          }
          
          updates.sync_status = syncStatus;
          finalSyncStatus = syncStatus;
          if (Object.keys(updates).length > 0) {
             await supabase.from('ads').update(updates).eq('id', record.id);
          }
          
          if (record.phone) {
             await sendWhatsAppWelcome(record.phone, record.title || '', link);
          }
        }
        // --- 4. TRANSPORT ADS (خطوط النقل) ---
        else if ((payload.table === 'ads' && record.category === 'transport') || payload.table === 'transport_ads') {
          // Prevent duplicate execution if already synced
          if (record.id && payload.table === 'ads') {
            const { data: existingAd } = await supabase.from('ads').select('telegram_message_id, sync_status').eq('id', record.id).maybeSingle();
            if (existingAd?.telegram_message_id || existingAd?.sync_status?.telegram === 'success') {
              console.log(`Transport ad ${record.id} already published to Telegram, skipping duplicate.`);
              return new Response(JSON.stringify({ ok: true, message: 'Already published' }), { 
                status: 200, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              });
            }
          }

          const typeStr = record.type === 'offer' ? '🚗 أوفر خط نقل (سائق)' : '🙋‍♂️ أبحث عن خط نقل (مطلوب)';
          let desc: any = {};
          try { desc = typeof record.description === 'string' ? JSON.parse(record.description) : record.description; } catch(e){}
          
          const catType = desc?.categoryType === 'employee' ? '💼 خط موظفين' : (desc?.categoryType === 'emergency' ? '🚨 نقل خاص' : '🎓 خط طلاب');
          const targetStr = desc?.targetAudience || 'الجميع';
          const seatsStr = desc?.seats ? `${desc.seats} مقاعد` : 'محدد';
          const shiftStr = desc?.shift || 'صباحي';
          const vehicleStr = desc?.vehicleType || 'صالون';
          const adId = record.short_id || record.id;
          const link = `https://www.souqbaghdad.store/transport/card/${adId}`;

          const msg = `🚌 <b>إعلان خط نقل جديد — سوق بغداد</b>\n\n` +
                      `📌 <b>النوع:</b> ${typeStr}\n` +
                      `🏷️ <b>الفئة:</b> ${catType} (${targetStr})\n` +
                      `📍 <b>مناطق الانطلاق:</b> ${record.location || record.regions || 'بغداد'}\n` +
                      `🏢 <b>الوجهة:</b> ${record.city || record.university || 'بغداد'}\n` +
                      `⏰ <b>وقت الدوام:</b> ${shiftStr}\n` +
                      `🚗 <b>المركبة:</b> ${vehicleStr} | <b>المقاعد:</b> ${seatsStr}\n` +
                      `💰 <b>الأجرة:</b> ${formatTgPrice(record.price)}\n` +
                      (record.phone ? `📞 <b>التواصل:</b> ${record.phone}\n\n` : `\n`) +
                      `📣 <b>#رقم_الخط_${adId}</b> | @${BOT_USERNAME}`;
                      
          let cleanPhone = (record.phone || '').replace(/[^0-9+]/g, '');
          if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
          else cleanPhone = cleanPhone.replace('+', '');

          const contactRow = [];
          if (cleanPhone) {
            contactRow.push({ text: '💬 تواصل واتساب', url: `https://wa.me/${cleanPhone}` });
            contactRow.push({ text: '✈️ تواصل تيليكرام', url: `https://t.me/+${cleanPhone}` });
          }

          const inlineKeyboard = [
            [{ text: '🌐 التفاصيل الكاملة وحجز المقعد', url: link }]
          ];
          if (contactRow.length > 0) inlineKeyboard.push(contactRow);
          inlineKeyboard.push([{ text: '🚌 انشر خطك مجاناً عبر البوت', url: `https://t.me/${BOT_USERNAME}` }]);

          const replyMarkup = { inline_keyboard: inlineKeyboard };
                      
          const cleanTitle = 'خط نقل جديد في بغداد';
          const cleanSubtitle = (record.university || record.city || 'كلية الرافدين').replace(/<[^>]*>?/gm, '').trim();
          const cleanSubdesc = `${catType} (${targetStr})`.replace(/<[^>]*>?/gm, '').trim();
          
          // Pure regions text without HTML tags
          const rawReg = record.regions || record.location || 'بغداد';
          const cleanRegions = rawReg.replace(/<[^>]*>?/gm, '').replace(/&lt;.*?&gt;/gm, '').trim();
          const cleanDestination = (record.city || record.university || 'كلية الرافدين').replace(/<[^>]*>?/gm, '').trim();
          
          // Format fare accurately (match 100,000 د.ع)
          let cleanFare = 'حسب الاتفاق';
          if (record.price) {
            const rawNum = String(record.price).replace(/[^0-9]/g, '');
            if (rawNum && Number(rawNum) > 0) {
              cleanFare = `${Number(rawNum).toLocaleString('en-US')} د.ع`;
            } else if (typeof record.price === 'string' && record.price.trim()) {
              cleanFare = record.price.trim();
            }
          } else if (record.fare) {
            cleanFare = record.fare;
          }

          // Dynamic Programmatic Templates (1080x1350 Post & 1080x1920 Story)
          const dynamicPostUrl = `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=post&title=${encodeURIComponent(cleanTitle)}&subtitle=${encodeURIComponent(cleanSubtitle)}&subdesc=${encodeURIComponent(cleanSubdesc)}&regions=${encodeURIComponent(cleanRegions)}&destination=${encodeURIComponent(cleanDestination)}&fare=${encodeURIComponent(cleanFare)}&link=${encodeURIComponent(link)}&short_id=${encodeURIComponent(adId)}`;
          const dynamicStoryUrl = `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=story&title=${encodeURIComponent(cleanTitle)}&subtitle=${encodeURIComponent(cleanSubtitle)}&subdesc=${encodeURIComponent(cleanSubdesc)}&regions=${encodeURIComponent(cleanRegions)}&destination=${encodeURIComponent(cleanDestination)}&fare=${encodeURIComponent(cleanFare)}&link=${encodeURIComponent(link)}&short_id=${encodeURIComponent(adId)}`;

          const rafdainTerms = ['الرافدين', 'الرفدين'];
          const isAlRafdain = rafdainTerms.some(term => 
            (record.university && record.university.includes(term)) || 
            (record.city && record.city.includes(term)) || 
            (desc?.targetAudience && desc.targetAudience.includes(term)) ||
            (record.destination && record.destination.includes(term))
          );
          
          const useAlRafdainFb = forceFacebookPage ? (forceFacebookPage === 'alrafdain') : isAlRafdain;
          const useAlRafdainIg = forceInstagramPage ? (forceInstagramPage === 'alrafdain') : isAlRafdain;

          let res;
          if (publishTelegram) {
            const transportPhoto = (record.images && Array.isArray(record.images) && record.images.length > 0)
              ? record.images[0]
              : dynamicPostUrl;
            // 1. Send to main transport channel: @souqbaghdad_lines
            const targetLinesChannel = LINES_CHANNEL_ID || LINES_CHANNEL;
            res = await sendPhoto(targetLinesChannel, transportPhoto, msg, replyMarkup);

            // 2. If it is for Al-Rafdain, ALSO publish to @ruc_1
            if (isAlRafdain) {
              try {
                await sendPhoto(ALRAFDAIN_TELEGRAM_CHANNEL, transportPhoto, msg, replyMarkup);
              } catch(e) {
                console.error('Error sending to Al-Rafdain Telegram channel @ruc_1:', e);
              }
            }
          }
          const updates: any = {};
          let syncStatus = record.sync_status || { facebook: 'pending', instagram: 'pending', telegram: 'pending' };

          if (publishTelegram && res?.ok && res.result?.message_id) {
             updates.telegram_message_id = res.result.message_id.toString();
             syncStatus.telegram = 'success';
          }
          
          const fbIgCaption = (publishFacebook || publishInstagram || publishThreads || publishTiktok)
            ? await generateSocialCaption({ ...record, ...desc }, 'transport', link)
            : '';
          
          if (publishFacebook) {
            let fbData;
            if (useAlRafdainFb && ALRAFDAIN_FB_TOKEN && ALRAFDAIN_FB_PAGE_ID) {
              fbData = await postToFacebook(fbIgCaption, dynamicPostUrl, ALRAFDAIN_FB_TOKEN, ALRAFDAIN_FB_PAGE_ID);
            } else {
              fbData = await postToFacebook(fbIgCaption, dynamicPostUrl);
            }
            
            if (fbData && (fbData.post_id || fbData.id)) {
              updates.facebook_post_id = fbData.post_id || fbData.id;
              syncStatus.facebook = 'success';
            }
          }
          
          if (publishInstagram) {
            let igData;
            if (useAlRafdainIg && ALRAFDAIN_FB_TOKEN && ALRAFDAIN_IG_ID) {
              igData = await postToInstagramStory(dynamicStoryUrl, ALRAFDAIN_IG_ID, ALRAFDAIN_FB_TOKEN);
            } else {
              igData = await postToInstagram(fbIgCaption, dynamicPostUrl);
            }
            
            if (igData && (igData.id || igData.media_id)) {
               updates.instagram_post_id = igData.id || igData.media_id;
               syncStatus.instagram = 'success';
            }
          }
          
          if (publishTiktok) {
            const tkData = await postToTikTok(fbIgCaption, dynamicPostUrl, supabase);
            if (tkData?.data?.publish_id) {
               updates.tiktok_post_id = tkData.data.publish_id;
               syncStatus.tiktok = 'success';
            }
          }

          if (publishThreads) {
            const thData = await postToThreads(fbIgCaption, dynamicPostUrl);
            if (thData && (thData.id || thData.media_id)) {
               updates.threads_post_id = thData.id || thData.media_id;
               syncStatus.threads = 'success';
            } else {
               syncStatus.threads = 'failed';
               syncStatus.threads_error = thData?.error?.message || JSON.stringify(thData);
            }
          }
          
          updates.sync_status = syncStatus;
          finalSyncStatus = syncStatus;
          if (Object.keys(updates).length > 0) {
             await supabase.from(payload.table).update(updates).eq('id', record.id);
          }
          
          if (record.phone) {
             await sendWhatsAppWelcome(record.phone, `${catType} - ${record.location || 'خط نقل'}`, link);
          }
        }
      }

      return new Response(JSON.stringify({ ok: true, syncStatus: finalSyncStatus }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // --- Telegram Message / Callback Processing ---
    const update = payload;
    
    let chatId: number;
    let text = '';
    let contact = null;
    let photo = null;
    let voice = null;
    let callbackQuery = null;

    if (update.message) {
      chatId = update.message.chat.id;
      text = update.message.text || '';
      contact = update.message.contact;
      photo = update.message.photo;
      voice = update.message.voice;
    } else if (update.callback_query) {
      callbackQuery = update.callback_query;
      chatId = callbackQuery.message.chat.id;
      text = callbackQuery.data;
    } else {
      return new Response('OK', { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch user and state
    const { data: tgUser } = await supabase.from('telegram_users').select('*').eq('telegram_chat_id', chatId).single();
    let state = tgUser?.bot_state || {};
    const userId = tgUser?.user_id;
    const phone = tgUser?.phone_number;

    const callbackMsgId = callbackQuery?.message?.message_id;

    // Helper: Update existing message in-place or send new
    const updateOrSend = async (msgText: string, markup?: any) => {
      if (callbackMsgId) {
        try {
          const editRes = await editMessageText(chatId, callbackMsgId, msgText, markup);
          if (editRes?.ok) return editRes;
        } catch(e) {
          console.error('editMessageText failed, sending new:', e);
        }
      }
      return await sendMessage(chatId, msgText, markup);
    };

    // Helper: Reset & Show Main Menu
    const showMainMenu = async (aiText?: string, editCurrent = false) => {
      state = {};
      if (userId) {
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
      }
      
      let userInfo = '';
      if (userId) {
        const { data: profile } = await supabase.from('profiles').select('full_name, points').eq('id', userId).maybeSingle();
        if (profile) {
          userInfo = `👤 <b>${profile.full_name || 'مستخدم'}</b>\n🪙 <b>رصيد النقاط:</b> ${profile.points || 0}\n\n`;
        }
      }

      let messageToSend = `🚗 <b>بوت سوق بغداد — قسم السيارات وخطوط النقل</b> 🇮🇶\n\n${userInfo}اختر ما تريد القيام به من القائمة أدناه:`;
      if (aiText) {
        messageToSend = aiText + `\n\n${userInfo}👇 <b>القائمة الرئيسية:</b>`;
      }
      const menuMarkup = {
        inline_keyboard: [
          [{ text: '🚗 اعرض سيارتك للبيع مجاناً', callback_data: 'publish_car' }],
          [{ text: '🚌 انشر خط نقل (سائق / راكب)', callback_data: 'publish_transport' }, { text: '📦 نشر منتج عام', callback_data: 'publish_product' }],
          [{ text: '📋 إدارة إعلاناتي وخطوطي', callback_data: 'manage_my_ads' }],
          [{ text: '🎟️ تعبئة بروموكود', callback_data: 'redeem_promo' }, { text: '💳 شراء نقاط', callback_data: 'buy_points' }],
          [{ text: '📖 كيفية التسجيل', callback_data: 'how_to_register' }, { text: '🔑 نسيت كلمة المرور', callback_data: 'forgot_password' }],
          [{ text: '❓ الأسئلة الشائعة', callback_data: 'faq' }, { text: '📞 الدعم الفني', callback_data: 'contact_support' }],
          [{ text: '🔔 إدارة إشعاراتي', callback_data: 'manage_alerts' }, { text: '🔌 تحديث/إعادة ربط الحساب', callback_data: 'relink_account' }],
        ]
      };

      if (editCurrent && callbackMsgId) {
        try {
          const editRes = await editMessageText(chatId, callbackMsgId, messageToSend, menuMarkup);
          if (editRes?.ok) return editRes;
        } catch(e){}
      }
      return await sendMessage(chatId, messageToSend, menuMarkup);
    };

    // --- Start / Register Command ---
    if (text === '/start' || text === '/relink') {
      if (text === '/relink') {
        await supabase.from('telegram_users').delete().eq('telegram_chat_id', chatId);
      }
      await sendMessage(chatId, 'مرحباً بك في بوت <b>سوق بغداد الرقمي</b>! 🇮🇶🚗🚌\n\nسوق السيارات والمنتجات وخطوط النقل الأول في العراق.\nيرجى مشاركة رقم هاتفك للتحقق من حسابك والبدء بالنشر فوراً.', {
        keyboard: [[{ text: '📱 مشاركة رقم الهاتف', request_contact: true }]],
        one_time_keyboard: true,
        resize_keyboard: true
      });
      return new Response('OK', { status: 200 });
    }

    if (text && text.startsWith('/promo')) {
      const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (adminProfile?.role === 'admin' || adminProfile?.role === 'owner') {
        const parts = text.split(' ');
        const points = parseInt(parts[1]) || 100;
        const maxUses = parseInt(parts[2]) || 1;
        const code = 'BOT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        await supabase.from('promo_codes').insert({ code, points, max_uses: maxUses });
        
        const explanationMsg = `🎉 <b>تهانينا! لقد حصلت على كود تعبئة نقاط من سوق بغداد!</b>\n\n` +
                               `🪙 <b>النقاط المكتسبة:</b> ${points} نقطة\n\n` +
                               `📌 <b>طريقة التعبئة:</b>\n` +
                               `1️⃣ قم بزيارة: https://www.souqbaghdad.store\n` +
                               `2️⃣ من الشريط العلوي اضغط على <b>المحفظة 💼</b>.\n` +
                               `3️⃣ الصق الكود واضغط تفعيل.\n\n` +
                               `👇 <b>الكود الخاص بك:</b>\n<code>${code}</code>`;
        
        await sendMessage(chatId, `✅ تم توليد الكود بنجاح!\n\nيمكنك إعادة توجيه الرسالة أدناه:`);
        await sendMessage(chatId, explanationMsg, {
          inline_keyboard: [[{ text: '📋 نسخ الكود', copy_text: { text: code } }]]
        });
      } else {
        await sendMessage(chatId, 'عذراً، هذا الأمر مخصص للإدارة فقط.');
      }
      return new Response('OK', { status: 200 });
    }

    if (contact) {
      let phoneNumber = contact.phone_number;
      if (!phoneNumber.startsWith('+')) phoneNumber = '+' + phoneNumber;

      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      const localPhone = cleanPhone.startsWith('964') ? '0' + cleanPhone.substring(3) : cleanPhone;
      const intlPhone = cleanPhone.startsWith('964') ? '+' + cleanPhone : (cleanPhone.startsWith('0') ? '+964' + cleanPhone.substring(1) : '+' + cleanPhone);

      const { data: profileMatches } = await supabase.from('profiles')
        .select('id, phone, email, points')
        .or(`phone.eq.${localPhone},phone.eq.${intlPhone},phone.eq.${cleanPhone}`);
        
      let matchedUserId = null;
      if (profileMatches && profileMatches.length > 0) {
        profileMatches.sort((a, b) => {
          if (a.email && !b.email) return -1;
          if (!a.email && b.email) return 1;
          return (b.points || 0) - (a.points || 0);
        });
        matchedUserId = profileMatches[0].id;
      }

      let isNewAccount = false;
      if (!matchedUserId) {
        isNewAccount = true;
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          phone: intlPhone,
          password: Math.random().toString(36).slice(-8),
          phone_confirm: true
        });
        if (createError) {
          await sendMessage(chatId, 'عذراً، الرقم مسجل مسبقاً أو حدث خطأ أثناء التحقق.');
          return new Response('OK', { status: 200 });
        }
        matchedUserId = newUser.user.id;
        
        const fullName = update.message.from.first_name + (update.message.from.last_name ? ' ' + update.message.from.last_name : '');
        await supabase.from('profiles').upsert({ id: matchedUserId, full_name: fullName, phone: localPhone, role: 'user', points: 10 });
      } else {
        // If existing profile has 0 points, grant 10 points gift
        const { data: curProf } = await supabase.from('profiles').select('points').eq('id', matchedUserId).maybeSingle();
        if (curProf && (curProf.points === null || curProf.points === 0)) {
          await supabase.from('profiles').update({ points: 10 }).eq('id', matchedUserId);
          isNewAccount = true;
        }
      }

      await supabase.from('telegram_users').upsert({
        user_id: matchedUserId,
        telegram_chat_id: chatId,
        phone_number: phoneNumber,
        bot_state: {}
      }, { onConflict: 'telegram_chat_id' });

      const welcomeMsg = isNewAccount
        ? '🎉 <b>أهلاً وسهلاً بك في منصة وبوت سوق بغداد! 🇮🇶</b>\n🎁 <b>تم منحك 10 نقاط مجانية</b> كهدية ترحيبية لنشر إعلانات سياراتك وخطوط النقل فوراً.'
        : '🎉 <b>تم التسجيل وربط الحساب بنجاح!</b>\nيمكنك الآن البدء بنشر إعلانات السيارات والخطوط والمنتجات فوراً.';

      await sendMessage(chatId, welcomeMsg, { remove_keyboard: true });
      await showMainMenu();
      return new Response('OK', { status: 200 });
    }

    if (!userId) {
      if (callbackQuery) await answerCallbackQuery(callbackQuery.id, 'يجب التسجيل أولاً');
      await sendMessage(chatId, '⚠️ يرجى إرسال رقم هاتفك للبدء بالنشر.\nأرسل /start');
      return new Response('OK', { status: 200 });
    }

    // --- Handle Callback Queries (Button Actions) ---
    if (callbackQuery) {
      await answerCallbackQuery(callbackQuery.id);
      const action = callbackQuery.data;
      
      if (action === 'relink_account') {
        await supabase.from('telegram_users').delete().eq('telegram_chat_id', chatId);
        await sendMessage(chatId, 'تم إلغاء ربط حسابك الحالي بالبوت.\n\nيرجى مشاركة رقم هاتفك للتحقق وإعادة الربط.', {
          keyboard: [[{ text: '📱 مشاركة رقم الهاتف', request_contact: true }]],
          one_time_keyboard: true,
          resize_keyboard: true
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'main_menu' || action === 'cancel_wizard') {
        if (action === 'cancel_wizard') {
          await updateOrSend('❌ تم إلغاء العملية.');
        }
        await showMainMenu(undefined, true);
        return new Response('OK', { status: 200 });
      }

      // ==========================================
      // 🚗 CAR WIZARD (Interactive Step-by-Step)
      // ==========================================
      if (action === 'publish_car') {
        const { data: profile } = await supabase.from('profiles').select('points, role').eq('id', userId).maybeSingle();
        if (profile?.role !== 'admin' && profile?.role !== 'owner' && (profile?.points || 0) < 1) {
          await updateOrSend('❌ عذراً، رصيد النقاط الخاص بك غير كافٍ لنشر إعلان. يرجى شحن المحفظة أولاً.', {
            inline_keyboard: [[{ text: '💳 شراء نقاط', callback_data: 'buy_points' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
          });
          return new Response('OK', { status: 200 });
        }

        state = { step: 'car_brand', data: { images: [] } };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const brandButtons = CAR_BRANDS.map(row => row.map(b => ({ text: b, callback_data: `car_brand_${b}` })));
        brandButtons.push([{ text: '❌ إلغاء العملية', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`🚗 <b>الخطوة 1 من 10 — نوع السيارة (الماركة)</b>\n\nاختر نوع سيارتك من القائمة أدناه 👇`, {
          inline_keyboard: brandButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('car_brand_')) {
        const brand = action.replace('car_brand_', '');
        state.data.brand = brand;
        state.step = 'car_model';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        await updateOrSend(`🚗 <b>الخطوة 2 من 10 — الموديل</b>\n\nالنوع المختار: <b>${brand}</b>\nاكتب اسم موديل السيارة الآن:\n(مثال: النترا، كورولا، سبورتاج، سنتافي، تاهو، سوناتا...)`, {
          inline_keyboard: [
            [{ text: '◀️ السابق', callback_data: 'publish_car' }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('car_year_')) {
        const yearVal = action.replace('car_year_', '');
        if (yearVal === 'older') {
          state.step = 'car_year_custom';
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          await updateOrSend(`📅 <b>الخطوة 3 من 10 — سنة الصنع</b>\n\nاكتب سنة صنع السيارة رقماً (مثال: 2005 أو 1998):`, {
            inline_keyboard: [[{ text: '◀️ السابق', callback_data: `car_brand_${state.data.brand || 'هيونداي'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]]
          });
          return new Response('OK', { status: 200 });
        }

        state.data.year = yearVal;
        state.step = 'car_gov';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const govButtons = IRAQI_GOVERNORATES.map(row => row.map(g => ({ text: g, callback_data: `car_gov_${g}` })));
        govButtons.push([{ text: '◀️ السابق', callback_data: `car_brand_${state.data.brand || 'هيونداي'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`📍 <b>الخطوة 4 من 10 — المحافظة</b>\n\nاختر محافظة تواجد السيارة 👇`, {
          inline_keyboard: govButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('car_gov_')) {
        const gov = action.replace('car_gov_', '');
        state.data.governorate = gov;
        state.step = 'car_origin';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const originButtons = CAR_SPECS_ORIGINS.map(row => row.map(o => ({ text: o, callback_data: `car_origin_${o}` })));
        originButtons.push([{ text: '◀️ السابق', callback_data: `car_year_${state.data.year || '2020'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`📋 <b>الخطوة 5 من 10 — المواصفات والوارد</b>\n\nاختر وارد وحالة صبغ السيارة 👇`, {
          inline_keyboard: originButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('car_origin_')) {
        const origin = action.replace('car_origin_', '');
        state.data.origin = origin;
        state.step = 'car_mileage';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        await updateOrSend(`🛣️ <b>الخطوة 6 من 10 — الكيلومترات (الممشى)</b>\n\nاكتب عدد الكيلومترات المقطوعة بالأرقام فقط:\n(مثال: 110000 أو 50000 أو 0 إذا كانت زيرو)`, {
          inline_keyboard: [
            [{ text: '◀️ السابق', callback_data: `car_gov_${state.data.governorate || 'بغداد'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('car_currency_')) {
        const curr = action.replace('car_currency_', '') === 'usd' ? '$' : 'د.ع';
        state.data.currency = curr;
        state.step = 'car_price';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const examplePrice = curr === '$' ? '14500 أو 18000' : '18000000 أو 22500000';
        await updateOrSend(`💰 <b>الخطوة 8 من 10 — السعر</b>\n\nالعملة: <b>${curr === '$' ? 'دولار أمريكي $' : 'دينار عراقي د.ع'}</b>\nاكتب السعر المطلوب بالأرقام فقط:\n(مثال: ${examplePrice})`, {
          inline_keyboard: [
            [{ text: '◀️ السابق', callback_data: `car_origin_${state.data.origin || 'وارد خليجي'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'car_images_done') {
        state.step = 'car_phone';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const currentPhone = phone || '';
        const phoneButtons = [];
        if (currentPhone) {
          phoneButtons.push([{ text: `📱 استخدام رقمي الحالي (${currentPhone})`, callback_data: 'car_phone_current' }]);
        }
        phoneButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`📞 <b>الخطوة 10 من 10 — رقم الهاتف للتواصل</b>\n\nاكتب رقم الهاتف الخاص بك للتواصل، أو اضغط على الزر لاستخدام رقمك المسجل:`, {
          inline_keyboard: phoneButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'car_phone_current') {
        state.data.phone = phone;
        state.step = 'car_review';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        // Show Review Card
        const currencySymbol = state.data.currency || 'د.ع';
        const formattedPrice = formatTgPrice(state.data.price, currencySymbol);
        const carTitle = `${state.data.brand || ''} ${state.data.model || ''} ${state.data.year || ''}`.trim();
        const mileageStr = state.data.mileage ? `${parseInt(state.data.mileage).toLocaleString('en-US')} كم` : 'غير محدد';
        const imgCount = state.data.images?.length || 0;

        const reviewText = `🔍 <b>مراجعة أخيرة قبل النشر</b>\nتأكد من صحة المعلومات، ثم اضغط «✅ نشر الإعلان الآن»:\n\n` +
                           `🚗 <b>النوع والموديل:</b> ${carTitle}\n` +
                           `📅 <b>السنة:</b> ${state.data.year || 'غير محدد'}\n` +
                           `🛣️ <b>الكيلومتر:</b> ${mileageStr}\n` +
                           `📍 <b>الموقع:</b> ${state.data.governorate || 'بغداد'}\n` +
                           `📋 <b>المواصفات:</b> ${state.data.origin || 'وارد عام'}\n` +
                           `💰 <b>السعر:</b> ${formattedPrice}\n` +
                           `📞 <b>التواصل:</b> ${state.data.phone}\n` +
                           `📸 <b>الصور:</b> ${imgCount} صور مرفقة\n`;

        await updateOrSend(reviewText, {
          inline_keyboard: [
            [{ text: '✅ نشر الإعلان الآن', callback_data: 'car_confirm_publish' }],
            [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'car_confirm_publish') {
        await updateOrSend('⏳ جاري نشر إعلان سيارتك في المنصة وقناة التليكرام وشبكات التواصل...');

        const cost = 1;
        const { data: userProfile } = await supabase.from('profiles').select('points, role, full_name, avatar_url').eq('id', userId).single();
        if (userProfile?.role !== 'admin' && userProfile?.role !== 'owner') {
          if (!userProfile || (userProfile.points || 0) < cost) {
            await updateOrSend('❌ عذراً، ليس لديك نقاط كافية. يرجى التوجه لزر "شراء نقاط".', {
               inline_keyboard: [[{ text: '💳 شراء نقاط', callback_data: 'buy_points' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
            });
            state = {};
            await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
            return new Response('OK', { status: 200 });
          }
          await supabase.from('profiles').update({ points: userProfile.points - cost }).eq('id', userId);
        }

        const carTitle = `${state.data.brand || ''} ${state.data.model || ''} ${state.data.year || ''}`.trim() || 'سيارة للبيع';
        const shortId = Math.random().toString(36).substring(2, 7).toUpperCase();

        const carDescriptionJson = JSON.stringify({
          brand: state.data.brand,
          model: state.data.model,
          year: state.data.year,
          origin: state.data.origin,
          mileage: state.data.mileage,
          currency: state.data.currency,
          note: state.data.note || ''
        });

        const { data: insertedCar, error: carInsertError } = await supabase.from('ads').insert({
          title: carTitle,
          price: state.data.price ? state.data.price.replace(/[^0-9]/g, '') : '0',
          description: carDescriptionJson,
          category: 'vehicles',
          location: state.data.governorate || 'بغداد',
          city: state.data.model || 'بغداد',
          images: state.data.images && state.data.images.length > 0 ? state.data.images : ['https://souqbaghdad.store/car-default.jpg'],
          phone: state.data.phone || phone,
          seller_id: userId,
          seller_name: userProfile?.full_name || 'بائع سيارات',
          seller_avatar: userProfile?.avatar_url || '',
          status: 'active',
          is_demo: false,
          short_id: shortId,
          sync_status: { telegram: 'skip', facebook: 'pending', instagram: 'pending', tiktok: 'pending', threads: 'pending' }
        }).select().single();

        if (carInsertError || !insertedCar) {
          console.error('Car insert error:', carInsertError);
          await updateOrSend('❌ حدث خطأ أثناء حفظ الإعلان، يرجى المحاولة مرة أخرى.');
          return new Response('OK', { status: 200 });
        }

        const insertedId = insertedCar.id;
        const adId = insertedCar.short_id || insertedId;
        const carLink = `https://www.souqbaghdad.store/ad/${adId}`;
        const carChannelLink = `https://t.me/${CAR_CHANNEL.replace('@', '')}`;
        const currencySymbol = state.data.currency || 'د.ع';
        const formattedPrice = formatTgPrice(state.data.price, currencySymbol);

        // Build caption for channel post
        const channelCaption = `🚗 <b>${carTitle}</b>\n` +
          `💰 <b>السعر:</b> ${formattedPrice}\n` +
          `📍 <b>المحافظة:</b> ${state.data.governorate || 'بغداد'}\n` +
          (state.data.year ? `📅 <b>السنة:</b> ${state.data.year}\n` : '') +
          (state.data.mileage ? `🛣️ <b>الكيلومتر:</b> ${parseInt(state.data.mileage || '0').toLocaleString('en-US')} كم\n` : '') +
          (state.data.origin ? `🌍 <b>المواصفات:</b> ${state.data.origin}\n` : '') +
          (state.data.phone ? `📞 <b>التواصل:</b> ${state.data.phone}\n` : '') +
          `\n📣 <b>#رقم_الإعلان_${adId}</b> | @${BOT_USERNAME}`;

        let cleanPhone = (state.data.phone || '').replace(/[^0-9+]/g, '');
        if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
        else cleanPhone = cleanPhone.replace('+', '');
        const contactRow: any[] = [];
        if (cleanPhone) {
          contactRow.push({ text: '💬 تواصل واتساب', url: `https://wa.me/${cleanPhone}` });
          contactRow.push({ text: '✈️ تواصل تيليكرام', url: `https://t.me/+${cleanPhone}` });
        }
        const channelMarkup: any = {
          inline_keyboard: [
            [{ text: '🌐 عرض التفاصيل كاملة بالمنصة', url: carLink }],
            ...(contactRow.length > 0 ? [contactRow] : []),
            [{ text: '🚗 اعرض سيارتك للبيع مجاناً', url: `https://t.me/${BOT_USERNAME}` }]
          ]
        };

        // Directly publish to car channel
        const carImages = insertedCar.images && insertedCar.images.length > 0 ? insertedCar.images : null;
        let tgMsgId: string | null = null;
        try {
          const photoUrl = carImages ? carImages[0] : `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=post&category=cars&title=${encodeURIComponent(carTitle)}&fare=${encodeURIComponent(formattedPrice)}&regions=${encodeURIComponent(state.data.governorate || 'بغداد')}&link=${encodeURIComponent(carLink)}&short_id=${encodeURIComponent(adId)}`;
          const carRes = await sendPhoto(CAR_CHANNEL_ID || CAR_CHANNEL, photoUrl, channelCaption, channelMarkup);
          if (carRes?.ok && carRes.result?.message_id) {
            tgMsgId = carRes.result.message_id.toString();
            await supabase.from('ads').update({ telegram_message_id: tgMsgId, sync_status: { telegram: 'success', facebook: 'pending', instagram: 'pending' } }).eq('id', insertedId);
          }
        } catch(e) {
          console.error('Car channel publish error:', e);
        }

        // Success message with full management buttons
        await updateOrSend(`🎉 <b>تم نشر إعلان سيارتك بنجاح!</b>\n\n🚗 <b>${carTitle}</b>\n💰 <b>السعر:</b> ${formattedPrice}\n📍 <b>المحافظة:</b> ${state.data.governorate || 'بغداد'}\n\n📣 <b>إعلانك معروض الآن في المنصة وقناة سيارات سوق بغداد.</b>\nيمكنك إدارة إعلانك مباشرة عبر الأزرار أدناه:`, {
          inline_keyboard: [
            [{ text: '📢 شاهد إعلانك في قناة السيارات', url: carChannelLink }],
            [{ text: '💰 تعديل السعر', callback_data: `edit_car_price_${insertedId}` }, { text: '📞 تعديل الهاتف', callback_data: `edit_car_phone_${insertedId}` }],
            [{ text: '⚠️ تم بيع السيارة (تعليم كمباعة)', callback_data: `mark_sold_${insertedId}` }],
            [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
          ]
        });
        state = {};
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        return new Response('OK', { status: 200 });
      }

      // ==========================================
      // 🚌 TRANSPORT WIZARD (Interactive Step-by-Step)
      // ==========================================
      if (action === 'publish_transport') {
        const { data: profile } = await supabase.from('profiles').select('points, role').eq('id', userId).maybeSingle();
        if (profile?.role !== 'admin' && profile?.role !== 'owner' && (profile?.points || 0) < 1) {
          await updateOrSend('❌ عذراً، رصيد النقاط الخاص بك غير كافٍ لنشر إعلان. يرجى شحن المحفظة أولاً.', {
            inline_keyboard: [[{ text: '💳 شراء نقاط', callback_data: 'buy_points' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
          });
          return new Response('OK', { status: 200 });
        }

        state = { step: 'trans_type', data: {} };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        await updateOrSend(`🚌 <b>الخطوة 1 من 9 — نوع إعلان الخط</b>\n\nهل أنت سائق توفر خطاً، أم راكب تبحث عن خط؟ 👇`, {
          inline_keyboard: [
            [{ text: '🚗 أوفر خط نقل (سائق / صاحب خط)', callback_data: 'trans_type_offer' }],
            [{ text: '🙋‍♂️ أبحث عن خط نقل (راكب / طالب / موظف)', callback_data: 'trans_type_request' }],
            [{ text: '❌ إلغاء العملية', callback_data: 'cancel_wizard' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('trans_type_')) {
        const tType = action.replace('trans_type_', '');
        state.data.type = tType;
        state.step = 'trans_cat';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        await updateOrSend(`🚌 <b>الخطوة 2 من 9 — فئة الخط</b>\n\nالخط مخصص لمن؟ 👇`, {
          inline_keyboard: [
            [{ text: '🎓 خط طلاب جامعات / كليات', callback_data: 'trans_cat_student' }],
            [{ text: '💼 خط موظفين وشركات', callback_data: 'trans_cat_employee' }],
            [{ text: '🚨 نقل خاص وطارئ / مناسبات', callback_data: 'trans_cat_emergency' }],
            [{ text: '◀️ السابق', callback_data: 'publish_transport' }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('trans_cat_')) {
        const catType = action.replace('trans_cat_', '');
        state.data.categoryType = catType;
        state.step = 'trans_regions';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const areaButtons = TRANSPORT_AREAS_BAGHDAD.map(row => row.map(a => {
          if (a.includes('أخرى')) return { text: a, callback_data: 'trans_area_custom' };
          return { text: a, callback_data: `trans_area_${a}` };
        }));
        areaButtons.push([{ text: '◀️ السابق', callback_data: `trans_type_${state.data.type || 'offer'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`📍 <b>الخطوة 3 من 9 — مناطق الانطلاق (المرور)</b>\n\nاختر منطقة الانطلاق أو اكتبها بنفسك 👇`, {
          inline_keyboard: areaButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('trans_area_')) {
        const areaVal = action.replace('trans_area_', '');
        if (areaVal === 'custom') {
          state.step = 'trans_area_custom_input';
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          await updateOrSend(`📍 <b>اكتب مناطق الانطلاق</b> التي يمر بها الخط (مثال: حي الجامعة، الخضراء، نفق الشرطة):`, {
            inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]]
          });
          return new Response('OK', { status: 200 });
        }

        state.data.regions = areaVal;
        state.step = 'trans_dest';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const destButtons = TRANSPORT_DESTINATIONS_BAGHDAD.map(row => row.map(d => {
          if (d.includes('أخرى')) return { text: d, callback_data: 'trans_dest_custom' };
          return { text: d, callback_data: `trans_dest_${d}` };
        }));
        destButtons.push([{ text: '◀️ السابق', callback_data: `trans_cat_${state.data.categoryType || 'student'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`🏢 <b>الخطوة 4 من 9 — الوجهة (الجامعة أو العمل)</b>\n\nاختر الوجهة المطلوبة 👇`, {
          inline_keyboard: destButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('trans_dest_')) {
        const destVal = action.replace('trans_dest_', '');
        if (destVal === 'custom') {
          state.step = 'trans_dest_custom_input';
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          await updateOrSend(`🏢 <b>اكتب الوجهة</b> (اسم الجامعة أو مكان العمل أو المستشفى):`, {
            inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]]
          });
          return new Response('OK', { status: 200 });
        }

        state.data.destination = destVal;
        state.step = 'trans_shift';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const shiftButtons = TRANSPORT_SHIFTS.map(row => row.map(s => ({ text: s, callback_data: `trans_shift_${s}` })));
        shiftButtons.push([{ text: '◀️ السابق', callback_data: `trans_area_${state.data.regions || 'الكرادة'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`⏰ <b>الخطوة 5 من 9 — وقت الدوام والشفت</b>\n\nاختر وقت الدوام 👇`, {
          inline_keyboard: shiftButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('trans_shift_')) {
        const shiftVal = action.replace('trans_shift_', '');
        state.data.shift = shiftVal;
        state.step = 'trans_vehicle';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const vehicleButtons = TRANSPORT_VEHICLES.map(row => row.map(v => ({ text: v, callback_data: `trans_vehicle_${v}` })));
        vehicleButtons.push([{ text: '◀️ السابق', callback_data: `trans_dest_${state.data.destination || 'جامعة بغداد'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`🚗 <b>الخطوة 6 من 9 — نوع المركبة</b>\n\nاختر نوع المركبة 👇`, {
          inline_keyboard: vehicleButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('trans_vehicle_')) {
        const vVal = action.replace('trans_vehicle_', '');
        state.data.vehicleType = vVal;
        state.step = 'trans_target';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const targetButtons = TRANSPORT_TARGETS.map(row => row.map(t => ({ text: t, callback_data: `trans_target_${t}` })));
        targetButtons.push([{ text: '◀️ السابق', callback_data: `trans_shift_${state.data.shift || 'صباحي'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`👥 <b>الخطوة 7 من 9 — فئة الركاب</b>\n\nالخط مخصص لمن؟ 👇`, {
          inline_keyboard: targetButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('trans_target_')) {
        const tVal = action.replace('trans_target_', '');
        state.data.targetAudience = tVal;
        state.step = 'trans_fare';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const fareButtons = TRANSPORT_FARES.map(row => row.map(f => {
          if (f.includes('آخر')) return { text: f, callback_data: 'trans_fare_custom' };
          return { text: f, callback_data: `trans_fare_${f}` };
        }));
        fareButtons.push([{ text: '◀️ السابق', callback_data: `trans_vehicle_${state.data.vehicleType || 'صالون'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`💰 <b>الخطوة 8 من 9 — الأجرة الشهرية / السعر</b>\n\nاختر الأجرة التقريبية لكل راكب 👇`, {
          inline_keyboard: fareButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('trans_fare_')) {
        const fareVal = action.replace('trans_fare_', '');
        if (fareVal === 'custom') {
          state.step = 'trans_fare_custom_input';
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          await updateOrSend(`💰 <b>اكتب مبلغ الأجرة بالأرقام</b> (مثال: 90000 أو 110000):`, {
            inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]]
          });
          return new Response('OK', { status: 200 });
        }

        state.data.price = fareVal.includes('الاتفاق') ? '0' : fareVal.replace(/[^0-9]/g, '');
        state.step = 'trans_phone';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const currentPhone = phone || '';
        const phoneButtons = [];
        if (currentPhone) {
          phoneButtons.push([{ text: `📱 استخدام رقمي الحالي (${currentPhone})`, callback_data: 'trans_phone_current' }]);
        }
        phoneButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`📞 <b>الخطوة 9 من 9 — رقم الهاتف للتواصل</b>\n\nاكتب رقم الهاتف للتواصل، أو اضغط على الزر لاستخدام رقمك المسجل:`, {
          inline_keyboard: phoneButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'trans_phone_current') {
        state.data.phone = phone;
        state.step = 'trans_review';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        // Show Transport Review Card
        const typeStr = state.data.type === 'offer' ? '🚗 أوفر خط نقل (سائق)' : '🙋‍♂️ أبحث عن خط نقل (مطلوب)';
        const fareStr = formatTgPrice(state.data.price);
        const reviewText = `🔍 <b>مراجعة إعلان الخط قبل النشر</b>\nتأكد من صحة المعلومات، ثم اضغط «✅ نشر إعلان الخط الآن»:\n\n` +
                           `📌 <b>النوع:</b> ${typeStr}\n` +
                           `🏷️ <b>الفئة:</b> ${state.data.categoryType === 'employee' ? '💼 موظفين' : '🎓 طلاب'} (${state.data.targetAudience || 'الجميع'})\n` +
                           `📍 <b>مناطق الانطلاق:</b> ${state.data.regions || 'بغداد'}\n` +
                           `🏢 <b>الوجهة:</b> ${state.data.destination || 'بغداد'}\n` +
                           `⏰ <b>الدوام:</b> ${state.data.shift || 'صباحي'}\n` +
                           `🚗 <b>المركبة:</b> ${state.data.vehicleType || 'صالون'}\n` +
                           `💰 <b>الأجرة:</b> ${fareStr}\n` +
                           `📞 <b>التواصل:</b> ${state.data.phone}\n`;

        await updateOrSend(reviewText, {
          inline_keyboard: [
            [{ text: '✅ نشر إعلان الخط الآن', callback_data: 'trans_confirm_publish' }],
            [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'trans_confirm_publish') {
        await updateOrSend('⏳ جاري نشر إعلان الخط في المنصة وقناة خطوط النقل...');

        const cost = 1;
        const { data: userProfile } = await supabase.from('profiles').select('points, role, full_name, avatar_url').eq('id', userId).single();
        if (userProfile?.role !== 'admin' && userProfile?.role !== 'owner') {
          if (!userProfile || (userProfile.points || 0) < cost) {
            await updateOrSend('❌ عذراً، ليس لديك نقاط كافية. يرجى التوجه لزر "شراء نقاط".', {
               inline_keyboard: [[{ text: '💳 شراء نقاط', callback_data: 'buy_points' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
            });
            state = {};
            await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
            return new Response('OK', { status: 200 });
          }
          await supabase.from('profiles').update({ points: userProfile.points - cost }).eq('id', userId);
        }

        const shortId = Math.random().toString(36).substring(2, 7).toUpperCase();
        const transTitle = state.data.type === 'offer' 
          ? `أوفر خط من ${state.data.regions} إلى ${state.data.destination}` 
          : `أبحث عن خط من ${state.data.regions} إلى ${state.data.destination}`;

        const transDescJson = JSON.stringify({
          shift: state.data.shift,
          seats: state.data.seats || '1',
          vehicleType: state.data.vehicleType,
          targetAudience: state.data.targetAudience,
          categoryType: state.data.categoryType || 'student',
          note: state.data.note || '',
          interest: 0,
          whatsappClicks: 0
        });

        const { data: insertedTrans, error: transInsertError } = await supabase.from('ads').insert({
          type: state.data.type === 'offer' ? 'offer' : 'request',
          title: transTitle,
          description: transDescJson,
          price: state.data.price ? state.data.price.replace(/[^0-9]/g, '') : '0',
          category: 'transport',
          location: state.data.regions,
          city: state.data.destination,
          images: [],
          phone: state.data.phone || phone,
          status: 'active',
          is_demo: false,
          seller_id: userId,
          seller_name: userProfile?.full_name || 'صاحب خط',
          seller_avatar: userProfile?.avatar_url || '',
          short_id: shortId,
          sync_status: { telegram: 'skip', facebook: 'skip', instagram: 'skip', tiktok: 'skip', threads: 'skip' }
        }).select().single();

        if (transInsertError || !insertedTrans) {
          console.error('Transport insert error:', transInsertError);
          await updateOrSend('❌ حدث خطأ أثناء حفظ الخط، يرجى المحاولة مرة أخرى.');
          return new Response('OK', { status: 200 });
        }

        // Auto publish to Telegram channels and Socials with dynamic template
        try {
          const typeStr = state.data.type === 'offer' ? '🚗 أوفر خط نقل (سائق)' : '🙋‍♂️ أبحث عن خط نقل (مطلوب)';
          const catType = state.data.categoryType === 'employee' ? '💼 خط موظفين' : (state.data.categoryType === 'emergency' ? '🚨 نقل خاص' : '🎓 خط طلاب');
          const targetStr = state.data.targetAudience || 'الجميع';
          const link = `https://www.souqbaghdad.store/transport/card/${shortId}`;
          const cleanTitle = 'خط نقل جديد في بغداد';
          const cleanSubtitle = (state.data.destination || 'كلية الرافدين الجامعة').replace(/<[^>]*>?/gm, '').trim();
          const cleanSubdesc = `${catType} (${targetStr})`.replace(/<[^>]*>?/gm, '').trim();
          const cleanRegions = (state.data.regions || 'بغداد').replace(/<[^>]*>?/gm, '').trim();
          const cleanDestination = (state.data.destination || 'كلية الرافدين الجامعة').replace(/<[^>]*>?/gm, '').trim();
          const cleanFare = formatTgPrice(state.data.price);

          const dynamicPostUrl = `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=post&title=${encodeURIComponent(cleanTitle)}&subtitle=${encodeURIComponent(cleanSubtitle)}&subdesc=${encodeURIComponent(cleanSubdesc)}&regions=${encodeURIComponent(cleanRegions)}&destination=${encodeURIComponent(cleanDestination)}&fare=${encodeURIComponent(cleanFare)}&link=${encodeURIComponent(link)}&short_id=${encodeURIComponent(shortId)}`;
          const dynamicStoryUrl = `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=story&title=${encodeURIComponent(cleanTitle)}&subtitle=${encodeURIComponent(cleanSubtitle)}&subdesc=${encodeURIComponent(cleanSubdesc)}&regions=${encodeURIComponent(cleanRegions)}&destination=${encodeURIComponent(cleanDestination)}&fare=${encodeURIComponent(cleanFare)}&link=${encodeURIComponent(link)}&short_id=${encodeURIComponent(shortId)}`;

          const cleanPhone = (state.data.phone || phone || '').replace(/[^0-9+]/g, '');
          let formattedPhone = cleanPhone.startsWith('07') ? '964' + cleanPhone.substring(1) : cleanPhone.replace('+', '');

          const contactRow = [];
          if (formattedPhone) {
            contactRow.push({ text: '💬 تواصل واتساب', url: `https://wa.me/${formattedPhone}` });
            contactRow.push({ text: '✈️ تواصل تيليكرام', url: `https://t.me/+${formattedPhone}` });
          }

          const channelKeyboard = [
            [{ text: '🌐 التفاصيل الكاملة وحجز المقعد', url: link }]
          ];
          if (contactRow.length > 0) channelKeyboard.push(contactRow);
          channelKeyboard.push([{ text: '🚌 انشر خطك مجاناً عبر البوت', url: `https://t.me/${BOT_USERNAME}` }]);

          const channelMsg = `🚌 <b>إعلان خط نقل جديد — سوق بغداد</b>\n\n` +
                             `📌 <b>النوع:</b> ${typeStr}\n` +
                             `🏷️ <b>الفئة:</b> ${catType} (${targetStr})\n` +
                             `📍 <b>مناطق الانطلاق:</b> ${cleanRegions}\n` +
                             `🏢 <b>الوجهة:</b> ${cleanDestination}\n` +
                             `⏰ <b>وقت الدوام:</b> ${state.data.shift || 'صباحي'}\n` +
                             `🚗 <b>المركبة:</b> ${state.data.vehicleType || 'صالون'} | <b>المقاعد:</b> ${state.data.seats || '4'} مقاعد\n` +
                             `💰 <b>الأجرة:</b> ${cleanFare}\n` +
                             (cleanPhone ? `📞 <b>التواصل:</b> ${cleanPhone}\n\n` : `\n`) +
                             `📣 <b>#رقم_الخط_${shortId}</b> | @${BOT_USERNAME}`;

          // 1. Post to @souqbaghdad_lines
          const targetLinesChannel = LINES_CHANNEL_ID || LINES_CHANNEL;
          const linesRes = await sendPhoto(targetLinesChannel, dynamicPostUrl, channelMsg, { inline_keyboard: channelKeyboard });
          let tgMsgId: string | null = null;
          if (linesRes?.ok && linesRes.result?.message_id) {
            tgMsgId = linesRes.result.message_id.toString();
          }

          // 2. If it's Al-Rafdain, ALSO post to @ruc_1
          const isAlRafdain = ['الرافدين', 'الرفدين'].some(term => cleanDestination.includes(term) || (state.data.targetAudience && state.data.targetAudience.includes(term)));
          let rucMsgId: string | null = null;
          if (isAlRafdain) {
            try {
              const rucRes = await sendPhoto(ALRAFDAIN_TELEGRAM_CHANNEL, dynamicPostUrl, channelMsg, { inline_keyboard: channelKeyboard });
              if (rucRes?.ok && rucRes.result?.message_id) {
                rucMsgId = rucRes.result.message_id.toString();
              }
            } catch(err) {
              console.error("Error sending to Al-Rafdain @ruc_1 from bot wizard:", err);
            }
          }

          // Save telegram_message_id to prevent DB webhook from publishing again (dedup)
          if (tgMsgId) {
            const syncStatus: any = { telegram: 'success', facebook: 'pending', instagram: 'pending' };
            if (rucMsgId) syncStatus.ruc_telegram_message_id = rucMsgId;
            await supabase.from('ads').update({ 
              telegram_message_id: tgMsgId, 
              sync_status: syncStatus
            }).eq('id', insertedTrans.id);
          }

          // 3. Social Media
          const fbIgCaption = await generateSocialCaption(insertedTrans, 'transport', link);
          if (isAlRafdain && ALRAFDAIN_FB_TOKEN && ALRAFDAIN_FB_PAGE_ID) {
            await postToFacebook(fbIgCaption, dynamicPostUrl, ALRAFDAIN_FB_TOKEN, ALRAFDAIN_FB_PAGE_ID);
          } else {
            await postToFacebook(fbIgCaption, dynamicPostUrl);
          }
          if (isAlRafdain && ALRAFDAIN_FB_TOKEN && ALRAFDAIN_IG_ID) {
            await postToInstagramStory(dynamicStoryUrl, ALRAFDAIN_IG_ID, ALRAFDAIN_FB_TOKEN);
          } else {
            await postToInstagram(fbIgCaption, dynamicPostUrl);
          }
          await postToThreads(fbIgCaption, dynamicPostUrl);
        } catch(pubErr) {
          console.error("Error auto publishing transport from bot wizard:", pubErr);
        }

        const insertedId = insertedTrans.id;
        // Use channel @username (not numeric ID) for t.me links
        const channelLink = isAlRafdain && ALRAFDAIN_TELEGRAM_CHANNEL
          ? `https://t.me/${ALRAFDAIN_TELEGRAM_CHANNEL.replace('@', '')}`
          : `https://t.me/${LINES_CHANNEL.replace('@', '')}`;
        const fareStr = formatTgPrice(state.data.price);

        await updateOrSend(`🎉 <b>تم نشر إعلان الخط بنجاح!</b>\n\n🚌 <b>${transTitle}</b>\n💰 <b>الأجرة:</b> ${fareStr}\n📍 <b>المناطق:</b> ${state.data.regions}\n🏢 <b>الوجهة:</b> ${state.data.destination}\n\n📣 <b>الخط معروض الآن في المنصة وقناة خطوط النقل.</b>\nيمكنك إدارة خطك مباشرة عبر الأزرار أدناه:`, {
          inline_keyboard: [
            [{ text: '📢 شاهد الخط في القناة', url: channelLink }],
            [{ text: '💰 تعديل الأجرة', callback_data: `edit_trans_price_${insertedId}` }, { text: '📞 تعديل الهاتف', callback_data: `edit_trans_phone_${insertedId}` }],
            [{ text: '✅ إغلاق الخط (اكتمل العدد)', callback_data: `solve_trans_${insertedId}` }],
            [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
          ]
        });
        state = {};
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        return new Response('OK', { status: 200 });
      }

      // ==========================================
      // 📋 MANAGE MY ADS (WITH CARS & TRANSPORTS)
      // ==========================================
      if (action === 'manage_my_ads') {
        await updateOrSend('📦 <b>إدارة إعلاناتي وخطوطي</b>\n\nاختر القسم الذي ترغب بإدارته أو تعديل سعره أو تعليمه كمباع:', {
          inline_keyboard: [
            [{ text: '🚗 سياراتي المعروضة', callback_data: 'manage_cat_cars' }],
            [{ text: '🚌 خطوط النقل الخاصة بي', callback_data: 'manage_cat_trans' }],
            [{ text: '📢 إعلاناتي ومنتجاتي الأخرى', callback_data: 'manage_cat_ads' }],
            [{ text: '🏠 العودة للقائمة الرئيسية', callback_data: 'main_menu' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      // Submenu: Manage Cars
      if (action === 'manage_cat_cars') {
        const { data: myCars } = await supabase.from('ads')
          .select('*')
          .eq('seller_id', userId)
          .in('category', ['vehicles', 'cars'])
          .order('created_at', { ascending: false });

        if (!myCars || myCars.length === 0) {
          await updateOrSend('📭 ليس لديك إعلانات سيارات منشورة حالياً.', {
            inline_keyboard: [[{ text: '🚗 اعرض سيارة الآن', callback_data: 'publish_car' }], [{ text: '🔙 العودة', callback_data: 'manage_my_ads' }]]
          });
          return new Response('OK', { status: 200 });
        }

        const activeCars = myCars.filter(c => c.status === 'active');
        const soldCars = myCars.filter(c => c.status === 'sold' || c.status === 'matched');

        if (activeCars.length === 0) {
          const bottomButtons = [[{ text: '🚗 اعرض سيارة الآن', callback_data: 'publish_car' }]];
          if (soldCars.length > 0) {
            bottomButtons.push([{ text: `📂 عرض السيارات المباعة سابقاً (${soldCars.length})`, callback_data: 'manage_cars_archive' }]);
          }
          bottomButtons.push([{ text: '🔙 العودة لإدارة الإعلانات', callback_data: 'manage_my_ads' }]);

          await updateOrSend('📭 <b>لا توجد سيارات نشطة معروضة حالياً.</b>\nجميع إعلاناتك السابقة تم بيعها أو إغلاقها.', {
            inline_keyboard: bottomButtons
          });
          return new Response('OK', { status: 200 });
        }

        await updateOrSend(`🚗 <b>سياراتك المعروضة النشطة (${activeCars.length}):</b>`);

        for (const car of activeCars) {
          let specs: any = {};
          try { specs = JSON.parse(car.description); } catch(e){}
          const curr = specs.currency || '$';
          const priceText = formatTgPrice(car.price, curr);
          const carText = `🚗 <b>${car.title}</b> [🟢 معروضة للبيع]\n💰 <b>السعر:</b> ${priceText}\n📍 <b>المحافظة:</b> ${car.location || 'بغداد'}\n📞 <b>الهاتف:</b> ${car.phone || 'غير مسجل'}`;

          const buttons = [
            [{ text: '💰 تعديل السعر', callback_data: `edit_car_price_${car.id}` }, { text: '📞 تعديل الهاتف', callback_data: `edit_car_phone_${car.id}` }],
            [{ text: '⚠️ تعليم الإعلان كمباع', callback_data: `mark_sold_${car.id}` }],
            [{ text: '🗑️ حذف الإعلان نهائياً', callback_data: `del_trans_${car.id}` }]
          ];

          await sendMessage(chatId, carText, { inline_keyboard: buttons });
        }

        const navButtons = [];
        if (soldCars.length > 0) {
          navButtons.push([{ text: `📂 أرشيف السيارات المباعة (${soldCars.length})`, callback_data: 'manage_cars_archive' }]);
        }
        navButtons.push([{ text: '🔙 العودة لإدارة الإعلانات', callback_data: 'manage_my_ads' }]);

        await sendMessage(chatId, 'اختر الإجراء المطلوب أسفل كل سيارة نشطة أعلاه 👇', {
          inline_keyboard: navButtons
        });
        return new Response('OK', { status: 200 });
      }

      // Submenu: Manage Cars Archive (Sold Cars)
      if (action === 'manage_cars_archive') {
        const { data: soldCars } = await supabase.from('ads')
          .select('*')
          .eq('seller_id', userId)
          .in('category', ['vehicles', 'cars'])
          .in('status', ['sold', 'matched'])
          .order('created_at', { ascending: false });

        if (!soldCars || soldCars.length === 0) {
          await sendMessage(chatId, '📭 لا توجد سيارات مباعة في الأرشيف.', {
            inline_keyboard: [[{ text: '🔙 العودة لسياراتي', callback_data: 'manage_cat_cars' }]]
          });
          return new Response('OK', { status: 200 });
        }

        await sendMessage(chatId, `📂 <b>أرشيف السيارات المباعة (${soldCars.length}):</b>`);

        for (const car of soldCars) {
          let specs: any = {};
          try { specs = JSON.parse(car.description); } catch(e){}
          const curr = specs.currency || '$';
          const priceText = formatTgPrice(car.price, curr);
          const carText = `🚗 <b>${car.title}</b> [⚠️ مباعة]\n💰 <b>السعر:</b> ${priceText}\n📍 <b>المحافظة:</b> ${car.location || 'بغداد'}`;

          await sendMessage(chatId, carText, {
            inline_keyboard: [[{ text: '🗑️ حذف من الأرشيف', callback_data: `del_trans_${car.id}` }]]
          });
        }

        await sendMessage(chatId, 'نهاية الأرشيف.', {
          inline_keyboard: [[{ text: '🔙 العودة لسياراتي النشطة', callback_data: 'manage_cat_cars' }]]
        });
        return new Response('OK', { status: 200 });
      }

      // Submenu: Manage Transports (Active First + Clean Archive)
      if (action === 'manage_cat_trans') {
        const { data: myTransports } = await supabase.from('ads')
          .select('*')
          .eq('seller_id', userId)
          .eq('category', 'transport')
          .order('created_at', { ascending: false });

        if (!myTransports || myTransports.length === 0) {
          await sendMessage(chatId, '📭 ليس لديك خطوط نقل منشورة حالياً.', {
            inline_keyboard: [[{ text: '🚌 انشر خط نقل الآن', callback_data: 'publish_transport' }], [{ text: '🔙 العودة', callback_data: 'manage_my_ads' }]]
          });
          return new Response('OK', { status: 200 });
        }

        const activeTrans = myTransports.filter(t => t.status === 'active');
        const closedTrans = myTransports.filter(t => t.status === 'matched' || t.status === 'inactive');

        if (activeTrans.length === 0) {
          const bottomBtns = [[{ text: '🚌 انشر خط نقل الآن', callback_data: 'publish_transport' }]];
          if (closedTrans.length > 0) {
            bottomBtns.push([{ text: `📂 عرض الخطوط المكتملة سابقاً (${closedTrans.length})`, callback_data: 'manage_trans_archive' }]);
          }
          bottomBtns.push([{ text: '🔙 العودة لإدارة الإعلانات', callback_data: 'manage_my_ads' }]);

          await sendMessage(chatId, '📭 <b>لا توجد خطوط نقل نشطة حالياً.</b>\nجميع خطوطك السابقة تم إغلاقها واكتمال عددها.', {
            inline_keyboard: bottomBtns
          });
          return new Response('OK', { status: 200 });
        }

        await sendMessage(chatId, `🚌 <b>خطوط النقل النشطة الخاصة بك (${activeTrans.length}):</b>`);

        for (const t of activeTrans) {
          const typeText = t.type === 'offer' ? 'أوفر خط' : 'أبحث عن خط';
          const priceText = formatTgPrice(t.price);
          const transCardText = `🚌 <b>${t.title}</b> (${typeText}) [🟢 نشط]\n💰 <b>الأجرة:</b> ${priceText}\n📍 <b>المناطق:</b> ${t.location || 'غير محدد'}\n🏢 <b>الوجهة:</b> ${t.city || 'غير محدد'}\n📞 <b>الهاتف:</b> ${t.phone || 'غير مسجل'}`;

          const buttons = [
            [{ text: '💰 تعديل الأجرة', callback_data: `edit_trans_price_${t.id}` }, { text: '📞 تعديل الهاتف', callback_data: `edit_trans_phone_${t.id}` }],
            [{ text: '✅ إغلاق الخط (اكتمل العدد)', callback_data: `solve_trans_${t.id}` }],
            [{ text: '🗑️ حذف الخط نهائياً', callback_data: `del_trans_${t.id}` }]
          ];

          await sendMessage(chatId, transCardText, { inline_keyboard: buttons });
        }

        const navBtns = [];
        if (closedTrans.length > 0) {
          navBtns.push([{ text: `📂 أرشيف الخطوط المكتملة (${closedTrans.length})`, callback_data: 'manage_trans_archive' }]);
        }
        navBtns.push([{ text: '🔙 العودة لإدارة الإعلانات', callback_data: 'manage_my_ads' }]);

        await sendMessage(chatId, 'اختر الإجراء المطلوب أسفل كل خط أعلاه 👇', { inline_keyboard: navBtns });
        return new Response('OK', { status: 200 });
      }

      // Submenu: Transport Archive
      if (action === 'manage_trans_archive') {
        const { data: closedTrans } = await supabase.from('ads')
          .select('*')
          .eq('seller_id', userId)
          .eq('category', 'transport')
          .in('status', ['matched', 'inactive'])
          .order('created_at', { ascending: false });

        if (!closedTrans || closedTrans.length === 0) {
          await sendMessage(chatId, '📭 لا توجد خطوط مكتملة في الأرشيف.', {
            inline_keyboard: [[{ text: '🔙 العودة لخطوطي', callback_data: 'manage_cat_trans' }]]
          });
          return new Response('OK', { status: 200 });
        }

        await sendMessage(chatId, `📂 <b>أرشيف الخطوط المكتملة (${closedTrans.length}):</b>`);

        for (const t of closedTrans) {
          const typeText = t.type === 'offer' ? 'أوفر خط' : 'أبحث عن خط';
          const transCardText = `🚌 <b>${t.title}</b> (${typeText}) [✅ مكتمل ومغلق]\n💰 <b>الأجرة:</b> ${formatTgPrice(t.price)}\n📍 <b>المناطق:</b> ${t.location}\n🏢 <b>الوجهة:</b> ${t.city}`;

          await sendMessage(chatId, transCardText, {
            inline_keyboard: [[{ text: '🗑️ حذف من الأرشيف', callback_data: `del_trans_${t.id}` }]]
          });
        }

        await sendMessage(chatId, 'نهاية أرشيف الخطوط.', {
          inline_keyboard: [[{ text: '🔙 العودة لخطوطي النشطة', callback_data: 'manage_cat_trans' }]]
        });
        return new Response('OK', { status: 200 });
      }

      // Mark Transport as Solved / Matched
      if (action.startsWith('solve_trans_')) {
        const transId = action.replace('solve_trans_', '');
        const { data: updatedTrans } = await supabase.from('ads').update({ status: 'matched' }).eq('id', transId).eq('seller_id', userId).select().single();
        
        if (updatedTrans) {
          const msgId = updatedTrans.telegram_message_id;
          // Use numeric LINES_CHANNEL_ID — Telegram requires numeric Chat ID for editMessageCaption
          if (msgId && LINES_CHANNEL_ID) {
            try {
              const closedButtons = {
                inline_keyboard: [
                  [{ text: '🚌 تصفح خطوط أخرى متاحة 🌐', url: 'https://www.souqbaghdad.store/transport' }],
                  [{ text: '🚌 اعرض خطك مجاناً عبر البوت', url: `https://t.me/${BOT_USERNAME}` }]
                ]
              };
              const closedCaption = `✅ <b>[اكتمل العدد / الخط مغلق]</b>\n\n` +
                                    `🚌 <b>${updatedTrans.title}</b>\n` +
                                    `💰 <b>تم اكتمال العدد بنجاح عبر منصة سوق بغداد</b>\n` +
                                    `📍 ${updatedTrans.location || 'بغداد'}\n\n` +
                                    `📣 لم يعد هذا الخط متاحاً للتسجيل. يمكنك تصفح خطوط أخرى متاحة بالضغط أدناه 👇`;

              // Edit in main lines channel using numeric ID
              await editMessageCaption(LINES_CHANNEL_ID, parseInt(msgId, 10), closedCaption, closedButtons);

              // Check if transport is for Al-Rafdain, update @ruc_1 as well
              const descStr = typeof updatedTrans.description === 'string'
                ? updatedTrans.description
                : JSON.stringify(updatedTrans.description || {});
              const rafdainTerms = ['الرافدين', 'الرفدين'];
              const isAlRafdainTrans = rafdainTerms.some(term =>
                (updatedTrans.university && updatedTrans.university.includes(term)) ||
                (updatedTrans.city && updatedTrans.city.includes(term)) ||
                (updatedTrans.destination && updatedTrans.destination.includes(term)) ||
                descStr.includes(term)
              );
              if (isAlRafdainTrans && ALRAFDAIN_TELEGRAM_CHANNEL) {
                try {
                  await editMessageCaption(ALRAFDAIN_TELEGRAM_CHANNEL, parseInt(msgId, 10), closedCaption, closedButtons);
                } catch(e2) {
                  console.error('Al-Rafdain (ruc_1) caption update error:', e2);
                }
              }
            } catch(e) {
              console.error('Transport caption update error:', e);
            }
          }
          await updateOrSend('✅ <b>تم إغلاق الخط بنجاح!</b>\nتم تحديث المنشور في القناة وتغيير الأزرار ليظهر للمشتركين أن العدد اكتمل.', {
            inline_keyboard: [[{ text: '🔙 العودة لخطوطي', callback_data: 'manage_cat_trans' }]]
          });
        } else {
          await updateOrSend('❌ لم يتم العثور على الخط أو لا تملك صلاحية تعديله.');
        }
        return new Response('OK', { status: 200 });
      }

      // Edit Transport Price
      if (action.startsWith('edit_trans_price_')) {
        const transId = action.replace('edit_trans_price_', '');
        state = { step: 'edit_trans_price_input', targetId: transId };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await updateOrSend('💰 اكتب <b>مبلغ الأجرة الجديد</b> بالأرقام (مثال: 85000 أو 100000):', {
          inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]]
        });
        return new Response('OK', { status: 200 });
      }

      // Edit Transport Phone
      if (action.startsWith('edit_trans_phone_')) {
        const transId = action.replace('edit_trans_phone_', '');
        state = { step: 'edit_trans_phone_input', targetId: transId };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await updateOrSend('📞 اكتب <b>رقم الهاتف الجديد</b> للتواصل:', {
          inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]]
        });
        return new Response('OK', { status: 200 });
      }

      // Mark Ad as Sold
      if (action.startsWith('mark_sold_')) {
        const adId = action.replace('mark_sold_', '');
        const { data: updatedAd } = await supabase.from('ads').update({ status: 'sold' }).eq('id', adId).eq('seller_id', userId).select().single();
        
        if (updatedAd) {
          const msgId = updatedAd.telegram_message_id;
          if (msgId && PRODUCT_CHANNEL) {
            try {
              const isCar = updatedAd.category === 'vehicles' || updatedAd.category === 'cars';
              const browseUrl = isCar ? 'https://www.souqbaghdad.store/vehicles' : 'https://www.souqbaghdad.store';
              const soldButtons = {
                inline_keyboard: [
                  [{ text: '⚠️ تم بيع هذا الإعلان — تصفح المزيد 🚗', url: browseUrl }],
                  [{ text: '🚗 اعرض سيارتك للبيع مجاناً', url: `https://t.me/${BOT_USERNAME}` }]
                ]
              };
              const soldTag = isCar ? '⚠️ <b>[تم البيع / مباعة]</b>' : '⚠️ <b>[تم البيع / غير متوفر]</b>';
              const soldCaption = `${soldTag}\n\n` +
                                  `🚗 <b>${updatedAd.title}</b>\n` +
                                  `💰 <b>تم البيع بنجاح عبر منصة سوق بغداد</b>\n` +
                                  `📍 ${updatedAd.location || 'العراق'}\n\n` +
                                  `📣 لم يعد هذا الإعلان متاحاً للتواصل. يمكنك تصفح أحدث المعروضات بالضغط أدناه 👇`;

              await editMessageCaption(PRODUCT_CHANNEL, parseInt(msgId, 10), soldCaption, soldButtons);
              if (EXTRA_CHANNEL) {
                await editMessageCaption(EXTRA_CHANNEL, parseInt(msgId, 10), soldCaption, soldButtons);
              }
            } catch(e) {
              console.error('Telegram caption update error:', e);
            }
          }
          await updateOrSend('✅ <b>تم تعليم الإعلان كمباع بنجاح!</b>\n\nتم تحديث المنشور في القناة تلقائياً وتغيير الأزرار إلى «تم بيع الإعلان — تصفح المزيد» لمنع إزعاجك بالمكالمات.', {
            inline_keyboard: [[{ text: '🔙 العودة لإعلاناتي', callback_data: 'manage_cat_cars' }]]
          });
        } else {
          await updateOrSend('❌ لم يتم العثور على الإعلان أو لا تملك صلاحية تعديله.');
        }
        return new Response('OK', { status: 200 });
      }

      // Edit Car Price
      if (action.startsWith('edit_car_price_')) {
        const adId = action.replace('edit_car_price_', '');
        state = { step: 'edit_car_price_input', targetId: adId };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await updateOrSend('💰 اكتب <b>السعر الجديد</b> بالأرقام فقط:', {
          inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]]
        });
        return new Response('OK', { status: 200 });
      }

      // Edit Car Phone
      if (action.startsWith('edit_car_phone_')) {
        const adId = action.replace('edit_car_phone_', '');
        state = { step: 'edit_car_phone_input', targetId: adId };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await updateOrSend('📞 اكتب <b>رقم الهاتف الجديد</b> للتواصل:', {
          inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]]
        });
        return new Response('OK', { status: 200 });
      }

      // Redeem Promo Code Action
      if (action === 'redeem_promo') {
        state = { step: 'enter_promo_code' };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await updateOrSend('🎟️ <b>شحن وتعبئة بروموكود (كود نقاط)</b> 🪙\n\nأرسل رمز الكود الآن في رسالة (مثال: <code>GIFT50</code> أو <code>VIP100</code>):', {
          inline_keyboard: [[{ text: '❌ إلغاء العملية', callback_data: 'cancel_wizard' }]]
        });
        return new Response('OK', { status: 200 });
      }

      // Other features (support, register, faq...)
      if (action === 'buy_points') {
        await updateOrSend(`💳 <b>شراء وشحن النقاط</b> 🪙\n\nلشراء النقاط وتعبئة رصيدك في المنصة، يرجى مراسلة الإدارة عبر تيليكرام للحصول على كود التعبئة:\n👉 @rucno\n\nإذا كان لديك كود بروموكود جاهز، اضغط على زر "🎟️ إدخال بروموكود" أدناه لتفعيله فوراً:`, {
          inline_keyboard: [
            [{ text: '🎟️ إدخال وتعبئة بروموكود', callback_data: 'redeem_promo' }],
            [{ text: '💬 مراسلة الإدارة لشراء نقاط', url: 'https://t.me/rucno' }],
            [{ text: 'الرجوع للقائمة الرئيسية 🔙', callback_data: 'main_menu' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'how_to_register') {
        await updateOrSend(`لإنشاء حساب في سوق بغداد:\n1. قم بزيارة: https://www.souqbaghdad.store\n2. اضغط على أيقونة 'حسابي'.\n3. أدخل رقم هاتفك ومعلوماتك.\n\nبكل بساطة! ✨`, {
          inline_keyboard: [[{ text: 'الرجوع للقائمة الرئيسية 🔙', callback_data: 'main_menu' }]]
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'forgot_password') {
        await updateOrSend(`هل نسيت كلمة المرور الخاصة بحسابك؟ 🔑\n\nيمكنك تصفيرها فوراً والربط بحسابك المسجل:`, {
          inline_keyboard: [
            [{ text: '🔄 تصفير كلمة المرور الآن', callback_data: 'reset_password_now' }],
            [{ text: 'الرجوع للقائمة الرئيسية 🔙', callback_data: 'main_menu' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'reset_password_now') {
        if (!phone) {
           await updateOrSend('⚠️ يرجى مشاركة رقم هاتفك عبر /start أولاً.');
           return new Response('OK', { status: 200 });
        }
        
        try {
          const newPassword = Math.random().toString(36).slice(-8);
          await supabase.auth.admin.updateUserById(userId, { password: newPassword });
          await updateOrSend(`✅ تم إعادة تعيين كلمة المرور بنجاح!\n\nرقم الهاتف: ${phone}\nكلمة المرور الجديدة: <code>${newPassword}</code>\n\nيرجى الدخول للموقع وتغييرها من الإعدادات.`);
        } catch (e) {
          await updateOrSend('❌ حدث خطأ أثناء تصفير الرمز.');
        }
        return new Response('OK', { status: 200 });
      }

      if (action === 'faq') {
        await updateOrSend(`إليك أبرز الأسئلة الشائعة، تفضل باختيار أحدها:`, {
          inline_keyboard: [
            [{ text: 'كيف أنشر إعلان سيارة؟', callback_data: 'faq_publish_car' }],
            [{ text: 'كيف أنشر خط نقل؟', callback_data: 'faq_publish_trans' }],
            [{ text: 'هل الموقع مجاني؟', callback_data: 'faq_free' }],
            [{ text: 'الرجوع للقائمة الرئيسية 🔙', callback_data: 'main_menu' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'faq_publish_car') {
        await updateOrSend(`لنشر إعلان سيارة: اضغط على زر "🚗 اعرض سيارتك للبيع مجاناً" من القائمة الرئيسية، واتبع الخطوات البسيطة (الماركة، الموديل، السنة، السعر، والصور)!`, { inline_keyboard: [[{ text: 'الرجوع 🔙', callback_data: 'faq' }]] });
        return new Response('OK', { status: 200 });
      }

      if (action === 'faq_publish_trans') {
        await updateOrSend(`لنشر خط نقل: اضغط على زر "🚌 انشر خط نقل" من القائمة الرئيسية، وحدد مناطق الانطلاق، الجامعة أو العمل، وقت الدوام، والأجرة!`, { inline_keyboard: [[{ text: 'الرجوع 🔙', callback_data: 'faq' }]] });
        return new Response('OK', { status: 200 });
      }

      if (action === 'faq_free') {
        await updateOrSend(`نعم، منصة وبوت سوق بغداد مجانية 100% بدون أي عمولة بيع! 🎉`, { inline_keyboard: [[{ text: 'الرجوع 🔙', callback_data: 'faq' }]] });
        return new Response('OK', { status: 200 });
      }

      // Submenu: Manage Ads & Products
      if (action === 'manage_cat_ads') {
        await updateOrSend('📢 <b>إدارة الإعلانات والمنتجات</b>\n\nاختر تصفية العرض المناسبة:', {
          inline_keyboard: [
            [{ text: '⚡ آخر إعلانين', callback_data: 'view_ads_recent' }, { text: '📅 هذا الشهر', callback_data: 'view_ads_month' }],
            [{ text: '🟢 الإعلانات النشطة', callback_data: 'view_ads_active' }, { text: '📜 جميع الإعلانات', callback_data: 'view_ads_all' }],
            [{ text: '🔙 العودة لإدارة الإعلانات', callback_data: 'manage_my_ads' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      // Delete Ads/Transports/Products
      if (action.startsWith('del_prod_')) {
        const prodId = action.replace('del_prod_', '');
        const { data: adToDelete } = await supabase.from('products').select('facebook_post_id, telegram_message_id, instagram_post_id').eq('id', prodId).single();
        const { error: delErr } = await supabase.from('products').delete().eq('id', prodId);
        
        if (delErr) {
          await sendMessage(chatId, '❌ لم يتم العثور على المنتج، أو حدث خطأ أثناء الحذف.');
          return new Response('OK', { status: 200 });
        }
        
        if (adToDelete) {
          if (adToDelete.facebook_post_id) await deleteFromFacebook(adToDelete.facebook_post_id);
          if (adToDelete.instagram_post_id) await deleteFromInstagram(adToDelete.instagram_post_id);
          if (adToDelete.telegram_message_id && PRODUCT_CHANNEL) {
             await deleteMessage(PRODUCT_CHANNEL, parseInt(adToDelete.telegram_message_id, 10));
             if (EXTRA_CHANNEL) await deleteMessage(EXTRA_CHANNEL, parseInt(adToDelete.telegram_message_id, 10));
          }
        }
        
        await sendMessage(chatId, '✅ تم حذف المنتج بنجاح.', { inline_keyboard: [[{ text: 'العودة لإدارة إعلاناتي', callback_data: 'manage_cat_ads' }]] });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('del_trans_')) {
        const transId = action.replace('del_trans_', '');
        const { data: adToDelete } = await supabase.from('ads').select('id, seller_id, phone, facebook_post_id, telegram_message_id, instagram_post_id, category').eq('id', transId).maybeSingle();
        
        if (!adToDelete) {
          await sendMessage(chatId, '❌ لم يتم العثور على الإعلان أو تم حذفه مسبقاً.');
          return new Response('OK', { status: 200 });
        }

        const { error: delError } = await supabase.from('ads').delete().eq('id', transId);
        
        if (delError) {
          console.error('Delete ad error:', delError);
          await sendMessage(chatId, '❌ حدث خطأ أثناء حذف الإعلان من قاعدة البيانات.');
          return new Response('OK', { status: 200 });
        }
        
        if (adToDelete) {
          if (adToDelete.facebook_post_id) await deleteFromFacebook(adToDelete.facebook_post_id);
          if (adToDelete.instagram_post_id) await deleteFromInstagram(adToDelete.instagram_post_id);
          if (adToDelete.telegram_message_id) {
             const channel = (adToDelete.category !== 'transport') ? PRODUCT_CHANNEL : TRANSPORT_CHANNEL;
             if (channel) await deleteMessage(channel, parseInt(adToDelete.telegram_message_id, 10));
             if (EXTRA_CHANNEL) await deleteMessage(EXTRA_CHANNEL, parseInt(adToDelete.telegram_message_id, 10));
          }
        }
        
        const returnCb = (adToDelete.category === 'vehicles' || adToDelete.category === 'cars') ? 'manage_cat_cars' : (adToDelete.category === 'transport' ? 'manage_cat_trans' : 'manage_my_ads');
        await sendMessage(chatId, '✅ <b>تم حذف الإعلان نهائياً بنجاح!</b>\nتمت إزالة المنشور من القناة وقاعدة البيانات.', {
          inline_keyboard: [[{ text: '🔙 العودة لإعلاناتي', callback_data: returnCb }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
        });
        return new Response('OK', { status: 200 });
      }

      // Support Wizard
      if (action === 'contact_support') {
        state = { step: 'support_message', data: {} };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await sendMessage(chatId, '📞 <b>الدعم الفني للاستفسارات والشكاوى</b>\n\nيرجى كتابة رسالتك أو استفسارك بالتفصيل وسيقوم فريق الدعم بالرد عليك بأقرب وقت:', { inline_keyboard: [[{ text: '❌ إلغاء العملية', callback_data: 'cancel_wizard' }]] });
        return new Response('OK', { status: 200 });
      }

      // Product Wizard
      if (action === 'publish_product') {
        const { data: profile } = await supabase.from('profiles').select('points, role').eq('id', userId).maybeSingle();
        if (profile?.role !== 'admin' && profile?.role !== 'owner' && (profile?.points || 0) < 1) {
          await sendMessage(chatId, '❌ عذراً، رصيد النقاط الخاص بك غير كافٍ لنشر إعلان. يرجى شحن المحفظة أولاً.', { inline_keyboard: [[{ text: '💳 شراء نقاط', callback_data: 'buy_points' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]] });
          return new Response('OK', { status: 200 });
        }
        
        state = { step: 'product_title', data: {} };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await sendMessage(chatId, '📦 <b>نشر منتج عام</b>\nيرجى كتابة <b>عنوان</b> المنتج (مثال: ايفون 15 برو ماكس):', { inline_keyboard: [[{ text: '❌ إلغاء العملية', callback_data: 'cancel_wizard' }]] });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('prod_cat_')) {
        state.data.category = action.replace('prod_cat_', '');
        state.step = 'product_condition';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await sendMessage(chatId, 'ما هي <b>حالة</b> المنتج؟', {
          inline_keyboard: [
            [{ text: '🆕 جديد', callback_data: 'prod_cond_new' }, { text: '♻️ مستعمل', callback_data: 'prod_cond_used' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('prod_cond_')) {
        state.data.condition = action.replace('prod_cond_', '');
        state.step = 'product_image';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await sendMessage(chatId, '📸 الرجاء <b>إرسال صورة</b> واحدة واضحة للمنتج:');
        return new Response('OK', { status: 200 });
      }
    }

    // --- Handle Text, Photo, and Voice Inputs for State Machine ---
    if (text || photo || voice) {
      if (text === '/cancel') {
        await showMainMenu();
        return new Response('OK', { status: 200 });
      }

      // Interruption Check (Only when not actively in a form step)
      const isActivelyFilling = state.step && (
        state.step.startsWith('car_') || 
        state.step.startsWith('edit_car_') || 
        state.step.startsWith('trans_') ||
        state.step.startsWith('edit_trans_') ||
        state.step.startsWith('product_')
      );

      if (!isActivelyFilling && Object.keys(state).length > 0 && text && !text.startsWith('car_') && !text.startsWith('trans_') && !['تم', 'تم ✅'].includes(text.trim())) {
        const isInterruption = await checkInterruption(text);
        if (isInterruption) {
           state = {};
           if (userId) {
             await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
           }
           const aiRes = await callGemini(text);
           await showMainMenu(aiRes || undefined);
           return new Response('OK', { status: 200 });
        }
      }

      const cancelBtn = { inline_keyboard: [[{ text: '❌ إلغاء العملية', callback_data: 'cancel_wizard' }]] };

      // ==========================================
      // 🚗 CAR WIZARD TEXT & PHOTO INPUTS
      // ==========================================
      if (state.step === 'car_model' && text) {
        state.data.model = text.trim();
        state.step = 'car_year';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const yearButtons = CAR_YEARS.map(row => row.map(y => {
          if (y.includes('أقدم')) return { text: y, callback_data: 'car_year_older' };
          return { text: y, callback_data: `car_year_${y}` };
        }));
        yearButtons.push([{ text: '◀️ السابق', callback_data: `publish_car` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await sendMessage(chatId, `📅 <b>الخطوة 3 من 10 — سنة الصنع (الموديل)</b>\n\nاختر سنة صنع السيارة 👇`, {
          inline_keyboard: yearButtons
        });
      }
      else if (state.step === 'car_year_custom' && text) {
        const cleanYear = text.replace(/[^0-9]/g, '');
        if (!cleanYear || cleanYear.length !== 4) {
          await sendMessage(chatId, '⚠️ الرجاء كتابة سنة الصنع بأربعة أرقام (مثال: 2008):');
          return new Response('OK', { status: 200 });
        }
        state.data.year = cleanYear;
        state.step = 'car_gov';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const govButtons = IRAQI_GOVERNORATES.map(row => row.map(g => ({ text: g, callback_data: `car_gov_${g}` })));
        govButtons.push([{ text: '◀️ السابق', callback_data: `car_brand_${state.data.brand || 'هيونداي'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await sendMessage(chatId, `📍 <b>الخطوة 4 من 10 — المحافظة</b>\n\nاختر محافظة تواجد السيارة 👇`, {
          inline_keyboard: govButtons
        });
      }
      else if (state.step === 'car_mileage' && text) {
        const cleanNum = text.replace(/[^0-9]/g, '');
        if (!cleanNum) {
          await sendMessage(chatId, '⚠️ اكتب عدد الكيلومترات بالأرقام فقط (مثال: 110000 أو 0 إذا كانت زيرو):');
          return new Response('OK', { status: 200 });
        }
        state.data.mileage = cleanNum;
        state.step = 'car_currency';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        await sendMessage(chatId, `💵 <b>الخطوة 7 من 10 — عملة السعر</b>\n\nاختر عملة السعر 👇`, {
          inline_keyboard: [
            [{ text: '💵 دولار $', callback_data: 'car_currency_usd' }, { text: '💰 دينار عراقي د.ع', callback_data: 'car_currency_iqd' }],
            [{ text: '◀️ السابق', callback_data: `car_origin_${state.data.origin || 'وارد خليجي'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
          ]
        });
      }
      else if (state.step === 'car_price' && text) {
        const cleanPrice = text.replace(/[^0-9]/g, '');
        if (!cleanPrice) {
          await sendMessage(chatId, '⚠️ اكتب السعر بالأرقام فقط:');
          return new Response('OK', { status: 200 });
        }
        state.data.price = cleanPrice;
        state.step = 'car_images';
        if (!state.data.images) state.data.images = [];
        delete state.data.statusMsgId;
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        await sendMessage(chatId, `📸 <b>الخطوة 9 من 10 — صور السيارة</b>\n\nأرسل صور سيارتك الآن (تگدر ترسل حتى 6 صور).\n• أول صورة ستظهر في القناة الرئيسية.\n• البقية تُحفظ وتُعرض في صفحة الإعلان بالمنصة.\n\nبعد الانتهاء من إرسال الصور اضغط «تم ✅» للمتابعة.`, {
          inline_keyboard: [
            [{ text: 'تم ✅', callback_data: 'car_images_done' }],
            [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
          ]
        });
      }
      else if (state.step === 'car_images') {
        if (text && (text.trim() === 'تم' || text.trim() === 'تم ✅')) {
          state.step = 'car_phone';
          delete state.data.statusMsgId;
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

          const currentPhone = phone || '';
          const phoneButtons = [];
          if (currentPhone) {
            phoneButtons.push([{ text: `📱 استخدام رقمي الحالي (${currentPhone})`, callback_data: 'car_phone_current' }]);
          }
          phoneButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

          await sendMessage(chatId, `📞 <b>الخطوة 10 من 10 — رقم الهاتف للتواصل</b>\n\nاكتب رقم الهاتف الخاص بك للتواصل، أو اضغط على الزر أدناه:`, {
            inline_keyboard: phoneButtons
          });
          return new Response('OK', { status: 200 });
        }

        if (photo) {
          const fileId = photo[photo.length - 1].file_id;
          const fileRes = await fetch(`${tgUrl}/getFile?file_id=${fileId}`);
          const fileData = await fileRes.json();
          
          if (fileData.ok) {
            const filePath = fileData.result.file_path;
            const imageRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
            const imageBlob = await imageRes.blob();
            const fileName = `car_${chatId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.jpg`;
            
            const { data: uploadData } = await supabase.storage.from('ad-images').upload(fileName, imageBlob, { contentType: 'image/jpeg' });
            if (uploadData) {
              const { data: pubUrl } = supabase.storage.from('ad-images').getPublicUrl(fileName);
              if (!state.data.images) state.data.images = [];
              state.data.images.push(pubUrl.publicUrl);

              const count = state.data.images.length;
              const statusText = `📸 <b>تم استلام (${count}) من الصور بنجاح ✅</b>${count >= 6 ? '\n(تم الوصول للحد الأقصى 6 صور)' : ''}\n\nأرسل المزيد أو اضغط على «تم ✅» للمتابعة.`;
              const statusMarkup = {
                inline_keyboard: [
                  [{ text: 'تم ✅ (متابعة)', callback_data: 'car_images_done' }],
                  [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
                ]
              };

              if (state.data.statusMsgId) {
                try {
                  await editMessageText(chatId, state.data.statusMsgId, statusText, statusMarkup);
                } catch(e) {
                  const newRes = await sendMessage(chatId, statusText, statusMarkup);
                  if (newRes?.result?.message_id) {
                    state.data.statusMsgId = newRes.result.message_id;
                  }
                }
              } else {
                const newRes = await sendMessage(chatId, statusText, statusMarkup);
                if (newRes?.result?.message_id) {
                  state.data.statusMsgId = newRes.result.message_id;
                }
              }

              await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
            }
          }
        } else {
          await sendMessage(chatId, '📸 أرسل صور السيارة، أو اضغط «تم ✅» للمتابعة.', {
            inline_keyboard: [
              [{ text: 'تم ✅', callback_data: 'car_images_done' }],
              [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
            ]
          });
        }
      }
      else if (state.step === 'car_phone' && text) {
        state.data.phone = text.trim();
        state.step = 'car_review';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const currencySymbol = state.data.currency || 'د.ع';
        const formattedPrice = formatTgPrice(state.data.price, currencySymbol);
        const carTitle = `${state.data.brand || ''} ${state.data.model || ''} ${state.data.year || ''}`.trim();
        const mileageStr = state.data.mileage ? `${parseInt(state.data.mileage).toLocaleString('en-US')} كم` : 'غير محدد';
        const imgCount = state.data.images?.length || 0;

        const reviewText = `🔍 <b>مراجعة أخيرة قبل النشر</b>\nتأكد من صحة المعلومات، ثم اضغط «✅ نشر الإعلان الآن»:\n\n` +
                           `🚗 <b>النوع والموديل:</b> ${carTitle}\n` +
                           `📅 <b>السنة:</b> ${state.data.year || 'غير محدد'}\n` +
                           `🛣️ <b>الكيلومتر:</b> ${mileageStr}\n` +
                           `📍 <b>الموقع:</b> ${state.data.governorate || 'بغداد'}\n` +
                           `📋 <b>المواصفات:</b> ${state.data.origin || 'وارد عام'}\n` +
                           `💰 <b>السعر:</b> ${formattedPrice}\n` +
                           `📞 <b>التواصل:</b> ${state.data.phone}\n` +
                           `📸 <b>الصور:</b> ${imgCount} صور مرفقة\n`;

        await sendMessage(chatId, reviewText, {
          inline_keyboard: [
            [{ text: '✅ نشر الإعلان الآن', callback_data: 'car_confirm_publish' }],
            [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
          ]
        });
      }
      // Edit Car Price Input
      else if (state.step === 'edit_car_price_input' && text) {
        const cleanPrice = text.replace(/[^0-9]/g, '');
        const targetId = state.targetId;
        if (cleanPrice && targetId) {
          await supabase.from('ads').update({ price: cleanPrice }).eq('id', targetId);
          const { data: updatedAd } = await supabase.from('ads').select('*').eq('id', targetId).maybeSingle();

          if (updatedAd) {
            let specs: any = {};
            try { specs = JSON.parse(updatedAd.description); } catch(e){}
            const curr = specs.currency || '$';
            const formattedPrice = formatTgPrice(cleanPrice, curr);
            const brand = specs.brand || '';
            const model = specs.model || '';
            const year = specs.year || '';
            const mileage = specs.mileage ? `${parseInt(specs.mileage).toLocaleString('en-US')} كم` : 'غير محدد';
            const origin = specs.origin || 'وارد عام';
            const gov = updatedAd.location || updatedAd.city || 'العراق';
            const carTitle = `${brand} ${model} ${year}`.trim() || updatedAd.title || 'سيارة للبيع';
            const adId = updatedAd.short_id || updatedAd.id;
            const link = `https://www.souqbaghdad.store/ad/${adId}`;

            const newCaption = `🚗 <b>النوع:</b> ${carTitle}\n` +
                               `📅 <b>السنة:</b> ${year || 'غير محدد'}\n` +
                               `🛣️ <b>الكيلومتر:</b> ${mileage}\n` +
                               `📍 <b>الموقع:</b> ${gov}\n` +
                               `📋 <b>المواصفات:</b> ${origin}\n` +
                               `💰 <b>السعر المحدث:</b> ${formattedPrice}\n` +
                               (updatedAd.phone ? `📞 <b>التواصل:</b> ${updatedAd.phone}\n\n` : `\n`) +
                               `📣 <b>#رقم_الإعلان_${adId}</b> | @${BOT_USERNAME}`;

            let cleanPhone = (updatedAd.phone || '').replace(/[^0-9+]/g, '');
            if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
            else cleanPhone = cleanPhone.replace('+', '');

            const contactRow = [];
            if (cleanPhone) {
              contactRow.push({ text: '💬 تواصل واتساب', url: `https://wa.me/${cleanPhone}` });
              contactRow.push({ text: '✈️ تواصل تيليكرام', url: `https://t.me/+${cleanPhone}` });
            }

            const inlineKeyboard = [
              [{ text: '🌐 عرض التفاصيل بالمنصة', url: link }]
            ];
            if (contactRow.length > 0) inlineKeyboard.push(contactRow);
            inlineKeyboard.push([{ text: '🚗 اعرض سيارتك للبيع مجاناً', url: `https://t.me/${BOT_USERNAME}` }]);

            const replyMarkup = { inline_keyboard: inlineKeyboard };

            if (updatedAd.telegram_message_id && PRODUCT_CHANNEL) {
              try {
                await editMessageCaption(PRODUCT_CHANNEL, parseInt(updatedAd.telegram_message_id, 10), newCaption, replyMarkup);
                if (EXTRA_CHANNEL) await editMessageCaption(EXTRA_CHANNEL, parseInt(updatedAd.telegram_message_id, 10), newCaption, replyMarkup);
              } catch(e) {
                console.error('Caption update error:', e);
              }
            }

            await sendMessage(chatId, `✅ <b>تم تحديث السعر بنجاح!</b>\nالسعر الجديد: <b>${formattedPrice}</b>\nتم تحديث المنشور في القناة مباشرة.`, {
              inline_keyboard: [[{ text: '🚗 العودة لسياراتي المعروضة', callback_data: 'manage_cat_cars' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
            });
          }
        }
        state = {};
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        return new Response('OK', { status: 200 });
      }
      // Edit Car Phone Input
      else if (state.step === 'edit_car_phone_input' && text) {
        const newPhone = text.trim();
        const targetId = state.targetId;
        if (newPhone && targetId) {
          await supabase.from('ads').update({ phone: newPhone }).eq('id', targetId);
          const { data: updatedAd } = await supabase.from('ads').select('*').eq('id', targetId).maybeSingle();

          if (updatedAd) {
            let specs: any = {};
            try { specs = JSON.parse(updatedAd.description); } catch(e){}
            const curr = specs.currency || '$';
            const formattedPrice = formatTgPrice(updatedAd.price, curr);
            const brand = specs.brand || '';
            const model = specs.model || '';
            const year = specs.year || '';
            const mileage = specs.mileage ? `${parseInt(specs.mileage).toLocaleString('en-US')} كم` : 'غير محدد';
            const origin = specs.origin || 'وارد عام';
            const gov = updatedAd.location || updatedAd.city || 'العراق';
            const carTitle = `${brand} ${model} ${year}`.trim() || updatedAd.title || 'سيارة للبيع';
            const adId = updatedAd.short_id || updatedAd.id;
            const link = `https://www.souqbaghdad.store/ad/${adId}`;

            const newCaption = `🚗 <b>النوع:</b> ${carTitle}\n` +
                               `📅 <b>السنة:</b> ${year || 'غير محدد'}\n` +
                               `🛣️ <b>الكيلومتر:</b> ${mileage}\n` +
                               `📍 <b>الموقع:</b> ${gov}\n` +
                               `📋 <b>المواصفات:</b> ${origin}\n` +
                               `💰 <b>السعر:</b> ${formattedPrice}\n` +
                               `📞 <b>التواصل:</b> ${newPhone}\n\n` +
                               `📣 <b>#رقم_الإعلان_${adId}</b> | @${BOT_USERNAME}`;

            let cleanPhone = newPhone.replace(/[^0-9+]/g, '');
            if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
            else cleanPhone = cleanPhone.replace('+', '');

            const contactRow = [];
            if (cleanPhone) {
              contactRow.push({ text: '💬 تواصل واتساب', url: `https://wa.me/${cleanPhone}` });
              contactRow.push({ text: '✈️ تواصل تيليكرام', url: `https://t.me/+${cleanPhone}` });
            }

            const inlineKeyboard = [
              [{ text: '🌐 عرض التفاصيل بالمنصة', url: link }]
            ];
            if (contactRow.length > 0) inlineKeyboard.push(contactRow);
            inlineKeyboard.push([{ text: '🚗 اعرض سيارتك للبيع مجاناً', url: `https://t.me/${BOT_USERNAME}` }]);

            const replyMarkup = { inline_keyboard: inlineKeyboard };

            if (updatedAd.telegram_message_id && PRODUCT_CHANNEL) {
              try {
                await editMessageCaption(PRODUCT_CHANNEL, parseInt(updatedAd.telegram_message_id, 10), newCaption, replyMarkup);
                if (EXTRA_CHANNEL) await editMessageCaption(EXTRA_CHANNEL, parseInt(updatedAd.telegram_message_id, 10), newCaption, replyMarkup);
              } catch(e) {
                console.error('Caption update error:', e);
              }
            }

            await sendMessage(chatId, `✅ <b>تم تحديث رقم الهاتف بنجاح!</b>\nالرقم الجديد: <b>${newPhone}</b>\nتم تحديث المنشور في القناة مباشرة.`, {
              inline_keyboard: [[{ text: '🚗 العودة لسياراتي المعروضة', callback_data: 'manage_cat_cars' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
            });
          }
        }
        state = {};
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        return new Response('OK', { status: 200 });
      }

      // ==========================================
      // 🚌 TRANSPORT WIZARD TEXT INPUTS
      // ==========================================
      else if (state.step === 'trans_area_custom_input' && text) {
        state.data.regions = text.trim();
        state.step = 'trans_dest';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const destButtons = TRANSPORT_DESTINATIONS_BAGHDAD.map(row => row.map(d => {
          if (d.includes('أخرى')) return { text: d, callback_data: 'trans_dest_custom' };
          return { text: d, callback_data: `trans_dest_${d}` };
        }));
        destButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await sendMessage(chatId, `🏢 <b>الخطوة 4 من 9 — الوجهة (الجامعة أو العمل)</b>\n\nاختر الوجهة المطلوبة 👇`, {
          inline_keyboard: destButtons
        });
      }
      else if (state.step === 'trans_dest_custom_input' && text) {
        state.data.destination = text.trim();
        state.step = 'trans_shift';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const shiftButtons = TRANSPORT_SHIFTS.map(row => row.map(s => ({ text: s, callback_data: `trans_shift_${s}` })));
        shiftButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await sendMessage(chatId, `⏰ <b>الخطوة 5 من 9 — وقت الدوام والشفت</b>\n\nاختر وقت الدوام 👇`, {
          inline_keyboard: shiftButtons
        });
      }
      else if (state.step === 'trans_fare_custom_input' && text) {
        const cleanPrice = text.replace(/[^0-9]/g, '');
        state.data.price = cleanPrice || '0';
        state.step = 'trans_phone';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const currentPhone = phone || '';
        const phoneButtons = [];
        if (currentPhone) {
          phoneButtons.push([{ text: `📱 استخدام رقمي الحالي (${currentPhone})`, callback_data: 'trans_phone_current' }]);
        }
        phoneButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await sendMessage(chatId, `📞 <b>الخطوة 9 من 9 — رقم الهاتف للتواصل</b>\n\nاكتب رقم الهاتف الخاص بك للتواصل، أو اضغط على الزر أدناه:`, {
          inline_keyboard: phoneButtons
        });
      }
      else if (state.step === 'trans_phone' && text) {
        state.data.phone = text.trim();
        state.step = 'trans_review';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const typeStr = state.data.type === 'offer' ? '🚗 أوفر خط نقل (سائق)' : '🙋‍♂️ أبحث عن خط نقل (مطلوب)';
        const fareStr = formatTgPrice(state.data.price);
        const reviewText = `🔍 <b>مراجعة إعلان الخط قبل النشر</b>\nتأكد من صحة المعلومات، ثم اضغط «✅ نشر إعلان الخط الآن»:\n\n` +
                           `📌 <b>النوع:</b> ${typeStr}\n` +
                           `🏷️ <b>الفئة:</b> ${state.data.categoryType === 'employee' ? '💼 موظفين' : '🎓 طلاب'} (${state.data.targetAudience || 'الجميع'})\n` +
                           `📍 <b>مناطق الانطلاق:</b> ${state.data.regions || 'بغداد'}\n` +
                           `🏢 <b>الوجهة:</b> ${state.data.destination || 'بغداد'}\n` +
                           `⏰ <b>الدوام:</b> ${state.data.shift || 'صباحي'}\n` +
                           `🚗 <b>المركبة:</b> ${state.data.vehicleType || 'صالون'}\n` +
                           `💰 <b>الأجرة:</b> ${fareStr}\n` +
                           `📞 <b>التواصل:</b> ${state.data.phone}\n`;

        await sendMessage(chatId, reviewText, {
          inline_keyboard: [
            [{ text: '✅ نشر إعلان الخط الآن', callback_data: 'trans_confirm_publish' }],
            [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
          ]
        });
      }
      // Edit Transport Price Input
      else if (state.step === 'edit_trans_price_input' && text) {
        const cleanPrice = text.replace(/[^0-9]/g, '');
        const targetId = state.targetId;
        if (targetId) {
          await supabase.from('ads').update({ price: cleanPrice || '0' }).eq('id', targetId);
          const { data: updatedTrans } = await supabase.from('ads').select('*').eq('id', targetId).maybeSingle();

          if (updatedTrans) {
            const formattedPrice = formatTgPrice(cleanPrice);
            let desc: any = {};
            try { desc = typeof updatedTrans.description === 'string' ? JSON.parse(updatedTrans.description) : updatedTrans.description; } catch(e){}
            
            const catType = desc?.categoryType === 'employee' ? '💼 خط موظفين' : '🎓 خط طلاب';
            const targetStr = desc?.targetAudience || 'الجميع';
            const adId = updatedTrans.short_id || updatedTrans.id;
            const link = `https://www.souqbaghdad.store/transport/card/${adId}`;

            const newMsg = `🚌 <b>إعلان خط نقل — سوق بغداد (سعر محدث)</b>\n\n` +
                           `📌 <b>النوع:</b> ${updatedTrans.type === 'offer' ? '🚗 أوفر خط نقل' : '🙋‍♂️ أبحث عن خط نقل'}\n` +
                           `🏷️ <b>الفئة:</b> ${catType} (${targetStr})\n` +
                           `📍 <b>مناطق الانطلاق:</b> ${updatedTrans.location}\n` +
                           `🏢 <b>الوجهة:</b> ${updatedTrans.city}\n` +
                           `⏰ <b>وقت الدوام:</b> ${desc?.shift || 'صباحي'}\n` +
                           `🚗 <b>المركبة:</b> ${desc?.vehicleType || 'صالون'}\n` +
                           `💰 <b>الأجرة المحدثة:</b> ${formattedPrice}\n` +
                           (updatedTrans.phone ? `📞 <b>التواصل:</b> ${updatedTrans.phone}\n\n` : `\n`) +
                           `📣 <b>#رقم_الخط_${adId}</b> | @${BOT_USERNAME}`;

            let cleanPhone = (updatedTrans.phone || '').replace(/[^0-9+]/g, '');
            if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
            else cleanPhone = cleanPhone.replace('+', '');

            const contactRow = [];
            if (cleanPhone) {
              contactRow.push({ text: '💬 تواصل واتساب', url: `https://wa.me/${cleanPhone}` });
              contactRow.push({ text: '✈️ تواصل تيليكرام', url: `https://t.me/+${cleanPhone}` });
            }

            const inlineKeyboard = [
              [{ text: '🌐 التفاصيل الكاملة وحجز المقعد', url: link }]
            ];
            if (contactRow.length > 0) inlineKeyboard.push(contactRow);
            inlineKeyboard.push([{ text: '🚌 انشر خطك مجاناً عبر البوت', url: `https://t.me/${BOT_USERNAME}` }]);

            const replyMarkup = { inline_keyboard: inlineKeyboard };

            if (updatedTrans.telegram_message_id && TRANSPORT_CHANNEL) {
              try {
                await editMessageCaption(TRANSPORT_CHANNEL, parseInt(updatedTrans.telegram_message_id, 10), newMsg, replyMarkup);
                if (EXTRA_CHANNEL) await editMessageCaption(EXTRA_CHANNEL, parseInt(updatedTrans.telegram_message_id, 10), newMsg, replyMarkup);
              } catch(e) {
                console.error('Caption update error:', e);
              }
            }

            await sendMessage(chatId, `✅ <b>تم تحديث الأجرة بنجاح!</b>\nالأجرة الجديدة: <b>${formattedPrice}</b>\nتم تحديث المنشور في القناة مباشرة.`, {
              inline_keyboard: [[{ text: '🚌 العودة لخطوطي', callback_data: 'manage_cat_trans' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
            });
          }
        }
        state = {};
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        return new Response('OK', { status: 200 });
      }
      // Edit Transport Phone Input
      else if (state.step === 'edit_trans_phone_input' && text) {
        const newPhone = text.trim();
        const targetId = state.targetId;
        if (newPhone && targetId) {
          await supabase.from('ads').update({ phone: newPhone }).eq('id', targetId);
          const { data: updatedTrans } = await supabase.from('ads').select('*').eq('id', targetId).maybeSingle();

          if (updatedTrans) {
            let desc: any = {};
            try { desc = typeof updatedTrans.description === 'string' ? JSON.parse(updatedTrans.description) : updatedTrans.description; } catch(e){}
            
            const catType = desc?.categoryType === 'employee' ? '💼 خط موظفين' : '🎓 خط طلاب';
            const targetStr = desc?.targetAudience || 'الجميع';
            const adId = updatedTrans.short_id || updatedTrans.id;
            const link = `https://www.souqbaghdad.store/transport/card/${adId}`;

            const newMsg = `🚌 <b>إعلان خط نقل — سوق بغداد</b>\n\n` +
                           `📌 <b>النوع:</b> ${updatedTrans.type === 'offer' ? '🚗 أوفر خط نقل' : '🙋‍♂️ أبحث عن خط نقل'}\n` +
                           `🏷️ <b>الفئة:</b> ${catType} (${targetStr})\n` +
                           `📍 <b>مناطق الانطلاق:</b> ${updatedTrans.location}\n` +
                           `🏢 <b>الوجهة:</b> ${updatedTrans.city}\n` +
                           `⏰ <b>وقت الدوام:</b> ${desc?.shift || 'صباحي'}\n` +
                           `🚗 <b>المركبة:</b> ${desc?.vehicleType || 'صالون'}\n` +
                           `💰 <b>الأجرة:</b> ${formatTgPrice(updatedTrans.price)}\n` +
                           `📞 <b>التواصل:</b> ${newPhone}\n\n` +
                           `📣 <b>#رقم_الخط_${adId}</b> | @${BOT_USERNAME}`;

            let cleanPhone = newPhone.replace(/[^0-9+]/g, '');
            if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
            else cleanPhone = cleanPhone.replace('+', '');

            const contactRow = [];
            if (cleanPhone) {
              contactRow.push({ text: '💬 تواصل واتساب', url: `https://wa.me/${cleanPhone}` });
              contactRow.push({ text: '✈️ تواصل تيليكرام', url: `https://t.me/+${cleanPhone}` });
            }

            const inlineKeyboard = [
              [{ text: '🌐 التفاصيل الكاملة وحجز المقعد', url: link }]
            ];
            if (contactRow.length > 0) inlineKeyboard.push(contactRow);
            inlineKeyboard.push([{ text: '🚌 انشر خطك مجاناً عبر البوت', url: `https://t.me/${BOT_USERNAME}` }]);

            const replyMarkup = { inline_keyboard: inlineKeyboard };

            if (updatedTrans.telegram_message_id && TRANSPORT_CHANNEL) {
              try {
                await editMessageCaption(TRANSPORT_CHANNEL, parseInt(updatedTrans.telegram_message_id, 10), newMsg, replyMarkup);
                if (EXTRA_CHANNEL) await editMessageCaption(EXTRA_CHANNEL, parseInt(updatedTrans.telegram_message_id, 10), newMsg, replyMarkup);
              } catch(e) {
                console.error('Caption update error:', e);
              }
            }

            await sendMessage(chatId, `✅ <b>تم تحديث رقم الهاتف بنجاح!</b>\nالرقم الجديد: <b>${newPhone}</b>\nتم تحديث المنشور في القناة مباشرة.`, {
              inline_keyboard: [[{ text: '🚌 العودة لخطوطي', callback_data: 'manage_cat_trans' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
            });
          }
        }
        state = {};
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        return new Response('OK', { status: 200 });
      }

      // Promo Code Redemption Input
      else if (state.step === 'enter_promo_code' && text) {
        const inputCode = text.trim().toUpperCase();
        
        // 1. Fetch promo code
        const { data: promo, error: pErr } = await supabase.from('promo_codes').select('*').eq('code', inputCode).maybeSingle();
        
        if (pErr || !promo) {
          await sendMessage(chatId, `❌ <b>كود غير صالح!</b>\nالكود <code>${inputCode}</code> غير موجود أو تم إدخاله بشكل غير صحيح.`, {
            inline_keyboard: [
              [{ text: '🔄 تجربة كود آخر', callback_data: 'redeem_promo' }],
              [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
            ]
          });
          state = {};
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          return new Response('OK', { status: 200 });
        }

        if (promo.is_used) {
          await sendMessage(chatId, `⚠️ <b>هذا الكود تم استخدامه واكتمال حدّه مسبقاً.</b>`, {
            inline_keyboard: [
              [{ text: '🔄 تجربة كود آخر', callback_data: 'redeem_promo' }],
              [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
            ]
          });
          state = {};
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          return new Response('OK', { status: 200 });
        }

        // 2. Check if user already used it
        const { data: alreadyUsed } = await supabase.from('promo_code_usages').select('id').eq('code', inputCode).eq('user_id', userId).maybeSingle();
        if (alreadyUsed) {
          await sendMessage(chatId, `⚠️ <b>لقد قمت باستخدام وتفعيل هذا الكود مسبقاً في حسابك!</b>`, {
            inline_keyboard: [[{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
          });
          state = {};
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          return new Response('OK', { status: 200 });
        }

        // 3. Check total usages
        const { count: totalUses } = await supabase.from('promo_code_usages').select('id', { count: 'exact', head: true }).eq('code', inputCode);
        const maxUses = promo.max_uses || 1;
        if ((totalUses || 0) >= maxUses) {
          await supabase.from('promo_codes').update({ is_used: true }).eq('code', inputCode);
          await sendMessage(chatId, `⚠️ <b>هذا الكود اكتمل الحد الأقصى لاستخدامه.</b>`, {
            inline_keyboard: [[{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
          });
          state = {};
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          return new Response('OK', { status: 200 });
        }

        // 4. Record usage
        await supabase.from('promo_code_usages').insert({ code: inputCode, user_id: userId });

        // 5. Add points
        const { data: curProfile } = await supabase.from('profiles').select('points').eq('id', userId).single();
        const addedPoints = promo.points || 0;
        const newTotalPoints = (curProfile?.points || 0) + addedPoints;
        await supabase.from('profiles').update({ points: newTotalPoints }).eq('id', userId);

        // 6. Record points ledger if table exists
        try {
          await supabase.from('points_ledger').insert({
            user_id: userId,
            amount: addedPoints,
            reason: `استرداد بروموكود عبر البوت: ${inputCode}`
          });
        } catch(e) {}

        // 7. Update promo is_used if reached max
        if ((totalUses || 0) + 1 >= maxUses) {
          await supabase.from('promo_codes').update({ is_used: true }).eq('code', inputCode);
        }

        // 8. Celebration message & direct shortcuts
        await sendMessage(chatId, `🎉 <b>ألف مبروك! تم شحن محفظتك بنجاح!</b> 🪙\n\n` +
                                  `🎟️ <b>رمز الكود:</b> <code>${inputCode}</code>\n` +
                                  `🎁 <b>النقاط المضافة:</b> +${addedPoints} نقطة\n` +
                                  `💰 <b>رصيدك الكلي الآن:</b> ${newTotalPoints} نقطة\n\n` +
                                  `تم تحديث محفظتك فوراً، ويمكنك نشر إعلاناتك الآن:`, {
          inline_keyboard: [
            [{ text: '🚗 اعرض سيارة للبيع مجاناً', callback_data: 'publish_car' }],
            [{ text: '🚌 انشر خط نقل', callback_data: 'publish_transport' }],
            [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
          ]
        });

        state = {};
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        return new Response('OK', { status: 200 });
      }

      // Support Message
      else if (state.step === 'support_message' && text) {
        await sendMessage(chatId, '⏳ جاري إرسال رسالتك للدعم الفني...');
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
        
        await supabase.from('support_messages').insert({
          user_id: userId,
          name: profile?.full_name || 'مستخدم تيليكرام',
          phone: phone,
          message: text,
          status: 'new'
        });

        await sendMessage(chatId, '✅ <b>تم إرسال رسالتك بنجاح!</b>\nسيقوم فريق الدعم الفني بالتواصل معك قريباً.', {
          inline_keyboard: [[{ text: '🏠 العودة للقائمة الرئيسية', callback_data: 'main_menu' }]]
        });
        state = {};
      }
      // Product Wizard Inputs
      else if (state.step === 'product_title' && text) {
        state.data.title = text;
        state.step = 'product_price';
        await sendMessage(chatId, '💰 يرجى كتابة <b>السعر</b> (مثال: 50,000 دينار):', cancelBtn);
      } 
      else if (state.step === 'product_price' && text) {
        state.data.price = text;
        state.step = 'product_desc';
        await sendMessage(chatId, '📝 يرجى كتابة <b>وصف المنتج</b> وتفاصيله:', cancelBtn);
      }
      else if (state.step === 'product_desc' && text) {
        state.data.description = text;
        state.step = 'product_gov';
        await sendMessage(chatId, '📍 يرجى كتابة <b>المحافظة/المنطقة</b> (مثال: بغداد - الكرادة):', cancelBtn);
      }
      else if (state.step === 'product_gov' && text) {
        state.data.governorate = text;
        state.step = 'product_category';
        await sendMessage(chatId, '📑 اختر <b>القسم</b> المناسب للمنتج:', {
          inline_keyboard: [
            [{ text: '📱 إلكترونيات', callback_data: 'prod_cat_electronics' }, { text: '👕 أزياء وملابس', callback_data: 'prod_cat_fashion' }],
            [{ text: '🏠 المنزل', callback_data: 'prod_cat_home' }, { text: '🚗 أوتو', callback_data: 'prod_cat_vehicles' }],
            [{ text: '🔄 أخرى', callback_data: 'prod_cat_other' }]
          ]
        });
      }
      else if (state.step === 'product_image' && photo) {
        await sendMessage(chatId, '⏳ جاري رفع الصورة ونشر المنتج، يرجى الانتظار...');
        const fileId = photo[photo.length - 1].file_id;
        const fileRes = await fetch(`${tgUrl}/getFile?file_id=${fileId}`);
        const fileData = await fileRes.json();
        
        let imageUrl = '';
        if (fileData.ok) {
          const filePath = fileData.result.file_path;
          const imageRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
          const imageBlob = await imageRes.blob();
          const fileName = `tg_${chatId}_${Date.now()}.jpg`;
          
          const { data: uploadData } = await supabase.storage.from('ad-images').upload(fileName, imageBlob, { contentType: 'image/jpeg' });
          if (uploadData) {
            const { data: pubUrl } = supabase.storage.from('ad-images').getPublicUrl(fileName);
            imageUrl = pubUrl.publicUrl;
          }
        }

        const cost = 1;
        const { data: userProfile } = await supabase.from('profiles').select('points, role').eq('id', userId).single();
        if (userProfile?.role !== 'admin' && userProfile?.role !== 'owner') {
          if (!userProfile || (userProfile.points || 0) < cost) {
            await sendMessage(chatId, '❌ عذراً، ليس لديك نقاط كافية لنشر الإعلان. يرجى التوجه لزر "شراء نقاط".', {
               inline_keyboard: [[{ text: '💳 شراء نقاط', callback_data: 'buy_points' }], [{ text: '🏠 العودة للقائمة', callback_data: 'main_menu' }]]
            });
            state = {};
            await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
            return new Response('OK', { status: 200 });
          }
          await supabase.from('profiles').update({ points: userProfile.points - cost }).eq('id', userId);
        }

        const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', userId).single();
        await supabase.from('products').insert({
          title: state.data.title,
          price: state.data.price,
          description: state.data.description,
          governorate: state.data.governorate,
          category: state.data.category,
          condition: state.data.condition,
          phone: phone,
          images: imageUrl ? [imageUrl] : [],
          seller_id: userId,
          seller_name: profile?.full_name || 'بائع',
          seller_avatar: profile?.avatar_url || '',
          status: 'active'
        });

        await sendMessage(chatId, '✅ <b>تم نشر إعلان المنتج في سوق بغداد بنجاح!</b> 🚀', {
          inline_keyboard: [[{ text: '🏠 العودة للقائمة الرئيسية', callback_data: 'main_menu' }]]
        });
        state = {};
      }
      else if (Object.keys(state).length > 0) {
        if (state.step === 'car_images' || state.step === 'product_image') {
          await sendMessage(chatId, '⚠️ الرجاء <b>إرسال صورة</b>، أو اضغط «تم ✅» للمتابعة.');
        } else {
          await sendMessage(chatId, '⚠️ إدخال غير متوقع، لإلغاء العملية الحالية أرسل /cancel');
        }
      }
      else {
        if (text || voice || photo) {
          let audioUrl = null;
          let photoUrl = null;

          if (voice) {
            await sendMessage(chatId, '⏳ جاري الاستماع والتحليل...');
            const fileRes = await fetch(`${tgUrl}/getFile?file_id=${voice.file_id}`);
            const fileData = await fileRes.json();
            if (fileData.ok) {
              const filePath = fileData.result.file_path;
              audioUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
            }
          } else if (photo && photo.length > 0) {
            await sendMessage(chatId, '🔍 جاري فحص وتحليل الصورة والسكرين شوت...');
            const fileId = photo[photo.length - 1].file_id;
            const fileRes = await fetch(`${tgUrl}/getFile?file_id=${fileId}`);
            const fileData = await fileRes.json();
            if (fileData.ok) {
              const filePath = fileData.result.file_path;
              photoUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
            }
          }
          
          const userCaption = caption || text || null;
          const aiRes = await callGemini(userCaption, audioUrl, photoUrl);
          await showMainMenu(aiRes || undefined);
        } else {
          await showMainMenu();
        }
      }

      // Update state in db
      if (userId) {
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
      }
    }

    return new Response('OK', { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error('Error handling request:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
