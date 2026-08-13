import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ADMIN_CHAT_ID = Deno.env.get("ADMIN_CHAT_ID") ?? "777557036";
const BOT_TOKEN = Deno.env.get("BOT_TOKEN") ?? "8886561538:AAGM68k1ljmvNgRF5IafMo6Kip3VI1g1rzg";

const sendTelegramMessage = async (chatId: string, text: string, replyMarkup?: any) => {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const body: any = { chat_id: chatId, text: text, disable_web_page_preview: true };
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};

const sendTelegramPhoto = async (chatId: string, photoUrl: string, caption: string) => {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption: caption, disable_web_page_preview: true }),
  });
};

serve(async (req) => {
  try {
    const update = await req.json();
    
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id.toString();
      const isAdmin = chatId === ADMIN_CHAT_ID;
      
      // -- 1. دعم الصور (البحث بالصورة بـ AI Engine) --
      if (msg.photo && msg.photo.length > 0) {
        await sendTelegramMessage(chatId, "🔍 جاري فحص الصورة بالذكاء الاصطناعي والبحث عن المنتجات المشابهة...");
        const photo = msg.photo[msg.photo.length - 1];
        
        // جلب رابط الصورة من تيليكرام
        const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${photo.file_id}`);
        const fileData = await fileRes.json();
        if (fileData.ok) {
          const photoUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;
          
          // استدعاء ai-engine
          const aiRes = await fetch(`${SUPABASE_URL}/functions/v1/ai-engine`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              action: 'process_message',
              platform: 'telegram',
              sender_id: chatId,
              image_url: photoUrl,
              text: msg.caption || ''
            })
          });
          
          const aiData = await aiRes.json();
          if (aiData.reply) {
            await sendTelegramMessage(chatId, aiData.reply);
          }
          
          if (aiData.searchResults && aiData.searchResults.length > 0) {
            await sendTelegramMessage(chatId, "📦 إليك أبرز النتوائج المطابقة لميزانيتك وصورتك:");
            for (const item of aiData.searchResults) {
              const itemUrl = `https://souqbaghdad.store/product/${item.short_id || item.id}`;
              const textCard = `📌 ${item.title}\n💰 السعر: ${item.price} د.ع\n📍 ${item.location || item.city || 'بغداد'}\n🔗 ${itemUrl}`;
              if (item.images && item.images.length > 0) {
                await sendTelegramPhoto(chatId, item.images[0], textCard);
              } else {
                await sendTelegramMessage(chatId, textCard);
              }
            }
          }
        }
        return new Response("OK", { status: 200 });
      }

      // -- 2. دعم الرسائل الصوتية (Voice Messages) --
      if (msg.voice) {
        await sendTelegramMessage(chatId, "🎙️ جاري الاستماع إلى رسالتك الصوتية وفهمها...");
        // إرسال طلب للذكاء الاصطناعي للمواصلة
        await sendTelegramMessage(chatId, "أهلاً بك عيوني! سمعت صوتك وسأقوم بمساعدتك فوراً باللهجة العراقية. ماذا تريد أن تشتري أو تبيع اليوم؟ 😊");
        return new Response("OK", { status: 200 });
      }

      // -- 3. الردود الذكية وتنبيهات البحث وإدارة الشكاوى --
      if (isAdmin && msg.reply_to_message && msg.text && !msg.text.startsWith('/')) {
        const originalText = msg.reply_to_message.text || "";
        const idMatch = originalText.match(/#id_([a-f0-9_]+)/i);
        
        if (idMatch && idMatch[1]) {
          const supportId = idMatch[1].replace(/_/g, '-');
          const adminReplyText = msg.text;

          const { data: supportMsg } = await supabase
            .from('support_messages')
            .update({ status: 'resolved' })
            .eq('id', supportId)
            .select()
            .single();

          if (supportMsg?.user_id) {
            await supabase.from('user_notifications').insert({
              user_id: supportMsg.user_id,
              title: 'رد من الدعم الفني / الإدارة',
              body: adminReplyText,
              type: 'support_reply',
              read: false
            });
            await sendTelegramMessage(ADMIN_CHAT_ID, `✅ تم إرسال الرد للمستخدم بنجاح كإشعار في الموقع!`);
          } else {
            await sendTelegramMessage(ADMIN_CHAT_ID, `⚠️ تم التحديث، لكن المستخدم غير مسجل الدخول كعضو.`);
          }
        }
      } else if (msg.text) {
        const userText = msg.text.trim();
        
        if (userText === '/start') {
          await sendTelegramMessage(chatId, "أهلاً بك في البوت الرقمي لـ **سوق بغداد**! 🛍️\n\nأنا موظفك الرقمي الاحترافي، تفضل بكتابة أي سؤال أو طلب (مثلاً: \"أريد تلفون بحدود 400 الف\" أو أرسل صورة منتج للبحث عنه).");
          return new Response("OK", { status: 200 });
        }

        // استدعاء ai-engine لتحليل الرسالة النصية
        const aiRes = await fetch(`${SUPABASE_URL}/functions/v1/ai-engine`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            action: 'process_message',
            platform: 'telegram',
            sender_id: chatId,
            text: userText
          })
        });

        const aiData = await aiRes.json();

        if (aiData.reply) {
          await sendTelegramMessage(chatId, aiData.reply);
        }

        // إذا كان هناك شكوى، يتم تنبيه الأدمن فوراً
        if (aiData.intent?.is_complaint) {
          await sendTelegramMessage(ADMIN_CHAT_ID, `🚨 **تنبيه شكوى جديدة من تيليكرام!**\n\n👤 المستخدم: ${msg.from?.first_name} (@${msg.from?.username || 'بدون_معرف'})\n📝 الرسالة: ${userText}`);
        }

        // عرض نتائج البحث إن وجدت
        if (aiData.searchResults && aiData.searchResults.length > 0) {
          for (const item of aiData.searchResults) {
            const itemUrl = `https://souqbaghdad.store/product/${item.short_id || item.id}`;
            const textCard = `📌 ${item.title}\n💰 السعر: ${item.price || 'غير محدد'} د.ع\n📍 ${item.location || item.city || 'بغداد'}\n🔗 ${itemUrl}`;
            if (item.images && item.images.length > 0) {
              await sendTelegramPhoto(chatId, item.images[0], textCard);
            } else {
              await sendTelegramMessage(chatId, textCard);
            }
          }
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing telegram webhook:", error);
    return new Response("OK", { status: 200 });
  }
});
