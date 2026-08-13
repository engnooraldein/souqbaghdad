import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = (Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) ?? "";
const FB_VERIFY_TOKEN = Deno.env.get("FB_VERIFY_TOKEN") ?? "souqbaghdad_secret_token";
const FB_PAGE_ACCESS_TOKEN = Deno.env.get("FB_PAGE_ACCESS_TOKEN") ?? "";
const ADMIN_CHAT_ID = Deno.env.get("ADMIN_CHAT_ID") ?? "777557036";
const BOT_TOKEN = Deno.env.get("BOT_TOKEN") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// إرسال رسالة عبر Facebook Messenger
const sendMessengerMessage = async (recipientId: string, text: string) => {
  if (!FB_PAGE_ACCESS_TOKEN) return;
  const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${FB_PAGE_ACCESS_TOKEN}`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: text }
    })
  });
};

// الرد على التعليقات أو الرسائل
const replyToFBComment = async (commentId: string, message: string) => {
  if (!FB_PAGE_ACCESS_TOKEN) return;
  const url = `https://graph.facebook.com/v18.0/${commentId}/comments?access_token=${FB_PAGE_ACCESS_TOKEN}`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: message })
  });
};

// إرسال تنبيه للأدمن على تيليكرام
const notifyAdminTelegram = async (text: string) => {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) return;
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: text })
  });
};

serve(async (req) => {
  try {
    const url = new URL(req.url);

    // 1. Meta Webhook Verification (GET Request)
    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === FB_VERIFY_TOKEN) {
        console.log("Meta Webhook Verified!");
        return new Response(challenge, { status: 200 });
      }
      return new Response("Forbidden", { status: 403 });
    }

    // 2. Incoming Meta Webhook Event (POST Request)
    if (req.method === "POST") {
      const body = await req.json();
      console.log("Received Meta Webhook:", JSON.stringify(body));

      if (body.object === "page" || body.object === "instagram") {
        for (const entry of body.entry) {
          // --- التعامل مع رسائل Messenger و Instagram DM ---
          if (entry.messaging) {
            for (const messagingEvent of entry.messaging) {
              const senderId = messagingEvent.sender.id;

              if (messagingEvent.message && messagingEvent.message.text) {
                const userText = messagingEvent.message.text.trim();

                // معالجة الرسالة في AI Engine المشترك
                const aiRes = await fetch(`${SUPABASE_URL}/functions/v1/ai-engine`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                  },
                  body: JSON.stringify({
                    action: "process_message",
                    platform: body.object === "instagram" ? "instagram" : "facebook",
                    sender_id: senderId,
                    text: userText
                  })
                });

                const aiData = await aiRes.json();

                if (aiData.reply) {
                  await sendMessengerMessage(senderId, aiData.reply);
                }

                // إذا كانت هناك نتائج بحث
                if (aiData.searchResults && aiData.searchResults.length > 0) {
                  for (const item of aiData.searchResults) {
                    const itemUrl = `https://souqbaghdad.store/product/${item.short_id || item.id}`;
                    await sendMessengerMessage(
                      senderId,
                      `📌 ${item.title}\n💰 السعر: ${item.price} د.ع\n📍 ${item.location || 'بغداد'}\n🔗 ${itemUrl}`
                    );
                  }
                }
              }
            }
          }

          // --- التعامل مع التعليقات الأوتوماتيكية (Comment Automation) ---
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.field === "feed" || change.field === "comments") {
                const val = change.value;
                const commentId = val.comment_id || val.id;
                const commentText = (val.message || "").toLowerCase().trim();
                const fromId = val.from?.id;

                if (!commentText || !commentId) continue;

                // 1. الكلمات المحفزة للرابط
                if (["رابط", "وين", "لنك", "لينك", "موقع"].some(k => commentText.includes(k))) {
                  await replyToFBComment(commentId, "تم إرسال التفاصيل والفيسبوك/الموقع على الخاص 📩");
                  if (fromId) {
                    await sendMessengerMessage(fromId, "أهلاً بك! 👋 إليك رابط المعاينة المباشرة: https://souqbaghdad.store");
                  }
                }
                // 2. الكلمات المحفزة للسعر
                else if (["بكم", "شكد", "السعر", "سعر"].some(k => commentText.includes(k))) {
                  await replyToFBComment(commentId, "أهلاً بك! السعر موضح بالإعلان، ويمكنك مشاهدة أفضل الأسعار المتاحة عبر منصة سوق بغداد 🏷️");
                }
                // 3. التوفر
                else if (["متوفر", "موجود"].some(k => commentText.includes(k))) {
                  await replyToFBComment(commentId, "نعم متوفر ✅ تواصل مباشرة مع البائع عبر الرابط بالخاص 📩");
                }
                // 4. البلاغات والاحتيال
                else if (["نصاب", "احتيال", "كذب", "حرامي"].some(k => commentText.includes(k))) {
                  await replyToFBComment(commentId, "نحن نأخذ البلاغات بجدية عالية 🙏 سيقوم فريق الإدارة بمراجعة الإعلان فوراً.");
                  await notifyAdminTelegram(`🚨 **تنبيه تعليق مشبوه/شكوى على الفيسبوك!**\n\n💬 التعليق: "${commentText}"\n🆔 المعرف: ${commentId}`);
                }
              }
            }
          }
        }
      }

      return new Response("EVENT_RECEIVED", { status: 200 });
    }

    return new Response("Method Not Allowed", { status: 405 });
  } catch (error: any) {
    console.error("Error in meta-webhook edge function:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
