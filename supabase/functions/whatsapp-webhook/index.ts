import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const WHATSAPP_VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "souqbaghdad_secret_token";
const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN") ?? "";
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// إرسال رسالة عبر WhatsApp Cloud API مع دعم الصور الترحيبية الاحترافية والـ OTP
const sendWhatsAppMessage = async (to: string, text: string, imageUrl?: string) => {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.log("WhatsApp Credentials missing.");
    return;
  }
  const url = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  // إذا تم توفير صورة
  if (imageUrl) {
    await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "image",
        image: {
          link: imageUrl,
          caption: text
        }
      })
    });
    return;
  }

  // إرسال نص عادي
  await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "text",
      text: { body: text }
    })
  });
};

serve(async (req) => {
  try {
    const url = new URL(req.url);

    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
      }
      return new Response("Forbidden", { status: 403 });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (message) {
        const fromNumber = message.from; // رقم هاتف العميل
        const textBody = (message.text?.body || "").trim();

        // 1. ميزة استعادة كلمة السر عبر رمز التحقق (OTP)
        if (textBody.includes("كلمة السر") || textBody.includes("رمز") || textBody.includes("نسيت") || textBody.includes("OTP")) {
          // استخراج وتنسيق رقم الهاتف المحلي 07x
          let formattedPhone = fromNumber.replace(/^\+964/, "0").replace(/^964/, "0");
          
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, full_name")
            .or(`phone.eq.${formattedPhone},phone.eq.${fromNumber}`)
            .maybeSingle();

          if (profile) {
            // توليد رمز OTP مكون من 6 أرقام
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

            // تعيين الرمز ككلمة مرور جديدة للمستخدم عبر Admin API
            await supabase.auth.admin.updateUserById(profile.id, { password: otpCode });

            const otpReply = 
`🔐 **رمز تفعيل واستعادة كلمة السر - سوق بغداد**

أهلاً بك يا ${profile.full_name}! 👋
رمز التفعيل (OTP) الخاص بحسابك هو:

🔑 *${otpCode}*

يمكنك استخدام هذا الرمز فوراً لتسجيل الدخول إلى حسابك في الموقع: https://souqbaghdad.store
⚠️ لا تشارك هذا الرمز مع أي شخص لحماية حسابك.`;

            await sendWhatsAppMessage(fromNumber, otpReply);
            return new Response("EVENT_RECEIVED", { status: 200 });
          } else {
            const notFoundMsg = "عذراً عيوني 🙏 رقم الهاتف هذا غير مسجل لدينا في منصة سوق بغداد. يمكنك إنشاء حساب جديد مجاناً عبر الموقع: https://souqbaghdad.store";
            await sendWhatsAppMessage(fromNumber, notFoundMsg);
            return new Response("EVENT_RECEIVED", { status: 200 });
          }
        }

        // 2. الرد الاحترافي الترحيبي والتفاعل بـ AI Engine
        const logoUrl = "https://souqbaghdad.store/favicon.ico"; // شعار سوق بغداد الرسمي

        const aiRes = await fetch(`${SUPABASE_URL}/functions/v1/ai-engine`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            action: "process_message",
            platform: "whatsapp",
            sender_id: fromNumber,
            text: textBody
          })
        });

        const aiData = await aiRes.json();

        if (aiData.reply) {
          const profReply = `🛍️ **سوق بغداد — الموظف الرقمي الاحترافي**\n\n${aiData.reply}\n\n🌐 souqbaghdad.store`;
          
          // إذا كان أول تواصل أو رسالة ترحيبية نرسل الشعار الرسمي
          if (textBody.toLowerCase() === "مرحبا" || textBody.toLowerCase() === "هلا" || textBody === "/start") {
            await sendWhatsAppMessage(fromNumber, profReply, logoUrl);
          } else {
            await sendWhatsAppMessage(fromNumber, profReply);
          }
        }

        // عرض نتائج البحث بطريقة احترافية
        if (aiData.searchResults && aiData.searchResults.length > 0) {
          for (const item of aiData.searchResults) {
            const itemUrl = `https://souqbaghdad.store/product/${item.short_id || item.id}`;
            const card = `📌 **${item.title}**\n💰 السعر: ${item.price || 'غير محدد'} د.ع\n📍 الموقع: ${item.location || item.city || 'بغداد'}\n\n🔗 التفاصيل والطلب المباشر:\n${itemUrl}`;
            
            if (item.images && item.images.length > 0) {
              await sendWhatsAppMessage(fromNumber, card, item.images[0]);
            } else {
              await sendWhatsAppMessage(fromNumber, card);
            }
          }
        }
      }

      return new Response("EVENT_RECEIVED", { status: 200 });
    }

    return new Response("Method Not Allowed", { status: 405 });
  } catch (error: any) {
    console.error("WhatsApp Webhook Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
