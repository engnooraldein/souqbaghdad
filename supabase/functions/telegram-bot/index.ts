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

async function editChannelMessage(chatId: string | number, messageId: number, captionOrText: string, replyMarkup?: any) {
  try {
    let res = await editMessageCaption(chatId, messageId, captionOrText, replyMarkup);
    if (!res?.ok) {
      console.warn(`editMessageCaption failed on ${chatId} (msg: ${messageId}):`, res?.description, '- trying editMessageText...');
      res = await editMessageText(chatId, messageId, captionOrText, replyMarkup);
    }
    return res;
  } catch (err) {
    console.error(`editChannelMessage exception on ${chatId}:`, err);
    try {
      return await editMessageText(chatId, messageId, captionOrText, replyMarkup);
    } catch(e) {
      return { ok: false, description: String(e) };
    }
  }
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
const CAR_CHANNEL_ID = Deno.env.get('CAR_CHANNEL_ID') || '@souqbaghdad_car';          // Cars channel username/ID
const LINES_CHANNEL = '@souqbaghdad_lines';       // Transport lines username
const LINES_CHANNEL_ID = Deno.env.get('LINES_CHANNEL_ID') || '@souqbaghdad_lines';        // Transport lines username/ID

// Facebook, Instagram & Threads Publishing
const META_PAGE_ACCESS_TOKEN = Deno.env.get('META_PAGE_ACCESS_TOKEN') || 'EAAPXexo3QZCcBSS81SrUC8TbvBMUiMFUO2ZA1ZCqOIddaNXTywui05INE9gaY4tpFbVDKZCcz6kr9h9znXcHCPanKtLgRusGyjhUdtTR7aClqiUh9KaNWLBvXSZBiyHYUbCbZA2rEPLZBswlQanav0NZACnZAmz1M3K2uaaZAa6TZBEtXG0t5pLHu2JxpWXGoZC4vGMK8b2BJt0iOZBA6pVXtufmB3ZAaKnlzpoTuyHZBQzSVR1viqm2eIcw9lH2htZAOmoZD';
const META_PAGE_ID = Deno.env.get('META_PAGE_ID') || '';
const META_IG_ACCOUNT_ID = Deno.env.get('META_IG_ACCOUNT_ID') || '';
const THREADS_USER_ID = Deno.env.get('THREADS_USER_ID') || '28119436894335542';
const THREADS_ACCESS_TOKEN = Deno.env.get('THREADS_ACCESS_TOKEN') || '';

const ALRAFDAIN_FB_TOKEN = Deno.env.get('ALRAFDAIN_FB_TOKEN') || 'EAAPXexo3QZCcBSQggpoeE43V2EBxtB71WBkk3ZAOTD2ij0qZB6JIZAgLqEuhJpkffLPvPAKHQay3mHNi55NwKvBPmPXdnwZBEQZC8DUheyaUdv1wWvCkgWANFE1Y2ZCuiwQLqeZAgpM52JdJnKzjl0Ip7Sf0DO7c4ZByyyGZAk1l4wYceKZAYJlwUnSZAoZBu8qqP5U5E7y8a2fNABzcJQnHtMY3ZBCBovby4ARruZBfPrf5e8PesuFj1gBaZCMWqgZDZD';
const ALRAFDAIN_FB_PAGE_ID = Deno.env.get('ALRAFDAIN_FB_PAGE_ID') || '102975411515668';
const ALRAFDAIN_IG_ID = Deno.env.get('ALRAFDAIN_IG_ID') || '17841404181680155';
const ALRAFDAIN_TELEGRAM_CHANNEL = '@ruc_1';

// Dynamic Database Social Settings Cache (Hot Reload from Owner Dashboard)
let dynamicSocialCache: Record<string, any> = {};
let lastSocialCacheTime = 0;

async function getLiveSocialSetting(id: string): Promise<any> {
  const now = Date.now();
  if (now - lastSocialCacheTime < 20000 && dynamicSocialCache[id]) {
    return dynamicSocialCache[id];
  }
  try {
    const { data } = await supabase.from('social_settings').select('*');
    if (data && data.length > 0) {
      dynamicSocialCache = {};
      for (const row of data) {
        dynamicSocialCache[row.id] = row;
      }
      lastSocialCacheTime = now;
      return dynamicSocialCache[id];
    }
  } catch (e) {
    console.error('Failed to load live social setting from DB:', e);
  }
  return dynamicSocialCache[id] || null;
}

async function postToThreads(text: string, photoUrl: string | string[] | null) {
  if (!THREADS_ACCESS_TOKEN) return { error: { message: 'رمز الوصول لـ Threads مفقود أو غير صالح' } };
  const userId = THREADS_USER_ID || 'me';
  try {
    const urls = Array.isArray(photoUrl) ? photoUrl : (photoUrl ? [photoUrl] : []);
    const rawUrl = urls.length > 0 ? urls[0] : null;
    const singleUrl = rawUrl 
      ? ((rawUrl.includes('generate-story-image') || rawUrl.includes('supabase.co')) ? rawUrl : `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=1080&h=1080&fit=cover`)
      : null;

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

function extractImages(record: any): string[] {
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
      if (record.images.startsWith('http')) list = [record.images];
    }
  } else if (typeof record.image === 'string' && record.image.startsWith('http')) {
    list = [record.image];
  } else if (Array.isArray(record.photos)) {
    list = record.photos;
  }
  return list.filter(u => typeof u === 'string' && u.startsWith('http') && !u.startsWith('data:'));
}

async function postToFacebook(text: string, photoUrl: string | string[] | null, customToken?: string, customPageId?: string) {
  const dbSetting = (!customToken && !customPageId) ? await getLiveSocialSetting('fb_souq') : null;
  const token = customToken || dbSetting?.access_token || META_PAGE_ACCESS_TOKEN;
  const pageId = customPageId || dbSetting?.page_id || META_PAGE_ID;
  if (!token || !pageId) return { error: { message: 'رمز الوصول لفيسبوك مفقود أو غير صالح' } };
  try {
    const urls = Array.isArray(photoUrl) ? photoUrl : (photoUrl ? [photoUrl] : []);
    const cleanUrls = urls.filter(u => typeof u === 'string' && u.startsWith('http'));

    // 1. Multiple photos -> Upload each photo unpublished, then publish album feed post with attached_media
    if (cleanUrls.length > 1) {
      console.log(`[FB MULTI-PHOTO] Uploading ${cleanUrls.length} photos to Facebook Page ${pageId}...`);
      const attachedMedia: any[] = [];
      for (const imgUrl of cleanUrls.slice(0, 10)) {
        try {
          const uploadRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: imgUrl, published: false, access_token: token })
          });
          const uploadData = await uploadRes.json();
          if (uploadData && uploadData.id) {
            attachedMedia.push({ media_fbid: uploadData.id });
          } else {
            console.warn('FB Photo single item upload failed:', uploadData);
          }
        } catch (e) {
          console.error('FB Multi-photo item upload exception:', e);
        }
      }
      
      if (attachedMedia.length > 0) {
        console.log(`[FB MULTI-PHOTO] Publishing multi-photo feed post with ${attachedMedia.length} attached media...`);
        const res = await fetch(`https://graph.facebook.com/v20.0/${pageId}/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, attached_media: attachedMedia, access_token: token })
        });
        const data = await res.json();
        console.log('[FB MULTI-PHOTO] Response:', data);
        if (data.id || data.post_id) return data;
        console.warn('FB Feed attached_media post failed, trying single photo fallback...');
      }
    }

    // 2. Single photo post
    const singleUrl = cleanUrls.length > 0 ? cleanUrls[0] : null;
    if (singleUrl) {
      // Strip HTML tags because Facebook /photos API rejects HTML tags in captions
      const cleanFbCaption = (text || '')
        .replace(/<a\s+href="([^"]+)">([^<]+)<\/a>/gi, '$2 ($1)')
        .replace(/<[^>]*>?/gm, '')
        .trim();

      console.log(`[FB PHOTO] Posting single photo to Facebook Page ${pageId}...`);
      
      // Method A: URLSearchParams format (Official Facebook Graph API standard for /photos)
      try {
        const params = new URLSearchParams();
        params.append('url', singleUrl);
        params.append('caption', cleanFbCaption);
        params.append('access_token', token);

        const photoRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });
        const photoData = await photoRes.json();
        console.log('[FB PHOTO URLSearchParams] Response:', photoData);
        if (photoData.id || photoData.post_id) return photoData;
      } catch (err) {
        console.warn('FB Single photo URLSearchParams exception:', err);
      }

      // Method B: Direct FormData binary upload fallback
      try {
        console.log(`[FB PHOTO MULTIPART] Fetching image binary from ${singleUrl.substring(0, 80)}...`);
        const imgFetch = await fetch(singleUrl);
        if (imgFetch.ok) {
          const imgBlob = await imgFetch.blob();
          const form = new FormData();
          form.append('caption', cleanFbCaption);
          form.append('source', imgBlob, 'post.png');
          form.append('access_token', token);

          const multipartRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/photos`, {
            method: 'POST',
            body: form
          });
          const multipartData = await multipartRes.json();
          console.log('[FB PHOTO MULTIPART] Response:', multipartData);
          if (multipartData.id || multipartData.post_id) return multipartData;
        }
      } catch (e) {
        console.error('FB Photo binary upload failed:', e);
      }

      console.warn('FB Single photo post failed, trying feed text fallback...');
    }

    // 3. Fallback text only post
    console.log(`[FB TEXT] Posting text-only feed to Facebook Page ${pageId}...`);
    const feedRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, access_token: token })
    });
    return await feedRes.json();
  } catch (err: any) {
    console.error('FB Fetch Error:', err);
    return { error: { message: err.message || 'خطأ في الاتصال بفيسبوك' } };
  }
}

async function deleteFromFacebook(postId: string, customToken?: string) {
  const token = customToken || META_PAGE_ACCESS_TOKEN;
  if (!token || !postId) return false;
  try {
    let res = await fetch(`https://graph.facebook.com/v20.0/${postId}?access_token=${token}`, {
      method: 'DELETE'
    });
    if (!res.ok && ALRAFDAIN_FB_TOKEN && ALRAFDAIN_FB_TOKEN !== token) {
      res = await fetch(`https://graph.facebook.com/v20.0/${postId}?access_token=${ALRAFDAIN_FB_TOKEN}`, {
        method: 'DELETE'
      });
    }
    return res.ok;
  } catch (err) {
    console.error('FB Delete Error:', err);
    return false;
  }
}

async function findFacebookPostByQuery(query: string, customToken?: string, customPageId?: string): Promise<string | null> {
  const token = customToken || META_PAGE_ACCESS_TOKEN;
  const pageId = customPageId || META_PAGE_ID;
  if (!token || !pageId || !query) return null;
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${pageId}/published_posts?fields=id,message&limit=50&access_token=${token}`);
    if (!res.ok) return null;
    const data = await res.json();
    const cleanQuery = query.replace('#', '').trim().toLowerCase();
    for (const post of data?.data || []) {
      const msg = (post.message || '').toLowerCase();
      if (cleanQuery.length >= 3 && msg.includes(cleanQuery)) {
        console.log(`[FB SMART MATCH] Found matching Facebook post ${post.id} for query "${query}"`);
        return post.id;
      }
    }
  } catch(e) {
    console.error('findFacebookPostByQuery error:', e);
  }
  return null;
}

async function updateFacebookPost(postId: string, newText: string, customToken?: string) {
  const token = customToken || META_PAGE_ACCESS_TOKEN;
  if (!token || !postId) return false;
  try {
    let res = await fetch(`https://graph.facebook.com/v20.0/${postId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newText, access_token: token })
    });
    let data = await res.json();
    if (!data.success && !data.id && ALRAFDAIN_FB_TOKEN && ALRAFDAIN_FB_TOKEN !== token) {
      res = await fetch(`https://graph.facebook.com/v20.0/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newText, access_token: ALRAFDAIN_FB_TOKEN })
      });
      data = await res.json();
    }
    return data;
  } catch (err) {
    console.error('FB Update Post Error:', err);
    return false;
  }
}

async function deleteFromThreads(threadsMediaId: string) {
  if (!THREADS_ACCESS_TOKEN || !threadsMediaId) return false;
  try {
    const res = await fetch(`https://graph.threads.net/v1.0/${threadsMediaId}?access_token=${encodeURIComponent(THREADS_ACCESS_TOKEN)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch(err) {
    console.error('Threads Delete Error:', err);
    return false;
  }
}

async function postToFacebookStory(photoUrl: string, pageId: string, accessToken: string) {
  if (!accessToken || !pageId || !photoUrl) return { error: { message: 'رمز الوصول لفيسبوك أو الصورة مفقودة' } };
  try {
    console.log(`[FB STORY] Publishing Story 9:16 to Facebook Page ${pageId}...`);
    // Step 1: Upload photo as unpublished/temporary to get photo ID
    const uploadRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: photoUrl,
        published: false,
        temporary: true,
        access_token: accessToken
      })
    });
    const uploadData = await uploadRes.json();
    if (uploadData && uploadData.id) {
      // Step 2: Publish photo story
      const storyRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/photo_stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_id: uploadData.id,
          access_token: accessToken
        })
      });
      const storyData = await storyRes.json();
      console.log(`[FB STORY] Result for page ${pageId}:`, JSON.stringify(storyData));
      return storyData;
    }
    return uploadData;
  } catch (err: any) {
    console.error('FB Story Error:', err);
    return { error: { message: err.message || 'خطأ في نشر ستوري فيسبوك' } };
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
    const urls = originalUrls.map(url => (url.includes('generate-story-image') || url.includes('supabase.co')) ? url : `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=1080&h=1080&fit=cover`);
    
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

const generateSocialCaption = async (record: any, type: 'car' | 'product' | 'transport' | 'ad', link: string, isHtml = false): Promise<string> => {
  let price = formatTgPrice(record.price, record.currency || 'د.ع');

  // --- 1. TRANSPORT LINES (خطوط النقل) ---
  if (type === 'transport') {
    let descObj: any = {};
    if (typeof record.description === 'string') {
      try { descObj = JSON.parse(record.description); } catch { descObj = { note: record.description }; }
    } else if (typeof record.description === 'object' && record.description !== null) {
      descObj = record.description;
    }

    const destination = record.university || record.destination || record.city || 'الجامعة / مكان العمل';
    const regions = record.regions || record.location || record.city || 'بغداد';
    const audience = descObj?.targetAudience || record.targetAudience || 'طالبات / طلاب / موظفين';
    const shift = descObj?.shift || record.shift || 'صباحي';
    const days = descObj?.days || record.days || 'طيلة أيام الدوام';
    const shortId = record.short_id || record.id || '';

    const b = (txt: string) => isHtml ? `<b>${txt}</b>` : txt;

    return `🚌 ${b('توفير نقل خط جديد — سوق بغداد')}\n\n` +
           `🏢 ${b('الوجهة:')} ${destination}\n` +
           `📍 ${b('مناطق الانطلاق:')} ${regions}\n` +
           `👥 ${b('نوع الخط:')} ${audience}\n` +
           `⏰ ${b('أوقات الدوام:')} ${shift}\n` +
           `📅 ${b('أيام الدوام:')} ${days}\n` +
           `💰 ${b('الأجرة:')} ${price}\n` +
           (shortId ? `🆔 ${b('كود الإعلان:')} #${shortId}\n\n` : `\n`) +
           `🔗 ${b('لمشاهدة تفاصيل الخط ورقم التواصل:')}\n${link}\n\n` +
           `💬 اكتب "تم" أو راسلنا بالتعليقات وتوصلك كافة تفاصيل الخط على الخاص 📩\n\n` +
           `#سوق_بغداد #خطوط_نقل #خط_جامعة #خطوط_بغداد #جامعة_الرافدين #باصات_بغداد #العراق`;
  }

  // --- 2. CARS (سيارات) ---
  if (type === 'car') {
    let p: any = {};
    if (typeof record.description === 'string') {
      try { p = JSON.parse(record.description); } catch { p = { note: record.description }; }
    } else if (typeof record.description === 'object' && record.description !== null) {
      p = record.description;
    }
    const carTitle = `${p.brand || ''} ${p.model || ''} ${p.year || ''}`.trim() || record.title || 'سيارة للبيع';
    const gov = record.location || record.city || record.governorate || 'بغداد';
    const shortId = record.short_id || record.id || '';

    let noteText = '';
    if (typeof p === 'object' && p !== null) {
      noteText = p.note || p.description || p.details || '';
    } else if (typeof record.description === 'string' && !record.description.trim().startsWith('{')) {
      noteText = record.description;
    }
    if (typeof noteText === 'string') {
      noteText = noteText.replace(/<[^>]*>?/gm, '').trim();
      if (noteText.startsWith('{') && noteText.endsWith('}')) noteText = '';
      if (noteText.length > 500) noteText = noteText.substring(0, 500) + '...';
    } else {
      noteText = '';
    }

    const rawPhone = record.phone || p.phone || '';
    let cleanPhone = String(rawPhone).replace(/[^0-9+]/g, '');
    if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
    else cleanPhone = cleanPhone.replace('+', '');

    const b = (txt: string) => isHtml ? `<b>${txt}</b>` : txt;

    let contactInfo = '';
    if (rawPhone) {
      if (isHtml) {
        contactInfo = `📞 <a href="https://wa.me/${cleanPhone}">تواصل مباشر واتساب (${rawPhone})</a>`;
      } else {
        contactInfo = `📞 التواصل المباشر (هاتف / واتساب): ${rawPhone}\n💬 رابط الواتساب المباشر: https://wa.me/${cleanPhone}`;
      }
    } else {
      contactInfo = `📞 التواصل المباشر: عبر الموقع أو الرسائل الخاصة`;
    }

    return `🚗 ${b(carTitle)}\n\n` +
           `📅 ${b('سنة الصنع:')} ${p.year || 'غير محدد'}\n` +
           `🛣️ ${b('المسافة المقطوعة:')} ${p.mileage ? parseInt(p.mileage).toLocaleString('en-US') + ' كم' : 'غير محدد'}\n` +
           `📋 ${b('المواصفات:')} ${p.origin || 'وارد عام'}\n` +
           `💰 ${b('السعر:')} ${price}\n` +
           `📍 ${b('الموقع:')} ${gov}\n\n` +
           (noteText ? `📝 ${b('تفاصيل إضافية:')}\n${noteText}\n\n` : '') +
           `🆔 ${b('كود الإعلان:')} #${shortId}\n` +
           `🔗 ${b('رابط المعاينة والتفاصيل:')}\n${link}\n\n` +
           `${contactInfo}\n\n` +
           `#سوق_بغداد #سيارات_العراق #سيارات_للبيع #بغداد_سيارات #العراق`;
  }

  // --- 3. PRODUCTS & GENERAL ADS (المنتجات والإعلانات العامة) ---
  const title = record.title || 'إعلان معروض في سوق بغداد';
  const location = record.governorate || record.location || record.city || 'بغداد';
  const shortId = record.short_id || (record.id && String(record.id).length < 12 ? record.id : '');
  const condition = record.condition === 'new' ? '✨ جديد' : (record.condition === 'used' ? '👌 مستعمل' : '');

  let descText = '';
  if (typeof record.description === 'string') {
    if (record.description.trim().startsWith('{')) {
      try {
        const p = JSON.parse(record.description);
        descText = p.note || p.description || p.details || '';
      } catch { descText = ''; }
    } else {
      descText = record.description;
    }
  } else if (typeof record.description === 'object' && record.description !== null) {
    descText = record.description.note || record.description.description || record.description.details || '';
  }
  if (typeof descText === 'string') {
    descText = descText.replace(/<[^>]*>?/gm, '').trim();
    if (descText.startsWith('{') && descText.endsWith('}')) descText = '';
    if (descText.length > 500) descText = descText.substring(0, 500) + '...';
  } else {
    descText = '';
  }

  const rawPhone = record.phone || '';
  let cleanPhone = String(rawPhone).replace(/[^0-9+]/g, '');
  if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
  else cleanPhone = cleanPhone.replace('+', '');

  const b = (txt: string) => isHtml ? `<b>${txt}</b>` : txt;

  let contactInfo = '';
  if (rawPhone) {
    if (isHtml) {
      contactInfo = `📞 <a href="https://wa.me/${cleanPhone}">تواصل مباشر واتساب (${rawPhone})</a>`;
    } else {
      contactInfo = `📞 التواصل المباشر (هاتف / واتساب): ${rawPhone}\n💬 رابط الواتساب المباشر: https://wa.me/${cleanPhone}`;
    }
  } else {
    contactInfo = `📞 التواصل المباشر: عبر الموقع أو الرسائل الخاصة`;
  }

  const emoji = type === 'product' ? '🛍️' : '📢';

  return `${emoji} ${b(title)}\n\n` +
         (condition ? `🏷️ ${b('الحالة:')} ${condition}\n` : '') +
         `💰 ${b('السعر:')} ${price}\n` +
         `📍 ${b('الموقع:')} ${location}\n\n` +
         (descText ? `📝 ${b('التفاصيل الكاملة:')}\n${descText}\n\n` : '') +
         `🆔 ${b('كود الإعلان:')} #${shortId}\n` +
         `🔗 ${b('رابط المعاينة والتفاصيل:')}\n${link}\n\n` +
         `${contactInfo}\n\n` +
         `#سوق_بغداد #تسوق_العراق #العراق #بغداد`;
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
  const phoneId = Deno.env.get('WHATSAPP_PHONE_ID') || Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  if (!token || !phoneId || !phone) return;

  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
  if (cleanPhone.startsWith('7') && cleanPhone.length === 10) cleanPhone = '964' + cleanPhone;

  const msg = 
`🎉 أهلاً بك في منصة سوق بغداد الرقمي!

تم بنجاح نشر إعلانك:
📌 *"${title}"*

🚀 *تم النشر تلقائياً على منصات التواصل التابعة لسوق بغداد:*
🌐 *الموقع الرسمي:* ${link}
✈️ *تيليكرام:* https://t.me/souqbaghdad_iq
🚗 *قناة السيارات:* https://t.me/souqbaghdad_car
🚌 *قناة خطوط النقل:* https://t.me/souqbaghdad_lines
📘 *فيسبوك:* https://facebook.com/souqbaghdad.iq

━━━━━━━━━━━━━━━
⏳ *ملاحظة هامة حول النشر القادم:*
• يمكنك نشر إعلان جديد إضافي بعد مرور *15 دقيقة*.
• أو يمكنك *تعديل إعلانك الحالي* في أي وقت مجاناً من ملفك الشخصي.
• في حال رغبت بالنشر الفوري وتجاوز مهلة الـ 15 دقيقة، يتوفر خيار النشر السريع بخصم ضعف النقاط (2x).

شكراً لثقتكم بسوق بغداد! 🌟`;

  try {
    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: { body: msg }
      })
    });
    const data = await res.json();
    console.log('WhatsApp API Response for', cleanPhone, ':', JSON.stringify(data));
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
      
      // Try Gemini 2.0 Flash first, then fallback to 1.5 Flash
      const geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
      for (const model of geminiModels) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
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
            console.error(`Gemini (${model}) API returned error:`, await res.text());
          }
        } catch(modelErr) {
          console.error(`Gemini (${model}) Fetch Error:`, modelErr);
        }
      }
    } catch(err) {
      console.error('Gemini General Error:', err);
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
    // Direct WhatsApp Test Endpoint
    if (payload.action === 'test_whatsapp' && payload.phone) {
      const token = Deno.env.get('WHATSAPP_TOKEN');
      const phoneId = Deno.env.get('WHATSAPP_PHONE_ID') || Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
      
      let cleanPhone = payload.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
      if (cleanPhone.startsWith('7') && cleanPhone.length === 10) cleanPhone = '964' + cleanPhone;

      const testMsg = `🎉 *تجربة إشعار وتساب سوق بغداد!* \n\nأهلاً بك يا غالي! هذا إشعار تجريبي مباشر من منصة سوق بغداد الرقمي للتأكد من وصول الإشعارات إلى رقمك: *${cleanPhone}*.\n\n🌐 الموقع: https://www.souqbaghdad.store\n✈️ القناة: @souqbaghdad_iq\n\nنظام الإشعارات شغال بنجاح 100%! 🚀`;

      try {
        const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
        const fbRes = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: { body: testMsg }
          })
        });
        const fbData = await fbRes.json();
        return new Response(JSON.stringify({ success: true, meta_response: fbData, phone: cleanPhone }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }
    }

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
        if ((!oldRecord || oldRecord.status === 'active' || oldRecord.status === 'published') && (record.status === 'matched' || record.status === 'sold' || record.status === 'inactive')) {
          shouldUpdateStatus = true;
        }
        if (oldRecord && (oldRecord.status === 'matched' || oldRecord.status === 'sold' || oldRecord.status === 'inactive') && (record.status === 'active' || record.status === 'published')) {
          shouldPublish = true;
        }
      }

      // Handle Sold / Matched status update on Telegram Channel & Facebook Pages across ALL categories
      if (shouldUpdateStatus) {
        const targetDbTable = (payload.table === 'products') ? 'products' : 'ads';
        let actualAd = record;
        if (record?.id) {
          try {
            const { data: dbAd } = await supabase.from(targetDbTable).select('*').eq('id', record.id).maybeSingle();
            if (dbAd) {
              actualAd = { ...dbAd, ...record };
            }
          } catch(e) {
            console.error('Failed to fetch actual ad from DB in UPDATE webhook:', e);
          }
        }

        const isTransport = actualAd.category === 'transport';
        const isCar = actualAd.category === 'vehicles' || actualAd.category === 'cars' || actualAd.category === 'car' || (actualAd.category || '').toLowerCase().includes('car');
        const isProduct = payload.table === 'products' || (!isTransport && !isCar);

        const msgId = actualAd.telegram_message_id || record?.telegram_message_id || oldRecord?.telegram_message_id;
        const rucMsgId = actualAd.sync_status?.ruc_telegram_message_id || record?.sync_status?.ruc_telegram_message_id || oldRecord?.sync_status?.ruc_telegram_message_id;

        // Custom branding and links per category
        const browseUrl = isCar 
          ? 'https://www.souqbaghdad.store/vehicles' 
          : (isTransport ? 'https://www.souqbaghdad.store/transport' : 'https://www.souqbaghdad.store/products');
          
        const soldTag = isTransport 
          ? '✅ <b>[اكتمل العدد / الخط مغلق]</b>' 
          : (isCar ? '⚠️ <b>[تم البيع / مباعة]</b>' : '⚠️ <b>[تم البيع / غير متوفر]</b>');

        const buttonText = isTransport 
          ? '🚌 تصفح خطوط أخرى متاحة 🌐' 
          : (isCar ? '🚗 تم بيع هذه السيارة — تصفح المزيد 🔍' : '🛍️ تم البيع — تصفح أحدث العروض 🌐');

        const postNewText = isTransport
          ? '🚌 اعرض خطك مجاناً عبر البوت'
          : (isCar ? '🚗 اعرض سيارتك للبيع مجاناً عبر البوت' : '📦 اعرض سلعتك مجاناً عبر البوت');

        const soldButtons = {
          inline_keyboard: [
            [{ text: buttonText, url: browseUrl }],
            [{ text: postNewText, url: `https://t.me/${BOT_USERNAME}` }]
          ]
        };

        const iconType = isTransport ? '🚌' : (isCar ? '🚗' : '🛍️');
        const soldCaption = `${soldTag}\n\n` +
                            `${iconType} <b>${actualAd.title || 'إعلان'}</b>\n` +
                            `💰 <b>تمت العملية بنجاح عبر منصة سوق بغداد</b>\n` +
                            `📍 ${actualAd.location || actualAd.city || 'العراق'}\n\n` +
                            `📣 لم يعد هذا الإعلان متاحاً للتواصل. يمكنك تصفح العروض المشابهة عبر الزر أدناه 👇`;

        // 1. Update main Telegram channel
        if (msgId) {
          const channelsToTry = isTransport 
            ? Array.from(new Set([LINES_CHANNEL_ID, LINES_CHANNEL, '@souqbaghdad_lines', '@souqbaghdad_line'].filter(Boolean)))
            : (isCar ? Array.from(new Set([CAR_CHANNEL_ID, CAR_CHANNEL, '@souqbaghdad_car'].filter(Boolean))) : Array.from(new Set([PRODUCT_CHANNEL, '@souqbaghdad_iq', EXTRA_CHANNEL].filter(Boolean))));

          for (const ch of channelsToTry) {
            try {
              console.log(`[UPDATE WEBHOOK] Updating channel ${ch} with msgId ${msgId}`);
              const res = await editChannelMessage(ch, parseInt(msgId, 10), soldCaption, soldButtons);
              console.log(`[UPDATE WEBHOOK] Channel ${ch} update response:`, JSON.stringify(res));
              if (res?.ok) {
                console.log(`[UPDATE WEBHOOK] Successfully updated channel ${ch}`);
                break;
              }
            } catch(e) {
              console.error(`Failed to update caption in channel ${ch}:`, e);
            }
          }
        }

        // 2. If it's transport for Al-Rafdain, ALSO update @ruc_1
        if (isTransport) {
          const descStr = typeof actualAd.description === 'string' ? actualAd.description : JSON.stringify(actualAd.description || {});
          const isAlRafdain = ['الرافدين', 'الرفدين', 'ruc'].some(term => 
            (actualAd.city && actualAd.city.toLowerCase().includes(term)) ||
            (actualAd.location && actualAd.location.toLowerCase().includes(term)) ||
            (actualAd.title && actualAd.title.toLowerCase().includes(term)) ||
            (actualAd.university && actualAd.university.toLowerCase().includes(term)) ||
            (actualAd.destination && actualAd.destination.toLowerCase().includes(term)) ||
            (actualAd.regions && actualAd.regions.toLowerCase().includes(term)) ||
            descStr.toLowerCase().includes(term)
          );

          if ((isAlRafdain || rucMsgId) && ALRAFDAIN_TELEGRAM_CHANNEL && rucMsgId) {
            try {
              console.log(`[RUC WEBHOOK UPDATE] Updating post in ${ALRAFDAIN_TELEGRAM_CHANNEL} with msgId ${rucMsgId}`);
              await editChannelMessage(ALRAFDAIN_TELEGRAM_CHANNEL, parseInt(rucMsgId, 10), soldCaption, soldButtons);
            } catch (err) {
              console.error('Al-Rafdain webhook caption update error:', err);
            }
          }
        }

        // 3. Update Facebook post text (with smart lookup for unindexed/past posts)
        let fbPostId = actualAd.facebook_post_id || record?.facebook_post_id || oldRecord?.facebook_post_id;
        const rafdainFbPostId = actualAd.sync_status?.rafdain_facebook_post_id || record?.sync_status?.rafdain_facebook_post_id || oldRecord?.sync_status?.rafdain_facebook_post_id;

        const fbSoldText = isTransport 
          ? `✅ [اكتمل العدد / الخط مغلق]\n\n🚌 ${actualAd.title || 'إعلان خط'}\n💰 تمت العملية بنجاح عبر منصة سوق بغداد\n\nلم يعد هذا الخط متاحاً للتسجيل. تصفح الخطوط المتاحة عبر:\nhttps://www.souqbaghdad.store/transport`
          : (isCar
            ? `⚠️ [تم البيع / مباعة]\n\n🚗 ${actualAd.title || 'سيارة للبيع'}\n💰 تم البيع بنجاح عبر منصة سوق بغداد\n\nتصفح المزيد من السيارات المتاحة عبر:\nhttps://www.souqbaghdad.store/vehicles`
            : `⚠️ [تم البيع / غير متوفر]\n\n🛍️ ${actualAd.title || 'منتج'}\n💰 تم البيع بنجاح عبر منصة سوق بغداد\n\nتصفح المزيد من العروض عبر:\nhttps://www.souqbaghdad.store/products`);

        if (!fbPostId && (actualAd.short_id || actualAd.title || actualAd.phone)) {
          const searchKey = actualAd.short_id || actualAd.phone || actualAd.title;
          console.log(`[FB SMART LOOKUP] Searching Facebook feed for past post with key: "${searchKey}"...`);
          const foundId = await findFacebookPostByQuery(searchKey);
          if (foundId) {
            fbPostId = foundId;
            try {
              await supabase.from(targetDbTable).update({ facebook_post_id: foundId }).eq('id', actualAd.id);
            } catch(e) {}
          }
        }

        if (fbPostId) {
          console.log(`[UPDATE WEBHOOK] Updating main FB post ${fbPostId}...`);
          await updateFacebookPost(fbPostId, fbSoldText);
        }

        if (rafdainFbPostId) {
          console.log(`[UPDATE WEBHOOK] Updating Al-Rafdain FB post ${rafdainFbPostId}...`);
          await updateFacebookPost(rafdainFbPostId, fbSoldText, ALRAFDAIN_FB_TOKEN);
        }
      }
      
      if (shouldDelete) {
        const msgId = record?.telegram_message_id || oldRecord?.telegram_message_id;
        const rucMsgId = record?.sync_status?.ruc_telegram_message_id || oldRecord?.sync_status?.ruc_telegram_message_id;
        
        if (msgId) {
          const isTransport = record?.category === 'transport' || oldRecord?.category === 'transport';
          const isCar = record?.category === 'vehicles' || record?.category === 'cars' || oldRecord?.category === 'vehicles' || oldRecord?.category === 'cars';
          const channel = isTransport ? (LINES_CHANNEL_ID || TRANSPORT_CHANNEL) : (isCar ? (CAR_CHANNEL_ID || CAR_CHANNEL) : PRODUCT_CHANNEL);
          if (channel) {
            await deleteMessage(channel, parseInt(msgId, 10));
          }
          if (EXTRA_CHANNEL) {
            await deleteMessage(EXTRA_CHANNEL, parseInt(msgId, 10));
          }
        }
        if (rucMsgId && ALRAFDAIN_TELEGRAM_CHANNEL) {
          await deleteMessage(ALRAFDAIN_TELEGRAM_CHANNEL, parseInt(rucMsgId, 10));
        }
        
        // Delete from Social Media
        const fbPostId = record?.facebook_post_id || oldRecord?.facebook_post_id;
        if (fbPostId) await deleteFromFacebook(fbPostId);
        
        const igPostId = record?.instagram_post_id || oldRecord?.instagram_post_id;
        if (igPostId) await deleteFromInstagram(igPostId);

        const thPostId = record?.threads_post_id || oldRecord?.threads_post_id;
        if (thPostId) await deleteFromThreads(thPostId);
      }

      const isManualExplicitPublish = Boolean(payload.targets);
      let publishTelegram = payload.targets ? Boolean(payload.targets.telegram) : true;
      let publishFacebook = payload.targets ? Boolean(payload.targets.facebook) : true;
      let publishInstagram = payload.targets ? Boolean(payload.targets.instagram) : true;
      let publishTiktok = payload.targets ? Boolean(payload.targets.tiktok) : true;
      let publishThreads = payload.targets ? Boolean(payload.targets.threads) : true;
      
      let forceFacebookPage = payload.targets ? (payload.targets.forceFacebookPage || payload.targets.facebookPage) : null;
      let forceInstagramPage = payload.targets ? (payload.targets.forceInstagramPage || payload.targets.instagramPage) : null;

      // Respect skip flags ONLY for automated background webhooks, NEVER for explicit manual modal publish
      if (!isManualExplicitPublish && record?.sync_status) {
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

          const brand = carSpecs.brand || '';
          const model = carSpecs.model || '';
          const year = carSpecs.year || '';
          const carTitle = `${brand} ${model} ${year}`.trim() || record.title || 'سيارة للبيع';

          // Call our unified HTML caption formatting
          const caption = await generateSocialCaption(record, 'car', link, true);

          const imagesToPost = await ensurePublicImages(record, 'ads', supabase);
          if (imagesToPost.length === 0) {
            imagesToPost.push(getFallbackImage(record, 'car'));
          }
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

          let res;
          if (publishTelegram) {
            const targetCarChannel = CAR_CHANNEL_ID || CAR_CHANNEL;
            if (imagesToPost.length >= 1) {
              res = await sendPhoto(targetCarChannel, imagesToPost[0], caption, replyMarkup);
            } else {
              res = await sendMessage(targetCarChannel, caption, replyMarkup);
            }
          }

          const updates: any = {};
          let syncStatus = record.sync_status || { facebook: 'pending', instagram: 'pending', telegram: 'pending' };

          if (publishTelegram && res?.ok && res.result?.message_id) {
             updates.telegram_message_id = res.result.message_id.toString();
             syncStatus.telegram = 'success';
          }
          
          // Social Media Sync for Cars (All images, no fallback to transit lines template)
          const fbIgPhotoUrl = imagesToPost.length > 0 ? imagesToPost : null;
          const fbIgCaption = (publishFacebook || publishInstagram || publishThreads || publishTiktok)
            ? await generateSocialCaption(record, 'car', link, false)
            : '';

          if (publishFacebook) {
            const fbData = await postToFacebook(fbIgCaption, fbIgPhotoUrl);
            if (fbData && (fbData.post_id || fbData.id)) {
              updates.facebook_post_id = fbData.post_id || fbData.id;
              syncStatus.facebook = 'success';
            }
          }

          if (publishInstagram && fbIgPhotoUrl) {
            const igData = await postToInstagram(fbIgCaption, fbIgPhotoUrl);
            if (igData && (igData.id || igData.media_id)) {
              updates.instagram_post_id = igData.id || igData.media_id;
              syncStatus.instagram = 'success';
            }
          }

          if (publishTiktok && fbIgPhotoUrl) {
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

          const caption = await generateSocialCaption(record, 'product', link, true);

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

          const imagesToPost = await ensurePublicImages(record, 'products', supabase);
          if (imagesToPost.length === 0) {
            imagesToPost.push(getFallbackImage(record, 'product'));
          }
          let res;
          if (publishTelegram) {
            if (imagesToPost.length >= 1) {
              res = await sendPhoto(PRODUCT_CHANNEL, imagesToPost[0], caption, replyMarkup);
            } else {
              res = await sendMessage(PRODUCT_CHANNEL, caption, replyMarkup);
            }
          }
          const updates: any = {};
          let syncStatus = record.sync_status || { facebook: 'pending', instagram: 'pending', telegram: 'pending' };

          if (publishTelegram && res?.ok && res.result?.message_id) {
             updates.telegram_message_id = res.result.message_id.toString();
             syncStatus.telegram = 'success';
             try {
               await supabase.from('products').update({ 
                 telegram_message_id: updates.telegram_message_id,
                 sync_status: { ...syncStatus, telegram: 'success' }
               }).eq('id', record.id);
               console.log(`[TG IMMEDIATE SAVE - PRODUCT] Saved telegram_message_id ${updates.telegram_message_id} for ID ${record.id}`);
             } catch(e) {}
          }
          
          const fbIgPhotoUrl = imagesToPost.length > 0 ? imagesToPost : null;
          const fbIgCaption = (publishFacebook || publishInstagram || publishThreads || publishTiktok)
            ? await generateSocialCaption(record, 'product', link, false)
            : '';
                              
          if (publishFacebook) {
            const fbData = await postToFacebook(fbIgCaption, fbIgPhotoUrl);
            if (fbData && (fbData.post_id || fbData.id)) {
              updates.facebook_post_id = fbData.post_id || fbData.id;
              syncStatus.facebook = 'success';
            }
          }
          
          if (publishInstagram && fbIgPhotoUrl) {
            const igData = await postToInstagram(fbIgCaption, fbIgPhotoUrl);
            if (igData && (igData.id || igData.media_id)) {
               updates.instagram_post_id = igData.id || igData.media_id;
               syncStatus.instagram = 'success';
            }
          }
          
          if (publishTiktok && fbIgPhotoUrl) {
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
          const adId = record.short_id || record.id;
          const link = `https://www.souqbaghdad.store/ad/${adId}`;

          const caption = await generateSocialCaption(record, 'ad', link, true);

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

          const imagesToPost = await ensurePublicImages(record, 'ads', supabase);
          if (imagesToPost.length === 0) {
            imagesToPost.push(getFallbackImage(record, 'ad'));
          }
          let res;
          if (publishTelegram) {
            if (imagesToPost.length >= 1) {
              res = await sendPhoto(PRODUCT_CHANNEL, imagesToPost[0], caption, replyMarkup);
            } else {
              res = await sendMessage(PRODUCT_CHANNEL, caption, replyMarkup);
            }
          }
          const updates: any = {};
          let syncStatus = record.sync_status || { facebook: 'pending', instagram: 'pending', telegram: 'pending' };

          if (publishTelegram && res?.ok && res.result?.message_id) {
             updates.telegram_message_id = res.result.message_id.toString();
             syncStatus.telegram = 'success';
             try {
               await supabase.from('ads').update({ 
                 telegram_message_id: updates.telegram_message_id,
                 sync_status: { ...syncStatus, telegram: 'success' }
               }).eq('id', record.id);
               console.log(`[TG IMMEDIATE SAVE - GENERAL AD] Saved telegram_message_id ${updates.telegram_message_id} for ID ${record.id}`);
             } catch(e) {}
          }
          
          const fbIgPhotoUrl = imagesToPost.length > 0 ? imagesToPost : null;
          const fbIgCaption = (publishFacebook || publishInstagram || publishThreads || publishTiktok)
            ? await generateSocialCaption(record, 'ad', link, false)
            : '';
                              
          if (publishFacebook) {
            const fbData = await postToFacebook(fbIgCaption, fbIgPhotoUrl);
            if (fbData && (fbData.post_id || fbData.id)) {
              updates.facebook_post_id = fbData.post_id || fbData.id;
              syncStatus.facebook = 'success';
            }
          }
          
          if (publishInstagram && fbIgPhotoUrl) {
            const igData = await postToInstagram(fbIgCaption, fbIgPhotoUrl);
            if (igData && (igData.id || igData.media_id)) {
              updates.instagram_post_id = igData.id || igData.media_id;
              syncStatus.instagram = 'success';
            }
          }
          
          if (publishTiktok && fbIgPhotoUrl) {
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
             const targetTable = (payload.table === 'products') ? 'products' : 'ads';
             console.log(`[SOCIAL DB SAVE] Updating table ${targetTable} ID ${record.id}:`, JSON.stringify(updates));
             const { error: updErr, data: updData } = await supabase.from(targetTable).update(updates).eq('id', record.id).select();
             if (updErr) {
               console.error(`[SOCIAL DB SAVE ERROR] Failed updating table ${targetTable}:`, updErr);
             } else {
               console.log(`[SOCIAL DB SAVE SUCCESS] Updated table ${targetTable} ID ${record.id} with rows:`, updData?.length);
             }
          }
          
          if (record.phone) {
             await sendWhatsAppWelcome(record.phone, record.title || '', link);
          }
        }
        // --- 4. TRANSPORT ADS (خطوط النقل) ---
        else if ((payload.table === 'ads' && record.category === 'transport') || payload.table === 'transport_ads') {
          // Prevent duplicate execution if already synced (only for automated background triggers, not manual modal publish)
          if (!isManualExplicitPublish && record.id && payload.table === 'ads') {
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

          let rawPhone = record.phone || (desc && (desc.phone || desc.contact_phone || desc.whatsapp)) || '';
          let cleanDisplayPhone = String(rawPhone).replace(/[^\d+]/g, '').trim();
          if (cleanDisplayPhone.startsWith('964')) {
            cleanDisplayPhone = '0' + cleanDisplayPhone.substring(3);
          }
          if (cleanDisplayPhone.startsWith('+964')) {
            cleanDisplayPhone = '0' + cleanDisplayPhone.substring(4);
          }
          if (!cleanDisplayPhone) cleanDisplayPhone = '0780 000 0000';

          const daysStr = desc?.days || desc?.workDays || 'الأحد إلى الخميس';
          const shiftVal = desc?.shift || 'من 08:00 ص إلى 02:00 م';
          const targetAudienceVal = desc?.targetAudience || targetStr || 'طالبات فقط';

          // Dynamic Programmatic Templates (1080x1350 Post & 1080x1920 Story)
          const dynamicPostUrl = `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=post&title=${encodeURIComponent(cleanTitle)}&subtitle=${encodeURIComponent(cleanSubtitle)}&subdesc=${encodeURIComponent(cleanSubdesc)}&regions=${encodeURIComponent(cleanRegions)}&destination=${encodeURIComponent(cleanDestination)}&fare=${encodeURIComponent(cleanFare)}&link=${encodeURIComponent(link)}&short_id=${encodeURIComponent(adId)}&phone=${encodeURIComponent(cleanDisplayPhone)}&audience=${encodeURIComponent(targetAudienceVal)}&days=${encodeURIComponent(daysStr)}&time=${encodeURIComponent(shiftVal)}`;
          const dynamicStoryUrl = `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=story&title=${encodeURIComponent(cleanTitle)}&subtitle=${encodeURIComponent(cleanSubtitle)}&subdesc=${encodeURIComponent(cleanSubdesc)}&regions=${encodeURIComponent(cleanRegions)}&destination=${encodeURIComponent(cleanDestination)}&fare=${encodeURIComponent(cleanFare)}&link=${encodeURIComponent(link)}&short_id=${encodeURIComponent(adId)}&phone=${encodeURIComponent(cleanDisplayPhone)}&audience=${encodeURIComponent(targetAudienceVal)}&days=${encodeURIComponent(daysStr)}&time=${encodeURIComponent(shiftVal)}`;

          const descStr = typeof record.description === 'string' ? record.description : JSON.stringify(record.description || {});
          const rafdainTerms = ['الرافدين', 'الرفدين', 'ruc'];
          const isAlRafdain = rafdainTerms.some(term => 
            (record.university && record.university.toLowerCase().includes(term)) || 
            (record.city && record.city.toLowerCase().includes(term)) || 
            (record.title && record.title.toLowerCase().includes(term)) || 
            (record.destination && record.destination.toLowerCase().includes(term)) || 
            (record.location && record.location.toLowerCase().includes(term)) || 
            (record.regions && record.regions.toLowerCase().includes(term)) || 
            (desc?.targetAudience && desc.targetAudience.toLowerCase().includes(term)) ||
            descStr.toLowerCase().includes(term)
          );
          
          const useAlRafdainFb = forceFacebookPage ? (forceFacebookPage === 'alrafdain') : isAlRafdain;
          const useAlRafdainIg = forceInstagramPage ? (forceInstagramPage === 'alrafdain') : isAlRafdain;

          const updates: any = {};
          let syncStatus: any = { ...(record.sync_status || { facebook: 'pending', instagram: 'pending', telegram: 'pending' }) };

          const imagesToPost = await ensurePublicImages(record, 'ads', supabase);
          
          let finalPostPhotoUrl = dynamicPostUrl;
          if (imagesToPost.length > 0) {
            finalPostPhotoUrl = imagesToPost[0];
          } else {
            // Upload generated PNG card to Storage to guarantee Instagram and Facebook accept the direct image
            try {
              console.log(`[TRANSPORT CARD STORAGE] Generating and storing permanent PNG card for ad ${adId}...`);
              const cardFetch = await fetch(dynamicPostUrl);
              if (cardFetch.ok) {
                const cardBlob = await cardFetch.blob();
                const cardBytes = new Uint8Array(await cardBlob.arrayBuffer());
                const cardFileName = `transport-card-${adId}-${Date.now()}.png`;
                const { data: uploadResult, error: uploadErr } = await supabase.storage
                  .from('ad-images')
                  .upload(cardFileName, cardBytes, { contentType: 'image/png', upsert: true });

                if (!uploadErr && uploadResult) {
                  const { data: pubUrlData } = supabase.storage.from('ad-images').getPublicUrl(cardFileName);
                  if (pubUrlData?.publicUrl) {
                    finalPostPhotoUrl = pubUrlData.publicUrl;
                    console.log('[TRANSPORT CARD STORAGE] Stored permanent image successfully:', finalPostPhotoUrl);
                  }
                } else {
                  console.warn('Storage upload error for card image, using dynamic url fallback:', uploadErr);
                }
              }
            } catch (storageException) {
              console.error('Exception storing transport card image:', storageException);
            }
          }

          const transportPhoto = finalPostPhotoUrl;
          const fbIgPhotoUrl = imagesToPost.length > 0 ? imagesToPost : [finalPostPhotoUrl];

          let res;
          if (publishTelegram) {
            // 1. Send to main transport channel: @souqbaghdad_lines
            const targetLinesChannel = LINES_CHANNEL_ID || LINES_CHANNEL;
            if (imagesToPost.length > 1) {
              let mediaGroupCaption = msg;
              mediaGroupCaption += `\n\n🌐 <a href="${link}">التفاصيل الكاملة وحجز المقعد</a>`;
              if (cleanPhone) {
                mediaGroupCaption += `\n💬 <a href="https://wa.me/${cleanPhone}">تواصل واتساب</a> | ✈️ <a href="https://t.me/+${cleanPhone}">تواصل تيليكرام</a>`;
              }
              res = await sendMediaGroup(targetLinesChannel, imagesToPost, mediaGroupCaption);
            } else {
              res = await sendPhoto(targetLinesChannel, transportPhoto, msg, replyMarkup);
            }
            if (res?.ok && res.result?.message_id) {
              console.log('[TRANSPORT TG] Published successfully to', targetLinesChannel, 'msg_id:', res.result.message_id);
              updates.telegram_message_id = res.result.message_id.toString();
              syncStatus.telegram = 'success';
            } else {
              console.error('[TRANSPORT TG] Failed to publish to', targetLinesChannel, 'Response:', JSON.stringify(res));
              syncStatus.telegram = 'failed';
              syncStatus.telegram_error = res?.description || 'Telegram publish error';
            }

            // 2. If it is for Al-Rafdain, ALSO publish to @ruc_1
            if (isAlRafdain) {
              try {
                console.log(`[RUC WEBHOOK] isAlRafdain=true, sending to ${ALRAFDAIN_TELEGRAM_CHANNEL}`);
                let rucRes;
                if (imagesToPost.length > 1) {
                  let mediaGroupCaption = msg;
                  mediaGroupCaption += `\n\n🌐 <a href="${link}">التفاصيل الكاملة وحجز المقعد</a>`;
                  if (cleanPhone) {
                    mediaGroupCaption += `\n💬 <a href="https://wa.me/${cleanPhone}">تواصل واتساب</a> | ✈️ <a href="https://t.me/+${cleanPhone}">تواصل تيليكرام</a>`;
                  }
                  rucRes = await sendMediaGroup(ALRAFDAIN_TELEGRAM_CHANNEL, imagesToPost, mediaGroupCaption);
                } else {
                  rucRes = await sendPhoto(ALRAFDAIN_TELEGRAM_CHANNEL, transportPhoto, msg, replyMarkup);
                }
                console.log('[RUC WEBHOOK] sendPhoto response:', JSON.stringify(rucRes));
                if (rucRes?.ok && rucRes.result?.message_id) {
                  syncStatus.ruc_telegram_message_id = rucRes.result.message_id.toString();
                  syncStatus.ruc_telegram = 'success';
                } else {
                  syncStatus.ruc_telegram = 'failed';
                  syncStatus.ruc_telegram_error = rucRes?.description || 'unknown error';
                  console.error('[RUC WEBHOOK] sendPhoto failed:', JSON.stringify(rucRes));
                }
              } catch(e: any) {
                syncStatus.ruc_telegram = 'failed';
                syncStatus.ruc_telegram_error = e?.message || String(e);
                console.error('Error sending to Al-Rafdain Telegram channel @ruc_1:', e);
              }
            } else {
              console.log(`[RUC WEBHOOK] isAlRafdain=false — city="${record.city}", university="${record.university}", destination="${record.destination}"`);
            }
          }
          
          const fbIgCaption = (publishFacebook || publishInstagram || publishThreads || publishTiktok)
            ? await generateSocialCaption({ ...record, ...desc }, 'transport', link)
            : '';
          
          if (publishFacebook) {
            try {
              // 1. Post to Souq Baghdad Main Facebook Page
              console.log('[WEBHOOK SOCIAL] Posting transport to Souq Baghdad Main Facebook Page...');
              const mainFbData = await postToFacebook(fbIgCaption, fbIgPhotoUrl);
              console.log('[WEBHOOK SOCIAL] Main FB response:', JSON.stringify(mainFbData));
              if (mainFbData && (mainFbData.post_id || mainFbData.id)) {
                updates.facebook_post_id = mainFbData.post_id || mainFbData.id;
                syncStatus.facebook = 'success';
              } else {
                syncStatus.facebook = 'failed';
                syncStatus.facebook_error = mainFbData?.error?.message || JSON.stringify(mainFbData);
              }

              // 2. ALSO post to Al-Rafdain University Facebook Page (Feed & Story) ONLY if transport is for Al-Rafdain
              if (isAlRafdain || useAlRafdainFb) {
                const rafdainToken = ALRAFDAIN_FB_TOKEN || META_PAGE_ACCESS_TOKEN;
                const rafdainPageId = ALRAFDAIN_FB_PAGE_ID || '102975411515668';
                if (rafdainToken && rafdainPageId && rafdainPageId !== META_PAGE_ID) {
                  console.log(`[WEBHOOK SOCIAL] Posting Al-Rafdain transport to Al-Rafdain Facebook Page (${rafdainPageId})...`);
                  const rafdainFbData = await postToFacebook(fbIgCaption, fbIgPhotoUrl, rafdainToken, rafdainPageId);
                  console.log('[WEBHOOK SOCIAL] Al-Rafdain FB response:', JSON.stringify(rafdainFbData));
                  if (rafdainFbData && (rafdainFbData.post_id || rafdainFbData.id)) {
                    syncStatus.rafdain_facebook_post_id = rafdainFbData.post_id || rafdainFbData.id;
                    syncStatus.rafdain_facebook = 'success';
                  }
                  
                  // 2b. Post Story (9:16) to Al-Rafdain Facebook Story
                  console.log('[WEBHOOK SOCIAL] Posting Story (9:16) to Al-Rafdain Facebook Story...');
                  await postToFacebookStory(dynamicStoryUrl, rafdainPageId, rafdainToken);
                }
              }

              // 3. Post Story (9:16) to Souq Baghdad Main Facebook Story
              if (META_PAGE_ID && META_PAGE_ACCESS_TOKEN) {
                console.log('[WEBHOOK SOCIAL] Posting Story (9:16) to Souq Baghdad Facebook Story...');
                await postToFacebookStory(dynamicStoryUrl, META_PAGE_ID, META_PAGE_ACCESS_TOKEN);
              }
            } catch(fbErr: any) {
              console.error('[WEBHOOK SOCIAL] FB Error:', fbErr);
              syncStatus.facebook = syncStatus.facebook || 'failed';
            }
          }
          
          if (publishInstagram) {
            try {
              // 1. Post to Al-Rafdain IG Story ONLY if transport is for Al-Rafdain
              if (isAlRafdain || useAlRafdainIg) {
                const igToken = ALRAFDAIN_FB_TOKEN || META_PAGE_ACCESS_TOKEN;
                const igTargetId = ALRAFDAIN_IG_ID || '17841404181680155';
                if (igToken && igTargetId) {
                  console.log('[WEBHOOK SOCIAL] Posting transport to Al-Rafdain IG Story...');
                  await postToInstagramStory(dynamicStoryUrl, igTargetId, igToken);
                }
              }
              // 2. Post to Main Souq Baghdad Instagram Feed
              console.log('[WEBHOOK SOCIAL] Posting transport to Instagram Feed...');
              const igData = await postToInstagram(fbIgCaption, fbIgPhotoUrl);
              console.log('[WEBHOOK SOCIAL] IG response:', JSON.stringify(igData));
              if (igData && (igData.id || igData.media_id)) {
                updates.instagram_post_id = igData.id || igData.media_id;
                syncStatus.instagram = 'success';
              } else {
                syncStatus.instagram = syncStatus.instagram || 'failed';
                syncStatus.instagram_error = igData?.error?.message || JSON.stringify(igData);
              }
            } catch(igErr: any) {
              console.error('[WEBHOOK SOCIAL] IG Error:', igErr);
              syncStatus.instagram = syncStatus.instagram || 'failed';
            }
          }
          
          if (publishTiktok) {
            try {
              const tkData = await postToTikTok(fbIgCaption, fbIgPhotoUrl, supabase);
              if (tkData?.data?.publish_id) {
                updates.tiktok_post_id = tkData.data.publish_id;
                syncStatus.tiktok = 'success';
              }
            } catch(tkErr) {
              console.error('[WEBHOOK SOCIAL] TikTok Error:', tkErr);
            }
          }

          if (publishThreads) {
            try {
              console.log('[WEBHOOK SOCIAL] Posting transport to Threads...');
              const thData = await postToThreads(fbIgCaption, fbIgPhotoUrl);
              console.log('[WEBHOOK SOCIAL] Threads response:', JSON.stringify(thData));
              if (thData && (thData.id || thData.media_id)) {
                updates.threads_post_id = thData.id || thData.media_id;
                syncStatus.threads = 'success';
              } else {
                syncStatus.threads = 'failed';
                syncStatus.threads_error = thData?.error?.message || JSON.stringify(thData);
              }
            } catch(thErr: any) {
              console.error('[WEBHOOK SOCIAL] Threads Error:', thErr);
              syncStatus.threads = 'failed';
            }
          }
          
          updates.sync_status = syncStatus;
          finalSyncStatus = syncStatus;
          if (Object.keys(updates).length > 0) {
             const targetTable = (payload.table === 'transport_ads' || payload.table === 'lines') ? 'ads' : payload.table;
             console.log(`[SOCIAL WEBHOOK] Saving publish updates to table ${targetTable} for ID ${record.id}:`, JSON.stringify(updates));
             await supabase.from(targetTable).update(updates).eq('id', record.id);
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
          if (editRes?.description?.includes('message is not modified')) return editRes;
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

      if (action === 'car_confirm_publish' || action === 'car_bypass_publish') {
        if (state.step === 'publishing' || !state.data || (!state.data.brand && !state.data.model)) {
          return new Response('OK', { status: 200 });
        }

        const carTitle = `${state.data.brand || ''} ${state.data.model || ''} ${state.data.year || ''}`.trim() || 'سيارة للبيع';
        const userPhone = state.data.phone || phone;
        const { data: userProfile } = await supabase.from('profiles').select('points, role, full_name, avatar_url').eq('id', userId).single();
        const isOwnerOrAdmin = userProfile?.role === 'admin' || userProfile?.role === 'owner';

        // 1. فحص منع تكرار نفس الإعلان
        if (!isOwnerOrAdmin) {
          const { data: duplicateAds } = await supabase
            .from('ads')
            .select('id, title, short_id')
            .eq('seller_id', userId)
            .eq('status', 'active')
            .eq('category', 'vehicles')
            .ilike('title', `%${carTitle}%`)
            .limit(1);

          if (duplicateAds && duplicateAds.length > 0) {
            await updateOrSend(
              `⚠️ <b>عذراً، هذا الإعلان موجود لديك مسبقاً!</b> (#${duplicateAds[0].short_id || duplicateAds[0].id})\n\n` +
              `نفس تفاصيل السيارة منشورة حالياً في المنصة. لمنع التكرار، يرجى <b>تعديل إعلانك السابق</b> أو <b>حذفه</b> إذا كنت ترغب بنشره من جديد.`,
              {
                inline_keyboard: [
                  [{ text: '🚗 عرض وتعديل إعلاناتي', callback_data: 'my_ads' }],
                  [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
                ]
              }
            );
            state = {};
            await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
            return new Response('OK', { status: 200 });
          }
        }

        // 2. فحص مهلة الـ 15 دقيقة (Cooldown)
        let costMultiplier = 1;
        if (!isOwnerOrAdmin && action !== 'car_bypass_publish') {
          const { data: recentAds } = await supabase
            .from('ads')
            .select('created_at')
            .eq('seller_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);

          if (recentAds && recentAds.length > 0) {
            const lastTime = new Date(recentAds[0].created_at).getTime();
            const now = Date.now();
            const elapsedMinutes = (now - lastTime) / (1000 * 60);

            if (elapsedMinutes < 15) {
              const remainingMinutes = Math.ceil(15 - elapsedMinutes);
              await updateOrSend(
                `⏳ <b>لديك إعلان تم نشره قبل قليل!</b>\n\n` +
                `• يمكنك <b>الانتظار (${remainingMinutes} دقيقة)</b> للنشر بالتكلفة العادية (1 نقطة).\n` +
                `• أو <b>النشر الفوري الآن</b> وتجاوز الوقت بخصم ضعف النقاط (<b>2 نقطة</b>).\n\n` +
                `ماذا تفضل؟`,
                {
                  inline_keyboard: [
                    [{ text: '⚡ نشر فوري الآن (خصم 2 نقطة)', callback_data: 'car_bypass_publish' }],
                    [{ text: '⏳ انتظار وتعديل لاحقاً', callback_data: 'main_menu' }]
                  ]
                }
              );
              return new Response('OK', { status: 200 });
            }
          }
        }

        if (action === 'car_bypass_publish') {
          costMultiplier = 2;
        }

        state.step = 'publishing';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        await updateOrSend('⏳ جاري نشر إعلان سيارتك في المنصة وقناة التليكرام وشبكات التواصل...');

        const cost = 1 * costMultiplier;
        if (!isOwnerOrAdmin && cost > 0) {
          if (!userProfile || (userProfile.points || 0) < cost) {
            await updateOrSend(`❌ عذراً، رصيدك غير كافٍ. التكلفة المطلوبة (${cost} نقطة). يرجى شحن المحفظة.`, {
               inline_keyboard: [[{ text: '💳 شراء نقاط', callback_data: 'buy_points' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
            });
            state = {};
            await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
            return new Response('OK', { status: 200 });
          }
          await supabase.from('profiles').update({ points: userProfile.points - cost }).eq('id', userId);
        }

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

        const fallbackCarImage = getFallbackImage({
          description: carDescriptionJson,
          brand: state.data.brand,
          model: state.data.model,
          year: state.data.year
        }, 'car');

        const { data: insertedCar, error: carInsertError } = await supabase.from('ads').insert({
          title: carTitle,
          price: state.data.price ? state.data.price.replace(/[^0-9]/g, '') : '0',
          description: carDescriptionJson,
          category: 'vehicles',
          location: state.data.governorate || 'بغداد',
          city: state.data.model || 'بغداد',
          images: state.data.images && state.data.images.length > 0 ? state.data.images : [fallbackCarImage],
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
        const channelCaption = await generateSocialCaption(insertedCar, 'car', carLink, true);

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
          let carRes;
          const resolvedImages = await ensurePublicImages(insertedCar, 'ads', supabase);
          if (resolvedImages.length >= 1) {
            carRes = await sendPhoto(CAR_CHANNEL_ID || CAR_CHANNEL, resolvedImages[0], channelCaption, channelMarkup);
          } else {
            carRes = await sendMessage(CAR_CHANNEL_ID || CAR_CHANNEL, channelCaption, channelMarkup);
          }
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

      if (action === 'trans_confirm_publish' || action === 'trans_bypass_publish') {
        if (state.step === 'publishing' || !state.data || !state.data.destination) {
          return new Response('OK', { status: 200 });
        }

        const transTitle = state.data.type === 'offer' 
          ? `أوفر خط من ${state.data.regions} إلى ${state.data.destination}` 
          : `أبحث عن خط من ${state.data.regions} إلى ${state.data.destination}`;
        const userPhone = state.data.phone || phone;
        const { data: userProfile } = await supabase.from('profiles').select('points, role, full_name, avatar_url').eq('id', userId).single();
        const isOwnerOrAdmin = userProfile?.role === 'admin' || userProfile?.role === 'owner';

        // 1. فحص منع تكرار نفس إعلان خط النقل
        if (!isOwnerOrAdmin) {
          const { data: duplicateAds } = await supabase
            .from('ads')
            .select('id, title, short_id')
            .eq('seller_id', userId)
            .eq('status', 'active')
            .eq('category', 'transport')
            .or(`location.ilike.%${state.data.regions}%,city.ilike.%${state.data.destination}%`)
            .limit(1);

          if (duplicateAds && duplicateAds.length > 0) {
            await updateOrSend(
              `⚠️ <b>عذراً، لديك إعلان خط مشابه منشور مسبقاً!</b> (#${duplicateAds[0].short_id || duplicateAds[0].id})\n\n` +
              `خط النقل هذا مسجل لديك حالياً في المنصة. لمنع التكرار، يرجى <b>تعديل إعلانك الحالي</b> أو <b>حذفه</b> إذا كنت ترغب بنشر إعلان جديد.`,
              {
                inline_keyboard: [
                  [{ text: '🚌 عرض وتعديل خطوطي', callback_data: 'my_ads' }],
                  [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
                ]
              }
            );
            state = {};
            await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
            return new Response('OK', { status: 200 });
          }
        }

        // 2. فحص مهلة الـ 15 دقيقة (Cooldown)
        let costMultiplier = 1;
        if (!isOwnerOrAdmin && action !== 'trans_bypass_publish') {
          const { data: recentAds } = await supabase
            .from('ads')
            .select('created_at')
            .eq('seller_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);

          if (recentAds && recentAds.length > 0) {
            const lastTime = new Date(recentAds[0].created_at).getTime();
            const now = Date.now();
            const elapsedMinutes = (now - lastTime) / (1000 * 60);

            if (elapsedMinutes < 15) {
              const remainingMinutes = Math.ceil(15 - elapsedMinutes);
              await updateOrSend(
                `⏳ <b>لديك إعلان تم نشره قبل قليل!</b>\n\n` +
                `• يمكنك <b>الانتظار (${remainingMinutes} دقيقة)</b> للنشر بالتكلفة العادية (1 نقطة).\n` +
                `• أو <b>النشر الفوري الآن</b> وتجاوز الوقت بخصم ضعف النقاط (<b>2 نقطة</b>).\n\n` +
                `ماذا تفضل؟`,
                {
                  inline_keyboard: [
                    [{ text: '⚡ نشر فوري الآن (خصم 2 نقطة)', callback_data: 'trans_bypass_publish' }],
                    [{ text: '⏳ انتظار وتعديل لاحقاً', callback_data: 'main_menu' }]
                  ]
                }
              );
              return new Response('OK', { status: 200 });
            }
          }
        }

        if (action === 'trans_bypass_publish') {
          costMultiplier = 2;
        }

        state.step = 'publishing';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        await updateOrSend('⏳ جاري نشر إعلان الخط في المنصة وقناة خطوط النقل...');

        const cost = 1 * costMultiplier;
        if (!isOwnerOrAdmin && cost > 0) {
          if (!userProfile || (userProfile.points || 0) < cost) {
            await updateOrSend(`❌ عذراً، رصيدك غير كافٍ. التكلفة المطلوبة (${cost} نقطة). يرجى شحن المحفظة.`, {
               inline_keyboard: [[{ text: '💳 شراء نقاط', callback_data: 'buy_points' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
            });
            state = {};
            await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
            return new Response('OK', { status: 200 });
          }
          await supabase.from('profiles').update({ points: userProfile.points - cost }).eq('id', userId);
        }

        const shortId = Math.random().toString(36).substring(2, 7).toUpperCase();

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

        const insertedId = insertedTrans.id;
        const stateData = state.data || {};

        // Auto publish to Telegram channels and Socials with dynamic template
        const typeStr = stateData.type === 'offer' ? '🚗 أوفر خط نقل (سائق)' : '🙋‍♂️ أبحث عن خط نقل (مطلوب)';
        const catType = stateData.categoryType === 'employee' ? '💼 خط موظفين' : (stateData.categoryType === 'emergency' ? '🚨 نقل خاص' : '🎓 خط طلاب');
        const targetStr = stateData.targetAudience || 'الجميع';
        const link = `https://www.souqbaghdad.store/transport/card/${shortId}`;
        const cleanTitle = 'خط نقل جديد في بغداد';
        const cleanSubtitle = (stateData.destination || 'كلية الرافدين الجامعة').replace(/<[^>]*>?/gm, '').trim();
        const cleanSubdesc = `${catType} (${targetStr})`.replace(/<[^>]*>?/gm, '').trim();
        const cleanRegions = (stateData.regions || 'بغداد').replace(/<[^>]*>?/gm, '').trim();
        const cleanDestination = (stateData.destination || 'كلية الرافدين الجامعة').replace(/<[^>]*>?/gm, '').trim();
        const cleanFare = formatTgPrice(stateData.price);

        const isAlRafdain = ['الرافدين', 'الرفدين', 'رافدين', 'رفدين', 'ruc'].some(term => 
          cleanDestination.toLowerCase().includes(term) || 
          targetStr.toLowerCase().includes(term) ||
          cleanRegions.toLowerCase().includes(term) ||
          (transTitle && transTitle.toLowerCase().includes(term)) ||
          (stateData.university && stateData.university.toLowerCase().includes(term)) ||
          (stateData.destination && stateData.destination.toLowerCase().includes(term))
        );
        const channelLink = isAlRafdain && ALRAFDAIN_TELEGRAM_CHANNEL
          ? `https://t.me/${ALRAFDAIN_TELEGRAM_CHANNEL.replace('@', '')}`
          : `https://t.me/${LINES_CHANNEL.replace('@', '')}`;

        // Immediately send success message to user before heavy background tasks
        await updateOrSend(`🎉 <b>تم نشر إعلان الخط بنجاح!</b>\n\n🚌 <b>${transTitle}</b>\n💰 <b>الأجرة:</b> ${cleanFare}\n📍 <b>المناطق:</b> ${stateData.regions}\n🏢 <b>الوجهة:</b> ${stateData.destination}\n\n📣 <b>الخط معروض الآن في المنصة وقناة خطوط النقل.</b>\nيمكنك إدارة خطك مباشرة عبر الأزرار أدناه:`, {
          inline_keyboard: [
            [{ text: '📢 شاهد الخط في القناة', url: channelLink }],
            [{ text: '💰 تعديل الأجرة', callback_data: `edit_trans_price_${insertedId}` }, { text: '📞 تعديل الهاتف', callback_data: `edit_trans_phone_${insertedId}` }],
            [{ text: '✅ إغلاق الخط (اكتمل العدد)', callback_data: `solve_trans_${insertedId}` }],
            [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
          ]
        });

        // Reset state so user can do other things
        state = {};
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        // Background task for publishing to channels and social media
        const publishBackground = async () => {
          try {
            let rawPhone = stateData.phone || phone || '';
            let cleanDisplayPhone = String(rawPhone).replace(/[^\d+]/g, '').trim();
            if (cleanDisplayPhone.startsWith('964')) {
              cleanDisplayPhone = '0' + cleanDisplayPhone.substring(3);
            }
            if (cleanDisplayPhone.startsWith('+964')) {
              cleanDisplayPhone = '0' + cleanDisplayPhone.substring(4);
            }
            if (!cleanDisplayPhone) cleanDisplayPhone = '0770 000 0000';

            const daysStr = stateData.days || 'الأحد إلى الخميس';
            const shiftVal = stateData.shift || 'صباحي';
            const targetAudienceVal = stateData.targetAudience || targetStr || 'الجميع';

            const dynamicPostUrl = `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=post&title=${encodeURIComponent(cleanTitle)}&subtitle=${encodeURIComponent(cleanSubtitle)}&subdesc=${encodeURIComponent(cleanSubdesc)}&regions=${encodeURIComponent(cleanRegions)}&destination=${encodeURIComponent(cleanDestination)}&fare=${encodeURIComponent(cleanFare)}&link=${encodeURIComponent(link)}&short_id=${encodeURIComponent(shortId)}&phone=${encodeURIComponent(cleanDisplayPhone)}&audience=${encodeURIComponent(targetAudienceVal)}&days=${encodeURIComponent(daysStr)}&time=${encodeURIComponent(shiftVal)}`;
            const dynamicStoryUrl = `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=story&title=${encodeURIComponent(cleanTitle)}&subtitle=${encodeURIComponent(cleanSubtitle)}&subdesc=${encodeURIComponent(cleanSubdesc)}&regions=${encodeURIComponent(cleanRegions)}&destination=${encodeURIComponent(cleanDestination)}&fare=${encodeURIComponent(cleanFare)}&link=${encodeURIComponent(link)}&short_id=${encodeURIComponent(shortId)}&phone=${encodeURIComponent(cleanDisplayPhone)}&audience=${encodeURIComponent(targetAudienceVal)}&days=${encodeURIComponent(daysStr)}&time=${encodeURIComponent(shiftVal)}`;

            const cleanPhone = cleanDisplayPhone;
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
                               `⏰ <b>وقت الدوام:</b> ${stateData.shift || 'صباحي'}\n` +
                               `🚗 <b>المركبة:</b> ${stateData.vehicleType || 'صالون'} | <b>المقاعد:</b> ${stateData.seats || '4'} مقاعد\n` +
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
            let rucMsgId: string | null = null;
            if (isAlRafdain) {
              try {
                console.log(`[BOT RUC] isAlRafdain=true, sending to ${ALRAFDAIN_TELEGRAM_CHANNEL}`);
                const rucRes = await sendPhoto(ALRAFDAIN_TELEGRAM_CHANNEL, dynamicPostUrl, channelMsg, { inline_keyboard: channelKeyboard });
                if (rucRes?.ok && rucRes.result?.message_id) {
                  rucMsgId = rucRes.result.message_id.toString();
                  console.log(`[BOT RUC] sendPhoto success, message_id: ${rucMsgId}`);
                }
              } catch(err) {
                console.error("Error sending to Al-Rafdain @ruc_1 from bot wizard:", err);
              }
            }

            // Save telegram_message_id and ruc_telegram_message_id to prevent DB webhook from publishing again (dedup)
            if (tgMsgId || rucMsgId) {
              const syncStatus: any = { telegram: 'success', facebook: 'pending', instagram: 'pending' };
              if (rucMsgId) syncStatus.ruc_telegram_message_id = rucMsgId;
              const updateData: any = { sync_status: syncStatus };
              if (tgMsgId) updateData.telegram_message_id = tgMsgId;
              await supabase.from('ads').update(updateData).eq('id', insertedTrans.id);
            }

            // 3. Social Media
            try {
              const fbIgCaption = await generateSocialCaption(insertedTrans, 'transport', link);
              const socialUpdates: any = {};
              const currentSync: any = { telegram: 'success', facebook: 'pending', instagram: 'pending', threads: 'pending' };
              if (rucMsgId) currentSync.ruc_telegram_message_id = rucMsgId;

              // Facebook
              try {
                // 1. Post to Souq Baghdad Main Facebook Page
                console.log('[BOT SOCIAL] Posting transport to Souq Baghdad Facebook Page...');
                const fbData = await postToFacebook(fbIgCaption, dynamicPostUrl);
                console.log('[BOT SOCIAL] Main FB response:', JSON.stringify(fbData));
                if (fbData && (fbData.post_id || fbData.id)) {
                  socialUpdates.facebook_post_id = fbData.post_id || fbData.id;
                  currentSync.facebook = 'success';
                }
                
                // 1b. Post Story (9:16) to Souq Baghdad Facebook Story
                if (META_PAGE_ID && META_PAGE_ACCESS_TOKEN) {
                  await postToFacebookStory(dynamicStoryUrl, META_PAGE_ID, META_PAGE_ACCESS_TOKEN);
                }

                // 2. ALSO Post to Al-Rafdain Facebook Page ONLY if transport is for Al-Rafdain
                if (isAlRafdain && ALRAFDAIN_FB_TOKEN && ALRAFDAIN_FB_PAGE_ID) {
                  console.log('[BOT SOCIAL] Posting transport to Al-Rafdain Facebook Page...');
                  const rafdainFbData = await postToFacebook(fbIgCaption, dynamicPostUrl, ALRAFDAIN_FB_TOKEN, ALRAFDAIN_FB_PAGE_ID);
                  console.log('[BOT SOCIAL] Al-Rafdain FB response:', JSON.stringify(rafdainFbData));
                  if (rafdainFbData && (rafdainFbData.post_id || rafdainFbData.id)) {
                    currentSync.rafdain_facebook_post_id = rafdainFbData.post_id || rafdainFbData.id;
                    currentSync.rafdain_facebook = 'success';
                  }

                  // 2b. Post Story (9:16) to Al-Rafdain Facebook Story
                  await postToFacebookStory(dynamicStoryUrl, ALRAFDAIN_FB_PAGE_ID, ALRAFDAIN_FB_TOKEN);
                }
              } catch(fbErr: any) {
                console.error('[BOT SOCIAL] FB Error:', fbErr);
                currentSync.facebook = 'failed';
                currentSync.facebook_error = fbErr?.message || String(fbErr);
              }

              // Instagram
              try {
                if (isAlRafdain && ALRAFDAIN_FB_TOKEN && ALRAFDAIN_IG_ID) {
                  console.log('[BOT SOCIAL] Posting to Al-Rafdain IG Story...');
                  await postToInstagramStory(dynamicStoryUrl, ALRAFDAIN_IG_ID, ALRAFDAIN_FB_TOKEN);
                }
                console.log('[BOT SOCIAL] Posting to Instagram Feed...');
                const igData = await postToInstagram(fbIgCaption, dynamicPostUrl);
                console.log('[BOT SOCIAL] IG response:', JSON.stringify(igData));
                if (igData && (igData.id || igData.media_id)) {
                  socialUpdates.instagram_post_id = igData.id || igData.media_id;
                  currentSync.instagram = 'success';
                } else {
                  currentSync.instagram = 'failed';
                  currentSync.instagram_error = igData?.error?.message || JSON.stringify(igData);
                }
              } catch(igErr: any) {
                console.error('[BOT SOCIAL] IG Error:', igErr);
                currentSync.instagram = 'failed';
                currentSync.instagram_error = igErr?.message || String(igErr);
              }

              // Threads
              try {
                console.log('[BOT SOCIAL] Posting to Threads...');
                const thData = await postToThreads(fbIgCaption, dynamicPostUrl);
                console.log('[BOT SOCIAL] Threads response:', JSON.stringify(thData));
                if (thData && (thData.id || thData.media_id)) {
                  socialUpdates.threads_post_id = thData.id || thData.media_id;
                  currentSync.threads = 'success';
                } else {
                  currentSync.threads = 'failed';
                  currentSync.threads_error = thData?.error?.message || JSON.stringify(thData);
                }
              } catch(thErr: any) {
                console.error('[BOT SOCIAL] Threads Error:', thErr);
                currentSync.threads = 'failed';
                currentSync.threads_error = thErr?.message || String(thErr);
              }

              socialUpdates.sync_status = currentSync;
              await supabase.from('ads').update(socialUpdates).eq('id', insertedTrans.id);
            } catch (err) {
              console.error("Error auto publishing transport to social media:", err);
            }
          } catch(pubErr) {
            console.error("Error in publishBackground task:", pubErr);
          }
        };

        if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
          EdgeRuntime.waitUntil(publishBackground());
        } else {
          publishBackground();
        }

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
          const rucMsgId = updatedTrans.sync_status?.ruc_telegram_message_id;

          const closedButtons = {
            inline_keyboard: [
              [{ text: '🚌 تصفح خطوط أخرى متاحة 🌐', url: 'https://www.souqbaghdad.store/transport' }],
              [{ text: '🚌 اعرض خطك مجاناً عبر البوت', url: `https://t.me/${BOT_USERNAME}` }]
            ]
          };
          const closedCaption = `✅ <b>[اكتمل العدد / الخط مغلق]</b>\n\n` +
                                `🚌 <b>${updatedTrans.title}</b>\n` +
                                `💰 <b>تم اكتمال العدد بنجاح عبر منصة سوق بغداد</b>\n` +
                                `📍 ${updatedTrans.location || updatedTrans.city || 'بغداد'}\n\n` +
                                `📣 لم يعد هذا الخط متاحاً للتسجيل. يمكنك تصفح خطوط أخرى متاحة بالضغط أدناه 👇`;

          // 1. Edit in main lines channel
          if (msgId) {
            const channelsToTry = Array.from(new Set([LINES_CHANNEL_ID, LINES_CHANNEL, '@souqbaghdad_lines', '@souqbaghdad_line'].filter(Boolean)));
            for (const ch of channelsToTry) {
              try {
                const res = await editChannelMessage(ch, parseInt(msgId, 10), closedCaption, closedButtons);
                if (res?.ok) break;
              } catch(e) {
                console.error(`Transport caption update error in ${ch}:`, e);
              }
            }
          }

          // 2. Check if transport is for Al-Rafdain, update @ruc_1 as well
          const descStr = typeof updatedTrans.description === 'string'
            ? updatedTrans.description
            : JSON.stringify(updatedTrans.description || {});
          const rafdainTerms = ['الرافدين', 'الرفدين', 'ruc'];
          const isAlRafdainTrans = rafdainTerms.some(term =>
            (updatedTrans.title && updatedTrans.title.toLowerCase().includes(term)) ||
            (updatedTrans.university && updatedTrans.university.toLowerCase().includes(term)) ||
            (updatedTrans.city && updatedTrans.city.toLowerCase().includes(term)) ||
            (updatedTrans.destination && updatedTrans.destination.toLowerCase().includes(term)) ||
            (updatedTrans.location && updatedTrans.location.toLowerCase().includes(term)) ||
            (updatedTrans.regions && updatedTrans.regions.toLowerCase().includes(term)) ||
            descStr.toLowerCase().includes(term)
          );

          if ((isAlRafdainTrans || rucMsgId) && ALRAFDAIN_TELEGRAM_CHANNEL && rucMsgId) {
            try {
              console.log(`[RUC BOT UPDATE] Updating post in ${ALRAFDAIN_TELEGRAM_CHANNEL} with msgId ${rucMsgId}`);
              await editChannelMessage(ALRAFDAIN_TELEGRAM_CHANNEL, parseInt(rucMsgId, 10), closedCaption, closedButtons);
            } catch(e2) {
              console.error('Al-Rafdain (ruc_1) caption update error:', e2);
            }
          }

          // 3. Update Facebook Post if exists
          if (updatedTrans.facebook_post_id) {
            const fbClosedText = `✅ [اكتمل العدد / الخط مغلق]\n\n🚌 ${updatedTrans.title || 'إعلان خط'}\n💰 تمت العملية بنجاح عبر منصة سوق بغداد\n\nلم يعد هذا الخط متاحاً للتسجيل. تصفح الخطوط المتاحة عبر:\nhttps://www.souqbaghdad.store/transport`;
            await updateFacebookPost(updatedTrans.facebook_post_id, fbClosedText);
          }

          await updateOrSend('✅ <b>تم إغلاق الخط بنجاح!</b>\nتم تحديث المنشور في القنوات ومواقع التواصل ليظهر أن العدد اكتمل.', {
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
          const isCar = updatedAd.category === 'vehicles' || updatedAd.category === 'cars' || updatedAd.category === 'car';
          const targetChannel = isCar ? (CAR_CHANNEL_ID || CAR_CHANNEL) : PRODUCT_CHANNEL;

          if (msgId && targetChannel) {
            try {
              const browseUrl = isCar ? 'https://www.souqbaghdad.store/vehicles' : 'https://www.souqbaghdad.store';
              const soldButtons = {
                inline_keyboard: [
                  [{ text: '⚠️ تم بيع هذا الإعلان — تصفح المزيد 🚗', url: browseUrl }],
                  [{ text: '🚗 اعرض إعلانك مجاناً عبر البوت', url: `https://t.me/${BOT_USERNAME}` }]
                ]
              };
              const soldTag = isCar ? '⚠️ <b>[تم البيع / مباعة]</b>' : '⚠️ <b>[تم البيع / غير متوفر]</b>';
              const soldCaption = `${soldTag}\n\n` +
                                  `🚗 <b>${updatedAd.title}</b>\n` +
                                  `💰 <b>تم البيع بنجاح عبر منصة سوق بغداد</b>\n` +
                                  `📍 ${updatedAd.location || 'العراق'}\n\n` +
                                  `📣 لم يعد هذا الإعلان متاحاً للتواصل. يمكنك تصفح أحدث المعروضات بالضغط أدناه 👇`;

              await editChannelMessage(targetChannel, parseInt(msgId, 10), soldCaption, soldButtons);
              if (EXTRA_CHANNEL && EXTRA_CHANNEL !== targetChannel) {
                await editChannelMessage(EXTRA_CHANNEL, parseInt(msgId, 10), soldCaption, soldButtons);
              }
            } catch(e) {
              console.error('Telegram caption update error:', e);
            }
          }

          // Update Facebook Post
          if (updatedAd.facebook_post_id) {
            const fbSoldText = `⚠️ [تم البيع / غير متوفر]\n\n${updatedAd.title || 'إعلان'}\n💰 تم البيع بنجاح عبر منصة سوق بغداد\n\nتصفح المزيد من العروض عبر:\nhttps://www.souqbaghdad.store`;
            await updateFacebookPost(updatedAd.facebook_post_id, fbSoldText);
          }

          await updateOrSend('✅ <b>تم تعليم الإعلان كمباع بنجاح!</b>\n\nتم تحديث المنشور في القناة وفيسبوك تلقائياً وتغيير الأزرار إلى «تم بيع الإعلان — تصفح المزيد».', {
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
        const { data: adToDelete } = await supabase.from('products').select('facebook_post_id, telegram_message_id, instagram_post_id, threads_post_id').eq('id', prodId).single();
        const { error: delErr } = await supabase.from('products').delete().eq('id', prodId);
        
        if (delErr) {
          await sendMessage(chatId, '❌ لم يتم العثور على المنتج، أو حدث خطأ أثناء الحذف.');
          return new Response('OK', { status: 200 });
        }
        
        if (adToDelete) {
          if (adToDelete.facebook_post_id) await deleteFromFacebook(adToDelete.facebook_post_id);
          if (adToDelete.instagram_post_id) await deleteFromInstagram(adToDelete.instagram_post_id);
          if (adToDelete.threads_post_id) await deleteFromThreads(adToDelete.threads_post_id);
          if (adToDelete.telegram_message_id && PRODUCT_CHANNEL) {
             await deleteMessage(PRODUCT_CHANNEL, parseInt(adToDelete.telegram_message_id, 10));
             if (EXTRA_CHANNEL) await deleteMessage(EXTRA_CHANNEL, parseInt(adToDelete.telegram_message_id, 10));
          }
        }
        
        await sendMessage(chatId, '✅ <b>تم حذف المنتج بنجاح!</b>\nتمت إزالة المنشور من كافة القنوات ومنصات التواصل.', { inline_keyboard: [[{ text: '🔙 العودة لإدارة إعلاناتي', callback_data: 'manage_cat_ads' }]] });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('del_trans_')) {
        const transId = action.replace('del_trans_', '');
        const { data: adToDelete } = await supabase.from('ads').select('id, seller_id, phone, facebook_post_id, telegram_message_id, instagram_post_id, threads_post_id, sync_status, category').eq('id', transId).maybeSingle();
        
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
          if (adToDelete.threads_post_id) await deleteFromThreads(adToDelete.threads_post_id);
          
          if (adToDelete.telegram_message_id) {
             const channel = (adToDelete.category === 'transport') ? (LINES_CHANNEL_ID || TRANSPORT_CHANNEL) : (adToDelete.category === 'vehicles' || adToDelete.category === 'cars' ? (CAR_CHANNEL_ID || CAR_CHANNEL) : PRODUCT_CHANNEL);
             if (channel) await deleteMessage(channel, parseInt(adToDelete.telegram_message_id, 10));
             if (EXTRA_CHANNEL) await deleteMessage(EXTRA_CHANNEL, parseInt(adToDelete.telegram_message_id, 10));
          }

          const rucMsgId = adToDelete.sync_status?.ruc_telegram_message_id;
          if (rucMsgId && ALRAFDAIN_TELEGRAM_CHANNEL) {
            await deleteMessage(ALRAFDAIN_TELEGRAM_CHANNEL, parseInt(rucMsgId, 10));
          }
        }
        
        const returnCb = (adToDelete.category === 'vehicles' || adToDelete.category === 'cars') ? 'manage_cat_cars' : (adToDelete.category === 'transport' ? 'manage_cat_trans' : 'manage_my_ads');
        await sendMessage(chatId, '✅ <b>تم حذف الإعلان نهائياً بنجاح!</b>\nتمت إزالة المنشور من كافة القنوات ومنصات التواصل وقاعدة البيانات.', {
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

      // =================== Product Wizard (Full 9-Step) ===================
      // Helper: DELETE old wizard message + SEND new one at bottom of chat
      // This ensures the wizard always appears as the latest message (not editing old ones)
      const editProdWizard = async (text: string, markup: any) => {
        const wMsgId = state.data?.wizardMsgId;
        // Delete old wizard message silently
        if (wMsgId) {
          try { await deleteMessage(chatId, wMsgId); } catch(e) {}
        }
        // Send fresh message at bottom
        const res = await sendMessage(chatId, text, markup);
        if (res?.result?.message_id) {
          if (!state.data) state.data = {};
          state.data.wizardMsgId = res.result.message_id;
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        }
      };


      if (action === 'publish_product') {
        const { data: profile } = await supabase.from('profiles').select('points, role').eq('id', userId).maybeSingle();
        if (profile?.role !== 'admin' && profile?.role !== 'owner' && (profile?.points || 0) < 1) {
          await sendMessage(chatId, '❌ عذراً، رصيد النقاط الخاص بك غير كافٍ لنشر إعلان. يرجى شحن المحفظة أولاً.', { inline_keyboard: [[{ text: '💳 شراء نقاط', callback_data: 'buy_points' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]] });
          return new Response('OK', { status: 200 });
        }
        state = { step: 'product_title', data: { images: [] } };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        const initMsg = await sendMessage(chatId,
          `📦 <b>نشر منتج جديد في سوق بغداد</b> 🛍️\n\n<b>الخطوة 1 من 9 — عنوان المنتج</b>\n\nاكتب اسم المنتج بوضوح (مثال: ايفون 15 برو ماكس، تلفزيون سامسونج 55 بوصة):`,
          { inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]] }
        );
        if (initMsg?.result?.message_id) {
          state.data.wizardMsgId = initMsg.result.message_id;
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        }
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('prod_cat_')) {
        state.data.category = action.replace('prod_cat_', '');
        state.step = 'product_condition';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await editProdWizard(
          `<b>الخطوة 3 من 9 — حالة المنتج</b>\n\nما هي حالة المنتج؟`,
          { inline_keyboard: [[{ text: '🆕 جديد', callback_data: 'prod_cond_new' }, { text: '♻️ مستعمل', callback_data: 'prod_cond_used' }], [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]] }
        );
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('prod_cond_')) {
        state.data.condition = action.replace('prod_cond_', '') === 'new' ? 'جديد' : 'مستعمل';
        state.step = 'product_price';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await editProdWizard(
          `<b>الخطوة 4 من 9 — السعر</b>\n\nاكتب <b>سعر المنتج</b> بالأرقام بالدينار العراقي:\n(مثال: 50000 أو 150000)`,
          { inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]] }
        );
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('prod_gov_')) {
        const gov = action.replace('prod_gov_', '').replace(/_/g, ' ');
        state.data.governorate = gov;
        state.step = 'product_images';
        if (!state.data.images) state.data.images = [];
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await editProdWizard(
          `<b>الخطوة 7 من 9 — صور المنتج</b>\n\nأرسل صور المنتج الآن (يمكنك إرسال حتى 5 صور).\nبعد الانتهاء اضغط «تم ✅».`,
          { inline_keyboard: [[{ text: '✅ تم إرسال الصور', callback_data: 'prod_images_done' }], [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]] }
        );
        return new Response('OK', { status: 200 });
      }

      if (action === 'prod_images_done') {
        if (!state.data.images || state.data.images.length === 0) {
          await editProdWizard('⚠️ يرجى إرسال صورة واحدة على الأقل قبل المتابعة.', {
            inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]]
          });
          return new Response('OK', { status: 200 });
        }
        state.step = 'product_phone';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        const phoneButtons: any[] = [];
        if (phone) phoneButtons.push([{ text: `📱 استخدم رقمي الحالي (${phone})`, callback_data: 'prod_phone_current' }]);
        phoneButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);
        await editProdWizard(
          `<b>الخطوة 8 من 9 — رقم الهاتف</b>\n\nاكتب <b>رقم هاتفك</b> للتواصل، أو اضغط الزر أدناه:`,
          { inline_keyboard: phoneButtons }
        );
        return new Response('OK', { status: 200 });
      }

      if (action === 'prod_phone_current') {
        state.data.phone = phone || '';
        state.step = 'product_review';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        const d = state.data;
        const catLabels: Record<string, string> = { electronics: '📱 إلكترونيات', fashion: '👕 أزياء وملابس', home: '🏠 المنزل', vehicles: '🚗 أوتو', other: '🔄 أخرى' };
        const reviewText =
          `🔍 <b>مراجعة أخيرة — الخطوة 9 من 9</b>\n\n` +
          `📌 <b>العنوان:</b> ${d.title || '-'}\n` +
          `📑 <b>القسم:</b> ${catLabels[d.category] || d.category || '-'}\n` +
          `✨ <b>الحالة:</b> ${d.condition || '-'}\n` +
          `💰 <b>السعر:</b> ${Number(String(d.price).replace(/[^0-9]/g, '')).toLocaleString('en-US')} د.ع\n` +
          `📝 <b>الوصف:</b> ${d.description || '-'}\n` +
          `📍 <b>المحافظة:</b> ${d.governorate || '-'}\n` +
          `📸 <b>الصور:</b> ${(d.images || []).length} صورة\n` +
          `📞 <b>الهاتف:</b> ${d.phone || '-'}\n\n` +
          `هل كل شيء صحيح؟ اضغط «✅ نشر الإعلان الآن» للنشر الفوري على تيليكرام وفيسبوك وانستكرام وثريدز.`;
        await editProdWizard(reviewText, {
          inline_keyboard: [
            [{ text: '✅ نشر الإعلان الآن 🚀', callback_data: 'prod_confirm_publish' }],
            [{ text: '❌ إلغاء وبدء من جديد', callback_data: 'cancel_wizard' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'prod_confirm_publish') {
        const d = state.data || {};
        if (!d.title) {
          await updateOrSend('❌ البيانات غير مكتملة، يرجى البدء من جديد.', { inline_keyboard: [[{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]] });
          return new Response('OK', { status: 200 });
        }

        // Check & deduct points
        const { data: userProfile } = await supabase.from('profiles').select('points, role, full_name, avatar_url').eq('id', userId).single();
        if (userProfile?.role !== 'admin' && userProfile?.role !== 'owner') {
          if (!userProfile || (userProfile.points || 0) < 1) {
            await updateOrSend('❌ رصيد نقاطك غير كافٍ لنشر الإعلان.', { inline_keyboard: [[{ text: '💳 شراء نقاط', callback_data: 'buy_points' }]] });
            return new Response('OK', { status: 200 });
          }
          await supabase.from('profiles').update({ points: userProfile.points - 1 }).eq('id', userId);
        }

        // Answer immediately
        if (callbackQueryId) await answerCallbackQuery(callbackQueryId, '⏳ جاري نشر إعلانك...');
        await updateOrSend('⏳ <b>جاري نشر الإعلان على جميع المنصات...</b>\nانتظر لحظة من فضلك.');

        const stateData = { ...d };
        state = {};
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        // Background publishing
        EdgeRuntime.waitUntil((async () => {
          try {
            const rawPrice = String(stateData.price || '0').replace(/[^0-9]/g, '');
            const priceNum = parseInt(rawPrice, 10) || 0;
            const catLabels: Record<string, string> = { electronics: 'إلكترونيات', fashion: 'أزياء وملابس', home: 'المنزل', vehicles: 'أوتو', other: 'أخرى' };

            const fallbackProductImage = getFallbackImage({
              category: stateData.category,
              title: stateData.title
            }, 'product');

            // 1. Insert to DB
            const { data: inserted } = await supabase.from('products').insert({
              title: stateData.title,
              price: priceNum,
              description: stateData.description || '',
              governorate: stateData.governorate || 'بغداد',
              category: stateData.category || 'other',
              condition: stateData.condition || 'مستعمل',
              phone: stateData.phone || phone,
              images: stateData.images && stateData.images.length > 0 ? stateData.images : [fallbackProductImage],
              seller_id: userId,
              seller_name: userProfile?.full_name || 'بائع',
              seller_avatar: userProfile?.avatar_url || '',
              status: 'active'
            }).select().single();

            if (!inserted) {
              await sendMessage(chatId, '❌ حدث خطأ أثناء حذف البيانات، يرجى المحاولة مرة أخرى.');
              return;
            }

            const productLink = `https://www.souqbaghdad.store/product/${inserted.id}`;
            const priceFormatted = priceNum > 0 ? `${priceNum.toLocaleString('en-US')} د.ع` : 'حسب الاتفاق';
            const catLabel = catLabels[stateData.category] || stateData.category || 'منتج';

            // 2. Telegram caption
            const tgCaption = await generateSocialCaption(inserted, 'product', productLink, true);

            const tgButtons = {
              inline_keyboard: [
                [{ text: '🛒 عرض المنتج كاملاً', url: productLink }],
                [{ text: '📢 انشر منتجك مجاناً', url: `https://t.me/${BOT_USERNAME}` }]
              ]
            };

            // 3. Send to Telegram product channel
            const updates: any = {};
            const prodImages = await ensurePublicImages(inserted, 'products', supabase);
            const mainImage = prodImages && prodImages.length > 0 ? prodImages[0] : null;
            let tgMsgId: string | null = null;

            let tgRes;
            if (prodImages.length >= 1) {
              tgRes = await sendPhoto(PRODUCT_CHANNEL, prodImages[0], tgCaption, tgButtons);
            } else {
              tgRes = await sendMessage(PRODUCT_CHANNEL, tgCaption, tgButtons);
            }
            if (tgRes?.ok && tgRes.result?.message_id) {
              tgMsgId = tgRes.result.message_id.toString();
              updates.telegram_message_id = tgMsgId;
            }

            // 4. Social media caption
            const socialCaption = await generateSocialCaption(
              inserted,
              'product',
              productLink,
              false
            );

            // 5. Facebook
            if (META_PAGE_ACCESS_TOKEN) {
              try {
                const fbData = await postToFacebook(socialCaption, prodImages && prodImages.length > 0 ? prodImages : null);
                if (fbData && (fbData.post_id || fbData.id)) {
                  updates.facebook_post_id = fbData.post_id || fbData.id;
                }
              } catch(e) { console.error('[PROD] FB error:', e); }
            }

            // 6. Instagram (only if we have images)
            if (META_IG_ACCOUNT_ID && META_PAGE_ACCESS_TOKEN && mainImage) {
              try {
                const igData = await postToInstagram(socialCaption, prodImages && prodImages.length > 0 ? prodImages : null);
                if (igData && (igData.id || igData.media_id)) {
                  updates.instagram_post_id = igData.id || igData.media_id;
                }
              } catch(e) { console.error('[PROD] IG error:', e); }
            }

            // 7. Threads
            if (THREADS_ACCESS_TOKEN) {
              try {
                const thData = await postToThreads(socialCaption, prodImages && prodImages.length > 0 ? prodImages : null);
                if (thData && thData.id) {
                  updates.threads_post_id = thData.id;
                }
              } catch(e) { console.error('[PROD] Threads error:', e); }
            }

            // 8. Update DB with social IDs
            if (Object.keys(updates).length > 0) {
              await supabase.from('products').update(updates).eq('id', inserted.id);
            }

            // 9. Success message
            const successLines = ['✅ <b>تم نشر إعلان منتجك بنجاح! 🎉</b>\n'];
            if (updates.telegram_message_id) successLines.push('📢 تيليكرام ✅');
            if (updates.facebook_post_id) successLines.push('🔵 فيسبوك ✅');
            if (updates.instagram_post_id) successLines.push('📸 انستكرام ✅');
            if (updates.threads_post_id) successLines.push('🧵 ثريدز ✅');

            await sendMessage(chatId, successLines.join('\n'), {
              inline_keyboard: [
                [{ text: '🛒 عرض إعلانك', url: productLink }],
                [{ text: '📦 نشر منتج آخر', callback_data: 'publish_product' }],
                [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
              ]
            });
          } catch(err: any) {
            console.error('[PROD PUBLISH ERROR]', err);
            await sendMessage(chatId, '❌ حدث خطأ أثناء النشر. يرجى المحاولة مرة أخرى.', { inline_keyboard: [[{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]] });
          }
        })());
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
      // Product Wizard Text Inputs (9-step)
      else if (state.step === 'product_title' && text) {
        if (text.trim().length < 3) {
          await sendMessage(chatId, '⚠️ يرجى كتابة عنوان واضح (على الأقل 3 حروف).', cancelBtn);
          return new Response('OK', { status: 200 });
        }
        state.data.title = text.trim();
        state.step = 'product_category';
        
        // Delete old wizard message
        if (state.data.wizardMsgId) { try { await deleteMessage(chatId, state.data.wizardMsgId); } catch(e) {} }
        
        const res2 = await sendMessage(chatId,
          `<b>الخطوة 2 من 9 — قسم المنتج</b>\n\nاختر <b>القسم</b> المناسب:`,
          {
            inline_keyboard: [
              [{ text: '📱 إلكترونيات', callback_data: 'prod_cat_electronics' }, { text: '👕 أزياء وملابس', callback_data: 'prod_cat_fashion' }],
              [{ text: '🏠 المنزل', callback_data: 'prod_cat_home' }, { text: '🚗 أوتو', callback_data: 'prod_cat_vehicles' }],
              [{ text: '🔄 أخرى', callback_data: 'prod_cat_other' }],
              [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
            ]
          }
        );
        if (res2?.result?.message_id) { state.data.wizardMsgId = res2.result.message_id; }
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
      }
      else if (state.step === 'product_price' && text) {
        const rawNum = text.replace(/[^0-9]/g, '');
        if (!rawNum || parseInt(rawNum) <= 0) {
          await sendMessage(chatId, '⚠️ يرجى كتابة السعر بالأرقام فقط (مثال: 50000).', cancelBtn);
          return new Response('OK', { status: 200 });
        }
        state.data.price = rawNum;
        state.step = 'product_desc';
        
        if (state.data.wizardMsgId) { try { await deleteMessage(chatId, state.data.wizardMsgId); } catch(e) {} }

        const res5 = await sendMessage(chatId,
          `<b>الخطوة 5 من 9 — وصف المنتج</b>\n\nاكتب <b>وصفاً مفصلاً</b> للمنتج (المواصفات، الحالة، أي معلومة مفيدة):`,
          cancelBtn
        );
        if (res5?.result?.message_id) { state.data.wizardMsgId = res5.result.message_id; }
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
      }
      else if (state.step === 'product_desc' && text) {
        state.data.description = text.trim();
        state.step = 'product_gov';
        
        if (state.data.wizardMsgId) { try { await deleteMessage(chatId, state.data.wizardMsgId); } catch(e) {} }

        const res6 = await sendMessage(chatId,
          `<b>الخطوة 6 من 9 — المحافظة</b>\n\nاختر محافظتك:`,
          {
            inline_keyboard: [
              [{ text: '🏠 بغداد', callback_data: 'prod_gov_بغداد' }, { text: '🌊 البصرة', callback_data: 'prod_gov_البصرة' }, { text: '🟙 أربيل', callback_data: 'prod_gov_أربيل' }],
              [{ text: '🏙️ نينوى', callback_data: 'prod_gov_نينوى' }, { text: '📍 كركوك', callback_data: 'prod_gov_كركوك' }, { text: '📌 السليمانية', callback_data: 'prod_gov_السليمانية' }],
              [{ text: '📍 كربلاء', callback_data: 'prod_gov_كربلاء' }, { text: '📍 النجف', callback_data: 'prod_gov_النجف' }, { text: '📍 بابل', callback_data: 'prod_gov_بابل' }],
              [{ text: '📍 ديالى', callback_data: 'prod_gov_ديالى' }, { text: '📍 واسط', callback_data: 'prod_gov_واسط' }, { text: '📍 الأنبار', callback_data: 'prod_gov_الأنبار' }],
              [{ text: '📍 محافظات أخرى 📝', callback_data: 'prod_gov_أخرى' }],
              [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
            ]
          }
        );
        if (res6?.result?.message_id) { state.data.wizardMsgId = res6.result.message_id; }
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
      }
      else if (state.step === 'product_images' && photo) {
        if ((state.data.images || []).length >= 5) {
          await sendMessage(chatId, '⚠️ وصلت للحد الأقصى (5 صور). اضغط «تم ✅» للمتابعة.', {
            inline_keyboard: [[{ text: '✅ تم إرسال الصور', callback_data: 'prod_images_done' }]]
          });
          return new Response('OK', { status: 200 });
        }
        const fileId = photo[photo.length - 1].file_id;
        const fileRes = await fetch(`${tgUrl}/getFile?file_id=${fileId}`);
        const fileData = await fileRes.json();
        if (fileData.ok) {
          const filePath = fileData.result.file_path;
          const imageRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
          const imageBlob = await imageRes.blob();
          const fileName = `prod_${chatId}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}.jpg`;
          const { data: uploadData } = await supabase.storage.from('ad-images').upload(fileName, imageBlob, { contentType: 'image/jpeg' });
          if (uploadData) {
            const { data: pubUrl } = supabase.storage.from('ad-images').getPublicUrl(fileName);
            if (!state.data.images) state.data.images = [];
            state.data.images.push(pubUrl.publicUrl);
            const count = state.data.images.length;
            await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
            const statusText = `📸 <b>تم استلام (${count}) من الصور ✅</b>${count >= 5 ? '\n(وصلت للحد الأقصى)' : ''}\n\nأرسل المزيد أو اضغط «تم ✅» للمتابعة.`;
            if (state.data.statusMsgId) {
              try {
                await editMessageText(chatId, state.data.statusMsgId, statusText, { inline_keyboard: [[{ text: '✅ تم إرسال الصور', callback_data: 'prod_images_done' }]] });
              } catch(e) {
                const r = await sendMessage(chatId, statusText, { inline_keyboard: [[{ text: '✅ تم إرسال الصور', callback_data: 'prod_images_done' }]] });
                if (r?.result?.message_id) state.data.statusMsgId = r.result.message_id;
              }
            } else {
              const r = await sendMessage(chatId, statusText, { inline_keyboard: [[{ text: '✅ تم إرسال الصور', callback_data: 'prod_images_done' }]] });
              if (r?.result?.message_id) state.data.statusMsgId = r.result.message_id;
            }
            await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          }
        }
      }
      else if (state.step === 'product_images' && text) {
        await sendMessage(chatId, '📸 أرسل صورة، أو اضغط «تم ✅» للمتابعة.', {
          inline_keyboard: [[{ text: '✅ تم إرسال الصور', callback_data: 'prod_images_done' }]]
        });
      }
      else if (state.step === 'product_phone' && text) {
        const cleanPhone = text.replace(/[^0-9+]/g, '');
        if (cleanPhone.length < 10) {
          await sendMessage(chatId, '⚠️ يرجى إدخال رقم هاتف صحيح.', cancelBtn);
          return new Response('OK', { status: 200 });
        }
        state.data.phone = cleanPhone;
        state.step = 'product_review';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        const d = state.data;
        const catLabels: Record<string, string> = { electronics: '📱 إلكترونيات', fashion: '👕 أزياء وملابس', home: '🏠 المنزل', vehicles: '🚗 أوتو', other: '🔄 أخرى' };
        const reviewText =
          `🔍 <b>مراجعة أخيرة — الخطوة 9 من 9</b>\n\n` +
          `📌 <b>العنوان:</b> ${d.title || '-'}\n` +
          `📑 <b>القسم:</b> ${catLabels[d.category] || d.category || '-'}\n` +
          `✨ <b>الحالة:</b> ${d.condition || '-'}\n` +
          `💰 <b>السعر:</b> ${Number(String(d.price).replace(/[^0-9]/g, '')).toLocaleString('en-US')} د.ع\n` +
          `📝 <b>الوصف:</b> ${d.description || '-'}\n` +
          `📍 <b>المحافظة:</b> ${d.governorate || '-'}\n` +
          `📸 <b>الصور:</b> ${(d.images || []).length} صورة\n` +
          `📞 <b>الهاتف:</b> ${d.phone || '-'}\n\n` +
          `هل كل شيء صحيح؟ اضغط «✅ نشر الإعلان الآن» للنشر الفوري.`;
        const revMarkup = {
          inline_keyboard: [
            [{ text: '✅ نشر الإعلان الآن 🚀', callback_data: 'prod_confirm_publish' }],
            [{ text: '❌ إلغاء وبدء من جديد', callback_data: 'cancel_wizard' }]
          ]
        };
        const wId = state.data?.wizardMsgId;
        if (wId) { try { await deleteMessage(chatId, wId); } catch(e) {} }
        const resRev = await sendMessage(chatId, reviewText, revMarkup);
        if (resRev?.result?.message_id) {
          state.data.wizardMsgId = resRev.result.message_id;
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        }
      }
      else if (Object.keys(state).length > 0) {
        if (state.step === 'car_images' || state.step === 'product_images') {
          await sendMessage(chatId, '📸 الرجاء <b>إرسال صورة</b>، أو اضغط «تم ✅» للمتابعة.', {
            inline_keyboard: [[{ text: '✅ تم إرسال الصور', callback_data: state.step === 'product_images' ? 'prod_images_done' : 'car_images_done' }]]
          });
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
          const caption = update?.message?.caption || null;
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
