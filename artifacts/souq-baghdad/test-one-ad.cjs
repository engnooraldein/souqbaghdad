const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://lyhqnccpudwgvexqinxa.supabase.co";
const SUPABASE_KEY = "sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BOT_TOKEN = "8886561538:AAGM68k1ljmvNgRF5IafMo6Kip3VI1g1rzg";
const TRANSPORT_CHANNEL = "-1001437356679";

const formatTransportAd = (ad) => {
  let desc = {};
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

const sendTelegramMessage = async (chatId, text) => {
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
  return data.ok;
};

async function testAd() {
  // Get the most recent transport ad (or specifically an employee one if possible)
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .eq('category', 'transport')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    console.error("Could not fetch ad:", error);
    return;
  }

  const text = formatTransportAd(data[0]);
  console.log("Sending text:\n", text);
  await sendTelegramMessage(TRANSPORT_CHANNEL, text);
  console.log("Sent successfully!");
}

testAd();
