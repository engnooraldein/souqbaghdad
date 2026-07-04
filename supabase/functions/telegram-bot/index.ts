import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BOT_TOKEN = Deno.env.get("BOT_TOKEN") ?? "8886561538:AAGM68k1ljmvNgRF5IafMo6Kip3VI1g1rzg";
const TRANSPORT_CHANNEL = Deno.env.get("TRANSPORT_CHANNEL") ?? "-1001437356679";
const GENERAL_CHANNEL = Deno.env.get("GENERAL_CHANNEL") ?? "-1004381673206";
const SITE_URL = "https://souqbaghdad.com";

const formatTransportAd = (ad: any) => {
  let desc: any = {};
  try {
    desc = JSON.parse(ad.description || '{}');
  } catch (e) {}

  const typeText = ad.type === 'offer' ? 'متوفر جديد (صاحب خط)' : 'مطلوب (أبحث عن خط)';
  const categoryType = desc.categoryType === 'employee' ? '👔 خط موظفين' : '🎓 خط طلاب';
  
  return `🚌 ${categoryType} - ${typeText}\n\n` +
         `📍 المناطق: ${ad.location || ''}\n` +
         (desc.categoryType === 'employee' ? `🏢 الوجهة: ${ad.city || ''}\n` : `🏛 الجامعة: ${ad.city || ''}\n`) +
         `🕒 الدوام: ${desc.shift || 'غير محدد'}\n` +
         (desc.vehicleType ? `🚗 المركبة: ${desc.vehicleType}\n` : '') +
         `💰 السعر: ${ad.price && ad.price !== '0' ? ad.price + ' دينار' : 'غير محدد'}\n\n` +
         `📞 التواصل: عبر الموقع فقط\n` +
         `نشجعك تطلب مباشرة عبر الموقع 👇\n` +
         `🔗 https://www.souqbaghdad.store/transport`;
};

const formatGeneralAd = (ad: any) => {
  return `🛍️ إعلان جديد — ${ad.category}\n\n` +
         `📌 ${ad.title}\n` +
         `📍 ${ad.city} — ${ad.location}\n` +
         `💰 ${ad.price} دينار\n\n` +
         `🔗 شاهد الإعلان كاملاً:\n` +
         `https://www.souqbaghdad.store`;
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
  }
};

const sendTelegramPhoto = async (chatId: string, photoUrl: string, caption: string) => {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption: caption }),
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
          await sendTelegramMessage(TRANSPORT_CHANNEL, formatTransportAd(payload.record));
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
