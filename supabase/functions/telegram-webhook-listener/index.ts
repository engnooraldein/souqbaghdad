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
      } else if (isAdmin && msg.text === '🚨 استعلام الأخطاء (Logs)') {
        // Fetch last 5 critical errors
        const { data, error } = await supabase
          .from('critical_errors')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          await sendTelegramMessage(chatId, `حدث خطأ أثناء جلب السجلات: ${error.message}`);
        } else if (!data || data.length === 0) {
          await sendTelegramMessage(chatId, "لا توجد أخطاء مسجلة حالياً. النظام يعمل بشكل ممتاز! ✅");
        } else {
          let replyText = "🚨 *أحدث 5 أخطاء في النظام (Logs):*\n\n";
          data.forEach((log: any, i: number) => {
            replyText += `${i + 1}. *النوع:* ${log.error_type}\n*الخطأ:* ${log.error_message}\n*التاريخ:* ${new Date(log.created_at).toLocaleString('ar-IQ')}\n---\n`;
          });
          await sendTelegramMessage(chatId, replyText, { parse_mode: "Markdown" });
        }
      }
      // -- USER LOGIC (Works for everyone including admin) --
      else {
        const MAIN_KEYBOARD = [
          [{ text: "🛒 المشتري والباحث عن منتج" }, { text: "📢 البائع وصاحب الإعلان" }],
          [{ text: "🚗 سائق التوصيل / الخطوط" }, { text: "🔑 الحساب والدعم" }]
        ];
        
        const ADMIN_KEYBOARD = [
          [{ text: "🚨 استعلام الأخطاء (Logs)" }],
          ...MAIN_KEYBOARD
        ];

        const BUYER_KEYBOARD = [
          [{ text: "🛍️ كيف أشتري منتجاً؟" }, { text: "📦 هل يتوفر توصيل؟" }],
          [{ text: "🛡️ نصائح لتسوق آمن" }],
          [{ text: "🔙 القائمة الرئيسية" }]
        ];

        const SELLER_KEYBOARD = [
          [{ text: "📝 كيف أضيف إعلاناً؟" }, { text: "🔗 كيف أشارك متجري بالبايو؟" }],
          [{ text: "⭐ كيف أرقي إعلاني؟" }, { text: "👁️ المشاهدات لا تظهر؟" }],
          [{ text: "🔙 القائمة الرئيسية" }]
        ];

        const DRIVER_KEYBOARD = [
          [{ text: "📋 كيف أعمل كمندوب أو أوفر خطاً؟" }],
          [{ text: "🔙 القائمة الرئيسية" }]
        ];

        const ACCOUNT_KEYBOARD = [
          [{ text: "📖 كيفية التسجيل" }, { text: "🔑 نسيت كلمة المرور" }],
          [{ text: "👤 كيف أغير اسمي/صورتي؟" }, { text: "💳 المحفظة والنقاط" }],
          [{ text: "💬 التحدث مع الإدارة / الدعم" }],
          [{ text: "🔙 القائمة الرئيسية" }]
        ];

        if (msg.text === '/start' || msg.text === '🔙 القائمة الرئيسية' || msg.text === '🔙 الرجوع للقائمة الرئيسية') {
          await sendTelegramMessage(chatId, "أهلاً بك في المساعد الذكي لسوق بغداد الرقمي! 🛍️\nنحن منصتك الأولى للإعلانات المبوبة المجانية.\n\nيرجى اختيار صفتك لخدمتك بشكل أفضل:", {
            keyboard: isAdmin ? ADMIN_KEYBOARD : MAIN_KEYBOARD,
            resize_keyboard: true,
            is_persistent: true
          });
        } 
        // --- Navigation Handlers ---
        else if (msg.text === '🛒 المشتري والباحث عن منتج') {
          await sendTelegramMessage(chatId, "أهلاً بك عزيزي! تفضل باختيار استفسارك:", { keyboard: BUYER_KEYBOARD, resize_keyboard: true });
        }
        else if (msg.text === '📢 البائع وصاحب الإعلان') {
          await sendTelegramMessage(chatId, "أهلاً بك كشريك نجاح في سوق بغداد الرقمي! تفضل باختيار استفسارك:", { keyboard: SELLER_KEYBOARD, resize_keyboard: true });
        }
        else if (msg.text === '🚗 سائق التوصيل / الخطوط') {
          await sendTelegramMessage(chatId, "أهلاً بك عزيزي الكابتن! تفضل باختيار استفسارك:", { keyboard: DRIVER_KEYBOARD, resize_keyboard: true });
        }
        else if (msg.text === '🔑 الحساب والدعم') {
          await sendTelegramMessage(chatId, "قسم الحسابات والدعم الفني. تفضل باختيار استفسارك:", { keyboard: ACCOUNT_KEYBOARD, resize_keyboard: true });
        }
        
        // --- Buyer Section ---
        else if (msg.text === '🛍️ كيف أشتري منتجاً؟') {
          await sendTelegramMessage(chatId, "منصة 'سوق بغداد الرقمي' هي وسيط يجمعك بالبائعين مجاناً!\n\nللطلب: تصفح الإعلانات، اضغط على الإعلان الذي يعجبك، وتواصل مع البائع مباشرة (عبر الاتصال أو الواتساب) للاتفاق على السعر والتسليم.", { keyboard: BUYER_KEYBOARD, resize_keyboard: true });
        }
        else if (msg.text === '📦 هل يتوفر توصيل؟') {
          await sendTelegramMessage(chatId, "نحن منصة إعلانية (وسيطة).\nالتوصيل يتم بالاتفاق المباشر بينك وبين صاحب الإعلان، أو يمكنكم الاستعانة بمناديب التوصيل الموجودين في قسم (خدمات النقل/الخطوط) في الموقع.", { keyboard: BUYER_KEYBOARD, resize_keyboard: true });
        }
        else if (msg.text === '🛡️ نصائح لتسوق آمن') {
          await sendTelegramMessage(chatId, "احرص دائماً على الدفع عند الاستلام (يداً بيد) بعد فحص المنتج والتأكد منه.\n\n⚠️ لا تقم بتحويل مبالغ مالية مسبقاً لأشخاص لا تعرفهم لتجنب الاحتيال.", { keyboard: BUYER_KEYBOARD, resize_keyboard: true });
        }

        // --- Seller Section ---
        else if (msg.text === '📝 كيف أضيف إعلاناً؟') {
          await sendTelegramMessage(chatId, "1. قم بتسجيل الدخول لموقعنا.\n2. اضغط على زر (+ إعلان جديد).\n3. ارفع صوراً واضحة، واكتب التفاصيل والسعر.\n4. سيُنشر إعلانك فوراً ليراه آلاف المتسوقين!", { keyboard: SELLER_KEYBOARD, resize_keyboard: true });
        }
        else if (msg.text === '🔗 كيف أشارك متجري بالبايو؟') {
          await sendTelegramMessage(chatId, "يمكنك نسخ رابط ملفك الشخصي (متجرك) من داخل الموقع عبر زر المشاركة ⤴️\nثم قم بوضع الرابط في البايو الخاص بك على إنستغرام أو تيك توك، ليتمكن متابعوك من رؤية جميع إعلاناتك بضغطة زر! 📱", { keyboard: SELLER_KEYBOARD, resize_keyboard: true });
        }
        else if (msg.text === '⭐ كيف أرقي إعلاني؟') {
          await sendTelegramMessage(chatId, "لترقية إعلانك ليكون بالقمة وزيادة مشاهداتك ومبيعاتك، يرجى التحدث معنا عبر قسم (الدعم الفني) وسنقوم بتزويدك بالباقات وعروض التمييز المتوفرة حالياً! 🚀", { keyboard: SELLER_KEYBOARD, resize_keyboard: true });
        }
        else if (msg.text === '👁️ المشاهدات لا تظهر؟') {
          await sendTelegramMessage(chatId, "لا تقلق! مشاهدات الإعلان تتحدث بشكل دوري في النظام. ⏱️\nإذا لم تظهر مشاهدات جديدة، فهذا يعني أنه جاري تحديث الأرقام، أو أن الإعلان يحتاج إلى (ترقية) ليصل لعدد أكبر من المهتمين.", { keyboard: SELLER_KEYBOARD, resize_keyboard: true });
        }

        // --- Driver Section ---
        else if (msg.text === '📋 كيف أعمل كمندوب أو أوفر خطاً؟') {
          await sendTelegramMessage(chatId, "بما أننا منصة إعلانية، يمكنك كصاحب سيارة إضافة إعلان مجاني في قسم (خدمات النقل/الخطوط).\n\nاكتب في إعلانك تفاصيل الخط الذي توفره (مثلاً: خط طلاب أو موظفين، والمناطق التي تمر بها)، وسيتواصل معك الأشخاص الباحثون عن خطوط نقل أو البائعون الذين يحتاجون توصيل طلباتهم.", { keyboard: DRIVER_KEYBOARD, resize_keyboard: true });
        }

        // --- Account Section ---
        else if (msg.text === '📖 كيفية التسجيل') {
          await sendTelegramMessage(chatId, "التسجيل سهل جداً! أدخل رقم هاتفك فقط 📱\n\n- إذا كان حسابك **جديداً**، سيطلب منك النظام إدخال رمز التفعيل واسمك الكامل.\n- أما إذا كان حسابك **قديماً**، فسيتم إدخالك مباشرة بمجرد كتابة رقمك.\n\nبكل بساطة! ✨", { keyboard: ACCOUNT_KEYBOARD, resize_keyboard: true, parse_mode: "Markdown" });
        }
        else if (msg.text === '👤 كيف أغير اسمي/صورتي؟') {
          await sendTelegramMessage(chatId, "لتعديل معلوماتك:\n1. قم بالدخول للموقع.\n2. اذهب إلى (حسابي).\n3. اضغط على (تعديل الملف الشخصي) ✏️\nمن هناك يمكنك تغيير اسمك أو وضع صورة شخصية جديدة لحسابك.", { keyboard: ACCOUNT_KEYBOARD, resize_keyboard: true });
        }
        else if (msg.text === '💳 المحفظة والنقاط') {
          await sendTelegramMessage(chatId, "المحفظة موجودة داخل (حسابي) في الموقع 💰.\n\nإذا كنت ترغب بـ (إضافة نقاط) لمحفظتك لغرض ترقية إعلاناتك، يرجى التواصل معنا عبر قسم (الدعم الفني) هنا في البوت وسنقوم بتزويدك بطرق الدفع المتاحة لتعبئة محفظتك!", { keyboard: ACCOUNT_KEYBOARD, resize_keyboard: true });
        }
        else if (msg.text === '💬 التحدث مع الإدارة / الدعم') {
          await sendTelegramMessage(chatId, "يرجى كتابة مشكلتك، بلاغك، أو استفسارك في رسالة واحدة وسنقوم بالرد عليك في أقرب وقت. 📝", { keyboard: ACCOUNT_KEYBOARD, resize_keyboard: true });
        }
        else if (msg.text === '🔑 استعادة كلمة المرور' || msg.text === '🔑 نسيت كلمة المرور') {
          await sendTelegramMessage(chatId, "يرجى الضغط على الزر أدناه لمشاركة رقم هاتفك للتحقق من هويتك بأمان 🔒", {
            keyboard: [[{ text: "📱 مشاركة رقم الهاتف", request_contact: true }], [{ text: "🔙 القائمة الرئيسية" }]],
            resize_keyboard: true,
            one_time_keyboard: true
          });
        }
        
        // --- Forgot Password Logic ---
        else if (msg.contact) {
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
        } 
        
        // --- Fallback (Support Message) ---
        else {
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
              await sendTelegramMessage(chatId, "يرجى اختيار أحد الخيارات من القائمة. للرجوع للخلف أرسل /start", {
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
