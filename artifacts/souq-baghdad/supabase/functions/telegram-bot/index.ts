import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';

serve(async (req) => {
  try {
    const update = await req.json();
    if (!update.message) return new Response('OK', { status: 200 });

    const chatId = update.message.chat.id;
    const text = update.message.text || '';
    const contact = update.message.contact;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    if (text === '/start') {
      await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: 'مرحباً بك في بوت الدعم الفني لسوق بغداد! لتفعيل إشعارات الخطوط ونشر إعلاناتك، يرجى مشاركة رقم هاتفك للتحقق من حسابك.',
          reply_markup: {
            keyboard: [[{ text: '📱 مشاركة رقم الهاتف', request_contact: true }]],
            one_time_keyboard: true,
            resize_keyboard: true
          }
        })
      });
      return new Response('OK', { status: 200 });
    }

    if (contact) {
      let phoneNumber = contact.phone_number;
      if (!phoneNumber.startsWith('+')) phoneNumber = '+' + phoneNumber;

      // Find user in Supabase by phone
      const { data: users, error: userError } = await supabase.auth.admin.listUsers();
      let matchedUserId = null;
      
      if (!userError && users) {
        const found = users.users.find((u: any) => u.phone === phoneNumber || u.phone === phoneNumber.replace('+964', '0'));
        if (found) matchedUserId = found.id;
      }

      if (matchedUserId) {
        // Upsert to telegram_users
        await supabase.from('telegram_users').upsert({
          user_id: matchedUserId,
          telegram_chat_id: chatId,
          phone_number: phoneNumber
        }, { onConflict: 'telegram_chat_id' });

        await fetch(tgUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: 'تم ربط حسابك بنجاح! 🎉 الآن ستتلقى إشعارات الخطوط مباشرة هنا. يمكنك أيضاً استخدام القائمة لنشر خط أو البحث.',
            reply_markup: {
              keyboard: [[{ text: '🚌 نشر خط جديد' }, { text: '🔍 ابحث عن خط' }]],
              resize_keyboard: true
            }
          })
        });
      } else {
        await fetch(tgUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: 'لم نتمكن من العثور على حساب مرتبط بهذا الرقم في تطبيق سوق بغداد. يرجى التأكد من التسجيل في التطبيق بنفس الرقم.',
            reply_markup: { remove_keyboard: true }
          })
        });
      }
      return new Response('OK', { status: 200 });
    }

    if (text === '🚌 نشر خط جديد' || text === '🔍 ابحث عن خط') {
      await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: 'هذه الميزة قيد التطوير حالياً! قريباً ستتمكن من النشر والبحث مباشرة من هنا. يرجى استخدام التطبيق حالياً لإتمام هذه العملية.'
        })
      });
    }

    return new Response('OK', { status: 200 });
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
})
