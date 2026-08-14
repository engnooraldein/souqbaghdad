const URL = "https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/telegram-bot";
const KEY = "sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf";

const payload = {
  type: "INSERT",
  table: "ads",
  schema: "public",
  record: {
    id: "test-meta-ad-" + Math.floor(Math.random() * 100000),
    short_id: "tm" + Math.floor(Math.random() * 10000),
    title: "إعلان تجريبي - فيسبوك وانستغرام وتيك توك",
    description: "هذا الإعلان لتجربة النشر التلقائي عبر المنصات. يرجى التجاهل.",
    price: 1500,
    seller_name: "تجربة النظام",
    category: "other",
    images: ["https://souqbaghdad.store/opengraph.jpg"],
    status: "active",
    sync_status: { facebook: 'pending', instagram: 'pending', telegram: 'pending', tiktok: 'pending' },
    created_at: new Date().toISOString()
  },
  targets: {
    facebook: true,
    instagram: true,
    telegram: false,
    tiktok: true
  }
};

fetch(URL, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
})
.then(async res => {
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
})
.catch(err => console.error(err));
