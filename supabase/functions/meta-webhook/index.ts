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
const getAIReply = async (action: 'process_message' | 'process_comment', platform: string, text: string, senderId?: string, imageUrl?: string, audioUrl?: string) => {
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
        text,
        image_url: imageUrl,
        audio_url: audioUrl
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
      const isThreads = body.object === "threads";

      if (isPage || isInstagram || isThreads) {
        for (const entry of (body.entry || [])) {
          const entryId = entry.id;
          const currentToken = resolveAccessToken(entryId);

          // ── أ. معالجة الرسائل الخاصة (Direct Messages, Messenger, Voice & Images) ──
          if (entry.messaging && Array.isArray(entry.messaging)) {
            for (const messagingEvent of entry.messaging) {
              const senderId = messagingEvent.sender?.id;
              const recipientId = messagingEvent.recipient?.id;

              // تجاهل الرسائل الصادرة من الصفحة نفسها لمنع الحلقات اللانهائية
              if (!senderId || senderId === META_PAGE_ID || senderId === META_IG_ACCOUNT_ID || senderId === entryId) {
                continue;
              }

              if (messagingEvent.message) {
                const userText = (messagingEvent.message.text || "").trim();
                const platform = isInstagram ? "instagram" : isThreads ? "threads" : "facebook";

                // استخراج المرفقات (صور أو بصمات صوتية)
                let imageUrl: string | undefined = undefined;
                let audioUrl: string | undefined = undefined;

                if (messagingEvent.message.attachments && Array.isArray(messagingEvent.message.attachments)) {
                  for (const att of messagingEvent.message.attachments) {
                    if (att.type === "image" && att.payload?.url) {
                      imageUrl = att.payload.url;
                    } else if ((att.type === "audio" || att.type === "voice") && att.payload?.url) {
                      audioUrl = att.payload.url;
                    }
                  }
                }

                console.log(`[${platform} DM] From: ${senderId}, Text: "${userText}", Image: ${!!imageUrl}, Audio: ${!!audioUrl}`);

                // ── معالجة الردود على الستوري ──
                let storyId = null;
                if (messagingEvent.message.reply_to && messagingEvent.message.reply_to.story) {
                  storyId = messagingEvent.message.reply_to.story.id;
                }
                
                if (storyId) {
                  console.log(`[Story Reply] Story ID: ${storyId}`);
                  const { data: adRecord } = await supabase
                    .from('ads')
                    .select('id, short_id, title, category, description, university, destination, price')
                    .eq('instagram_post_id', storyId)
                    .single();
                  
                  if (adRecord) {
                    const itemUrl = `https://www.souqbaghdad.store/product/${adRecord.short_id || adRecord.id}`;
                    let details = adRecord.title;
                    if (adRecord.category === 'transport') {
                      details = `خط نقل: ${adRecord.university || ''} - ${adRecord.destination || ''}`;
                    }
                    const replyText = `أهلاً بك عيوني 🌹\nبخصوص الإعلان اللي استفسرت عنه بالستوري (${details})${adRecord.price ? ` بالسعر: ${adRecord.price}` : ''}:\n🔗 تفضل الرابط المباشر للتواصل مع المعلن ومعاينة الإعلان:\n${itemUrl}`;
                    
                    await sendMetaMessage(senderId, replyText, currentToken);
                    continue; // تم الرد بنجاح
                  }
                }

                // استدعاء الذكاء الاصطناعي مع دعم النصوص والصوت والصور
                const aiData = await getAIReply("process_message", platform, userText, senderId, imageUrl, audioUrl);

                if (aiData?.reply) {
                  await sendMetaMessage(senderId, aiData.reply, currentToken);
                }

                // إذا كان هناك نتائج بحث إضافية مطابقة
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
              const val = change.value;
              if (!val) continue;

              // دعم كافة حقول التعليقات والمنشورات لفيسبوك وإنستغرام وثريدز
              const isCommentField = field === "feed" || field === "comments" || field === "live_comments" || field === "mention" || field === "threads" || field === "media";
              
              if (isCommentField) {
                // استخراج معرف التعليق ومعرف البوست والنص بدعم كافة البنى البرمجية لـ Meta
                const commentId = val.comment_id || val.id;
                const postId = val.post_id || val.media?.id || val.parent_id || val.post?.id;
                const commentText = (val.message || val.text || "").trim();
                const fromId = val.from?.id || val.user?.id;

                // تجاهل إذا لم يكن هناك معرف أو نص
                if (!commentText || !commentId) continue;

                // تجاهل التعليقات الصادرة من نفس حسابات الصفحة لمنع الحلقات
                if (fromId === META_PAGE_ID || fromId === META_IG_ACCOUNT_ID || fromId === entryId || fromId === ALRAFDAIN_FB_PAGE_ID || fromId === ALRAFDAIN_IG_ID) {
                  continue;
                }

                // تجاهل عمليات الحذف والتفاعلات
                if (val.verb && (val.verb === "delete" || val.verb === "remove" || val.verb === "hide")) continue;
                if (val.item && val.item !== "comment" && val.item !== "post" && val.item !== "media") continue;

                const platformName = isInstagram ? "Instagram" : isThreads ? "Threads" : "Facebook";
                console.log(`[${platformName} Comment Event] ID: ${commentId}, Post: ${postId}, Text: "${commentText}"`);

                // 1. توليد رد ذكي من الذكاء الاصطناعي
                const aiData = await getAIReply("process_comment", platformName.toLowerCase(), commentText, fromId);
                const replyText = aiData?.reply || "أهلاً بك عيوني في سوق بغداد 🇮🇶 دزينا لك التفاصيل على الخاص 📩";

                // 2. نشر الرد على التعليق علناً
                if (isInstagram) {
                  await replyToInstagramComment(commentId, replyText, currentToken);
                } else {
                  await replyToFacebookComment(commentId, replyText, currentToken);
                }

                // 3. البحث عن الإعلان المرتبط بهذا المنشور وإرسال تفاصيله على الخاص
                const cleanComment = commentText.toLowerCase();
                const isGeneralPraise = ["ما شاء الله", "حلو", "بالتوفيق", "منورين", "تبارك"].some(k => cleanComment.includes(k)) && cleanComment.length < 20;
                
                if (!isGeneralPraise) {
                  let pmText = "يا هلا بيك عيوني 👋 إليك الرابط المباشر للتصفح والنشر والتواصل مع المعلنين في منصة سوق بغداد: https://www.souqbaghdad.store";
                  
                  // محاولة جلب الإعلان المرتبط بالبوست من قاعدة البيانات
                  if (postId) {
                    const { data: matchedAd } = await supabase
                      .from('ads')
                      .select('id, short_id, title, price, year, location, phone, category, university, destination')
                      .or(`facebook_post_id.eq.${postId},instagram_post_id.eq.${postId},meta_post_id.eq.${postId}`)
                      .single();

                    if (matchedAd) {
                      const adUrl = `https://www.souqbaghdad.store/product/${matchedAd.short_id || matchedAd.id}`;
                      let adSummary = matchedAd.title;
                      if (matchedAd.category === 'transport') {
                        adSummary = `خط نقل: ${matchedAd.university || ''} - ${matchedAd.destination || ''}`;
                      }
                      pmText = `يا هلا بيك عيوني 🌹\nبخصوص المنشور اللي علقت عليه (${adSummary}):\n💰 السعر: ${matchedAd.price || 'تواصل لمعرفة السعر'}\n📍 الموقع: ${matchedAd.location || 'بغداد'}\n🔗 رابط المعاينة والتواصل مع صاحب الإعلان:\n${adUrl}`;
                    }
                  }

                  if (entryId === ALRAFDAIN_FB_PAGE_ID || entryId === ALRAFDAIN_IG_ID) {
                    pmText = "أهلاً بك في كلية الرافدين الجامعة 🎓 يسعدنا تواصلك معنا، لمعرفة تفاصيل الخطوط والتسجيل تفضل بزيارة موقعنا: https://www.souqbaghdad.store/transport";
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
                    `🚨 <b>تنبيه شكوى/تعليق مشبوه على ${platformName}!</b>\n\n💬 <b>التعليق:</b> "${commentText}"\n🆔 <b>المعرف:</b> <code>${commentId}</code>`
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
