import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const META_VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'souqbaghdad_secret_123';
const META_PAGE_ACCESS_TOKEN = Deno.env.get('META_PAGE_ACCESS_TOKEN') || '';

serve(async (req) => {
  const url = new URL(req.url);
  
  // 1. Webhook Verification (GET request)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
      console.log('Webhook Verified!');
      return new Response(challenge, { status: 200 });
    } else {
      return new Response('Forbidden', { status: 403 });
    }
  }

  // 2. Webhook Event Processing (POST request)
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('Received Webhook:', JSON.stringify(body, null, 2));

      if (body.object === 'page' || body.object === 'instagram') {
        const entries = body.entry || [];
        
        for (const entry of entries) {
          // Handle Messenger & IG Direct Messages
          if (entry.messaging) {
            for (const event of entry.messaging) {
               if (event.message && event.message.text && !event.message.is_echo) {
                 await processDirectMessage(event.sender.id, event.message.text);
               }
            }
          }

          const changes = entry.changes || [];
          
          for (const change of changes) {
            const value = change.value;
            
            // Handle Facebook Comments
            if (change.field === 'feed' && value.item === 'comment' && value.verb === 'add') {
              const commentText = value.message || '';
              const commentId = value.comment_id;
              const postId = value.post_id;
              // Prevent bot from replying to its own comments
              if (value.from?.id === entry.id) continue;
              
              if (commentText.includes('تم') || commentText.includes('رابط') || commentText.includes('تفاصيل') || commentText.includes('السعر') || commentText.includes('بكم') || commentText.includes('شكد')) {
                await processFacebookComment(postId, commentId);
              }
            }
            
            // Handle Instagram Comments
            if (change.field === 'comments' && value.media_id) {
              const commentText = value.text || '';
              const commentId = value.id;
              const mediaId = value.media_id;
              // Prevent bot from replying to itself
              if (value.from?.id === entry.id) continue;
              
              if (commentText.includes('تم') || commentText.includes('رابط') || commentText.includes('تفاصيل') || commentText.includes('السعر') || commentText.includes('بكم') || commentText.includes('شكد')) {
                await processInstagramComment(mediaId, commentId);
              }
            }
          }
        }
        return new Response('EVENT_RECEIVED', { status: 200 });
      } else {
        return new Response('Not Found', { status: 404 });
      }
    } catch (err) {
      console.error('Error processing webhook:', err);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
});

async function findAdByPostId(postId: string, platform: 'facebook' | 'instagram') {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const colName = platform === 'facebook' ? 'facebook_post_id' : 'instagram_post_id';
  
  // Check products
  let { data } = await supabase.from('products').select('id, short_id, title, price, seller_name').eq(colName, postId).limit(1).single();
  if (data) return { ...data, link: `https://www.souqbaghdad.store/product/${data.short_id || data.id}` };
  
  // Check ads
  ({ data } = await supabase.from('ads').select('id, short_id, title, price, seller_name').eq(colName, postId).limit(1).single());
  if (data) return { ...data, link: `https://www.souqbaghdad.store/card/${data.short_id || data.id}` };
  
  // Check transport_ads
  ({ data } = await supabase.from('transport_ads').select('id, short_id, title, price, seller_name, categoryType').eq(colName, postId).limit(1).single());
  if (data) return { ...data, link: `https://www.souqbaghdad.store/transport/card/${data.short_id || data.id}` };
  
  return null;
}

function formatTgPrice(val: any): string {
  if (!val) return 'حسب الاتفاق';
  let str = String(val).trim();
  const rawNum = str.replace(/[^\d]/g, '');
  if (!rawNum) return str;
  let num = parseInt(rawNum, 10);
  if (!isNaN(num) && num > 0 && num < 1000) {
    num = num * 1000;
  }
  return isNaN(num) ? str : `${num.toLocaleString('en-US')} د.ع`;
}

async function processFacebookComment(postId: string, commentId: string) {
  const ad = await findAdByPostId(postId, 'facebook');
  if (!ad) return;

  const msg = `أهلاً بك! 👋\nلقد طلبت تفاصيل الإعلان: "${ad.title || ad.categoryType || ''}"\n💰 السعر: ${formatTgPrice(ad.price)}\n\nللتواصل مع المعلن ومعرفة باقي التفاصيل، ادخل للرابط التالي:\n🔗 ${ad.link}\n\nنتمنى لك التوفيق! 🚀`;

  // 1. Send Private Reply (DM)
  try {
    await fetch(`https://graph.facebook.com/v20.0/${commentId}/private_replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg,
        access_token: META_PAGE_ACCESS_TOKEN
      })
    });
  } catch (e) {
    console.error('FB Private Reply Error:', e);
  }

  // 2. Public Reply to comment
  try {
    await fetch(`https://graph.facebook.com/v20.0/${commentId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'تم الرد على الخاص مع الرابط والتفاصيل 📩',
        access_token: META_PAGE_ACCESS_TOKEN
      })
    });
  } catch (e) {
    console.error('FB Public Reply Error:', e);
  }
}

async function processInstagramComment(mediaId: string, commentId: string) {
  const ad = await findAdByPostId(mediaId, 'instagram');
  if (!ad) return;

  const msg = `أهلاً بك! 👋\nلقد طلبت تفاصيل الإعلان: "${ad.title || ad.categoryType || ''}"\n💰 السعر: ${formatTgPrice(ad.price)}\n\nللتواصل مع المعلن ومعرفة باقي التفاصيل، ادخل للرابط التالي:\n🔗 ${ad.link}\n\nنتمنى لك التوفيق! 🚀`;

  // 1. Reply to comment publicly
  try {
    await fetch(`https://graph.facebook.com/v20.0/${commentId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'تم الرد على الخاص 📩',
        access_token: META_PAGE_ACCESS_TOKEN
      })
    });
  } catch (e) {
    console.error('IG Public Reply Error:', e);
  }

  // 2. IG Private Reply
  try {
    const igAccountId = Deno.env.get('META_IG_ACCOUNT_ID');
    if (igAccountId) {
      await fetch(`https://graph.facebook.com/v20.0/${igAccountId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${META_PAGE_ACCESS_TOKEN}` },
        body: JSON.stringify({
          recipient: { comment_id: commentId },
          message: { text: msg }
        })
      });
    }
  } catch (e) {
    console.error('IG Private Reply Error:', e);
  }
}

async function callGemini(prompt: string): Promise<string | null> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) return null;
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const systemInstruction = `أنت موظف خدمة عملاء ذكي لمنصة "سوق بغداد الرقمي" وتتحدث باللهجة العراقية اللطيفة والودية.
المنصة مجانية بالكامل.
إذا احتاج المستخدم تفاصيل أكثر أو طلب التواصل مع الإدارة، أخبره أن يراسلنا على تيليكرام: rucno f
الروابط الهامة التي يمكنك تقديمها:
- الموقع: https://www.souqbaghdad.store
- النشر: https://www.souqbaghdad.store/publish`;

    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 250,
      }
    };
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    console.error('Gemini error:', err);
    return null;
  }
}

async function processDirectMessage(senderId: string, text: string) {
  const replyText = await callGemini(text) || 'عذراً، لا أستطيع الرد حالياً. يرجى مراسلتنا على تيليكرام: rucno f';

  try {
    await fetch(`https://graph.facebook.com/v20.0/me/messages`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${META_PAGE_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        recipient: { id: senderId },
        message: { text: replyText }
      })
    });
  } catch (e) {
    console.error('Send DM Error:', e);
  }
}

