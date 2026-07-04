const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://lyhqnccpudwgvexqinxa.supabase.co";
const SUPABASE_KEY = "sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BOT_TOKEN = "8886561538:AAGM68k1ljmvNgRF5IafMo6Kip3VI1g1rzg";
const TRANSPORT_CHANNEL = "-1001437356679";
const GENERAL_CHANNEL = "-1004381673206";
const SITE_URL = "https://souqbaghdad.com";

const formatTransportAd = (ad) => {
  const typeText = ad.type === 'offer' ? 'متوفر جديد' : 'مطلوب';
  return `🚌 خط نقل ${typeText} في سوق بغداد\n\n` +
         `📍 المناطق: ${ad.regions || ad.location || ''}\n` +
         `🏛 الجامعة: ${ad.university || ad.city || ''}\n` +
         `🕐 الدوام: ${ad.shift || 'غير محدد'}\n` +
         `💰 السعر: ${ad.price} دينار\n\n` +
         `📞 التواصل: عبر الموقع فقط\n` +
         `نشجعك تطلب مباشرة عبر الموقع 👇\n` +
         `🔗 ${SITE_URL}/?tab=lines`;
};

const formatGeneralAd = (ad) => {
  return `🛍️ إعلان — ${ad.category}\n\n` +
         `📌 ${ad.title}\n` +
         `📍 ${ad.city} — ${ad.location}\n` +
         `💰 ${ad.price} دينار\n\n` +
         `🔗 شاهد الإعلان كاملاً:\n` +
         `${SITE_URL}`;
};

const sendTelegramMessage = async (chatId, text, retries = 3) => {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text }),
      });
      const data = await response.json();
      if (!data.ok) console.error("Telegram API Error:", data);
      return data.ok;
    } catch (e) {
      console.error(`Fetch failed, retrying (${i+1}/${retries})...`, e.message);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return false;
};

const sendTelegramPhoto = async (chatId, photoUrl, caption, retries = 3) => {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption: caption }),
      });
      const data = await response.json();
      if (!data.ok) console.error("Telegram API Error:", data);
      return data.ok;
    } catch (e) {
      console.error(`Fetch failed, retrying (${i+1}/${retries})...`, e.message);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return false;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log("Fetching old general ads...");
  
  // 1. Fetch transport ads - SKIPPED
  
  // 2. Fetch general ads
  const { data: generalAds, error: err2 } = await supabase
    .from('ads')
    .select('*')
    .neq('category', 'transport')
    .neq('category', 'notification')
    .order('created_at', { ascending: true });
    
  if (err2) console.error("Error fetching general ads:", err2);
  else if (generalAds) {
    console.log(`Found ${generalAds.length} general ads.`);
    for (const ad of generalAds) {
      const text = formatGeneralAd(ad);
      if (ad.images && ad.images.length > 0) {
        await sendTelegramPhoto(GENERAL_CHANNEL, ad.images[0], text);
      } else {
        await sendTelegramMessage(GENERAL_CHANNEL, text);
      }
      console.log(`Sent general ad: ${ad.id}`);
      await sleep(1500);
    }
  }

  // 3. Fetch products - SKIPPED
  
  console.log("Done publishing old general ads!");
}

main();
