import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ADMIN_CHAT_ID = Deno.env.get("ADMIN_CHAT_ID") ?? "777557036";
const BOT_TOKEN = Deno.env.get("BOT_TOKEN") ?? "8886561538:AAGM68k1ljmvNgRF5IafMo6Kip3VI1g1rzg";

const sendTelegramMessage = async (chatId: string, text: string) => {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text }),
  });
};

serve(async (req) => {
  try {
    const update = await req.json();
    
    // Check if it's a message
    if (update.message) {
      const msg = update.message;
      
      // Ensure it's from the Admin chat
      if (msg.chat.id.toString() !== ADMIN_CHAT_ID) {
        return new Response("Not authorized", { status: 200 }); // Return 200 to acknowledge Telegram
      }

      // Check if it's a reply to another message
      if (msg.reply_to_message && msg.text) {
        const originalText = msg.reply_to_message.text || "";
        
        // Extract the ID hashtag: #id_uuid_with_underscores
        const idMatch = originalText.match(/#id_([a-f0-9_]+)/i);
        
        if (idMatch && idMatch[1]) {
          // Convert underscores back to hyphens
          const supportId = idMatch[1].replace(/_/g, '-');
          const adminReplyText = msg.text;

          // 1. Mark the support message as resolved
          const { data: supportMsg, error: fetchError } = await supabase
            .from('support_messages')
            .update({ status: 'resolved' })
            .eq('id', supportId)
            .select()
            .single();

          if (fetchError) {
            await sendTelegramMessage(ADMIN_CHAT_ID, `❌ فشل في تحديث الرسالة في قاعدة البيانات.\nالخطأ: ${fetchError.message}`);
          } else if (supportMsg) {
            // 2. If the user_id exists, send them an in-app notification
            if (supportMsg.user_id) {
              const { error: notifError } = await supabase
                .from('user_notifications')
                .insert({
                  user_id: supportMsg.user_id,
                  title: 'رد من الدعم الفني / الإدارة',
                  body: adminReplyText,
                  type: 'support_reply',
                  read: false
                });
                
              if (notifError) {
                await sendTelegramMessage(ADMIN_CHAT_ID, `⚠️ تم التحديث، لكن فشل إرسال إشعار للمستخدم (ربما غير مسجل).\nالخطأ: ${notifError.message}`);
              } else {
                await sendTelegramMessage(ADMIN_CHAT_ID, `✅ تم إرسال الرد للمستخدم بنجاح كإشعار في الموقع!`);
              }
            } else {
              await sendTelegramMessage(ADMIN_CHAT_ID, `⚠️ تم التحديث كـ "محلول"، لكن المستخدم غير مسجل الدخول، لا يمكن إرسال إشعار داخلي له. يرجى التواصل معه عبر (${supportMsg.contact_info}).`);
            }
          }
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing telegram update:", error);
    return new Response("Internal Server Error", { status: 200 }); // Always 200 to Telegram
  }
});
