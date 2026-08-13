import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BOT_TOKEN = Deno.env.get("BOT_TOKEN") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const sendTelegramMessage = async (chatId: string, text: string) => {
  if (!BOT_TOKEN) return;
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text, disable_web_page_preview: true })
  });
};

serve(async (req) => {
  try {
    const payload = await req.json();

    // عند إضافة إعلان جديد، تفحص تنبيهات البحث المطابقة
    if (payload.type === "INSERT" && payload.table === "ads" && payload.record) {
      const ad = payload.record;

      // 1. جلب تنبيهات البحث النشطة
      const { data: alerts } = await supabase
        .from("search_alerts")
        .select("*")
        .eq("is_active", true);

      if (alerts && alerts.length > 0) {
        for (const alert of alerts) {
          const queryMatch = alert.query ? ad.title.toLowerCase().includes(alert.query.toLowerCase()) : true;
          const priceMatch = alert.max_price ? ad.price <= alert.max_price : true;

          if (queryMatch && priceMatch) {
            const notifMsg = `🔔 **تنبيه إعلان جديد يطابق بحثك!**\n\n📌 ${ad.title}\n💰 السعر: ${ad.price || 'غير محدد'} د.ع\n📍 ${ad.location || ad.city || 'بغداد'}\n\n🔗 شاهد الإعلان الآن:\nhttps://souqbaghdad.store/product/${ad.short_id || ad.id}`;
            await sendTelegramMessage(alert.sender_id, notifMsg);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    console.error("Error sending smart notifications:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
