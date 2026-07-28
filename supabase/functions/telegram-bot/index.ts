import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const BOT_TOKEN = Deno.env.get("BOT_TOKEN") ?? "8886561538:AAGM68k1ljmvNgRF5IafMo6Kip3VI1g1rzg";
const TRANSPORT_CHANNEL = Deno.env.get("TRANSPORT_CHANNEL") ?? "-1001437356679";
const GENERAL_CHANNEL = Deno.env.get("GENERAL_CHANNEL") ?? "-1004381673206";
const SITE_URL = "https://souqbaghdad.com";

const formatPriceWithCommas = (price: any) => {
  if (!price || price === '0' || price === 0) return 'غير محدد';
  const priceStr = String(price);
  const rawNum = priceStr.replace(/[^\d]/g, '');
  if (!rawNum) return `${priceStr}`;
  const num = parseInt(rawNum, 10);
  if (isNaN(num)) return `${priceStr}`;
  const formatted = num.toLocaleString('en-US');
  return `${formatted} الف دينار عراقي`;
};

const formatTransportAd = (ad: any) => {
  let desc: any = {};
  try {
    desc = JSON.parse(ad.description || '{}');
  } catch (e) {}

  const isOwner = ad.type === 'offer';
  const ownerHeader = isOwner ? '(صاحب خط)' : '(أبحث عن خط)';
  
  const categoryType = desc.categoryType === 'employee' 
    ? '👔 خط موظفين' 
    : desc.categoryType === 'emergency'
    ? '🚗 خط طوارئ'
    : '🎓 خط طلاب';
  
  const statusText = isOwner ? 'متوفر جديد' : 'مطلوب جديد';
  
  const itemId = ad.short_id || ad.id;
  const detailUrl = `https://www.souqbaghdad.store/transport/card/${itemId}`;

  return `${ownerHeader}\n` +
         `${categoryType} - ${statusText}\n\n` +
         `📍 المناطق: ${ad.location || ''}\n` +
         (desc.categoryType === 'employee' ? `🏢 الوجهة: ${ad.city || ''}\n` : `🏛 الجامعة: ${ad.city || ''}\n`) +
         `🕒 الدوام: ${desc.shift || 'غير محدد'}\n` +
         (desc.vehicleType ? `🚗 المركبة: ${desc.vehicleType}\n` : '') +
         `💰 السعر: ${formatPriceWithCommas(ad.price)}\n\n` +
         `📞 التواصل: عبر الموقع فقط\n` +
         `نشجعك تطلب مباشرة عبر الموقع 👇\n` +
         `🔗 ${detailUrl}`;
};

const formatGeneralAd = (ad: any, table: string = 'ads') => {
  const itemId = ad.short_id || ad.id;
  const typePath = table === 'products' ? 'product' : 'ad';
  const detailUrl = `https://www.souqbaghdad.store/${typePath}/${itemId}`;

  return `🛍️ إعلان جديد — ${ad.category || 'عام'}\n\n` +
         `📌 ${ad.title}\n` +
         (ad.city || ad.location ? `📍 ${ad.city || ''} ${ad.location ? '— ' + ad.location : ''}\n` : '') +
         `💰 السعر: ${formatPriceWithCommas(ad.price)}\n\n` +
         `🔗 شاهد الإعلان كاملاً:\n` +
         `${detailUrl}`;
};

const sendTelegramMessage = async (chatId: string, text: string) => {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      chat_id: chatId, 
      text: text,
      disable_web_page_preview: true
    }),
  });
  const data = await response.json();
  if (!data.ok) {
    console.error("Telegram API Error:", data);
    return null;
  }
  return data.result?.message_id;
};

const deleteTelegramMessage = async (chatId: string, messageId: number) => {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId })
  });
  const data = await response.json();
  if (!data.ok) console.error("Telegram API Error on delete:", data);
};

const sendTelegramPhoto = async (chatId: string, photoUrl: string, caption: string) => {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      chat_id: chatId, 
      photo: photoUrl, 
      caption: caption,
      disable_web_page_preview: true
    }),
  });
  const data = await response.json();
  if (!data.ok) {
    console.error("Telegram API Error:", data);
  }
};

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Received Webhook Payload:", JSON.stringify(payload));

    if (payload.type === "INSERT" && payload.record) {
      if (payload.table === "ads") {
        if (payload.record.category === "transport") {
          const msgId = await sendTelegramMessage(TRANSPORT_CHANNEL, formatTransportAd(payload.record));
          if (msgId) {
            let desc: any = {};
            try { desc = JSON.parse(payload.record.description || '{}'); } catch(e) {}
            desc.telegram_msg_id = msgId;
            await supabase.from('ads').update({ description: JSON.stringify(desc) }).eq('id', payload.record.id);
          }
        } else if (payload.record.category !== "notification") {
          const ad = payload.record;
          const text = formatGeneralAd(ad);
          
          if (ad.images && ad.images.length > 0) {
            await sendTelegramPhoto(GENERAL_CHANNEL, ad.images[0], text);
          } else {
            await sendTelegramMessage(GENERAL_CHANNEL, text);
          }
        }
      } else if (payload.table === "products") {
        const ad = payload.record;
        const text = formatGeneralAd(ad);
        
        if (ad.images && ad.images.length > 0) {
          await sendTelegramPhoto(GENERAL_CHANNEL, ad.images[0], text);
        } else {
          await sendTelegramMessage(GENERAL_CHANNEL, text);
        }
      } else if (payload.table === "support_messages") {
        const ADMIN_CHAT_ID = Deno.env.get("ADMIN_CHAT_ID") ?? "777557036";
        const msg = payload.record;
        let decodedMessage = msg.message;
        try {
          const parsed = JSON.parse(msg.message);
          decodedMessage = `بلاغ بخصوص: ${parsed.item_type} - ${parsed.item_id}\nالسبب: ${parsed.reason}`;
        } catch(e) {}
        
        const text = `💬 رسالة دعم / بلاغ:\n\n` +
                     `👤 من: ${msg.name}\n` +
                     `📞 تواصل: ${msg.contact_info}\n\n` +
                     `📝 النص:\n${decodedMessage}\n\n` +
                     `---\n` +
                     `💡 للرد على المستخدم عبر الموقع، قم بالرد (Reply) على هذه الرسالة واكتب ردك.\n` +
                     `#id_${msg.id.replace(/-/g, '_')}`; // Telegram hashtags don't support hyphens
        await sendTelegramMessage(ADMIN_CHAT_ID, text);
      }
    } else if (payload.type === "UPDATE" && payload.record) {
      if (payload.table === "ads" && payload.record.category === "transport") {
        const oldStatus = payload.old_record?.status;
        const newStatus = payload.record.status;
        
        if (newStatus === "matched" && oldStatus !== "matched") {
          let desc: any = {};
          try { desc = JSON.parse(payload.record.description || '{}'); } catch(e) {}
          const msgId = desc.telegram_msg_id;
          if (msgId) {
            await deleteTelegramMessage(TRANSPORT_CHANNEL, msgId);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
