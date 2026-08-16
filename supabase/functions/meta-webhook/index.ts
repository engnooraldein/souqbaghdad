import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = (Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) ?? "";

// قراءة بيانات Meta بدعم كافة أسماء المتغيرات
const META_PAGE_ACCESS_TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN") || Deno.env.get("FB_PAGE_ACCESS_TOKEN") || "";
const META_VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN") || Deno.env.get("FB_VERIFY_TOKEN") || "souqbaghdad_secret_token";
const META_PAGE_ID = Deno.env.get("META_PAGE_ID") || "";
const META_IG_ACCOUNT_ID = Deno.env.get("META_IG_ACCOUNT_ID") || "";

const ALRAFDAIN_FB_TOKEN = Deno.env.get("ALRAFDAIN_FB_TOKEN") || "";
const ALRAFDAIN_FB_PAGE_ID = Deno.env.get("ALRAFDAIN_FB_PAGE_ID") || "102975411515668";
const ALRAFDAIN_IG_ID = Deno.env.get("ALRAFDAIN_IG_ID") || "17841404181680155";

function resolveAccessToken(entryId: string) {
  if ((ALRAFDAIN_FB_PAGE_ID && entryId === ALRAFDAIN_FB_PAGE_ID) || 
      (ALRAFDAIN_IG_ID && entryId === ALRAFDAIN_IG_ID)) {
    return ALRAFDAIN_FB_TOKEN || META_PAGE_ACCESS_TOKEN;
  }
  return META_PAGE_ACCESS_TOKEN;
}

// بيانات تيليكرام للتنبيهات
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || Deno.env.get("BOT_TOKEN") || "";
const ADMIN_CHAT_ID = Deno.env.get("ADMIN_CHAT_ID") || "777557036";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── 1. إرسال رسالة نصية (Facebook Messenger / Instagram DM) ──
const sendMetaMessage = async (recipientId: string, text: string, token: string) => {
  if (!token) {
    console.error("Access token is missing!");
    return;
  }
  const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: text }
      })
    });
    if (!res.ok) {
      console.error("Send Meta Message Error:", await res.text());
    } else {
      console.log(`Successfully sent message to ${recipientId}`);
    }
  } catch (e) {
    console.error("sendMetaMessage exception:", e);
  }
};

// ── 2. الرد على تعليق في فيسبوك (Facebook Comment Reply) ──
const replyToFacebookComment = async (commentId: string, message: string, token: string) => {
  if (!token) return;
  const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(commentId)}/comments?access_token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message })
    });
    if (!res.ok) {
      console.error("Facebook Comment Reply Error:", await res.text());
    } else {
      console.log(`Successfully replied to FB comment ${commentId}`);
    }
  } catch (e) {
    console.error("replyToFacebookComment exception:", e);
  }
};

// ── 3. الرد على تعليق في إنستغرام (Instagram Comment Reply) ──
const replyToInstagramComment = async (commentId: string, message: string, token: string) => {
  if (!token) return;
  const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(commentId)}/replies?access_token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message })
    });
    if (!res.ok) {
      console.error("Instagram Comment Reply Error:", await res.text());
    } else {
      console.log(`Successfully replied to IG comment ${commentId}`);
    }
  } catch (e) {
    console.error("replyToInstagramComment exception:", e);
  }
};

// ── 4. إرسال رد خاص لصاحب التعليق (Private Reply) ──
const sendPrivateReplyToComment = async (commentId: string, text: string, isInstagram: boolean, token: string) => {
  if (!token) return;
  try {
    if (isInstagram) {
      const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(token)}`;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { comment_id: commentId },
          message: { text: text }
        })
      });
    } else {
      const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(commentId)}/private_replies?access_token=${encodeURIComponent(token)}`;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
    }
  } catch (e) {
    console.error("sendPrivateReplyToComment exception:", e);
  }
};

// ── 5. إرسال تنبيه فوري للأدمن على تيليكرام عند الشكاوى أو البلاغات ──
const notifyAdminTelegram = async (text: string) => {
  if (!TELEGRAM_BOT_TOKEN || !ADMIN_CHAT_ID) return;
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: text,
        parse_mode: "HTML"
      })
    });
  } catch (e) {
    console.error("notifyAdminTelegram exception:", e);
  }
};

// ── 6. استدعاء محرك الذكاء الاصطناعي ai-engine ──
const getAIReply = async (action: 'process_message' | 'process_comment', platform: string, text: string, senderId?: string) => {
  try {
    const aiRes = await fetch(`${SUPABASE_URL}/functions/v1/ai-engine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        action,
        platform,
        sender_id: senderId || 'meta_user',
        text
      })
    });
    if (aiRes.ok) {
      return await aiRes.json();
    }
  } catch (e) {
    console.error("getAIReply exception:", e);
  }
  return { reply: "أهلاً بك في منصة سوق بغداد! 🇮🇶 يسعدنا تواصلك معنا، تفضل بزيارة موقعنا: https://www.souqbaghdad.store" };
};

serve(async (req) => {
  try {
    const url = new URL(req.url);

    // ── 1. Meta Webhook Verification (GET Request) ──
    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      console.log(`[Meta Webhook GET] Mode: ${mode}, Token: ${token}`);

      if (mode === "subscribe" && (token === META_VERIFY_TOKEN || token === "souqbaghdad_secret_token")) {
        console.log("Meta Webhook Verified Successfully!");
        return new Response(challenge, { status: 200 });
      }
      return new Response("Forbidden", { status: 403 });
    }

    // ── 2. Meta Webhook Events (POST Request) ──
    if (req.method === "POST") {
      const body = await req.json();
      console.log("Received Meta Webhook Payload:", JSON.stringify(body));

      const isInstagram = body.object === "instagram";
      const isPage = body.object === "page";

      if (isPage || isInstagram) {
        for (const entry of (body.entry || [])) {
          const entryId = entry.id;
          const currentToken = resolveAccessToken(entryId);

          // ── أ. معالجة الرسائل الخاصة (Direct Messages & Messenger) ──
          if (entry.messaging && Array.isArray(entry.messaging)) {
            for (const messagingEvent of entry.messaging) {
              const senderId = messagingEvent.sender?.id;
              const recipientId = messagingEvent.recipient?.id;

              // تجاهل الرسائل الصادرة من الصفحة نفسها لمنع الحلقات اللانهائية
              if (!senderId || senderId === META_PAGE_ID || senderId === META_IG_ACCOUNT_ID || senderId === entryId) {
                continue;
              }

              if (messagingEvent.message && messagingEvent.message.text) {
                const userText = messagingEvent.message.text.trim();
                const platform = isInstagram ? "instagram" : "facebook";

                console.log(`[${platform} DM] From: ${senderId}, Text: "${userText}"`);

                const aiData = await getAIReply("process_message", platform, userText, senderId);

                if (aiData?.reply) {
                  await sendMetaMessage(senderId, aiData.reply, currentToken);
                }

                // إذا كان هناك نتائج بحث ذات صلة
                if (aiData?.searchResults && aiData.searchResults.length > 0) {
                  for (const item of aiData.searchResults) {
                    const itemUrl = `https://www.souqbaghdad.store/product/${item.short_id || item.id}`;
                    await sendMetaMessage(
                      senderId,
                      `📌 ${item.title}\n💰 السعر: ${item.price} د.ع\n📍 ${item.location || 'بغداد'}\n🔗 ${itemUrl}`,
                      currentToken
                    );
                  }
                }
              }
            }
          }

          // ── ب. معالجة التعليقات على المنشورات (Comments Automation) ──
          if (entry.changes && Array.isArray(entry.changes)) {
            for (const change of entry.changes) {
              const field = change.field;
              
              if (field === "feed" || field === "comments" || field === "mention") {
                const val = change.value;
                if (!val) continue;

                // استخراج معرف التعليق والنص
                const commentId = val.comment_id || val.id;
                const commentText = (val.message || val.text || "").trim();
                const fromId = val.from?.id;

                // تجاهل التعليقات الفارغة أو تعليقات الصفحة نفسها
                if (!commentText || !commentId || fromId === META_PAGE_ID || fromId === META_IG_ACCOUNT_ID || fromId === entryId) {
                  continue;
                }

                // تجاهل إذا كان الحدث حذف تعليق أو تفاعل (reaction)
                if (val.verb && val.verb !== "add") continue;
                if (val.item && val.item !== "comment") continue;

                console.log(`[${isInstagram ? "Instagram" : "Facebook"} Comment] ID: ${commentId}, Text: "${commentText}"`);

                // 1. توليد رد ذكي من الذكاء الاصطناعي
                const aiData = await getAIReply("process_comment", isInstagram ? "instagram" : "facebook", commentText, fromId);
                const replyText = aiData?.reply || "أهلاً بك عيوني في سوق بغداد 🇮🇶 يسعدنا تواصلك، تفضل بزيارة موقعنا: https://www.souqbaghdad.store";

                // 2. نشر الرد على التعليق
                if (isInstagram) {
                  await replyToInstagramComment(commentId, replyText, currentToken);
                } else {
                  await replyToFacebookComment(commentId, replyText, currentToken);
                }

                // 3. إرسال رابط المنصة والتفاصيل على الخاص دائماً
                const cleanComment = commentText.toLowerCase();
                const isGeneralPraise = ["ما شاء الله", "حلو", "بالتوفيق", "منورين", "تبارك"].some(k => cleanComment.includes(k)) && cleanComment.length < 20;
                
                if (!isGeneralPraise) {
                  let pmText = "يا هلا بيك عيوني 👋 إليك الرابط المباشر للتصفح والنشر والتواصل مع البائعين في منصة سوق بغداد: https://www.souqbaghdad.store";
                  if (entryId === ALRAFDAIN_FB_PAGE_ID || entryId === ALRAFDAIN_IG_ID) {
                     pmText = "أهلاً بك في كلية الرافدين الجامعة 🎓 يسعدنا تواصلك معنا، لمزيد من التفاصيل ومعرفة الخطوط المتاحة تفضل بزيارة موقعنا: https://www.souqbaghdad.store/transport";
                  }
                  await sendPrivateReplyToComment(
                    commentId,
                    pmText,
                    isInstagram,
                    currentToken
                  );
                }

                // 4. إشعار فوري للأدمن عند رصد أي بلاغ أو شكوى
                if (["نصاب", "احتيال", "كذب", "حرامي", "اشتكي", "سرقة"].some(k => cleanComment.includes(k))) {
                  await notifyAdminTelegram(
                    `🚨 <b>تنبيه شكوى/تعليق مشبوه على ${isInstagram ? "إنستغرام" : "فيسبوك"}!</b>\n\n💬 <b>التعليق:</b> "${commentText}"\n🆔 <b>المعرف:</b> <code>${commentId}</code>`
                  );
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
