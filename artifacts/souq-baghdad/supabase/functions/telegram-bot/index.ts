import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const tgUrl = `https://api.telegram.org/bot${botToken}`;

async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  const body: any = { chat_id: chatId, text, parse_mode: 'HTML' };
  if (replyMarkup) body.reply_markup = replyMarkup;
  await fetch(`${tgUrl}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function answerCallbackQuery(callbackQueryId: string, text: string = '') {
  await fetch(`${tgUrl}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text })
  });
}

serve(async (req) => {
  try {
    const update = await req.json();
    
    let chatId: number;
    let text = '';
    let contact = null;
    let photo = null;
    let callbackQuery = null;

    if (update.message) {
      chatId = update.message.chat.id;
      text = update.message.text || '';
      contact = update.message.contact;
      photo = update.message.photo;
    } else if (update.callback_query) {
      callbackQuery = update.callback_query;
      chatId = callbackQuery.message.chat.id;
      text = callbackQuery.data;
    } else {
      return new Response('OK', { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch user and state
    const { data: tgUser } = await supabase.from('telegram_users').select('*').eq('telegram_chat_id', chatId).single();
    let state = tgUser?.bot_state || {};
    const userId = tgUser?.user_id;
    const phone = tgUser?.phone_number;

    // --- Main Menu Function ---
    const showMainMenu = async () => {
      state = {}; // reset state
      if (userId) {
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
      }
      await sendMessage(chatId, '🏠 <b>القائمة الرئيسية</b>\nماذا تريد أن تفعل؟', {
        inline_keyboard: [
          [{ text: '📦 نشر إعلان منتج', callback_data: 'publish_product' }],
          [{ text: '🚌 نشر خط نقل', callback_data: 'publish_transport' }],
          [{ text: '🔔 إدارة إشعاراتي', callback_data: 'manage_alerts' }],
        ]
      });
    };

    // --- Start / Register ---
    if (text === '/start') {
      await sendMessage(chatId, 'مرحباً بك في بوت <b>سوق بغداد الرقمي</b>! 🇮🇶\n\nيرجى مشاركة رقم هاتفك للتحقق من حسابك أو لإنشاء حساب جديد تلقائياً لتتمكن من النشر مجاناً من التيليكرام.', {
        keyboard: [[{ text: '📱 مشاركة رقم الهاتف', request_contact: true }]],
        one_time_keyboard: true,
        resize_keyboard: true
      });
      return new Response('OK', { status: 200 });
    }

    if (contact) {
      let phoneNumber = contact.phone_number;
      if (!phoneNumber.startsWith('+')) phoneNumber = '+' + phoneNumber;

      // Find user
      const { data: users } = await supabase.auth.admin.listUsers();
      let matchedUserId = users?.users?.find(u => u.phone === phoneNumber || u.phone === phoneNumber.replace('+964', '0'))?.id;

      // Create user if not exists
      if (!matchedUserId) {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          phone: phoneNumber,
          password: Math.random().toString(36).slice(-8),
          phone_confirm: true
        });
        if (createError) {
          await sendMessage(chatId, 'عذراً، حدث خطأ أثناء إنشاء حسابك.');
          return new Response('OK', { status: 200 });
        }
        matchedUserId = newUser.user.id;
        
        // Ensure profile exists (in case trigger is missing)
        const fullName = update.message.from.first_name + (update.message.from.last_name ? ' ' + update.message.from.last_name : '');
        await supabase.from('profiles').upsert({ id: matchedUserId, full_name: fullName, phone: phoneNumber, role: 'user', points: 100 });
      }

      // Save telegram link
      await supabase.from('telegram_users').upsert({
        user_id: matchedUserId,
        telegram_chat_id: chatId,
        phone_number: phoneNumber,
        bot_state: {}
      }, { onConflict: 'telegram_chat_id' });

      await sendMessage(chatId, '🎉 <b>تم التسجيل والربط بنجاح!</b>\nيمكنك الآن البدء بالنشر واستخدام جميع خدمات المنصة.', { remove_keyboard: true });
      await showMainMenu();
      return new Response('OK', { status: 200 });
    }

    if (!userId) {
      if (callbackQuery) await answerCallbackQuery(callbackQuery.id, 'يجب التسجيل أولاً');
      await sendMessage(chatId, '⚠️ يرجى إرسال رقم هاتفك للبدء بالنشر.\nأرسل /start');
      return new Response('OK', { status: 200 });
    }

    // --- Handle Callback Queries (Button Clicks) ---
    if (callbackQuery) {
      await answerCallbackQuery(callbackQuery.id);
      const action = callbackQuery.data;

      if (action === 'main_menu') {
        await showMainMenu();
        return new Response('OK', { status: 200 });
      }

      // Product Wizard
      if (action === 'publish_product') {
        state = { step: 'product_title', data: {} };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await sendMessage(chatId, '📦 <b>نشر منتج جديد</b>\nيرجى كتابة <b>عنوان</b> المنتج (مثال: ايفون 15 برو ماكس):');
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('prod_cat_')) {
        state.data.category = action.replace('prod_cat_', '');
        state.step = 'product_condition';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await sendMessage(chatId, 'ما هي <b>حالة</b> المنتج؟', {
          inline_keyboard: [
            [{ text: '🆕 جديد', callback_data: 'prod_cond_new' }, { text: '♻️ مستعمل', callback_data: 'prod_cond_used' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('prod_cond_')) {
        state.data.condition = action.replace('prod_cond_', '');
        state.step = 'product_image';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await sendMessage(chatId, '📸 الرجاء <b>إرسال صورة</b> واحدة واضحة للمنتج:');
        return new Response('OK', { status: 200 });
      }

      // Transport Wizard
      if (action === 'publish_transport') {
        state = { step: 'trans_type', data: {} };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await sendMessage(chatId, '🚌 <b>نشر خط نقل</b>\nهل تبحث عن خط أم تقدم خدمة خط؟', {
          inline_keyboard: [
            [{ text: '🙋‍♂️ أبحث عن خط (طلب)', callback_data: 'trans_type_request' }],
            [{ text: '🚗 أوفر خط (عرض)', callback_data: 'trans_type_offer' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('trans_type_')) {
        state.data.type = action.replace('trans_type_', '');
        state.step = 'trans_cat';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await sendMessage(chatId, 'الخط مخصص لمن؟', {
          inline_keyboard: [
            [{ text: '🎓 طلاب', callback_data: 'trans_cat_student' }, { text: '💼 موظفين', callback_data: 'trans_cat_employee' }],
            [{ text: '🚨 نقل طارئ', callback_data: 'trans_cat_emergency' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('trans_cat_')) {
        state.data.categoryType = action.replace('trans_cat_', '');
        state.step = 'trans_regions';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await sendMessage(chatId, '📍 الرجاء كتابة <b>المناطق</b> التي يشملها الخط (مثال: المنصور، اليرموك، الكرادة):');
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('trans_target_')) {
        state.data.targetAudience = action.replace('trans_target_', '');
        state.step = 'trans_vehicle';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await sendMessage(chatId, 'يرجى كتابة <b>نوع العجلة</b> (مثال: صالون، باص 11، كيا):');
        return new Response('OK', { status: 200 });
      }
    }

    // --- Handle Text Inputs for State Machine ---
    if (text || photo) {
      if (text === '/cancel') {
        await showMainMenu();
        return new Response('OK', { status: 200 });
      }

      // PRODUCT WIZARD
      if (state.step === 'product_title' && text) {
        state.data.title = text;
        state.step = 'product_price';
        await sendMessage(chatId, '💰 يرجى كتابة <b>السعر</b> (مثال: 50,000 دينار):');
      } 
      else if (state.step === 'product_price' && text) {
        state.data.price = text;
        state.step = 'product_desc';
        await sendMessage(chatId, '📝 يرجى كتابة <b>وصف المنتج</b> وتفاصيله:');
      }
      else if (state.step === 'product_desc' && text) {
        state.data.description = text;
        state.step = 'product_gov';
        await sendMessage(chatId, '📍 يرجى كتابة <b>المحافظة/المنطقة</b> (مثال: بغداد - الكرادة):');
      }
      else if (state.step === 'product_gov' && text) {
        state.data.governorate = text;
        state.step = 'product_category';
        await sendMessage(chatId, '📑 اختر <b>القسم</b> المناسب للمنتج:', {
          inline_keyboard: [
            [{ text: '📱 إلكترونيات', callback_data: 'prod_cat_إلكترونيات' }, { text: '👕 أزياء وملابس', callback_data: 'prod_cat_أزياء وملابس' }],
            [{ text: '🏠 المنزل', callback_data: 'prod_cat_المنزل' }, { text: '🚗 أوتو', callback_data: 'prod_cat_أوتو' }],
            [{ text: '🔄 أخرى', callback_data: 'prod_cat_أصناف أخرى' }]
          ]
        });
      }
      else if (state.step === 'product_image' && photo) {
        // Handle photo upload
        await sendMessage(chatId, '⏳ جاري رفع الصورة ونشر المنتج، يرجى الانتظار...');
        const fileId = photo[photo.length - 1].file_id;
        const fileRes = await fetch(`${tgUrl}/getFile?file_id=${fileId}`);
        const fileData = await fileRes.json();
        
        let imageUrl = '';
        if (fileData.ok) {
          const filePath = fileData.result.file_path;
          const imageRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
          const imageBlob = await imageRes.blob();
          const fileName = `tg_${chatId}_${Date.now()}.jpg`;
          
          const { data: uploadData, error: uploadErr } = await supabase.storage.from('ad-images').upload(fileName, imageBlob, { contentType: 'image/jpeg' });
          if (uploadData) {
            const { data: pubUrl } = supabase.storage.from('ad-images').getPublicUrl(fileName);
            imageUrl = pubUrl.publicUrl;
          }
        }

        // Insert Product
        const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', userId).single();
        await supabase.from('products').insert({
          title: state.data.title,
          price: state.data.price,
          description: state.data.description,
          governorate: state.data.governorate,
          category: state.data.category,
          condition: state.data.condition,
          phone: phone,
          images: imageUrl ? [imageUrl] : [],
          posted_by: userId,
          seller_name: profile?.full_name || 'بائع',
          seller_avatar: profile?.avatar_url || '',
          status: 'active'
        });

        await sendMessage(chatId, '✅ <b>شكراً لتواصلك!</b>\nتم نشر إعلان المنتج في منصة <b>سوق بغداد</b> بنجاح. 🚀', {
          inline_keyboard: [[{ text: '🏠 العودة للقائمة الرئيسية', callback_data: 'main_menu' }]]
        });
        state = {}; // clear state
      }
      
      // TRANSPORT WIZARD
      else if (state.step === 'trans_regions' && text) {
        state.data.regions = text;
        state.step = 'trans_university';
        await sendMessage(chatId, '🏫 يرجى كتابة اسم <b>الجامعة أو مكان العمل</b> (أو اكتب "لا يوجد"):');
      }
      else if (state.step === 'trans_university' && text) {
        state.data.university = text;
        state.step = 'trans_price';
        await sendMessage(chatId, '💰 يرجى كتابة <b>السعر أو الأجرة</b> (مثال: 50 الف، أو "حسب الاتفاق"):');
      }
      else if (state.step === 'trans_price' && text) {
        state.data.price = text;
        state.step = 'trans_seats';
        await sendMessage(chatId, '👥 كم <b>عدد المقاعد</b> المطلوبة أو المتوفرة؟ (اكتب رقماً، مثال: 4):');
      }
      else if (state.step === 'trans_seats' && text) {
        state.data.seats = parseInt(text) || 1;
        state.step = 'trans_shift';
        await sendMessage(chatId, '⏰ ما هو <b>وقت الدوام</b>؟ (مثال: صباحي 8-2):');
      }
      else if (state.step === 'trans_shift' && text) {
        state.data.shift = text;
        state.step = 'trans_target';
        await sendMessage(chatId, 'الخط مخصص لمن؟', {
          inline_keyboard: [
            [{ text: '👨 ذكور فقط', callback_data: 'trans_target_ذكور فقط' }, { text: '👩 إناث فقط', callback_data: 'trans_target_إناث فقط' }],
            [{ text: '👥 مختلط', callback_data: 'trans_target_مختلط' }]
          ]
        });
      }
      else if (state.step === 'trans_vehicle' && text) {
        state.data.vehicleType = text;
        state.step = 'trans_note';
        await sendMessage(chatId, '📝 هل هناك <b>ملاحظات إضافية</b>؟ (اكتب "لا" إذا لم يوجد):');
      }
      else if (state.step === 'trans_note' && text) {
        state.data.note = text === 'لا' ? '' : text;
        
        // Insert Transport Ad
        await sendMessage(chatId, '⏳ جاري نشر إعلان الخط...');
        const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', userId).single();
        
        await supabase.from('transport_ads').insert({
          type: state.data.type,
          category_type: state.data.categoryType,
          university: state.data.university,
          regions: state.data.regions,
          price: state.data.price,
          seats: state.data.seats,
          shift: state.data.shift,
          vehicle_type: state.data.vehicleType,
          target_audience: state.data.targetAudience,
          note: state.data.note,
          phone: phone,
          posted_by: userId,
          seller_name: profile?.full_name || 'صاحب خط',
          seller_avatar: profile?.avatar_url || '',
          status: 'published'
        });

        await sendMessage(chatId, '✅ <b>شكراً لتواصلك!</b>\nتم نشر إعلان الخط في منصة <b>سوق بغداد</b> بنجاح. 🚀', {
          inline_keyboard: [[{ text: '🏠 العودة للقائمة الرئيسية', callback_data: 'main_menu' }]]
        });
        state = {}; // clear state
      } else if (Object.keys(state).length > 0) {
        // Valid state but wrong input (e.g. sent text instead of photo)
        if (state.step === 'product_image') {
          await sendMessage(chatId, '⚠️ الرجاء <b>إرسال صورة</b> كـ(صورة) وليس كنص.');
        } else {
          await sendMessage(chatId, '⚠️ إدخال غير متوقع، لإلغاء العملية الحالية أرسل /cancel');
        }
      } else {
        await showMainMenu();
      }

      // Update state in db
      if (userId) {
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
})
