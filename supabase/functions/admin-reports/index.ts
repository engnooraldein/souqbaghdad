import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = (Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) ?? "";
const BOT_TOKEN = Deno.env.get("BOT_TOKEN") ?? "";
const ADMIN_CHAT_ID = Deno.env.get("ADMIN_CHAT_ID") ?? "777557036";

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
    console.log("Generating Admin Daily Report...");

    const today = new Date().toISOString().split("T")[0];

    // 1. عدد إعلانات اليوم
    const { count: adsCount } = await supabase
      .from("ads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${today}T00:00:00.000Z`);

    // 2. عدد المستخدمين الجدد
    const { count: usersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${today}T00:00:00.000Z`);

    // 3. المحادثات التي أجراها البوت
    const { count: botMsgsCount } = await supabase
      .from("bot_conversations")
      .select("*", { count: "exact", head: true })
      .gte("updated_at", `${today}T00:00:00.000Z`);

    // 4. الشكاوى اليومية
    const { count: complaintsCount } = await supabase
      .from("support_messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${today}T00:00:00.000Z`);

    const reportText = 
`📊 **تقرير اليوم الشامل - سوق بغداد 🇮🇶**
━━━━━━━━━━━━━━━━━━
👥 مستخدمون جدد: ${usersCount || 0}
📦 إعلانات منشورة: ${adsCount || 0}
🤖 محادثات البوت الرقمي: ${botMsgsCount || 0}
⚠️ شكاوى واستفسارات واردة: ${complaintsCount || 0}

🏆 **حالة النظام:** يعمل بكفاءة عالية 24/7 ✅
🔗souqbaghdad.store`;

    await sendTelegramMessage(ADMIN_CHAT_ID, reportText);

    return new Response(JSON.stringify({ success: true, report: reportText }), { status: 200 });
  } catch (err: any) {
    console.error("Error generating admin report:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
