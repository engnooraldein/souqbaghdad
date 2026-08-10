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

async function sendPhoto(chatId: string | number, photoUrl: string, caption: string) {
  await fetch(`${tgUrl}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption, parse_mode: 'HTML' })
  });
}

// Channel IDs from environment variables (e.g., @ChannelUsername or -100123456789)
const PRODUCT_CHANNEL = Deno.env.get('PRODUCT_CHANNEL_ID') || '';
const TRANSPORT_CHANNEL = Deno.env.get('TRANSPORT_CHANNEL_ID') || '';

serve(async (req) => {
  try {
    const payload = await req.json();
    
    // Check if it's a Supabase Database Webhook (pg_net)
    if (payload.type === 'INSERT' && payload.table) {
      const record = payload.record;
      
      if (payload.table === 'products' && PRODUCT_CHANNEL) {
        const caption = `📦 <b>منتج جديد: ${record.title || ''}</b>\n\n` +
                        `💰 <b>السعر:</b> ${record.price || ''}\n` +
                        `📍 <b>المحافظة:</b> ${record.governorate || ''}\n` +
                        `📝 <b>التفاصيل:</b> ${record.description || ''}\n\n` +
                        `👤 <b>البائع:</b> ${record.seller_name || 'بائع'}\n` +
                        `📱 <b>تواصل عبر التطبيق أو البوت للطلب!</b>`;
        const imageUrl = record.images && record.images.length > 0 ? record.images[0] : null;
        if (imageUrl) {
          await sendPhoto(PRODUCT_CHANNEL, imageUrl, caption);
        } else {
          await sendMessage(PRODUCT_CHANNEL, caption);
        }
      }
      else if ((payload.table === 'ads' || payload.table === 'transport_ads') && TRANSPORT_CHANNEL) {
        // Only process transport ads from the 'ads' table, or support the old 'transport_ads' table
        if (payload.table === 'ads' && record.category !== 'transport') {
          return new Response('OK', { status: 200 });
        }
        
        const typeStr = record.type === 'offer' ? '🚗 أوفر خط' : '🙋‍♂️ أبحث عن خط';
        let desc: any = {};
        try { desc = typeof record.description === 'string' ? JSON.parse(record.description) : record.description; } catch(e){}
        
        const msg = `🚌 <b>${typeStr} إلى ${record.city || record.university || ''}</b>\n\n` +
                    `📍 <b>المناطق:</b> ${record.location || record.regions || ''}\n` +
                    `💰 <b>السعر:</b> ${record.price || ''}\n` +
                    `⏰ <b>الوقت:</b> ${desc?.shift || record.shift || ''}\n` +
                    `👥 <b>المقاعد المتوفرة/المطلوبة:</b> ${desc?.seats || record.seats || ''}\n\n` +
                    `👤 <b>الناشر:</b> ${record.seller_name || 'مستخدم'}\n` +
                    `📱 <b>تواصل عبر التطبيق أو البوت للتفاصيل!</b>`;
        await sendMessage(TRANSPORT_CHANNEL, msg);
      }

      return new Response('OK', { status: 200 });
    }

    // Otherwise it's a telegram update
    const update = payload;
    
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
          [{ text: '🗑️ إدارة إعلاناتي (حذف)', callback_data: 'manage_my_ads' }],
          [{ text: '📞 الدعم الفني والاستفسارات', callback_data: 'contact_support' }],
          [{ text: '🔔 إدارة إشعاراتي', callback_data: 'manage_alerts' }],
        ]
      });
    };

    // --- Start / Register ---
    if (text === '/start') {
      await sendMessage(chatId, 'مرحباً بك في بوت <b>سوق بغداد الرقمي</b>! 🇮🇶\n\nيرجى مشاركة رقم هاتفك للتحقق من حسابك أو لإنشاء حساب جديد تلقائياً لتتمكن من النشر واستخدام خدمات الدعم الفني.', {
        keyboard: [[{ text: '📱 مشاركة رقم الهاتف', request_contact: true }]],
        one_time_keyboard: true,
        resize_keyboard: true
      });
      return new Response('OK', { status: 200 });
    }

    if (contact) {
      let phoneNumber = contact.phone_number;
      if (!phoneNumber.startsWith('+')) phoneNumber = '+' + phoneNumber;

      // Clean the phone number (remove spaces, dashes, plus)
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      const localPhone = cleanPhone.startsWith('964') ? '0' + cleanPhone.substring(3) : cleanPhone;
      const intlPhone = cleanPhone.startsWith('964') ? '+' + cleanPhone : (cleanPhone.startsWith('0') ? '+964' + cleanPhone.substring(1) : '+' + cleanPhone);

      // Search in profiles first (more reliable and no pagination limits)
      const { data: profileMatches } = await supabase.from('profiles')
        .select('id, phone')
        .or(`phone.eq.${localPhone},phone.eq.${intlPhone},phone.eq.${cleanPhone}`);
        
      let matchedUserId = profileMatches && profileMatches.length > 0 ? profileMatches[0].id : null;

      // Create user if not exists
      if (!matchedUserId) {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          phone: intlPhone,
          password: Math.random().toString(36).slice(-8),
          phone_confirm: true
        });
        if (createError) {
          await sendMessage(chatId, 'عذراً، الرقم مسجل مسبقاً أو حدث خطأ أثناء التحقق.');
          return new Response('OK', { status: 200 });
        }
        matchedUserId = newUser.user.id;
        
        // Ensure profile exists (in case trigger is missing)
        const fullName = update.message.from.first_name + (update.message.from.last_name ? ' ' + update.message.from.last_name : '');
        await supabase.from('profiles').upsert({ id: matchedUserId, full_name: fullName, phone: localPhone, role: 'user', points: 100 });
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

      // Manage Ads
      if (action === 'manage_my_ads') {
        const { data: myProducts } = await supabase.from('products').select('id, title, price, governorate').eq('seller_id', userId).limit(5);
        const { data: myTransports } = await supabase.from('ads').select('id, title, price, location, type').eq('seller_id', userId).eq('category', 'transport').limit(5);
        
        if ((!myProducts || myProducts.length === 0) && (!myTransports || myTransports.length === 0)) {
           await sendMessage(chatId, 'لا يوجد لديك أي إعلانات منشورة حالياً.', { inline_keyboard: [[{ text: '🏠 العودة للقائمة الرئيسية', callback_data: 'main_menu' }]] });
           return new Response('OK', { status: 200 });
        }

        await sendMessage(chatId, '🗑️ <b>إدارة إعلاناتي</b>\nإليك قائمة إعلاناتك الحالية:');

        if (myProducts && myProducts.length > 0) {
          for (const p of myProducts) {
            const text = `📦 <b>${p.title}</b>\n💰 السعر: ${p.price}\n📍 المحافظة: ${p.governorate}`;
            await sendMessage(chatId, text, { inline_keyboard: [[{ text: '❌ حذف هذا المنتج', callback_data: `del_prod_${p.id}` }]] });
          }
        }

        if (myTransports && myTransports.length > 0) {
          for (const t of myTransports) {
            const typeText = t.type === 'offer' ? 'أوفر خط' : 'أبحث عن خط';
            const text = `🚌 <b>${t.title}</b> (${typeText})\n💰 السعر: ${t.price}\n📍 المنطقة: ${t.location}`;
            await sendMessage(chatId, text, { 
              inline_keyboard: [
                [{ text: '✅ إغلاق الإعلان (حصلت على خط)', callback_data: `solve_trans_${t.id}` }],
                [{ text: '❌ حذف نهائي', callback_data: `del_trans_${t.id}` }]
              ] 
            });
          }
        }
        
        await sendMessage(chatId, 'اختر الإجراء المناسب أسفل الإعلان:', { inline_keyboard: [[{ text: '🏠 العودة للقائمة الرئيسية', callback_data: 'main_menu' }]] });
        
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('del_prod_')) {
        const prodId = action.replace('del_prod_', '');
        await supabase.from('products').delete().eq('id', prodId).eq('seller_id', userId);
        await sendMessage(chatId, '✅ تم حذف المنتج بنجاح.', { inline_keyboard: [[{ text: 'العودة لإدارة إعلاناتي', callback_data: 'manage_my_ads' }]] });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('del_trans_')) {
        const transId = action.replace('del_trans_', '');
        await supabase.from('ads').delete().eq('id', transId).eq('seller_id', userId);
        await sendMessage(chatId, '✅ تم حذف الخط بنجاح.', { inline_keyboard: [[{ text: 'العودة لإدارة إعلاناتي', callback_data: 'manage_my_ads' }]] });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('solve_trans_')) {
        const transId = action.replace('solve_trans_', '');
        await supabase.from('ads').update({ status: 'matched', completedAt: new Date().toISOString() }).eq('id', transId).eq('seller_id', userId);
        await sendMessage(chatId, '✅ تم إغلاق الإعلان بنجاح وتحويله إلى "مكتمل".', { inline_keyboard: [[{ text: 'العودة لإدارة إعلاناتي', callback_data: 'manage_my_ads' }]] });
        return new Response('OK', { status: 200 });
      }

      // Support Wizard
      if (action === 'contact_support') {
        state = { step: 'support_message', data: {} };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await sendMessage(chatId, '📞 <b>الدعم الفني للاستفسارات والشكاوى</b>\n\nيرجى كتابة رسالتك أو استفسارك بالتفصيل وسيقوم فريق الدعم بالرد عليك بأقرب وقت:');
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

      // SUPPORT WIZARD
      if (state.step === 'support_message' && text) {
        await sendMessage(chatId, '⏳ جاري إرسال رسالتك للدعم الفني...');
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
        
        await supabase.from('support_messages').insert({
          user_id: userId,
          name: profile?.full_name || 'مستخدم تيليكرام',
          phone: phone,
          message: text,
          status: 'new'
        });

        await sendMessage(chatId, '✅ <b>تم إرسال رسالتك بنجاح!</b>\nسيقوم فريق الدعم الفني بالتواصل معك قريباً.', {
          inline_keyboard: [[{ text: '🏠 العودة للقائمة الرئيسية', callback_data: 'main_menu' }]]
        });
        state = {}; // clear state
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
        const { error: prodInsertError } = await supabase.from('products').insert({
          title: state.data.title,
          price: state.data.price,
          description: state.data.description,
          governorate: state.data.governorate,
          category: state.data.category,
          condition: state.data.condition,
          phone: phone,
          images: imageUrl ? [imageUrl] : [],
          seller_id: userId,
          seller_name: profile?.full_name || 'بائع',
          seller_avatar: profile?.avatar_url || '',
          status: 'active'
        });

        // Channel posting is now handled by the database webhook

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
        
        const { error: transInsertError } = await supabase.from('ads').insert({
          type: state.data.type === 'offer' ? 'offer' : 'request',
          title: state.data.type === 'offer' ? `أوفر خط إلى ${state.data.university}` : `أبحث عن خط إلى ${state.data.university}`,
          description: JSON.stringify({
            shift: state.data.shift,
            seats: state.data.seats,
            vehicleType: state.data.vehicleType,
            targetAudience: state.data.targetAudience,
            categoryType: state.data.categoryType || 'student',
            note: state.data.note,
            interest: 0,
            whatsappClicks: 0
          }),
          price: state.data.price ? state.data.price.replace(/[^0-9]/g, '') : '0',
          category: 'transport',
          location: state.data.regions,
          city: state.data.university,
          images: [],
          phone: phone,
          status: 'active',
          is_demo: false,
          seller_id: userId,
          seller_name: profile?.full_name || 'صاحب خط',
          seller_avatar: profile?.avatar_url || '',
          short_id: Math.random().toString(36).substring(2, 7).toUpperCase()
        });

        // Channel posting is now handled by the database webhook

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
