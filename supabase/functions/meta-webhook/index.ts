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

// ── 1. إرسال رسالة نصية بسيطة ──
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

// ── 2. إرسال أزرار الردود السريعة (Quick Replies) ──
const sendMetaQuickReplies = async (recipientId: string, text: string, quickReplies: any[], token: string) => {
  if (!token) return;
  const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        messaging_type: "RESPONSE",
        message: {
          text: text,
          quick_replies: quickReplies.slice(0, 13) // الحد الأقصى لماسنجر هو 13 زر
        }
      })
    });
    if (!res.ok) console.error("Quick Replies Error:", await res.text());
  } catch (e) {
    console.error("sendMetaQuickReplies exception:", e);
  }
};

// ── 3. إرسال قالب الأزرار التفاعلية (Button Template) ──
const sendMetaButtonTemplate = async (recipientId: string, text: string, buttons: any[], token: string) => {
  if (!token) return;
  const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        messaging_type: "RESPONSE",
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "button",
              text: text,
              buttons: buttons.slice(0, 3) // الحد الأقصى لماسنجر هو 3 أزرار بالقالب
            }
          }
        }
      })
    });
    if (!res.ok) console.error("Button Template Error:", await res.text());
  } catch (e) {
    console.error("sendMetaButtonTemplate exception:", e);
  }
};

// ── 4. إرسال الكاروسيل الأفقي للخطوط والإعلانات (Generic Template Carousel) ──
const sendMetaGenericTemplate = async (recipientId: string, elements: any[], token: string) => {
  if (!token) return;
  const url = `https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        messaging_type: "RESPONSE",
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements: elements.slice(0, 10) // الحد الأقصى لماسنجر هو 10 بطاقات
            }
          }
        }
      })
    });
    if (!res.ok) console.error("Generic Template Error:", await res.text());
  } catch (e) {
    console.error("sendMetaGenericTemplate exception:", e);
  }
};

// ── 5. الرد على تعليق في فيسبوك (Facebook Comment Reply) ──
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

// ── 6. الرد على تعليق في إنستغرام (Instagram Comment Reply) ──
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

// ── 7. إرسال رد خاص لصاحب التعليق (Private Reply) ──
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

// ── 8. إرسال تنبيه فوري للأدمن على تيليكرام عند الشكاوى أو البلاغات ──
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

// ── 9. استدعاء محرك الذكاء الاصطناعي ai-engine ──
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

// ─────────────────────────────────────────────────────────────────────────────
// 🤖 MESSENGER INTERACTIVE ENGINE (محرك الأزرار والقوائم والرادار التفاعلي)
// ─────────────────────────────────────────────────────────────────────────────
const handleMessengerInteractive = async (
  senderId: string,
  payload: string | null,
  text: string,
  token: string,
  platform: string
): Promise<boolean> => {
  const cleanPayload = (payload || '').trim();
  const cleanText = text.trim().toLowerCase();

  // 1. القائمة الرئيسية (Main Menu / Greetings)
  const isMenuTrigger = 
    cleanPayload === 'MAIN_MENU' ||
    cleanPayload === 'START' ||
    ['start', '/start', 'مرحبا', 'مرحباً', 'هلا', 'سلام', 'السلام عليكم', 'menu', 'القائمة', 'الرئيسية'].some(k => cleanText === k);

  if (isMenuTrigger) {
    const welcomeMsg = 
      `أهلاً بك في منصة سوق بغداد 🇮🇶\n` +
      `خدمة النقل الذكي للجامعات والمدارس والخطوط المباشرة ✨\n\n` +
      `يرجى اختيار صفتك للبدء:`;

    const roleQuickReplies = [
      { content_type: "text", title: "طالب / راكب 🎓", payload: "ROLE_PASSENGER" },
      { content_type: "text", title: "كابتن / سائق 🚗", payload: "ROLE_DRIVER" },
      { content_type: "text", title: "شريك معتمد 👑", payload: "ROLE_PARTNER" }
    ];

    await sendMetaQuickReplies(senderId, welcomeMsg, roleQuickReplies, token);
    return true;
  }

  // 2. واجهة الطالب / الراكب (Student Role)
  if (cleanPayload === 'ROLE_PASSENGER' || cleanText === 'طالب' || cleanText === 'طالبة') {
    const passengerMsg = 
      `🎓 واجهة الطالب / الراكب 🌹\n\n` +
      `ابحث عن خطوط النقل المتاحة للجامعات أو فعّل رادار الإشعارات لمسارك:`;

    const buttons = [
      { type: "postback", title: "البحث عن خطوط 🚌", payload: "SEARCH_TRANSPORT" },
      { type: "postback", title: "رادار التنبيهات 📡", payload: "RADAR_PROMPT" },
      { type: "web_url", title: "تصفح كل الخطوط بالموقع 🌐", url: "https://www.souqbaghdad.store/transport" }
    ];

    await sendMetaButtonTemplate(senderId, passengerMsg, buttons, token);
    return true;
  }

  // 3. شاشة اختيار الوجهة الجامعية (Search Transport Prompt)
  if (cleanPayload === 'SEARCH_TRANSPORT' || cleanText === 'خطوط' || cleanText === 'بحث عن خط') {
    const promptMsg = 
      `🚌 اختر وجهتك الجامعية، أو اكتب اسم كليتك أو منطقتك برسالة للبحث الفوري:`;

    const uniQuickReplies = [
      { content_type: "text", title: "جامعة الرافدين 🎓", payload: "SEARCH_DEST_الرافدين" },
      { content_type: "text", title: "جامعة دجلة 🎓", payload: "SEARCH_DEST_دجلة" },
      { content_type: "text", title: "بغداد الجادرية 🎓", payload: "SEARCH_DEST_الجادرية" },
      { content_type: "text", title: "الجامعة المستنصرية 🎓", payload: "SEARCH_DEST_المستنصرية" },
      { content_type: "text", title: "الجامعة التكنولوجية 🎓", payload: "SEARCH_DEST_التكنولوجية" },
      { content_type: "text", title: "جامعة النهرين 🎓", payload: "SEARCH_DEST_النهرين" },
      { content_type: "text", title: "كلية المنصور 🎓", payload: "SEARCH_DEST_المنصور" },
      { content_type: "text", title: "الرئيسية 🏠", payload: "MAIN_MENU" }
    ];

    await sendMetaQuickReplies(senderId, promptMsg, uniQuickReplies, token);
    return true;
  }

  // 4. إرشادات الرادار (Radar Prompt)
  if (cleanPayload === 'RADAR_PROMPT') {
    const radarMsg = 
      `📡 رادار التنبيهات 24/7 لمسارك ⚡\n\n` +
      `أرسل رسالة تحتوي على مسارك (منطقتك إلى وجهتك)\nمثال: "السيدية إلى جامعة الرافدين"\nوسيقوم الرادار بحفظ طلبك وتنبيهك فور قيام أي كابتن بنشر خط يمر بك!`;

    const quickReplies = [
      { content_type: "text", title: "البحث عن خطوط 🚌", payload: "SEARCH_TRANSPORT" },
      { content_type: "text", title: "الرئيسية 🏠", payload: "MAIN_MENU" }
    ];

    await sendMetaQuickReplies(senderId, radarMsg, quickReplies, token);
    return true;
  }

  // 5. البحث الذكي عن الخطوط وعرض الكاروسيل (Search by Destination/Area)
  let searchKeyword = '';
  if (cleanPayload.startsWith('SEARCH_DEST_')) {
    searchKeyword = decodeURIComponent(cleanPayload.replace('SEARCH_DEST_', '')).trim();
  } else {
    // التحقق مما إذا كان النص المرسل يحتوي على أسماء جامعات أو مناطق مشهورة
    const knownKeywords = [
      'الرافدين', 'دجلة', 'الجادرية', 'المستنصرية', 'التكنولوجية', 'النهرين', 'المنصور', 'العراقية',
      'السيدية', 'الكرادة', 'الدورة', 'الشعب', 'الغزالية', 'اليرموك', 'الزعفرانية',
      'الحرية', 'الكاظمية', 'زيونة', 'البنوك', 'الأعظمية', 'حي الجامعة', 'مدينة الصدر', 'البيجية'
    ];
    for (const kw of knownKeywords) {
      if (cleanText.includes(kw.toLowerCase())) {
        searchKeyword = kw;
        break;
      }
    }
  }

  if (searchKeyword) {
    // حماية التكاليف: سحب 5 نتائج فقط كحد أقصى للبطاقات
    const { data: ads } = await supabase
      .from('ads')
      .select('id, short_id, title, price, university, destination, location, phone, images, description')
      .eq('category', 'transport')
      .eq('status', 'active')
      .or(`university.ilike.%${searchKeyword}%,destination.ilike.%${searchKeyword}%,title.ilike.%${searchKeyword}%,description.ilike.%${searchKeyword}%,location.ilike.%${searchKeyword}%`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (ads && ads.length > 0) {
      const elements = ads.map((ad: any) => {
        const img = (ad.images && ad.images.length > 0) 
          ? ad.images[0] 
          : 'https://www.souqbaghdad.store/transport-og.png';
        const adUrl = `https://www.souqbaghdad.store/product/${ad.short_id || ad.id}`;
        const subtitle = `📍 ${ad.location || 'بغداد'} ⬅️ ${ad.university || ad.destination || searchKeyword} | 💰 ${ad.price ? ad.price + ' د.ع' : 'تواصل لمعرفة السعر'}`;
        
        return {
          title: (ad.title || `خط نقل ${searchKeyword}`).slice(0, 80),
          subtitle: subtitle.slice(0, 80),
          image_url: img,
          buttons: [
            {
              type: "web_url",
              url: adUrl,
              title: "معاينة وحجز مقعد 💺"
            },
            {
              type: "postback",
              title: "تفعيل رادار للمسار 📡",
              payload: `ACTIVATE_RADAR_${encodeURIComponent(ad.location || 'بغداد')}_${encodeURIComponent(ad.university || searchKeyword)}`
            }
          ]
        };
      });

      await sendMetaMessage(senderId, `🚌 نتائج الخطوط المتوفرة لـ [${searchKeyword}]:`, token);
      await sendMetaGenericTemplate(senderId, elements, token);
      return true;
    } else {
      // لم يتم العثور على خطوط -> اقتراح الرادار المباشر
      const noResultsMsg = 
        `🚌 لم نجد مقاعد شاغرة متوفرة حالياً لـ [${searchKeyword}].\n\n` +
        `🔔 هل ترغب بتفعيل رادار الإشعارات ليتم تنبيهك فور قيام أي كابتن بنشر خط يمر بهذا المسار؟`;

      const buttons = [
        { 
          type: "postback", 
          title: "تفعيل الرادار لمساري 📡", 
          payload: `ACTIVATE_RADAR_${encodeURIComponent(searchKeyword)}_الجامعة` 
        },
        { 
          type: "web_url", 
          title: "تصفح كل الخطوط بالموقع 🌐", 
          url: "https://www.souqbaghdad.store/transport" 
        },
        { 
          type: "postback", 
          title: "الرئيسية 🏠", 
          payload: "MAIN_MENU" 
        }
      ];

      await sendMetaButtonTemplate(senderId, noResultsMsg, buttons, token);
      return true;
    }
  }

  // 6. تفعيل رادار الإشعارات (Activate Radar Action)
  if (cleanPayload.startsWith('ACTIVATE_RADAR_')) {
    const parts = cleanPayload.replace('ACTIVATE_RADAR_', '').split('_');
    const orig = decodeURIComponent(parts[0] || '').trim() || 'بغداد';
    const dest = decodeURIComponent(parts[1] || '').trim() || 'الجامعة';

    try {
      await supabase.from('transport_requests').upsert({
        telegram_chat_id: `fb_${senderId}`,
        telegram_user_id: `fb_${senderId}`,
        user_name: `FB_User_${senderId.slice(-4)}`,
        origin: orig,
        destination: dest,
        raw_query: `messenger: ${orig} → ${dest}`,
        status: 'pending'
      }, { onConflict: 'telegram_chat_id,origin,destination' });
    } catch (e) {
      console.error("Error upserting transport_request from messenger:", e);
    }

    const confirmMsg = 
      `🔔 تم تفعيل رادار المسار بنجاح! ✅\n\n` +
      `📍 من: ${orig}\n🎓 إلى: ${dest}\n\n` +
      `⚡ سيصلك إشعار مباشر هنا فور قيام أي كابتن بنشر خط يمر بمسارك!`;

    const buttons = [
      { type: "postback", title: "البحث عن وجهة أخرى 🚌", payload: "SEARCH_TRANSPORT" },
      { type: "web_url", title: "تصفح الخطوط بالموقع 🌐", url: "https://www.souqbaghdad.store/transport" },
      { type: "postback", title: "الرئيسية 🏠", payload: "MAIN_MENU" }
    ];

    await sendMetaButtonTemplate(senderId, confirmMsg, buttons, token);
    return true;
  }

  // 7. واجهة الكابتن / السائق (Driver Role)
  if (cleanPayload === 'ROLE_DRIVER' || cleanText === 'كابتن' || cleanText === 'سائق') {
    const driverMsg = 
      `🚗 واجهة الكابتن / السائق ⚡\n\n` +
      `انشر خطوطك الجامعية واستقبل طلبات الحجز المباشرة من الطلاب:`;

    const buttons = [
      { type: "web_url", title: "نشر خط نقل جديد 🚌", url: "https://www.souqbaghdad.store/post?category=transport" },
      { type: "postback", title: "طلبات الطلاب الباحثين 👥", payload: "VIEW_STUDENT_REQUESTS" },
      { type: "postback", title: "الرئيسية 🏠", payload: "MAIN_MENU" }
    ];

    await sendMetaButtonTemplate(senderId, driverMsg, buttons, token);
    return true;
  }

  // 8. استعراض طلبات الطلاب الباحثين عن خطوط (View Student Requests)
  if (cleanPayload === 'VIEW_STUDENT_REQUESTS' || cleanText === 'طلبات الطلاب') {
    const { data: requests } = await supabase
      .from('transport_requests')
      .select('id, origin, destination, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (requests && requests.length > 0) {
      let listText = `👥 أحدث طلبات الطلاب الباحثين عن خطوط نقل:\n\n`;
      requests.forEach((r: any, idx: number) => {
        listText += `${idx + 1}. 📍 من [${r.origin || 'غير محدد'}] إلى [${r.destination || 'الجامعة'}]\n`;
      });
      listText += `\n💡 يمكنك نشر خط يمر بهذه المناطق لتصل إشعارات فورية لهؤلاء الطلاب!`;

      const buttons = [
        { type: "web_url", title: "نشر خط لهذه المناطق ➕", url: "https://www.souqbaghdad.store/post?category=transport" },
        { type: "postback", title: "الرئيسية 🏠", payload: "MAIN_MENU" }
      ];

      await sendMetaButtonTemplate(senderId, listText, buttons, token);
      return true;
    } else {
      const emptyMsg = `لا توجد طلبات معلقة حالياً، يمكنك نشر خطك الآن وسيظهر للطلاب مباشرة فور بحثهم.`;
      const buttons = [
        { type: "web_url", title: "نشر خط نقل 🚌", url: "https://www.souqbaghdad.store/post?category=transport" },
        { type: "postback", title: "الرئيسية 🏠", payload: "MAIN_MENU" }
      ];
      await sendMetaButtonTemplate(senderId, emptyMsg, buttons, token);
      return true;
    }
  }

  // 9. واجهة الشركاء (Partner Role)
  if (cleanPayload === 'ROLE_PARTNER' || cleanText === 'شريك') {
    const partnerMsg = 
      `👑 واجهة الشركاء المعتمدين 💼\n\n` +
      `اربط قناتك أو صفحتك مع سوق بغداد واكسب عمولات وأرباح مستمرة:\n` +
      `• نشر الخطوط تلقائياً في قناتك مع رابط تسويقي خاص بك\n` +
      `• شحن رصيد وإعلانات لعملائك مباشرة برقم هاتفهم أو يوزرهم`;

    const buttons = [
      { type: "web_url", title: "لوحة الشركاء بالموقع 🌐", url: "https://www.souqbaghdad.store/partners" },
      { type: "postback", title: "الرئيسية 🏠", payload: "MAIN_MENU" }
    ];

    await sendMetaButtonTemplate(senderId, partnerMsg, buttons, token);
    return true;
  }

  return false;
};

// ─────────────────────────────────────────────────────────────────────────────
// 🌐 MAIN HTTP SERVER
// ─────────────────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
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

          // ── أ. معالجة الرسائل الخاصة والضغط على الأزرار (Messaging & Postbacks) ──
          if (entry.messaging && Array.isArray(entry.messaging)) {
            for (const messagingEvent of entry.messaging) {
              // تجاهل رسائل البوت المرتدة (Echo Guard)
              if (messagingEvent.message?.is_echo) {
                console.log(`[Echo Guard] Skipped echo message from bot to: ${messagingEvent.recipient?.id}`);
                continue;
              }
              // تجاهل إيصالات القراءة والتسليم
              if (messagingEvent.read || messagingEvent.delivery) {
                continue;
              }

              const senderId = messagingEvent.sender?.id;
              const recipientId = messagingEvent.recipient?.id;

              // تجاهل الرسائل الصادرة من حساباتنا الرسمية لمنع الحلقات
              const OWN_IDS = new Set([
                META_PAGE_ID, META_IG_ACCOUNT_ID, entryId,
                ALRAFDAIN_FB_PAGE_ID, ALRAFDAIN_IG_ID
              ].filter(Boolean));

              if (!senderId || OWN_IDS.has(senderId)) {
                console.log(`[Loop Guard] Ignored message from own account: ${senderId}`);
                continue;
              }

              const platform = isInstagram ? "instagram" : isThreads ? "threads" : "facebook";

              // استخراج الـ Postback Payload أو الـ Quick Reply Payload إن وجد
              const postbackPayload = messagingEvent.postback?.payload || messagingEvent.message?.quick_reply?.payload || null;
              const rawUserText = (messagingEvent.message?.text || messagingEvent.postback?.title || "").trim();

              // ── ⚡ توجيه الحدث إلى المحرك التفاعلي (Messenger Interactive Engine) ──
              const handledByInteractive = await handleMessengerInteractive(
                senderId,
                postbackPayload,
                rawUserText,
                currentToken,
                platform
              );

              if (handledByInteractive) {
                console.log(`[Interactive Engine] Handled event for ${senderId} successfully.`);
                continue;
              }

              // إذا كانت رسالة عادية ولم يعالجها المحرك التفاعلي
              if (messagingEvent.message) {
                const msgId = messagingEvent.message.mid || messagingEvent.message.message_id;
                const userText = rawUserText;

                // حارس مضاعف: منع الحلقات بين صفحتين
                if (recipientId && OWN_IDS.has(recipientId) && OWN_IDS.has(senderId || '')) {
                  console.log(`[Inter-Page Loop Guard] Both sender and recipient are own accounts. Skipping.`);
                  continue;
                }

                // Dedup Guard لمنع تكرار معالجة نفس الرسالة
                if (msgId) {
                  const dedupKey = `meta_msg_${msgId}`;
                  const { data: existing } = await supabase
                    .from('telegram_users')
                    .select('telegram_chat_id')
                    .eq('telegram_chat_id', dedupKey)
                    .maybeSingle();
                  if (existing) {
                    console.log(`[Dedup Guard] Already processed message: ${msgId}`);
                    continue;
                  }
                  supabase.from('telegram_users').upsert({
                    telegram_chat_id: dedupKey,
                    username: 'meta_dedup',
                    created_at: new Date().toISOString()
                  }, { onConflict: 'telegram_chat_id' }).then(() => {});
                }

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

                // معالجة الردود على الستوري
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
                    .maybeSingle();
                  
                  if (adRecord) {
                    const itemUrl = `https://www.souqbaghdad.store/product/${adRecord.short_id || adRecord.id}`;
                    let details = adRecord.title;
                    if (adRecord.category === 'transport') {
                      details = `خط نقل: ${adRecord.university || ''} - ${adRecord.destination || ''}`;
                    }
                    const replyText = `أهلاً بك عيوني 🌹\nبخصوص الإعلان اللي استفسرت عنه بالستوري (${details})${adRecord.price ? ` بالسعر: ${adRecord.price}` : ''}:\n🔗 تفضل الرابط المباشر للتواصل مع المعلن ومعاينة الإعلان:\n${itemUrl}`;
                    
                    await sendMetaMessage(senderId, replyText, currentToken);
                    continue;
                  }
                }

                // استدعاء الذكاء الاصطناعي (AI Engine)
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

              const isCommentField = field === "feed" || field === "comments" || field === "live_comments" || field === "mention" || field === "threads" || field === "media";
              
              if (isCommentField) {
                const commentId = val.comment_id || val.id;
                const postId = val.post_id || val.media?.id || val.parent_id || val.post?.id;
                const commentText = (val.message || val.text || "").trim();
                const fromId = val.from?.id || val.user?.id;

                if (!commentText || !commentId) continue;

                if (fromId === META_PAGE_ID || fromId === META_IG_ACCOUNT_ID || fromId === entryId || fromId === ALRAFDAIN_FB_PAGE_ID || fromId === ALRAFDAIN_IG_ID) {
                  continue;
                }

                if (val.verb && (val.verb === "delete" || val.verb === "remove" || val.verb === "hide")) continue;
                if (val.item && val.item !== "comment" && val.item !== "post" && val.item !== "media") continue;

                const platformName = isInstagram ? "Instagram" : isThreads ? "Threads" : "Facebook";
                console.log(`[${platformName} Comment Event] ID: ${commentId}, Post: ${postId}, Text: "${commentText}"`);

                const aiData = await getAIReply("process_comment", platformName.toLowerCase(), commentText, fromId);
                const replyText = aiData?.reply || "أهلاً بك عيوني 🌹 راسلنا على ماسنجر أو بوت تيليجرام للرد الفوري وتصفح الخطوط: https://www.souqbaghdad.store";

                if (isInstagram) {
                  await replyToInstagramComment(commentId, replyText, currentToken);
                } else {
                  await replyToFacebookComment(commentId, replyText, currentToken);
                }

                const cleanComment = commentText.toLowerCase();
                const isGeneralPraise = ["ما شاء الله", "حلو", "بالتوفيق", "منورين", "تبارك"].some(k => cleanComment.includes(k)) && cleanComment.length < 20;
                
                if (!isGeneralPraise) {
                  let pmText = "يا هلا بيك عيوني 👋 للسرعة والرد الفوري، ولنشر خطوطك وتصفحها مجاناً، تفضل بزيارة موقعنا أو محادثتنا هنا مباشرة:\nhttps://www.souqbaghdad.store/transport";
                  
                  if (postId) {
                    const { data: matchedAd } = await supabase
                      .from('ads')
                      .select('id, short_id, title, price, year, location, phone, category, university, destination')
                      .or(`facebook_post_id.eq.${postId},instagram_post_id.eq.${postId},meta_post_id.eq.${postId}`)
                      .maybeSingle();

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
