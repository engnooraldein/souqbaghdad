// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ADMIN_CHAT_ID = Deno.env.get("ADMIN_CHAT_ID") ?? "777557036";
const BOT_TOKEN = Deno.env.get("BOT_TOKEN") ?? "8886561538:AAGM68k1ljmvNgRF5IafMo6Kip3VI1g1rzg";

const sendTelegramMessage = async (chatId: string, text: string, replyMarkup?: any) => {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const body: any = { chat_id: chatId, text: text };
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};

serve(async (req) => {
  try {
    const update = await req.json();
    
    // Check if it's a message
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id.toString();
      
      const isAdmin = chatId === ADMIN_CHAT_ID;
      
      // -- ADMIN LOGIC (Replying to user complaints) --
      if (isAdmin && msg.reply_to_message && msg.text && !msg.text.startsWith('/')) {
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
      // -- USER LOGIC (Works for everyone including admin) --
      else {
        const MAIN_KEYBOARD = [
          [{ text: "🔑 استعادة كلمة المرور" }, { text: "📖 كيفية التسجيل" }],
          [{ text: "❓ الأسئلة الشائعة" }, { text: "💬 الدعم الفني" }]
        ];

        if (msg.text === '/start' || msg.text === '🔙 الرجوع للقائمة الرئيسية') {
          await sendTelegramMessage(chatId, "أهلاً بك في المساعد الذكي لسوك بغداد! 🛍️\nاختر من القائمة أدناه:", {
            keyboard: MAIN_KEYBOARD,
            resize_keyboard: true,
            is_persistent: true
          });
        } else if (msg.text === '🔑 استعادة كلمة المرور' || msg.text === '🔑 نسيت كلمة المرور') {
          await sendTelegramMessage(chatId, "يرجى الضغط على الزر أدناه لمشاركة رقم هاتفك للتحقق من هويتك بأمان 🔒", {
            keyboard: [[{ text: "📱 مشاركة رقم الهاتف", request_contact: true }], [{ text: "🔙 الرجوع للقائمة الرئيسية" }]],
            resize_keyboard: true,
            one_time_keyboard: true
          });
        } else if (msg.text === '📖 كيفية التسجيل') {
          await sendTelegramMessage(chatId, "لإنشاء حساب في سوق بغداد:\n1. قم بزيارة موقعنا.\n2. اضغط على أيقونة 'حسابي' (تسجيل الدخول).\n3. أدخل رقم هاتفك ومعلوماتك.\n4. ستصلك رسالة تفعيل.\n\nبكل بساطة! ✨", {
            keyboard: MAIN_KEYBOARD,
            resize_keyboard: true
          });
        } else if (msg.text === '❓ الأسئلة الشائعة') {
          await sendTelegramMessage(chatId, "إليك أبرز الأسئلة الشائعة، تفضل باختيار أحدها:", {
            keyboard: [
              [{ text: "📦 كم مدة التوصيل؟" }, { text: "💰 كم تكلفة التوصيل؟" }],
              [{ text: "🔄 هل يوجد استرجاع؟" }],
              [{ text: "🔙 الرجوع للقائمة الرئيسية" }]
            ],
            resize_keyboard: true
          });
        } else if (msg.text === '📦 كم مدة التوصيل؟') {
          await sendTelegramMessage(chatId, "تستغرق مدة التوصيل عادةً من 24 إلى 48 ساعة داخل بغداد، ومن 2 إلى 4 أيام لباقي المحافظات.");
        } else if (msg.text === '💰 كم تكلفة التوصيل؟') {
          await sendTelegramMessage(chatId, "تكلفة التوصيل داخل بغداد 4000 دينار، وللمحافظات 6000 دينار.");
        } else if (msg.text === '🔄 هل يوجد استرجاع؟') {
          await sendTelegramMessage(chatId, "نعم، يمكنك استرجاع أو استبدال المنتج خلال 3 أيام من تاريخ الاستلام بشرط بقائه بحالته الأصلية.");
        } else if (msg.text === '💬 الدعم الفني') {
          await sendTelegramMessage(chatId, "يرجى كتابة مشكلتك أو استفسارك في رسالة واحدة، وسيقوم فريقنا بالرد عليك في أقرب وقت. 📝", {
            keyboard: [[{ text: "🔙 الرجوع للقائمة الرئيسية" }]],
            resize_keyboard: true
          });
        } else if (msg.contact) {
          let phone = msg.contact.phone_number;
          // Normalize phone to start with 07 instead of +964 or 964
          phone = phone.replace(/^\+964/, '0').replace(/^964/, '0');
          
          // Verify user
          const { data: profile } = await supabase.from('profiles').select('id, full_name').eq('phone', phone).single();
          
          if (!profile) {
            await sendTelegramMessage(chatId, "عذراً، هذا الرقم غير مسجل في منصتنا. يرجى التأكد من التسجيل بنفس رقم التيلكرام الخاص بك.", {
              keyboard: MAIN_KEYBOARD,
              resize_keyboard: true
            });
          } else {
            // Generate random 6-digit password
            const newPassword = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Update password via admin API
            const { error: resetError } = await supabase.auth.admin.updateUserById(profile.id, {
              password: newPassword
            });
            
            if (resetError) {
              await sendTelegramMessage(chatId, `حدث خطأ أثناء تصفير الرمز: ${resetError.message}`);
            } else {
              await sendTelegramMessage(chatId, `✅ تم التحقق من هويتك بنجاح يا ${profile.full_name}!\n\nكلمة المرور الجديدة لحسابك هي: \`${newPassword}\`\n\n(اضغط على الرمز لنسخه. يمكنك تسجيل الدخول الآن وتغيير الرمز من إعدادات حسابك)`, {
                keyboard: MAIN_KEYBOARD,
                resize_keyboard: true
              });
            }
          }
        } else {
          // Fallback - Treat arbitrary text as a support message
          if (msg.text) {
            const { data: newMsg, error: insertError } = await supabase.from('support_messages').insert({
              name: msg.from?.first_name || 'مستخدم تيليكرام',
              contact_info: msg.from?.username ? `@${msg.from.username}` : `ChatID: ${chatId}`,
              message: msg.text,
              status: 'pending'
            }).select().single();

            if (!insertError && newMsg) {
              // Forward to admin
              const adminMessage = `📩 استفسار جديد عبر البوت:\nمن: ${newMsg.name} (${newMsg.contact_info})\n\nالرسالة: ${newMsg.message}\n\n💡 للرد على المستخدم عبر الموقع، قم بالرد على هذه الرسالة واكتب ردك.\n#id_${newMsg.id.replace(/-/g, '_')}`;
              await sendTelegramMessage(ADMIN_CHAT_ID, adminMessage);
              
              await sendTelegramMessage(chatId, "✅ تم إرسال رسالتك إلى فريق الدعم بنجاح! سيتم الرد عليك قريباً.", {
                keyboard: MAIN_KEYBOARD,
                resize_keyboard: true
              });
            } else {
              await sendTelegramMessage(chatId, "يرجى اختيار أحد الخيارات من القائمة.", {
                keyboard: MAIN_KEYBOARD,
                resize_keyboard: true
              });
            }
          } else {
            await sendTelegramMessage(chatId, "يرجى اختيار أحد الخيارات من القائمة.", {
              keyboard: MAIN_KEYBOARD,
              resize_keyboard: true
            });
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
