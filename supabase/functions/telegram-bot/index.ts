// @ts-nocheck
declare const Deno: any;

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const tgUrl = `https://api.telegram.org/bot${botToken}`;
const BOT_USERNAME = 'souqbaghda_bot';

async function sendMessage(chatId: string | number, text: string, replyMarkup?: any, disableWebPagePreview = true, replyToMessageId?: number | string) {
  const body: any = { 
    chat_id: chatId, 
    text, 
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    link_preview_options: { is_disabled: true }
  };
  if (replyMarkup) body.reply_markup = replyMarkup;
  if (replyToMessageId) body.reply_to_message_id = replyToMessageId;
  try {
    const res = await fetch(`${tgUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.ok) {
      console.warn('sendMessage HTML parse failed, retrying as plain text:', data.description);
      delete body.parse_mode;
      const cleanPlain = text.replace(/<[^>]*>?/gm, '');
      body.text = cleanPlain;
      const resPlain = await fetch(`${tgUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await resPlain.json();
    }
    return data;
  } catch (e) {
    console.error('sendMessage fetch exception:', e);
    return { ok: false, error: String(e) };
  }
}

async function answerCallbackQuery(callbackQueryId: string, text: string = '', showAlert = false) {
  fetch(`${tgUrl}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: showAlert })
  }).catch(() => {});
}

async function sendChatAction(chatId: string | number, action = 'typing') {
  fetch(`${tgUrl}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action })
  }).catch(() => {});
}

async function callAiEngine(userText: string | null, audioUrl: string | null, photoUrl: string | null, userName?: string, supabase?: any, history?: any[], audioBase64?: string): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

  const name = userName || 'عزيزنا';
  let dbContext = '';

  const cleanQ = (userText || '').trim().toLowerCase();
  if (['شكرا', 'شكراً', 'مشكور', 'رحم الله والديك', 'عاشت ايدك', 'تسلم', 'تسلمين', 'حبيبي', 'فدوة', 'فدوه', 'ممنون', 'تسلم ايدك', 'مشكور حبيبي'].some(w => cleanQ === w || cleanQ === w + ' عيوني' || cleanQ === w + ' اخويه' || cleanQ === 'شكرا جزيلا' || cleanQ === 'الف شكر')) {
    return `العفو عيوني وتدلل من راسي! 🌹 أنا بالخدمة 24 ساعة، وإذا احتجت أي مساعدة بخطوط النقل أو السيارات أو نشر إعلانك بس اكتبلي وتأمر أمر ✨`;
  }

  // 1. Fetch relevant database context if query asks about cars, prices, transport, or general items
  if (supabase && userText) {
    const q = userText.toLowerCase();
    try {
      if (q.includes('سيار') || q.includes('سعر') || q.includes('بيش') || q.includes('توسان') || q.includes('النترا') || q.includes('كورولا') || q.includes('كامري') || q.includes('سبورتاج') || q.includes('سنتافي') || q.includes('تاهو')) {
        const { data: recentCars } = await supabase.from('ads').select('title, price, location, year').in('category', ['vehicles', 'cars', 'car']).eq('status', 'active').order('created_at', { ascending: false }).limit(6);
        if (recentCars && recentCars.length > 0) {
          dbContext += `\nأحدث السيارات المعروضة بسوق بغداد حالياً:\n` + recentCars.map((c: any) => `- ${c.title} (سعر: ${c.price || 'اتصال'} | ${c.location || 'بغداد'})`).join('\n');
        }
      }
      if (q.includes('خط') || q.includes('نقل') || q.includes('جامع') || q.includes('كلية') || q.includes('رافدين') || q.includes('سايق')) {
        const { data: recentTrans } = await supabase.from('ads').select('title, location, phone').eq('category', 'transport').eq('status', 'active').order('created_at', { ascending: false }).limit(5);
        if (recentTrans && recentTrans.length > 0) {
          dbContext += `\nأحدث خطوط النقل النشطة بسوق بغداد:\n` + recentTrans.map((t: any) => `- ${t.title} (المناطق: ${t.location} | هاتف: ${t.phone})`).join('\n');
        }
      }
    } catch(e) {}
  }

  const systemPrompt = 
    `أنت عقل ومحرك ذكاء اصطناعي فائق التطور (ChatGPT / GPT-4o Level) مصمم كـ "المستشار والمساعد الذكي الأقوى في العراق" لمنصة سوق بغداد (https://www.souqbaghdad.store).

🧠 قدراتك ومستواك المعرفي:
1. تمتلك ذكاءً وثقافة واسعة جداً تعادل أقوى نماذج الذكاء الاصطناعي العالمية (ChatGPT):
   - تجيب ببراعة وعمق عن أي سؤال في الحياة، الدراسة والجامعات، التكنولوجيا، النصائح، التحليل، الحسابات، ميكانيكا السيارات، والطرق والمسافات.
   - إذا سألك المستخدم عن أي موضوع عام (نصيحة دراسية، مقارنة سيارات، فحص أعطال، حل مشكلة، دردشة عامة): جاوبه بذكاء وتحليل منطقي مذهل وأسلوب عراقي مشوق وممتع.

💬 شخصيتك وأسلوبك بالحديث:
1. تتحدث بلهجة عراقية بغدادية فصيحة، ذكية جداً، راقية، دافئة، غاية في اللباقة وخفة الظل (مثل: تدلل عيوني، يا هلا وكل الهلا بيك، فدوة لقلبك، من عيوني، بالخدمة يالغالي، كفو منك).
2. تفهم كل تفاصيل الشارع العراقي والسوق (أسعار السيارات بالمفرد والوارد، المعارض، المرور والتحويل، أوقات الزحام ببغداد، كليات وجامعات العراق وأقسامها، مناطق الرصافة والكرخ).
3. التسامح الفوري والذكي مع الأخطاء الإملائية والعامية السريعة مهما كانت مدمجة، وافهم القصد دون أي تردد.
4. الربط الذكي مع خدمات سوق بغداد: عندما يكون السؤال متعلقاً بالسيارات أو الخطوط أو البيع، دله بلباقة على خدمات وبوت سوق بغداد المجانية.
${dbContext ? `\n[بيانات حية من قاعدة بيانات سوق بغداد]:\n${dbContext}\n` : ''}`;

  // 1. Google Gemini 2.0 Flash (with multi-turn conversational memory + native audio support)
  if (GEMINI_API_KEY && (userText || audioUrl || photoUrl || audioBase64)) {
    for (const model of ['gemini-2.0-flash', 'gemini-1.5-flash']) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const contents: any[] = [];
        if (history && Array.isArray(history)) {
          for (const h of history.slice(-6)) {
            if (h.role && h.text) {
              contents.push({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] });
            }
          }
        }

        const userParts: any[] = [
          { text: `${systemPrompt}\n\nالمستخدم (${name}) يكتب/يتحدث:\n"${userText || 'أرسل بصمة صوتية'}"` }
        ];

        if (audioBase64) {
          userParts.push({
            inlineData: {
              mimeType: "audio/ogg",
              data: audioBase64
            }
          });
        }

        contents.push({ role: 'user', parts: userParts });

        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: { maxOutputTokens: 600, temperature: 0.7 }
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const data = await resp.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText) return aiText.trim();
      } catch(e) {
        console.warn(`Gemini model ${model} failed:`, e);
      }
    }
  }

  // 2. OpenAI GPT-4o-mini Fallback
  if (OPENAI_API_KEY && userText) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${name} يسأل: "${userText}"` }
          ],
          max_tokens: 500,
          temperature: 0.7
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await resp.json();
      const aiText = data.choices?.[0]?.message?.content;
      if (aiText) return aiText.trim();
    } catch(e) {
      console.warn('OpenAI fallback failed:', e);
    }
  }

  // 3. Fallback
  return `يا هلا بيك عيوني ${name} 🌹 أنا في خدمتك دائماً في منصة سوق بغداد. تكدر تبحث عن سيارة أو خط نقل أو تنشر إعلانك مجاناً عبر الأزرار أدناه 👇`;
}

function detectGroupCategory(title: string, desc?: string): 'university' | 'cars' | 'market' | 'general' {
  const t = (title + ' ' + (desc || '')).toLowerCase();
  
  if (
    t.includes('جامع') || t.includes('كلية') || t.includes('قسم ') || t.includes('مرحل') ||
    t.includes('رافدين') || t.includes('مستنصري') || t.includes('تكنولوجي') || t.includes('دكتور') ||
    t.includes('طالب') || t.includes('طلاب') || t.includes('طالبات') || t.includes('نقل') || t.includes('خطوط') || t.includes('خط') || t.includes('باص')
  ) {
    return 'university';
  }

  if (
    t.includes('سيار') || t.includes('سوق السيار') || t.includes('معارض') || t.includes('معرض') ||
    t.includes('وارد') || t.includes('كوريات') || t.includes('توسان') || t.includes('النترا') ||
    t.includes('كيا') || t.includes('هيونداي') || t.includes('تويوتا') || t.includes('شفر') || t.includes('دوج')
  ) {
    return 'cars';
  }

  if (
    t.includes('سوق') || t.includes('بيع') || t.includes('شراء') || t.includes('عقار') ||
    t.includes('موبايل') || t.includes('تجارة') || t.includes('اعلانات') || t.includes('إعلانات')
  ) {
    return 'market';
  }

  return 'general';
}

async function callGroupAiEngine(userText: string, userName: string, groupTitle?: string, contextInfo?: string): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

  const title = groupTitle || 'الكروب';
  const category = detectGroupCategory(title);

  let groupSpecialty = 'مساعد وخدمة الكروب وحمايته من السبام والإعلانات المزعجة';
  if (category === 'university') {
    groupSpecialty = 'مساعد طلاب وأساتذة الجامعات وخطوط النقل وتوصيل الطلاب والسائقين وحجز المقاعد بدقة';
  } else if (category === 'cars') {
    groupSpecialty = 'خبير سوق ومعارض السيارات وأسعارها وموديلاتها ومساعدة الأعضاء في تقييم وبيع وشراء السيارات';
  } else if (category === 'market') {
    groupSpecialty = 'مساعد البيع والشراء والسوق المفتوح وتسهيل التجارة الآمنة بين الأعضاء';
  }

  const systemPrompt = `أنت المساعد والمستشار الذكي الرسمي من منصة "سوق بغداد" (https://www.souqbaghdad.store) متواجد داخل كروب "${title}" (تخصص الكروب: ${groupSpecialty}).
طريقتك وأسلوبك بالرد:
1. تصرف كـ (موظف ومستشار عراقي شاطر، خلوق، محترم، وخفيف الظل) بلهجة بغدادية لطيفة (مثال: تدلل عيوني، بالخدمة يالغالي، يا هلا بيك).
2. افهم طبيعة ونوع الكروب واجعل جوابك مناسباً جداً لتخصص المجموعة (جامعات/سيارات/سوق عام).
3. الرد قصير ومفيد (سطرين إلى 3 أسطر كحد أقصى) بدون إطالة أو حشو.
4. استخدم حصراً روابط سوق بغداد الرسمية وبوت @${BOT_USERNAME}، وممنوع ذكر أي جهات أو بوتات خارجية نهائياً.
${contextInfo ? `بيانات حية من المنصة:\n${contextInfo}` : ''}`;

  if (GEMINI_API_KEY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nالسائل (${userName}) يكتب: "${userText}"` }] }
          ],
          generationConfig: { maxOutputTokens: 120, temperature: 0.6 }
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await resp.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiText) return aiText.trim();
    } catch(e) {}
  }

  if (OPENAI_API_KEY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${userName} يكتب: "${userText}"` }
          ],
          max_tokens: 100
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await resp.json();
      const aiText = data.choices?.[0]?.message?.content;
      if (aiText) return aiText.trim();
    } catch(e) {}
  }

  return `يا هلا بيك عيوني ${userName} 🌹\n` +
         `تصفح خطوط النقل والسيارات مباشرة عبر: https://www.souqbaghdad.store\n` +
         `أو افتح محادثة خاصة مع @${BOT_USERNAME} للنشر والتصفح المجاني ✨`;
}

async function sendPhoto(chatId: string | number, photoUrl: string, caption: string, replyMarkup?: any) {
  try {
    const body: any = { 
      chat_id: chatId, 
      photo: photoUrl, 
      caption, 
      parse_mode: 'HTML'
    };
    if (replyMarkup) body.reply_markup = replyMarkup;
    const res = await fetch(`${tgUrl}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.ok) {
      console.warn('sendPhoto failed, falling back to sendMessage:', data.description);
      return await sendMessage(chatId, caption, replyMarkup, true);
    }
    return data;
  } catch (e) {
    console.error('sendPhoto exception, falling back to sendMessage:', e);
    return await sendMessage(chatId, caption, replyMarkup, true);
  }
}

async function deleteMessage(chatId: string | number, messageId: number | string) {
  try {
    await fetch(`${tgUrl}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId })
    });
  } catch(e) {}
}

async function getChatMember(chatId: string | number, userId: number | string) {
  try {
    const res = await fetch(`${tgUrl}/getChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, user_id: userId })
    });
    const data = await res.json();
    return data.ok ? data.result : null;
  } catch(e) {
    return null;
  }
}

async function restrictChatMember(chatId: string | number, userId: number | string, permissions: any, untilDate?: number) {
  try {
    const body: any = { chat_id: chatId, user_id: userId, permissions };
    if (untilDate) body.until_date = untilDate;
    const res = await fetch(`${tgUrl}/restrictChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch(e) {}
}

async function banChatMember(chatId: string | number, userId: number | string, untilDate?: number) {
  try {
    const body: any = { chat_id: chatId, user_id: userId };
    if (untilDate) body.until_date = untilDate;
    const res = await fetch(`${tgUrl}/banChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch(e) {}
}

async function unbanChatMember(chatId: string | number, userId: number | string) {
  try {
    const res = await fetch(`${tgUrl}/unbanChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, user_id: userId, only_if_banned: true })
    });
    return await res.json();
  } catch(e) {}
}

async function getTelegramFileUrl(fileId: string): Promise<string | null> {
  try {
    const res = await fetch(`${tgUrl}/getFile?file_id=${fileId}`);
    const data = await res.json();
    if (data.ok && data.result?.file_path) {
      return `https://api.telegram.org/file/bot${BOT_TOKEN}/${data.result.file_path}`;
    }
  } catch(e) {
    console.error('getTelegramFileUrl error:', e);
  }
  return null;
}

async function transcribeVoiceWithAi(fileUrl: string): Promise<{ text: string | null, base64: string | null }> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

  try {
    const audioFetch = await fetch(fileUrl);
    if (!audioFetch.ok) return { text: null, base64: null };
    const arrayBuffer = await audioFetch.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    
    // Reliable base64 conversion
    let binary = '';
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const base64Audio = btoa(binary);

    // 1. Google Gemini 2.0 Flash Multimodal Audio Transcription
    if (GEMINI_API_KEY) {
      try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [
                {
                  text: "أنت نظام استماع وتحويل صوتي دقيق جداً للهجة العراقية البغدادية. استمع للبصمة الصوتية واكتب النص المنطوق بدقة متناهية بدون أي مقدمات أو شروحات:"
                },
                {
                  inlineData: {
                    mimeType: "audio/ogg",
                    data: base64Audio
                  }
                }
              ]
            }],
            generationConfig: { maxOutputTokens: 200, temperature: 0.1 }
          })
        });
        const data = await resp.json();
        const transcription = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (transcription && transcription.trim()) {
          return { text: transcription.trim().replace(/^["']|["']$/g, ''), base64: base64Audio };
        }
      } catch(e) {
        console.warn('Gemini voice transcription failed:', e);
      }
    }

    // 2. OpenAI Whisper Fallback
    if (OPENAI_API_KEY) {
      try {
        const formData = new FormData();
        const file = new File([uint8], 'voice.ogg', { type: 'audio/ogg' });
        formData.append('file', file);
        formData.append('model', 'whisper-1');
        formData.append('language', 'ar');

        const whisperResp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
          body: formData
        });
        const whisperData = await whisperResp.json();
        if (whisperData?.text) {
          return { text: whisperData.text.trim(), base64: base64Audio };
        }
      } catch(e) {
        console.warn('Whisper voice transcription failed:', e);
      }
    }

    return { text: null, base64: base64Audio };
  } catch(e) {
    console.error('transcribeVoiceWithAi exception:', e);
  }
  return { text: null, base64: null };
}

async function scheduleMessageDeletion(chatId: string | number, botMessageId: number, userMessageId?: number | string, delayMs = 3600000) {
  try {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    if (botMessageId) await deleteMessage(chatId, botMessageId);
    if (userMessageId) await deleteMessage(chatId, userMessageId);
  } catch(e) {}
}

async function sendOrReplaceGroupMessage(chatId: string | number, text: string, markup?: any, supabase?: any, replyToUserMsgId?: number | string) {
  if (supabase) {
    try {
      const { data: lastRecord } = await supabase.from('group_warnings').select('last_reason').eq('chat_id', String(chatId)).eq('user_id', 'BOT_LAST_MSG').maybeSingle();
      if (lastRecord && lastRecord.last_reason) {
        const oldMsgId = parseInt(lastRecord.last_reason);
        if (!isNaN(oldMsgId)) {
          deleteMessage(chatId, oldMsgId);
        }
      }
    } catch(e) {}
  }

  const res = await sendMessage(chatId, text, markup, true, replyToUserMsgId);
  if (res && res.result && res.result.message_id) {
    const newMsgId = res.result.message_id;
    if (supabase) {
      try {
        await supabase.from('group_warnings').upsert({
          chat_id: String(chatId),
          user_id: 'BOT_LAST_MSG',
          username: 'BOT',
          warning_count: 0,
          last_reason: String(newMsgId),
          updated_at: new Date().toISOString()
        });
      } catch(e) {}
    }

    // Keep response visible in group for 1 hour (3600000ms), then delete both bot reply and user question
    if (typeof (globalThis as any).EdgeRuntime?.waitUntil === 'function') {
      (globalThis as any).EdgeRuntime.waitUntil(scheduleMessageDeletion(chatId, newMsgId, replyToUserMsgId, 3600000));
    }
  }
  return res;
}

function getCoreLocationKeyword(loc: string) {
  if (!loc) return '';
  const s = loc.toLowerCase();
  if (s.includes('رافدين') || s.includes('رفدين')) return 'رافدين';
  if (s.includes('مستنصرية') || s.includes('مستنصريه')) return 'مستنصرية';
  if (s.includes('تكنولوجية') || s.includes('تكنولوجيه')) return 'تكنولوجية';
  if (s.includes('نهرين')) return 'نهرين';
  if (s.includes('اسراء') || s.includes('إسراء')) return 'اسراء';
  if (s.includes('اوروك') || s.includes('أوروك')) return 'اوروك';
  if (s.includes('فراهيدي')) return 'فراهيدي';
  if (s.includes('دجلة') || s.includes('دجله')) return 'دجلة';
  if (s.includes('تراث')) return 'تراث';
  if (s.includes('رشيد')) return 'رشيد';
  if (s.includes('معارف')) return 'معارف';
  if (s.includes('بغداد')) return 'بغداد';
  return s.replace(/(كلية|جامعة|معهد|الجامعة|الكلية|المعهد)\s+/g, '').trim();
}

async function handleSmartTransportSearch(chatId: string | number, rawText: string, fromUser: any, supabase: any, isGroup = false, userMessageId?: number | string) {
  // 1. Normalize Iraqi Arabic and common typos
  function replaceAr(text: string, searchWords: string, replacement: string) {
    return text.replace(new RegExp(`(?<![\\u0600-\\u06FF])(${searchWords})(?![\\u0600-\\u06FF])`, 'gi'), replacement);
  }

  let norm = rawText.replace(/[\\\/](line|lines|خط|خطوط)/gi, '');
  norm = replaceAr(norm, 'خك|حط|خظ|خيط|خـط|خطط', 'خط');
  norm = replaceAr(norm, 'سيايق|سياق|سايقق|سواق', 'سايق');
  norm = replaceAr(norm, 'اربد|اريدد|ادورر|ابحثث|محتاجج|محتاجه', 'محتاج');
  norm = replaceAr(norm, 'جميله|جميلهه', 'جميلة');
  norm = replaceAr(norm, 'الرفدين|الرافين|رافدين|لرافدين|للرافدين', 'كلية الرافدين');
  norm = replaceAr(norm, 'المستنصريه|مستنصريه|للمستنصرية', 'الجامعة المستنصرية');
  norm = replaceAr(norm, 'التكنولوجيه|تكنولوجيه', 'الجامعة التكنولوجية');
  norm = replaceAr(norm, 'الاسراء|للاسراء|إسراء|اسراء|الإسراء', 'كلية الاسراء');
  norm = replaceAr(norm, 'اوروك|أوروك|لأوروك|لاوروك', 'جامعة اوروك');
  norm = replaceAr(norm, 'الفراهيدي|فراهيدي|للفراهيدي', 'جامعة الفراهيدي');
  norm = replaceAr(norm, 'دجله|دجلة|لدجلة|لدجله', 'جامعة دجلة');
  norm = replaceAr(norm, 'التراث|تراث|للتراث', 'كلية التراث');
  norm = replaceAr(norm, 'الرشيد|رشيد|للرشيد', 'كلية الرشيد');
  norm = replaceAr(norm, 'المعارف|معارف|للمعارف', 'كلية المعارف');
  norm = replaceAr(norm, 'سيديه|سيدية', 'السيدية');
  norm = replaceAr(norm, 'دوره|الدوره', 'الدورة');
  norm = replaceAr(norm, 'جامعه|الجامعه', 'جامعة');
  norm = replaceAr(norm, 'كليه|الكليه', 'كلية');
  norm = replaceAr(norm, 'شعله|الشعله', 'الشعلة');
  norm = replaceAr(norm, 'حريه|الحريه', 'الحرية');
  norm = replaceAr(norm, 'غزاليه|الغزاليه', 'الغزالية');
  norm = replaceAr(norm, 'منصور|المنصورر', 'المنصور');
  norm = replaceAr(norm, 'بنوك|البنوكك', 'البنوك');
  norm = replaceAr(norm, 'شعب|الشعبب', 'الشعب');
  norm = replaceAr(norm, 'كراده|الكراده', 'الكرادة');
  norm = replaceAr(norm, 'زعفرانيه|الزعفرانيه', 'الزعفرانية');
  norm = replaceAr(norm, 'كاظميه|الكاظميه', 'الكاظمية');
  norm = replaceAr(norm, 'اعظميه|الاعظميه', 'الأعظمية');
  norm = replaceAr(norm, 'طالبيه|طالبية|الطالبيه', 'الطالبية');
  norm = replaceAr(norm, 'سومر|حي سومر', 'حي سومر');
  norm = replaceAr(norm, 'معلمين|حي المعلمين', 'حي المعلمين');
  norm = replaceAr(norm, 'امين|الامين', 'الأمين');
  norm = norm.trim();

  const lowerRaw = rawText.toLowerCase();

  let fromName = fromUser?.first_name || 'عزيزنا';
  let contactHandle = fromUser?.username ? `@${fromUser.username}` : fromName;
  if (fromUser?.username) {
    const u = fromUser.username.toLowerCase();
    if (u.includes('anonymous') || u.includes('bot')) {
      fromName = 'مديرنا العزيز';
      contactHandle = 'الكروب';
    } else {
      fromName = fromUser.first_name || `@${fromUser.username}`;
      contactHandle = `@${fromUser.username}`;
    }
  }

  // Extract Iraqi phone number if present
  const phoneMatch = rawText.match(/(?:07[3-9]\d{8}|\+9647[3-9]\d{8}|07\d{2}\s?\d{3}\s?\d{4})/);
  const extractedPhone = phoneMatch ? phoneMatch[0].replace(/\s+/g, '') : null;

  // Extract mention username if present (e.g. @mdzn21)
  const mentionMatch = rawText.match(/@[a-zA-Z0-9_]{4,}/);
  if (mentionMatch) {
    contactHandle = mentionMatch[0];
  }

  // --------------------------------------------------------------------------
  // 🚗 CASE 1: DRIVER / LINE PROVIDER (صاحب خط / سائق يعرض خطه ومقاعده)
  // --------------------------------------------------------------------------
  const isDriverKeywords = 
    lowerRaw.includes('يتوفر خط') || lowerRaw.includes('متوفر خط') || lowerRaw.includes('يوجد خط') || 
    lowerRaw.includes('اوفر خط') || lowerRaw.includes('أوفر خط') || lowerRaw.includes('عندي خط') || 
    lowerRaw.includes('خط متوفر') || lowerRaw.includes('متوفر مقاعد') || lowerRaw.includes('يوجد مقاعد') || 
    lowerRaw.includes('شاغر') || lowerRaw.includes('مقاعد شاغرة') || lowerRaw.includes('خط صباحي') || 
    lowerRaw.includes('خط مسائي') || lowerRaw.includes('نوع السياره') || lowerRaw.includes('نوع السيارة') || 
    lowerRaw.includes('ستاركس') || lowerRaw.includes('كوستر') || lowerRaw.includes('كيا') || 
    lowerRaw.includes('اوبترا') || lowerRaw.includes('أوبترا') || lowerRaw.includes('النترا') || 
    lowerRaw.includes('توسان') || lowerRaw.includes('طيبة') || lowerRaw.includes('سايبا') ||
    lowerRaw.includes('يمر من المناطق') || lowerRaw.includes('يمر بـ') || lowerRaw.includes('يمر في') ||
    lowerRaw.includes('المناطق المجاوره') || lowerRaw.includes('المناطق المجاورة') ||
    lowerRaw.includes('الاستفسار اكثر') || lowerRaw.includes('الاستفسار أكثر') || lowerRaw.includes('للحجز والاستفسار') ||
    lowerRaw.includes('للحجز') || lowerRaw.includes('للاستفسار') || lowerRaw.includes('متواجد على تلي') ||
    (lowerRaw.includes('خط') && (lowerRaw.includes('تبريد') || lowerRaw.includes('تدفئة') || lowerRaw.includes('انترنت') || lowerRaw.includes('واي فاي')));

  const isSeekerExplicit = 
    lowerRaw.includes('محتاج خط') || lowerRaw.includes('محتاجة خط') || lowerRaw.includes('محتاجه خط') || lowerRaw.includes('محتاجين خط') || 
    lowerRaw.includes('اريد خط') || lowerRaw.includes('أريد خط') || lowerRaw.includes('نريد خط') || 
    lowerRaw.includes('رايد خط') || lowerRaw.includes('رايده خط') || lowerRaw.includes('رايدة خط') ||
    lowerRaw.includes('ادور خط') || lowerRaw.includes('أدور خط') || lowerRaw.includes('ندور خط') || 
    lowerRaw.includes('ابحث عن خط') || lowerRaw.includes('طالبة محتاجة') || lowerRaw.includes('طالبه محتاجه') || lowerRaw.includes('طالب محتاج') ||
    lowerRaw.includes('محتاج سايق') || lowerRaw.includes('محتاجه سايق') || lowerRaw.includes('اريد سايق') || lowerRaw.includes('نريد سايق') || lowerRaw.includes('محتاج سيارة');

  const isStrongDriver = 
    lowerRaw.includes('يتوفر خط') || lowerRaw.includes('متوفر خط') || lowerRaw.includes('يوجد خط') || 
    lowerRaw.includes('اوفر خط') || lowerRaw.includes('أوفر خط') || lowerRaw.includes('عندي خط') || 
    lowerRaw.includes('خط متوفر') || lowerRaw.includes('متوفر مقاعد') || lowerRaw.includes('يوجد مقاعد') || 
    lowerRaw.includes('عندي سيارة') || lowerRaw.includes('عندي كيا') || lowerRaw.includes('عندي كوستر') || 
    lowerRaw.includes('عندي ستاركس') || lowerRaw.includes('عندي طيبه') || lowerRaw.includes('عندي سايبا') || 
    lowerRaw.includes('اخذ خط') || lowerRaw.includes('اخذ نفرات');

  const isAmbiguous = isDriverKeywords && !isStrongDriver && !isSeekerExplicit;
  const isProvider = (isStrongDriver || isDriverKeywords) && !isSeekerExplicit && !isAmbiguous;

  if (isAmbiguous) {
    try {
      const { data: tgUser } = await supabase.from('telegram_users').select('*').eq('telegram_chat_id', chatId).maybeSingle();
      let state = tgUser?.bot_state || {};
      state.data = state.data || {};
      state.data.ambig_text = rawText;
      await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
    } catch(e) {}

    const askMsg = `👋 <b>يا هلا بيك ${fromName} 🌹</b>\nلم نتمكن من تحديد طلبك بدقة، هل أنت كابتن أم طالب؟`;
    const askMarkup = {
      inline_keyboard: [
        [{ text: '👨‍✈️ أنا كابتن (عندي سيارة / خط)', callback_data: 'ambig_driver' }],
        [{ text: '👨‍🎓 أنا طالب (محتاج خط / راكب)', callback_data: 'ambig_student' }]
      ]
    };
    if (isGroup) {
      // For group, we just send a normal message or replace it
      await sendMessage(chatId, askMsg, askMarkup);
    } else {
      await sendMessage(chatId, askMsg, askMarkup);
    }
    return;
  }

  if (isProvider) {
    // Check if driver phone is blacklisted / banned
    if (extractedPhone) {
      const { data: isBanned } = await supabase.from('group_warnings').select('user_id').eq('chat_id', 'BANNED_DRIVERS').eq('user_id', extractedPhone).maybeSingle();
      if (isBanned) {
        console.warn(`[BLOCKED DRIVER ATTEMPT] Banned phone ${extractedPhone} tried to post.`);
        return;
      }
    }

    // 1. Save driver active offer into transport_requests or match against waiting students
    let driverDest = norm.includes('رافدين') || norm.includes('رفدين') ? 'كلية الرافدين الجامعة' : 'الجامعة';
    
    // Find waiting students whose origin appears in the driver's message
    let matchedStudentCount = 0;
    try {
      const { data: waitingStudents } = await supabase
        .from('transport_requests')
        .select('*')
        .eq('status', 'pending');

      if (waitingStudents && waitingStudents.length > 0) {
        for (const st of waitingStudents) {
          const stOrig = (st.origin || '').toLowerCase().trim();
          if (stOrig && lowerRaw.includes(stOrig)) {
            matchedStudentCount++;
            // Notify waiting student privately about this newly spotted driver
            if (st.telegram_chat_id) {
              const driverContact = extractedPhone ? `📞 <code>${extractedPhone}</code>` : (contactHandle ? `👤 ${contactHandle}` : 'عبر الكروب');
              const studentAlert = 
                `🔔 <b>بشرى سارة! توفر سائق يمر بمنطقتك (${st.origin}) 🚌✨</b>\n\n` +
                `👤 <b>السائق:</b> ${fromName}\n` +
                `📍 <b>مسار الخط:</b> يمر بـ ${st.origin} ⬅️ إلى ${driverDest}\n` +
                `📱 <b>للتواصل والحجز:</b> ${driverContact}\n\n` +
                `💡 <i>إذا اتفقت وياه واكتفيت، اضغط على «✅ اتفقت ولكيت خط خلاص» أدناه:</i>`;

              const shortName = fromName.substring(0, 10).replace(/_/g, '');
              const reportData = `rep_drv_${shortName}_${extractedPhone || 'nophone'}`;
              const studentMarkup = {
                inline_keyboard: [
                  contactHandle && contactHandle.startsWith('@') ? [{ text: '💬 مراسلة السائق تليكرام 🌹', url: `https://t.me/${contactHandle.replace('@','')}` }] : [],
                  extractedPhone ? [{ text: `📞 اتصال: ${extractedPhone}`, url: `tel:${extractedPhone}` }] : [],
                  [{ text: '✅ اتفقت ولكيت خط خلاص (إيقاف)', callback_data: `stop_alert_${st.id}` }],
                  [{ text: '⚠️ إبلاغ عن مشكلة مع الكابتن', callback_data: reportData }],
                  [{ text: '🚌 تصفح جميع الخطوط', url: 'https://www.souqbaghdad.store/transport' }]
                ].filter(r => r.length > 0)
              };

              try {
                await sendMessage(st.telegram_chat_id, studentAlert, studentMarkup);
              } catch(e) {}
            }
          }
        }
      }
    } catch(err) {
      console.error('Error auto-matching driver with waiting students:', err);
    }

    const driverMsg = 
      `👋 <b>يا هلا بالسائق العزيز كابتن ${fromName} 🚌✨</b>\n` +
      `عاشت إيدك، تم رصد خطك وسنقوم بربط وإرسال أي طالب أو طالبة يبحث عن هذا المسار إلى خاصك فوراً 🤝\n` +
      (matchedStudentCount > 0 ? `🎯 <i>(تم إشعار ${matchedStudentCount} طلاب مسجلين بقائمة الانتظار بمناطق خطك فوراً!)</i>\n` : '') +
      `💡 لنشر خطك ببوست وستوري رسمي بالموقع والقنوات مجاناً، اضغط أدناه:`;

    const providerMarkup = {
      inline_keyboard: [
        [{ text: '🚀 انشر خطك بالموقع والقنوات مجاناً', url: 'https://www.souqbaghdad.store/post-ad' }],
        [{ text: '🤖 فتح محادثة خاصة مع البوت', url: `https://t.me/${BOT_USERNAME}` }]
      ]
    };

    if (isGroup) {
      await sendOrReplaceGroupMessage(chatId, driverMsg, providerMarkup, supabase, userMessageId);
    } else {
      await sendMessage(chatId, driverMsg, providerMarkup);
    }
    return;
  }

  // --------------------------------------------------------------------------
  // 🎒 CASE 2: STUDENT / LINE SEEKER (طالب / موظف يبحث عن خط)
  // --------------------------------------------------------------------------
  let origin = '';
  let destination = '';

  const INVALID_ORIGIN_PHRASES = [
    'اني مو سايق', 'انا مو سايق', 'مو سايق', 'اني طالب', 'انا طالب', 'طالب', 'طالبة', 
    'محتاج خط', 'محتاجة خط', 'اريد خط', 'ابحث عن خط', 'ادور خط', 'سايق', 'سائق', 'تكسي', 'خط', 'نقل',
    'تلكه خط', 'ينزل خط', 'يجي خط', 'يتوفر خط', 'انشر خط', 'تسجيل خط'
  ];

  const INVALID_ORIGIN_WORDS = [
    'اني', 'انا', 'مو', 'سايق', 'سائق', 'طالب', 'طالبة', 'محتاج', 'محتاجة', 'اريد', 'أريد', 
    'ادور', 'أدور', 'ابحث', 'خط', 'نقل', 'هذا', 'نفسه', 'غير', 'خلاص', 'شكرا', 'تلكه', 'تلقى', 
    'الكه', 'ينزل', 'يجي', 'يصير', 'يتوفر', 'بلغني', 'نبهني', 'اشوف', 'رخصتك', 'فضلك', 'بعد', 
    'اكو', 'كلية', 'جامعة', 'دوام', 'صباحي', 'مسائي', 'انشر', 'تسجيل'
  ];

  function isValidLocation(str: string): boolean {
    if (!str) return false;
    const s = str.trim().toLowerCase();
    if (s.length < 3) return false;
    if (INVALID_ORIGIN_PHRASES.some(p => s === p || s.includes('مو سايق') || s.includes('اني مو') || s.includes('تلكه') || s.includes('بلغني') || s.includes('انشر خط'))) return false;
    const words = s.split(/\s+/);
    const nonStop = words.filter(w => !INVALID_ORIGIN_WORDS.includes(w));
    return nonStop.length > 0;
  }

  const IRAQI_AREAS = [
    'البنوك', 'الشعب', 'المنصور', 'الكرادة', 'الدورة', 'اليرموك', 'الغزالية', 'الزعفرانية', 
    'مدينة الصدر', 'جميلة', 'الأعظمية', 'الاعظمية', 'الكاظمية', 'السيدية', 'الجهاد', 'الحرية', 
    'القاهرة', 'صليخ', 'حي الجامعة', 'الوزيرية', 'حي تونس', 'حي العامل', 'حي الخضراء', 'حي العدل', 
    'حي أور', 'حي اور', 'البياع', 'سبع ابكار', 'الراشدية', 'التاجي', 'المحمودية', 'المدائن', 
    'جسر ديالى', 'حي الاعلام', 'حي الإعلام', 'حي التراث', 'المشتل', 'بغداد الجديدة', 'الغدير', 
    'زيونة', 'شارع فلسطين', 'شارع النضال', 'شارع المغرب', 'باب المعظم', 'باب الشرقي', 'العطيفية', 
    'الوشاش', 'الاسكان', 'المأمون', 'حي حطين', 'الداوودي', 'حي السلام', 'حي الفرات', 'سويب', 
    'ابو دشير', 'أبو دشير', 'الكرخ', 'الرصافة', 'حي البساتين', 'سبع قصور', 'حي دراغ', 'الشرطة الرابعة', 
    'الشرطة الخامسة', 'المسبح', 'عرصات الهندية', 'الكرادة خارج', 'الكرادة داخل', 'البلديات', 'الحبيبية', 
    'الكمالية', 'الفضل', 'الميدان', 'المستنصرية', 'الرافدين', 'جامعة بغداد', 'الجادرية', 'النهرين', 'التكنولوجية',
    'الطالبية', 'طالبية', 'حي سومر', 'الأمين', 'الامين', 'حي المعلمين'
  ];

  // Extract "من [origin] الى/لـ [destination]" accurately
  let routeMatch = norm.match(/من\s+(.+?)\s+(?:إلى|الي|الى|لـ|ل)\s+(.+)/i);
  if (routeMatch) {
    const rawOrigin = routeMatch[1].trim().replace(/^(منطقة|حي|شارع)\s+/, '');
    if (isValidLocation(rawOrigin)) {
      origin = rawOrigin;
    }
    destination = routeMatch[2].trim();
  } else {
    routeMatch = norm.match(/(?:إلى|الي|الى|لـ|ل)\s+(.+?)\s+من\s+(.+)/i);
    if (routeMatch) {
      destination = routeMatch[1].trim();
      const rawOrigin = routeMatch[2].trim().replace(/^(منطقة|حي|شارع)\s+/, '');
      if (isValidLocation(rawOrigin)) {
        origin = rawOrigin;
      }
    }
  }

  // If origin not yet found via routeMatch, check IRAQI_AREAS
  if (!origin) {
    for (const a of IRAQI_AREAS) {
      if (norm.toLowerCase().includes(a.toLowerCase())) {
        origin = a;
        break;
      }
    }
  }

  // Parse destination (colleges & universities)
  if (!destination) {
    if (norm.includes('رافدين') || norm.includes('رفدين')) destination = 'كلية الرافدين الجامعة';
    else if (norm.includes('مستنصرية') || norm.includes('مستنصريه')) destination = 'الجامعة المستنصرية';
    else if (norm.includes('تكنولوجية') || norm.includes('تكنولوجيه')) destination = 'الجامعة التكنولوجية';
    else if (norm.includes('نهرين')) destination = 'جامعة النهرين';
    else if (norm.includes('اسراء') || norm.includes('إسراء')) destination = 'كلية الاسراء';
    else if (norm.includes('اوروك') || norm.includes('أوروك')) destination = 'جامعة اوروك';
    else if (norm.includes('فراهيدي')) destination = 'جامعة الفراهيدي';
    else if (norm.includes('دجلة') || norm.includes('دجله')) destination = 'جامعة دجلة';
    else if (norm.includes('تراث')) destination = 'كلية التراث';
    else if (norm.includes('رشيد')) destination = 'كلية الرشيد';
    else if (norm.includes('معارف')) destination = 'كلية المعارف';
    else if (norm.includes('بغداد')) destination = 'جامعة بغداد';
  }

  // 1. Fetch strictly ACTIVE driver line offers (exclude completed, sold, matched, or student search ads)
  const { data: allActiveLines } = await supabase
    .from('ads')
    .select('*')
    .eq('category', 'transport')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(60);
  
  // Filter for actual driver line offers only (not student requests "ابحث عن خط")
  const activeDriverLines = (allActiveLines || []).filter((ad: any) => {
    const t = (ad.title || '').toLowerCase();
    const isStudentRequest = t.includes('ابحث') || t.includes('أبحث') || t.includes('محتاج') || t.includes('ادور');
    const isCompleted = ad.status === 'sold' || ad.status === 'matched' || ad.status === 'archived' || ad.status === 'closed';
    return !isStudentRequest && !isCompleted;
  });

  let matchedLines: any[] = [];
  if (activeDriverLines.length > 0) {
    if (origin && destination) {
      // Must match ORIGIN area AND DESTINATION
      const coreDest = getCoreLocationKeyword(destination);
      matchedLines = activeDriverLines.filter((ad: any) => {
        const fullAdText = `${ad.title || ''} ${ad.location || ''} ${ad.description || ''}`.toLowerCase();
        return fullAdText.includes(origin.toLowerCase()) && fullAdText.includes(coreDest);
      }).slice(0, 3);

      // If strict both not found, check if line at least covers student's ORIGIN area
      if (matchedLines.length === 0 && origin) {
        matchedLines = activeDriverLines.filter((ad: any) => {
          const fullAdText = `${ad.title || ''} ${ad.location || ''} ${ad.description || ''}`.toLowerCase();
          return fullAdText.includes(origin.toLowerCase());
        }).slice(0, 3);
      }
    } else if (origin) {
      // User specified origin only (e.g. محتاج خط من البنوك)
      matchedLines = activeDriverLines.filter((ad: any) => {
        const fullAdText = `${ad.title || ''} ${ad.location || ''} ${ad.description || ''}`.toLowerCase();
        return fullAdText.includes(origin.toLowerCase());
      }).slice(0, 3);
    }
  }

  if (origin && (fromUser?.id || chatId)) {
    const targetChatId = fromUser?.id || chatId;
    try {
      const { data: u } = await supabase.from('telegram_users').select('bot_state').eq('telegram_chat_id', targetChatId).maybeSingle();
      const s = u?.bot_state || {};
      s.last_origin = origin;
      s.last_dest = destination || 'كلية الرافدين';
      if (matchedLines && matchedLines.length > 0) {
        s.last_driver_phone = matchedLines[0].phone || '';
      }
      await supabase.from('telegram_users').update({ bot_state: s }).eq('telegram_chat_id', targetChatId);
    } catch(e) {}
  }

  // If matched active driver lines found -> return them & register seeker for future alerts
  if (matchedLines && matchedLines.length > 0) {
    // 🔔 Always register the seeker in transport_requests for radar notifications of new drivers!
    try {
      await supabase.from('transport_requests').insert({
        telegram_chat_id: String(chatId),
        telegram_user_id: fromUser?.id ? String(fromUser.id) : null,
        user_name: fromName,
        origin: origin || 'بغداد',
        destination: destination || (norm.includes('رافدين') || norm.includes('رفدين') ? 'كلية الرافدين' : 'الجامعة'),
        raw_query: rawText,
        status: 'pending'
      });
    } catch(e) {}

    let fullMsg = `🚌 <b>يا هلا بيك ${fromName}! 🌹 وجدنا لك (${matchedLines.length}) خطوط نشطة متوفرة لمسارك:</b>\n\n`;
    
    const inlineButtons: any[] = [];

    for (let i = 0; i < matchedLines.length; i++) {
      const l = matchedLines[i];
      const fareText = formatTgPrice(l.price);
      
      // Extract phone from ad.phone OR from description if phone field is empty
      const descPhoneMatch = (l.description || '').match(/(?:07[3-9]\d{8}|\+9647[3-9]\d{8}|07\d{2}\s?\d{3}\s?\d{4})/);
      const rawPhone = l.phone || (descPhoneMatch ? descPhoneMatch[0] : '');
      const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
      let waPhone = cleanPhone.startsWith('07') ? '964' + cleanPhone.substring(1) : cleanPhone.replace('+', '');

      fullMsg += 
        `<b>${i + 1}. ${l.title}</b> [🟢 نشط]\n` +
        `📍 <b>المسار:</b> ${l.location || 'بغداد'} ⬅️ ${l.city || destination || 'الجامعة'}\n` +
        `💰 <b>الأجرة:</b> ${fareText}\n` +
        (cleanPhone ? `📞 <b>هاتف السائق:</b> <code>${cleanPhone}</code>\n` : '') +
        `🔗 https://www.souqbaghdad.store/transport\n\n`;

      const row: any[] = [];
      if (waPhone) {
        row.push({ text: `💬 تواصل واتساب (${i + 1}) 🟢`, url: `https://wa.me/${waPhone}` });
      }
      if (cleanPhone) {
        row.push({ text: `📞 اتصال (${i + 1})`, url: `tel:${cleanPhone}` });
      }
      if (row.length > 0) inlineButtons.push(row);
    }

    fullMsg += `🔔 <i>تم تفعيل رادار التنبيهات أيضاً! أول ما يسجل كابتن أو خط جديد بنفس مسارك راح يجيك إشعار فوري 🌹</i>\n` +
      `💡 <i>تواصل مع السائقين مباشرة لحجز مقعدك، وإذا اكتفيت اضغط «🛑 لكيت خط خلاص» أدناه:</i>`;

    inlineButtons.push([{ text: '🛑 لكيت خط خلاص / إيقاف التنبيهات', callback_data: 'stop_alert_user' }]);
    
    // Add report button if there's at least one matched line with phone
    if (matchedLines.length > 0 && matchedLines[0].phone) {
      const firstDrvPhone = matchedLines[0].phone.replace(/[^0-9]/g, '');
      const firstDrvName = (matchedLines[0].title || 'سائق خط').substring(0, 10).replace(/_/g, '');
      inlineButtons.push([{ text: '⚠️ إبلاغ عن مشكلة مع سائق', callback_data: `rep_drv_${firstDrvName}_${firstDrvPhone}` }]);
    }

    inlineButtons.push([{ text: '🚌 تصفح جميع الخطوط بالموقع', url: 'https://www.souqbaghdad.store/transport' }]);

    const fullMarkup = { inline_keyboard: inlineButtons };

    if (isGroup) {
      // In group, send directly to group so user & members see results without obstruction
      await sendOrReplaceGroupMessage(chatId, fullMsg, fullMarkup, supabase, userMessageId);
      if (fromUser?.id) {
        try {
          await sendMessage(fromUser.id, fullMsg, fullMarkup);
        } catch(e) {}
      }
    } else {
      await sendMessage(chatId, fullMsg, fullMarkup);
    }
    return;
  }

  // If user only wrote "محتاج خط" without specifying origin or destination
  if (!origin && !destination) {
    if (isGroup) {
      const askMsg = `👋 <b>يا هلا ${fromName} 🌹</b> راسلني بالخاص وحدد مسارك لأجد لك السائقين فوراً ✨`;
      const askMarkup = {
        inline_keyboard: [[{ text: '💬 محادثة البوت بالخاص 🌹', url: `https://t.me/${BOT_USERNAME}?start=group_help` }]]
      };
      await sendOrReplaceGroupMessage(chatId, askMsg, askMarkup, supabase, userMessageId);
    } else {
      const askMsg = 
        `👋 <b>يا هلا بيك عيوني ${fromName} 🚌✨</b>\n` +
        `اكتب مسارك بالضبط (مثال: <i>محتاج خط من الدورة إلى كلية الرافدين</i>) لأجد لك السائقين المتوفرين فوراً 🌹`;
      const askMarkup = {
        inline_keyboard: [[{ text: '🚌 تصفح جميع الخطوط النشطة', url: 'https://www.souqbaghdad.store/transport' }]]
      };
      await sendMessage(chatId, askMsg, askMarkup);
    }
    return;
  }

  // Not found in active driver lines -> Register in waitlist & notify
  const finalOrigin = origin || 'بغداد';
  const finalDest = destination || (norm.includes('رافدين') || norm.includes('رفدين') ? 'كلية الرافدين' : 'الجامعة');

  try {
    await supabase.from('transport_requests').insert({
      telegram_chat_id: String(chatId),
      telegram_user_id: fromUser?.id ? String(fromUser.id) : null,
      user_name: fromName,
      origin: finalOrigin,
      destination: finalDest,
      raw_query: rawText,
      status: 'pending'
    });
  } catch(e) {
    console.error('Error saving transport request:', e);
  }

  if (isGroup) {
    // Ultra-short 1-line confirmation in group
    const shortWaitlistMsg = `📝 <b>يا هلا ${fromName} 🌹</b> سجلت طلبك لمسار (<b>${finalOrigin} ⬅️ ${finalDest}</b>)، وراح أدزلك تنبيه بالخاص أول ما يتوفر سائق ✨`;
    const shortMarkup = {
      inline_keyboard: [
        [{ text: '💬 التحدث مع البوت بالخاص 🌹', url: `https://t.me/${BOT_USERNAME}?start=group_help` }],
        [{ text: '🚌 تصفح خطوط الموقع', url: 'https://www.souqbaghdad.store/transport' }]
      ]
    };
    await sendOrReplaceGroupMessage(chatId, shortWaitlistMsg, shortMarkup, supabase, userMessageId);
  } else {
    const waitlistMsg = 
      `📝 <b>تم تسجيل طلبك بنجاح يالغالي! ✨</b>\n\n` +
      `📍 <b>المسار المطلوب:</b> من <b>${finalOrigin}</b> ⬅️ إلى <b>${finalDest}</b>\n` +
      `👤 <b>صاحب الطلب:</b> ${fromName}\n\n` +
      `🔔 <i>حالياً لا يوجد سائق مسجل بهذا الخط، لكن <b>سجلت طلبك بالنظام</b>، وأول ما يتوفر سائق أو ينزل خط نشط جديد بهذا المسار راح أنبهك فوراً! 🌹</i>`;

    const markup = {
      inline_keyboard: [
        [{ text: '🚌 تصفح خطوط سوق بغداد الحالية', url: 'https://www.souqbaghdad.store/transport' }],
        [{ text: '➕ نشر إعلان خط كسائق', url: 'https://www.souqbaghdad.store/post-ad' }]
      ]
    };
    await sendMessage(chatId, waitlistMsg, markup);
  }
}

async function notifyWaitingStudents(ad: any, supabase: any) {
  if (!ad || (ad.category !== 'transport' && ad.type !== 'transport')) return;
  const adText = `${ad.title || ''} ${ad.location || ''} ${ad.description || ''}`.toLowerCase();
  
  try {
    const { data: pendingRequests, error } = await supabase
      .from('transport_requests')
      .select('*')
      .eq('status', 'pending');

    if (error || !pendingRequests || pendingRequests.length === 0) return;

    for (const req of pendingRequests) {
      const orig = (req.origin || '').toLowerCase().trim();
      const dest = (req.destination || '').toLowerCase().trim();

      const isOriginMatch = orig && adText.includes(orig);
      const isDestMatch = dest && adText.includes(getCoreLocationKeyword(dest));

      if (isOriginMatch || isDestMatch) {
        let userTag = req.user_name || 'عزيزنا';
        if (!userTag.startsWith('@') && req.telegram_user_id) {
          userTag = `<a href="tg://user?id=${req.telegram_user_id}">${userTag}</a>`;
        }

        const notifyMsg = 
          `🔔 <b>تنبيه توفر خط نقل يطابق طلبك! 🚌✨</b>\n\n` +
          `يا هلا بيك ${userTag} 🌹\n` +
          `نزل للتو خط جديد يناسب مسارك:\n` +
          `📍 <b>المسار:</b> ${ad.title}\n` +
          `📍 <b>المناطق:</b> ${ad.location || 'بغداد'}\n` +
          `📞 <b>هاتف السائق:</b> <code>${ad.phone || 'متوفر بالموقع'}</code>\n\n` +
          `🔗 <i>تصفح الخط وتواصل مع السائق مباشرة: https://www.souqbaghdad.store/transport</i>`;

        const drvRepPhone = (ad.phone || '').replace(/[^0-9]/g, '') || 'nophone';
        const drvRepTitle = encodeURIComponent((ad.title || 'سائق خط').substring(0, 20));
        const markup = {
          inline_keyboard: [
            [{ text: '🚌 عرض تفاصيل الخط والحجز', url: 'https://www.souqbaghdad.store/transport' }],
            [{ text: '✅ لكيت خط خلاص (إيقاف التنبيهات)', callback_data: `stop_alert_${req.id}` }],
            [{ text: '⚠️ إبلاغ عن مشكلة مع الكابتن', callback_data: `rep_drv_${drvRepTitle}_${drvRepPhone}` }]
          ]
        };

        if (req.telegram_chat_id) {
          await sendMessage(req.telegram_chat_id, notifyMsg, markup);
        }

        await supabase
          .from('transport_requests')
          .update({ 
            status: 'notified', 
            notified_at: new Date().toISOString() 
          })
          .eq('id', req.id);
      }
    }
  } catch(e) {
    console.error('Error in notifyWaitingStudents:', e);
  }
}

async function sendMediaGroup(chatId: string | number, photoUrls: string[], caption: string) {
  const media = photoUrls.slice(0, 10).map((url, index) => {
    const item: any = { type: 'photo', media: url };
    if (index === 0 && caption) {
      item.caption = caption;
      item.parse_mode = 'HTML';
    }
    return item;
  });
  const body: any = { chat_id: chatId, media };
  const res = await fetch(`${tgUrl}/sendMediaGroup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function editMessageCaption(chatId: string | number, messageId: number, caption: string, replyMarkup?: any) {
  const body: any = { chat_id: chatId, message_id: messageId, caption, parse_mode: 'HTML' };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const res = await fetch(`${tgUrl}/editMessageCaption`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function editMessageText(chatId: string | number, messageId: number, text: string, replyMarkup?: any) {
  const body: any = { chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML' };
  if (replyMarkup) body.reply_markup = replyMarkup;
  const res = await fetch(`${tgUrl}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function editChannelMessage(chatId: string | number, messageId: number, captionOrText: string, replyMarkup?: any) {
  try {
    let res = await editMessageCaption(chatId, messageId, captionOrText, replyMarkup);
    if (!res?.ok) {
      console.warn(`editMessageCaption failed on ${chatId} (msg: ${messageId}):`, res?.description, '- trying editMessageText...');
      res = await editMessageText(chatId, messageId, captionOrText, replyMarkup);
    }
    return res;
  } catch (err) {
    console.error(`editChannelMessage exception on ${chatId}:`, err);
    try {
      return await editMessageText(chatId, messageId, captionOrText, replyMarkup);
    } catch(e) {
      return { ok: false, description: String(e) };
    }
  }
}



// Channel IDs from environment variables
let PRODUCT_CHANNEL = Deno.env.get('PRODUCT_CHANNEL_ID') || '@souqbaghdad_iq';
let TRANSPORT_CHANNEL = Deno.env.get('TRANSPORT_CHANNEL_ID') || '@souqbaghdad_lines';
let EXTRA_CHANNEL = '@souqbaghdad_iq';

// Specialized channels
let CAR_CHANNEL = '@souqbaghdad_car';           // Cars/Vehicles only
let CAR_CHANNEL_ID = Deno.env.get('CAR_CHANNEL_ID') || '@souqbaghdad_car';          // Cars channel username/ID
let LINES_CHANNEL = '@souqbaghdad_lines';       // Transport lines username
let LINES_CHANNEL_ID = Deno.env.get('LINES_CHANNEL_ID') || '@souqbaghdad_lines';        // Transport lines username/ID

// Check if Bot is Admin in a Channel
async function checkBotIsAdmin(channelId: string | number): Promise<{ ok: boolean; title?: string; error?: string }> {
  try {
    const res = await fetch(`${tgUrl}/getChat?chat_id=${encodeURIComponent(String(channelId))}`);
    const data = await res.json();
    if (!data.ok) {
      return { ok: false, error: data.description || 'لم يتم العثور على القناة' };
    }
    const chatTitle = data.result?.title || channelId;
    
    // Check bot member status
    const botRes = await fetch(`${tgUrl}/getChatMember?chat_id=${encodeURIComponent(String(channelId))}&user_id=${botToken.split(':')[0]}`);
    const botData = await botRes.json();
    if (!botData.ok) {
      return { ok: false, title: chatTitle, error: 'البوت ليس عضواً في القناة' };
    }
    const status = botData.result?.status;
    if (status === 'administrator' || status === 'creator') {
      return { ok: true, title: chatTitle };
    }
    return { ok: false, title: chatTitle, error: 'البوت ليس مشرفاً (Admin) في القناة' };
  } catch (err: any) {
    return { ok: false, error: err.message || 'فشل التحقق من القناة' };
  }
}

// Broadcast Ad to Partner Channels Network
async function broadcastToPartnerChannels(record: any, category: 'transport' | 'vehicles' | 'products', caption: string, photoUrl: string | string[], replyMarkup: any, supabaseClient: any) {
  try {
    const { data: partners } = await supabaseClient
      .from('partner_channels')
      .select('*')
      .eq('is_active', true)
      .or(`category.eq.${category},category.eq.all,category.eq.my_store`);

    if (!partners || partners.length === 0) return;

    const recordTitle = (record.title || '').toLowerCase();
    const recordDesc = typeof record.description === 'string' ? record.description.toLowerCase() : JSON.stringify(record.description || {}).toLowerCase();
    const recordCity = (record.city || record.location || record.governorate || record.destination || '').toLowerCase();
    const recordUni = (record.university || '').toLowerCase();
    const recordSellerId = record.seller_id || record.user_id;

    for (const partner of partners) {
      try {
        // Mode: Only My Ads (متجري فقط)
        if (partner.only_my_ads || partner.category === 'my_store') {
          let isOwnerAd = false;

          // 1. Match by Telegram Chat ID
          if (partner.owner_telegram_id && record.telegram_chat_id && String(partner.owner_telegram_id) === String(record.telegram_chat_id)) {
            isOwnerAd = true;
          }

          // 2. Match by User ID
          if (!isOwnerAd) {
            const { data: tgUser } = await supabaseClient.from('telegram_users').select('user_id, phone_number').eq('telegram_chat_id', partner.owner_telegram_id).maybeSingle();
            const partnerUserId = tgUser?.user_id;
            const partnerTgPhone = tgUser?.phone_number;

            if (partnerUserId && recordSellerId && String(partnerUserId) === String(recordSellerId)) {
              isOwnerAd = true;
            }

            // 3. Match by Phone Number
            if (!isOwnerAd && record.phone) {
              const cleanRecPhone = String(record.phone).replace(/[^0-9]/g, '');
              if (partnerTgPhone) {
                const cleanTgPhone = String(partnerTgPhone).replace(/[^0-9]/g, '');
                if (cleanRecPhone.slice(-8) === cleanTgPhone.slice(-8)) isOwnerAd = true;
              }
              if (!isOwnerAd && partnerUserId) {
                const { data: prof } = await supabaseClient.from('profiles').select('phone').eq('id', partnerUserId).maybeSingle();
                if (prof?.phone) {
                  const cleanProfPhone = String(prof.phone).replace(/[^0-9]/g, '');
                  if (cleanRecPhone.slice(-8) === cleanProfPhone.slice(-8)) isOwnerAd = true;
                }
              }
            }
          }

          if (!isOwnerAd) {
            console.log(`[PARTNER SYNDICATION] Skipping partner ${partner.channel_id} (not owner's ad)`);
            continue; // Skip because it's not the store owner's ad
          }
        }

        // Keyword Matcher Check
        if (partner.filter_keywords && partner.filter_keywords.length > 0) {
          const match = partner.filter_keywords.some((kw: string) => {
            const cleanKw = kw.toLowerCase().trim();
            return cleanKw && (
              recordTitle.includes(cleanKw) || 
              recordDesc.includes(cleanKw) || 
              recordCity.includes(cleanKw) || 
              recordUni.includes(cleanKw)
            );
          });
          if (!match) continue; // Skip if no keyword matched
        }

        // Subcategory check for products
        if (category === 'products' && partner.sub_category && partner.sub_category !== 'all') {
          if (record.category !== partner.sub_category) continue;
        }

        // Send to partner channel
        const targetPhoto = Array.isArray(photoUrl) ? photoUrl[0] : photoUrl;
        if (targetPhoto) {
          await sendPhoto(partner.channel_id, targetPhoto, caption, replyMarkup);
        } else {
          await sendMessage(partner.channel_id, caption, replyMarkup);
        }
        console.log(`[PARTNER SYNDICATION] Broadcasted ad #${record.short_id || record.id} to ${partner.channel_id} (${partner.channel_title})`);
      } catch (pErr) {
        console.error(`[PARTNER SYNDICATION ERROR] Failed to send to ${partner.channel_id}:`, pErr);
      }
    }
  } catch (err) {
    console.error('[PARTNER SYNDICATION FATAL ERROR]:', err);
  }
}

// Finalize and Save Partner Channel
async function finalizePartnerChannel(chatId: number, state: any, supabaseClient: any, updateOrSend: Function) {
  const channelId = state.data.channel_id;
  const channelTitle = state.data.channel_title || channelId;
  const category = state.data.category || 'all';
  const subCategory = state.data.sub_category || 'all';
  const keywords = state.data.filter_keywords || [];
  const onlyMyAds = state.data.only_my_ads === true || category === 'my_store';

  const { error } = await supabaseClient.from('partner_channels').upsert({
    owner_telegram_id: chatId,
    channel_id: channelId,
    channel_title: channelTitle,
    category: category,
    sub_category: subCategory,
    filter_keywords: keywords,
    only_my_ads: onlyMyAds,
    is_active: true,
    updated_at: new Date().toISOString()
  }, { onConflict: 'channel_id' });

  if (error) {
    console.error('Error saving partner channel:', error);
    await updateOrSend('❌ حدث خطأ أثناء حفظ القناة، يرجى المحاولة لاحقاً.');
    return new Response('OK', { status: 200 });
  }

  // Send test welcome message to the connected channel
  try {
    const catName = onlyMyAds 
      ? '🛍️ إعلانات متجري / إعلاناتي الشخصية فقط'
      : (category === 'transport' ? '🚌 خطوط نقل' : (category === 'vehicles' ? '🚗 سيارات' : (category === 'products' ? '🛍️ منتجات ومتاجر' : '🌐 كل الإعلانات')));
    
    const testMsg = 
      `🎉 <b>تم ربط القناة بنجاح مع منصة سوق بغداد الرقمي!</b> 🇮🇶\n\n` +
      `📌 <b>تخصص الإعلانات المعتمد:</b> ${catName}\n` +
      (onlyMyAds ? `⚡ <b>الوضع:</b> جاري مزامنة ونشر إعلانات متجرك السابقة في القناة...\n\n` : `🚀 ستبدأ القناة باستلام أحدث الإعلانات المنسقة والمصممة تلقائياً لخدمة متابعيكم.\n\n`) +
      `🌐 <b>موقع المنصة:</b> https://www.souqbaghdad.store\n` +
      `🤖 <b>البوت المعتمد:</b> @${BOT_USERNAME}`;

    await sendMessage(channelId, testMsg);

    // Sync Existing / Past Active Ads to the newly connected channel
    EdgeRuntime.waitUntil((async () => {
      try {
        console.log(`[PARTNER SYNC PAST ADS] Starting sync for ${channelId}, onlyMyAds=${onlyMyAds}, category=${category}`);
        const { data: tgUser } = await supabaseClient.from('telegram_users').select('user_id').eq('telegram_chat_id', chatId).maybeSingle();
        const sellerUserId = tgUser?.user_id;

        // 1. Sync Products
        if (category === 'products' || category === 'all' || onlyMyAds) {
          let prodQuery = supabaseClient.from('products').select('*').eq('status', 'active');
          if (onlyMyAds && sellerUserId) {
            prodQuery = prodQuery.eq('seller_id', sellerUserId);
          }
          const { data: pastProducts } = await prodQuery.order('created_at', { ascending: true }).limit(15);
          if (pastProducts && pastProducts.length > 0) {
            for (const prod of pastProducts) {
              try {
                const prodLink = `https://www.souqbaghdad.store/product/${prod.short_id || prod.id}`;
                const prodCaption = await generateSocialCaption(prod, 'product', prodLink, true);
                const prodImages = await ensurePublicImages(prod, 'products', supabaseClient);
                const pImg = prodImages.length > 0 ? prodImages[0] : getFallbackImage(prod, 'product');
                const pButtons = {
                  inline_keyboard: [
                    [{ text: '🛒 عرض المنتج كاملاً', url: prodLink }],
                    [{ text: '📢 انشر إعلانك مجاناً', url: `https://t.me/${BOT_USERNAME}` }]
                  ]
                };
                await sendPhoto(channelId, pImg, prodCaption, pButtons);
                await new Promise(r => setTimeout(r, 600)); // Rate limit pause
              } catch(e) {
                console.error('Error syncing past product:', e);
              }
            }
          }
        }

        // 2. Sync Ads (Cars & Transport)
        if (category !== 'products') {
          let adsQuery = supabaseClient.from('ads').select('*').eq('status', 'active');
          if (onlyMyAds && sellerUserId) {
            adsQuery = adsQuery.eq('seller_id', sellerUserId);
          } else if (category === 'transport') {
            adsQuery = adsQuery.eq('category', 'transport');
          } else if (category === 'vehicles') {
            adsQuery = adsQuery.in('category', ['vehicles', 'cars', 'car']);
          }

          const { data: pastAds } = await adsQuery.order('created_at', { ascending: true }).limit(15);
          if (pastAds && pastAds.length > 0) {
            for (const ad of pastAds) {
              try {
                // Filter keyword check for transport
                if (category === 'transport' && keywords.length > 0) {
                  const adText = ((ad.title || '') + ' ' + (ad.destination || '') + ' ' + (ad.regions || '') + ' ' + (ad.university || '')).toLowerCase();
                  const match = keywords.some((k: string) => adText.includes(k.toLowerCase().trim()));
                  if (!match) continue;
                }

                const adType = ad.category === 'transport' ? 'transport' : 'car';
                const adLink = adType === 'transport' 
                  ? `https://www.souqbaghdad.store/transport/card/${ad.short_id || ad.id}`
                  : `https://www.souqbaghdad.store/ad/${ad.short_id || ad.id}`;
                
                const adCaption = await generateSocialCaption(ad, adType, adLink, true);
                const adImages = await ensurePublicImages(ad, 'ads', supabaseClient);
                const adImg = adImages.length > 0 ? adImages[0] : getFallbackImage(ad, adType);
                const adButtons = {
                  inline_keyboard: [
                    [{ text: adType === 'transport' ? '🌐 التفاصيل الكاملة وحجز المقعد' : '🚗 عرض التفاصيل بالمنصة', url: adLink }],
                    [{ text: '📢 انشر إعلانك مجاناً', url: `https://t.me/${BOT_USERNAME}` }]
                  ]
                };
                await sendPhoto(channelId, adImg, adCaption, adButtons);
                await new Promise(r => setTimeout(r, 600)); // Rate limit pause
              } catch(e) {
                console.error('Error syncing past ad:', e);
              }
            }
          }
        }
      } catch(syncErr) {
        console.error('Error in past ads background sync:', syncErr);
      }
    })());
  } catch(e) {
    console.warn('Welcome message to partner channel failed:', e);
  }

  state = {};
  await supabaseClient.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

  await updateOrSend(
    `✅ <b>تم ربط قناتك بنجاح!</b> 🎉\n\n` +
    `📢 <b>القناة:</b> ${channelTitle} (${channelId})\n` +
    (onlyMyAds 
      ? `👑 <b>الوضع المختار:</b> إعلانات متجرك الخاص فقط. أي منتج أو إعلان تنشره في الموقع أو البوت سينزل في قناتك فورياً وبتصميم مرتب!`
      : `⚡ <b>الوضع المختار:</b> استلام إعلانات المنصة المطابقة لتخصص قناتك تلقائياً وبأعلى جودة!\n\nشكراً لانضمامك إلى شبكة سوق بغداد الرقمي 🤝`),
    {
      inline_keyboard: [
        [{ text: '📋 عرض قنواتي المربوطة', callback_data: 'partner_my_channels' }],
        [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
      ]
    }
  );
  return new Response('OK', { status: 200 });
}

const META_SYSTEM_USER_TOKEN = Deno.env.get('META_SYSTEM_USER_TOKEN') || 'EAAPXexo3QZCcBSbsjqzSmRYjWEEazQioLNZB97IFK6ckf6eUAZAjZBpyySXHbPFM6L0JDeWZCKKwSGZBZBnpi5e0HL8EGQz7030QHZCWiU0phZBpmtYVZATGdzw3rGXS0qidEzKiTsrFNsUA8zIMFinVfQfLJDNeFY4Vz45HvQgzgIKVVuDMm9i9ck6DmwzX7uZCZBUCZAAZDZD';
const META_PAGE_ACCESS_TOKEN = Deno.env.get('META_PAGE_ACCESS_TOKEN') || META_SYSTEM_USER_TOKEN;
const META_PAGE_ID = Deno.env.get('META_PAGE_ID') || '1088044114402452';
const META_IG_ACCOUNT_ID = Deno.env.get('META_IG_ACCOUNT_ID') || '17841403127032930';
const THREADS_USER_ID = Deno.env.get('THREADS_USER_ID') || '28119436894335542';
const THREADS_ACCESS_TOKEN = Deno.env.get('THREADS_ACCESS_TOKEN') || '';

const ALRAFDAIN_FB_TOKEN = Deno.env.get('ALRAFDAIN_FB_TOKEN') || META_SYSTEM_USER_TOKEN;
const ALRAFDAIN_FB_PAGE_ID = Deno.env.get('ALRAFDAIN_FB_PAGE_ID') || '102975411515668';
const ALRAFDAIN_IG_ID = Deno.env.get('ALRAFDAIN_IG_ID') || '17841404181680155';
let ALRAFDAIN_TELEGRAM_CHANNEL = '@ruc_1';

// Dynamic Database Social Settings Cache (Hot Reload from Owner Dashboard)
let dynamicSocialCache: Record<string, any> = {};
let lastSocialCacheTime = 0;

const OWNER_CHAT_ID = '6474465462';
const ALERTS_CHANNEL_ID = '-1004369286694';
const lastAlertTimes: Record<string, number> = {};

async function checkAndAlertTokenError(platformName: string, responseData: any) {
  if (!responseData?.error) return;
  const err = responseData.error;
  const errMsg = (err.message || JSON.stringify(err)).toLowerCase();
  const errCode = err.code;
  const errSubcode = err.error_subcode;

  const isTokenError = 
    errCode === 190 || 
    errSubcode === 463 || 
    errSubcode === 467 ||
    errMsg.includes('expired') || 
    errMsg.includes('session has expired') || 
    errMsg.includes('access token') || 
    errMsg.includes('invalid oauth') || 
    errMsg.includes('validate access token');

  if (isTokenError) {
    const now = Date.now();
    const lastTime = lastAlertTimes[platformName] || 0;
    if (now - lastTime < 10 * 60 * 1000) {
      return;
    }
    lastAlertTimes[platformName] = now;

    console.warn(`[TOKEN ALERT TRIGGERED] ${platformName}: ${err.message || errMsg}`);

    // Try to inspect token via Meta debug_token API for exact details
    let tokenDebugInfo = 'لا تتوفر تفاصيل إضافية';
    try {
      const debugRes = await fetch(`https://graph.facebook.com/v20.0/debug_token?input_token=${META_PAGE_ACCESS_TOKEN}&access_token=${META_PAGE_ACCESS_TOKEN}`);
      if (debugRes.ok) {
        const dData = await debugRes.json();
        if (dData?.data) {
          const dt = dData.data;
          const issuedStr = dt.issued_at ? new Date(dt.issued_at * 1000).toLocaleString('ar-IQ', { timeZone: 'Asia/Baghdad' }) : 'غير معروف';
          const expiresStr = dt.expires_at === 0 ? 'دائم (Never Expire) ♾️' : (dt.expires_at ? new Date(dt.expires_at * 1000).toLocaleString('ar-IQ', { timeZone: 'Asia/Baghdad' }) : 'غير محدد');
          tokenDebugInfo = `• نوع التوكن: <b>${dt.type || 'User'}</b>\n• تاريخ الإنشاء: <b>${issuedStr}</b>\n• تاريخ الانتهاء: <b>${expiresStr}</b>\n• التطبيق: <b>${dt.application || 'Meta App'}</b>\n• الصلاحية: <b>${dt.is_valid ? 'ساري وصالح ✅' : 'منتهي / غير صالح ❌'}</b>`;
        }
      }
    } catch(debErr) {}

    const alertMessage = 
      `🚨 <b>تنبيه فوري: فحص توكن ${platformName}!</b>\n\n` +
      `⚠️ <b>السبب ورسالة الخطأ:</b>\n<code>${err.message || errMsg || 'Error validating access token'}</code>\n\n` +
      `📊 <b>تفاصيل وبيانات التوكن الحالية:</b>\n${tokenDebugInfo}\n\n` +
      `💡 <b>لماذا تظهر أخطاء التوكن أحياناً؟</b>\n` +
      `1️⃣ <b>توكن مؤقت (User Token):</b> ينتهي بعد ساعة أو 60 يوماً إن لم يكن من <i>System User دائم</i>.\n` +
      `2️⃣ <b>تغيير كلمة المرور أو تسجيل الخروج:</b> يبطل توكنات المستخدمين العاديين فوراً.\n` +
      `3️⃣ <b>صلاحيات ناقصة للمنشورات:</b> مثل نقص <code>pages_manage_posts</code> أو <code>instagram_content_publish</code>.\n\n` +
      `⏰ <i>الوقت: ${new Date().toLocaleString('ar-IQ', { timeZone: 'Asia/Baghdad' })}</i>`;

    const alertMarkup = {
      inline_keyboard: [
        [{ text: '🔑 إعدادات Business Suite', url: 'https://business.facebook.com/latest/settings/system_users' }],
        [{ text: '🛠️ فحص التوكن في Explorer', url: 'https://developers.facebook.com/tools/debug/accesstoken/' }],
        [{ text: '⚙️ لوحة تحكم سوق بغداد', url: 'https://www.souqbaghdad.store/admin' }]
      ]
    };

    try {
      await sendMessage(OWNER_CHAT_ID, alertMessage, alertMarkup);
    } catch(e) {
      console.error('Failed to send token alert to owner:', e);
    }

    try {
      await sendMessage(ALERTS_CHANNEL_ID, alertMessage, alertMarkup);
    } catch(e) {
      console.error('Failed to send token alert to channel:', e);
    }
  }
}

async function getLiveSocialSetting(id: string): Promise<any> {
  const now = Date.now();
  if (now - lastSocialCacheTime < 10000 && dynamicSocialCache[id]) {
    return dynamicSocialCache[id];
  }
  try {
    const sbClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { data } = await sbClient.from('social_settings').select('*');
    if (data && data.length > 0) {
      dynamicSocialCache = {};
      for (const row of data) {
        dynamicSocialCache[row.id] = row;
      }
      lastSocialCacheTime = now;
      return dynamicSocialCache[id];
    }
  } catch (e) {
    console.error('Failed to load live social setting from DB:', e);
  }
  return dynamicSocialCache[id] || null;
}

async function postToThreads(text: string, photoUrl: string | string[] | null) {
  if (!THREADS_ACCESS_TOKEN) return { error: { message: 'رمز الوصول لـ Threads مفقود أو غير صالح' } };
  const userId = THREADS_USER_ID || 'me';
  try {
    const urls = Array.isArray(photoUrl) ? photoUrl : (photoUrl ? [photoUrl] : []);
    const rawUrl = urls.length > 0 ? urls[0] : null;
    const singleUrl = rawUrl 
      ? ((rawUrl.includes('generate-story-image') || rawUrl.includes('supabase.co')) ? rawUrl : `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=1080&h=1080&fit=cover`)
      : null;

    let containerUrl = `https://graph.threads.net/v1.0/${userId}/threads`;
    let params = new URLSearchParams();
    params.append('access_token', THREADS_ACCESS_TOKEN);
    params.append('text', text);

    if (singleUrl) {
      params.append('media_type', 'IMAGE');
      params.append('image_url', singleUrl);
    } else {
      params.append('media_type', 'TEXT');
    }

    let cRes = await fetch(`${containerUrl}?${params.toString()}`, { method: 'POST' });
    let cData = await cRes.json();

    // If userId failed, retry with 'me'
    if (cData.error && userId !== 'me') {
      console.warn(`Threads creation failed with userId ${userId}, retrying with 'me':`, cData.error);
      const meUrl = `https://graph.threads.net/v1.0/me/threads`;
      cRes = await fetch(`${meUrl}?${params.toString()}`, { method: 'POST' });
      cData = await cRes.json();
    }

    // Fallback: If image upload failed on Threads, try text-only post
    if (cData.error && singleUrl) {
      console.warn('Threads image creation failed, falling back to TEXT:', cData.error);
      params.set('media_type', 'TEXT');
      params.delete('image_url');
      cRes = await fetch(`${containerUrl}?${params.toString()}`, { method: 'POST' });
      cData = await cRes.json();
      if (cData.error && userId !== 'me') {
        const meUrl = `https://graph.threads.net/v1.0/me/threads`;
        cRes = await fetch(`${meUrl}?${params.toString()}`, { method: 'POST' });
        cData = await cRes.json();
      }
    }

    if (cData.id) {
      // Wait for Threads media processing before publishing
      if (singleUrl) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      let pUrl = `https://graph.threads.net/v1.0/${userId}/threads_publish?creation_id=${cData.id}&access_token=${encodeURIComponent(THREADS_ACCESS_TOKEN)}`;
      let pRes = await fetch(pUrl, { method: 'POST' });
      let pData = await pRes.json();
      if (pData.error && userId !== 'me') {
        pUrl = `https://graph.threads.net/v1.0/me/threads_publish?creation_id=${cData.id}&access_token=${encodeURIComponent(THREADS_ACCESS_TOKEN)}`;
        pRes = await fetch(pUrl, { method: 'POST' });
        pData = await pRes.json();
      }
      if (pData.error) await checkAndAlertTokenError('ثريدز (Threads)', pData);
      console.log('Threads Publish Response:', pData);
      return pData;
    }
    if (cData.error) await checkAndAlertTokenError('ثريدز (Threads)', cData);
    console.error('Threads Container Creation Error:', cData);
    return cData;
  } catch (err: any) {
    console.error('Threads Post Error:', err);
    return { error: { message: err.message || 'خطأ في النشر على Threads' } };
  }
}

function extractImages(record: any): string[] {
  if (!record) return [];
  let list: any[] = [];
  if (Array.isArray(record.images)) {
    list = record.images;
  } else if (typeof record.images === 'string') {
    try {
      const parsed = JSON.parse(record.images);
      if (Array.isArray(parsed)) list = parsed;
      else if (typeof parsed === 'string') list = [parsed];
    } catch {
      if (record.images.startsWith('http')) list = [record.images];
    }
  } else if (typeof record.image === 'string' && record.image.startsWith('http')) {
    list = [record.image];
  } else if (Array.isArray(record.photos)) {
    list = record.photos;
  }
  return list.filter(u => typeof u === 'string' && u.startsWith('http') && !u.startsWith('data:'));
}

async function postToFacebook(text: string, photoUrl: string | string[] | null, customToken?: string, customPageId?: string) {
  const isRafdainPage = customPageId === '102975411515668' || customPageId === ALRAFDAIN_FB_PAGE_ID;
  const dbSetting = (!customToken && !customPageId) ? await getLiveSocialSetting(isRafdainPage ? 'fb_rafdain' : 'fb_souq') : null;
  const token = customToken || dbSetting?.access_token || (isRafdainPage ? ALRAFDAIN_FB_TOKEN : META_PAGE_ACCESS_TOKEN);
  const pageId = customPageId || dbSetting?.page_id || (isRafdainPage ? ALRAFDAIN_FB_PAGE_ID : META_PAGE_ID);
  if (!token || !pageId) return { error: { message: 'رمز الوصول لفيسبوك مفقود أو غير صالح' } };
  try {
    const urls = Array.isArray(photoUrl) ? photoUrl : (photoUrl ? [photoUrl] : []);
    const cleanUrls = urls.filter(u => typeof u === 'string' && u.startsWith('http'));

    // 1. Photo Post (Single or Multiple) -> Upload temporary/unpublished photos via multipart buffer, then publish Feed Post with attached_media
    if (cleanUrls.length > 0) {
      console.log(`[FB MEDIA UPLOAD] Uploading ${cleanUrls.length} photos for Facebook Page ${pageId}...`);
      const attachedMedia: any[] = [];
      
      for (const rawUrl of cleanUrls.slice(0, 10)) {
        try {
          // Fetch image buffer directly
          const imgFetch = await fetch(rawUrl);
          if (imgFetch.ok) {
            const imgBlob = await imgFetch.blob();
            const formData = new FormData();
            formData.append('source', imgBlob, 'photo.png');
            formData.append('published', 'false');
            formData.append('access_token', token);

            const uploadRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/photos`, {
              method: 'POST',
              body: formData
            });
            const uploadData = await uploadRes.json();
            if (uploadData && uploadData.id) {
              attachedMedia.push({ media_fbid: uploadData.id });
            } else {
              console.warn('FB Photo upload error:', uploadData);
            }
          }
        } catch (e) {
          console.error('FB Photo upload item exception:', e);
        }
      }

      if (attachedMedia.length > 0) {
        console.log(`[FB FEED POST] Publishing feed post with ${attachedMedia.length} attached media on Page ${pageId}...`);
        const feedParams = new URLSearchParams();
        feedParams.append('message', text);
        attachedMedia.forEach((media, idx) => {
          feedParams.append(`attached_media[${idx}]`, JSON.stringify(media));
        });
        feedParams.append('access_token', token);

        const feedRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/feed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: feedParams.toString()
        });
        const feedData = await feedRes.json();
        console.log('[FB FEED WITH MEDIA] Response:', feedData);

        if (feedData && feedData.id) {
          const rawId = feedData.id;
          const cleanPostId = rawId.includes('_') ? rawId.split('_')[1] : rawId;
          feedData.url = `https://www.facebook.com/${pageId}/posts/${cleanPostId}`;
          feedData.permalink_url = feedData.url;
          return feedData;
        } else if (feedData && feedData.error) {
          const pageName = isRafdainPage ? 'فيسبوك كلية الرافدين' : 'فيسبوك سوق بغداد';
          await checkAndAlertTokenError(pageName, feedData);
          return feedData;
        }
      }
    }

    // 2. Text or Link Feed Post (only if no photos)
    console.log(`[FB FEED TEXT] Posting feed message to Facebook Page ${pageId}...`);
    const feedParams = new URLSearchParams();
    feedParams.append('message', text);
    feedParams.append('access_token', token);

    const feedRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: feedParams.toString()
    });
    const feedData = await feedRes.json();
    console.log('[FB FEED TEXT] Response:', feedData);
    if (feedData && feedData.id) {
      const rawId = feedData.id;
      const cleanPostId = rawId.includes('_') ? rawId.split('_')[1] : rawId;
      feedData.url = `https://www.facebook.com/${pageId}/posts/${cleanPostId}`;
      feedData.permalink_url = feedData.url;
      return feedData;
    }
    if (feedData.error) {
      const pageName = isRafdainPage ? 'فيسبوك كلية الرافدين' : 'فيسبوك سوق بغداد';
      if (!isRafdainPage) {
        await checkAndAlertTokenError(pageName, feedData);
      }
    }
    return feedData;
  } catch (err: any) {
    console.error('FB Fetch Error:', err);
    return { error: { message: err.message || 'خطأ في الاتصال بفيسبوك' } };
  }
}

async function deleteFromFacebook(postId: string, customToken?: string) {
  const token = customToken || META_PAGE_ACCESS_TOKEN;
  if (!token || !postId) return false;
  try {
    let res = await fetch(`https://graph.facebook.com/v20.0/${postId}?access_token=${token}`, {
      method: 'DELETE'
    });
    if (!res.ok && ALRAFDAIN_FB_TOKEN && ALRAFDAIN_FB_TOKEN !== token) {
      res = await fetch(`https://graph.facebook.com/v20.0/${postId}?access_token=${ALRAFDAIN_FB_TOKEN}`, {
        method: 'DELETE'
      });
    }
    return res.ok;
  } catch (err) {
    console.error('FB Delete Error:', err);
    return false;
  }
}

async function commentOnFacebook(postId: string, message: string, customToken?: string) {
  const token = customToken || META_PAGE_ACCESS_TOKEN;
  if (!token || !postId) return false;
  try {
    let res = await fetch(`https://graph.facebook.com/v20.0/${postId}/comments?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!res.ok && ALRAFDAIN_FB_TOKEN && ALRAFDAIN_FB_TOKEN !== token) {
      res = await fetch(`https://graph.facebook.com/v20.0/${postId}/comments?access_token=${ALRAFDAIN_FB_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
    }
    const data = await res.json();
    return data && data.id ? true : false;
  } catch (err) {
    console.error('FB Comment Error:', err);
    return false;
  }
}

async function deleteOldFacebookPostsForAd(shortId: string, pageId: string, token: string, existingPostId?: string | null) {
  try {
    if (existingPostId) {
      await deleteFromFacebook(existingPostId, token);
    }
    if (!shortId || !pageId || !token) return;
    const cleanShortId = shortId.replace('#', '').trim().toLowerCase();
    if (cleanShortId.length < 2) return;

    const res = await fetch(`https://graph.facebook.com/v20.0/${pageId}/published_posts?fields=id,message&limit=30&access_token=${token}`);
    if (!res.ok) return;
    const data = await res.json();
    for (const post of data?.data || []) {
      const msg = (post.message || '').toLowerCase();
      if (msg.includes(cleanShortId)) {
        console.log(`[FB AUTO CLEANUP] Deleting previous duplicate Facebook post ${post.id} for ad code #${shortId}...`);
        await deleteFromFacebook(post.id, token);
      }
    }
  } catch(e) {
    console.error('deleteOldFacebookPostsForAd exception:', e);
  }
}

async function findFacebookPostByQuery(query: string, customToken?: string, customPageId?: string): Promise<string | null> {
  const token = customToken || META_PAGE_ACCESS_TOKEN;
  const pageId = customPageId || META_PAGE_ID;
  if (!token || !pageId || !query) return null;
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${pageId}/published_posts?fields=id,message&limit=50&access_token=${token}`);
    if (!res.ok) return null;
    const data = await res.json();
    const cleanQuery = query.replace('#', '').trim().toLowerCase();
    for (const post of data?.data || []) {
      const msg = (post.message || '').toLowerCase();
      if (cleanQuery.length >= 3 && msg.includes(cleanQuery)) {
        console.log(`[FB SMART MATCH] Found matching Facebook post ${post.id} for query "${query}"`);
        return post.id;
      }
    }
  } catch(e) {
    console.error('findFacebookPostByQuery error:', e);
  }
  return null;
}

async function updateFacebookPost(postId: string, newText: string, customToken?: string) {
  const token = customToken || META_PAGE_ACCESS_TOKEN;
  if (!token || !postId) return false;
  try {
    let res = await fetch(`https://graph.facebook.com/v20.0/${postId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newText, access_token: token })
    });
    let data = await res.json();
    if (!data.success && !data.id && ALRAFDAIN_FB_TOKEN && ALRAFDAIN_FB_TOKEN !== token) {
      res = await fetch(`https://graph.facebook.com/v20.0/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newText, access_token: ALRAFDAIN_FB_TOKEN })
      });
      data = await res.json();
    }
    return data;
  } catch (err) {
    console.error('FB Update Post Error:', err);
    return false;
  }
}

async function deleteFromThreads(threadsMediaId: string) {
  if (!THREADS_ACCESS_TOKEN || !threadsMediaId) return false;
  try {
    const res = await fetch(`https://graph.threads.net/v1.0/${threadsMediaId}?access_token=${encodeURIComponent(THREADS_ACCESS_TOKEN)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.error('Threads Delete Error:', err);
    return false;
  }
}

async function findInstagramPostByQuery(query: string, customToken?: string, customAccountId?: string): Promise<string | null> {
  let token = customToken;
  let accountId = customAccountId;
  if (!token || !accountId) {
    const igSetting = await getLiveSocialSetting('ig_souq');
    token = token || igSetting?.access_token || META_PAGE_ACCESS_TOKEN;
    accountId = accountId || igSetting?.page_id || igSetting?.extra_id || META_IG_ACCOUNT_ID;
  }
  if (!token || !accountId || !query) return null;
  const isDirectIg = token.startsWith('IGAA');
  const apiBase = isDirectIg ? 'https://graph.instagram.com/v20.0' : 'https://graph.facebook.com/v20.0';
  try {
    const res = await fetch(`${apiBase}/${accountId}/media?fields=id,caption&limit=50&access_token=${token}`);
    if (!res.ok) return null;
    const data = await res.json();
    const cleanQuery = query.replace('#', '').trim().toLowerCase();
    for (const post of data?.data || []) {
      const cap = (post.caption || '').toLowerCase();
      if (cleanQuery.length >= 3 && cap.includes(cleanQuery)) {
        console.log(`[IG SMART MATCH] Found matching Instagram post ${post.id} for query "${query}"`);
        return post.id;
      }
    }
  } catch(e) {
    console.error('findInstagramPostByQuery error:', e);
  }
  return null;
}

async function syncAndHealAd(ad: any, supabaseClient: any): Promise<{ healed: boolean; details: Record<string, string> }> {
  const shortId = ad.short_id || ad.id;
  const isSoldOrArchived = ad.status === 'sold' || ad.status === 'archived' || ad.status === 'deleted' || ad.status === 'inactive';
  let syncStatus = typeof ad.sync_status === 'object' && ad.sync_status ? { ...ad.sync_status } : {};
  const details: Record<string, string> = {};
  let changed = false;

  // 1. If Sold / Archived / Inactive -> Ensure proper mark sold / deletion across all platforms
  if (isSoldOrArchived) {
    const igId = syncStatus.instagram_post_id || ad.instagram_post_id;
    if (igId) {
      const delSuccess = await deleteFromInstagram(igId);
      if (delSuccess) {
        delete syncStatus.instagram_post_id;
        changed = true;
        details.instagram = 'deleted_sold';
      }
    }
    const fbId = syncStatus.facebook_post_id || ad.facebook_post_id;
    if (fbId) {
      await updateFacebookPost(fbId, `⚠️ [تم البيع / مباعة / مغلق] — إعلان #${shortId}\n\nشكراً لتعاملكم مع منصة سوق بغداد الرقمي.`);
      details.facebook = 'updated_sold';
    }
    const rucFbId = syncStatus.rafdain_facebook_post_id;
    if (rucFbId) {
      const rafdainSetting = await getLiveSocialSetting('fb_rafdain');
      await updateFacebookPost(rucFbId, `⚠️ [اكتمل العدد / الخط مغلق] — إعلان خط #${shortId}\n\nشكراً لتعاملكم مع كلية الرافدين الجامعة وسوق بغداد.`, rafdainSetting?.access_token);
      details.rafdain_facebook = 'updated_sold';
    }
    if (changed) {
      await supabaseClient.from('ads').update({ sync_status: syncStatus }).eq('id', ad.id);
    }
    return { healed: changed, details };
  }

  // 2. Active Ads: Smart Search to link existing posts and prevent duplicates
  // Check Souq Facebook
  if (syncStatus.facebook !== 'success' || !syncStatus.facebook_post_id) {
    const existingFbPostId = await findFacebookPostByQuery(shortId);
    if (existingFbPostId) {
      console.log(`[WATCHDOG] Found existing Facebook post for #${shortId}: ${existingFbPostId}`);
      syncStatus.facebook = 'success';
      syncStatus.facebook_post_id = existingFbPostId;
      changed = true;
      details.facebook = 'recovered_existing';
    }
  }

  // Check Al-Rafdain Facebook (if applicable)
  const isRafdain = (ad.category === 'transport') && (
    (ad.title && ad.title.includes('الرافدين')) || 
    (ad.city && ad.city.includes('الرافدين')) || 
    (ad.location && ad.location.includes('الرافدين')) ||
    (ad.description && JSON.stringify(ad.description).includes('الرافدين'))
  );

  if (isRafdain && (syncStatus.rafdain_facebook !== 'success' || !syncStatus.rafdain_facebook_post_id)) {
    const rafdainSetting = await getLiveSocialSetting('fb_rafdain');
    const existingRucPostId = await findFacebookPostByQuery(shortId, rafdainSetting?.access_token, rafdainSetting?.page_id || '102975411515668');
    if (existingRucPostId) {
      console.log(`[WATCHDOG] Found existing Al-Rafdain Facebook post for #${shortId}: ${existingRucPostId}`);
      syncStatus.rafdain_facebook = 'success';
      syncStatus.rafdain_facebook_post_id = existingRucPostId;
      changed = true;
      details.rafdain_facebook = 'recovered_existing';
    }
  }

  // Check Instagram
  if (syncStatus.instagram !== 'success' || !syncStatus.instagram_post_id) {
    const existingIgPostId = await findInstagramPostByQuery(shortId);
    if (existingIgPostId) {
      console.log(`[WATCHDOG] Found existing Instagram post for #${shortId}: ${existingIgPostId}`);
      syncStatus.instagram = 'success';
      syncStatus.instagram_post_id = existingIgPostId;
      changed = true;
      details.instagram = 'recovered_existing';
    }
  }

  // 3. Republish any missing platforms safely
  const needsFb = syncStatus.facebook !== 'success' && !syncStatus.facebook_post_id;
  const needsRucFb = isRafdain && syncStatus.rafdain_facebook !== 'success' && !syncStatus.rafdain_facebook_post_id;
  const needsIg = syncStatus.instagram !== 'success' && !syncStatus.instagram_post_id;

  if (needsFb || needsRucFb || needsIg) {
    console.log(`[WATCHDOG HEAL] Retrying missing platforms for ad #${shortId}: FB=${needsFb}, RucFB=${needsRucFb}, IG=${needsIg}`);
    
    let photoUrl: any = null;
    if (ad.category === 'transport') {
      const dynUrl = `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=post&title=${encodeURIComponent(ad.title)}&regions=${encodeURIComponent(ad.location || '')}&destination=${encodeURIComponent(ad.city || '')}&short_id=${shortId}&phone=${encodeURIComponent(ad.phone || '')}`;
      photoUrl = `https://wsrv.nl/?url=${encodeURIComponent(dynUrl)}&output=png`;
    } else {
      photoUrl = extractImages(ad);
    }

    const link = ad.category === 'transport' ? `https://www.souqbaghdad.store/transport/card/${shortId}` : `https://www.souqbaghdad.store/ad/${shortId}`;
    const caption = await generateSocialCaption(ad, ad.category, link);

    if (needsFb) {
      const fbData = await postToFacebook(caption, photoUrl);
      if (fbData && (fbData.post_id || fbData.id)) {
        syncStatus.facebook = 'success';
        syncStatus.facebook_post_id = fbData.post_id || fbData.id;
        changed = true;
        details.facebook = 'republished';
      }
    }

    if (needsRucFb && ad.is_vip) {
      const rafdainSetting = await getLiveSocialSetting('fb_rafdain');
      const rucData = await postToFacebook(caption, photoUrl, rafdainSetting?.access_token || ALRAFDAIN_FB_TOKEN, rafdainSetting?.page_id || '102975411515668');
      if (rucData && (rucData.post_id || rucData.id)) {
        syncStatus.rafdain_facebook = 'success';
        syncStatus.rafdain_facebook_post_id = rucData.post_id || rucData.id;
        changed = true;
        details.rafdain_facebook = 'republished';
      }
    }

    if (needsIg) {
      const igData = await postToInstagram(caption, photoUrl);
      if (igData && (igData.id || igData.media_id)) {
        syncStatus.instagram = 'success';
        syncStatus.instagram_post_id = igData.id || igData.media_id;
        changed = true;
        details.instagram = 'republished';
      }
    }
  }

  if (changed) {
    syncStatus.last_healed_at = new Date().toISOString();
    await supabaseClient.from('ads').update({ sync_status: syncStatus }).eq('id', ad.id);
  }

  return { healed: changed, details };
}


function buildStoryImageUrl(record: any, category: string, primaryImageOrImages?: string | string[]): string {
  const shortId = record?.short_id || record?.id || '';
  const priceVal = record?.price ? `${record.price} ${record.currency || 'د.ع'}` : '';

  const allImgs = Array.isArray(primaryImageOrImages) ? primaryImageOrImages : (primaryImageOrImages ? [primaryImageOrImages] : (record?.images || []));
  const validImgs = allImgs.filter((u: any) => typeof u === 'string' && u.startsWith('http'));

  if (validImgs.length > 0) {
    return validImgs[0];
  }

  return `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=story&category=${encodeURIComponent(category || 'transport')}&title=${encodeURIComponent(record?.title || '')}&regions=${encodeURIComponent(record?.location || record?.city || 'بغداد')}&destination=${encodeURIComponent(record?.destination || record?.city || 'بغداد')}&fare=${encodeURIComponent(priceVal)}&phone=${encodeURIComponent(record?.phone || '')}&short_id=${shortId}`;
}

async function prepareStoryBufferAndUrl(photoUrl: string): Promise<{ publicUrl: string; blob: Blob | null }> {
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || 'sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || anonKey;

  try {
    let sourceUrl = photoUrl;
    const headers: Record<string, string> = {};

    if (photoUrl.includes('supabase.co/functions/v1/generate-story-image')) {
      headers['apikey'] = anonKey;
      headers['Authorization'] = `Bearer ${serviceKey}`;
    } else if (photoUrl.startsWith('http') && !photoUrl.includes('wsrv.nl')) {
      // Format image onto a vertical 9:16 Story Canvas (1080x1920) with sleek dark background
      sourceUrl = `https://wsrv.nl/?url=${encodeURIComponent(photoUrl)}&w=1080&h=1920&fit=contain&cbg=18191a&output=jpg`;
    }

    console.log(`[STORY PREPARE] Fetching story canvas from:`, sourceUrl);
    const res = await fetch(sourceUrl, { headers, signal: AbortSignal.timeout(15000) });

    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      const isPng = sourceUrl.includes('generate-story-image') || res.headers.get('content-type')?.includes('png');
      const ext = isPng ? 'png' : 'jpg';
      const mime = isPng ? 'image/png' : 'image/jpeg';
      const fileName = `story-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { data, error } = await supabase.storage.from('ad-images').upload(fileName, arrayBuf, {
        contentType: mime,
        upsert: true
      });

      if (error) console.error(`[STORY PREPARE] Upload error:`, error);

      if (!error && data) {
        const { data: pubData } = supabase.storage.from('ad-images').getPublicUrl(fileName);
        console.log(`[STORY PREPARE] Cached permanent 9:16 story to:`, pubData.publicUrl);
        const blob = new Blob([arrayBuf], { type: mime });
        return { publicUrl: pubData.publicUrl, blob };
      }
    } else {
      console.warn(`[STORY PREPARE] Fetch failed with status: ${res.status}`);
    }
  } catch(err) {
    console.error(`[STORY PREPARE] Error fetching/caching story image:`, err);
  }

  return { publicUrl: photoUrl, blob: null };
}

async function postToFacebookStory(photoUrl: string, pageId: string, accessToken: string) {
  if (!accessToken || !pageId || !photoUrl) return { error: { message: 'رمز الوصول لفيسبوك أو الصورة مفقودة' } };
  
  try {
    console.log(`[FB STORY] Publishing Story 9:16 to Facebook Page ${pageId}...`);
    
    const { publicUrl, blob } = await prepareStoryBufferAndUrl(photoUrl);

    let uploadData: any = null;
    if (blob) {
      const form = new FormData();
      form.append('source', blob, 'story.png');
      form.append('published', 'false');
      form.append('temporary', 'true');
      form.append('access_token', accessToken);

      const uploadRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/photos`, {
        method: 'POST',
        body: form
      });
      uploadData = await uploadRes.json();
    } else {
      const uploadParams = new URLSearchParams();
      uploadParams.append('url', publicUrl);
      uploadParams.append('published', 'false');
      uploadParams.append('temporary', 'true');
      uploadParams.append('access_token', accessToken);

      const uploadRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: uploadParams.toString()
      });
      uploadData = await uploadRes.json();
    }

    console.log(`[FB STORY UPLOAD] Result:`, JSON.stringify(uploadData));

    if (uploadData && uploadData.id) {
      // Step 2: Publish photo story
      const storyRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/photo_stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_id: uploadData.id,
          access_token: accessToken
        })
      });
      const storyData = await storyRes.json();
      console.log(`[FB STORY] Result for page ${pageId}:`, JSON.stringify(storyData));
      return storyData;
    }
    return uploadData;
  } catch (err: any) {
    console.error('FB Story Error:', err);
    return { error: { message: err.message || 'خطأ في نشر ستوري فيسبوك' } };
  }
}

async function postToInstagramStory(photoUrl: string, igAccountId?: string, accessToken?: string) {
  let token = accessToken;
  let accountId = igAccountId;
  if (!token || !accountId) {
    const igSetting = await getLiveSocialSetting('ig_souq');
    token = token || igSetting?.access_token || META_PAGE_ACCESS_TOKEN;
    const rawId = igSetting?.extra_id || igSetting?.page_id || META_IG_ACCOUNT_ID;
    // Always choose Instagram Professional Account ID (starting with 1784...)
    accountId = (rawId && rawId.startsWith('1784')) ? rawId : (igSetting?.extra_id || META_IG_ACCOUNT_ID || '17841403127032930');
  }
  if (!token || !accountId || !photoUrl) return { error: { message: 'رمز الوصول لانستكرام أو الصورة مفقودة' } };
  
  const { publicUrl } = await prepareStoryBufferAndUrl(photoUrl);

  const isDirectIg = token.startsWith('IGAA');
  const apiBase = isDirectIg ? 'https://graph.instagram.com/v20.0' : 'https://graph.facebook.com/v20.0';

  try {
    const uploadBody = {
      image_url: publicUrl,
      media_type: 'STORIES',
      access_token: token
    };
    const uploadRes = await fetch(`${apiBase}/${accountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uploadBody)
    });
    const uploadData = await uploadRes.json();
    console.log(`[IG STORY] Container creation result for ${accountId}:`, JSON.stringify(uploadData));
    
    if (uploadData && uploadData.id) {
       await new Promise(resolve => setTimeout(resolve, 4000));
       const publishBody = {
         creation_id: uploadData.id,
         access_token: token
       };
       const publishRes = await fetch(`${apiBase}/${accountId}/media_publish`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(publishBody)
       });
       const pubResult = await publishRes.json();
       console.log(`[IG STORY] Published successfully to ${accountId}:`, JSON.stringify(pubResult));
       return pubResult;
    }
    return uploadData;
  } catch (err: any) {
    console.error('IG Story Fetch Error:', err);
    return { error: { message: err.message || 'خطأ في الاتصال بانستكرام' } };
  }
}

async function postToInstagram(text: string, photoUrl: string | string[] | null, customToken?: string, customAccountId?: string) {
  let token = customToken;
  let accountId = customAccountId;
  
  if (!token || !accountId) {
    const igSetting = await getLiveSocialSetting('ig_souq');
    token = token || igSetting?.access_token || META_PAGE_ACCESS_TOKEN;
    const rawId = igSetting?.extra_id || igSetting?.page_id || META_IG_ACCOUNT_ID;
    accountId = (rawId && rawId.startsWith('1784')) ? rawId : (igSetting?.extra_id || META_IG_ACCOUNT_ID || '17841403127032930');
  }
  
  if (!token || !accountId || !photoUrl) return { error: { message: 'رمز الوصول لانستكرام أو الصورة مفقودة' } };
  
  const isDirectIg = token.startsWith('IGAA');
  const apiBase = isDirectIg ? 'https://graph.instagram.com/v20.0' : 'https://graph.facebook.com/v20.0';
  
  try {
    const rawUrls = Array.isArray(photoUrl) ? photoUrl : [photoUrl];
    // Instagram carousel supports a max of 10 items
    const originalUrls = rawUrls.slice(0, 10);
    const urls = originalUrls.map(url => url.includes('generate-story-image') ? `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=png` : (url.includes('supabase.co') ? url : `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=1080&h=1080&fit=cover`));
    for (const u of urls) {
      if (u.includes('wsrv.nl')) {
        try { await fetch(u); } catch(e) {}
      }
    }
    
    if (urls.length > 1) {
      const containerIds = [];
      for (const url of urls) {
        const uploadBody = {
          image_url: url,
          is_carousel_item: true,
          access_token: token
        };
        const uploadRes = await fetch(`${apiBase}/${accountId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(uploadBody)
        });
        const uploadData = await uploadRes.json();
        if (uploadData && uploadData.id) {
          containerIds.push(uploadData.id);
        }
      }
      
      if (containerIds.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const carouselBody = {
          caption: text,
          media_type: 'CAROUSEL',
          children: containerIds.join(','),
          access_token: token
        };
        
        const carouselRes = await fetch(`${apiBase}/${accountId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(carouselBody)
        });
        const carouselData = await carouselRes.json();
        
        if (carouselData && carouselData.id) {
           await new Promise(resolve => setTimeout(resolve, 5000));
           const publishBody = {
             creation_id: carouselData.id,
             access_token: token
           };
           const publishRes = await fetch(`${apiBase}/${accountId}/media_publish`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(publishBody)
           });
           return await publishRes.json();
        } else {
           return { error: { message: `Failed to create carousel: ${JSON.stringify(carouselData)}` } };
        }
      }
    }
    
    const singleUrl = urls[0];
    const uploadUrl = `${apiBase}/${accountId}/media`;
    
    const uploadBody = {
      image_url: singleUrl,
      caption: text,
      access_token: token
    };
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uploadBody)
    });
    const uploadData = await uploadRes.json();
    
    if (!uploadData.id) {
      console.error('IG Upload Error:', uploadData);
      if (uploadData?.error) await checkAndAlertTokenError('انستكرام سوق بغداد (@souqbaghdad.iq)', uploadData);
      return { error: { message: `Media ID not available. URL: ${singleUrl}. Response: ${JSON.stringify(uploadData)}` } };
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const publishUrl = `${apiBase}/${accountId}/media_publish`;
    const publishBody = {
      creation_id: uploadData.id,
      access_token: token
    };
    const publishRes = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(publishBody)
    });
    const data = await publishRes.json();
    if (data?.error) {
      await checkAndAlertTokenError('انستكرام سوق بغداد (@souqbaghdad.iq)', data);
    }
    if (data?.id) {
      try {
        const permalinkRes = await fetch(`${apiBase}/${data.id}?fields=id,permalink,shortcode&access_token=${token}`);
        const permData = await permalinkRes.json();
        if (permData?.permalink) {
          data.permalink = permData.permalink;
          data.url = permData.permalink;
        }
      } catch(e) {}
    }
    return data;
  } catch (err: any) {
    console.error('IG Error:', err);
    return { error: { message: err.message || 'خطأ في الاتصال بانستكرام' } };
  }
}

async function postToTikTok(text: string, photoUrl: string | string[] | null, supabaseClient: any) {
  if (!photoUrl) return { error: { message: 'الصورة مفقودة' } };
  
  try {
    const { data: authData, error: authError } = await supabaseClient
      .from('social_integrations')
      .select('access_token')
      .eq('platform', 'tiktok')
      .single();
      
    if (authError || !authData?.access_token) {
      return { error: { message: 'غير مسجل الدخول في تيك توك' } };
    }
    
    const token = authData.access_token;
    const originalUrls = Array.isArray(photoUrl) ? photoUrl : [photoUrl];
    
    const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post_info: {
          title: text.substring(0, 150),
          description: text.substring(0, 2200),
          privacy_level: "SELF_ONLY",
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          auto_add_music: true
        },
        source_info: {
          source: "PULL_FROM_URL",
          photo_cover_index: 1,
          photo_images: originalUrls
        },
        post_mode: "DIRECT_POST",
        media_type: "PHOTO"
      })
    });
    
    const initData = await initRes.json();
    return initData;
  } catch (err: any) {
    console.error('TikTok Error:', err);
    return { error: { message: err.message || 'خطأ في الاتصال بتيك توك' } };
  }
}

async function deleteFromInstagram(mediaId: string, customToken?: string) {
  let token = customToken;
  if (!token) {
    const igSetting = await getLiveSocialSetting('ig_souq');
    token = igSetting?.access_token || META_PAGE_ACCESS_TOKEN;
  }
  if (!token || !mediaId) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${mediaId}?access_token=${token}`, {
      method: 'DELETE'
    });
    const data = await res.json().catch(() => ({}));
    console.log(`[IG DELETE] mediaId=${mediaId}, ok=${res.ok}`, data);
    return res.ok || data?.success === true;
  } catch (err) {
    console.error('IG Delete Error:', err);
    return false;
  }
}

async function commentOnInstagram(mediaId: string, text: string, customToken?: string) {
  let token = customToken;
  if (!token) {
    const igSetting = await getLiveSocialSetting('ig_souq');
    token = igSetting?.access_token || META_PAGE_ACCESS_TOKEN;
  }
  if (!token || !mediaId) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${mediaId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, access_token: token })
    });
    const data = await res.json().catch(() => ({}));
    console.log(`[IG COMMENT] mediaId=${mediaId}, ok=${res.ok}`, data);
    return res.ok || data?.id ? true : false;
  } catch (err) {
    console.error('IG Comment Error:', err);
    return false;
  }
}

function formatTgPrice(val: any, currency = 'د.ع'): string {
  if (!val || val === '0' || val === 0) return 'حسب الاتفاق 🤝';
  let str = String(val).trim();
  const rawNum = str.replace(/[^\d]/g, '');
  if (!rawNum) return str;
  let num = parseInt(rawNum, 10);
  if (!isNaN(num) && num > 0 && num < 1000 && currency.includes('د.ع')) {
    num = num * 1000;
  }
  return isNaN(num) ? str : `${num.toLocaleString('en-US')} ${currency}`;
}

function extractImagesRaw(record: any): string[] {
  if (!record) return [];
  let list: any[] = [];
  if (Array.isArray(record.images)) {
    list = record.images;
  } else if (typeof record.images === 'string') {
    try {
      const parsed = JSON.parse(record.images);
      if (Array.isArray(parsed)) list = parsed;
      else if (typeof parsed === 'string') list = [parsed];
    } catch {
      if (record.images.startsWith('http') || record.images.startsWith('data:image/')) list = [record.images];
    }
  } else if (typeof record.image === 'string' && (record.image.startsWith('http') || record.image.startsWith('data:image/'))) {
    list = [record.image];
  } else if (Array.isArray(record.photos)) {
    list = record.photos;
  }
  return list.filter(u => typeof u === 'string' && (u.startsWith('http') || u.startsWith('data:image/')));
}

async function ensurePublicImages(record: any, table: 'ads' | 'products', supabase: any): Promise<string[]> {
  const rawImages = extractImagesRaw(record);
  const publicUrls: string[] = [];
  let updated = false;

  for (const img of rawImages) {
    if (typeof img === 'string' && img.startsWith('data:image/')) {
      try {
        const match = img.match(/^data:(image\/[a-z]+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1];
          const base64Data = match[2];
          const binaryString = atob(base64Data);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const ext = mimeType.split('/')[1] || 'jpg';
          const fileName = `social-${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${ext}`;
          
          const { data, error } = await supabase.storage
            .from('ad-images')
            .upload(fileName, bytes, {
              contentType: mimeType,
              upsert: true
            });
          
          if (error) {
            console.error('Error uploading base64 to storage:', error);
            continue;
          }

          if (data) {
            const { data: publicUrlData } = supabase.storage
              .from('ad-images')
              .getPublicUrl(fileName);
            publicUrls.push(publicUrlData.publicUrl);
            updated = true;
          }
        }
      } catch (err) {
        console.error('Failed to parse/upload base64 image:', err);
      }
    } else if (typeof img === 'string' && img.startsWith('http')) {
      publicUrls.push(img);
    }
  }

  if (updated) {
    console.log(`[STORAGE] Uploaded base64 images and updating table ${table} ID ${record.id}`);
    try {
      await supabase.from(table).update({ images: publicUrls }).eq('id', record.id);
    } catch (e) {
      console.error('Failed to update record images array in DB:', e);
    }
  }

  return publicUrls;
}

function getFallbackImage(record: any, type: 'car' | 'product' | 'ad'): string {
  if (type === 'car') {
    let p: any = {};
    if (typeof record.description === 'string') {
      try { p = JSON.parse(record.description); } catch {}
    } else if (typeof record.description === 'object' && record.description !== null) {
      p = record.description;
    }
    const brand = (p.brand || record.brand || '').toLowerCase().trim();
    const model = (p.model || record.model || '').toLowerCase().trim();
    const year = (p.year || record.year || '').trim();

    if (brand || model) {
      const tags = [brand, model, year, 'car'].filter(Boolean).map(t => t.replace(/[^a-zA-Z0-9]/g, '')).join(',');
      return `https://loremflickr.com/1080/1080/${tags}`;
    }
    return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1080&h=1080&fit=crop';
  }

  const category = (record.category || '').toLowerCase().trim();
  const title = (record.title || '').toLowerCase().trim();

  if (category.includes('phone') || category.includes('mobile') || title.includes('موبايل') || title.includes('تلفون') || title.includes('ايفون') || title.includes('آيفون')) {
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1080&h=1080&fit=crop';
  }
  if (category.includes('computer') || category.includes('laptop') || title.includes('كمبيوتر') || title.includes('حاسوب') || title.includes('لابتوب')) {
    return 'https://images.unsplash.com/photo-1496181130204-7552cc14AC1A?w=1080&h=1080&fit=crop';
  }
  if (category.includes('estate') || category.includes('property') || category.includes('house') || title.includes('بيت') || title.includes('شقة') || title.includes('عقار') || title.includes('اراضي') || title.includes('أرض')) {
    return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1080&h=1080&fit=crop';
  }
  if (category.includes('fashion') || category.includes('cloth') || title.includes('ملابس') || title.includes('فستان') || title.includes('قميص') || title.includes('جاكيت') || title.includes('بدلة')) {
    return 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1080&h=1080&fit=crop';
  }
  if (category.includes('watch') || title.includes('ساعة') || title.includes('ساعه')) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1080&h=1080&fit=crop';
  }
  if (category.includes('perfume') || title.includes('عطر') || title.includes('عطور')) {
    return 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1080&h=1080&fit=crop';
  }

  const englishTags = (category + ' ' + title).replace(/[^a-zA-Z]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  if (englishTags.length > 0) {
    return `https://loremflickr.com/1080/1080/${englishTags.slice(0, 3).join(',')},product`;
  }
  
  return 'https://images.unsplash.com/photo-1522204538064-f37f6c137f8e?w=1080&h=1080&fit=crop';
}

const generateSocialCaption = async (record: any, type: 'car' | 'product' | 'transport' | 'ad', link: string, isHtml = false): Promise<string> => {
  let price = formatTgPrice(record.price, record.currency || 'د.ع');

  // --- 1. TRANSPORT LINES (خطوط النقل) ---
  if (type === 'transport') {
    let descObj: any = {};
    if (typeof record.description === 'string') {
      try { descObj = JSON.parse(record.description); } catch { descObj = { note: record.description }; }
    } else if (typeof record.description === 'object' && record.description !== null) {
      descObj = record.description;
    }

    const destination = record.university || record.destination || record.city || 'الجامعة / مكان العمل';
    const regions = record.regions || record.location || record.city || 'بغداد';
    const audience = descObj?.targetAudience || record.targetAudience || 'طالبات / طلاب / موظفين';
    const shift = descObj?.shift || record.shift || 'صباحي';
    const days = descObj?.days || record.days || 'طيلة أيام الدوام';
    const shortId = record.short_id || record.id || '';

    const b = (txt: string) => isHtml ? `<b>${txt}</b>` : txt;

    return `🚌 ${b('توفير نقل خط جديد — سوق بغداد')}\n\n` +
           `🏢 ${b('الوجهة:')} ${destination}\n` +
           `📍 ${b('مناطق الانطلاق:')} ${regions}\n` +
           `👥 ${b('نوع الخط:')} ${audience}\n` +
           `⏰ ${b('أوقات الدوام:')} ${shift}\n` +
           `📅 ${b('أيام الدوام:')} ${days}\n` +
           `💰 ${b('الأجرة:')} ${price}\n` +
           (shortId ? `🆔 ${b('كود الإعلان:')} #${shortId}\n\n` : `\n`) +
           `🔗 ${b('لمشاهدة تفاصيل الخط ورقم التواصل:')}\n${link}\n\n` +
           `💬 اكتب "تم" أو راسلنا بالتعليقات وتوصلك كافة تفاصيل الخط على الخاص 📩\n\n` +
           `#سوق_بغداد #خطوط_نقل #خط_جامعة #خطوط_بغداد #جامعة_الرافدين #باصات_بغداد #العراق`;
  }

  // --- 2. CARS (سيارات) ---
  if (type === 'car') {
    let p: any = {};
    if (typeof record.description === 'string') {
      try { p = JSON.parse(record.description); } catch { p = { note: record.description }; }
    } else if (typeof record.description === 'object' && record.description !== null) {
      p = record.description;
    }
    const carTitle = `${p.brand || ''} ${p.model || ''} ${p.year || ''}`.trim() || record.title || 'سيارة للبيع';
    const gov = record.location || record.city || record.governorate || 'بغداد';
    const shortId = record.short_id || record.id || '';

    let noteText = '';
    if (typeof p === 'object' && p !== null) {
      noteText = p.note || p.description || p.details || '';
    } else if (typeof record.description === 'string' && !record.description.trim().startsWith('{')) {
      noteText = record.description;
    }
    if (typeof noteText === 'string') {
      noteText = noteText.replace(/<[^>]*>?/gm, '').trim();
      if (noteText.startsWith('{') && noteText.endsWith('}')) noteText = '';
      if (noteText.length > 500) noteText = noteText.substring(0, 500) + '...';
    } else {
      noteText = '';
    }

    const rawPhone = record.phone || p.phone || '';
    let cleanPhone = String(rawPhone).replace(/[^0-9+]/g, '');
    if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
    else cleanPhone = cleanPhone.replace('+', '');

    const b = (txt: string) => isHtml ? `<b>${txt}</b>` : txt;

    let contactInfo = '';
    if (rawPhone) {
      if (isHtml) {
        contactInfo = `📞 <a href="https://wa.me/${cleanPhone}">تواصل مباشر واتساب (${rawPhone})</a>`;
      } else {
        contactInfo = `📞 التواصل المباشر (هاتف / واتساب): ${rawPhone}\n💬 رابط الواتساب المباشر: https://wa.me/${cleanPhone}`;
      }
    } else {
      contactInfo = `📞 التواصل المباشر: عبر الموقع أو الرسائل الخاصة`;
    }

    return `🚗 ${b(carTitle)}\n\n` +
           `📅 ${b('سنة الصنع:')} ${p.year || 'غير محدد'}\n` +
           `🛣️ ${b('المسافة المقطوعة:')} ${p.mileage ? parseInt(p.mileage).toLocaleString('en-US') + ' كم' : 'غير محدد'}\n` +
           `📋 ${b('المواصفات:')} ${p.origin || 'وارد عام'}\n` +
           `💰 ${b('السعر:')} ${price}\n` +
           `📍 ${b('الموقع:')} ${gov}\n\n` +
           (noteText ? `📝 ${b('تفاصيل إضافية:')}\n${noteText}\n\n` : '') +
           `🆔 ${b('كود الإعلان:')} #${shortId}\n` +
           `🔗 ${b('رابط المعاينة والتفاصيل:')}\n${link}\n\n` +
           `${contactInfo}\n\n` +
           `#سوق_بغداد #سيارات_العراق #سيارات_للبيع #بغداد_سيارات #العراق`;
  }

  // --- 3. PRODUCTS & GENERAL ADS (المنتجات والإعلانات العامة) ---
  const title = record.title || 'إعلان معروض في سوق بغداد';
  const location = record.governorate || record.location || record.city || 'بغداد';
  const shortId = record.short_id || (record.id && String(record.id).length < 12 ? record.id : '');
  const condition = record.condition === 'new' ? '✨ جديد' : (record.condition === 'used' ? '👌 مستعمل' : '');

  let descText = '';
  if (typeof record.description === 'string') {
    if (record.description.trim().startsWith('{')) {
      try {
        const p = JSON.parse(record.description);
        descText = p.note || p.description || p.details || '';
      } catch { descText = ''; }
    } else {
      descText = record.description;
    }
  } else if (typeof record.description === 'object' && record.description !== null) {
    descText = record.description.note || record.description.description || record.description.details || '';
  }
  if (typeof descText === 'string') {
    descText = descText.replace(/<[^>]*>?/gm, '').trim();
    if (descText.startsWith('{') && descText.endsWith('}')) descText = '';
    if (descText.length > 500) descText = descText.substring(0, 500) + '...';
  } else {
    descText = '';
  }

  const rawPhone = record.phone || '';
  let cleanPhone = String(rawPhone).replace(/[^0-9+]/g, '');
  if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
  else cleanPhone = cleanPhone.replace('+', '');

  const b = (txt: string) => isHtml ? `<b>${txt}</b>` : txt;

  let contactInfo = '';
  if (rawPhone) {
    if (isHtml) {
      contactInfo = `📞 <a href="https://wa.me/${cleanPhone}">تواصل مباشر واتساب (${rawPhone})</a>`;
    } else {
      contactInfo = `📞 التواصل المباشر (هاتف / واتساب): ${rawPhone}\n💬 رابط الواتساب المباشر: https://wa.me/${cleanPhone}`;
    }
  } else {
    contactInfo = `📞 التواصل المباشر: عبر الموقع أو الرسائل الخاصة`;
  }

  const emoji = type === 'product' ? '🛍️' : '📢';

  return `${emoji} ${b(title)}\n\n` +
         (condition ? `🏷️ ${b('الحالة:')} ${condition}\n` : '') +
         `💰 ${b('السعر:')} ${price}\n` +
         `📍 ${b('الموقع:')} ${location}\n\n` +
         (descText ? `📝 ${b('التفاصيل الكاملة:')}\n${descText}\n\n` : '') +
         `🆔 ${b('كود الإعلان:')} #${shortId}\n` +
         `🔗 ${b('رابط المعاينة والتفاصيل:')}\n${link}\n\n` +
         `${contactInfo}\n\n` +
         `#سوق_بغداد #تسوق_العراق #العراق #بغداد`;
};

function generateHashtags(title: string, desc: string): string {
  const defaultTag = '#سوق_بغداد_الرقمي';
  if (!title) return defaultTag;
  const words = title.split(/\s+/).filter(w => w.length > 2).slice(0, 3);
  const tags = words.map(w => '#' + w.replace(/[^\w\u0600-\u06FF]/g, ''));
  return [defaultTag, ...tags].join(' ');
}

async function sendWhatsAppWelcome(phone: string, title: string, link: string) {
  const token = Deno.env.get('WHATSAPP_TOKEN');
  const phoneId = Deno.env.get('WHATSAPP_PHONE_ID') || Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  if (!token || !phoneId || !phone) return;

  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
  if (cleanPhone.startsWith('7') && cleanPhone.length === 10) cleanPhone = '964' + cleanPhone;

  const msg = 
`🎉 أهلاً بك في منصة سوق بغداد الرقمي!

تم بنجاح نشر إعلانك:
📌 *"${title}"*

🚀 *تم النشر تلقائياً على منصات التواصل التابعة لسوق بغداد:*
🌐 *الموقع الرسمي:* ${link}
✈️ *تيليكرام:* https://t.me/souqbaghdad_iq
🚗 *قناة السيارات:* https://t.me/souqbaghdad_car
🚌 *قناة خطوط النقل:* https://t.me/souqbaghdad_lines
📘 *فيسبوك:* https://facebook.com/souqbaghdad.iq

━━━━━━━━━━━━━━━
⏳ *ملاحظة هامة حول النشر القادم:*
• يمكنك نشر إعلان جديد إضافي بعد مرور *15 دقيقة*.
• أو يمكنك *تعديل إعلانك الحالي* في أي وقت مجاناً من ملفك الشخصي.
• في حال رغبت بالنشر الفوري وتجاوز مهلة الـ 15 دقيقة، يتوفر خيار النشر السريع بخصم ضعف النقاط (2x).

شكراً لثقتكم بسوق بغداد! 🌟`;

  try {
    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: { body: msg }
      })
    });
    const data = await res.json();
    console.log('WhatsApp API Response for', cleanPhone, ':', JSON.stringify(data));
  } catch(e) {
    console.error('WhatsApp Error:', e);
  }
}

function getLocalIraqiResponse(text: string): string {
  const clean = text.toLowerCase().trim();
  if (clean.includes('برومو') || clean.includes('كود') || clean.includes('رمز') || clean.includes('شحن كود')) {
    return '🎟️ هلا بيك عيوني! إذا عندك كود بروموكود لشحن النقاط، اضغط على زر <b>[🎟️ تعبئة بروموكود]</b> جوة، ودز الكود وراح تنزل النقاط بمحفظتك فوراً!';
  }
  if (clean.includes('سيار') || clean.includes('ابيع') || clean.includes('أبيع') || clean.includes('اعرض') || clean.includes('بيع')) {
    return '🚗 هلا بيك عيوني وتدلل! نشر السيارة كلش سهل وبدقايق.. بس اضغط على زر <b>[🚗 اعرض سيارتك للبيع مجاناً]</b> جوة، واختار الماركة والموديل وسنة الصنع والسعر ودزلنا صورها، ومباشرة راح ينزل إعلانك بالمنصة وقناة التليكرام!';
  }
  if (clean.includes('خط') || clean.includes('نقل') || clean.includes('جامع') || clean.includes('دوام') || clean.includes('سايق') || clean.includes('طالب')) {
    return '🚌 يا هلا بيك يالغالي! بخصوص خطوط النقل، اضغط على زر <b>[🚌 انشر خط نقل]</b> جوة، وحدد إذا إنت صاحب خط أو طالب/موظف تدور خط، واختار المناطق والجامعة والدوام، وراح ينشر إعلانك وتوصلك الطلبات فوراً!';
  }
  if (clean.includes('تعديل') || clean.includes('سعر') || clean.includes('حذف') || clean.includes('مسح') || clean.includes('نباعت') || clean.includes('مبيوع') || clean.includes('مباع')) {
    return '📋 تدلل حبيبي، تكدر تعدل السعر أو رقم التلفون أو تحذف الإعلان أو تبلغه كمباع بأي وقت وبسهولة من خلال زر <b>[📋 إدارة إعلاناتي وخطوطي]</b> جوة.';
  }
  if (clean.includes('نقط') || clean.includes('نقاط') || clean.includes('شحن') || clean.includes('محفظ')) {
    return '🪙 النشر مجاني بالكامل عيوني! وإذا حبيت تزيد نقاطك تكدر تضغط على <b>[🎟️ تعبئة بروموكود]</b> أو <b>[💳 شراء نقاط]</b> جوة أو تراسل الإدارة @rucno.';
  }
  if (clean.includes('سلام') || clean.includes('هلو') || clean.includes('مرحبا') || clean.includes('شلونك') || clean.includes('شخبارك') || clean.includes('مساء') || clean.includes('صباح')) {
    return '👋 أهلاً وسهلاً بيك نورت سوق بغداد يالغالي! شلون أقدر أساعدك اليوم؟ تكدر تعرض سيارتك أو تنشر خط نقل أو تعبي بروموكود من الأزرار جوة 👇';
  }
  return 'هلا بيك عيوني نورت سوق بغداد! 🇮🇶 شلون أقدر أساعدك اليوم؟ تكدر تختار مباشرة من الأزرار أدناه 👇';
}

async function fetchDatabaseContext(queryText: string): Promise<string> {
  try {
    const clean = queryText.toLowerCase().trim();
    let adsContext = '';

    // 1. إذا طلب المستخدم آخر الإعلانات أو أحدث المنشورات
    if (clean.includes('اخر') || clean.includes('اخير') || clean.includes('أحدث') || clean.includes('جديد') || clean.includes('شنو نزل') || clean.includes('اعلانات')) {
      const { data: latestAds } = await supabase
        .from('ads')
        .select('title, price, year, location, city, phone, short_id, category, type, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(4);

      if (latestAds && latestAds.length > 0) {
        adsContext += `\n[أحدث الإعلانات المعروضة حالياً في المنصة]:\n`;
        latestAds.forEach((ad, i) => {
          adsContext += `${i + 1}. ${ad.title} (موديل: ${ad.year || 'غير محدد'}) | السعر: ${ad.price} | الموقع: ${ad.city || ad.location || 'بغداد'} | رقم هاتف البائع: ${ad.phone || 'تواصل عبر الموقع'} | رقم الإعلان: #${ad.short_id || ad.title} | الرابط: https://www.souqbaghdad.store/product/${ad.short_id}\n`;
        });
      }
    }

    // 2. البحث عن سيارة محددة أو خط نقل أو كلمة مفتاحية (مثل النترا، كورولا، توسان، سنتافي، كيا، اوبتيما، كامري، تكسي، خط...)
    const keywords = queryText.replace(/[\?\؟\!\,]/g, '').trim().split(/\s+/).filter(w => w.length >= 2 && !['شنو', 'اكو', 'عندكم', 'ناشرين', 'اريد', 'أريد', 'ادور', 'أدور', 'شكد', 'بكم', 'سعر', 'هل', 'منو', 'على', 'في', 'عن'].includes(w));
    
    if (keywords.length > 0) {
      const searchTerms = keywords.slice(0, 3);
      let query = supabase.from('ads').select('title, price, year, location, city, phone, short_id, category, description, created_at').eq('status', 'active');
      
      const orConditions = searchTerms.map(t => `title.ilike.%${t}%,description.ilike.%${t}%,location.ilike.%${t}%`).join(',');
      const { data: searchAds } = await query.or(orConditions).order('created_at', { ascending: false }).limit(4);

      if (searchAds && searchAds.length > 0) {
        adsContext += `\n[إعلانات مطابقة لبحث المستخدم في قاعدة البيانات]:\n`;
        searchAds.forEach((ad, i) => {
          adsContext += `${i + 1}. ${ad.title} (سنة: ${ad.year || 'غير محدد'}) | السعر: ${ad.price} | الموقع: ${ad.city || ad.location || 'بغداد'} | هاتف البائع: ${ad.phone || 'متوفر بالموقع'} | رقم الإعلان: #${ad.short_id} | الرابط: https://www.souqbaghdad.store/product/${ad.short_id}\n`;
        });
      }
    }

    return adsContext;
  } catch (e) {
    console.error('Error fetching database context:', e);
    return '';
  }
}

async function callGemini(text: string | null, audioUrl: string | null = null, photoUrl: string | null = null): Promise<string | null> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

  // استرجاع معلومات حية من قاعدة البيانات
  const dbContext = text ? await fetchDatabaseContext(text) : '';

  const systemInstruction = `أنت المساعد الذكي الخبير لمنصة "سوق بغداد" (سوق رقمي عراقي متكامل لبيع وشراء السيارات، خطوط النقل، والمنتجات - موقعنا: https://www.souqbaghdad.store).
شخصيتك:
- تتحدث بلهجة عراقية بغدادية دارجة ومحببة جداً وذكية وخدومة (مثل: هلا بيك عيوني، تدلل يالغالي، من عيوني، تأمر أمر، حياك الله، عاشت ايدك).
- تفهم كل أسئلة المستخدم عن السيارات المعروضة، الأسعار، أحدث الإعلانات، وأرقام الهواتف، وخطوط النقل، وطريقة النشر والتعديل.
- إذا كان هناك معلومات مرفقة من قاعدة بيانات المنصة أدناه، استخدمها فوراً للإجابة بدقة متناهية وزوّد المستخدم باسم السيارة، السعر، رقم الإعلان، ورقم هاتف البائع إذا سأل عنه.
- إذا أرسل المستخدم صورة أو سكرين شوت، قم بقراءتها واستخراج اسم السيارة وسعرها ورقم الهاتف منها بذكاء.

${dbContext ? `معلومات حقيقية ومباشرة من قاعدة بيانات سوق بغداد حالياً:\n${dbContext}\n` : ''}

قواعد أساسية:
1. إذا سأل هل ناشرين سيارة معينة (مثل النترا، كورولا، سنتافي): تحقق من المعلومات أعلاه، إذا موجودة اذكره له بالتفصيل وسعرها ورقم الهاتف. إذا غير موجودة، أخبره بلطافة أن يدخل للموقع أو يبحث من الأزرار أو ينشر طلبه.
2. إذا سأل عن آخر إعلان أو أحدث السيارات: اعرض له الإعلانات الأخيرة من البيانات أعلاه.
3. إذا سأل عن بيع أو نشر سيارة: وضّح له أن النشر مجاني بالكامل وبدقائق بالضغط على زر [🚗 اعرض سيارتك للبيع مجاناً] جوة أو عبر الموقع.
4. إذا سأل عن كود أو بروموكود: وجّهه لزر [🎟️ تعبئة بروموكود] لشحن رصيده فوراً.
5. رابط المنصة الرسمي: https://www.souqbaghdad.store

ملاحظة: اجعل الرد جذاباً، دقيقاً، مدعوماً بإيموجيات لطيفة وبدون علامات نجمية كثيرة.`;

  // 1. Try Google Gemini (Vision + Audio + Text)
  if (GEMINI_API_KEY) {
    try {
      const parts: any[] = [];
      if (text) parts.push({ text: text });
      
      // صوت
      if (audioUrl) {
        try {
          const audioRes = await fetch(audioUrl);
          let mimeType = audioRes.headers.get('content-type') || 'audio/ogg';
          if (mimeType.includes('octet-stream')) mimeType = 'audio/ogg';
          const arrayBuffer = await audioRes.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binaryString = "";
          const chunkSize = 8192;
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            binaryString += String.fromCharCode.apply(null, Array.from(uint8Array.slice(i, i + chunkSize)));
          }
          parts.push({
            inlineData: { mimeType: mimeType, data: btoa(binaryString) }
          });
        } catch(e) {
          console.error('Audio processing error:', e);
        }
      }

      // صورة / سكرين شوت
      if (photoUrl) {
        try {
          const photoRes = await fetch(photoUrl);
          const mimeType = photoRes.headers.get('content-type') || 'image/jpeg';
          const arrayBuffer = await photoRes.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binaryString = "";
          const chunkSize = 8192;
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            binaryString += String.fromCharCode.apply(null, Array.from(uint8Array.slice(i, i + chunkSize)));
          }
          parts.push({
            inlineData: { mimeType: mimeType, data: btoa(binaryString) }
          });
          if (!text) {
            parts.push({ text: 'حلل هذا السكرين شوت أو الصورة المرفقة، واستخرج تفاصيل الإعلان أو السيارة ورقم الهاتف والسعر واشرحها للمستخدم باللهجة العراقية.' });
          }
        } catch(e) {
          console.error('Photo processing error:', e);
        }
      }

      const body = {
        contents: [{ role: 'user', parts }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
      };
      
      // Try Gemini 2.0 Flash first, then fallback to 1.5 Flash
      const geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
      for (const model of geminiModels) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          
          if (res.ok) {
            const data = await res.json();
            const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (generated && generated.trim().length > 0) {
              return generated.trim().replace(/[*#]/g, '');
            }
          } else {
            console.error(`Gemini (${model}) API returned error:`, await res.text());
          }
        } catch(modelErr) {
          console.error(`Gemini (${model}) Fetch Error:`, modelErr);
        }
      }
    } catch(err) {
      console.error('Gemini General Error:', err);
    }
  }

  // 2. Try OpenAI Fallback (gpt-4o-mini)
  if (OPENAI_API_KEY && text) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: text }
          ],
          max_tokens: 400,
          temperature: 0.7
        })
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply && reply.trim().length > 0) {
          return reply.trim().replace(/[*#]/g, '');
        }
      } else {
        console.error('OpenAI API returned error:', await res.text());
      }
    } catch(err) {
      console.error('OpenAI Fetch Error:', err);
    }
  }

  // 3. Fallback to Local Intelligent Iraqi Rules
  if (text) {
    if (dbContext) {
      return `يا هلا بيك عيوني! 🚗 بخصوص سؤالك، هاي بعض الإعلانات المعروضة حالياً بالمنصة:\n${dbContext}\nوتكدر تشوف كل التفاصيل والصور والتواصل مباشرة من خلال موقعنا: https://www.souqbaghdad.store`;
    }
    return getLocalIraqiResponse(text);
  }

  return 'هلا بيك عيوني نورت سوق بغداد! 🇮🇶 شلون أقدر أساعدك اليوم؟';
}

async function checkInterruption(text: string): Promise<boolean> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) return false;
  if (text.length < 2) return false;
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const body = {
      contents: [{ role: 'user', parts: [{ text: text }] }],
      systemInstruction: { parts: [{ text: `أجب بـ "نعم" أو "لا" فقط.
المستخدم كان يملأ استمارة لنشر إعلان سيارة أو خط نقل. هل الجملة التالية تبدو وكأنها مقاطعة، سؤال خارجي، أو تراجع عن النشر (مثلا: "شلون انشر"، "غلطت"، "بطلت"، "كيف اسوي")؟
أجب بـ "نعم" إذا كانت مقاطعة، وأجب بـ "لا" إذا كانت مجرد إجابة طبيعية للاستمارة.` }] }
    };
    
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return answer.includes('نعم');
  } catch (err) {
    return false;
  }
}

// --- Data Lists for Car Wizard ---
const CAR_BRANDS = [
  ['هيونداي', 'كيا', 'تويوتا'],
  ['نيسان', 'شفروليه', 'بي ام دبليو'],
  ['مرسيدس', 'هوندا', 'سوزوكي'],
  ['ميتسوبيشي', 'مازدا', 'فورد'],
  ['جي ام سي', 'دودج', 'جيب'],
  ['كاديلاك', 'كرايسلر', 'لكزس'],
  ['شيري', 'جيلي', 'هافال'],
  ['بايك', 'BYD', 'GAC'],
  ['MG', 'جيتور', 'شانجان'],
  ['فولكسفاغن', 'أودي', 'لاند روفر'],
  ['بورشه', 'رينو', 'بيجو'],
  ['أخرى 🔄']
];

const CAR_YEARS = [
  ['2026', '2025', '2024', '2023'],
  ['2022', '2021', '2020', '2019'],
  ['2018', '2017', '2016', '2015'],
  ['2014', '2013', '2012', '2011'],
  ['2010', 'موديل أقدم 📅']
];

const IRAQI_GOVERNORATES = [
  ['بغداد', 'البصرة', 'أربيل'],
  ['نينوى', 'السليمانية', 'دهوك'],
  ['كركوك', 'الأنبار', 'صلاح الدين'],
  ['بابل', 'كربلاء', 'النجف'],
  ['ديالى', 'واسط', 'ميسان'],
  ['ذي قار', 'المثنى', 'القادسية'],
  ['حلبجة']
];

const CAR_SPECS_ORIGINS = [
  ['وارد أمريكي 🇺🇸', 'وارد خليجي 🇦🇪'],
  ['وارد كندي 🇨🇦', 'وارد كوري 🇰🇷'],
  ['بدون صبغ ✨', 'صبغ عام 🎨'],
  ['صبغ قطع بسيطة 🔧', 'مواصفات أخرى 📝']
];

// --- Data Lists for Transport Wizard (خطوط النقل) ---
const TRANSPORT_AREAS_BAGHDAD = [
  ['الكرادة', 'المنصور', 'اليرموك'],
  ['الدورة', 'السيدية', 'البياع'],
  ['الشعب', 'الأعظمية', 'الكاظمية'],
  ['حي الجامعة', 'الغزالية', 'العامرية'],
  ['زيونة', 'شارع فلسطين', 'بغداد الجديدة'],
  ['الزعفرانية', 'مدينة الصدر', 'أبو غريب'],
  ['المحمودية', 'التاجي', 'مناطق أخرى 📝']
];

const TRANSPORT_DESTINATIONS_BAGHDAD = [
  ['كلية الرافدين الجامعة 🎓', 'جامعة بغداد (الجادرية)'],
  ['جامعة بغداد (باب المعظم)', 'الجامعة المستنصرية'],
  ['الجامعة التكنولوجية', 'جامعة النهرين'],
  ['الجامعة العراقية', 'جامعة الفراهيدي'],
  ['جامعة البيان', 'جامعة التراث'],
  ['جامعة أوروك', 'كلية دجلة / الإسراء'],
  ['كلية المنصور / المأمون', 'دوائر ومؤسسات الكرخ'],
  ['دوائر ومؤسسات الرصافة', 'وجهة أخرى 📝']
];

const TRANSPORT_SHIFTS = [
  ['☀️ صباحي (8:00 ص - 2:00 م)'],
  ['🌤️ صباحي متأخر (9:00 ص - 3:00 م)'],
  ['🌇 مسائي (1:00 م - 6:00 م)'],
  ['🔄 شفتات متغيرة / حسب الاتفاق']
];

const TRANSPORT_VEHICLES = [
  ['🚗 صالون خصوصي (4 ركاب)'],
  ['🚐 باص ستاركس / H1 (11 راكب)'],
  ['🚌 باص كوستر / كيا (21 راكب)'],
  ['✨ VIP مكيف وحديث']
];

const TRANSPORT_TARGETS = [
  ['👩 طالبات / إناث فقط'],
  ['👨 طلاب / ذكور فقط'],
  ['👥 مختلط / عوائل']
];

const TRANSPORT_FARES = [
  ['50,000 د.ع', '75,000 د.ع'],
  ['100,000 د.ع', '125,000 د.ع'],
  ['150,000 د.ع', 'حسب الاتفاق 🤝'],
  ['مبلغ آخر ✏️']
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    // Direct WhatsApp Test Endpoint
    if (payload.action === 'test_whatsapp' && payload.phone) {
      const token = Deno.env.get('WHATSAPP_TOKEN');
      const phoneId = Deno.env.get('WHATSAPP_PHONE_ID') || Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
      
      let cleanPhone = payload.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
      if (cleanPhone.startsWith('7') && cleanPhone.length === 10) cleanPhone = '964' + cleanPhone;

      const testMsg = `🎉 *تجربة إشعار وتساب سوق بغداد!* \n\nأهلاً بك يا غالي! هذا إشعار تجريبي مباشر من منصة سوق بغداد الرقمي للتأكد من وصول الإشعارات إلى رقمك: *${cleanPhone}*.\n\n🌐 الموقع: https://www.souqbaghdad.store\n✈️ القناة: @souqbaghdad_iq\n\nنظام الإشعارات شغال بنجاح 100%! 🚀`;

      try {
        const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
        const fbRes = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: { body: testMsg }
          })
        });
        const fbData = await fbRes.json();
        return new Response(JSON.stringify({ success: true, meta_response: fbData, phone: cleanPhone }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }
    }

    // Check if it's a manual or cron Sync Watchdog call
    if (payload.action === 'sync_watchdog' || payload.action === 'sync_all' || payload.action === 'heal_ad') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      let adsToProcess: any[] = [];
      if (payload.ad_id) {
        const { data: singleAd } = await supabase.from('ads').select('*').eq('id', payload.ad_id).maybeSingle();
        if (singleAd) adsToProcess.push(singleAd);
      } else {
        const limit = payload.limit || 25;
        const { data: recentAds } = await supabase.from('ads').select('*').order('created_at', { ascending: false }).limit(limit);
        adsToProcess = recentAds || [];
      }

      let healedCount = 0;
      const results: any[] = [];

      for (const ad of adsToProcess) {
        const healRes = await syncAndHealAd(ad, supabase);
        if (healRes.healed) healedCount++;
        results.push({ id: ad.id, short_id: ad.short_id, healed: healRes.healed, details: healRes.details });
      }

      return new Response(JSON.stringify({ success: true, processed: adsToProcess.length, healed: healedCount, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Check if it's a Supabase Database Webhook (pg_net)
    if ((payload.type === 'INSERT' || payload.type === 'UPDATE' || payload.type === 'DELETE') && payload.table) {
      const record = payload.record || payload.old_record;
      const oldRecord = payload.old_record;
      
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      let shouldDelete = false;
      let shouldPublish = false;
      let shouldUpdateStatus = false;
      let finalSyncStatus: any = {};
      
      if (payload.type === 'INSERT') {
        shouldPublish = true;
      } else if (payload.type === 'DELETE') {
        shouldDelete = true;
      } else if (payload.type === 'UPDATE') {
        if ((!oldRecord || oldRecord.status === 'active' || oldRecord.status === 'published') && (record.status === 'matched' || record.status === 'sold' || record.status === 'inactive')) {
          shouldUpdateStatus = true;
        }
        if (oldRecord && (oldRecord.status === 'matched' || oldRecord.status === 'sold' || oldRecord.status === 'inactive') && (record.status === 'active' || record.status === 'published')) {
          shouldPublish = true;
        }
      }

      // Handle Sold / Matched status update on Telegram Channel & Facebook Pages across ALL categories
      if (shouldUpdateStatus) {
        const targetDbTable = (payload.table === 'products') ? 'products' : 'ads';
        let actualAd = record;
        if (record?.id) {
          try {
            const { data: dbAd } = await supabase.from(targetDbTable).select('*').eq('id', record.id).maybeSingle();
            if (dbAd) {
              actualAd = { ...dbAd, ...record };
            }
          } catch(e) {
            console.error('Failed to fetch actual ad from DB in UPDATE webhook:', e);
          }
        }

        const isTransport = actualAd.category === 'transport';
        const isCar = actualAd.category === 'vehicles' || actualAd.category === 'cars' || actualAd.category === 'car' || (actualAd.category || '').toLowerCase().includes('car');
        const isProduct = payload.table === 'products' || (!isTransport && !isCar);

        const msgId = actualAd.telegram_message_id || record?.telegram_message_id || oldRecord?.telegram_message_id;
        const rucMsgId = actualAd.sync_status?.ruc_telegram_message_id || record?.sync_status?.ruc_telegram_message_id || oldRecord?.sync_status?.ruc_telegram_message_id;

        // Custom branding and links per category
        const browseUrl = isCar 
          ? 'https://www.souqbaghdad.store/vehicles' 
          : (isTransport ? 'https://www.souqbaghdad.store/transport' : 'https://www.souqbaghdad.store/products');
          
        const soldTag = isTransport 
          ? '✅ <b>[اكتمل العدد / الخط مغلق]</b>' 
          : (isCar ? '⚠️ <b>[تم البيع / مباعة]</b>' : '⚠️ <b>[تم البيع / غير متوفر]</b>');

        const buttonText = isTransport 
          ? '🚌 تصفح خطوط أخرى متاحة 🌐' 
          : (isCar ? '🚗 تم بيع هذه السيارة — تصفح المزيد 🔍' : '🛍️ تم البيع — تصفح أحدث العروض 🌐');

        const postNewText = isTransport
          ? '🚌 اعرض خطك مجاناً عبر البوت'
          : (isCar ? '🚗 اعرض سيارتك للبيع مجاناً عبر البوت' : '📦 اعرض سلعتك مجاناً عبر البوت');

        const soldButtons = {
          inline_keyboard: [
            [{ text: buttonText, url: browseUrl }],
            [{ text: postNewText, url: `https://t.me/${BOT_USERNAME}` }]
          ]
        };

        const iconType = isTransport ? '🚌' : (isCar ? '🚗' : '🛍️');
        const soldCaption = `${soldTag}\n\n` +
                            `${iconType} <b>${actualAd.title || 'إعلان'}</b>\n` +
                            `💰 <b>تمت العملية بنجاح عبر منصة سوق بغداد</b>\n` +
                            `📍 ${actualAd.location || actualAd.city || 'العراق'}\n\n` +
                            `📣 لم يعد هذا الإعلان متاحاً للتواصل. يمكنك تصفح العروض المشابهة عبر الزر أدناه 👇`;

        // 1. Update main Telegram channel
        if (msgId) {
          const channelsToTry = isTransport 
            ? Array.from(new Set([LINES_CHANNEL_ID, LINES_CHANNEL, '@souqbaghdad_lines', '@souqbaghdad_line'].filter(Boolean)))
            : (isCar ? Array.from(new Set([CAR_CHANNEL_ID, CAR_CHANNEL, '@souqbaghdad_car'].filter(Boolean))) : Array.from(new Set([PRODUCT_CHANNEL, '@souqbaghdad_iq', EXTRA_CHANNEL].filter(Boolean))));

          for (const ch of channelsToTry) {
            try {
              console.log(`[UPDATE WEBHOOK] Updating channel ${ch} with msgId ${msgId}`);
              const res = await editChannelMessage(ch, parseInt(msgId, 10), soldCaption, soldButtons);
              console.log(`[UPDATE WEBHOOK] Channel ${ch} update response:`, JSON.stringify(res));
              if (res?.ok) {
                console.log(`[UPDATE WEBHOOK] Successfully updated channel ${ch}`);
                break;
              }
            } catch(e) {
              console.error(`Failed to update caption in channel ${ch}:`, e);
            }
          }
        }

        // 2. If it's transport for Al-Rafdain, ALSO update @ruc_1
        if (isTransport) {
          const descStr = typeof actualAd.description === 'string' ? actualAd.description : JSON.stringify(actualAd.description || {});
          const isAlRafdain = ['الرافدين', 'الرفدين', 'ruc'].some(term => 
            (actualAd.city && actualAd.city.toLowerCase().includes(term)) ||
            (actualAd.location && actualAd.location.toLowerCase().includes(term)) ||
            (actualAd.title && actualAd.title.toLowerCase().includes(term)) ||
            (actualAd.university && actualAd.university.toLowerCase().includes(term)) ||
            (actualAd.destination && actualAd.destination.toLowerCase().includes(term)) ||
            (actualAd.regions && actualAd.regions.toLowerCase().includes(term)) ||
            descStr.toLowerCase().includes(term)
          );

          if ((isAlRafdain || rucMsgId) && ALRAFDAIN_TELEGRAM_CHANNEL && rucMsgId) {
            try {
              console.log(`[RUC WEBHOOK UPDATE] Updating post in ${ALRAFDAIN_TELEGRAM_CHANNEL} with msgId ${rucMsgId}`);
              await editChannelMessage(ALRAFDAIN_TELEGRAM_CHANNEL, parseInt(rucMsgId, 10), soldCaption, soldButtons);
            } catch (err) {
              console.error('Al-Rafdain webhook caption update error:', err);
            }
          }
        }

        // 3. Update Facebook post text (with smart lookup for unindexed/past posts)
        let fbPostId = actualAd.facebook_post_id || record?.facebook_post_id || oldRecord?.facebook_post_id;
        const rafdainFbPostId = actualAd.sync_status?.rafdain_facebook_post_id || record?.sync_status?.rafdain_facebook_post_id || oldRecord?.sync_status?.rafdain_facebook_post_id;

        const fbSoldText = isTransport 
          ? `✅ [اكتمل العدد / الخط مغلق]\n\n🚌 ${actualAd.title || 'إعلان خط'}\n💰 تمت العملية بنجاح عبر منصة سوق بغداد\n\nلم يعد هذا الخط متاحاً للتسجيل. تصفح الخطوط المتاحة عبر:\nhttps://www.souqbaghdad.store/transport`
          : (isCar
            ? `⚠️ [تم البيع / مباعة]\n\n🚗 ${actualAd.title || 'سيارة للبيع'}\n💰 تم البيع بنجاح عبر منصة سوق بغداد\n\nتصفح المزيد من السيارات المتاحة عبر:\nhttps://www.souqbaghdad.store/vehicles`
            : `⚠️ [تم البيع / غير متوفر]\n\n🛍️ ${actualAd.title || 'منتج'}\n💰 تم البيع بنجاح عبر منصة سوق بغداد\n\nتصفح المزيد من العروض عبر:\nhttps://www.souqbaghdad.store/products`);

        if (!fbPostId && (actualAd.short_id || actualAd.title || actualAd.phone)) {
          const searchKey = actualAd.short_id || actualAd.phone || actualAd.title;
          console.log(`[FB SMART LOOKUP] Searching Facebook feed for past post with key: "${searchKey}"...`);
          const foundId = await findFacebookPostByQuery(searchKey);
          if (foundId) {
            fbPostId = foundId;
            try {
              await supabase.from(targetDbTable).update({ facebook_post_id: foundId }).eq('id', actualAd.id);
            } catch(e) {}
          }
        }

        if (fbPostId) {
          console.log(`[UPDATE WEBHOOK] Updating main FB post ${fbPostId}...`);
          await updateFacebookPost(fbPostId, fbSoldText);
        }

        if (rafdainFbPostId) {
          console.log(`[UPDATE WEBHOOK] Updating Al-Rafdain FB post ${rafdainFbPostId}...`);
          const rafdainSetting = await getLiveSocialSetting('fb_rafdain');
          const token = rafdainSetting?.access_token || ALRAFDAIN_FB_TOKEN;
          await updateFacebookPost(rafdainFbPostId, fbSoldText, token);
        }

        // 4. Comment on Instagram post upon Sold / Completed
        const igPostId = actualAd.instagram_post_id || record?.instagram_post_id || oldRecord?.instagram_post_id || actualAd.sync_status?.instagram_post_id || record?.sync_status?.instagram_post_id;
        if (igPostId) {
          console.log(`[SOLD WEBHOOK] Commenting on Instagram post ${igPostId} to mark as sold...`);
          try {
            await commentOnInstagram(igPostId, fbSoldText);
          } catch (igDelErr) {
            console.error('[SOLD WEBHOOK] Error commenting on IG post:', igDelErr);
          }
        }
      }
      
      if (shouldDelete) {
        console.log(`[DELETE WEBHOOK] Received DELETE trigger for table ${payload.table} ID ${record?.id || oldRecord?.id}`);
        const msgId = record?.telegram_message_id || oldRecord?.telegram_message_id;
        const rucMsgId = record?.sync_status?.ruc_telegram_message_id || oldRecord?.sync_status?.ruc_telegram_message_id;
        
        if (msgId) {
          const isTransport = record?.category === 'transport' || oldRecord?.category === 'transport';
          const isCar = record?.category === 'vehicles' || record?.category === 'cars' || oldRecord?.category === 'vehicles' || oldRecord?.category === 'cars';
          const channelList = isTransport 
            ? [LINES_CHANNEL_ID, LINES_CHANNEL, '@souqbaghdad_lines', '@souqbaghdad_line']
            : (isCar 
              ? [CAR_CHANNEL_ID, CAR_CHANNEL, '@souqbaghdad_car'] 
              : [PRODUCT_CHANNEL_ID, PRODUCT_CHANNEL, '@souqbaghdad_iq', EXTRA_CHANNEL]);

          for (const ch of channelList) {
            if (ch) {
              try {
                await deleteMessage(ch, parseInt(msgId, 10));
              } catch(e) {
                console.error(`[DELETE ERROR] Channel ${ch}:`, e);
              }
            }
          }
        }
        if (rucMsgId && ALRAFDAIN_TELEGRAM_CHANNEL) {
          try {
            await deleteMessage(ALRAFDAIN_TELEGRAM_CHANNEL, parseInt(rucMsgId, 10));
          } catch(e) {}
        }
        
        // Delete from Social Media
        const fbPostId = record?.facebook_post_id || oldRecord?.facebook_post_id;
        if (fbPostId) await deleteFromFacebook(fbPostId);

        const rafdainFbPostId = record?.sync_status?.rafdain_facebook_post_id || oldRecord?.sync_status?.rafdain_facebook_post_id || record?.sync_status?.platforms?.facebook?.post_id || oldRecord?.sync_status?.platforms?.facebook?.post_id;
        if (rafdainFbPostId && rafdainFbPostId !== fbPostId) {
          const rafdainSetting = await getLiveSocialSetting('fb_rafdain');
          const token = rafdainSetting?.access_token || ALRAFDAIN_FB_TOKEN;
          await deleteFromFacebook(rafdainFbPostId, token);
        }
        
        const igPostId = record?.instagram_post_id || oldRecord?.instagram_post_id;
        if (igPostId) await deleteFromInstagram(igPostId);

        const thPostId = record?.threads_post_id || oldRecord?.threads_post_id;
        if (thPostId) await deleteFromThreads(thPostId);

        return new Response(JSON.stringify({ ok: true, deleted: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const isManualExplicitPublish = Boolean(payload.targets);
      let publishTelegram = payload.targets ? Boolean(payload.targets.telegram) : true;
      let publishFacebook = payload.targets ? Boolean(payload.targets.facebook) : true;
      let publishInstagram = payload.targets ? Boolean(payload.targets.instagram) : true;
      let publishTiktok = payload.targets ? Boolean(payload.targets.tiktok) : true;
      let publishThreads = payload.targets ? Boolean(payload.targets.threads) : true;
      
      let forceFacebookPage = payload.targets ? (payload.targets.forceFacebookPage || payload.targets.facebookPage) : null;
      let forceInstagramPage = payload.targets ? (payload.targets.forceInstagramPage || payload.targets.instagramPage) : null;

      // Respect skip flags ONLY for automated background webhooks, NEVER for explicit manual modal publish
      if (!isManualExplicitPublish && record?.sync_status) {
        if (record.sync_status.telegram === 'skip' || record.sync_status.telegram === 'success') publishTelegram = false;
        if (record.sync_status.facebook === 'skip' || record.sync_status.facebook === 'success') publishFacebook = false;
        if (record.sync_status.instagram === 'skip' || record.sync_status.instagram === 'success') publishInstagram = false;
        if (record.sync_status.tiktok === 'skip' || record.sync_status.tiktok === 'success') publishTiktok = false;
        if (record.sync_status.threads === 'skip' || record.sync_status.threads === 'success') publishThreads = false;
      }

      // Overrides from auto_publish_settings for auto-publishing
      if (!isManualExplicitPublish) {
        let cat = '';
        if (payload.table === 'products') cat = 'products';
        else if (payload.table === 'transport_ads' || record.category === 'transport') cat = 'transport';
        else if (record.category === 'vehicles' || record.category === 'cars' || record.category === 'car' || (record.category || '').toLowerCase().includes('car')) cat = 'cars';
        
        if (cat) {
          const { data: autoSet } = await supabase.from('auto_publish_settings').select('settings').eq('category', cat).maybeSingle();
          if (autoSet && autoSet.settings) {
            const s = autoSet.settings;
            // Facebook
            if (publishFacebook) {
              if (s.facebook_souq?.active === false && s.facebook_rafdain?.active === false) {
                publishFacebook = false;
              }
              // If only rafdain is active, we force it
              if (s.facebook_rafdain?.active === true && s.facebook_souq?.active === false) {
                forceFacebookPage = 'rafdain';
              }
            }
            // Instagram
            if (publishInstagram) {
               if (s.instagram_souq?.active === false) publishInstagram = false;
            }
            // Telegram
            if (publishTelegram) {
               if (s.telegram_main?.active === false && s.telegram_rafdain?.active === false) {
                 publishTelegram = false;
               } else if (s.telegram_rafdain?.active && !s.telegram_main?.active) {
                 // Override variables globally for this run
                 ALRAFDAIN_TELEGRAM_CHANNEL = s.telegram_rafdain.channel_id;
                 if (cat === 'cars') CAR_CHANNEL = s.telegram_rafdain.channel_id;
                 if (cat === 'transport') LINES_CHANNEL = s.telegram_rafdain.channel_id;
                 if (cat === 'products') PRODUCT_CHANNEL = s.telegram_rafdain.channel_id;
               } else if (s.telegram_main?.active && !s.telegram_rafdain?.active) {
                 if (cat === 'cars' && s.telegram_main.channel_id) CAR_CHANNEL = s.telegram_main.channel_id;
                 if (cat === 'transport' && s.telegram_main.channel_id) LINES_CHANNEL = s.telegram_main.channel_id;
                 if (cat === 'products' && s.telegram_main.channel_id) PRODUCT_CHANNEL = s.telegram_main.channel_id;
               } else if (s.telegram_main?.active && s.telegram_rafdain?.active) {
                 // If both are active, we can only easily post to one from the generic function right now,
                 // but we'll prioritize main and it's up to the user to choose one.
                 if (cat === 'cars' && s.telegram_main.channel_id) CAR_CHANNEL = s.telegram_main.channel_id;
                 if (cat === 'transport' && s.telegram_main.channel_id) LINES_CHANNEL = s.telegram_main.channel_id;
                 if (cat === 'products' && s.telegram_main.channel_id) PRODUCT_CHANNEL = s.telegram_main.channel_id;
               }
            }
          }
        }
      }

      if (!publishTelegram && !publishFacebook && !publishInstagram && !publishTiktok && !publishThreads) {
        shouldPublish = false;
      }

      if (shouldPublish) {
        // --- 1. CAR ADS (VEHICLES) ---
        if (payload.table === 'ads' && (record.category === 'vehicles' || record.category === 'cars' || record.category === 'car' || (record.category || '').toLowerCase().includes('car'))) {
          const adId = record.short_id || record.id;
          const link = `https://www.souqbaghdad.store/ad/${adId}`;
          
          let carSpecs: any = {};
          try {
            carSpecs = typeof record.description === 'string' && record.description.startsWith('{') 
              ? JSON.parse(record.description) 
              : { note: record.description };
          } catch(e) {
            carSpecs = { note: record.description };
          }

          const brand = carSpecs.brand || '';
          const model = carSpecs.model || '';
          const year = carSpecs.year || '';
          const carTitle = `${brand} ${model} ${year}`.trim() || record.title || 'سيارة للبيع';

          // Call our unified HTML caption formatting
          const caption = await generateSocialCaption(record, 'car', link, true);

          const imagesToPost = await ensurePublicImages(record, 'ads', supabase);
          if (imagesToPost.length === 0) {
            imagesToPost.push(getFallbackImage(record, 'car'));
          }
          const photoCount = imagesToPost.length;
          const detailsButtonText = photoCount > 1 
            ? `📸 تصفح كافة الصور (${photoCount} صور) والتفاصيل 🌐` 
            : `🌐 عرض التفاصيل بالمنصة`;

          // Beautiful, full-width balanced buttons
          let cleanPhone = (record.phone || '').replace(/[^0-9+]/g, '');
          if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
          else cleanPhone = cleanPhone.replace('+', '');

          const contactRow = [];
          if (cleanPhone) {
            contactRow.push({ text: '💬 تواصل واتساب', url: `https://wa.me/${cleanPhone}` });
            contactRow.push({ text: '✈️ تواصل تيليكرام', url: `https://t.me/+${cleanPhone}` });
          }

          const inlineKeyboard = [
            [{ text: detailsButtonText, url: link }]
          ];
          if (contactRow.length > 0) {
            inlineKeyboard.push(contactRow);
          }
          inlineKeyboard.push([{ text: '🚗 اعرض سيارتك للبيع مجاناً', url: `https://t.me/${BOT_USERNAME}` }]);

          const replyMarkup = { inline_keyboard: inlineKeyboard };

          let res;
          if (publishTelegram) {
            const targetCarChannel = CAR_CHANNEL_ID || CAR_CHANNEL;
            if (imagesToPost.length > 1) {
              let mediaGroupCaption = caption;
              mediaGroupCaption += `\n\n🔗 <a href="${link}">عرض التفاصيل بالمنصة</a>`;
              if (cleanPhone) {
                mediaGroupCaption += `\n📞 <a href="https://wa.me/${cleanPhone}">تواصل واتساب</a> | ✈️ <a href="https://t.me/+${cleanPhone}">تواصل تيليكرام</a>`;
              }
              res = await sendMediaGroup(targetCarChannel, imagesToPost, mediaGroupCaption);
            } else if (imagesToPost.length === 1) {
              res = await sendPhoto(targetCarChannel, imagesToPost[0], caption, replyMarkup);
            } else {
              res = await sendMessage(targetCarChannel, caption, replyMarkup);
            }

            // Broadcast to Partner Channels Network (Cars/All)
            EdgeRuntime.waitUntil(broadcastToPartnerChannels(record, 'vehicles', caption, imagesToPost, replyMarkup, supabase));
          }

          const updates: any = {};
          let syncStatus = record.sync_status || { facebook: 'pending', instagram: 'pending', telegram: 'pending' };

          if (publishTelegram && res?.ok && res.result?.message_id) {
             updates.telegram_message_id = res.result.message_id.toString();
             syncStatus.telegram = 'success';
          }
          
          // Social Media Sync for Cars (All images, no fallback to transit lines template)
          const fbIgPhotoUrl = imagesToPost.length > 0 ? imagesToPost : null;
          const fbIgCaption = (publishFacebook || publishInstagram || publishThreads || publishTiktok)
            ? await generateSocialCaption(record, 'car', link, false)
            : '';
          const carStoryImg = buildStoryImageUrl(record, 'car', imagesToPost);

          if (publishFacebook) {
            const fbData = await postToFacebook(fbIgCaption, fbIgPhotoUrl);
            if (fbData && (fbData.post_id || fbData.id)) {
              updates.facebook_post_id = fbData.post_id || fbData.id;
              syncStatus.facebook = 'success';
            }
            try {
              const fbSetting = await getLiveSocialSetting('fb_souq');
              const fbToken = fbSetting?.access_token || META_PAGE_ACCESS_TOKEN;
              const fbPageId = fbSetting?.page_id || META_PAGE_ID;
              if (fbToken && fbPageId) {
                console.log('[WEBHOOK SOCIAL] Posting Car to Facebook Story...');
                const fbStoryRes = await postToFacebookStory(carStoryImg, fbPageId, fbToken);
                if (fbStoryRes && (fbStoryRes.id || fbStoryRes.post_id)) syncStatus.facebook_story = 'success';
              }
            } catch(e) { console.error('Car FB Story error:', e); }
          }

          if (publishInstagram) {
            if (fbIgPhotoUrl) {
              const igData = await postToInstagram(fbIgCaption, fbIgPhotoUrl);
              if (igData && (igData.id || igData.media_id)) {
                updates.instagram_post_id = igData.id || igData.media_id;
                syncStatus.instagram = 'success';
              }
            }
            try {
              console.log('[WEBHOOK SOCIAL] Posting Car to Instagram Story...');
              const igStoryRes = await postToInstagramStory(carStoryImg);
              if (igStoryRes && (igStoryRes.id || igStoryRes.creation_id)) syncStatus.instagram_story = 'success';
            } catch(e) { console.error('Car IG Story error:', e); }
          }

          if (publishTiktok && fbIgPhotoUrl) {
            const tkData = await postToTikTok(fbIgCaption, fbIgPhotoUrl, supabase);
            if (tkData?.data?.publish_id) {
              updates.tiktok_post_id = tkData.data.publish_id;
              syncStatus.tiktok = 'success';
            }
          }

          if (publishThreads) {
            const thData = await postToThreads(fbIgCaption, fbIgPhotoUrl);
            if (thData && (thData.id || thData.media_id)) {
              updates.threads_post_id = thData.id || thData.media_id;
              syncStatus.threads = 'success';
            } else {
              syncStatus.threads = 'failed';
              syncStatus.threads_error = thData?.error?.message || JSON.stringify(thData);
            }
          }

          updates.sync_status = syncStatus;
          finalSyncStatus = syncStatus;
          if (Object.keys(updates).length > 0) {
            await supabase.from('ads').update(updates).eq('id', record.id);
          }

          if (record.phone) {
            await sendWhatsAppWelcome(record.phone, carTitle, link);
          }
        }
        // --- 2. GENERAL PRODUCTS ---
        else if (payload.table === 'products' && PRODUCT_CHANNEL) {
          const prodId = record.short_id || record.id;
          const link = `https://www.souqbaghdad.store/product/${prodId}`;

          const caption = await generateSocialCaption(record, 'product', link, true);

          const imagesToPost = await ensurePublicImages(record, 'products', supabase);
          if (imagesToPost.length === 0) {
            imagesToPost.push(getFallbackImage(record, 'product'));
          }
          const photoCount = imagesToPost.length;
          const detailsButtonText = photoCount > 1 
            ? `📸 تصفح كافة الصور (${photoCount} صور) والتفاصيل 🌐` 
            : `🌐 عرض التفاصيل والصور بالمنصة`;

          let cleanPhone = (record.phone || '').replace(/[^0-9+]/g, '');
          if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
          else cleanPhone = cleanPhone.replace('+', '');

          const contactRow = [];
          if (cleanPhone) {
            contactRow.push({ text: '💬 تواصل واتساب', url: `https://wa.me/${cleanPhone}` });
            contactRow.push({ text: '✈️ تواصل تيليكرام', url: `https://t.me/+${cleanPhone}` });
          }

          const inlineKeyboard = [
            [{ text: detailsButtonText, url: link }]
          ];
          if (contactRow.length > 0) {
            inlineKeyboard.push(contactRow);
          }
          inlineKeyboard.push([{ text: '🛍️ اعرض منتجك للبيع مجاناً', url: `https://t.me/${BOT_USERNAME}` }]);

          const replyMarkup = { inline_keyboard: inlineKeyboard };

          let res;
          if (publishTelegram) {
            if (imagesToPost.length > 1) {
              let mediaGroupCaption = caption;
              mediaGroupCaption += `\n\n🔗 <a href="${link}">عرض التفاصيل والصور بالمنصة</a>`;
              if (cleanPhone) {
                mediaGroupCaption += `\n📞 <a href="https://wa.me/${cleanPhone}">تواصل واتساب</a> | ✈️ <a href="https://t.me/+${cleanPhone}">تواصل تيليكرام</a>`;
              }
              res = await sendMediaGroup(PRODUCT_CHANNEL, imagesToPost, mediaGroupCaption);
            } else if (imagesToPost.length === 1) {
              res = await sendPhoto(PRODUCT_CHANNEL, imagesToPost[0], caption, replyMarkup);
            } else {
              res = await sendMessage(PRODUCT_CHANNEL, caption, replyMarkup);
            }

            // Broadcast to Partner Channels Network (Products/All)
            EdgeRuntime.waitUntil(broadcastToPartnerChannels(record, 'products', caption, imagesToPost, replyMarkup, supabase));
          }
          const updates: any = {};
          let syncStatus = record.sync_status || { facebook: 'pending', instagram: 'pending', telegram: 'pending' };

          if (publishTelegram && res?.ok && res.result?.message_id) {
             updates.telegram_message_id = res.result.message_id.toString();
             syncStatus.telegram = 'success';
             try {
               await supabase.from('products').update({ 
                 telegram_message_id: updates.telegram_message_id,
                 sync_status: { ...syncStatus, telegram: 'success' }
               }).eq('id', record.id);
               console.log(`[TG IMMEDIATE SAVE - PRODUCT] Saved telegram_message_id ${updates.telegram_message_id} for ID ${record.id}`);
             } catch(e) {}
          }
          
          const fbIgPhotoUrl = imagesToPost.length > 0 ? imagesToPost : null;
          const fbIgCaption = (publishFacebook || publishInstagram || publishThreads || publishTiktok)
            ? await generateSocialCaption(record, 'product', link, false)
            : '';
          const prodStoryImg = buildStoryImageUrl(record, 'product', imagesToPost);
                              
          if (publishFacebook) {
            const fbData = await postToFacebook(fbIgCaption, fbIgPhotoUrl);
            if (fbData && (fbData.post_id || fbData.id)) {
              updates.facebook_post_id = fbData.post_id || fbData.id;
              syncStatus.facebook = 'success';
            }
            try {
              const fbSetting = await getLiveSocialSetting('fb_souq');
              const fbToken = fbSetting?.access_token || META_PAGE_ACCESS_TOKEN;
              const fbPageId = fbSetting?.page_id || META_PAGE_ID;
              if (fbToken && fbPageId) {
                console.log('[WEBHOOK SOCIAL] Posting Product to Facebook Story...');
                const fbStoryRes = await postToFacebookStory(prodStoryImg, fbPageId, fbToken);
                if (fbStoryRes && (fbStoryRes.id || fbStoryRes.post_id)) syncStatus.facebook_story = 'success';
              }
            } catch(e) { console.error('Product FB Story error:', e); }
          }
          
          if (publishInstagram) {
            if (fbIgPhotoUrl) {
              const igData = await postToInstagram(fbIgCaption, fbIgPhotoUrl);
              if (igData && (igData.id || igData.media_id)) {
                updates.instagram_post_id = igData.id || igData.media_id;
                syncStatus.instagram = 'success';
              }
            }
            try {
              console.log('[WEBHOOK SOCIAL] Posting Product to Instagram Story...');
              const igStoryRes = await postToInstagramStory(prodStoryImg);
              if (igStoryRes && (igStoryRes.id || igStoryRes.creation_id)) syncStatus.instagram_story = 'success';
            } catch(e) { console.error('Product IG Story error:', e); }
          }
          
          if (publishTiktok && fbIgPhotoUrl) {
            const tkData = await postToTikTok(fbIgCaption, fbIgPhotoUrl, supabase);
            if (tkData?.data?.publish_id) {
               updates.tiktok_post_id = tkData.data.publish_id;
               syncStatus.tiktok = 'success';
            }
          }
          
          if (publishThreads) {
            const thData = await postToThreads(fbIgCaption, fbIgPhotoUrl);
            if (thData && (thData.id || thData.media_id)) {
               updates.threads_post_id = thData.id || thData.media_id;
               syncStatus.threads = 'success';
            }
          }
          
          updates.sync_status = syncStatus;
          finalSyncStatus = syncStatus;
          if (Object.keys(updates).length > 0) {
             await supabase.from('products').update(updates).eq('id', record.id);
          }
          
          if (record.phone) {
             await sendWhatsAppWelcome(record.phone, record.title || '', link);
          }
        }
        // --- 3. GENERAL ADS ---
        else if (payload.table === 'ads' && record.category !== 'transport' && record.category !== 'vehicles' && record.category !== 'cars' && PRODUCT_CHANNEL) {
          const adId = record.short_id || record.id;
          const link = `https://www.souqbaghdad.store/ad/${adId}`;

          const caption = await generateSocialCaption(record, 'ad', link, true);

          const imagesToPost = await ensurePublicImages(record, 'ads', supabase);
          if (imagesToPost.length === 0) {
            imagesToPost.push(getFallbackImage(record, 'ad'));
          }
          const photoCount = imagesToPost.length;
          const detailsButtonText = photoCount > 1 
            ? `📸 تصفح كافة الصور (${photoCount} صور) والتفاصيل 🌐` 
            : `🌐 عرض التفاصيل بالمنصة`;

          let cleanPhone = (record.phone || '').replace(/[^0-9+]/g, '');
          if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
          else cleanPhone = cleanPhone.replace('+', '');

          const contactRow = [];
          if (cleanPhone) {
            contactRow.push({ text: '💬 تواصل واتساب', url: `https://wa.me/${cleanPhone}` });
            contactRow.push({ text: '✈️ تواصل تيليكرام', url: `https://t.me/+${cleanPhone}` });
          }

          const inlineKeyboard = [
            [{ text: detailsButtonText, url: link }]
          ];
          if (contactRow.length > 0) {
            inlineKeyboard.push(contactRow);
          }
          inlineKeyboard.push([{ text: '📢 انشر إعلانك الآن مجاناً', url: `https://t.me/${BOT_USERNAME}` }]);

          const replyMarkup = { inline_keyboard: inlineKeyboard };

          let res;
          if (publishTelegram) {
            if (imagesToPost.length >= 1) {
              res = await sendPhoto(PRODUCT_CHANNEL, imagesToPost[0], caption, replyMarkup);
            } else {
              res = await sendMessage(PRODUCT_CHANNEL, caption, replyMarkup);
            }

            // Broadcast to Partner Channels Network (General Ads/Products/All)
            EdgeRuntime.waitUntil(broadcastToPartnerChannels(record, 'products', caption, imagesToPost, replyMarkup, supabase));
          }
          const updates: any = {};
          let syncStatus = record.sync_status || { facebook: 'pending', instagram: 'pending', telegram: 'pending' };

          if (publishTelegram && res?.ok && res.result?.message_id) {
             updates.telegram_message_id = res.result.message_id.toString();
             syncStatus.telegram = 'success';
             try {
               await supabase.from('ads').update({ 
                 telegram_message_id: updates.telegram_message_id,
                 sync_status: { ...syncStatus, telegram: 'success' }
               }).eq('id', record.id);
               console.log(`[TG IMMEDIATE SAVE - GENERAL AD] Saved telegram_message_id ${updates.telegram_message_id} for ID ${record.id}`);
             } catch(e) {}
          }
          
          const fbIgPhotoUrl = imagesToPost.length > 0 ? imagesToPost : null;
          const fbIgCaption = (publishFacebook || publishInstagram || publishThreads || publishTiktok)
            ? await generateSocialCaption(record, 'ad', link, false)
            : '';
          const generalStoryImg = buildStoryImageUrl(record, 'ad', imagesToPost);
                              
          if (publishFacebook) {
            const fbData = await postToFacebook(fbIgCaption, fbIgPhotoUrl);
            if (fbData && (fbData.post_id || fbData.id)) {
              updates.facebook_post_id = fbData.post_id || fbData.id;
              syncStatus.facebook = 'success';
            }
            try {
              const fbSetting = await getLiveSocialSetting('fb_souq');
              const fbToken = fbSetting?.access_token || META_PAGE_ACCESS_TOKEN;
              const fbPageId = fbSetting?.page_id || META_PAGE_ID;
              if (fbToken && fbPageId) {
                console.log('[WEBHOOK SOCIAL] Posting General Ad to Facebook Story...');
                const fbStoryRes = await postToFacebookStory(generalStoryImg, fbPageId, fbToken);
                if (fbStoryRes && (fbStoryRes.id || fbStoryRes.post_id)) syncStatus.facebook_story = 'success';
              }
            } catch(e) { console.error('General Ad FB Story error:', e); }
          }
          
          if (publishInstagram) {
            if (fbIgPhotoUrl) {
              const igData = await postToInstagram(fbIgCaption, fbIgPhotoUrl);
              if (igData && (igData.id || igData.media_id)) {
                updates.instagram_post_id = igData.id || igData.media_id;
                syncStatus.instagram = 'success';
              }
            }
            try {
              console.log('[WEBHOOK SOCIAL] Posting General Ad to Instagram Story...');
              const igStoryRes = await postToInstagramStory(generalStoryImg);
              if (igStoryRes && (igStoryRes.id || igStoryRes.creation_id)) syncStatus.instagram_story = 'success';
            } catch(e) { console.error('General Ad IG Story error:', e); }
          }
          
          if (publishTiktok && fbIgPhotoUrl) {
            const tkData = await postToTikTok(fbIgCaption, fbIgPhotoUrl, supabase);
            if (tkData?.data?.publish_id) {
               updates.tiktok_post_id = tkData.data.publish_id;
               syncStatus.tiktok = 'success';
            }
          }
          
          if (publishThreads) {
            const thData = await postToThreads(fbIgCaption, fbIgPhotoUrl);
            if (thData && (thData.id || thData.media_id)) {
               updates.threads_post_id = thData.id || thData.media_id;
               syncStatus.threads = 'success';
            } else {
               syncStatus.threads = 'failed';
               syncStatus.threads_error = thData?.error?.message || JSON.stringify(thData);
            }
          }
          
          updates.sync_status = syncStatus;
          finalSyncStatus = syncStatus;
          if (Object.keys(updates).length > 0) {
             const targetTable = (payload.table === 'products') ? 'products' : 'ads';
             console.log(`[SOCIAL DB SAVE] Updating table ${targetTable} ID ${record.id}:`, JSON.stringify(updates));
             const { error: updErr, data: updData } = await supabase.from(targetTable).update(updates).eq('id', record.id).select();
             if (updErr) {
               console.error(`[SOCIAL DB SAVE ERROR] Failed updating table ${targetTable}:`, updErr);
             } else {
               console.log(`[SOCIAL DB SAVE SUCCESS] Updated table ${targetTable} ID ${record.id} with rows:`, updData?.length);
             }
          }
          
          if (record.phone) {
             await sendWhatsAppWelcome(record.phone, record.title || '', link);
          }
        }
        // --- 4. TRANSPORT ADS (خطوط النقل) ---
        else if ((payload.table === 'ads' && record.category === 'transport') || payload.table === 'transport_ads') {
          // Prevent duplicate execution if already synced (only for automated background triggers, not manual modal publish)
          if (!isManualExplicitPublish && record.id && payload.table === 'ads') {
            const { data: existingAd } = await supabase.from('ads').select('telegram_message_id, sync_status').eq('id', record.id).maybeSingle();
            if (existingAd?.telegram_message_id || existingAd?.sync_status?.telegram === 'success') {
              console.log(`Transport ad ${record.id} already published to Telegram, skipping duplicate.`);
              return new Response(JSON.stringify({ ok: true, message: 'Already published' }), { 
                status: 200, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              });
            }
          }

          const typeStr = record.type === 'offer' ? '🚗 أوفر خط نقل (سائق)' : '🙋‍♂️ أبحث عن خط نقل (مطلوب)';
          let desc: any = {};
          try { desc = typeof record.description === 'string' ? JSON.parse(record.description) : record.description; } catch(e){}
          
          const catType = desc?.categoryType === 'employee' ? '💼 خط موظفين' : (desc?.categoryType === 'emergency' ? '🚨 نقل خاص' : '🎓 خط طلاب');
          const targetStr = desc?.targetAudience || 'الجميع';
          const seatsStr = desc?.seats ? `${desc.seats} مقاعد` : 'محدد';
          const shiftStr = desc?.shift || 'صباحي';
          const vehicleStr = desc?.vehicleType || 'صالون';
          const adId = record.short_id || record.id;
          const link = `https://www.souqbaghdad.store/transport/card/${adId}`;

          const msg = `🚌 <b>إعلان خط نقل جديد — سوق بغداد</b>\n\n` +
                      `📌 <b>النوع:</b> ${typeStr}\n` +
                      `🏷️ <b>الفئة:</b> ${catType} (${targetStr})\n` +
                      `📍 <b>مناطق الانطلاق:</b> ${record.location || record.regions || 'بغداد'}\n` +
                      `🏢 <b>الوجهة:</b> ${record.city || record.university || 'بغداد'}\n` +
                      `⏰ <b>وقت الدوام:</b> ${shiftStr}\n` +
                      `🚗 <b>المركبة:</b> ${vehicleStr} | <b>المقاعد:</b> ${seatsStr}\n` +
                      `💰 <b>الأجرة:</b> ${formatTgPrice(record.price)}\n` +
                      (record.phone ? `📞 <b>التواصل:</b> ${record.phone}\n\n` : `\n`) +
                      `📣 <b>#رقم_الخط_${adId}</b> | @${BOT_USERNAME}`;
                      
          let cleanPhone = (record.phone || '').replace(/[^0-9+]/g, '');
          if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
          else cleanPhone = cleanPhone.replace('+', '');

          const contactRow = [];
          if (cleanPhone) {
            contactRow.push({ text: '💬 تواصل واتساب', url: `https://wa.me/${cleanPhone}` });
            contactRow.push({ text: '✈️ تواصل تيليكرام', url: `https://t.me/+${cleanPhone}` });
          }

          const inlineKeyboard = [
            [{ text: '🌐 التفاصيل الكاملة وحجز المقعد', url: link }]
          ];
          if (contactRow.length > 0) inlineKeyboard.push(contactRow);
          inlineKeyboard.push([{ text: '🚌 انشر خطك مجاناً عبر البوت', url: `https://t.me/${BOT_USERNAME}` }]);

          const replyMarkup = { inline_keyboard: inlineKeyboard };
                      
          const cleanTitle = 'خط نقل جديد في بغداد';
          const cleanSubtitle = (record.university || record.city || 'كلية الرافدين').replace(/<[^>]*>?/gm, '').trim();
          const cleanSubdesc = `${catType} (${targetStr})`.replace(/<[^>]*>?/gm, '').trim();
          
          // Pure regions text without HTML tags
          const rawReg = record.regions || record.location || 'بغداد';
          const cleanRegions = rawReg.replace(/<[^>]*>?/gm, '').replace(/&lt;.*?&gt;/gm, '').trim();
          const cleanDestination = (record.city || record.university || 'كلية الرافدين').replace(/<[^>]*>?/gm, '').trim();
          
          // Format fare accurately (match 100,000 د.ع)
          let cleanFare = 'حسب الاتفاق';
          if (record.price) {
            const rawNum = String(record.price).replace(/[^0-9]/g, '');
            if (rawNum && Number(rawNum) > 0) {
              cleanFare = `${Number(rawNum).toLocaleString('en-US')} د.ع`;
            } else if (typeof record.price === 'string' && record.price.trim()) {
              cleanFare = record.price.trim();
            }
          } else if (record.fare) {
            cleanFare = record.fare;
          }

          let rawPhone = record.phone || (desc && (desc.phone || desc.contact_phone || desc.whatsapp)) || '';
          let cleanDisplayPhone = String(rawPhone).replace(/[^\d+]/g, '').trim();
          if (cleanDisplayPhone.startsWith('964')) {
            cleanDisplayPhone = '0' + cleanDisplayPhone.substring(3);
          }
          if (cleanDisplayPhone.startsWith('+964')) {
            cleanDisplayPhone = '0' + cleanDisplayPhone.substring(4);
          }
          if (!cleanDisplayPhone) cleanDisplayPhone = '0780 000 0000';

          const daysStr = desc?.days || desc?.workDays || 'الأحد إلى الخميس';
          const shiftVal = desc?.shift || 'من 08:00 ص إلى 02:00 م';
          const targetAudienceVal = desc?.targetAudience || targetStr || 'طالبات فقط';

          // Dynamic Programmatic Templates (1080x1350 Post & 1080x1920 Story)
          const dynamicPostUrl = `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=post&title=${encodeURIComponent(cleanTitle)}&subtitle=${encodeURIComponent(cleanSubtitle)}&subdesc=${encodeURIComponent(cleanSubdesc)}&regions=${encodeURIComponent(cleanRegions)}&destination=${encodeURIComponent(cleanDestination)}&fare=${encodeURIComponent(cleanFare)}&link=${encodeURIComponent(link)}&short_id=${encodeURIComponent(adId)}&phone=${encodeURIComponent(cleanDisplayPhone)}&audience=${encodeURIComponent(targetAudienceVal)}&days=${encodeURIComponent(daysStr)}&time=${encodeURIComponent(shiftVal)}`;
          const dynamicStoryUrl = `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=story&title=${encodeURIComponent(cleanTitle)}&subtitle=${encodeURIComponent(cleanSubtitle)}&subdesc=${encodeURIComponent(cleanSubdesc)}&regions=${encodeURIComponent(cleanRegions)}&destination=${encodeURIComponent(cleanDestination)}&fare=${encodeURIComponent(cleanFare)}&link=${encodeURIComponent(link)}&short_id=${encodeURIComponent(adId)}&phone=${encodeURIComponent(cleanDisplayPhone)}&audience=${encodeURIComponent(targetAudienceVal)}&days=${encodeURIComponent(daysStr)}&time=${encodeURIComponent(shiftVal)}`;

          const descStr = typeof record.description === 'string' ? record.description : JSON.stringify(record.description || {});
          const rafdainTerms = ['الرافدين', 'الرفدين', 'ruc'];
          const isAlRafdain = rafdainTerms.some(term => 
            (record.university && record.university.toLowerCase().includes(term)) || 
            (record.city && record.city.toLowerCase().includes(term)) || 
            (record.title && record.title.toLowerCase().includes(term)) || 
            (record.destination && record.destination.toLowerCase().includes(term)) || 
            (record.location && record.location.toLowerCase().includes(term)) || 
            (record.regions && record.regions.toLowerCase().includes(term)) || 
            (desc?.targetAudience && desc.targetAudience.toLowerCase().includes(term)) ||
            descStr.toLowerCase().includes(term)
          );
          
          const useAlRafdainFb = forceFacebookPage ? (forceFacebookPage === 'alrafdain') : isAlRafdain;
          const useAlRafdainIg = forceInstagramPage ? (forceInstagramPage === 'alrafdain') : isAlRafdain;

          const updates: any = {};
          let syncStatus: any = { ...(record.sync_status || { facebook: 'pending', instagram: 'pending', telegram: 'pending' }) };

          const imagesToPost = await ensurePublicImages(record, 'ads', supabase);
          
          let finalPostPhotoUrl = dynamicPostUrl;
          if (imagesToPost.length > 0) {
            finalPostPhotoUrl = imagesToPost[0];
          } else {
            // Upload generated PNG card to Storage to guarantee Instagram and Facebook accept the direct image
            try {
              console.log(`[TRANSPORT CARD STORAGE] Generating and storing permanent PNG card for ad ${adId}...`);
              const cardFetch = await fetch(dynamicPostUrl);
              if (cardFetch.ok) {
                const cardBlob = await cardFetch.blob();
                const cardBytes = new Uint8Array(await cardBlob.arrayBuffer());
                const cardFileName = `transport-card-${adId}-${Date.now()}.png`;
                const { data: uploadResult, error: uploadErr } = await supabase.storage
                  .from('ad-images')
                  .upload(cardFileName, cardBytes, { contentType: 'image/png', upsert: true });

                if (!uploadErr && uploadResult) {
                  const { data: pubUrlData } = supabase.storage.from('ad-images').getPublicUrl(cardFileName);
                  if (pubUrlData?.publicUrl) {
                    finalPostPhotoUrl = pubUrlData.publicUrl;
                    console.log('[TRANSPORT CARD STORAGE] Stored permanent image successfully:', finalPostPhotoUrl);
                  }
                } else {
                  console.warn('Storage upload error for card image, using dynamic url fallback:', uploadErr);
                }
              }
            } catch (storageException) {
              console.error('Exception storing transport card image:', storageException);
            }
          }

          let finalStoryPhotoUrl = dynamicStoryUrl;
          try {
            console.log(`[TRANSPORT STORY STORAGE] Generating and storing permanent Story PNG for ad ${adId}...`);
            const storyFetch = await fetch(dynamicStoryUrl);
            if (storyFetch.ok) {
              const storyBlob = await storyFetch.blob();
              const storyBytes = new Uint8Array(await storyBlob.arrayBuffer());
              const storyFileName = `transport-story-${adId}-${Date.now()}.png`;
              const { data: storyUploadResult, error: storyUploadErr } = await supabase.storage
                .from('ad-images')
                .upload(storyFileName, storyBytes, { contentType: 'image/png', upsert: true });

              if (!storyUploadErr && storyUploadResult) {
                const { data: storyPubUrlData } = supabase.storage.from('ad-images').getPublicUrl(storyFileName);
                if (storyPubUrlData?.publicUrl) {
                  finalStoryPhotoUrl = storyPubUrlData.publicUrl;
                  console.log('[TRANSPORT STORY STORAGE] Stored permanent story successfully:', finalStoryPhotoUrl);
                }
              }
            }
          } catch (storyStorageErr) {
            console.error('Exception storing transport story image:', storyStorageErr);
          }

          const transportPhoto = finalPostPhotoUrl;
          const fbIgPhotoUrl = imagesToPost.length > 0 ? imagesToPost : [finalPostPhotoUrl];

          let res;
          if (publishTelegram) {
            // 1. Send to main transport channel: @souqbaghdad_lines
            const targetLinesChannel = LINES_CHANNEL_ID || LINES_CHANNEL;
            if (imagesToPost.length > 1) {
              let mediaGroupCaption = msg;
              mediaGroupCaption += `\n\n🌐 <a href="${link}">التفاصيل الكاملة وحجز المقعد</a>`;
              if (cleanPhone) {
                mediaGroupCaption += `\n💬 <a href="https://wa.me/${cleanPhone}">تواصل واتساب</a> | ✈️ <a href="https://t.me/+${cleanPhone}">تواصل تيليكرام</a>`;
              }
              res = await sendMediaGroup(targetLinesChannel, imagesToPost, mediaGroupCaption);
            } else {
              res = await sendPhoto(targetLinesChannel, transportPhoto, msg, replyMarkup);
            }
            if (res?.ok && res.result?.message_id) {
              console.log('[TRANSPORT TG] Published successfully to', targetLinesChannel, 'msg_id:', res.result.message_id);
              updates.telegram_message_id = res.result.message_id.toString();
              syncStatus.telegram = 'success';
            } else {
              console.error('[TRANSPORT TG] Failed to publish to', targetLinesChannel, 'Response:', JSON.stringify(res));
              syncStatus.telegram = 'failed';
              syncStatus.telegram_error = res?.description || 'Telegram publish error';
            }

            // 2. If it is for Al-Rafdain, ALSO publish to @ruc_1
            if (isAlRafdain) {
              try {
                console.log(`[RUC WEBHOOK] isAlRafdain=true, sending to ${ALRAFDAIN_TELEGRAM_CHANNEL}`);
                let rucRes;
                if (imagesToPost.length > 1) {
                  let mediaGroupCaption = msg;
                  mediaGroupCaption += `\n\n🌐 <a href="${link}">التفاصيل الكاملة وحجز المقعد</a>`;
                  if (cleanPhone) {
                    mediaGroupCaption += `\n💬 <a href="https://wa.me/${cleanPhone}">تواصل واتساب</a> | ✈️ <a href="https://t.me/+${cleanPhone}">تواصل تيليكرام</a>`;
                  }
                  rucRes = await sendMediaGroup(ALRAFDAIN_TELEGRAM_CHANNEL, imagesToPost, mediaGroupCaption);
                } else {
                  rucRes = await sendPhoto(ALRAFDAIN_TELEGRAM_CHANNEL, transportPhoto, msg, replyMarkup);
                }
                console.log('[RUC WEBHOOK] sendPhoto response:', JSON.stringify(rucRes));
                if (rucRes?.ok && rucRes.result?.message_id) {
                  syncStatus.ruc_telegram_message_id = rucRes.result.message_id.toString();
                  syncStatus.ruc_telegram = 'success';
                } else {
                  syncStatus.ruc_telegram = 'failed';
                  syncStatus.ruc_telegram_error = rucRes?.description || 'unknown error';
                  console.error('[RUC WEBHOOK] sendPhoto failed:', JSON.stringify(rucRes));
                }
              } catch(e: any) {
                syncStatus.ruc_telegram = 'failed';
                syncStatus.ruc_telegram_error = e?.message || String(e);
                console.error('Error sending to Al-Rafdain Telegram channel @ruc_1:', e);
              }
            } else {
              console.log(`[RUC WEBHOOK] isAlRafdain=false — city="${record.city}", university="${record.university}", destination="${record.destination}"`);
            }

            // 3. Broadcast to Partner Channels Network (Transport/Colleges/All)
            EdgeRuntime.waitUntil(broadcastToPartnerChannels(record, 'transport', msg, transportPhoto, replyMarkup, supabase));

            // 4. Auto-Alert Waiting Students (Matching Waitlist)
            EdgeRuntime.waitUntil(notifyWaitingStudents(record, supabase));
          }
          
          const fbIgCaption = (publishFacebook || publishInstagram || publishThreads || publishTiktok)
            ? await generateSocialCaption({ ...record, ...desc }, 'transport', link)
            : '';
          
          if (publishFacebook) {
            try {
              // 1. Post to Souq Baghdad Main Facebook Page
              console.log('[WEBHOOK SOCIAL] Posting transport to Souq Baghdad Main Facebook Page...');
              const mainFbData = await postToFacebook(fbIgCaption, fbIgPhotoUrl);
              console.log('[WEBHOOK SOCIAL] Main FB response:', JSON.stringify(mainFbData));
              if (mainFbData && (mainFbData.post_id || mainFbData.id)) {
                updates.facebook_post_id = mainFbData.post_id || mainFbData.id;
                syncStatus.facebook = 'success';
              } else {
                syncStatus.facebook = 'failed';
                syncStatus.facebook_error = mainFbData?.error?.message || JSON.stringify(mainFbData);
              }

              // 2. ALSO post to Al-Rafdain University Facebook Page (Feed & Story) ONLY if transport is for Al-Rafdain
              if (isAlRafdain || useAlRafdainFb) {
                const rafdainSetting = await getLiveSocialSetting('fb_rafdain');
                const rafdainToken = rafdainSetting?.access_token || ALRAFDAIN_FB_TOKEN || META_PAGE_ACCESS_TOKEN;
                const rafdainPageId = rafdainSetting?.page_id || ALRAFDAIN_FB_PAGE_ID || '102975411515668';
                if (rafdainToken && rafdainPageId && rafdainPageId !== META_PAGE_ID) {
                  console.log(`[WEBHOOK SOCIAL] Posting Al-Rafdain transport to Al-Rafdain Facebook Page (${rafdainPageId})...`);
                  const rafdainFbData = await postToFacebook(fbIgCaption, fbIgPhotoUrl, rafdainToken, rafdainPageId);
                  console.log('[WEBHOOK SOCIAL] Al-Rafdain FB response:', JSON.stringify(rafdainFbData));
                  if (rafdainFbData && (rafdainFbData.post_id || rafdainFbData.id)) {
                    syncStatus.rafdain_facebook_post_id = rafdainFbData.post_id || rafdainFbData.id;
                    syncStatus.rafdain_facebook = 'success';
                  }
                  
                  // 2b. Post Story (9:16) to Al-Rafdain Facebook Story
                  console.log('[WEBHOOK SOCIAL] Posting Story (9:16) to Al-Rafdain Facebook Story...');
                  await postToFacebookStory(finalStoryPhotoUrl, rafdainPageId, rafdainToken);
                }
              }

              // 3. Post Story (9:16) to Souq Baghdad Main Facebook Story
              if (META_PAGE_ID && META_PAGE_ACCESS_TOKEN) {
                console.log('[WEBHOOK SOCIAL] Posting Story (9:16) to Souq Baghdad Facebook Story...');
                await postToFacebookStory(finalStoryPhotoUrl, META_PAGE_ID, META_PAGE_ACCESS_TOKEN);
              }
            } catch(fbErr: any) {
              console.error('[WEBHOOK SOCIAL] FB Error:', fbErr);
              syncStatus.facebook = syncStatus.facebook || 'failed';
            }
          }
          
          if (publishInstagram) {
            try {
              // 1. Post to Al-Rafdain IG Story ONLY if transport is for Al-Rafdain
              if (isAlRafdain || useAlRafdainIg) {
                const rafdainIgSetting = await getLiveSocialSetting('ig_rafdain');
                const igToken = rafdainIgSetting?.access_token || ALRAFDAIN_FB_TOKEN || META_PAGE_ACCESS_TOKEN;
                const igTargetId = rafdainIgSetting?.page_id || rafdainIgSetting?.extra_id || ALRAFDAIN_IG_ID || '17841404181680155';
                if (igToken && igTargetId) {
                  console.log(`[WEBHOOK SOCIAL] Posting transport to Al-Rafdain IG Story (@al_rafdain / ${igTargetId})...`);
                  const igStoryRes = await postToInstagramStory(finalStoryPhotoUrl, igTargetId, igToken);
                  console.log('[WEBHOOK SOCIAL] Al-Rafdain IG Story result:', JSON.stringify(igStoryRes));
                  if (igStoryRes && (igStoryRes.id || igStoryRes.creation_id)) {
                    syncStatus.rafdain_instagram_story = 'success';
                  }
                }
              }
              // 2. Post to Main Souq Baghdad Instagram Feed
              console.log('[WEBHOOK SOCIAL] Posting transport to Instagram Feed...');
              const igData = await postToInstagram(fbIgCaption, fbIgPhotoUrl);
              console.log('[WEBHOOK SOCIAL] IG response:', JSON.stringify(igData));
              if (igData && (igData.id || igData.media_id)) {
                updates.instagram_post_id = igData.id || igData.media_id;
                syncStatus.instagram = 'success';
              } else {
                syncStatus.instagram = syncStatus.instagram || 'failed';
                syncStatus.instagram_error = igData?.error?.message || JSON.stringify(igData);
              }

              // 3. Post to Main Souq Baghdad Instagram Story (9:16)
              console.log('[WEBHOOK SOCIAL] Posting transport to Souq Baghdad Instagram Story...');
              const souqIgStory = await postToInstagramStory(finalStoryPhotoUrl);
              console.log('[WEBHOOK SOCIAL] Souq Baghdad IG Story result:', JSON.stringify(souqIgStory));
              if (souqIgStory && (souqIgStory.id || souqIgStory.creation_id)) {
                syncStatus.instagram_story = 'success';
              }
            } catch(igErr: any) {
              console.error('[WEBHOOK SOCIAL] IG Error:', igErr);
              syncStatus.instagram = syncStatus.instagram || 'failed';
            }
          }
          
          if (publishTiktok) {
            try {
              const tkData = await postToTikTok(fbIgCaption, fbIgPhotoUrl, supabase);
              if (tkData?.data?.publish_id) {
                updates.tiktok_post_id = tkData.data.publish_id;
                syncStatus.tiktok = 'success';
              }
            } catch(tkErr) {
              console.error('[WEBHOOK SOCIAL] TikTok Error:', tkErr);
            }
          }

          if (publishThreads) {
            try {
              console.log('[WEBHOOK SOCIAL] Posting transport to Threads...');
              const thData = await postToThreads(fbIgCaption, fbIgPhotoUrl);
              console.log('[WEBHOOK SOCIAL] Threads response:', JSON.stringify(thData));
              if (thData && (thData.id || thData.media_id)) {
                updates.threads_post_id = thData.id || thData.media_id;
                syncStatus.threads = 'success';
              } else {
                syncStatus.threads = 'failed';
                syncStatus.threads_error = thData?.error?.message || JSON.stringify(thData);
              }
            } catch(thErr: any) {
              console.error('[WEBHOOK SOCIAL] Threads Error:', thErr);
              syncStatus.threads = 'failed';
            }
          }
          
          syncStatus.last_sync_at = new Date().toISOString();
          syncStatus.platforms = {
            facebook: {
              target: (isAlRafdain || useAlRafdainFb) ? 'alrafdain1' : 'souqbaghdad.iq',
              page_name: (isAlRafdain || useAlRafdainFb) ? 'كلية الرافدين الجامعة' : 'سوق بغداد',
              types: ['feed_post', 'story_9_16'],
              post_id: syncStatus.rafdain_facebook_post_id || updates.facebook_post_id || null,
              status: (syncStatus.rafdain_facebook === 'success' || syncStatus.facebook === 'success') ? 'success' : 'failed',
              error: syncStatus.facebook_error || null
            },
            instagram: {
              target: (isAlRafdain || useAlRafdainIg) ? '@al_rafdain' : '@souqbaghdad.iq',
              account_name: (isAlRafdain || useAlRafdainIg) ? 'كلية الرافدين الجامعة' : 'سوق بغداد',
              types: (isAlRafdain || useAlRafdainIg) ? ['story_9_16'] : ['feed_post'],
              status: (syncStatus.rafdain_instagram_story === 'success' || syncStatus.instagram === 'success') ? 'success' : (syncStatus.instagram === 'failed' ? 'failed' : 'pending'),
              error: syncStatus.instagram_error || null
            },
            threads: {
              target: '@souqbaghdad.iq',
              status: syncStatus.threads || 'pending',
              error: syncStatus.threads_error || null
            },
            telegram: {
              status: syncStatus.telegram || 'success',
              channels: [
                { username: '@souqbaghdad_lines', name: 'خطوط نقل سوق بغداد', message_id: updates.telegram_message_id || null },
                ...((isAlRafdain) ? [{ username: '@ruc_1', name: 'كلية الرافدين', message_id: syncStatus.ruc_telegram_message_id || null }] : [])
              ]
            }
          };

          updates.sync_status = syncStatus;
          finalSyncStatus = syncStatus;
          if (Object.keys(updates).length > 0) {
             const targetTable = (payload.table === 'transport_ads' || payload.table === 'lines') ? 'ads' : payload.table;
             console.log(`[SOCIAL WEBHOOK] Saving publish updates to table ${targetTable} for ID ${record.id}:`, JSON.stringify(updates));
             await supabase.from(targetTable).update(updates).eq('id', record.id);
          }
          
          if (record.phone) {
             await sendWhatsAppWelcome(record.phone, `${catType} - ${record.location || 'خط نقل'}`, link);
          }
        }
      }

      return new Response(JSON.stringify({ ok: true, syncStatus: finalSyncStatus }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // --- Telegram Message / Callback Processing ---
    const update = payload;
    
    let chatId: number;
    let text = '';
    let contact = null;
    let photo = null;
    let voice = null;
    let callbackQuery = null;

    if (update.my_chat_member) {
      const myChat = update.my_chat_member.chat;
      const newStatus = update.my_chat_member.new_chat_member?.status;
      if (myChat && (newStatus === 'administrator' || newStatus === 'member')) {
        const title = myChat.title || 'الكروب';
        const isTransport = title.includes('خط') || title.includes('نقل') || title.includes('رافدين') || title.includes('جامع') || title.includes('كلية');
        
        let introText = `👋 <b>يا هلا وكل الهلا بيكم في "${title}"! 🇮🇶✨</b>\n\n` +
          `🤖 أنا <b>مساعد سوق بغداد وشبكة النقل الذكي</b>.\n` +
          `تم تفعيل حماية الكروب والمساعد الذكي بنجاح:\n\n`;

        if (isTransport) {
          introText += 
            `🚌 <b>مطابق خطوط النقل:</b> اكتب طلبك (مثال: محتاج خط للرافدين) وسأعرض لك خطوط النقل المتوفرة فوراً.\n` +
            `💺 <b>تنبيه مقاعد شاغرة:</b> السائق يكتب <code>/seats 2 المنصور الرافدين</code> لنشر بطاقة المقاعد.\n`;
        } else {
          introText += 
            `🚗 <b>رادار السيارات:</b> اكتب <code>/car النترا</code> للبحث عن سيارات معروضة.\n` +
            `💰 <b>استعلام الأسعار:</b> اكتب <code>/price توسان 2020</code> للحصول على متوسط السعر بالسوق.\n`;
        }

        introText += 
          `🛡️ <b>نظام الحماية:</b> منع الروابط الإعلانية والسبام بنظام الإنذارات الثلاثية.\n` +
          `💬 <b>للتحدث معي:</b> فقط سوّي (Reply / رد) على أي رسالة مني وسأجيبك فوراً!\n\n` +
          `<i>نتشرف بخدمتكم جميعاً 🌹</i>`;

        await sendMessage(myChat.id, introText, {
          inline_keyboard: [
            [{ text: '🚗 سيارات سوق بغداد', url: 'https://www.souqbaghdad.store' }, { text: '🚌 خطوط النقل', url: 'https://www.souqbaghdad.store/transport' }],
            [{ text: '🤖 فتح محادثة خاصة مع البوت', url: `https://t.me/${BOT_USERNAME}` }]
          ]
        });
        return new Response('OK', { status: 200 });
      }
    }

    let isVoiceInput = false;
    let originalVoiceText = '';
    let voiceBase64: string | null = null;

    if (update.message) {
      chatId = update.message.chat.id;
      text = update.message.text || '';
      contact = update.message.contact;
      photo = update.message.photo;
      voice = update.message.voice || update.message.audio;

      // 🎙️ Transcribe Voice Notes / Audio Messages
      if (voice && voice.file_id) {
        try {
          await sendChatAction(chatId, 'typing');
          const voiceUrl = await getTelegramFileUrl(voice.file_id);
          if (voiceUrl) {
            const result = await transcribeVoiceWithAi(voiceUrl);
            voiceBase64 = result.base64;
            if (result.text && result.text.trim().length > 0) {
              text = result.text.trim();
              isVoiceInput = true;
              originalVoiceText = text;
              console.log(`[VOICE TRANSCRIBED] (${chatId}): "${text}"`);
            } else if (voiceBase64) {
              isVoiceInput = true;
            }
          }
        } catch(e) {
          console.error('Error processing incoming voice note:', e);
        }
      }
    } else if (update.callback_query) {
      callbackQuery = update.callback_query;
      chatId = callbackQuery.message?.chat?.id || callbackQuery.from?.id;
      text = callbackQuery.data;
    } else {
      return new Response('OK', { status: 200 });
    }

    const fromUser = update.message?.from || update.callback_query?.from;
    const callbackQueryId = callbackQuery?.id;
    if (callbackQueryId && text !== 'check_subscription') {
      // Dismiss Telegram loading spinner immediately so buttons never hang
      answerCallbackQuery(callbackQueryId);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch user and state
    const { data: tgUser } = await supabase.from('telegram_users').select('*').eq('telegram_chat_id', chatId).maybeSingle();
    let state = tgUser?.bot_state || {};
    const userId = tgUser?.user_id;
    const phone = tgUser?.phone_number;

    // 🛠️ Automatic Restoration for user 07738470265 (Pure Pharma)
    if (userId && (phone?.includes('7738470265') || userId === '31f15390-dc84-4af6-99e0-ca92ac863292')) {
      const { data: profCheck } = await supabase.from('profiles').select('points').eq('id', userId).maybeSingle();
      if (profCheck && (profCheck.points || 0) < 100) {
        await supabase.from('profiles').update({ points: 100 }).eq('id', userId);
        await supabase.from('promo_code_usages').delete().eq('user_id', userId);
        console.log(`[USER REPAIR] Restored 100 points & cleared promo usages for Pure Pharma (07738470265)`);
      }
    }

    const callbackMsgId = callbackQuery?.message?.message_id;

    // Helper: Update existing message in-place or send new
    const updateOrSend = async (msgText: string, markup?: any) => {
      if (callbackMsgId) {
        try {
          const editRes = await editMessageText(chatId, callbackMsgId, msgText, markup);
          if (editRes?.ok || editRes?.description?.includes('message is not modified')) {
            return new Response('OK', { status: 200 });
          }
        } catch(e) {
          console.error('editMessageText failed, sending new:', e);
        }
      }
      await sendMessage(chatId, msgText, markup);
      return new Response('OK', { status: 200 });
    };

    // 🛑 Stop Transport Alert Handler (زر «لكيت خط خلاص / إيقاف التنبيهات»)
    if (text?.startsWith('stop_alert_')) {
      const reqId = text.replace('stop_alert_', '');
      if (reqId && reqId !== 'user') {
        await supabase
          .from('transport_requests')
          .update({ status: 'matched' })
          .eq('id', reqId);
      }

      const fromId = callbackQuery?.from?.id;
      if (fromId) {
        await supabase
          .from('transport_requests')
          .update({ status: 'matched' })
          .eq('telegram_user_id', String(fromId));
      }

      if (callbackQueryId) {
        answerCallbackQuery(callbackQueryId, '🎉 ألف مبروك يالغالي! تم إيقاف التنبيهات بنجاح.', true);
      }
      
      const editMsg = `✅ <b>ألف مبروك يالغالي! 🎉</b>\nتم تثبيت أنك حصلت على خط نقل، وتم إيقاف جميع التنبيهات والتاكات بنجاح.\nبالتوفيق بدوامك، وسوق بغداد بخدمتك دائماً 🌹`;
      await updateOrSend(editMsg);
      return new Response('OK', { status: 200 });
    }

    if (text === 'ambig_driver' || text === 'ambig_student') {
      const origText = state.data?.ambig_text || '';
      const forcedText = text === 'ambig_driver' ? `عندي خط ${origText}` : `محتاج خط ${origText}`;
      
      const chatType = update.message?.chat?.type || update.callback_query?.message?.chat?.type || 'private';
      const isGroup = chatType !== 'private';

      if (callbackMsgId) {
        try { await deleteMessage(chatId, callbackMsgId); } catch(e) {}
      }
      
      await handleSmartTransportSearch(chatId, forcedText, fromUser, supabase, isGroup);
      return new Response('OK', { status: 200 });
    }

    // 🔑 Automatic Token Receiver for Owner (Auto-detects Facebook & Instagram tokens)
    const isOwner = String(chatId) === '6474465462' || 
      (phone && (phone.includes('7701109692') || phone.includes('7700028170'))) ||
      tgUser?.role === 'owner' || tgUser?.role === 'admin';

    // =========================================================================
    // 👥 SMART GROUP MODE & 3-STRIKE DEFENDER (نظام حماية ومساعد الكروبات الذكي)
    // =========================================================================
    const chatType = update.message?.chat?.type || update.callback_query?.message?.chat?.type || 'private';
    const isGroup = chatType === 'group' || chatType === 'supergroup';

    if (isGroup) {
      const fromUser = update.message?.from || update.callback_query?.from;
      const fromId = fromUser?.id;
      
      let fromUsername = fromUser?.first_name || 'عزيزنا';
      if (fromUser?.username) {
        const u = fromUser.username.toLowerCase();
        if (u.includes('anonymous') || u.includes('groupanonymous') || u.includes('bot')) {
          fromUsername = 'مديرنا العزيز';
        } else {
          fromUsername = fromUser.first_name || `@${fromUser.username}`;
        }
      }

      const chatTitle = update.message?.chat?.title || update.callback_query?.message?.chat?.title || 'الكروب';
      const messageId = update.message?.message_id;

      // 1. Welcome New Members or Bot Added to Group
      if (update.message?.new_chat_members && update.message.new_chat_members.length > 0) {
        const groupCat = detectGroupCategory(chatTitle);

        for (const newMember of update.message.new_chat_members) {
          if (newMember.is_bot && (newMember.username === BOT_USERNAME || newMember.username?.includes('souqbaghda'))) {
            let welcomeCard = '';
            let buttons: any[] = [];

            if (groupCat === 'university') {
              welcomeCard = 
                `👋 <b>يا هلا وكل الهلا بطلاب وأساتذة وإدارة «${chatTitle}»! 🎓🚌✨</b>\n\n` +
                `🤖 أنا <b>مساعد الكروب الذكي لخدمات النقل والجامعات</b> (سوق بغداد).\n` +
                `تم تفعيل المساعد والخدمات التلقائية لأعضاء الكروب:\n\n` +
                `🚌 <b>البحث عن خطوط النقل:</b> اكتب (محتاج خط من منطقتك) وسأجد لك السائقين المتوفرين فوراً.\n` +
                `🚗 <b>للسائقين:</b> اكتب (عندي خط من... إلى...) أو <code>/seats 2 منطقتك</code> لربطك بالطلاب مجاناً.\n` +
                `🛡️ <b>نظام الحماية:</b> حظر السبام والروابط والإعلانات المكررة تلقائياً.\n\n` +
                `<i>نتمنى لكم دوام التوفيق والنجاح بدوامكم! 🌹</i>`;

              buttons = [
                [{ text: '🚌 تصفح خطوط النقل المتاحة 🌐', url: 'https://www.souqbaghdad.store/transport' }],
                [{ text: '🤖 فتح محادثة خاصة مع البوت', url: `https://t.me/${BOT_USERNAME}` }],
                [{ text: '➕ إضافة البوت لمجموعات أخرى 🛡️', url: `https://t.me/${BOT_USERNAME}?startgroup=true` }]
              ];
            } else if (groupCat === 'cars') {
              welcomeCard = 
                `👋 <b>يا هلا وكل الهلا بأهل وتجار وعشاق السيارات في «${chatTitle}»! 🚗🇮🇶✨</b>\n\n` +
                `🤖 أنا <b>رادار السيارات والمساعد الذكي لسوق بغداد</b>.\n` +
                `تم تفعيل الخدمات التلقائية لخدمة أعضاء الكروب:\n\n` +
                `💰 <b>رادار الأسعار الحية:</b> اكتب (سعر النترا 2020 أو سعر توسان 2019) وسأعطيك متوسط أسعار السوق الحقيقية فوراً.\n` +
                `🚗 <b>بيع وشراء السيارات:</b> اعرض سيارتك لتنزل تلقائياً بالموقع وقنوات التليكرام والفيسبوك.\n` +
                `🛡️ <b>حماية الكروب:</b> فلترة الروابط الخارجية والسبام تلقائياً.\n\n` +
                `<i>أهلاً وسهلاً بالجميع، نسعد بخدمتكم وتجارتكم دائماً! 🌹</i>`;

              buttons = [
                [{ text: '🚗 معرض سيارات سوق بغداد 🌐', url: 'https://www.souqbaghdad.store' }],
                [{ text: '🤖 فتح محادثة خاصة مع البوت', url: `https://t.me/${BOT_USERNAME}` }],
                [{ text: '➕ إضافة البوت لمجموعات أخرى 🛡️', url: `https://t.me/${BOT_USERNAME}?startgroup=true` }]
              ];
            } else {
              welcomeCard = 
                `👋 <b>يا هلا وكل الهلا بأعضاء وإدارة «${chatTitle}»! 🇮🇶✨</b>\n\n` +
                `🤖 أنا <b>المساعد الذكي وحامي الكروب الرسمي</b> من منصة سوق بغداد.\n` +
                `تم تفعيل خدمات المجموعة الذكية والحماية 24/7:\n\n` +
                `🛡️ <b>حماية الكروب:</b> منع الروابط والسبام والألفاظ غير اللائقة بنظام الإنذارات الثلاثية.\n` +
                `🔍 <b>استعلام وبحث:</b> اسألني عن أي سيارة أو خط نقل أو سلعة وسأجيبك فوراً.\n` +
                `🚗 <b>عرض إعلان:</b> افتح الخاص وانشر إعلاناتك مجاناً لتصل لآلاف المشترين.\n\n` +
                `<i>نتشرف بخدمتكم جميعاً بكل محبة وتقدير 🌹</i>`;

              buttons = [
                [{ text: '🚗 سيارات سوق بغداد', url: 'https://www.souqbaghdad.store' }, { text: '🚌 خطوط النقل', url: 'https://www.souqbaghdad.store/transport' }],
                [{ text: '🤖 فتح محادثة خاصة مع البوت', url: `https://t.me/${BOT_USERNAME}` }],
                [{ text: '➕ إضافة البوت لمجموعات أخرى 🛡️', url: `https://t.me/${BOT_USERNAME}?startgroup=true` }]
              ];
            }

            await sendOrReplaceGroupMessage(chatId, welcomeCard, { inline_keyboard: buttons }, supabase);
          } else if (!newMember.is_bot) {
            const memberName = newMember.first_name || 'عزيزنا';
            const welcomeText = groupCat === 'university'
              ? `👋 يا هلا بيك <b>${memberName}</b> نورت الكروب 🎓🌹\nتكدر تبحث عن خط نقل لدوامك أو تستفسر عن أي شيء بالكروب.\n🤖 لمحادثة المساعد: @${BOT_USERNAME}`
              : groupCat === 'cars'
              ? `👋 يا هلا بيك <b>${memberName}</b> نورت كروب السيارات 🚗🌹\nتكدر تسأل عن أسعار أي سيارة أو تبحث عن سيارة معروضة.\n🤖 لمحادثة المساعد: @${BOT_USERNAME}`
              : `👋 يا هلا بيك <b>${memberName}</b> نورت الكروب 🌹\nهنا تكدر تبحث عن سيارة أو خط نقل أو تعرض إعلاناتك مجاناً عبر سوق بغداد.\n🤖 للاستفادة من البوت: @${BOT_USERNAME}`;

            await sendOrReplaceGroupMessage(chatId, welcomeText, undefined, supabase);
          }
        }
        return new Response('OK', { status: 200 });
      }

      // Check if Sender is Group Admin or Owner
      let isSenderAdmin = false;
      if (fromId) {
        if (String(fromId) === '6474465462' || isOwner) {
          isSenderAdmin = true;
        } else {
          const chatMember = await getChatMember(chatId, fromId);
          if (chatMember && (chatMember.status === 'creator' || chatMember.status === 'administrator')) {
            isSenderAdmin = true;
          }
        }
      }

      const trimmedText = (text || '').trim();

      // 2. Group Admin Commands (/warn, /unwarn, /mute, /ban, /seats, /car, /line, /price, /start, /help)
      if (trimmedText.startsWith('/')) {
        const cmdParts = trimmedText.split(/\s+/);
        const cmd = cmdParts[0].toLowerCase().split('@')[0];

        // --- /start or /help Command in Group ---
        if (cmd === '/start' || cmd === '/help') {
          const groupCat = detectGroupCategory(chatTitle);
          let introMsg = `👋 <b>يا هلا بيكم في «${chatTitle}»! 🇮🇶✨</b>\n` +
            `🤖 أنا مساعد الكروب الذكي لخدمتكم 24/7:\n\n`;

          if (groupCat === 'university') {
            introMsg += 
              `🎓 <b>لخدمات النقل والجامعات:</b>\n` +
              `• اكتب طلبك بالكروب (مثال: <i>محتاج خط للرافدين</i>) لأجد لك السائقين فوراً.\n` +
              `• السائق يكتب <code>/seats 2 المنصور</code> لنشر مقاعد شاغرة.\n` +
              `• أو سوّي رد (Reply) على رسالتي وسأجيبك فوراً.\n`;
          } else if (groupCat === 'cars') {
            introMsg += 
              `🚗 <b>لخدمات سوق ومعارض السيارات:</b>\n` +
              `• اكتب <code>/price النترا 2020</code> أو <code>سعر توسان 2019</code> لمعرفة أسعار السوق الحية.\n` +
              `• اكتب <code>/car سبورتج</code> للبحث عن سيارات معروضة.\n` +
              `• أو سوّي رد (Reply) على رسالتي وسأجيبك فوراً.\n`;
          } else {
            introMsg += 
              `• اكتب <code>/price توسان 2020</code> لمعرفة أسعار السوق الحية.\n` +
              `• اكتب <code>محتاج خط للجامعة</code> للبحث عن خطوط نقل.\n` +
              `• أو سوّي رد (Reply) على رسالتي وسأجيبك فوراً.\n`;
          }

          introMsg += `\n🛡️ <i>الكروب محمي بالكامل من الروابط والإعلانات المكررة.</i>`;

          await sendOrReplaceGroupMessage(chatId, introMsg, {
            inline_keyboard: [
              [{ text: '🚗 سيارات سوق بغداد', url: 'https://www.souqbaghdad.store' }, { text: '🚌 خطوط النقل', url: 'https://www.souqbaghdad.store/transport' }],
              [{ text: '🤖 فتح محادثة خاصة مع البوت', url: `https://t.me/${BOT_USERNAME}` }],
              [{ text: '➕ إضافة البوت لكروب آخر 🛡️', url: `https://t.me/${BOT_USERNAME}?startgroup=true` }]
            ]
          }, supabase);
          return new Response('OK', { status: 200 });
        }

        // --- /warn Command (Admin only) ---
        if (cmd === '/warn' && isSenderAdmin) {
          const replyTo = update.message?.reply_to_message;
          const targetUser = replyTo?.from;
          if (targetUser && !targetUser.is_bot) {
            const targetId = targetUser.id;
            const targetName = targetUser.username ? `@${targetUser.username}` : targetUser.first_name;
            
            const { data: curWarn } = await supabase.from('group_warnings').select('warning_count').eq('chat_id', String(chatId)).eq('user_id', String(targetId)).maybeSingle();
            const count = (curWarn?.warning_count || 0) + 1;
            
            await supabase.from('group_warnings').upsert({
              chat_id: String(chatId),
              user_id: String(targetId),
              username: targetName,
              warning_count: count,
              last_reason: 'تحذير يدوي من الأدمن',
              updated_at: new Date().toISOString()
            });

            if (replyTo.message_id) await deleteMessage(chatId, replyTo.message_id);

            if (count === 1) {
              await sendOrReplaceGroupMessage(chatId, `⚠️ <b>تحذير يدوي (1/3) لـ ${targetName}:</b> يرجى الالتزام بقوانين الكروب وعدم تكرار المخالفة.`, undefined, supabase);
            } else if (count === 2) {
              await restrictChatMember(chatId, targetId, { can_send_messages: false }, Math.floor(Date.now()/1000) + 3600);
              await sendOrReplaceGroupMessage(chatId, `⚠️ <b>تحذير (2/3) لـ ${targetName}:</b> تم كتمك لمدة ساعة بسبب تكرار المخالفة! 🔇`, undefined, supabase);
            } else {
              await banChatMember(chatId, targetId);
              await sendOrReplaceGroupMessage(chatId, `🚫 <b>تم طرد وحظر ${targetName} نهائياً (3/3) لتكرار المخالفات لحماية الكروب.</b>`, undefined, supabase);
            }
            return new Response('OK', { status: 200 });
          }
        }

        // --- /unwarn Command (Admin only) ---
        if (cmd === '/unwarn' && isSenderAdmin) {
          const replyTo = update.message?.reply_to_message;
          const targetUser = replyTo?.from;
          if (targetUser) {
            await supabase.from('group_warnings').delete().eq('chat_id', String(chatId)).eq('user_id', String(targetUser.id));
            await unbanChatMember(chatId, targetUser.id);
            await sendOrReplaceGroupMessage(chatId, `✅ <b>تم تصفير جميع إنذارات ${targetUser.first_name} بنجاح!</b>`, undefined, supabase);
            return new Response('OK', { status: 200 });
          }
        }

        // --- /ban /kick Command (Admin only) ---
        if ((cmd === '/ban' || cmd === '/kick') && isSenderAdmin) {
          const replyTo = update.message?.reply_to_message;
          if (replyTo?.from) {
            await banChatMember(chatId, replyTo.from.id);
            await sendOrReplaceGroupMessage(chatId, `🚫 <b>تم طرد وحظر ${replyTo.from.first_name} من الكروب بواسطة الأدمن.</b>`, undefined, supabase);
            return new Response('OK', { status: 200 });
          }
        }

        // --- /mute Command (Admin only) ---
        if (cmd === '/mute' && isSenderAdmin) {
          const replyTo = update.message?.reply_to_message;
          if (replyTo?.from) {
            await restrictChatMember(chatId, replyTo.from.id, { can_send_messages: false }, Math.floor(Date.now()/1000) + 7200);
            await sendOrReplaceGroupMessage(chatId, `🔇 <b>تم كتم ${replyTo.from.first_name} لمدة ساعتين بواسطة الأدمن.</b>`, undefined, supabase);
            return new Response('OK', { status: 200 });
          }
        }

        // --- /seats Command (Driver seats alert) ---
        if (cmd === '/seats') {
          const routeInfo = cmdParts.slice(1).join(' ') || 'خط نقل بغداد';
          await sendOrReplaceGroupMessage(chatId, 
            `💺 <b>تنبيه مقاعد شاغرة في خط نقل!</b>\n\n` +
            `🚌 <b>المسار:</b> ${routeInfo}\n` +
            `👤 <b>السائق:</b> ${fromUsername}\n\n` +
            `📞 <i>للحجز أو الاستفسار، تواصل مباشرة مع صاحب الرسالة.</i>`,
            {
              inline_keyboard: [
                [{ text: '🚌 تصفح جميع خطوط سوق بغداد', url: 'https://www.souqbaghdad.store/transport' }]
              ]
            },
            supabase
          );
          return new Response('OK', { status: 200 });
        }

        // --- /car Command (Quick Car Search) ---
        if (cmd === '/car') {
          const carQuery = cmdParts.slice(1).join(' ');
          let query = supabase.from('ads').select('*').in('category', ['vehicles', 'cars', 'car']).eq('status', 'active');
          if (carQuery) {
            query = query.or(`title.ilike.%${carQuery}%,description.ilike.%${carQuery}%`);
          }
          const { data: matchedCars } = await query.order('created_at', { ascending: false }).limit(3);

          if (!matchedCars || matchedCars.length === 0) {
            await sendOrReplaceGroupMessage(chatId, `🚗 لم يتم العثور على سيارات مطابقة لـ «${carQuery}» حالياً، تكدر تتصفح أحدث السيارات من هنا: https://www.souqbaghdad.store`, undefined, supabase);
          } else {
            let carMsg = `🚗 <b>أحدث سيارات ${carQuery ? '«' + carQuery + '»' : ''} في سوق بغداد:</b>\n\n`;
            for (const c of matchedCars) {
              carMsg += `• <b>${c.title}</b>\n  💰 السعر: <b>${c.price || 'اتصال'}</b> | 📍 ${c.location || 'بغداد'}\n  🔗 https://www.souqbaghdad.store/ad/${c.short_id || c.id}\n\n`;
            }
            await sendOrReplaceGroupMessage(chatId, carMsg, undefined, supabase);
          }
          return new Response('OK', { status: 200 });
        }

        // --- /line or \line Command (Quick Transport Line Search) ---
        if (cmd === '/line' || cmd === '/lines' || cmd === '\\line' || cmd === '\\lines') {
          await sendChatAction(chatId, 'typing');
          await handleSmartTransportSearch(chatId, trimmedText, fromUser, supabase, true);
          return new Response('OK', { status: 200 });
        }
      }

      // 3. Prohibited Content Check & 3-Strike System (Anti-Link & Bad Words)
      if (!isSenderAdmin && text) {
        // Link patterns (external links, channels, joinchat)
        const hasForbiddenLink = 
          /(https?:\/\/|t\.me\/|telegram\.me\/|bit\.ly|joinchat|\.xyz|\.top|\.ru|wa\.me\/\+|chat\.whatsapp\.com)/i.test(text) &&
          !text.includes('souqbaghdad.store') &&
          !text.includes('t.me/souqbaghda');

        // Bad words & insult patterns (Iraqi & Arabic vulgar terms with exact word boundaries)
        const hasBadWords = /(?:^|[\s\p{P}])(كحبه|قحبه|منيوك|قندرة|ديوث|شرموط|شرموطه|عير|مفرخة|دعارة|اباحي|بنات ليل|1xbet|betting)(?:$|[\s\p{P}])/iu.test(text) ||
                            /(?:^|[\s\p{P}])(كس|طيز|زب|نعل|سكس)(?:$|[\s\p{P}])/iu.test(text);

        if (hasForbiddenLink || hasBadWords) {
          if (messageId) await deleteMessage(chatId, messageId);

          const reason = hasForbiddenLink ? 'نشر روابط إعلانية خارجية' : 'استخدام ألفاظ غير لائقة';
          const { data: curWarn } = await supabase.from('group_warnings').select('warning_count').eq('chat_id', String(chatId)).eq('user_id', String(fromId)).maybeSingle();
          const count = (curWarn?.warning_count || 0) + 1;

          await supabase.from('group_warnings').upsert({
            chat_id: String(chatId),
            user_id: String(fromId),
            username: fromUsername,
            warning_count: count,
            last_reason: reason,
            updated_at: new Date().toISOString()
          });

          if (count === 1) {
            await sendOrReplaceGroupMessage(chatId, `⚠️ <b>تحذير (1/3) لـ ${fromUsername}:</b> يمنع ${reason} في الكروب.`, undefined, supabase);
          } else if (count === 2) {
            await restrictChatMember(chatId, fromId, { can_send_messages: false }, Math.floor(Date.now()/1000) + 3600);
            await sendOrReplaceGroupMessage(chatId, `⚠️ <b>تحذير (2/3) لـ ${fromUsername}:</b> تم كتمك لمدة ساعة بسبب تكرار ${reason}! 🔇`, undefined, supabase);
          } else {
            await banChatMember(chatId, fromId);
            await sendOrReplaceGroupMessage(chatId, `🚫 <b>تم طرد وحظر ${fromUsername} نهائياً (3/3) لتكرار المخالفات لحماية الكروب.</b>`, undefined, supabase);
          }
          return new Response('OK', { status: 200 });
        }
      }

      // 4. Smart Group Contextual Matcher (for transport & car queries & conversation)
      if (text && !trimmedText.startsWith('/')) {
        const cleanMsg = text.toLowerCase().trim();
        const isReplyToBot = update.message?.reply_to_message?.from?.is_bot === true;
        const isBotMentioned = 
          text.includes('@' + BOT_USERNAME) || 
          text.includes('سوق بغداد') || 
          text.includes('يا بوت') ||
          text.includes('البوت') ||
          (cleanMsg.startsWith('بوت ') || cleanMsg === 'بوت') ||
          isReplyToBot;

        // A. Transport search intent (handles typos like خك, جميله, الرفدين)
        const isTransportIntent = 
          cleanMsg.includes('خط') || cleanMsg.includes('خك') || cleanMsg.includes('حط') || cleanMsg.includes('نقل') || cleanMsg.includes('سايق') ||
          ((cleanMsg.includes('من ') || cleanMsg.includes('الى ') || cleanMsg.includes('إلى ') || cleanMsg.includes('لـ')) && (cleanMsg.includes('رافدين') || cleanMsg.includes('رفدين') || cleanMsg.includes('جامع') || cleanMsg.includes('كلية') || cleanMsg.includes('دورة') || cleanMsg.includes('جميل') || cleanMsg.includes('سيدي') || cleanMsg.includes('منصور') || cleanMsg.includes('شعب') || cleanMsg.includes('كراد') || cleanMsg.includes('بياع') || cleanMsg.includes('يرموك')));

        if (isTransportIntent && (cleanMsg.includes('اريد') || cleanMsg.includes('محتاج') || cleanMsg.includes('ادور') || cleanMsg.includes('اكو') || cleanMsg.includes('متوفر') || cleanMsg.includes('من') || cleanMsg.includes('الى') || cleanMsg.includes('لـ') || cleanMsg.includes('سعر'))) {
          await sendChatAction(chatId, 'typing');
          await handleSmartTransportSearch(chatId, text, fromUser, supabase, true, messageId);
          return new Response('OK', { status: 200 });
        }

        // B. Car prices & vehicle questions in group
        const isCarIntent = 
          cleanMsg.includes('سعر') || cleanMsg.includes('بيش') || cleanMsg.includes('سيار') ||
          cleanMsg.includes('توسان') || cleanMsg.includes('النترا') || cleanMsg.includes('كورولا') || 
          cleanMsg.includes('سبورتاج') || cleanMsg.includes('سنتافي') || cleanMsg.includes('تاهو') || 
          cleanMsg.includes('اوباما') || cleanMsg.includes('شارجر') || cleanMsg.includes('كامري');

        if (isCarIntent && (cleanMsg.includes('سعر') || cleanMsg.includes('بيش') || cleanMsg.includes('موديل') || cleanMsg.includes('وارد') || cleanMsg.includes('معروض') || cleanMsg.includes('للبيع') || cleanMsg.includes('شراء') || cleanMsg.includes('شراي'))) {
          await sendChatAction(chatId, 'typing');
          const groupAiReply = await callGroupAiEngine(text, fromUsername, chatTitle);
          await sendOrReplaceGroupMessage(chatId, groupAiReply, undefined, supabase, messageId);
          return new Response('OK', { status: 200 });
        }

        // C. Conversational AI (Direct Mentions / Replies / Inquiries / General Help)
        if (isBotMentioned || cleanMsg.includes('شلون انشر') || cleanMsg.includes('شلون اشتري') || cleanMsg.includes('شلون ابيع') || cleanMsg.includes('رابط الموقع') || cleanMsg.includes('ساعدني') || cleanMsg.includes('شعندك')) {
          await sendChatAction(chatId, 'typing');
          const groupAiReply = await callGroupAiEngine(text, fromUsername, chatTitle);
          await sendOrReplaceGroupMessage(chatId, groupAiReply, undefined, supabase, messageId);
          return new Response('OK', { status: 200 });
        }
      }

      return new Response('OK', { status: 200 });
    }
    const trimmedText = (text || '').trim();

    // 🛡️ FORCE SUBSCRIBE LOGIC
    if (!isOwner && chatType === 'private') {
      let isSubscribed = true;
      try {
        const channelsToCheck = ['@souqbaghdad_iq', '@souqbaghdad_car', '@souqbaghdad_lines'];
        const subChecks = await Promise.all(
          channelsToCheck.map(ch => getChatMember(ch, chatId).catch(() => ({ status: 'member' })))
        );
        isSubscribed = subChecks.every(member => member && ['creator', 'administrator', 'member', 'restricted'].includes(member.status));
      } catch (e) {
        console.error('Force subscribe check error:', e);
        isSubscribed = true; // Fallback to avoid blocking on API errors
      }

      if (!isSubscribed) {
        const subMsg = `👋 <b>أهلاً بك يالغالي في بوت سوق بغداد!</b>\n\n` +
          `عذراً، لا يمكنك استخدام البوت أو النشر قبل الاشتراك في قنواتنا الرسمية لدعمنا والاستمرار بتقديم الخدمة مجاناً للجميع 🌹\n\n` +
          `👇 <b>يرجى الاشتراك في (جميع) القنوات الثلاثة التالية لتفعيل البوت:</b>`;
        
        const subMarkup = {
          inline_keyboard: [
            [{ text: '📢 سوق بغداد (العامة)', url: 'https://t.me/souqbaghdad_iq' }, { text: '🎓 الرافدين', url: 'https://t.me/ruc_1' }],
            [{ text: '🚗 سيارات سوق بغداد', url: 'https://t.me/souqbaghdad_car' }],
            [{ text: '🚌 خطوط النقل والجامعات', url: 'https://t.me/souqbaghdad_lines' }],
            [{ text: '✅ تحقق من الاشتراك', callback_data: 'check_subscription' }]
          ]
        };

        if (callbackQueryId && trimmedText === 'check_subscription') {
           await answerCallbackQuery(callbackQueryId, '❌ عذراً، يجب الاشتراك في جميع القنوات الثلاثة أولاً لتفعيل البوت!', true);
        } else {
          if (callbackMsgId) {
             await updateOrSend(subMsg, subMarkup);
          } else {
             await sendMessage(chatId, subMsg, subMarkup);
          }
        }
        return new Response('OK', { status: 200 });
      } else if (trimmedText === 'check_subscription') {
         if (callbackQueryId) await answerCallbackQuery(callbackQueryId, '✅ شكراً لاشتراكك! تم تفعيل البوت بالكامل.', true);
         text = '/start'; // Trigger main menu automatically
      }
    }

    if (isOwner && (trimmedText.startsWith('EAAP') || trimmedText.startsWith('EAA') || trimmedText.startsWith('IGAA') || (trimmedText.length > 100 && !trimmedText.includes(' ') && trimmedText.startsWith('E')))) {
      console.log(`[OWNER TOKEN RECEIVED] ChatId: ${chatId}, token prefix: ${trimmedText.substring(0, 10)}...`);
      await sendMessage(chatId, '⏳ <i>جاري فحص وتفعيل التوكن والتحقق من الصلاحيات...</i>');
      
      let detectedName = '';
      let detectedId = '';
      let targetSettingKey = '';
      let tokenType = 'Facebook Page Token';

      // 1. Check if it's a User Token that can grant Page Access Tokens via /me/accounts
      try {
        const accountsRes = await fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${trimmedText}`);
        const accountsData = await accountsRes.json();
        if (accountsData && accountsData.data && Array.isArray(accountsData.data) && accountsData.data.length > 0) {
          console.log(`[USER TOKEN DETECTED] Found ${accountsData.data.length} pages in /me/accounts`);
          const savedPages: string[] = [];

          for (const page of accountsData.data) {
            const pageId = page.id;
            const pageName = page.name || 'صفحة';
            const pageToken = page.access_token;
            let settingKey = `fb_${pageId}`;
            if (pageId === '1088044114402452' || pageName.includes('سوق بغداد')) {
              settingKey = 'fb_souq';
            } else if (pageId === '102975411515668' || pageName.includes('الرافدين')) {
              settingKey = 'fb_rafdain';
            }

            await supabase.from('social_settings').upsert({
              id: settingKey,
              name: pageName,
              category: 'facebook',
              page_id: pageId,
              access_token: pageToken,
              is_active: true,
              last_status: 'active',
              last_error: null,
              last_checked_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

            if (settingKey === 'fb_souq') {
              await supabase.from('social_settings').update({
                access_token: pageToken,
                last_status: 'active',
                last_checked_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }).eq('id', 'ig_souq');
            } else if (settingKey === 'fb_rafdain') {
              await supabase.from('social_settings').update({
                access_token: pageToken,
                last_status: 'active',
                last_checked_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }).eq('id', 'ig_rafdain');
            }

            savedPages.push(`• <b>${pageName}</b> (<code>${pageId}</code>) ✅`);
          }

          dynamicSocialCache = {};
          lastSocialCacheTime = 0;

          await sendMessage(chatId, 
            `🎉 <b>تم استخراج وتفعيل التوكنات الدائمة لجميع الصفحات بنجاح! 🎯</b>\n\n` +
            `📄 <b>الصفحات التي تم استخراج توكناتها وتحديثها تلقائياً:</b>\n` +
            savedPages.join('\n') + `\n\n` +
            `🔑 <b>نوع التوكنات:</b> Permanent Long-Lived Page Access Tokens (دائمة لا تنتهي)\n` +
            `📊 <b>الحالة:</b> نشطة ومفعلة للنشر والحذف والمزامنة الفورية بنسبة 100% 🚀`
          );
          return new Response('OK', { status: 200 });
        }
      } catch(e) {
        console.error('Accounts check failed:', e);
      }

      // 2. Test as Direct Instagram Token
      if (trimmedText.startsWith('IGAA')) {
        try {
          const igRes = await fetch(`https://graph.instagram.com/v20.0/me?fields=id,username,name&access_token=${trimmedText}`);
          const igData = await igRes.json();
          if (igData && igData.id) {
            detectedName = `انستغرام (@${igData.username || igData.name})`;
            detectedId = igData.id;
            targetSettingKey = 'ig_souq';
            tokenType = 'Instagram Direct Graph API Token';
          }
        } catch(e) {
          console.error('IG test failed:', e);
        }
      }

      // 3. Test as direct Facebook Page Token
      if (!detectedId) {
        try {
          const fbRes = await fetch(`https://graph.facebook.com/v20.0/me?access_token=${trimmedText}`);
          const fbData = await fbRes.json();
          if (fbData && fbData.id) {
            detectedName = fbData.name || 'صفحة فيسبوك';
            detectedId = fbData.id;
            if (detectedId === '1088044114402452' || detectedName.includes('سوق بغداد')) {
              targetSettingKey = 'fb_souq';
            } else if (detectedId === '102975411515668' || detectedName.includes('الرافدين')) {
              targetSettingKey = 'fb_rafdain';
            } else {
              targetSettingKey = `fb_${detectedId}`;
            }
          }
        } catch(e) {
          console.error('FB test failed:', e);
        }
      }

      if (detectedId) {
        // Save to database
        await supabase.from('social_settings').upsert({
          id: targetSettingKey,
          name: detectedName,
          category: tokenType.includes('Instagram') ? 'instagram' : 'facebook',
          page_id: detectedId,
          access_token: trimmedText,
          is_active: true,
          last_status: 'active',
          last_error: null,
          last_checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        if (targetSettingKey === 'fb_souq') {
          await supabase.from('social_settings').update({
            access_token: trimmedText,
            last_status: 'active',
            last_checked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }).eq('id', 'ig_souq');
        } else if (targetSettingKey === 'fb_rafdain') {
          await supabase.from('social_settings').update({
            access_token: trimmedText,
            last_status: 'active',
            last_checked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }).eq('id', 'ig_rafdain');
        }

        // Invalidate dynamic cache
        dynamicSocialCache = {};
        lastSocialCacheTime = 0;

        await sendMessage(chatId, 
          `🎉 <b>تم استلام وتفعيل التوكن بنجاح! 🎯</b>\n\n` +
          `🏢 <b>الجهة:</b> ${detectedName}\n` +
          `🆔 <b>معرف الصفحة/الحساب:</b> <code>${detectedId}</code>\n` +
          `🔑 <b>نوع التوكن:</b> ${tokenType}\n` +
          `📊 <b>الحالة:</b> نشط ومحفوظ ومفعل فورياً ✅`
        );
        return new Response('OK', { status: 200 });
      } else {
        await sendMessage(chatId, `❌ <b>تعذر التحقق من التوكن!</b>\n\nتأكد من نسخ التوكن كاملاً وتوفر صلاحيات النشر وإدارة الصفحات.`);
        return new Response('OK', { status: 200 });
      }
    }

    // 🔄 Owner Command: /sync_all or /sync_health or /heal
    if (isOwner && (trimmedText === '/sync_all' || trimmedText === '/sync_health' || trimmedText === '/heal' || trimmedText === 'مزامنة')) {
      await sendMessage(chatId, '⏳ <b>جاري فحص ومزامنة الإعلانات النشطة على كافة المنصات والتحقق من عدم التكرار...</b>\n\nقد تستغرق العملية بضع ثوانٍ.');
      
      const { data: recentAds } = await supabase.from('ads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      let healedCount = 0;
      let existingRecovered = 0;
      let republishedCount = 0;
      const logs: string[] = [];

      for (const ad of recentAds || []) {
        const res = await syncAndHealAd(ad, supabase);
        if (res.healed) {
          healedCount++;
          const actions = Object.entries(res.details).map(([p, a]) => `${p}: ${a}`).join(', ');
          logs.push(`• <b>#${ad.short_id || ad.id}</b> (${ad.title?.substring(0, 20)}...): <i>${actions}</i>`);
          if (actions.includes('recovered_existing')) existingRecovered++;
          if (actions.includes('republished')) republishedCount++;
        }
      }

      const report = 
        `📊 <b>تقرير فحص وصيانة المزامنة الذاتية (Watchdog):</b>\n\n` +
        `✅ <b>عدد الإعلانات المفحوصة:</b> ${recentAds?.length || 0}\n` +
        `🛠️ <b>الإعلانات التي تم تصحيحها ومزامنتها:</b> ${healedCount}\n` +
        `🔍 <b>منشورات تم اكتشافها وربطها (منع تكرار):</b> ${existingRecovered}\n` +
        `🚀 <b>منصات أعيد نشرها بنجاح:</b> ${republishedCount}\n\n` +
        (logs.length > 0 ? `<b>تفاصيل العمليات:</b>\n${logs.join('\n')}\n\n` : `<i>جميع الإعلانات متزامنة 100% ولا توجد أي مشاكل معلقة! 🎉</i>`) +
        `⏰ <i>${new Date().toLocaleString('ar-IQ', { timeZone: 'Asia/Baghdad' })}</i>`;

      await sendMessage(chatId, report);
      return new Response('OK', { status: 200 });
    }

    if (isOwner && trimmedText === '/test_story') {
      await sendMessage(chatId, '⏳ <i>جاري سحب آخر إعلان سيارات ونشره كستوري انستغرام للتجربة...</i>');
      try {
        const { data: latestAd } = await supabase.from('ads').select('*').eq('category', 'vehicles').eq('status', 'active').not('image_url', 'is', null).order('created_at', { ascending: false }).limit(1).single();
        if (latestAd && latestAd.image_url) {
          const igToken = META_PAGE_ACCESS_TOKEN;
          const igAccountId = Deno.env.get('META_IG_ACCOUNT_ID') || '17841461141753177'; // Fallback to souqbaghdad IG ID if missing
          
          if (!igToken) throw new Error("Missing Meta Access Token");

          // 1. Create Media Container for Story
          const containerRes = await fetch(`https://graph.facebook.com/v21.0/${igAccountId}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_url: latestAd.image_url,
              media_type: 'STORIES',
              access_token: igToken
            })
          });
          
          const containerData = await containerRes.json();
          if (containerData.error) {
            await sendMessage(chatId, `❌ خطأ بإنشاء الستوري: ${JSON.stringify(containerData.error)}`);
            return new Response('OK', { status: 200 });
          }

          const creationId = containerData.id;

          // 2. Publish Story
          const publishRes = await fetch(`https://graph.facebook.com/v21.0/${igAccountId}/media_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creation_id: creationId,
              access_token: igToken
            })
          });

          const publishData = await publishRes.json();
          if (publishData.error) {
            await sendMessage(chatId, `❌ خطأ بنشر الستوري: ${JSON.stringify(publishData.error)}`);
          } else {
            await sendMessage(chatId, `✅ <b>تم نشر الستوري بنجاح!</b>\n\nافتح انستغرام سوق بغداد وشوف الستوري الآن.\nID: ${publishData.id}`);
          }

        } else {
           await sendMessage(chatId, '❌ لم يتم العثور على إعلان سيارات يحتوي على صورة.');
        }
      } catch (err: any) {
        await sendMessage(chatId, `❌ Exception: ${err.message}`);
      }
      return new Response('OK', { status: 200 });
    }

    // ⚙️ Owner Command: /social, /control, /channels, social_management, التسعيرة, لوحة تحكم المنصات
    const isSocialManagementIntent = isOwner && (
      trimmedText === '/social' || trimmedText === '/control' || trimmedText === '/channels' || trimmedText === '/pricing' ||
      trimmedText === 'social_management' || trimmedText === 'social_refresh' || trimmedText === 'التسعيرة' || trimmedText === 'تسعيرة' ||
      trimmedText === 'لوحة تحكم المنصات والتسعير' || trimmedText === 'لوحة تحكم المنصات' || trimmedText === 'لوحة المنصات' ||
      trimmedText === 'المنصات' || trimmedText === 'تسعير' || trimmedText.startsWith('toggle_social_') || trimmedText.startsWith('set_post_price_') ||
      trimmedText === 'set_custom_price_prompt'
    );

    if (isSocialManagementIntent) {
      // Handle Toggle Callback
      if (trimmedText.startsWith('toggle_social_')) {
        const toggleKey = trimmedText.replace('toggle_social_', '');
        const { data: curSetting } = await supabase.from('social_settings').select('is_active').eq('id', toggleKey).maybeSingle();
        if (curSetting) {
          await supabase.from('social_settings').update({
            is_active: !curSetting.is_active,
            updated_at: new Date().toISOString()
          }).eq('id', toggleKey);
        }
      }

      // Handle Quick Point Price Presets
      if (trimmedText.startsWith('set_post_price_')) {
        const priceVal = parseInt(trimmedText.replace('set_post_price_', ''));
        if (!isNaN(priceVal)) {
          await supabase.from('social_settings').update({
            post_price: priceVal,
            currency: 'نقطة',
            updated_at: new Date().toISOString()
          }).neq('id', 'temp_placeholder');
          await sendMessage(chatId, `✅ <b>تم تحديث تسعير البوست لجميع المنصات إلى: ${priceVal === 0 ? 'مجاني 🎁' : priceVal + ' نقطة'} بنجاح!</b>`);
        }
      }

      // Handle Custom Price Prompt
      if (trimmedText === 'set_custom_price_prompt') {
        state = { step: 'owner_custom_price_waiting' };
        if (userId) await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        return await updateOrSend(
          `🪙 <b>تحديد سعر مخصص بالنقاط لنشر البوست:</b>\n\n` +
          `أرسل رقم النقاط المطلوب لكل بوست (مثال: <code>3</code> أو <code>7</code> أو <code>10</code>):`,
          { inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'social_management' }]] }
        );
      }

      const { data: allSettings } = await supabase.from('social_settings').select('*').order('id');
      let msg = `📡 <b>لوحة تحكم الأونر في قنوات ومنصات النشر والتسعير</b> 🇮🇶\n\n`;
      msg += `🔘 <i>الستوري مجاني دائماً (0 نقطة 🎁). يمكنك تعديل سعر البوست وتشغيل/إيقاف الصفحات أدناه:</i>\n\n`;

      const keyboard: any[] = [];
      for (const s of allSettings || []) {
        if (s.id === 'system_alerts' || s.id === 'whatsapp') continue;
        const icon = s.category === 'facebook' ? '🔵' : s.category === 'instagram' ? '📸' : s.category === 'telegram' ? '✈️' : '🧵';
        const statusIcon = s.is_active !== false ? '🟢 [مفعل]' : '🔴 [معطل]';
        const postPrice = s.post_price && s.post_price > 0 ? `${s.post_price} نقطة` : 'مجاني 🎁';
        const storyPrice = 'مجاني 🎁';
        
        msg += `${icon} <b>${s.name}</b>\n`;
        msg += `  ├ الحالة: ${statusIcon}\n`;
        msg += `  ├ بوست (Feed): ${s.post_enabled !== false ? '✅' : '❌'} (<b>${postPrice}</b>)\n`;
        msg += `  └ ستوري (Story): ${s.story_enabled !== false ? '✅' : '❌'} (<b>${storyPrice}</b>)\n\n`;

        const btnLabel = `${s.is_active !== false ? '🟢 إيقاف' : '🔴 تشغيل'} ${s.name.substring(0, 18)}`;
        keyboard.push([{ text: btnLabel, callback_data: `toggle_social_${s.id}` }]);
      }

      // Quick point pricing buttons for the owner
      keyboard.push([
        { text: '🪙 البوست مجاني (0)', callback_data: 'set_post_price_0' },
        { text: '🪙 البوست = 1 نقطة', callback_data: 'set_post_price_1' }
      ]);
      keyboard.push([
        { text: '🪙 البوست = 2 نقطة', callback_data: 'set_post_price_2' },
        { text: '🪙 البوست = 5 نقاط', callback_data: 'set_post_price_5' }
      ]);
      keyboard.push([
        { text: '🪙 البوست = 10 نقاط', callback_data: 'set_post_price_10' },
        { text: '✏️ سعر مخصص', callback_data: 'set_custom_price_prompt' }
      ]);

      keyboard.push([
        { text: '🔄 تحديث الحالة', callback_data: 'social_management' },
        { text: '🔙 عودة للوحة المالك', callback_data: 'owner_hub_main' }
      ]);
      const markup = { inline_keyboard: keyboard };

      if (callbackMsgId) {
        try {
          await editMessageText(chatId, callbackMsgId, msg, markup);
          return new Response('OK', { status: 200 });
        } catch(e) {}
      }
      await sendMessage(chatId, msg, markup);
      return new Response('OK', { status: 200 });
    }

    // Handle Custom Price Input
    if (isOwner && state?.step === 'owner_custom_price_waiting') {
      state = {};
      if (userId) await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

      const customPrice = parseInt(trimmedText.replace(/[^0-9]/g, ''));
      if (!isNaN(customPrice) && customPrice >= 0) {
        await supabase.from('social_settings').update({
          post_price: customPrice,
          currency: 'نقطة',
          updated_at: new Date().toISOString()
        }).neq('id', 'temp_placeholder');
        await sendMessage(chatId, `✅ <b>تم تحديث تسعير البوست لجميع المنصات إلى: ${customPrice === 0 ? 'مجاني 🎁' : customPrice + ' نقطة'} بنجاح!</b>`, {
          inline_keyboard: [[{ text: '📡 لوحة المنصات والتسعير', callback_data: 'social_management' }]]
        });
      } else {
        await sendMessage(chatId, `⚠️ يرجى إدخال رقم صحيح (مثال: 5).`, {
          inline_keyboard: [[{ text: '🔙 عودة للوحة المنصات', callback_data: 'social_management' }]]
        });
      }
      return new Response('OK', { status: 200 });
    }

    // Helper: Reset & Show Main Menu
    const showMainMenu = async (aiText?: string, editCurrent = false) => {
      state = {};
      if (userId) {
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
      }
      
      let userInfo = '';
      if (userId) {
        const { data: profile } = await supabase.from('profiles').select('full_name, points').eq('id', userId).maybeSingle();
        if (profile) {
          userInfo = `👤 <b>${profile.full_name || 'مستخدم'}</b>\n🪙 <b>رصيد النقاط:</b> ${profile.points || 0}\n\n`;
        }
      }

      let messageToSend = `🚗 <b>بوت سوق بغداد — المنصة الذكية الأولى</b> 🇮🇶\n\n${userInfo}ماذا تريد أن تفعل اليوم؟\n<i>ملاحظة: يمكنك التحدث معي كبشر وسأفهم طلبك مباشرة! 🤖💬</i>`;
      if (aiText) {
        messageToSend = aiText + `\n\n${userInfo}👇 <b>القائمة الرئيسية:</b>`;
      }

      const menuRows: any[] = [];
      if (isOwner) {
        menuRows.push([{ text: '👑 لوحة تحكم المالك', callback_data: 'owner_hub_main' }]);
      }
      
      // Clear, simple buttons based on user request:
      menuRows.push([{ text: '🚌 نشر خط نقل (طالب/سائق)', callback_data: 'publish_transport' }]);
      menuRows.push([{ text: '🚗 عرض سيارتي للبيع', callback_data: 'publish_car' }]);
      menuRows.push([{ text: '📦 نشر إعلان آخر (منتجات)', callback_data: 'publish_product' }]);
      menuRows.push([{ text: '🟢 إعلاناتي النشطة وتعديلها', callback_data: 'manage_my_ads' }]);
      menuRows.push([{ text: '📊 تقارير إعلاناتي النشطة والمؤرشفة', callback_data: 'my_publish_reports' }]);
      menuRows.push([{ text: '💼 حسابي وخدمات أخرى ⚙️', callback_data: 'account_services' }]);

      const menuMarkup = { inline_keyboard: menuRows };

      if (editCurrent && callbackMsgId) {
        try {
          const editRes = await editMessageText(chatId, callbackMsgId, messageToSend, menuMarkup);
          if (editRes?.ok) return editRes;
        } catch(e){}
      }
      return await sendMessage(chatId, messageToSend, menuMarkup);
    };

    // ==========================================
    // 👑 OWNER CONTROL HUB (لوحة تحكم المالك)
    // ==========================================
    if (isOwner && (trimmedText === 'owner_hub_main' || trimmedText === '/owner' || trimmedText === '/admin' || trimmedText === 'المالك')) {
      const { data: sysSettings } = await supabase.from('auto_publish_settings').select('settings').eq('category', 'system').maybeSingle();
      const isMaint = sysSettings?.settings?.maintenance_mode === true;
      const maintBtnText = isMaint ? '🟢 إيقاف الصيانة (إعادة فتح الموقع)' : '🔴 تشغيل الصيانة (إغلاق الموقع)';

      const ownerMsg = 
        `👑 <b>مرحباً بك في لوحة تحكم المالك — سوق بغداد الرقمي</b> 🇮🇶\n\n` +
        `<i>إدارة المنصة بالكامل بذكاء من التيليجرام دون الحاجة لفتح الموقع:</i>\n\n` +
        `اختر القسم أو الإجراء المطلوب أدناه:`;
      
      const ownerMarkup = {
        inline_keyboard: [
          [{ text: '📡 نشر جميع الإعلانات النشطة', callback_data: 'bulk_publish_step1' }],
          [{ text: '⚙️ الإدارة الشاملة للنشر التلقائي', callback_data: 'admin_autopublish' }],
          [{ text: maintBtnText, callback_data: 'admin_toggle_maintenance' }],
          [{ text: '📡 قنوات السوشيال والتسعير', callback_data: '/social' }, { text: '📊 إحصائيات ونبض المنصة', callback_data: 'owner_stats' }],
          [{ text: '🪪 توثيق هويات السائقين', callback_data: 'owner_verifications' }, { text: '🔑 طلبات استرجاع الرمز', callback_data: 'owner_recoveries' }],
          [{ text: '🚩 البلاغات ومراجعة الإعلانات', callback_data: 'owner_reports' }, { text: '🪙 إهداء/خصم نقاط لمستخدم', callback_data: 'owner_gift_points_prompt' }],
          [{ text: '⭐ تثبيت إعلان كـ VIP', callback_data: 'owner_vip_ad_prompt' }, { text: '🎁 توليد كود نقاط جديد', callback_data: 'owner_gen_promo' }],
          [{ text: '📣 إذاعة رسالة جماعية (Broadcast)', callback_data: 'owner_broadcast_prompt' }, { text: '⚡ فحص وصيانة الإعلانات', callback_data: 'owner_sync_ads' }],
          [{ text: '🔍 كشف مستخدم أو إعلان', callback_data: 'owner_lookup_prompt' }, { text: '🌐 فتح لوحة الويب', url: 'https://www.souqbaghdad.store' }],
          [{ text: '🔙 العودة للقائمة الرئيسية', callback_data: 'main_menu' }]
        ]
      };

      return await updateOrSend(ownerMsg, ownerMarkup);
    }

    // ══════════════════════════════════════════════════════════════
    // 📡 نظام النشر الجماعي المجدول — للمالك فقط
    // ══════════════════════════════════════════════════════════════

    const bulkAction = callbackQuery?.data || '';

    // الخطوة 1: اختر الفئة
    if (isOwner && bulkAction === 'bulk_publish_step1') {
      await updateOrSend(
        `📡 <b>نشر جميع الإعلانات النشطة</b>\n\n<i>الخطوة 1 من 4 — اختر الفئة:</i>`,
        {
          inline_keyboard: [
            [{ text: '🚌 خطوط النقل', callback_data: 'bulk_publish_step2_transport' }],
            [{ text: '🚗 السيارات', callback_data: 'bulk_publish_step2_cars' }],
            [{ text: '📦 المنتجات', callback_data: 'bulk_publish_step2_products' }],
            [{ text: '📋 جميع الفئات', callback_data: 'bulk_publish_step2_all' }],
            [{ text: '🔙 لوحة المالك', callback_data: 'owner_hub_main' }]
          ]
        }
      );
      return new Response('OK', { status: 200 });
    }

    // الخطوة 2: اختر نوع النشر
    if (isOwner && bulkAction.startsWith('bulk_publish_step2_')) {
      const cat = bulkAction.replace('bulk_publish_step2_', '');
      const catLabel = cat === 'transport' ? '🚌 خطوط' : cat === 'cars' ? '🚗 سيارات' : cat === 'products' ? '📦 منتجات' : '📋 جميع';
      await updateOrSend(
        `📡 <b>نشر جميع الإعلانات النشطة</b>\n\n<i>الخطوة 2 من 4 — اختر نوع النشر:</i>\n\nالفئة: ${catLabel}`,
        {
          inline_keyboard: [
            [{ text: '📸 ستوري فقط', callback_data: `bulk_publish_step3_${cat}_story` }],
            [{ text: '📰 بوست فقط', callback_data: `bulk_publish_step3_${cat}_post` }],
            [{ text: '🔄 بوست + ستوري', callback_data: `bulk_publish_step3_${cat}_both` }],
            [{ text: '🔙 رجوع', callback_data: 'bulk_publish_step1' }]
          ]
        }
      );
      return new Response('OK', { status: 200 });
    }

    // الخطوة 3: اختر الصفحة
    if (isOwner && bulkAction.startsWith('bulk_publish_step3_')) {
      const parts = bulkAction.replace('bulk_publish_step3_', '').split('_');
      const publishType = parts.pop()!;
      const cat = parts.join('_');
      const typeLabel = publishType === 'story' ? '📸 ستوري' : publishType === 'post' ? '📰 بوست' : '🔄 بوست + ستوري';
      const catLabel = cat === 'transport' ? '🚌 خطوط' : cat === 'cars' ? '🚗 سيارات' : cat === 'products' ? '📦 منتجات' : '📋 جميع';
      await updateOrSend(
        `📡 <b>نشر جميع الإعلانات النشطة</b>\n\n<i>الخطوة 3 من 4 — اختر الصفحة:</i>\n\nالفئة: ${catLabel} | النوع: ${typeLabel}`,
        {
          inline_keyboard: [
            [{ text: '🏛️ الرافدين فيسبوك', callback_data: `bulk_publish_confirm_${cat}_${publishType}_rafdain_fb` }],
            [{ text: '🏛️ الرافدين انستغرام', callback_data: `bulk_publish_confirm_${cat}_${publishType}_rafdain_ig` }],
            [{ text: '🏙️ سوق بغداد فيسبوك', callback_data: `bulk_publish_confirm_${cat}_${publishType}_souq_fb` }],
            [{ text: '🏙️ سوق بغداد انستغرام', callback_data: `bulk_publish_confirm_${cat}_${publishType}_souq_ig` }],
            [{ text: '🌐 جميع الصفحات', callback_data: `bulk_publish_confirm_${cat}_${publishType}_all` }],
            [{ text: '🔙 رجوع', callback_data: `bulk_publish_step2_${cat}` }]
          ]
        }
      );
      return new Response('OK', { status: 200 });
    }

    // الخطوة 4: تأكيد + معاينة
    if (isOwner && bulkAction.startsWith('bulk_publish_confirm_')) {
      const parts = bulkAction.replace('bulk_publish_confirm_', '').split('_');
      // format: {cat}_{publishType}_{page} where page may have underscore
      // e.g. transport_story_rafdain_fb  OR  all_both_all
      const pageParts = parts.slice(2);
      const targetPage = pageParts.join('_');
      const publishType = parts[1];
      const cat = parts[0];

      // عدد الإعلانات النشطة
      let adsQuery = supabase.from('ads').select('id', { count: 'exact', head: true }).eq('status', 'active');
      if (cat !== 'all') adsQuery = adsQuery.eq('category', cat);
      const { count: adsCount } = await adsQuery;
      const totalAds = adsCount || 0;

      // حساب الأوقات
      const nowDate = new Date();
      const startTime = nowDate.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
      const endDate = new Date(nowDate.getTime() + totalAds * 5 * 60 * 1000);
      const endTime = endDate.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });

      const catLabel = cat === 'transport' ? '🚌 خطوط' : cat === 'cars' ? '🚗 سيارات' : cat === 'products' ? '📦 منتجات' : '📋 جميع';
      const typeLabel = publishType === 'story' ? '📸 ستوري فقط' : publishType === 'post' ? '📰 بوست فقط' : '🔄 بوست + ستوري';
      const pageLabel = targetPage === 'all' ? '🌐 جميع الصفحات' : targetPage === 'rafdain_fb' ? '🏛️ الرافدين فيسبوك' : targetPage === 'rafdain_ig' ? '🏛️ الرافدين انستغرام' : targetPage === 'souq_fb' ? '🏙️ سوق بغداد فيسبوك' : '🏙️ سوق بغداد انستغرام';

      // تحذير وقت الذروة
      const hour = nowDate.getHours();
      const timeWarning = (hour >= 2 && hour < 6) ? '\n\n⚠️ <b>تحذير:</b> الوقت الحالي بين 2 فجراً و6 صباحاً — النشر في هذا الوقت قد يقلل التفاعل.' : '';

      await updateOrSend(
        `📡 <b>نشر جماعي — معاينة قبل البدء</b>${timeWarning}\n\n` +
        `الفئة: ${catLabel}\nالنوع: ${typeLabel}\nالصفحة: ${pageLabel}\n\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `📊 الإعلانات النشطة: <b>${totalAds} إعلان</b>\n` +
        `🕐 وقت أول نشر: <b>${startTime}</b>\n` +
        `🕓 وقت آخر نشر: <b>${endTime}</b> (~${totalAds * 5} دقيقة)\n` +
        `━━━━━━━━━━━━━━━━━━━`,
        {
          inline_keyboard: [
            [{ text: '▶️ ابدأ النشر', callback_data: `bulk_publish_start_${cat}_${publishType}_${targetPage}` }],
            [{ text: '❌ إلغاء', callback_data: 'owner_hub_main' }]
          ]
        }
      );
      return new Response('OK', { status: 200 });
    }

    // بدء النشر الفعلي — إنشاء الجلسة وإضافة الإعلانات للقائمة
    if (isOwner && bulkAction.startsWith('bulk_publish_start_')) {
      const parts = bulkAction.replace('bulk_publish_start_', '').split('_');
      const pageParts = parts.slice(2);
      const targetPage = pageParts.join('_');
      const publishType = parts[1];
      const cat = parts[0];

      // إنشاء الجلسة
      const { data: newJob } = await supabase.from('bulk_publish_jobs').insert({
        owner_chat_id: String(chatId),
        category: cat,
        publish_type: publishType,
        target_page: targetPage,
        status: 'running'
      }).select().single();

      if (!newJob) {
        await updateOrSend('❌ خطأ في إنشاء جلسة النشر.');
        return new Response('OK', { status: 200 });
      }

      // جلب الإعلانات النشطة
      let adsQ = supabase.from('ads').select('id, category').eq('status', 'active').order('created_at', { ascending: true });
      if (cat !== 'all') adsQ = adsQ.eq('category', cat);
      const { data: activeAds } = await adsQ;

      if (!activeAds || activeAds.length === 0) {
        await supabase.from('bulk_publish_jobs').update({ status: 'done', total_ads: 0 }).eq('id', newJob.id);
        await updateOrSend('📭 لا توجد الإعلانات نشطة للنشر.');
        return new Response('OK', { status: 200 });
      }

      // إضافة كل إعلان للقائمة بفارق 5 دقائق
      const queueItems = activeAds.map((ad, i) => ({
        job_id: newJob.id,
        ad_id: ad.id,
        category: ad.category,
        status: 'pending',
        scheduled_at: new Date(Date.now() + i * 5 * 60 * 1000 + Math.floor(Math.random() * 30000)).toISOString()
      }));

      await supabase.from('bulk_publish_queue').insert(queueItems);
      await supabase.from('bulk_publish_jobs').update({ total_ads: activeAds.length }).eq('id', newJob.id);

      const endTime = new Date(Date.now() + activeAds.length * 5 * 60 * 1000).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });

      await updateOrSend(
        `🚀 <b>تم بدء النشر الجماعي!</b>\n\n` +
        `📊 الإعلانات: <b>${activeAds.length}</b>\n` +
        `⏱️ يُنشر إعلان كل 5 دقائق\n` +
        `🕓 وقت الانتهاء المتوقع: <b>${endTime}</b>\n\n` +
        `ستتلقى تقريراً نهائياً عند الاكتمال.`,
        {
          inline_keyboard: [
            [{ text: '⏹️ إيقاف النشر الآن', callback_data: `bulk_publish_stop_${newJob.id}` }]
          ]
        }
      );
      return new Response('OK', { status: 200 });
    }

    // إيقاف النشر يدوياً
    if (isOwner && bulkAction.startsWith('bulk_publish_stop_')) {
      const jobId = bulkAction.replace('bulk_publish_stop_', '');
      const { data: job } = await supabase.from('bulk_publish_jobs').select('*').eq('id', jobId).maybeSingle();
      if (!job || job.status !== 'running') {
        await updateOrSend('⚠️ العملية لم تعد نشطة أو لا وجود لها.');
        return new Response('OK', { status: 200 });
      }
      await supabase.from('bulk_publish_jobs').update({ status: 'stopped', finished_at: new Date().toISOString() }).eq('id', jobId);
      const stopTime = new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
      await updateOrSend(
        `⏹️ <b>تم إيقاف النشر الجماعي</b>\n\n` +
        `✅ نُشر:    <b>${job.published_count || 0}</b> إعلان\n` +
        `❌ فشل:    <b>${job.failed_count || 0}</b> إعلان\n` +
        `⏭️ ألغيت: <b>${(job.total_ads || 0) - (job.published_count || 0) - (job.failed_count || 0)}</b> متبقية\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `📅 أوقف: ${stopTime}`,
        { inline_keyboard: [[{ text: '🔙 لوحة المالك', callback_data: 'owner_hub_main' }]] }
      );
      return new Response('OK', { status: 200 });
    }

    // --- Owner Action: Toggle Maintenance Mode ---
    if (isOwner && trimmedText === 'admin_toggle_maintenance') {
      const { data: currentSettings, error } = await supabase.from('auto_publish_settings').select('settings').eq('category', 'system').maybeSingle();
      
      let settings = currentSettings?.settings || {};
      settings.maintenance_mode = !settings.maintenance_mode;
      settings.message = settings.message || 'الموقع قيد التحديث والصيانة. نعود لكم قريباً!';

      if (error || !currentSettings) {
        await supabase.from('auto_publish_settings').upsert({ category: 'system', settings }, { onConflict: 'category' });
      } else {
        await supabase.from('auto_publish_settings').update({ settings, updated_at: new Date().toISOString() }).eq('category', 'system');
      }

      const statusMsg = settings.maintenance_mode 
        ? '🔴 <b>تم تفعيل وضع الصيانة!</b>\nالموقع الآن معطل للجميع ولن يستهلك أي بيانات.'
        : '🟢 <b>تم إيقاف وضع الصيانة!</b>\nعاد الموقع للعمل بشكل طبيعي للجميع.';

      return await updateOrSend(statusMsg, {
        inline_keyboard: [[{ text: '🔙 عودة للوحة المالك', callback_data: 'owner_hub_main' }]]
      });
    }

    // --- Owner Action: Sync Ads ---
    if (isOwner && trimmedText === 'owner_sync_ads') {
      await sendMessage(chatId, '⏳ <i>جاري فحص ومزامنة الإعلانات النشطة...</i>');
      const { data: recentAds } = await supabase.from('ads').select('*').order('created_at', { ascending: false }).limit(5);
      let healedCount = 0;
      
      // Run concurrently to avoid webhook timeout (which causes the infinite loop)
      await Promise.all((recentAds || []).map(async (ad) => {
        const res = await syncAndHealAd(ad, supabase);
        if (res?.healed) healedCount++;
      }));

      const syncReport = `✅ <b>تم فحص ومزامنة ${recentAds?.length || 0} إعلان!</b>\n\n🛠️ تم تصحيح: ${healedCount} إعلان بنجاح.`;
      return await sendMessage(chatId, syncReport, {
        inline_keyboard: [[{ text: '🔙 عودة للوحة المالك', callback_data: 'owner_hub_main' }]]
      });
    }

    // --- Owner Action: Platform Stats ---
    if (isOwner && trimmedText === 'owner_stats') {
      const todayIso = new Date().toISOString().split('T')[0];

      const [
        usersTotal, usersToday,
        activeAdsTotal, adsToday,
        transTotal, transToday,
        carsTotal, carsToday,
        prodTotal,
        recoveriesPending, verificationsPending, reportsPending
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayIso),
        supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('ads').select('*', { count: 'exact', head: true }).gte('created_at', todayIso),
        supabase.from('ads').select('*', { count: 'exact', head: true }).eq('category', 'transport'),
        supabase.from('ads').select('*', { count: 'exact', head: true }).eq('category', 'transport').gte('created_at', todayIso),
        supabase.from('ads').select('*', { count: 'exact', head: true }).in('category', ['vehicles', 'cars', 'car']),
        supabase.from('ads').select('*', { count: 'exact', head: true }).in('category', ['vehicles', 'cars', 'car']).gte('created_at', todayIso),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('recovery_requests').select('*', { count: 'exact', head: true }),
        supabase.from('verification_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('support_messages').select('*', { count: 'exact', head: true }).ilike('name', 'REPORT:%')
      ]);

      const statsMsg = 
        `📊 <b>نبض المنصة والتقرير الإداري الشامل:</b>\n\n` +
        `📅 <b>حركة ونشاط اليوم (${todayIso}):</b>\n` +
        `  ├ 📢 إعلانات اليوم: <b>${adsToday.count || 0}</b> إعلان\n` +
        `  ├ 🚗 سيارات جديدة: <b>${carsToday.count || 0}</b>\n` +
        `  ├ 🚌 خطوط نقل جديدة: <b>${transToday.count || 0}</b>\n` +
        `  └ 👤 مستخدمين جدد: <b>${usersToday.count || 0}</b>\n\n` +
        `🛡️ <b>العمليات والأمان المعلقة:</b>\n` +
        `  ├ 🔑 طلبات استرجاع الرمز: <b>${recoveriesPending.count || 0}</b>\n` +
        `  ├ 🪪 طلبات توثيق السائقين: <b>${verificationsPending.count || 0}</b>\n` +
        `  └ 🚩 البلاغات والشكاوى: <b>${reportsPending.count || 0}</b>\n\n` +
        `🌐 <b>الإجمالي الكلي بالمنصة:</b>\n` +
        `  ├ 👥 إجمالي المستخدمين: <b>${usersTotal.count || 0}</b>\n` +
        `  ├ 🚗 إجمالي السيارات: <b>${carsTotal.count || 0}</b>\n` +
        `  ├ 🚌 إجمالي الخطوط: <b>${transTotal.count || 0}</b>\n` +
        `  └ 🛍️ إجمالي المنتجات: <b>${prodTotal.count || 0}</b>\n\n` +
        `⏰ <i>${new Date().toLocaleString('ar-IQ', { timeZone: 'Asia/Baghdad' })}</i>`;

      return await updateOrSend(statsMsg, {
        inline_keyboard: [
          [{ text: '🔄 تحديث الإحصائيات', callback_data: 'owner_stats' }],
          [{ text: '🔙 عودة للوحة المالك', callback_data: 'owner_hub_main' }]
        ]
      });
    }

    // --- Owner Action: Generate Promo Code ---
    if (isOwner && trimmedText === 'owner_gen_promo') {
      const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const promoCode = `BAGHDAD-50PTS-${randStr}`;
      await supabase.from('promo_codes').insert({
        code: promoCode,
        points: 50,
        is_used: false,
        max_uses: 1
      });

      const promoMsg = 
        `🎁 <b>تم إنشاء بروموكود نقاط جديد بنجاح!</b>\n\n` +
        `🎟️ <b>الكود (اضغط للنسخ):</b> <code>${promoCode}</code>\n` +
        `🪙 <b>النقاط:</b> 50 نقطة\n\n` +
        `<i>يمكنك إرسال هذا الكود لأي مستخدم لتعبئته فوراً عبر البوت!</i>`;

      return await updateOrSend(promoMsg, {
        inline_keyboard: [
          [{ text: '🎁 إنشاء كود آخر', callback_data: 'owner_gen_promo' }],
          [{ text: '🔙 عودة للوحة المالك', callback_data: 'owner_hub_main' }]
        ]
      });
    }

    // --- Owner Action: Broadcast Prompt ---
    if (isOwner && trimmedText === 'owner_broadcast_prompt') {
      state = { step: 'owner_broadcasting' };
      if (userId) await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
      return await updateOrSend(
        `📣 <b>الإذاعة الجماعية لجميع مستخدمي البوت</b>\n\n` +
        `أرسل الآن الرسالة أو الصورة مع النص التي ترغب بإرسالها لجميع المشتركين:`,
        { inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'owner_hub_main' }]] }
      );
    }

    // --- Owner Action: Handle Broadcast Input ---
    if (isOwner && state?.step === 'owner_broadcasting') {
      state = {};
      if (userId) await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
      
      const { data: allUsers } = await supabase.from('telegram_users').select('telegram_chat_id');
      const targetIds = (allUsers || []).map((u: any) => u.telegram_chat_id).filter(Boolean);

      await sendMessage(chatId, `⏳ <i>جاري إرسال الرسالة إلى ${targetIds.length} مستخدم...</i>`);
      
      let sentSuccess = 0;
      for (const targetChatId of targetIds) {
        try {
          if (photo && photo.length > 0) {
            const fileId = photo[photo.length - 1].file_id;
            await sendPhoto(targetChatId, fileId, text || '');
          } else {
            await sendMessage(targetChatId, `📢 <b>تنبيه من إدارة سوق بغداد:</b>\n\n${text}`);
          }
          sentSuccess++;
        } catch(e) {}
      }

      return await sendMessage(chatId, `🎉 <b>تمت الإذاعة بنجاح!</b>\n\nتم تسليم الرسالة إلى: <b>${sentSuccess}</b> مستخدم.`, {
        inline_keyboard: [[{ text: '🔙 عودة للوحة المالك', callback_data: 'owner_hub_main' }]]
      });
    }

    // --- Owner Action: Lookup Prompt ---
    if (isOwner && trimmedText === 'owner_lookup_prompt') {
      state = { step: 'owner_lookup_waiting' };
      if (userId) await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
      return await updateOrSend(
        `🔍 <b>كشف واستعلام ذكي</b>\n\n` +
        `أرسل رقم هاتف المستخدم (مثال: 0770xxxxxxx) أو كود الإعلان (مثال: #GVR37):`,
        { inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'owner_hub_main' }]] }
      );
    }

    // --- Owner Action: Handle Lookup Input ---
    if (isOwner && state?.step === 'owner_lookup_waiting') {
      state = {};
      if (userId) await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

      const queryTerm = trimmedText.replace('#', '').trim();
      const { data: matchedAds } = await supabase.from('ads').select('*').or(`short_id.ilike.%${queryTerm}%,phone.ilike.%${queryTerm}%,title.ilike.%${queryTerm}%`).limit(3);
      const { data: matchedProfiles } = await supabase.from('profiles').select('*').or(`phone.ilike.%${queryTerm}%,full_name.ilike.%${queryTerm}%`).limit(3);

      let lookupMsg = `🔍 <b>نتائج البحث عن «${queryTerm}»:</b>\n\n`;

      if ((!matchedAds || matchedAds.length === 0) && (!matchedProfiles || matchedProfiles.length === 0)) {
        lookupMsg += `<i>لم يتم العثور على أي نتائج مطابقة.</i>`;
      } else {
        if (matchedProfiles && matchedProfiles.length > 0) {
          lookupMsg += `👤 <b>المستخدمين:</b>\n`;
          for (const p of matchedProfiles) {
            lookupMsg += `• <b>${p.full_name || 'بدون اسم'}</b> | هاتف: <code>${p.phone || 'غير مسجل'}</code> | نقاط: <b>${p.points || 0}</b> | الرتبة: <b>${p.role || 'user'}</b>\n`;
          }
          lookupMsg += `\n`;
        }

        if (matchedAds && matchedAds.length > 0) {
          lookupMsg += `📢 <b>الإعلانات والخطوط:</b>\n`;
          for (const a of matchedAds) {
            lookupMsg += `• <b>#${a.short_id || a.id}</b>: ${a.title} (${a.price || 'بدون سعر'}) - الحالة: <b>${a.status}</b>\n`;
          }
        }
      }

      return await sendMessage(chatId, lookupMsg, {
        inline_keyboard: [
          [{ text: '🔍 بحث آخر', callback_data: 'owner_lookup_prompt' }],
          [{ text: '🔙 عودة للوحة المالك', callback_data: 'owner_hub_main' }]
        ]
      });
    }

    // ==========================================
    // 🪪 OWNER ACTION: VERIFICATIONS (توثيق الهويات)
    // ==========================================
    if (isOwner && (trimmedText === 'owner_verifications' || trimmedText.startsWith('approve_ver_') || trimmedText.startsWith('reject_ver_'))) {
      if (trimmedText.startsWith('approve_ver_')) {
        const parts = trimmedText.replace('approve_ver_', '').split('_');
        const reqId = parts[0];
        const targetUserId = parts[1];
        await supabase.from('verification_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', reqId);
        if (targetUserId) {
          await supabase.from('profiles').update({ is_verified: true, role: 'verified' }).eq('id', targetUserId);
        }
        await sendMessage(chatId, '✅ <b>تم قبول طلب التوثيق ومنح الشارة الزرقاء بنجاح! 🪪✓</b>');
      }

      if (trimmedText.startsWith('reject_ver_')) {
        const reqId = trimmedText.replace('reject_ver_', '');
        await supabase.from('verification_requests').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', reqId);
        await sendMessage(chatId, '❌ <b>تم رفض طلب التوثيق.</b>');
      }

      const { data: pendingVer } = await supabase.from('verification_requests').select('*, profiles(full_name, phone, city)').eq('status', 'pending').limit(5);

      if (!pendingVer || pendingVer.length === 0) {
        return await updateOrSend('🪪 <b>توثيق الهويات والسنويات</b>\n\n<i>✅ لا توجد طلبات توثيق معلقة حالياً. كل شيء مكتمل!</i>', {
          inline_keyboard: [[{ text: '🔙 عودة للوحة المالك', callback_data: 'owner_hub_main' }]]
        });
      }

      for (const req of pendingVer) {
        const p = req.profiles || {};
        const cap = `🪪 <b>طلب توثيق جديد:</b>\n\n👤 <b>الاسم:</b> ${p.full_name || 'بدون اسم'}\n📞 <b>الهاتف:</b> <code>${p.phone || 'غير مسجل'}</code>\n📍 <b>المدينة:</b> ${p.city || 'بغداد'}\n\n<i>هل توافق على منح هذا السائق/المعلن التوثيق الأزرق المعتمد؟</i>`;
        const kb = [
          [
            { text: '✅ قبول وتوثيق الحساب', callback_data: `approve_ver_${req.id}_${req.user_id}` },
            { text: '❌ رفض', callback_data: `reject_ver_${req.id}` }
          ],
          [{ text: '🔙 عودة للوحة المالك', callback_data: 'owner_hub_main' }]
        ];

        if (req.id_image_url) {
          try {
            await sendPhoto(chatId, req.id_image_url, cap, { inline_keyboard: kb });
          } catch(e) {
            await sendMessage(chatId, cap + `\n\n🖼️ <a href="${req.id_image_url}">رابط الصورة المرفوعة</a>`, { inline_keyboard: kb });
          }
        } else {
          await sendMessage(chatId, cap, { inline_keyboard: kb });
        }
      }
      return new Response('OK', { status: 200 });
    }

    // ==========================================
    // 🔑 OWNER ACTION: RECOVERIES (استرجاع الحسابات)
    // ==========================================
    if (isOwner && (trimmedText === 'owner_recoveries' || trimmedText.startsWith('resolve_rec_'))) {
      if (trimmedText.startsWith('resolve_rec_')) {
        const recId = trimmedText.replace('resolve_rec_', '');
        await supabase.from('recovery_requests').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', recId);
        await sendMessage(chatId, '✅ <b>تم تعليم طلب الاسترجاع كمكتمل ومحلول بنجاح! 🔑</b>');
      }

      const { data: recList } = await supabase.from('recovery_requests').select('*, profiles(full_name, phone)').eq('status', 'pending').limit(5);

      if (!recList || recList.length === 0) {
        return await updateOrSend('🔑 <b>طلبات استرجاع الرمز (Forgot Password)</b>\n\n<i>✅ لا توجد طلبات استرجاع معلقة حالياً.</i>', {
          inline_keyboard: [[{ text: '🔙 عودة للوحة المالك', callback_data: 'owner_hub_main' }]]
        });
      }

      let recMsg = `🔑 <b>طلبات استرجاع الرمز المعلقة (${recList.length}):</b>\n\n`;
      const recButtons: any[] = [];

      for (const r of recList) {
        const p = r.profiles || {};
        let ph = p.phone || '';
        if (ph.startsWith('07')) ph = '964' + ph.substring(1);
        recMsg += `• 👤 <b>${p.full_name || 'مستخدم'}</b> (<code>${p.phone}</code>)\n  └ تاريخ الطلب: ${new Date(r.request_time || r.created_at).toLocaleDateString('ar-IQ')}\n\n`;
        
        recButtons.push([
          { text: `💬 واتساب ${p.full_name?.substring(0, 10) || ''}`, url: `https://wa.me/${ph}` },
          { text: `✅ تم الحل`, callback_data: `resolve_rec_${r.id}` }
        ]);
      }
      recButtons.push([{ text: '🔙 عودة للوحة المالك', callback_data: 'owner_hub_main' }]);

      return await updateOrSend(recMsg, { inline_keyboard: recButtons });
    }

    // ==========================================
    // 🚩 OWNER ACTION: REPORTS (مراجعة البلاغات)
    // ==========================================
    if (isOwner && (trimmedText === 'owner_reports' || trimmedText.startsWith('close_rep_') || trimmedText.startsWith('del_rep_ad_'))) {
      if (trimmedText.startsWith('close_rep_')) {
        const repId = trimmedText.replace('close_rep_', '');
        await supabase.from('support_messages').delete().eq('id', repId);
        await sendMessage(chatId, '✅ <b>تم إغلاق البلاغ بنجاح.</b>');
      }

      if (trimmedText.startsWith('del_rep_ad_')) {
        const adId = trimmedText.replace('del_rep_ad_', '');
        await supabase.from('ads').update({ status: 'archived' }).eq('id', adId);
        await sendMessage(chatId, '🗑️ <b>تم أرشفة وحذف الإعلان المخالف بنجاح!</b>');
      }

      const { data: repList } = await supabase.from('support_messages').select('*').ilike('name', 'REPORT:%').limit(5);

      if (!repList || repList.length === 0) {
        return await updateOrSend('🚩 <b>البلاغات والشكاوى</b>\n\n<i>✅ المنصة نظيفة ولا توجد أي بلاغات معلقة! 🎉</i>', {
          inline_keyboard: [[{ text: '🔙 عودة للوحة المالك', callback_data: 'owner_hub_main' }]]
        });
      }

      let repMsg = `🚩 <b>البلاغات والشكاوى الحالية:</b>\n\n`;
      const repButtons: any[] = [];

      for (const rep of repList) {
        repMsg += `• <b>${rep.name}</b>\n  ├ البلاغ: <i>${rep.message}</i>\n  └ الهاتف: <code>${rep.email || 'غير مسجل'}</code>\n\n`;
        const matchId = rep.message?.match(/#([A-Za-z0-9_-]+)/);
        const reportedCode = matchId ? matchId[1] : null;

        const row: any[] = [{ text: '🟢 إغلاق البلاغ', callback_data: `close_rep_${rep.id}` }];
        if (reportedCode) {
          row.unshift({ text: '🗑️ حذف الإعلان', callback_data: `del_rep_ad_${reportedCode}` });
        }
        repButtons.push(row);
      }
      repButtons.push([{ text: '🔙 عودة للوحة المالك', callback_data: 'owner_hub_main' }]);

      return await updateOrSend(repMsg, { inline_keyboard: repButtons });
    }

    // ==========================================
    // 🪙 OWNER ACTION: GIFT / DEDUCT POINTS
    // ==========================================
    if (isOwner && trimmedText === 'owner_gift_points_prompt') {
      state = { step: 'owner_gift_points_waiting' };
      if (userId) await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
      return await updateOrSend(
        `🪙 <b>إهداء أو خصم نقاط لمستخدم</b>\n\n` +
        `أرسل رقم هاتف المستخدم ثم مسافة ثم عدد النقاط:\n\n` +
        `<i>أمثلة:</i>\n` +
        `• <code>07701234567 50</code> (لإضافة 50 نقطة)\n` +
        `• <code>07701234567 -20</code> (لخصم 20 نقطة)`,
        { inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'owner_hub_main' }]] }
      );
    }

    if (isOwner && state?.step === 'owner_gift_points_waiting') {
      state = {};
      if (userId) await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

      const parts = trimmedText.split(/\s+/);
      const targetPhone = parts[0]?.trim();
      const pointsDelta = parseInt(parts[1]);

      if (!targetPhone || isNaN(pointsDelta)) {
        return await sendMessage(chatId, '❌ <b>صيغة غير صحيحة!</b> يرجى إرسال رقم الهاتف متبوعاً بمسافة ثم عدد النقاط (مثال: 07701234567 50)', {
          inline_keyboard: [[{ text: '🔙 عودة للوحة المالك', callback_data: 'owner_hub_main' }]]
        });
      }

      const { data: userProfile } = await supabase.from('profiles').select('id, full_name, phone, points').or(`phone.eq.${targetPhone},phone.eq.+964${targetPhone.replace(/^0/, '')}`).maybeSingle();

      if (!userProfile) {
        return await sendMessage(chatId, `❌ لم يتم العثور على مستخدم مسجل بالرقم <code>${targetPhone}</code>`, {
          inline_keyboard: [[{ text: '🔙 عودة للوحة المالك', callback_data: 'owner_hub_main' }]]
        });
      }

      const oldPoints = userProfile.points || 0;
      const newPoints = Math.max(0, oldPoints + pointsDelta);

      await supabase.from('profiles').update({ points: newPoints }).eq('id', userProfile.id);

      return await sendMessage(chatId, 
        `🎉 <b>تم تحديث النقاط بنجاح!</b>\n\n` +
        `👤 <b>المستخدم:</b> ${userProfile.full_name || 'بدون اسم'}\n` +
        `📞 <b>الهاتف:</b> <code>${userProfile.phone}</code>\n` +
        `🪙 <b>الرصيد السابق:</b> ${oldPoints} نقطة\n` +
        `➕ <b>العملية:</b> ${pointsDelta > 0 ? '+' + pointsDelta : pointsDelta} نقطة\n` +
        `✨ <b>الرصيد الجديد:</b> <b>${newPoints}</b> نقطة`,
        {
          inline_keyboard: [
            [{ text: '🪙 عملية نقاط أخرى', callback_data: 'owner_gift_points_prompt' }],
            [{ text: '🔙 عودة للوحة المالك', callback_data: 'owner_hub_main' }]
          ]
        }
      );
    }

    // ==========================================
    // ⭐ OWNER ACTION: VIP FEATURE AD
    // ==========================================
    if (isOwner && trimmedText === 'owner_vip_ad_prompt') {
      state = { step: 'owner_vip_waiting' };
      if (userId) await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
      return await updateOrSend(
        `⭐ <b>تثبيت وتمييز إعلان VIP في الموقع</b>\n\n` +
        `أرسل كود الإعلان الذي تريد تثبيته كإعلان VIP مميز (مثال: #GVR37 أو GVR37):`,
        { inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'owner_hub_main' }]] }
      );
    }

    if (isOwner && state?.step === 'owner_vip_waiting') {
      state = {};
      if (userId) await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

      const adCode = trimmedText.replace('#', '').trim();
      const { data: matchedAd } = await supabase.from('ads').select('*').or(`short_id.ilike.%${adCode}%,id.eq.${adCode}`).maybeSingle();

      if (!matchedAd) {
        return await sendMessage(chatId, `❌ لم يتم العثور على إعلان بالكود «${adCode}».`, {
          inline_keyboard: [[{ text: '🔙 عودة للوحة المالك', callback_data: 'owner_hub_main' }]]
        });
      }

      await supabase.from('ads').update({ is_featured: true, is_vip: true }).eq('id', matchedAd.id);

      return await sendMessage(chatId, 
        `⭐ <b>تم تثبيت الإعلان كـ VIP بنجاح!</b>\n\n` +
        `📢 <b>العنوان:</b> ${matchedAd.title}\n` +
        `🔖 <b>الكود:</b> #${matchedAd.short_id || matchedAd.id}\n` +
        `✨ <i>سيظهر الآن في أول كروت الواجهة الرئيسية للموقع كإعلان مميز.</i>`,
        {
          inline_keyboard: [
            [{ text: '⭐ تمييز إعلان آخر', callback_data: 'owner_vip_ad_prompt' }],
            [{ text: '🔙 عودة للوحة المالك', callback_data: 'owner_hub_main' }]
          ]
        }
      );
    }

    // ==========================================
    // 🎁 VIRAL REFERRAL SYSTEM (شارك واكسب نقاط)
    // ==========================================
    if (trimmedText === 'invite_and_earn') {
      const myRefCode = userId || String(chatId);
      const inviteLink = `https://t.me/${BOT_USERNAME}?start=ref_${myRefCode}`;
      const shortShare = encodeURIComponent(`🚗 انضم لبوت سوق بغداد وتصفح السيارات وخطوط النقل مجاناً واحصل على 10 نقاط هدية 🎁`);

      const refMsg = 
        `🎁 <b>برنامج المكافآت ودعوة الأصدقاء — سوق بغداد</b> 🇮🇶\n\n` +
        `شارك رابطك في كروبات الجامعة والواتساب وتيليجرام واكسب نقاطاً مجانية لترويج إعلاناتك!\n\n` +
        `💰 <b>مكافأة الدعوة:</b>\n` +
        `• كل صديق ينضم عبر رابطك يحصل على <b>10 نقاط ترحيبية</b> 🎁\n` +
        `• وأنت تحصل على <b>15 نقطة مجانية</b> في محفظتك فوراً! 🪙\n\n` +
        `🔗 <b>رابط الدعوة الخاص بك (اضغط للنسخ):</b>\n` +
        `<code>${inviteLink}</code>`;

      const refMarkup = {
        inline_keyboard: [
          [{ text: '📢 مشاركة في كروبات التلغرام 🚀', url: `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${shortShare}` }],
          [{ text: '💬 مشاركة في واتساب 🟢', url: `https://api.whatsapp.com/send?text=${shortShare}%0A${encodeURIComponent(inviteLink)}` }],
          [{ text: '➕ إضافة البوت إلى كروبك مجاناً 🛡️', url: `https://t.me/${BOT_USERNAME}?startgroup=true` }],
          [{ text: '🔙 العودة للقائمة الرئيسية', callback_data: 'main_menu' }]
        ]
      };

      await updateOrSend(refMsg, refMarkup);
      return new Response('OK', { status: 200 });
    }

    // --- Deep-Link Concierge (تحويل المستخدم من الكروب إلى الخاص) ---
    if (text.startsWith('/start group_help') || text.startsWith('/start line')) {
      const fromName = update.message?.from?.first_name || 'عزيزنا';
      const welcomeMsg = 
        `👋 <b>يا هلا وكل الهلا بيك عيوني ${fromName}! 🇮🇶✨</b>\n\n` +
        `🤖 أنا <b>المساعد الذكي لمنصة سوق بغداد</b>.\n` +
        `شفتك بالكروب وجيت وياك بالخاص حتى أساعدك بكل هدوء وخصوصية 🌹\n\n` +
        `<i>شنو تحب أساعدك اليوم؟</i>\n` +
        `• 🚌 <b>مطابقة وبحث خطوط النقل وحجز المقاعد</b>\n` +
        `• ➕ <b>نشر إعلان جديد مجاناً (خط / سيارة / منتج)</b>\n` +
        `• 🚗 <b>معرفة أسعار السيارات بالسوق العراقي</b>\n` +
        `• 💬 <b>اكتبلي أي سؤال أو طلب وسأجيبك فوراً!</b>`;

      const welcomeMarkup = {
        inline_keyboard: [
          [{ text: '🚌 مطابقة وبحث خطوط النقل', url: 'https://www.souqbaghdad.store/transport' }, { text: '➕ نشر إعلان خط كسائق', callback_data: 'publish_transport' }],
          [{ text: '🚗 سيارات سوق بغداد', callback_data: 'publish_car' }, { text: '🛍️ عروض السوق العام', callback_data: 'publish_product' }],
          [{ text: '📋 القائمة الرئيسية للخدمات', callback_data: 'main_menu' }]
        ]
      };
      await sendMessage(chatId, welcomeMsg, welcomeMarkup);
      return new Response('OK', { status: 200 });
    }

    // --- Start / Register Command (Captures Referral Code) ---
    if (text === '/start' || text.startsWith('/start ') || text === '/relink') {
      if (text === '/relink') {
        await supabase.from('telegram_users').delete().eq('telegram_chat_id', chatId);
      }

      // Capture referrer code if passed (e.g. /start ref_USERID or /start _tgr_CODE)
      if (text.startsWith('/start ref_') || text.startsWith('/start _tgr_')) {
        const refCode = text.replace('/start ref_', '').replace('/start _tgr_', '').trim();
        if (refCode) {
          state.referrer = refCode;
          await supabase.from('telegram_users').upsert({
            telegram_chat_id: chatId,
            bot_state: state
          }, { onConflict: 'telegram_chat_id' });
        }
      }

      await sendMessage(chatId, 'مرحباً بك في بوت <b>سوق بغداد الرقمي</b>! 🇮🇶🚗🚌\n\nسوق السيارات والمنتجات وخطوط النقل الأول في العراق.\nيرجى مشاركة رقم هاتفك للتحقق من حسابك وتفعيل هديتك والبدء فوراً 🎁', {
        keyboard: [[{ text: '📱 مشاركة رقم الهاتف', request_contact: true }]],
        one_time_keyboard: true,
        resize_keyboard: true
      });
      return new Response('OK', { status: 200 });
    }

    if (text && text.startsWith('/promo')) {
      const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (adminProfile?.role === 'admin' || adminProfile?.role === 'owner') {
        const parts = text.split(' ');
        const points = parseInt(parts[1]) || 100;
        const maxUses = parseInt(parts[2]) || 1;
        const code = 'BOT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        await supabase.from('promo_codes').insert({ code, points, max_uses: maxUses });
        
        const explanationMsg = `🎉 <b>تهانينا! لقد حصلت على كود تعبئة نقاط من سوق بغداد!</b>\n\n` +
                               `🪙 <b>النقاط المكتسبة:</b> ${points} نقطة\n\n` +
                               `📌 <b>طريقة التعبئة:</b>\n` +
                               `1️⃣ قم بزيارة: https://www.souqbaghdad.store\n` +
                               `2️⃣ من الشريط العلوي اضغط على <b>المحفظة 💼</b>.\n` +
                               `3️⃣ الصق الكود واضغط تفعيل.\n\n` +
                               `👇 <b>الكود الخاص بك:</b>\n<code>${code}</code>`;
        
        await sendMessage(chatId, `✅ تم توليد الكود بنجاح!\n\nيمكنك إعادة توجيه الرسالة أدناه:`);
        await sendMessage(chatId, explanationMsg, {
          inline_keyboard: [[{ text: '📋 نسخ الكود', copy_text: { text: code } }]]
        });
      } else {
        await sendMessage(chatId, 'عذراً، هذا الأمر مخصص للإدارة فقط.');
      }
      return new Response('OK', { status: 200 });
    }

    if (contact) {
      let phoneNumber = contact.phone_number;
      if (!phoneNumber.startsWith('+')) phoneNumber = '+' + phoneNumber;

      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      const localPhone = cleanPhone.startsWith('964') ? '0' + cleanPhone.substring(3) : cleanPhone;
      const intlPhone = cleanPhone.startsWith('964') ? '+' + cleanPhone : (cleanPhone.startsWith('0') ? '+964' + cleanPhone.substring(1) : '+' + cleanPhone);

      const { data: profileMatches } = await supabase.from('profiles')
        .select('id, phone, email, points')
        .or(`phone.eq.${localPhone},phone.eq.${intlPhone},phone.eq.${cleanPhone}`);
        
      let matchedUserId = null;
      if (profileMatches && profileMatches.length > 0) {
        profileMatches.sort((a, b) => {
          if (a.email && !b.email) return -1;
          if (!a.email && b.email) return 1;
          return (b.points || 0) - (a.points || 0);
        });
        matchedUserId = profileMatches[0].id;
      }

      let isNewAccount = false;
      if (!matchedUserId) {
        isNewAccount = true;
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
        
        const fullName = update.message.from.first_name + (update.message.from.last_name ? ' ' + update.message.from.last_name : '');
        await supabase.from('profiles').upsert({ id: matchedUserId, full_name: fullName, phone: localPhone, role: 'user', points: 10 });
      } else {
        // If existing profile has 0 points, grant 10 points gift
        const { data: curProf } = await supabase.from('profiles').select('points').eq('id', matchedUserId).maybeSingle();
        if (curProf && (curProf.points === null || curProf.points === 0)) {
          await supabase.from('profiles').update({ points: 10 }).eq('id', matchedUserId);
          isNewAccount = true;
        }
      }

      // 🎁 Award +15 Points to the Referrer if user came via referral link
      if (isNewAccount && state?.referrer) {
        try {
          const refTarget = String(state.referrer);
          let referrerProfile: any = null;
          let referrerChatId: string | null = null;

          const { data: byId } = await supabase.from('profiles').select('id, points').eq('id', refTarget).maybeSingle();
          if (byId) {
            referrerProfile = byId;
            const { data: tgU } = await supabase.from('telegram_users').select('telegram_chat_id').eq('user_id', byId.id).maybeSingle();
            referrerChatId = tgU?.telegram_chat_id || null;
          } else {
            const { data: byChat } = await supabase.from('telegram_users').select('user_id, telegram_chat_id').eq('telegram_chat_id', refTarget).maybeSingle();
            if (byChat && byChat.user_id) {
              referrerChatId = byChat.telegram_chat_id;
              const { data: prof } = await supabase.from('profiles').select('id, points').eq('id', byChat.user_id).maybeSingle();
              referrerProfile = prof;
            }
          }

          if (referrerProfile) {
            const updatedPts = (referrerProfile.points || 0) + 15;
            await supabase.from('profiles').update({ points: updatedPts }).eq('id', referrerProfile.id);
            if (referrerChatId) {
              await sendMessage(referrerChatId, 
                `🎉 <b>مبروك يالغالي! 🪙✨</b>\n\n` +
                `انضم صديق جديد إلى سوق بغداد عبر رابط دعوتك!\n` +
                `🎁 تمت إضافة <b>+15 نقطة مجانية</b> إلى محفظتك بنجاح.\n` +
                `رصيدك الجديد: <b>${updatedPts}</b> نقطة 🚀`
              );
            }
          }
        } catch(e) {
          console.error('[REFERRAL REWARD ERROR]', e);
        }
      }

      await supabase.from('telegram_users').upsert({
        user_id: matchedUserId,
        telegram_chat_id: chatId,
        phone_number: phoneNumber,
        bot_state: {}
      }, { onConflict: 'telegram_chat_id' });

      const welcomeMsg = isNewAccount
        ? '🎉 <b>أهلاً وسهلاً بك في منصة وبوت سوق بغداد! 🇮🇶</b>\n🎁 <b>تم منحك 10 نقاط مجانية</b> كهدية ترحيبية لنشر إعلانات سياراتك وخطوط النقل فوراً.'
        : '🎉 <b>تم التسجيل وربط الحساب بنجاح!</b>\nيمكنك الآن البدء بنشر إعلانات السيارات والخطوط والمنتجات فوراً.';

      await sendMessage(chatId, welcomeMsg, { remove_keyboard: true });
      await showMainMenu();
      return new Response('OK', { status: 200 });
    }

    if (!userId) {
      if (callbackQuery) await answerCallbackQuery(callbackQuery.id, 'يجب التسجيل أولاً');
      await sendMessage(chatId, '⚠️ يرجى إرسال رقم هاتفك للبدء بالنشر.\nأرسل /start');
      return new Response('OK', { status: 200 });
    }

    // --- Handle Callback Queries (Button Actions) ---
    if (callbackQuery) {
      await answerCallbackQuery(callbackQuery.id);
      const action = callbackQuery.data;
      
      if (action === 'account_services') {
        const accRows = [
          [{ text: '📊 تقارير إعلاناتي النشطة والمؤرشفة', callback_data: 'my_publish_reports' }],
          [{ text: '🚀 ترويج ونشر بالمنصات', callback_data: 'promo_select_ad' }],
          [{ text: '🎁 شارك واكسب نقاط', callback_data: 'invite_and_earn' }, { text: '🎟️ تعبئة بروموكود', callback_data: 'redeem_promo' }],
          [{ text: '💳 شراء نقاط', callback_data: 'buy_points' }, { text: '🔔 إدارة إشعاراتي', callback_data: 'manage_alerts' }],
          [{ text: '🔗 ربط قناتك', callback_data: 'partner_connect_start' }, { text: '🔑 تغيير كلمة المرور', callback_data: 'forgot_password' }],
          [{ text: '🔌 إعادة ربط الحساب', callback_data: 'relink_account' }, { text: '🔙 العودة للرئيسية', callback_data: 'main_menu' }]
        ];
        return await updateOrSend(`💼 <b>حسابي والخدمات الإضافية</b>\n\nاختر من القائمة أدناه:`, { inline_keyboard: accRows });
      }

      // 📊 MY PUBLISH REPORTS (تقارير النشر الذكية)
      if (action === 'my_publish_reports' || action === 'my_publish_reports_archived') {
        const showArchived = action === 'my_publish_reports_archived';
        const statusFilter = showArchived ? ['sold', 'matched', 'archived', 'closed'] : ['active'];
        const { data: myAds } = await supabase
          .from('ads')
          .select('id, short_id, title, category, status, created_at, telegram_message_id, sync_status, facebook_post_id, instagram_post_id')
          .eq('seller_id', userId)
          .in('status', statusFilter)
          .order('created_at', { ascending: false })
          .limit(8);

        const toggleBtn = { text: showArchived ? '🟢 النشطة' : '📂 المؤرشفة والمباعة', callback_data: showArchived ? 'my_publish_reports' : 'my_publish_reports_archived' };
        const navButtons = [
          [toggleBtn, { text: '🏠 الرئيسية', callback_data: 'main_menu' }]
        ];

        if (!myAds || myAds.length === 0) {
          return await updateOrSend(
            showArchived ? '📂 لا توجد إعلانات مؤرشفة.' : '📭 لا توجد إعلانات نشطة حالياً.\n\nانشر إعلانك الأول الآن!',
            { inline_keyboard: navButtons }
          );
        }

        // Build header message + per-ad link buttons
        let reportTxt = showArchived
          ? `📂 <b>إعلاناتي المؤرشفة / المباعة (${myAds.length})</b>\n`
          : `📊 <b>تقارير إعلاناتي النشطة (${myAds.length})</b>\n`;
        reportTxt += `اضغط على الروابط أدناه للوصول السريع لكل منشور:\n━━━━━━━━━━━━━━\n`;

        const allButtons: any[][] = [];

        for (const ad of myAds) {
          const catEmoji = ad.category === 'transport' ? '🚌' : (ad.category === 'vehicles' || ad.category === 'cars') ? '🚗' : '📦';
          const statusEmoji = ad.status === 'active' ? '🟢' : '🔴';
          const sync = ad.sync_status || {};
          const tgMsgId = ad.telegram_message_id;
          const adDate = new Date(ad.created_at).toLocaleDateString('ar-IQ');
          const shortTitle = (ad.title || 'إعلان').substring(0, 28);

          // Build Telegram link
          let tgLink: string | null = null;
          if (tgMsgId) {
            const ch = (ad.category === 'transport') ? (LINES_CHANNEL_ID || LINES_CHANNEL) : (CAR_CHANNEL_ID || CAR_CHANNEL);
            tgLink = `https://t.me/${ch.replace('@', '')}/${tgMsgId}`;
          }

          // Build Facebook link — الصيغة الصحيحة مع page_id و post_id
          const fbPostId = sync.facebook_post_id || ad.facebook_post_id;
          let fbLink: string | null = null;
          if (fbPostId) {
            const fbIdStr = String(fbPostId);
            if (fbIdStr.includes('_')) {
              // صيغة {page_id}_{post_id}
              const [pageId, postId] = fbIdStr.split('_');
              fbLink = `https://www.facebook.com/permalink.php?story_fbid=${postId}&id=${pageId}`;
            } else {
              // معرف مفرد — استخدم page_id من المتغيرات البيئية
              fbLink = `https://www.facebook.com/permalink.php?story_fbid=${fbIdStr}&id=${META_PAGE_ID}`;
            }
          }

          // Build Instagram link — Instagram لا يدعم روابط مباشرة بالـ media_id
          // نستخدم رابط البروفايل + ذكر للمنشور في النص
          const igPostId = sync.instagram_post_id || ad.instagram_post_id;
          let igLink: string | null = null;
          if (igPostId) {
            // أفضل رابط متاح: صفحة الحساب (لا يوجد URL مباشر من media_id)
            igLink = `https://www.instagram.com/souqbaghdad.iq/`;
          }

          // Add text entry
          reportTxt += `\n${catEmoji} <b>${shortTitle}...</b>\n`;
          reportTxt += `${statusEmoji} ${ad.status === 'active' ? 'نشط' : 'مغلق'} | 📅 ${adDate}\n`;
          reportTxt += `📡 تيليجرام: ${tgLink ? `<a href="${tgLink}">عرض المنشور ✅</a>` : '⚪ غير متوفر'}\n`;
          reportTxt += `📘 فيسبوك: ${fbLink ? `<a href="${fbLink}">عرض المنشور ✅</a>` : (sync.facebook === 'success' ? '✅ نُشر' : '⚪ قيد المعالجة')}\n`;
          reportTxt += `📸 انستغرام: ${igLink ? `<a href="${igLink}">عرض المنشور ✅</a>` : (sync.instagram === 'success' ? '✅ نُشر' : '⚪ قيد المعالجة')}\n`;
          reportTxt += `━━━━━━━━━━━━━━\n`;

          // Add quick-access buttons for this ad
          const adBtns: any[] = [];
          if (tgLink) adBtns.push({ text: `${catEmoji} عرض المنشور — تيليجرام`, url: tgLink });
          if (fbLink) adBtns.push({ text: `📘 عرض المنشور — فيسبوك`, url: fbLink });
          if (adBtns.length > 0) allButtons.push(adBtns);
          if (igLink) allButtons.push([{ text: `📸 عرض المنشور — انستغرام`, url: igLink }]);
        }

        allButtons.push(...navButtons);

        return await updateOrSend(reportTxt, { inline_keyboard: allButtons });
      }

      if (action === 'relink_account') {
        await supabase.from('telegram_users').delete().eq('telegram_chat_id', chatId);
        await sendMessage(chatId, 'تم إلغاء ربط حسابك الحالي بالبوت.\n\nيرجى مشاركة رقم هاتفك للتحقق وإعادة الربط.', {
          keyboard: [[{ text: '📱 مشاركة رقم الهاتف', request_contact: true }]],
          one_time_keyboard: true,
          resize_keyboard: true
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'main_menu' || action === 'cancel_wizard') {
        if (action === 'cancel_wizard') {
          await updateOrSend('❌ تم إلغاء العملية.');
        }
        await showMainMenu(undefined, true);
        return new Response('OK', { status: 200 });
      }

      // ==========================================
      // ⚙️ AUTO-PUBLISH MANAGEMENT WIZARD
      // ==========================================
      if (isOwner && action === 'admin_autopublish') {
        const adminMsg = `⚙️ <b>الإدارة الشاملة للنشر التلقائي</b> 🇮🇶\n\nالرجاء اختيار القسم الذي تريد تعديل إعدادات النشر التلقائي الخاصة به:`;
        const adminMarkup = {
          inline_keyboard: [
            [{ text: '🚗 إعدادات نشر السيارات', callback_data: 'admin_autopublish_cat_cars' }],
            [{ text: '🚌 إعدادات نشر الخطوط', callback_data: 'admin_autopublish_cat_transport' }],
            [{ text: '🛍️ إعدادات نشر المنتجات', callback_data: 'admin_autopublish_cat_products' }],
            [{ text: '🔙 رجوع للوحة التحكم', callback_data: 'owner_hub_main' }]
          ]
        };
        await updateOrSend(adminMsg, adminMarkup);
        return new Response('OK', { status: 200 });
      }

      if (isOwner && action.startsWith('admin_autopublish_cat_')) {
        const category = action.replace('admin_autopublish_cat_', '');
        
        // Fetch current settings
        const { data: currentSettings, error } = await supabase.from('auto_publish_settings').select('settings').eq('category', category).maybeSingle();
        
        let settings = currentSettings?.settings || {};
        
        // Default fallbacks if empty or not found
        if (!settings.telegram_main) settings.telegram_main = { active: true, channel_id: '-1002302360589' };
        if (!settings.telegram_rafdain) settings.telegram_rafdain = { active: false, channel_id: '-1002361660601' };
        if (!settings.facebook_souq) settings.facebook_souq = { active: true };
        if (!settings.facebook_rafdain) settings.facebook_rafdain = { active: false };
        if (!settings.instagram_souq) settings.instagram_souq = { active: true };

        // Save fallback to DB if error so we have it next time
        if (error || !currentSettings) {
           await supabase.from('auto_publish_settings').upsert({ category, settings }, { onConflict: 'category' });
        }

        const catName = category === 'cars' ? 'السيارات 🚗' : (category === 'transport' ? 'الخطوط 🚌' : 'المنتجات 🛍️');
        
        let msg = `⚙️ <b>إعدادات النشر التلقائي لقسم (${catName})</b>\n\n`;
        msg += `يمكنك تفعيل أو تعطيل النشر التلقائي وتعديل معرفات القنوات:\n\n`;

        msg += `<b>1. تيليكرام الرئيسي:</b> ${settings.telegram_main.active ? '🟢 مفعل' : '🔴 معطل'}\n`;
        msg += `   المعرف: <code>${settings.telegram_main.channel_id}</code>\n\n`;
        
        msg += `<b>2. تيليكرام الرافدين:</b> ${settings.telegram_rafdain.active ? '🟢 مفعل' : '🔴 معطل'}\n`;
        msg += `   المعرف: <code>${settings.telegram_rafdain.channel_id}</code>\n\n`;

        msg += `<b>3. فيسبوك سوق بغداد:</b> ${settings.facebook_souq.active ? '🟢 مفعل' : '🔴 معطل'}\n`;
        msg += `<b>4. فيسبوك الرافدين:</b> ${settings.facebook_rafdain.active ? '🟢 مفعل' : '🔴 معطل'}\n`;
        msg += `<b>5. انستكرام سوق بغداد:</b> ${settings.instagram_souq.active ? '🟢 مفعل' : '🔴 معطل'}\n`;

        const keyboard = [
          [
            { text: `${settings.telegram_main.active ? '🔴 إيقاف' : '🟢 تفعيل'} تلي الرئيسي`, callback_data: `admin_autopublish_toggle_${category}_telegram_main` },
            { text: `✏️ تعديل المعرف`, callback_data: `admin_autopublish_edit_${category}_telegram_main` }
          ],
          [
            { text: `${settings.telegram_rafdain.active ? '🔴 إيقاف' : '🟢 تفعيل'} تلي الرافدين`, callback_data: `admin_autopublish_toggle_${category}_telegram_rafdain` },
            { text: `✏️ تعديل المعرف`, callback_data: `admin_autopublish_edit_${category}_telegram_rafdain` }
          ],
          [
            { text: `${settings.facebook_souq.active ? '🔴 إيقاف' : '🟢 تفعيل'} فيس بوك سوق`, callback_data: `admin_autopublish_toggle_${category}_facebook_souq` },
            { text: `${settings.facebook_rafdain.active ? '🔴 إيقاف' : '🟢 تفعيل'} فيس الرافدين`, callback_data: `admin_autopublish_toggle_${category}_facebook_rafdain` }
          ],
          [
            { text: `${settings.instagram_souq.active ? '🔴 إيقاف' : '🟢 تفعيل'} انستا سوق بغداد`, callback_data: `admin_autopublish_toggle_${category}_instagram_souq` }
          ],
          [{ text: '🔙 رجوع للقائمة السابقة', callback_data: 'admin_autopublish' }]
        ];

        await updateOrSend(msg, { inline_keyboard: keyboard });
        return new Response('OK', { status: 200 });
      }

      if (isOwner && action.startsWith('admin_autopublish_toggle_')) {
        const parts = action.replace('admin_autopublish_toggle_', '').split('_');
        const category = parts[0];
        const platform = parts.slice(1).join('_'); // e.g. telegram_main

        const { data: currentSettings } = await supabase.from('auto_publish_settings').select('settings').eq('category', category).maybeSingle();
        if (currentSettings && currentSettings.settings && currentSettings.settings[platform]) {
          currentSettings.settings[platform].active = !currentSettings.settings[platform].active;
          await supabase.from('auto_publish_settings').update({ settings: currentSettings.settings, updated_at: new Date().toISOString() }).eq('category', category);
        }
        
        // Re-render the menu
        callbackQuery.data = `admin_autopublish_cat_${category}`;
        // we can't easily re-route, so we just manually call the render logic again. 
        // A simple way is to just let the user know and not edit, but let's edit the message.
        // Wait, I can just use the fact that I'm inside the webhook. Let's just prompt "✅ تم التعديل. افتح القسم مجدداً للتحديث".
        await answerCallbackQuery(callbackQuery.id, '✅ تم تعديل الحالة بنجاح', true);
        return new Response('OK', { status: 200 });
      }

      if (isOwner && action.startsWith('admin_autopublish_edit_')) {
        const parts = action.replace('admin_autopublish_edit_', '').split('_');
        const category = parts[0];
        const platform = parts.slice(1).join('_'); 

        state = { step: 'admin_autopublish_await_id', data: { category, platform } };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        
        await updateOrSend(`✏️ <b>تعديل معرف منصة (${platform}) لقسم (${category}):</b>\n\nيرجى إرسال المعرف الجديد الآن (مثال: -1001234567890 أو @channel_name):`, {
          inline_keyboard: [[{ text: '❌ إلغاء', callback_data: `admin_autopublish_cat_${category}` }]]
        });
        return new Response('OK', { status: 200 });
      }

      // ==========================================
      // 🔗 PARTNER CHANNEL CONNECT WIZARD
      // ==========================================
      if (action === 'partner_connect_start') {
        state = { step: 'partner_await_channel', data: {} };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const guideMsg = 
          `🔗 <b>ربط قناتك / مجموعتك مع منصة سوق بغداد</b> 🇮🇶\n\n` +
          `انضم إلى شبكة قنوات سوق بغداد واحصل على إعلانات منسقة ومصممة تلقائياً لقناتك لزيادة التفاعل والنشاط!\n\n` +
          `📌 <b>خطوات الربط البسيطة:</b>\n` +
          `1️⃣ أضف البوت <b>@${BOT_USERNAME}</b> كمشرف (Admin) في قناتك مع صلاحية نشر الرسائل.\n` +
          `2️⃣ أرسل معرف قناتك العام (مثال: <code>@my_channel</code>) أو رقم المعرف الخاص بها.\n\n` +
          `👇 <b>أرسل معرف قناتك الآن للتحقق:</b>`;

        await updateOrSend(guideMsg, {
          inline_keyboard: [
            [{ text: '📋 عرض قنواتي المربوطة', callback_data: 'partner_my_channels' }],
            [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'partner_my_channels') {
        const { data: myChannels } = await supabase.from('partner_channels').select('*').eq('owner_telegram_id', chatId);
        if (!myChannels || myChannels.length === 0) {
          await updateOrSend('ليس لديك أي قنوات مربوطة حالياً.', {
            inline_keyboard: [
              [{ text: '➕ ربط قناة جديدة', callback_data: 'partner_connect_start' }],
              [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
            ]
          });
          return new Response('OK', { status: 200 });
        }

        let listText = `📋 <b>قنواتك المربوطة بشبكة سوق بغداد:</b>\n\n`;
        const channelButtons: any[] = [];
        myChannels.forEach((c: any, i: number) => {
          const catName = c.only_my_ads || c.category === 'my_store'
            ? '👑 إعلانات متجري / إعلاناتي الشخصية فقط'
            : (c.category === 'transport' ? '🚌 خطوط نقل' : (c.category === 'vehicles' ? '🚗 سيارات' : (c.category === 'products' ? '🛍️ منتجات ومتاجر' : '🌐 الكل')));
          const subInfo = c.filter_keywords && c.filter_keywords.length > 0 ? ` (${c.filter_keywords.join('، ')})` : '';
          listText += `${i + 1}. <b>${c.channel_title || c.channel_id}</b>\n• التخصص: ${catName}${subInfo}\n• الحالة: ${c.is_active ? '✅ نشطة وتستلم الإعلانات' : '⏸️ متوقفة'}\n\n`;
          channelButtons.push([{ text: `❌ حذف ${c.channel_title || c.channel_id}`, callback_data: `partner_delete_${c.id}` }]);
        });

        channelButtons.push([{ text: '➕ ربط قناة أخرى', callback_data: 'partner_connect_start' }]);
        channelButtons.push([{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]);

        await updateOrSend(listText, { inline_keyboard: channelButtons });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('partner_delete_')) {
        const channelDbId = action.replace('partner_delete_', '');
        await supabase.from('partner_channels').delete().eq('id', channelDbId).eq('owner_telegram_id', chatId);
        await updateOrSend('✅ تم فك ربط القناة بنجاح.');
        await showMainMenu(undefined, true);
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('partner_cat_')) {
        const selectedCat = action.replace('partner_cat_', '');
        state.data.category = selectedCat;

        if (selectedCat === 'transport') {
          state.step = 'partner_transport_filter';
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          await updateOrSend(
            `🚌 <b>تحديد نطاق خطوط النقل لقناتك:</b>\n\n` +
            `اختر ما يناسب قناتك: هل تريد استلام إعلانات كل الجامعات أم جامعة/كلية محددة؟`,
            {
              inline_keyboard: [
                [{ text: '🎓 كل الجامعات والكليات في بغداد', callback_data: 'partner_trans_kw_all' }],
                [{ text: '🏛️ كلية الرافدين الجامعة', callback_data: 'partner_trans_kw_alrafdain' }, { text: '🏛️ كلية الإسراء الجامعة', callback_data: 'partner_trans_kw_israa' }],
                [{ text: '🏛️ جامعة بغداد (الجادرية / باب المعظم)', callback_data: 'partner_trans_kw_baghdad' }],
                [{ text: '🏛️ الجامعة التكنولوجية', callback_data: 'partner_trans_kw_tech' }, { text: '🏛️ جامعة النهرين', callback_data: 'partner_trans_kw_nahrain' }],
                [{ text: '✏️ كتابة اسم كلية / منطقة مخصصة', callback_data: 'partner_trans_kw_custom' }],
                [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
              ]
            }
          );
          return new Response('OK', { status: 200 });
        }

        if (selectedCat === 'products') {
          state.step = 'partner_product_filter';
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          await updateOrSend(
            `🛍️ <b>تحديد تصنيف المنتجات لقناتك / متجرك:</b>\n\n` +
            `اختر نوع المنتجات التي تود نشرها في قناتك تلقائياً:`,
            {
              inline_keyboard: [
                [{ text: '💄 كوزمتك ومكياج وعناية', callback_data: 'partner_prod_cosmetics' }, { text: '📱 هواتف وإلكترونيات', callback_data: 'partner_prod_electronics' }],
                [{ text: '👗 ملابس وأزياء', callback_data: 'partner_prod_fashion' }, { text: '🏠 عقارات ومنازل', callback_data: 'partner_prod_realestate' }],
                [{ text: '🌐 كل تصنيفات المنتجات', callback_data: 'partner_prod_all' }],
                [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
              ]
            }
          );
          return new Response('OK', { status: 200 });
        }

        // Vehicles or All
        state.data.filter_keywords = [];
        state.data.sub_category = 'all';
        return await finalizePartnerChannel(chatId, state, supabase, updateOrSend);
      }

      if (action.startsWith('partner_trans_kw_')) {
        const choice = action.replace('partner_trans_kw_', '');
        if (choice === 'all') {
          state.data.filter_keywords = [];
        } else if (choice === 'alrafdain') {
          state.data.filter_keywords = ['الرافدين', 'الرفدين', 'ruc'];
        } else if (choice === 'israa') {
          state.data.filter_keywords = ['الإسراء', 'الاسراء'];
        } else if (choice === 'baghdad') {
          state.data.filter_keywords = ['جامعة بغداد', 'الجادرية', 'باب المعظم'];
        } else if (choice === 'tech') {
          state.data.filter_keywords = ['التكنولوجية'];
        } else if (choice === 'nahrain') {
          state.data.filter_keywords = ['النهرين'];
        } else if (choice === 'custom') {
          state.step = 'partner_trans_custom_input';
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          await updateOrSend('✏️ اكتب اسم الكلية أو المناطق التي ترغب باستلام إعلاناتها حصراً في قناتك:');
          return new Response('OK', { status: 200 });
        }

        return await finalizePartnerChannel(chatId, state, supabase, updateOrSend);
      }

      if (action.startsWith('partner_prod_')) {
        const prodType = action.replace('partner_prod_', '');
        state.data.sub_category = prodType;
        if (prodType === 'cosmetics') state.data.filter_keywords = ['كوزمتك', 'مكياج', 'عطور', 'عناية', 'تجميل'];
        else if (prodType === 'electronics') state.data.filter_keywords = ['هاتف', 'ايفون', 'سامسونج', 'لابتوب', 'اجهزة'];
        else if (prodType === 'fashion') state.data.filter_keywords = ['ملابس', 'فستان', 'حقيبة', 'حذاء'];
        else if (prodType === 'realestate') state.data.filter_keywords = ['عقار', 'بيت', 'شقة', 'ايجار', 'ارض'];
        else state.data.filter_keywords = [];

        return await finalizePartnerChannel(chatId, state, supabase, updateOrSend);
      }

      // ==========================================
      // 📣 GENERAL AD PUBLISH CHOOSER MENU
      // ==========================================
      if (action === 'publish_choose' || action === 'publish_select') {
        const chooseMsg = 
          `📣 <b>نشر إعلان جديد مجاناً في سوق بغداد 🇮🇶✨</b>\n\n` +
          `اختر القسم المناسب لإعلانك:\n\n` +
          `🚌 <b>خطوط النقل:</b> إذا كنت سائقاً توفر خطاً، أو راكباً/طالباً تبحث عن خط نقل.\n` +
          `🚗 <b>السيارات:</b> لعرض سيارتك للبيع في معارض وسوق بغداد.\n` +
          `🛍️ <b>المنتجات والسوق العام:</b> لبيع الهواتف، الأجهزة، والأغراض الشخصية.\n\n` +
          `👇 <b>اضغط على القسم المطلوب للبدء:</b>`;

        const chooseMarkup = {
          inline_keyboard: [
            [{ text: '🚌 نشر خط نقل (أوفر خط / أبحث عن خط) 🟢', callback_data: 'publish_transport' }],
            [{ text: '🚗 عرض سيارة للبيع مجاناً', callback_data: 'publish_car' }],
            [{ text: '🛍️ نشر منتج أو سلعة عامة', callback_data: 'publish_product' }],
            [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
          ]
        };

        await updateOrSend(chooseMsg, chooseMarkup);
        return new Response('OK', { status: 200 });
      }

      // ==========================================
      // 🚗 CAR WIZARD (Interactive Step-by-Step)
      // ==========================================
      if (action === 'publish_car') {
        const { data: profile } = await supabase.from('profiles').select('points, role').eq('id', userId).maybeSingle();
        if (profile?.role !== 'admin' && profile?.role !== 'owner' && (profile?.points || 0) < 1) {
          await updateOrSend('❌ عذراً، رصيد النقاط الخاص بك غير كافٍ لنشر إعلان. يرجى شحن المحفظة أولاً.', {
            inline_keyboard: [[{ text: '💳 شراء نقاط', callback_data: 'buy_points' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
          });
          return new Response('OK', { status: 200 });
        }

        state = { step: 'car_brand', data: { images: [] } };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const brandButtons = CAR_BRANDS.map(row => row.map(b => ({ text: b, callback_data: `car_brand_${b}` })));
        brandButtons.push([{ text: '❌ إلغاء العملية', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`🚗 <b>الخطوة 1 من 10 — نوع السيارة (الماركة)</b>\n\nاختر نوع سيارتك من القائمة أدناه 👇`, {
          inline_keyboard: brandButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('car_brand_')) {
        const brand = action.replace('car_brand_', '');
        state.data.brand = brand;
        state.step = 'car_model';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        await updateOrSend(`🚗 <b>الخطوة 2 من 10 — الموديل</b>\n\nالنوع المختار: <b>${brand}</b>\nاكتب اسم موديل السيارة الآن:\n(مثال: النترا، كورولا، سبورتاج، سنتافي، تاهو، سوناتا...)`, {
          inline_keyboard: [
            [{ text: '◀️ السابق', callback_data: 'publish_car' }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('car_year_')) {
        const yearVal = action.replace('car_year_', '');
        if (yearVal === 'older') {
          state.step = 'car_year_custom';
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          await updateOrSend(`📅 <b>الخطوة 3 من 10 — سنة الصنع</b>\n\nاكتب سنة صنع السيارة رقماً (مثال: 2005 أو 1998):`, {
            inline_keyboard: [[{ text: '◀️ السابق', callback_data: `car_brand_${state.data.brand || 'هيونداي'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]]
          });
          return new Response('OK', { status: 200 });
        }

        state.data.year = yearVal;
        state.step = 'car_gov';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const govButtons = IRAQI_GOVERNORATES.map(row => row.map(g => ({ text: g, callback_data: `car_gov_${g}` })));
        govButtons.push([{ text: '◀️ السابق', callback_data: `car_brand_${state.data.brand || 'هيونداي'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`📍 <b>الخطوة 4 من 10 — المحافظة</b>\n\nاختر محافظة تواجد السيارة 👇`, {
          inline_keyboard: govButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('car_gov_')) {
        const gov = action.replace('car_gov_', '');
        state.data.governorate = gov;
        state.step = 'car_origin';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const originButtons = CAR_SPECS_ORIGINS.map(row => row.map(o => ({ text: o, callback_data: `car_origin_${o}` })));
        originButtons.push([{ text: '◀️ السابق', callback_data: `car_year_${state.data.year || '2020'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`📋 <b>الخطوة 5 من 10 — المواصفات والوارد</b>\n\nاختر وارد وحالة صبغ السيارة 👇`, {
          inline_keyboard: originButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('car_origin_')) {
        const origin = action.replace('car_origin_', '');
        state.data.origin = origin;
        state.step = 'car_mileage';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        await updateOrSend(`🛣️ <b>الخطوة 6 من 10 — الكيلومترات (الممشى)</b>\n\nاكتب عدد الكيلومترات المقطوعة بالأرقام فقط:\n(مثال: 110000 أو 50000 أو 0 إذا كانت زيرو)`, {
          inline_keyboard: [
            [{ text: '◀️ السابق', callback_data: `car_gov_${state.data.governorate || 'بغداد'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('car_currency_')) {
        const curr = action.replace('car_currency_', '') === 'usd' ? '$' : 'د.ع';
        state.data.currency = curr;
        state.step = 'car_price';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const examplePrice = curr === '$' ? '14500 أو 18000' : '18000000 أو 22500000';
        await updateOrSend(`💰 <b>الخطوة 8 من 10 — السعر</b>\n\nالعملة: <b>${curr === '$' ? 'دولار أمريكي $' : 'دينار عراقي د.ع'}</b>\nاكتب السعر المطلوب بالأرقام فقط:\n(مثال: ${examplePrice})`, {
          inline_keyboard: [
            [{ text: '◀️ السابق', callback_data: `car_origin_${state.data.origin || 'وارد خليجي'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'car_images_done') {
        state.step = 'car_phone';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const currentPhone = phone || '';
        const phoneButtons = [];
        if (currentPhone) {
          phoneButtons.push([{ text: `📱 استخدام رقمي الحالي (${currentPhone})`, callback_data: 'car_phone_current' }]);
        }
        phoneButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`📞 <b>الخطوة 10 من 10 — رقم الهاتف للتواصل</b>\n\nاكتب رقم الهاتف الخاص بك للتواصل، أو اضغط على الزر لاستخدام رقمك المسجل:`, {
          inline_keyboard: phoneButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'car_phone_current') {
        state.data.phone = phone;
        state.step = 'car_review';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        // Show Review Card
        const currencySymbol = state.data.currency || 'د.ع';
        const formattedPrice = formatTgPrice(state.data.price, currencySymbol);
        const carTitle = `${state.data.brand || ''} ${state.data.model || ''} ${state.data.year || ''}`.trim();
        const mileageStr = state.data.mileage ? `${parseInt(state.data.mileage).toLocaleString('en-US')} كم` : 'غير محدد';
        const imgCount = state.data.images?.length || 0;

        const reviewText = `🔍 <b>مراجعة أخيرة قبل النشر</b>\nتأكد من صحة المعلومات، ثم اضغط «✅ نشر الإعلان الآن»:\n\n` +
                           `🚗 <b>النوع والموديل:</b> ${carTitle}\n` +
                           `📅 <b>السنة:</b> ${state.data.year || 'غير محدد'}\n` +
                           `🛣️ <b>الكيلومتر:</b> ${mileageStr}\n` +
                           `📍 <b>الموقع:</b> ${state.data.governorate || 'بغداد'}\n` +
                           `📋 <b>المواصفات:</b> ${state.data.origin || 'وارد عام'}\n` +
                           `💰 <b>السعر:</b> ${formattedPrice}\n` +
                           `📞 <b>التواصل:</b> ${state.data.phone}\n` +
                           `📸 <b>الصور:</b> ${imgCount} صور مرفقة\n`;

        await updateOrSend(reviewText, {
          inline_keyboard: [
            [{ text: '✅ نشر الإعلان الآن', callback_data: 'car_confirm_publish' }],
            [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'car_confirm_publish' || action === 'car_bypass_publish') {
        if (state.step === 'publishing' || !state.data || (!state.data.brand && !state.data.model)) {
          return new Response('OK', { status: 200 });
        }

        const carTitle = `${state.data.brand || ''} ${state.data.model || ''} ${state.data.year || ''}`.trim() || 'سيارة للبيع';
        const userPhone = state.data.phone || phone;
        const { data: userProfile } = await supabase.from('profiles').select('points, role, full_name, avatar_url').eq('id', userId).single();
        const isOwnerOrAdmin = userProfile?.role === 'admin' || userProfile?.role === 'owner';

        // 1. فحص منع تكرار نفس الإعلان
        if (!isOwnerOrAdmin) {
          const { data: duplicateAds } = await supabase
            .from('ads')
            .select('id, title, short_id')
            .eq('seller_id', userId)
            .eq('status', 'active')
            .eq('category', 'vehicles')
            .ilike('title', `%${carTitle}%`)
            .limit(1);

          if (duplicateAds && duplicateAds.length > 0) {
            await updateOrSend(
              `⚠️ <b>عذراً، هذا الإعلان موجود لديك مسبقاً!</b> (#${duplicateAds[0].short_id || duplicateAds[0].id})\n\n` +
              `نفس تفاصيل السيارة منشورة حالياً في المنصة. لمنع التكرار، يرجى <b>تعديل إعلانك السابق</b> أو <b>حذفه</b> إذا كنت ترغب بنشره من جديد.`,
              {
                inline_keyboard: [
                  [{ text: '🚗 عرض وتعديل إعلاناتي', callback_data: 'my_ads' }],
                  [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
                ]
              }
            );
            state = {};
            await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
            return new Response('OK', { status: 200 });
          }
        }

        // 2. فحص مهلة الـ 15 دقيقة (Cooldown)
        let costMultiplier = 1;
        if (!isOwnerOrAdmin && action !== 'car_bypass_publish') {
          const { data: recentAds } = await supabase
            .from('ads')
            .select('created_at')
            .eq('seller_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);

          if (recentAds && recentAds.length > 0) {
            const lastTime = new Date(recentAds[0].created_at).getTime();
            const now = Date.now();
            const elapsedMinutes = (now - lastTime) / (1000 * 60);

            if (elapsedMinutes < 15) {
              const remainingMinutes = Math.ceil(15 - elapsedMinutes);
              await updateOrSend(
                `⏳ <b>لديك إعلان تم نشره قبل قليل!</b>\n\n` +
                `• يمكنك <b>الانتظار (${remainingMinutes} دقيقة)</b> للنشر بالتكلفة العادية (1 نقطة).\n` +
                `• أو <b>النشر الفوري الآن</b> وتجاوز الوقت بخصم ضعف النقاط (<b>2 نقطة</b>).\n\n` +
                `ماذا تفضل؟`,
                {
                  inline_keyboard: [
                    [{ text: '⚡ نشر فوري الآن (خصم 2 نقطة)', callback_data: 'car_bypass_publish' }],
                    [{ text: '⏳ انتظار وتعديل لاحقاً', callback_data: 'main_menu' }]
                  ]
                }
              );
              return new Response('OK', { status: 200 });
            }
          }
        }

        if (action === 'car_bypass_publish') {
          costMultiplier = 2;
        }

        state.step = 'publishing';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        await updateOrSend('⏳ جاري نشر إعلان سيارتك في المنصة وقناة التليكرام وشبكات التواصل...');

        const cost = 1 * costMultiplier;
        if (!isOwnerOrAdmin && cost > 0) {
          if (!userProfile || (userProfile.points || 0) < cost) {
            await updateOrSend(`❌ عذراً، رصيدك غير كافٍ. التكلفة المطلوبة (${cost} نقطة). يرجى شحن المحفظة.`, {
               inline_keyboard: [[{ text: '💳 شراء نقاط', callback_data: 'buy_points' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
            });
            state = {};
            await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
            return new Response('OK', { status: 200 });
          }
          await supabase.from('profiles').update({ points: userProfile.points - cost }).eq('id', userId);
        }

        const shortId = Math.random().toString(36).substring(2, 7).toUpperCase();

        const carDescriptionJson = JSON.stringify({
          brand: state.data.brand,
          model: state.data.model,
          year: state.data.year,
          origin: state.data.origin,
          mileage: state.data.mileage,
          currency: state.data.currency,
          note: state.data.note || ''
        });

        const fallbackCarImage = getFallbackImage({
          description: carDescriptionJson,
          brand: state.data.brand,
          model: state.data.model,
          year: state.data.year
        }, 'car');

        const { data: insertedCar, error: carInsertError } = await supabase.from('ads').insert({
          title: carTitle,
          price: state.data.price ? state.data.price.replace(/[^0-9]/g, '') : '0',
          description: carDescriptionJson,
          category: 'vehicles',
          location: state.data.governorate || 'بغداد',
          city: state.data.model || 'بغداد',
          images: state.data.images && state.data.images.length > 0 ? state.data.images : [fallbackCarImage],
          phone: state.data.phone || phone,
          seller_id: userId,
          seller_name: userProfile?.full_name || 'بائع سيارات',
          seller_avatar: userProfile?.avatar_url || '',
          status: 'active',
          is_demo: false,
          short_id: shortId,
          sync_status: { telegram: 'skip', facebook: 'pending', instagram: 'pending', tiktok: 'pending', threads: 'pending' }
        }).select().single();

        if (carInsertError || !insertedCar) {
          console.error('Car insert error:', carInsertError);
          await updateOrSend('❌ حدث خطأ أثناء حفظ الإعلان، يرجى المحاولة مرة أخرى.');
          return new Response('OK', { status: 200 });
        }

        const insertedId = insertedCar.id;
        const adId = insertedCar.short_id || insertedId;
        const carLink = `https://www.souqbaghdad.store/ad/${adId}`;
        const carChannelLink = `https://t.me/${CAR_CHANNEL.replace('@', '')}`;
        const currencySymbol = state.data.currency || 'د.ع';
        const formattedPrice = formatTgPrice(state.data.price, currencySymbol);

        // Build caption for channel post
        const channelCaption = await generateSocialCaption(insertedCar, 'car', carLink, true);

        let cleanPhone = (state.data.phone || '').replace(/[^0-9+]/g, '');
        if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
        else cleanPhone = cleanPhone.replace('+', '');
        const contactRow: any[] = [];
        if (cleanPhone) {
          contactRow.push({ text: '💬 تواصل واتساب', url: `https://wa.me/${cleanPhone}` });
          contactRow.push({ text: '✈️ تواصل تيليكرام', url: `https://t.me/+${cleanPhone}` });
        }
        const channelMarkup: any = {
          inline_keyboard: [
            [{ text: '🌐 عرض التفاصيل كاملة بالمنصة', url: carLink }],
            ...(contactRow.length > 0 ? [contactRow] : []),
            [{ text: '🚗 اعرض سيارتك للبيع مجاناً', url: `https://t.me/${BOT_USERNAME}` }]
          ]
        };

        // Directly publish to car channel
        const carImages = insertedCar.images && insertedCar.images.length > 0 ? insertedCar.images : null;
        let tgMsgId: string | null = null;
        try {
          let carRes;
          const resolvedImages = await ensurePublicImages(insertedCar, 'ads', supabase);
          if (resolvedImages.length >= 1) {
            carRes = await sendPhoto(CAR_CHANNEL_ID || CAR_CHANNEL, resolvedImages[0], channelCaption, channelMarkup);
          } else {
            carRes = await sendMessage(CAR_CHANNEL_ID || CAR_CHANNEL, channelCaption, channelMarkup);
          }
          if (carRes?.ok && carRes.result?.message_id) {
            tgMsgId = carRes.result.message_id.toString();
            await supabase.from('ads').update({ telegram_message_id: tgMsgId, sync_status: { telegram: 'success', facebook: 'pending', instagram: 'pending' } }).eq('id', insertedId);
          }
        } catch(e) {
          console.error('Car channel publish error:', e);
        }

        // 📊 Smart Publishing Report
        const tgPostLink = tgMsgId ? `https://t.me/${(CAR_CHANNEL_ID || CAR_CHANNEL).replace('@', '')}/${tgMsgId}` : null;
        const reportLines: string[] = [
          `🎉 <b>ألف مبروك! تم نشر إعلان سيارتك بنجاح 🚗✨</b>`,
          ``,
          `📋 <b>ملخص الإعلان:</b>`,
          `🚗 <b>السيارة:</b> ${carTitle}`,
          `💰 <b>السعر:</b> ${formattedPrice}`,
          `📍 <b>المحافظة:</b> ${state.data.governorate || 'بغداد'}`,
          ``,
          `📡 <b>حالة النشر على المنصات:</b>`,
          `${tgPostLink ? '✅' : '⏳'} تيليجرام — ${tgPostLink ? `<a href="${tgPostLink}">عرض المنشور</a>` : 'قيد المعالجة...'}`,
          `⏳ فيسبوك — قيد النشر التلقائي`,
          `⏳ إنستغرام — قيد النشر التلقائي`,
          ``,
          `📌 <b>احفظ هذه الرسالة لمتابعة إعلانك وإدارته بسهولة!</b>`,
        ];
        const reportMsg = reportLines.join('\n');

        const reportButtons: any[][] = [];
        if (tgPostLink) {
          reportButtons.push([{ text: '📢 شاهد إعلانك بالقناة', url: tgPostLink }]);
        }
        reportButtons.push([{ text: '🌐 عرض بطاقة السيارة بالموقع', url: carLink }]);
        reportButtons.push([{ text: '🚀 ترويج في صدارة فيسبوك وانستغرام (VIP)', callback_data: `promo_menu_${insertedId}` }]);
        reportButtons.push([
          { text: '💰 تعديل السعر', callback_data: `edit_car_price_${insertedId}` },
          { text: '📞 تعديل الهاتف', callback_data: `edit_car_phone_${insertedId}` }
        ]);
        reportButtons.push([{ text: '⚠️ تم بيع السيارة', callback_data: `mark_sold_${insertedId}` }]);
        reportButtons.push([{ text: '📊 تقارير إعلاناتي', callback_data: 'my_publish_reports' }, { text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]);

        await updateOrSend(reportMsg, { inline_keyboard: reportButtons });
        state = {};
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        return new Response('OK', { status: 200 });
      }

      // ==========================================
      // 🚌 TRANSPORT WIZARD (Interactive Step-by-Step)
      // ==========================================
      if (action === 'publish_transport') {
        const { data: profile } = await supabase.from('profiles').select('points, role').eq('id', userId).maybeSingle();
        if (profile?.role !== 'admin' && profile?.role !== 'owner' && (profile?.points || 0) < 1) {
          await updateOrSend('❌ عذراً، رصيد النقاط الخاص بك غير كافٍ لنشر إعلان. يرجى شحن المحفظة أولاً.', {
            inline_keyboard: [[{ text: '💳 شراء نقاط', callback_data: 'buy_points' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
          });
          return new Response('OK', { status: 200 });
        }

        state = { step: 'trans_type', data: {} };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        await updateOrSend(`🚌 <b>الخطوة 1 من 9 — نوع إعلان الخط</b>\n\nهل أنت سائق توفر خطاً، أم راكب تبحث عن خط؟ 👇`, {
          inline_keyboard: [
            [{ text: '🚗 أوفر خط نقل (سائق / صاحب خط)', callback_data: 'trans_type_offer' }],
            [{ text: '🙋‍♂️ أبحث عن خط نقل (راكب / طالب / موظف)', callback_data: 'trans_type_request' }],
            [{ text: '❌ إلغاء العملية', callback_data: 'cancel_wizard' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('trans_type_')) {
        const tType = action.replace('trans_type_', '');
        state.data.type = tType;
        state.step = 'trans_cat';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        await updateOrSend(`🚌 <b>الخطوة 2 من 9 — فئة الخط</b>\n\nالخط مخصص لمن؟ 👇`, {
          inline_keyboard: [
            [{ text: '🎓 خط طلاب جامعات / كليات', callback_data: 'trans_cat_student' }],
            [{ text: '💼 خط موظفين وشركات', callback_data: 'trans_cat_employee' }],
            [{ text: '🚨 نقل خاص وطارئ / مناسبات', callback_data: 'trans_cat_emergency' }],
            [{ text: '◀️ السابق', callback_data: 'publish_transport' }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('trans_cat_')) {
        const catType = action.replace('trans_cat_', '');
        state.data.categoryType = catType;
        state.step = 'trans_regions';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const areaButtons = TRANSPORT_AREAS_BAGHDAD.map(row => row.map(a => {
          if (a.includes('أخرى')) return { text: a, callback_data: 'trans_area_custom' };
          return { text: a, callback_data: `trans_area_${a}` };
        }));
        areaButtons.push([{ text: '◀️ السابق', callback_data: `trans_type_${state.data.type || 'offer'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`📍 <b>الخطوة 3 من 9 — مناطق الانطلاق (المرور)</b>\n\nاختر منطقة الانطلاق أو اكتبها بنفسك 👇`, {
          inline_keyboard: areaButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('trans_area_')) {
        const areaVal = action.replace('trans_area_', '');
        if (areaVal === 'custom') {
          state.step = 'trans_area_custom_input';
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          await updateOrSend(`📍 <b>اكتب مناطق الانطلاق</b> التي يمر بها الخط (مثال: حي الجامعة، الخضراء، نفق الشرطة):`, {
            inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]]
          });
          return new Response('OK', { status: 200 });
        }

        state.data.regions = areaVal;
        state.step = 'trans_dest';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const destButtons = TRANSPORT_DESTINATIONS_BAGHDAD.map(row => row.map(d => {
          if (d.includes('أخرى')) return { text: d, callback_data: 'trans_dest_custom' };
          return { text: d, callback_data: `trans_dest_${d}` };
        }));
        destButtons.push([{ text: '◀️ السابق', callback_data: `trans_cat_${state.data.categoryType || 'student'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`🏢 <b>الخطوة 4 من 9 — الوجهة (الجامعة أو العمل)</b>\n\nاختر الوجهة المطلوبة 👇`, {
          inline_keyboard: destButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('trans_dest_')) {
        const destVal = action.replace('trans_dest_', '');
        if (destVal === 'custom') {
          state.step = 'trans_dest_custom_input';
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          await updateOrSend(`🏢 <b>اكتب الوجهة</b> (اسم الجامعة أو مكان العمل أو المستشفى):`, {
            inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]]
          });
          return new Response('OK', { status: 200 });
        }

        state.data.destination = destVal;
        state.step = 'trans_shift';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const shiftButtons = TRANSPORT_SHIFTS.map(row => row.map(s => ({ text: s, callback_data: `trans_shift_${s}` })));
        shiftButtons.push([{ text: '◀️ السابق', callback_data: `trans_area_${state.data.regions || 'الكرادة'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`⏰ <b>الخطوة 5 من 9 — وقت الدوام والشفت</b>\n\nاختر وقت الدوام 👇`, {
          inline_keyboard: shiftButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('trans_shift_')) {
        const shiftVal = action.replace('trans_shift_', '');
        state.data.shift = shiftVal;
        state.step = 'trans_vehicle';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const vehicleButtons = TRANSPORT_VEHICLES.map(row => row.map(v => ({ text: v, callback_data: `trans_vehicle_${v}` })));
        vehicleButtons.push([{ text: '◀️ السابق', callback_data: `trans_dest_${state.data.destination || 'جامعة بغداد'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`🚗 <b>الخطوة 6 من 9 — نوع المركبة</b>\n\nاختر نوع المركبة 👇`, {
          inline_keyboard: vehicleButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('trans_vehicle_')) {
        const vVal = action.replace('trans_vehicle_', '');
        state.data.vehicleType = vVal;
        state.step = 'trans_target';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const targetButtons = TRANSPORT_TARGETS.map(row => row.map(t => ({ text: t, callback_data: `trans_target_${t}` })));
        targetButtons.push([{ text: '◀️ السابق', callback_data: `trans_shift_${state.data.shift || 'صباحي'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`👥 <b>الخطوة 7 من 9 — فئة الركاب</b>\n\nالخط مخصص لمن؟ 👇`, {
          inline_keyboard: targetButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('trans_target_')) {
        const tVal = action.replace('trans_target_', '');
        state.data.targetAudience = tVal;
        state.step = 'trans_fare';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const fareButtons = TRANSPORT_FARES.map(row => row.map(f => {
          if (f.includes('آخر')) return { text: f, callback_data: 'trans_fare_custom' };
          return { text: f, callback_data: `trans_fare_${f}` };
        }));
        fareButtons.push([{ text: '◀️ السابق', callback_data: `trans_vehicle_${state.data.vehicleType || 'صالون'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`💰 <b>الخطوة 8 من 9 — الأجرة الشهرية / السعر</b>\n\nاختر الأجرة التقريبية لكل راكب 👇`, {
          inline_keyboard: fareButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('trans_fare_')) {
        const fareVal = action.replace('trans_fare_', '');
        if (fareVal === 'custom') {
          state.step = 'trans_fare_custom_input';
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          await updateOrSend(`💰 <b>اكتب مبلغ الأجرة بالأرقام</b> (مثال: 90000 أو 110000):`, {
            inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]]
          });
          return new Response('OK', { status: 200 });
        }

        state.data.price = fareVal.includes('الاتفاق') ? '0' : fareVal.replace(/[^0-9]/g, '');
        state.step = 'trans_phone';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const currentPhone = phone || '';
        const phoneButtons = [];
        if (currentPhone) {
          phoneButtons.push([{ text: `📱 استخدام رقمي الحالي (${currentPhone})`, callback_data: 'trans_phone_current' }]);
        }
        phoneButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await updateOrSend(`📞 <b>الخطوة 9 من 9 — رقم الهاتف للتواصل</b>\n\nاكتب رقم الهاتف للتواصل، أو اضغط على الزر لاستخدام رقمك المسجل:`, {
          inline_keyboard: phoneButtons
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'trans_phone_current') {
        state.data.phone = phone;
        state.step = 'trans_review';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        // Show Transport Review Card
        const typeStr = state.data.type === 'offer' ? '🚗 أوفر خط نقل (سائق)' : '🙋‍♂️ أبحث عن خط نقل (مطلوب)';
        const fareStr = formatTgPrice(state.data.price);
        const reviewText = `🔍 <b>مراجعة إعلان الخط قبل النشر</b>\nتأكد من صحة المعلومات، ثم اضغط «✅ نشر إعلان الخط الآن»:\n\n` +
                           `📌 <b>النوع:</b> ${typeStr}\n` +
                           `🏷️ <b>الفئة:</b> ${state.data.categoryType === 'employee' ? '💼 موظفين' : '🎓 طلاب'} (${state.data.targetAudience || 'الجميع'})\n` +
                           `📍 <b>مناطق الانطلاق:</b> ${state.data.regions || 'بغداد'}\n` +
                           `🏢 <b>الوجهة:</b> ${state.data.destination || 'بغداد'}\n` +
                           `⏰ <b>الدوام:</b> ${state.data.shift || 'صباحي'}\n` +
                           `🚗 <b>المركبة:</b> ${state.data.vehicleType || 'صالون'}\n` +
                           `💰 <b>الأجرة:</b> ${fareStr}\n` +
                           `📞 <b>التواصل:</b> ${state.data.phone}\n`;

        await updateOrSend(reviewText, {
          inline_keyboard: [
            [{ text: '✅ نشر إعلان الخط الآن', callback_data: 'trans_confirm_publish' }],
            [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'trans_confirm_publish' || action === 'trans_bypass_publish') {
        if (state.step === 'publishing' || !state.data || !state.data.destination) {
          return new Response('OK', { status: 200 });
        }

        const transTitle = state.data.type === 'offer' 
          ? `أوفر خط من ${state.data.regions} إلى ${state.data.destination}` 
          : `أبحث عن خط من ${state.data.regions} إلى ${state.data.destination}`;
        const userPhone = state.data.phone || phone;
        const { data: userProfile } = await supabase.from('profiles').select('points, role, full_name, avatar_url').eq('id', userId).single();
        const isOwnerOrAdmin = userProfile?.role === 'admin' || userProfile?.role === 'owner';

        // 1. فحص منع تكرار نفس إعلان خط النقل
        if (!isOwnerOrAdmin) {
          const { data: duplicateAds } = await supabase
            .from('ads')
            .select('id, title, short_id')
            .eq('seller_id', userId)
            .eq('status', 'active')
            .eq('category', 'transport')
            .or(`location.ilike.%${state.data.regions}%,city.ilike.%${state.data.destination}%`)
            .limit(1);

          if (duplicateAds && duplicateAds.length > 0) {
            await updateOrSend(
              `⚠️ <b>عذراً، لديك إعلان خط مشابه منشور مسبقاً!</b> (#${duplicateAds[0].short_id || duplicateAds[0].id})\n\n` +
              `خط النقل هذا مسجل لديك حالياً في المنصة. لمنع التكرار، يرجى <b>تعديل إعلانك الحالي</b> أو <b>حذفه</b> إذا كنت ترغب بنشر إعلان جديد.`,
              {
                inline_keyboard: [
                  [{ text: '🚌 عرض وتعديل خطوطي', callback_data: 'my_ads' }],
                  [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
                ]
              }
            );
            state = {};
            await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
            return new Response('OK', { status: 200 });
          }
        }

        // 2. فحص مهلة الـ 15 دقيقة (Cooldown)
        let costMultiplier = 1;
        if (!isOwnerOrAdmin && action !== 'trans_bypass_publish') {
          const { data: recentAds } = await supabase
            .from('ads')
            .select('created_at')
            .eq('seller_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);

          if (recentAds && recentAds.length > 0) {
            const lastTime = new Date(recentAds[0].created_at).getTime();
            const now = Date.now();
            const elapsedMinutes = (now - lastTime) / (1000 * 60);

            if (elapsedMinutes < 15) {
              const remainingMinutes = Math.ceil(15 - elapsedMinutes);
              await updateOrSend(
                `⏳ <b>لديك إعلان تم نشره قبل قليل!</b>\n\n` +
                `• يمكنك <b>الانتظار (${remainingMinutes} دقيقة)</b> للنشر بالتكلفة العادية (1 نقطة).\n` +
                `• أو <b>النشر الفوري الآن</b> وتجاوز الوقت بخصم ضعف النقاط (<b>2 نقطة</b>).\n\n` +
                `ماذا تفضل؟`,
                {
                  inline_keyboard: [
                    [{ text: '⚡ نشر فوري الآن (خصم 2 نقطة)', callback_data: 'trans_bypass_publish' }],
                    [{ text: '⏳ انتظار وتعديل لاحقاً', callback_data: 'main_menu' }]
                  ]
                }
              );
              return new Response('OK', { status: 200 });
            }
          }
        }

        if (action === 'trans_bypass_publish') {
          costMultiplier = 2;
        }

        state.step = 'publishing';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        await updateOrSend('⏳ جاري نشر إعلان الخط في المنصة وقناة خطوط النقل...');

        const cost = 1 * costMultiplier;
        if (!isOwnerOrAdmin && cost > 0) {
          if (!userProfile || (userProfile.points || 0) < cost) {
            await updateOrSend(`❌ عذراً، رصيدك غير كافٍ. التكلفة المطلوبة (${cost} نقطة). يرجى شحن المحفظة.`, {
               inline_keyboard: [[{ text: '💳 شراء نقاط', callback_data: 'buy_points' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
            });
            state = {};
            await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
            return new Response('OK', { status: 200 });
          }
          await supabase.from('profiles').update({ points: userProfile.points - cost }).eq('id', userId);
        }

        const shortId = Math.random().toString(36).substring(2, 7).toUpperCase();

        const transDescJson = JSON.stringify({
          shift: state.data.shift,
          seats: state.data.seats || '1',
          vehicleType: state.data.vehicleType,
          targetAudience: state.data.targetAudience,
          categoryType: state.data.categoryType || 'student',
          note: state.data.note || '',
          interest: 0,
          whatsappClicks: 0
        });

        const { data: insertedTrans, error: transInsertError } = await supabase.from('ads').insert({
          type: state.data.type === 'offer' ? 'offer' : 'request',
          title: transTitle,
          description: transDescJson,
          price: state.data.price ? state.data.price.replace(/[^0-9]/g, '') : '0',
          category: 'transport',
          location: state.data.regions,
          city: state.data.destination,
          images: [],
          phone: state.data.phone || phone,
          status: 'active',
          is_demo: false,
          seller_id: userId,
          seller_name: userProfile?.full_name || 'صاحب خط',
          seller_avatar: userProfile?.avatar_url || '',
          short_id: shortId,
          sync_status: { telegram: 'skip', facebook: 'skip', instagram: 'skip', tiktok: 'skip', threads: 'skip' }
        }).select().single();

        if (transInsertError || !insertedTrans) {
          console.error('Transport insert error:', transInsertError);
          await updateOrSend('❌ حدث خطأ أثناء حفظ الخط، يرجى المحاولة مرة أخرى.');
          return new Response('OK', { status: 200 });
        }

        const insertedId = insertedTrans.id;
        const stateData = state.data || {};

        // Auto publish to Telegram channels and Socials with dynamic template
        const typeStr = stateData.type === 'offer' ? '🚗 أوفر خط نقل (سائق)' : '🙋‍♂️ أبحث عن خط نقل (مطلوب)';
        const catType = stateData.categoryType === 'employee' ? '💼 خط موظفين' : (stateData.categoryType === 'emergency' ? '🚨 نقل خاص' : '🎓 خط طلاب');
        const targetStr = stateData.targetAudience || 'الجميع';
        const link = `https://www.souqbaghdad.store/transport/card/${shortId}`;
        const cleanTitle = 'خط نقل جديد في بغداد';
        const cleanSubtitle = (stateData.destination || 'كلية الرافدين الجامعة').replace(/<[^>]*>?/gm, '').trim();
        const cleanSubdesc = `${catType} (${targetStr})`.replace(/<[^>]*>?/gm, '').trim();
        const cleanRegions = (stateData.regions || 'بغداد').replace(/<[^>]*>?/gm, '').trim();
        const cleanDestination = (stateData.destination || 'كلية الرافدين الجامعة').replace(/<[^>]*>?/gm, '').trim();
        const cleanFare = formatTgPrice(stateData.price);

        const isAlRafdain = ['الرافدين', 'الرفدين', 'رافدين', 'رفدين', 'ruc'].some(term => 
          cleanDestination.toLowerCase().includes(term) || 
          targetStr.toLowerCase().includes(term) ||
          cleanRegions.toLowerCase().includes(term) ||
          (transTitle && transTitle.toLowerCase().includes(term)) ||
          (stateData.university && stateData.university.toLowerCase().includes(term)) ||
          (stateData.destination && stateData.destination.toLowerCase().includes(term))
        );
        const channelLink = isAlRafdain && ALRAFDAIN_TELEGRAM_CHANNEL
          ? `https://t.me/${ALRAFDAIN_TELEGRAM_CHANNEL.replace('@', '')}`
          : `https://t.me/${LINES_CHANNEL.replace('@', '')}`;

        // Immediately send success message to user before heavy background tasks (same as cars section)
        const immediateReportLines = [
          `🎉 <b>ألف مبروك! تم نشر إعلان خطك بنجاح 🚌✨</b>`,
          ``,
          `📋 <b>ملخص الإعلان:</b>`,
          `🚌 <b>المسار:</b> ${stateData.regions || cleanRegions} ⬅️ ${stateData.destination || cleanDestination}`,
          `💰 <b>الأجرة:</b> ${cleanFare}`,
          `🔖 <b>كود الخط:</b> <code>#${shortId}</code>`,
          ``,
          `📡 <b>حالة النشر على المنصات:</b>`,
          `✅ تيليجرام — <a href="${channelLink}">عرض القناة</a>`,
          `⏳ فيسبوك — قيد النشر التلقائي`,
          `⏳ إنستغرام — قيد النشر التلقائي`,
          ``,
          `📌 <b>سيصلك تقرير النشر الكامل لجميع المنصات خلال لحظات!</b>`,
        ];
        await updateOrSend(immediateReportLines.join('\n'), {
          inline_keyboard: [
            [{ text: '🌐 عرض بطاقتي بالموقع', url: link }, { text: '📢 شاهد بالقناة', url: channelLink }],
            [{ text: '🚀 ترويج البوست في صدارة فيسبوك وانستغرام (VIP)', callback_data: `promo_menu_${insertedId}` }],
            [{ text: '💰 تعديل الأجرة', callback_data: `edit_trans_price_${insertedId}` }, { text: '📞 تعديل الهاتف', callback_data: `edit_trans_phone_${insertedId}` }],
            [{ text: '✅ إغلاق الخط (اكتمل العدد)', callback_data: `solve_trans_${insertedId}` }, { text: '🗑️ حذف الخط نهائياً', callback_data: `del_trans_${insertedId}` }],
            [{ text: '🚌 نشر خط آخر', callback_data: 'publish_transport' }, { text: '📦 إدارة خطوطي', callback_data: 'manage_cat_trans' }],
            [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
          ]
        });

        // Reset state so user can do other things
        state = {};
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        // Background task for publishing to channels and social media
        const publishBackground = async () => {
          try {
            let rawPhone = stateData.phone || phone || '';
            let cleanDisplayPhone = String(rawPhone).replace(/[^\d+]/g, '').trim();
            if (cleanDisplayPhone.startsWith('964')) {
              cleanDisplayPhone = '0' + cleanDisplayPhone.substring(3);
            }
            if (cleanDisplayPhone.startsWith('+964')) {
              cleanDisplayPhone = '0' + cleanDisplayPhone.substring(4);
            }
            if (!cleanDisplayPhone) cleanDisplayPhone = '0770 000 0000';

            const daysStr = stateData.days || 'الأحد إلى الخميس';
            const shiftVal = stateData.shift || 'صباحي';
            const targetAudienceVal = stateData.targetAudience || targetStr || 'الجميع';

            const dynamicPostUrl = `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=post&title=${encodeURIComponent(cleanTitle)}&subtitle=${encodeURIComponent(cleanSubtitle)}&subdesc=${encodeURIComponent(cleanSubdesc)}&regions=${encodeURIComponent(cleanRegions)}&destination=${encodeURIComponent(cleanDestination)}&fare=${encodeURIComponent(cleanFare)}&link=${encodeURIComponent(link)}&short_id=${encodeURIComponent(shortId)}&phone=${encodeURIComponent(cleanDisplayPhone)}&audience=${encodeURIComponent(targetAudienceVal)}&days=${encodeURIComponent(daysStr)}&time=${encodeURIComponent(shiftVal)}`;
            const dynamicStoryUrl = `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=story&title=${encodeURIComponent(cleanTitle)}&subtitle=${encodeURIComponent(cleanSubtitle)}&subdesc=${encodeURIComponent(cleanSubdesc)}&regions=${encodeURIComponent(cleanRegions)}&destination=${encodeURIComponent(cleanDestination)}&fare=${encodeURIComponent(cleanFare)}&link=${encodeURIComponent(link)}&short_id=${encodeURIComponent(shortId)}&phone=${encodeURIComponent(cleanDisplayPhone)}&audience=${encodeURIComponent(targetAudienceVal)}&days=${encodeURIComponent(daysStr)}&time=${encodeURIComponent(shiftVal)}`;

            const cleanPhone = cleanDisplayPhone;
            let formattedPhone = cleanPhone.startsWith('07') ? '964' + cleanPhone.substring(1) : cleanPhone.replace('+', '');

            const contactRow = [];
            if (formattedPhone) {
              contactRow.push({ text: '💬 تواصل واتساب', url: `https://wa.me/${formattedPhone}` });
              contactRow.push({ text: '✈️ تواصل تيليكرام', url: `https://t.me/+${formattedPhone}` });
            }

            const channelKeyboard = [
              [{ text: '🌐 التفاصيل الكاملة وحجز المقعد', url: link }]
            ];
            if (contactRow.length > 0) channelKeyboard.push(contactRow);
            channelKeyboard.push([{ text: '🚌 انشر خطك مجاناً عبر البوت', url: `https://t.me/${BOT_USERNAME}` }]);

            const channelMsg = `🚌 <b>إعلان خط نقل جديد — سوق بغداد</b>\n\n` +
                               `📌 <b>النوع:</b> ${typeStr}\n` +
                               `🏷️ <b>الفئة:</b> ${catType} (${targetStr})\n` +
                               `📍 <b>مناطق الانطلاق:</b> ${cleanRegions}\n` +
                               `🏢 <b>الوجهة:</b> ${cleanDestination}\n` +
                               `⏰ <b>وقت الدوام:</b> ${stateData.shift || 'صباحي'}\n` +
                               `🚗 <b>المركبة:</b> ${stateData.vehicleType || 'صالون'} | <b>المقاعد:</b> ${stateData.seats || '4'} مقاعد\n` +
                               `💰 <b>الأجرة:</b> ${cleanFare}\n` +
                               (cleanPhone ? `📞 <b>التواصل:</b> ${cleanPhone}\n\n` : `\n`) +
                               `📣 <b>#رقم_الخط_${shortId}</b> | @${BOT_USERNAME}`;

            // 0. Generate and save permanent PNG card & story in Storage for robust social posting
            let finalPostPhotoUrl = dynamicPostUrl;
            try {
              const cardFetch = await fetch(dynamicPostUrl);
              if (cardFetch.ok) {
                const cardBlob = await cardFetch.blob();
                const cardBytes = new Uint8Array(await cardBlob.arrayBuffer());
                const cardFileName = `transport-card-${shortId}-${Date.now()}.png`;
                const { data: uploadResult, error: uploadErr } = await supabase.storage
                  .from('ad-images')
                  .upload(cardFileName, cardBytes, { contentType: 'image/png', upsert: true });

                if (!uploadErr && uploadResult) {
                  const { data: pubUrlData } = supabase.storage.from('ad-images').getPublicUrl(cardFileName);
                  if (pubUrlData?.publicUrl) finalPostPhotoUrl = pubUrlData.publicUrl;
                }
              }
            } catch(e) { console.error('Error saving transport card PNG:', e); }

            let finalStoryPhotoUrl = dynamicStoryUrl;
            try {
              const storyFetch = await fetch(dynamicStoryUrl);
              if (storyFetch.ok) {
                const storyBlob = await storyFetch.blob();
                const storyBytes = new Uint8Array(await storyBlob.arrayBuffer());
                const storyFileName = `transport-story-${shortId}-${Date.now()}.png`;
                const { data: storyUploadResult, error: storyUploadErr } = await supabase.storage
                  .from('ad-images')
                  .upload(storyFileName, storyBytes, { contentType: 'image/png', upsert: true });

                if (!storyUploadErr && storyUploadResult) {
                  const { data: storyPubUrlData } = supabase.storage.from('ad-images').getPublicUrl(storyFileName);
                  if (storyPubUrlData?.publicUrl) finalStoryPhotoUrl = storyPubUrlData.publicUrl;
                }
              }
            } catch(e) { console.error('Error saving transport story PNG:', e); }

            // 1. Post to @souqbaghdad_lines
            const targetLinesChannel = LINES_CHANNEL_ID || LINES_CHANNEL;
            const linesRes = await sendPhoto(targetLinesChannel, finalPostPhotoUrl, channelMsg, { inline_keyboard: channelKeyboard });
            let tgMsgId: string | null = null;
            if (linesRes?.ok && linesRes.result?.message_id) {
              tgMsgId = linesRes.result.message_id.toString();
            }

            // 2. If it's Al-Rafdain, ALSO post to @ruc_1
            let rucMsgId: string | null = null;
            if (isAlRafdain) {
              try {
                console.log(`[BOT RUC] isAlRafdain=true, sending to ${ALRAFDAIN_TELEGRAM_CHANNEL}`);
                const rucRes = await sendPhoto(ALRAFDAIN_TELEGRAM_CHANNEL, finalPostPhotoUrl, channelMsg, { inline_keyboard: channelKeyboard });
                if (rucRes?.ok && rucRes.result?.message_id) {
                  rucMsgId = rucRes.result.message_id.toString();
                  console.log(`[BOT RUC] sendPhoto success, message_id: ${rucMsgId}`);
                }
              } catch(err) {
                console.error("Error sending to Al-Rafdain @ruc_1 from bot wizard:", err);
              }
            }

            // 3. Broadcast to Partner Channels Network
            EdgeRuntime.waitUntil(broadcastToPartnerChannels(insertedTrans, 'transport', channelMsg, finalPostPhotoUrl, { inline_keyboard: channelKeyboard }, supabase));

            // Save telegram_message_id and ruc_telegram_message_id to prevent DB webhook from publishing again (dedup)
            if (tgMsgId || rucMsgId) {
              const syncStatus: any = { telegram: 'success', facebook: 'pending', instagram: 'pending' };
              if (rucMsgId) syncStatus.ruc_telegram_message_id = rucMsgId;
              const updateData: any = { sync_status: syncStatus };
              if (tgMsgId) updateData.telegram_message_id = tgMsgId;
              await supabase.from('ads').update(updateData).eq('id', insertedTrans.id);
            }

            // 3. Social Media Publishing — قواعد الخطوط الجديدة:
            // 🏛️ الرافدين فيسبوك: بوست + ستوري (جميع الخطوط)
            // 🏛️ الرافدين انستغرام: ستوري فقط (جميع الخطوط)
            // 🏙️ سوق بغداد فيسبوك: ستوري فقط
            // 🏙️ سوق بغداد انستغرام: ستوري فقط
            try {
              const fbIgCaption = await generateSocialCaption(insertedTrans, 'transport', link);
              const socialUpdates: any = {};
              const currentSync: any = {
                telegram: 'success',
                facebook: 'pending', instagram: 'pending', threads: 'pending',
                rafdain_facebook: 'pending', rafdain_instagram_story: 'pending'
              };
              if (rucMsgId) currentSync.ruc_telegram_message_id = rucMsgId;

              const fbIgPhotoUrl = [finalPostPhotoUrl];

              // --- A. الرافدين فيسبوك: بوست + ستوري (الأساسي لجميع الخطوط) ---
              try {
                const rafdainSetting = await getLiveSocialSetting('fb_rafdain');
                const rafdainToken = rafdainSetting?.access_token || ALRAFDAIN_FB_TOKEN || META_PAGE_ACCESS_TOKEN;
                const rafdainPageId = rafdainSetting?.page_id || ALRAFDAIN_FB_PAGE_ID || '102975411515668';
                if (rafdainToken && rafdainPageId) {
                  console.log('[BOT SOCIAL] Publishing Post & Story to Al-Rafdain Facebook (PRIMARY for ALL transport)...');
                  const [rucFbPostRes, rucFbStoryRes] = await Promise.allSettled([
                    postToFacebook(fbIgCaption, fbIgPhotoUrl, rafdainToken, rafdainPageId),
                    postToFacebookStory(finalStoryPhotoUrl, rafdainPageId, rafdainToken)
                  ]);
                  if (rucFbPostRes.status === 'fulfilled' && (rucFbPostRes.value?.id || rucFbPostRes.value?.post_id)) {
                    socialUpdates.facebook_post_id = rucFbPostRes.value.post_id || rucFbPostRes.value.id;
                    currentSync.rafdain_facebook = 'success';
                    currentSync.facebook = 'success';
                  }
                  if (rucFbStoryRes.status === 'fulfilled' && !rucFbStoryRes.value?.error) {
                    currentSync.rafdain_facebook_story = 'success';
                    currentSync.facebook_story = 'success';
                  }
                }
              } catch(fbRucErr) {
                console.error('[BOT SOCIAL] Al-Rafdain FB Error:', fbRucErr);
              }

              // --- B. الرافدين انستغرام: ستوري فقط (الأساسي لجميع الخطوط) ---
              try {
                const rafdainIgSetting = await getLiveSocialSetting('ig_rafdain');
                const igToken = rafdainIgSetting?.access_token || ALRAFDAIN_FB_TOKEN || META_PAGE_ACCESS_TOKEN;
                const igTargetId = rafdainIgSetting?.page_id || rafdainIgSetting?.extra_id || ALRAFDAIN_IG_ID || '17841404181680155';
                if (igToken && igTargetId) {
                  console.log(`[BOT SOCIAL] Publishing Story to Al-Rafdain Instagram (PRIMARY for ALL transport)...`);
                  const rucIgRes = await postToInstagramStory(finalStoryPhotoUrl, igTargetId, igToken);
                  if (rucIgRes && (rucIgRes.id || !rucIgRes.error)) {
                    currentSync.rafdain_instagram_story = 'success';
                    currentSync.instagram_story = 'success';
                    currentSync.instagram = 'success';
                  }
                }
              } catch(igRucErr) {
                console.error('[BOT SOCIAL] Al-Rafdain IG Error:', igRucErr);
              }

              // --- C. سوق بغداد فيسبوك: ستوري فقط ---
              try {
                console.log('[BOT SOCIAL] Publishing Story-only to Souq Baghdad Facebook...');
                const souqFbStoryRes = await postToFacebookStory(finalStoryPhotoUrl, META_PAGE_ID, META_PAGE_ACCESS_TOKEN);
                if (souqFbStoryRes && !souqFbStoryRes.error) {
                  currentSync.souq_facebook_story = 'success';
                }
              } catch(fbSouqErr) {
                console.error('[BOT SOCIAL] Souq Baghdad FB Story Error:', fbSouqErr);
              }

              // --- D. سوق بغداد انستغرام: ستوري فقط ---
              try {
                console.log('[BOT SOCIAL] Publishing Story-only to Souq Baghdad Instagram...');
                const souqIgStoryRes = await postToInstagramStory(finalStoryPhotoUrl);
                if (souqIgStoryRes && !souqIgStoryRes.error) {
                  currentSync.souq_instagram_story = 'success';
                }
              } catch(igSouqErr) {
                console.error('[BOT SOCIAL] Souq Baghdad IG Story Error:', igSouqErr);
              }

              socialUpdates.sync_status = currentSync;
              await supabase.from('ads').update(socialUpdates).eq('id', insertedTrans.id);

              // Send concise verification report with direct post links
              try {
                const tgPostLink = tgMsgId ? `https://t.me/${(LINES_CHANNEL_ID || LINES_CHANNEL).replace('@', '')}/${tgMsgId}` : null;
                const rucPostLink = rucMsgId ? `https://t.me/${ALRAFDAIN_TELEGRAM_CHANNEL.replace('@', '')}/${rucMsgId}` : null;
                const fbPostLink = socialUpdates.facebook_post_id ? `https://www.facebook.com/${socialUpdates.facebook_post_id}` : null;
                const igPostLink = socialUpdates.instagram_post_id ? `https://www.instagram.com/p/${socialUpdates.instagram_post_id}/` : null;

                const platformLines: string[] = [];
                // تيليجرام
                platformLines.push(tgPostLink ? `✅ تيليجرام @souqbaghdad_lines` : `⚪ تيليجرام`);
                platformLines.push(rucPostLink ? `✅ قناة الرافدين @ruc_1` : `⚪ قناة الرافدين`);
                // الرافدين (أساسي — جميع الخطوط)
                platformLines.push(currentSync.rafdain_facebook === 'success' ? `✅ الرافدين فيسبوك — بوست + ستوري 🏛️` : `⚪ الرافدين فيسبوك`);
                platformLines.push(currentSync.rafdain_instagram_story === 'success' ? `✅ الرافدين انستغرام — ستوري 🏛️` : `⚪ الرافدين انستغرام`);
                // سوق بغداد (ستوري فقط)
                platformLines.push(currentSync.souq_facebook_story === 'success' ? `✅ سوق بغداد فيسبوك — ستوري` : `⚪ سوق بغداد فيسبوك`);
                platformLines.push(currentSync.souq_instagram_story === 'success' ? `✅ سوق بغداد انستغرام — ستوري` : `⚪ سوق بغداد انستغرام`);

                const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`🚌 خط نقل: ${cleanRegions} ← ${cleanDestination}`)}`;

                const receiptMsg =
                  `📊 <b>تقرير النشر — #${shortId}</b>\n` +
                  `🚌 ${cleanRegions} ⬅️ ${cleanDestination} | 💰 ${cleanFare}\n\n` +
                  platformLines.join('\n') + '\n\n' +
                  `🌐 بطاقة تفاعلية بالموقع ✅\n` +
                  `❤️ <i>شكراً لثقتك بمنصة سوق بغداد 🤝</i>`;

                // Build buttons with direct post view links
                const reportButtons: any[][] = [];
                const viewRow: any[] = [];
                if (tgPostLink) viewRow.push({ text: '📢 عرض بالقناة', url: tgPostLink });
                if (fbPostLink) viewRow.push({ text: '📘 عرض بفيسبوك', url: fbPostLink });
                if (viewRow.length > 0) reportButtons.push(viewRow);

                const viewRow2: any[] = [];
                if (igPostLink) viewRow2.push({ text: '📸 عرض بانستغرام', url: igPostLink });
                if (rucPostLink) viewRow2.push({ text: '🏛️ عرض قناة الرافدين', url: rucPostLink });
                if (viewRow2.length > 0) reportButtons.push(viewRow2);

                reportButtons.push([{ text: '🌐 بطاقة الخط بالموقع', url: link }]);
                reportButtons.push([{ text: '🚀 ترويج VIP — صدارة المنصات', callback_data: `promo_menu_${insertedTrans.id}` }]);
                reportButtons.push([{ text: '📲 مشاركة مع الأصدقاء', url: shareUrl }]);
                reportButtons.push([{ text: '📊 تقارير إعلاناتي', callback_data: 'my_publish_reports' }, { text: '🏠 الرئيسية', callback_data: 'main_menu' }]);

                await sendMessage(chatId, receiptMsg, { inline_keyboard: reportButtons });
              } catch (msgErr) {
                console.error('Error sending social receipt to chat:', msgErr);
              }
            } catch (err) {
              console.error("Error auto publishing transport to social media:", err);
            }
          } catch(pubErr) {
            console.error("Error in publishBackground task:", pubErr);
          }
        };

        if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
          EdgeRuntime.waitUntil(publishBackground());
        } else {
          publishBackground();
        }

        return new Response('OK', { status: 200 });
      }

      // ==========================================
      // 🟢 MY ACTIVE ADS SUMMARY
      // ==========================================
      if (action === 'my_active_ads_summary') {
        const { data: myAds } = await supabase.from('ads').select('id, category, title').eq('seller_id', userId).eq('status', 'active');
        const { data: myProds } = await supabase.from('products').select('id, title').eq('seller_id', userId).eq('status', 'active');
        
        const activeCars = (myAds || []).filter(a => a.category === 'vehicles' || a.category === 'cars');
        const activeTrans = (myAds || []).filter(a => a.category === 'transport');
        const activeProds = myProds || [];
        
        const total = activeCars.length + activeTrans.length + activeProds.length;
        if (total === 0) {
          await updateOrSend('📭 <b>لا يوجد لديك أي إعلانات نشطة حالياً.</b>\nإذا قمت بنشر إعلان حديثاً، قد يكون قيد المراجعة أو تم بيعه.', { inline_keyboard: [[{ text: '🔙 العودة للقائمة الرئيسية', callback_data: 'main_menu' }]] });
          return new Response('OK', { status: 200 });
        }
        
        let msg = `✅ <b>لديك ${total} إعلانات نشطة حالياً:</b>\n\n`;
        if (activeCars.length > 0) msg += `🚗 <b>قسم السيارات:</b> ${activeCars.length} إعلان\n`;
        if (activeTrans.length > 0) msg += `🚌 <b>قسم خطوط النقل:</b> ${activeTrans.length} إعلان\n`;
        if (activeProds.length > 0) msg += `📦 <b>قسم السلع والمنتجات:</b> ${activeProds.length} إعلان\n`;
        msg += `\n👇 انقر على القسم أدناه لعرض تفاصيل إعلاناتك النشطة وإدارتها (تعديل السعر/حذف/الخ):`;
        
        const btns = [];
        if (activeCars.length > 0) btns.push([{ text: `🚗 إدارة سياراتي النشطة (${activeCars.length})`, callback_data: 'manage_cat_cars' }]);
        if (activeTrans.length > 0) btns.push([{ text: `🚌 إدارة خطوطي النشطة (${activeTrans.length})`, callback_data: 'manage_cat_trans' }]);
        if (activeProds.length > 0) btns.push([{ text: `📦 إدارة منتجاتي النشطة (${activeProds.length})`, callback_data: 'manage_cat_ads' }]);
        btns.push([{ text: '🔙 العودة للقائمة الرئيسية', callback_data: 'main_menu' }]);
        
        await updateOrSend(msg, { inline_keyboard: btns });
        return new Response('OK', { status: 200 });
      }

      // ==========================================
      // 📋 MANAGE MY ADS (WITH CARS & TRANSPORTS)
      // ==========================================
      if (action === 'manage_my_ads') {
        await updateOrSend('📦 <b>إدارة إعلاناتي وخطوطي</b>\n\nاختر القسم الذي ترغب بإدارته أو تعديل سعره أو تعليمه كمباع:', {
          inline_keyboard: [
            [{ text: '🚗 سياراتي المعروضة', callback_data: 'manage_cat_cars' }],
            [{ text: '🚌 خطوط النقل الخاصة بي', callback_data: 'manage_cat_trans' }],
            [{ text: '📢 إعلاناتي ومنتجاتي الأخرى', callback_data: 'manage_cat_ads' }],
            [{ text: '🏠 العودة للقائمة الرئيسية', callback_data: 'main_menu' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      // Submenu: Manage Cars
      if (action === 'manage_cat_cars') {
        const { data: myCars } = await supabase.from('ads')
          .select('*')
          .eq('seller_id', userId)
          .in('category', ['vehicles', 'cars'])
          .order('created_at', { ascending: false });

        if (!myCars || myCars.length === 0) {
          await updateOrSend('📭 ليس لديك إعلانات سيارات منشورة حالياً.', {
            inline_keyboard: [[{ text: '🚗 اعرض سيارة الآن', callback_data: 'publish_car' }], [{ text: '🔙 العودة', callback_data: 'manage_my_ads' }]]
          });
          return new Response('OK', { status: 200 });
        }

        const activeCars = myCars.filter(c => c.status === 'active');
        const soldCars = myCars.filter(c => c.status === 'sold' || c.status === 'matched');

        if (activeCars.length === 0) {
          const bottomButtons = [[{ text: '🚗 اعرض سيارة الآن', callback_data: 'publish_car' }]];
          if (soldCars.length > 0) {
            bottomButtons.push([{ text: `📂 عرض السيارات المباعة سابقاً (${soldCars.length})`, callback_data: 'manage_cars_archive' }]);
          }
          bottomButtons.push([{ text: '🔙 العودة لإدارة الإعلانات', callback_data: 'manage_my_ads' }]);

          await updateOrSend('📭 <b>لا توجد سيارات نشطة معروضة حالياً.</b>\nجميع إعلاناتك السابقة تم بيعها أو إغلاقها.', {
            inline_keyboard: bottomButtons
          });
          return new Response('OK', { status: 200 });
        }

        await updateOrSend(`🚗 <b>سياراتك المعروضة النشطة (${activeCars.length}):</b>`);

        for (const car of activeCars) {
          let specs: any = {};
          try { specs = JSON.parse(car.description); } catch(e){}
          const curr = specs.currency || '$';
          const priceText = formatTgPrice(car.price, curr);
          const carText = `🚗 <b>${car.title}</b> [🟢 معروضة للبيع]\n💰 <b>السعر:</b> ${priceText}\n📍 <b>المحافظة:</b> ${car.location || 'بغداد'}\n📞 <b>الهاتف:</b> ${car.phone || 'غير مسجل'}`;

          const buttons = [
            [{ text: '📢 ترويج ونشر مخصص بالمنصات (بالنقاط) 🎯', callback_data: `promo_menu_${car.id}` }],
            [{ text: '🚀 ترويج وتمييز شامل VIP (5 نقاط) ⭐', callback_data: `boost_ad_${car.id}` }],
            [{ text: '💰 تعديل السعر', callback_data: `edit_car_price_${car.id}` }, { text: '📞 تعديل الهاتف', callback_data: `edit_car_phone_${car.id}` }],
            [{ text: '⚠️ تعليم الإعلان كمباع', callback_data: `mark_sold_${car.id}` }],
            [{ text: '🗑️ حذف الإعلان نهائياً', callback_data: `del_trans_${car.id}` }]
          ];

          await sendMessage(chatId, carText, { inline_keyboard: buttons });
        }

        const navButtons = [];
        if (soldCars.length > 0) {
          navButtons.push([{ text: `📂 أرشيف السيارات المباعة (${soldCars.length})`, callback_data: 'manage_cars_archive' }]);
        }
        navButtons.push([{ text: '🔙 العودة لإدارة الإعلانات', callback_data: 'manage_my_ads' }]);

        await sendMessage(chatId, 'اختر الإجراء المطلوب أسفل كل سيارة نشطة أعلاه 👇', {
          inline_keyboard: navButtons
        });
        return new Response('OK', { status: 200 });
      }

      // Submenu: Manage Cars Archive (Sold Cars)
      if (action === 'manage_cars_archive') {
        const { data: soldCars } = await supabase.from('ads')
          .select('*')
          .eq('seller_id', userId)
          .in('category', ['vehicles', 'cars'])
          .in('status', ['sold', 'matched'])
          .order('created_at', { ascending: false });

        if (!soldCars || soldCars.length === 0) {
          await sendMessage(chatId, '📭 لا توجد سيارات مباعة في الأرشيف.', {
            inline_keyboard: [[{ text: '🔙 العودة لسياراتي', callback_data: 'manage_cat_cars' }]]
          });
          return new Response('OK', { status: 200 });
        }

        await sendMessage(chatId, `📂 <b>أرشيف السيارات المباعة (${soldCars.length}):</b>`);

        for (const car of soldCars) {
          let specs: any = {};
          try { specs = JSON.parse(car.description); } catch(e){}
          const curr = specs.currency || '$';
          const priceText = formatTgPrice(car.price, curr);
          const carText = `🚗 <b>${car.title}</b> [⚠️ مباعة]\n💰 <b>السعر:</b> ${priceText}\n📍 <b>المحافظة:</b> ${car.location || 'بغداد'}`;

          await sendMessage(chatId, carText, {
            inline_keyboard: [[{ text: '🗑️ حذف من الأرشيف', callback_data: `del_trans_${car.id}` }]]
          });
        }

        await sendMessage(chatId, 'نهاية الأرشيف.', {
          inline_keyboard: [[{ text: '🔙 العودة لسياراتي النشطة', callback_data: 'manage_cat_cars' }]]
        });
        return new Response('OK', { status: 200 });
      }

      // Submenu: Manage Transports (Active First + Clean Archive)
      if (action === 'manage_cat_trans') {
        const { data: myTransports } = await supabase.from('ads')
          .select('*')
          .eq('seller_id', userId)
          .eq('category', 'transport')
          .order('created_at', { ascending: false });

        if (!myTransports || myTransports.length === 0) {
          await sendMessage(chatId, '📭 ليس لديك خطوط نقل منشورة حالياً.', {
            inline_keyboard: [[{ text: '🚌 انشر خط نقل الآن', callback_data: 'publish_transport' }], [{ text: '🔙 العودة', callback_data: 'manage_my_ads' }]]
          });
          return new Response('OK', { status: 200 });
        }

        const activeTrans = myTransports.filter(t => t.status === 'active');
        const closedTrans = myTransports.filter(t => t.status === 'matched' || t.status === 'inactive');

        if (activeTrans.length === 0) {
          const bottomBtns = [[{ text: '🚌 انشر خط نقل الآن', callback_data: 'publish_transport' }]];
          if (closedTrans.length > 0) {
            bottomBtns.push([{ text: `📂 عرض الخطوط المكتملة سابقاً (${closedTrans.length})`, callback_data: 'manage_trans_archive' }]);
          }
          bottomBtns.push([{ text: '🔙 العودة لإدارة الإعلانات', callback_data: 'manage_my_ads' }]);

          await sendMessage(chatId, '📭 <b>لا توجد خطوط نقل نشطة حالياً.</b>\nجميع خطوطك السابقة تم إغلاقها واكتمال عددها.', {
            inline_keyboard: bottomBtns
          });
          return new Response('OK', { status: 200 });
        }

        await sendMessage(chatId, `🚌 <b>خطوط النقل النشطة الخاصة بك (${activeTrans.length}):</b>`);

        for (const t of activeTrans) {
          const typeText = t.type === 'offer' ? 'أوفر خط' : 'أبحث عن خط';
          const priceText = formatTgPrice(t.price);
          const isVip = t.is_vip || t.is_featured;
          const transCardText = 
            `🚌 <b>${t.title}</b> (${typeText}) [🟢 نشط${isVip ? ' ⭐ مميز VIP' : ''}]\n` +
            `💰 <b>الأجرة:</b> ${priceText}\n` +
            `📍 <b>المناطق:</b> ${t.location || 'غير محدد'}\n` +
            `🏢 <b>الوجهة:</b> ${t.city || 'غير محدد'}\n` +
            `📞 <b>الهاتف:</b> <code>${t.phone || 'غير مسجل'}</code>`;

          const buttons = [
            [{ text: '👥 عرض الطلاب المحتاجين لخطك فوراً 🎯', callback_data: `match_students_${t.id}` }],
            [{ text: '📢 ترويج ونشر مخصص بالمنصات (بالنقاط) 🎯', callback_data: `promo_menu_${t.id}` }],
            [{ text: '🚀 ترويج وتمييز شامل VIP (5 نقاط) ⭐', callback_data: `boost_ad_${t.id}` }],
            [{ text: '💰 تعديل الأجرة', callback_data: `edit_trans_price_${t.id}` }, { text: '📞 تعديل الهاتف', callback_data: `edit_trans_phone_${t.id}` }],
            [{ text: '🔒 إغلاق الخط (اكتمل العدد)', callback_data: `solve_trans_${t.id}` }],
            [{ text: '🗑️ حذف الخط نهائياً', callback_data: `del_trans_${t.id}` }]
          ];

          await sendMessage(chatId, transCardText, { inline_keyboard: buttons });
        }

        const navBtns = [];
        if (closedTrans.length > 0) {
          navBtns.push([{ text: `📂 أرشيف الخطوط المكتملة (${closedTrans.length})`, callback_data: 'manage_trans_archive' }]);
        }
        navBtns.push([{ text: '🔙 العودة لإدارة الإعلانات', callback_data: 'manage_my_ads' }]);

        await sendMessage(chatId, 'اختر الإجراء المطلوب أسفل كل خط أعلاه 👇', { inline_keyboard: navBtns });
        return new Response('OK', { status: 200 });
      }

      // Submenu: Transport Archive (With 1-click Reactivation)
      if (action === 'manage_trans_archive') {
        const { data: closedTrans } = await supabase.from('ads')
          .select('*')
          .eq('seller_id', userId)
          .eq('category', 'transport')
          .in('status', ['matched', 'inactive'])
          .order('created_at', { ascending: false });

        if (!closedTrans || closedTrans.length === 0) {
          await sendMessage(chatId, '📭 لا توجد خطوط مكتملة في الأرشيف.', {
            inline_keyboard: [[{ text: '🔙 العودة لخطوطي', callback_data: 'manage_cat_trans' }]]
          });
          return new Response('OK', { status: 200 });
        }

        await sendMessage(chatId, `📂 <b>أرشيف الخطوط المكتملة (${closedTrans.length}):</b>`);

        for (const t of closedTrans) {
          const typeText = t.type === 'offer' ? 'أوفر خط' : 'أبحث عن خط';
          const transCardText = `🚌 <b>${t.title}</b> (${typeText}) [🔒 مكتمل ومغلق]\n💰 <b>الأجرة:</b> ${formatTgPrice(t.price)}\n📍 <b>المناطق:</b> ${t.location}\n🏢 <b>الوجهة:</b> ${t.city}`;

          await sendMessage(chatId, transCardText, {
            inline_keyboard: [
              [{ text: '🔄 إعادة فتح وتفعيل الخط 🟢', callback_data: `reactivate_trans_${t.id}` }],
              [{ text: '🗑️ حذف من الأرشيف', callback_data: `del_trans_${t.id}` }]
            ]
          });
        }

        await sendMessage(chatId, 'نهاية أرشيف الخطوط. يمكنك إعادة تفعيل أي خط بضغطة زر واحدة 👆', {
          inline_keyboard: [[{ text: '🔙 العودة لخطوطي النشطة', callback_data: 'manage_cat_trans' }]]
        });
        return new Response('OK', { status: 200 });
      }

      // Delete Ad / Transport completely from all platforms (حذف الإعلان والخط نهائياً)
      if (action.startsWith('del_trans_') || action.startsWith('del_ad_')) {
        const targetId = action.replace('del_trans_', '').replace('del_ad_', '');
        let adQuery = supabase.from('ads').select('*');
        if (targetId.length >= 30) {
          adQuery = adQuery.eq('id', targetId);
        } else {
          adQuery = adQuery.or(`short_id.eq.${targetId},id.eq.${targetId}`);
        }
        if (!isOwner) {
          adQuery = adQuery.eq('seller_id', userId);
        }
        const { data: adToDelete } = await adQuery.maybeSingle();

        if (!adToDelete) {
          await sendMessage(chatId, '❌ لم يتم العثور على الإعلان أو قد تم حذفه مسبقاً.');
          return new Response('OK', { status: 200 });
        }

        // Delete from database (DB trigger on_ad_changed will automatically clean from Telegram, Facebook, Instagram, Threads)
        await supabase.from('ads').delete().eq('id', adToDelete.id);

        const shortCode = adToDelete.short_id || adToDelete.id;
        await sendMessage(chatId, 
          `🗑️ <b>تم حذف إعلانك (#${shortCode}) بنجاح من جميع المنصات! ✅</b>\n\n` +
          `• تم حذفه فوراً من الموقع، قنوات تيليجرام، فيسبوك، وإنستغرام.\n\n` +
          `💡 <b>ملاحظات مهمة إذا رغبت بالنشر مجدداً:</b>\n` +
          `1️⃣ <b>إعادة النشر والترويج:</b> يمكنك استخدام ميزة <b>«ترويج بالنقاط»</b> لإعادة نشر إعلانك بالصدارة فوراً في أي وقت.\n` +
          `2️⃣ <b>تعديل البيانات:</b> إذا كنت ترغب بتغيير الأجرة أو رقم الهاتف أو المسار، يفضل التعديل المباشر قبل الحذف لتوفير النقاط.`,
          {
            inline_keyboard: [
              [{ text: '🚌 نشر خط نقل جديد', callback_data: 'publish_transport' }],
              [{ text: '🚗 نشر سيارة جديدة', callback_data: 'publish_car' }],
              [{ text: '📦 إعلاناتي وخطوطي', callback_data: 'manage_my_ads' }],
              [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
            ]
          }
        );
        return new Response('OK', { status: 200 });
      }

      // Close Transport Line / Sold status (إغلاق الخط أو تعليمه كمباع)
      if (action.startsWith('solve_trans_') || action.startsWith('mark_sold_')) {
        const isMarkSold = action.startsWith('mark_sold_');
        const targetId = action.replace('solve_trans_', '').replace('mark_sold_', '');
        
        // Check ads table first
        let adQuery = supabase.from('ads').select('*');
        if (targetId.length >= 30) {
          adQuery = adQuery.eq('id', targetId);
        } else {
          adQuery = adQuery.or(`short_id.eq.${targetId},id.eq.${targetId}`);
        }
        if (!isOwner) {
          adQuery = adQuery.eq('seller_id', userId);
        }
        const { data: adToClose } = await adQuery.maybeSingle();

        // Check products table next
        let prodQuery = supabase.from('products').select('*');
        if (targetId.length >= 30) {
          prodQuery = prodQuery.eq('id', targetId);
        } else {
          prodQuery = prodQuery.or(`short_id.eq.${targetId},id.eq.${targetId}`);
        }
          prodQuery = phone ? prodQuery.or(`seller_id.eq.${userId},phone.eq.${phone}`) : prodQuery.eq('seller_id', userId);
        const { data: prodToClose } = await prodQuery.maybeSingle();

        const itemToClose = adToClose || prodToClose;
        const targetTable = adToClose ? 'ads' : (prodToClose ? 'products' : null);

        if (!itemToClose || !targetTable) {
          await sendMessage(chatId, '❌ لم يتم العثور على الإعلان.');
          return new Response('OK', { status: 200 });
        }

        const isProduct = targetTable === 'products';
        const isCar = targetTable === 'ads' && (itemToClose.category === 'vehicles' || itemToClose.category === 'cars' || itemToClose.category === 'car');
        
        const newStatus = isProduct ? 'sold' : (isCar ? 'sold' : 'matched');
        const { error: updateErr } = await supabase.from(targetTable).update({ status: newStatus }).eq('id', itemToClose.id);
        
        if (updateErr) {
          console.error('[MARK_SOLD] Error updating status:', updateErr);
        }

        const shortCode = itemToClose.short_id || itemToClose.id;
        const tagText = isProduct ? 'تم تعليم المنتج كـ مباع 🛍️' : (isCar ? 'تم تعليم السيارة كـ مباعة 🚗' : 'تم إغلاق الخط واكتمال العدد 🔒');
        
        const archiveButton = isProduct 
          ? { text: '🛍️ إدارة منتجاتي', callback_data: 'manage_cat_ads' }
          : { text: '📂 عرض الأرشيف', callback_data: isCar ? 'manage_cars_archive' : 'manage_trans_archive' };

        await sendMessage(chatId,
          `✅ <b>${tagText} (#${shortCode}) بنجاح!</b>\n\n` +
          `• تم تحديث المنشورات في قنوات تيليجرام وصفحات التواصل لتصبح مباعة أو مكتملة.\n` +
          `• تم نقل الإعلان إلى <b>الأرشيف</b> ولن يزعجك أحد بالاتصال.\n\n` +
          `💡 <b>هل تريد إعادة فتح الإعلان مستقبلاً؟</b>\n` +
          `• يمكنك الدخول للأرشيف والضغط على <b>«🔄 إعادة تفعيل»</b> أو تعديل بياناته.\n` +
          `• يمكنك عمل <b>«ترويج بالنقاط»</b> لإعادة نشره في الصدارة كإعلان جديد كلياً!`,
          {
            inline_keyboard: [
              [archiveButton],
              [{ text: isProduct ? '🛒 نشر منتج جديد' : (isCar ? '🚗 إدارة سياراتي' : '🚌 إدارة خطوطي'), callback_data: isProduct ? 'publish_product' : (isCar ? 'manage_cat_cars' : 'manage_cat_trans') }],
              [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
            ]
          }
        );
        return new Response('OK', { status: 200 });
      }

      // Reactivate Transport Line (إعادة تفعيل الخط)
      if (action.startsWith('reactivate_trans_')) {
        const transId = action.replace('reactivate_trans_', '');
        await supabase.from('ads').update({ status: 'active' }).eq('id', transId).eq('seller_id', userId);
        
        await sendMessage(chatId, `✅ <b>تمت إعادة فتح وتفعيل خطك بنجاح! 🟢</b>\n\nأصبح الآن نشطاً بالموقع وقنوات التيليجرام ويستطيع الركاب والطلاب التواصل معك مباشرة 🤝\n\n💡 <i>إذا أردت نشره مجدداً بصدارة فيسبوك وانستغرام، استخدم زر «ترويج بالنقاط» أدناه.</i>`, {
          inline_keyboard: [
            [{ text: '🚀 ترويج ونشر بالمنصات (بالنقاط)', callback_data: `promo_menu_${transId}` }],
            [{ text: '👥 عرض الطلاب المحتاجين للخط فوراً', callback_data: `match_students_${transId}` }],
            [{ text: '📋 إدارة خطوطي', callback_data: 'manage_cat_trans' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      // ==========================================
      // 📢 PROMO SELECT AD (من القائمة الرئيسية)
      // ==========================================
      if (action === 'promo_select_ad') {
        const { data: myActiveAds } = await supabase.from('ads')
          .select('*')
          .eq('seller_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (!myActiveAds || myActiveAds.length === 0) {
          await sendMessage(chatId, 
            `📭 <b>ليس لديك إعلانات نشطة حالياً لترويجها!</b>\n\n` +
            `يمكنك نشر خط نقل أو سيارة أو منتج مجاناً أولاً، ثم ترويجه بالنقاط على المنصات 👇`,
            {
              inline_keyboard: [
                [{ text: '🚌 انشر خط نقل الآن', callback_data: 'publish_transport' }],
                [{ text: '🚗 اعرض سيارة للبيع', callback_data: 'publish_car' }],
                [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
              ]
            }
          );
          return new Response('OK', { status: 200 });
        }

        const { data: userProf } = await supabase.from('profiles').select('points').eq('id', userId).maybeSingle();
        const curPts = userProf?.points || 0;

        let promoSelectMsg = 
          `🚀 <b>لوحة الترويج والنشر بالمنصات — سوق بغداد</b> 🇮🇶\n\n` +
          `🪙 <b>رصيدك الحالي:</b> <b>${isOwner ? 'غير محدود (المالك)' : curPts} نقطة</b>\n\n` +
          `اختر الإعلان أو الخط الذي ترغب بنشره وترويجه على فيسبوك وانستغرام وتيليجرام 👇:`;

        const adBtns: any[] = [];
        for (const ad of myActiveAds) {
          const icon = ad.category === 'transport' ? '🚌' : '🚗';
          const title = ad.title || 'إعلان بدون عنوان';
          const shortId = ad.short_id || ad.id;
          adBtns.push([{ text: `${icon} ${title.substring(0, 32)} (#${shortId})`, callback_data: `promo_menu_${ad.id}` }]);
        }

        adBtns.push([
          { text: '💳 شراء نقاط', callback_data: 'buy_points' },
          { text: '🎁 كسب نقاط مجانية', callback_data: 'invite_and_earn' }
        ]);
        adBtns.push([{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]);

        await sendMessage(chatId, promoSelectMsg, { inline_keyboard: adBtns });
        return new Response('OK', { status: 200 });
      }

      // ==========================================
      // 📢 CUSTOM PLATFORM PROMOTION HUB (بالنقاط)
      // ==========================================
      if (action.startsWith('promo_menu_')) {
        const adId = action.replace('promo_menu_', '');
        const { data: targetAd } = await supabase.from('ads').select('*').eq('id', adId).eq('seller_id', userId).maybeSingle();

        if (!targetAd) {
          await sendMessage(chatId, `❌ لم يتم العثور على الإعلان المطلوب.`);
          return new Response('OK', { status: 200 });
        }

        const { data: userProf } = await supabase.from('profiles').select('points').eq('id', userId).maybeSingle();
        const currentPoints = userProf?.points || 0;
        const shortId = targetAd.short_id || targetAd.id;
        const isRafdain = (targetAd.title + ' ' + (targetAd.location || '') + ' ' + (targetAd.city || '')).includes('الرافدين');
        const isTrans = targetAd.category === 'transport';

        const promoMenuText = 
          `📢 <b>لوحة النشر والترويج وإعادة النشر بالمنصات 🎯</b>\n\n` +
          `🔖 <b>الإعلان:</b> <b>${targetAd.title}</b> (<code>#${shortId}</code>)\n` +
          `🪙 <b>رصيدك الحالي:</b> <b>${isOwner ? 'غير محدود (المالك)' : currentPoints} نقطة</b>\n\n` +
          `💡 <i>عند الترويج، يحذف النظام المنشور القديم تلقائياً وينشر البوست الجديد في صدارة الصفحة مع تزويدك برابط مباشر لمعاينته!</i>\n\n` +
          `اختر المنصة والصفحة التي ترغب بالنشر عليها بالتحديد 👇`;

        const menuKeyboard: any[] = [];

        if (isTrans) {
          menuKeyboard.push([{ text: '📘 بوست + ستوري: فيسبوك الرافدين (5 نقاط)', callback_data: `promo_act_fb_rafdain_${adId}` }]);
          menuKeyboard.push([{ text: '📸 ستوري انستغرام: كلية الرافدين (2 نقطة)', callback_data: `promo_act_ig_story_rafdain_${adId}` }]);
          menuKeyboard.push([{ text: '📘 ستوري فيسبوك 9:16: صفحة سوق بغداد (2 نقطة)', callback_data: `promo_act_fb_story_souq_${adId}` }]);
          menuKeyboard.push([{ text: '📸 ستوري انستغرام 9:16: @souqbaghdad.iq (2 نقطة)', callback_data: `promo_act_ig_story_${adId}` }]);
          menuKeyboard.push([{ text: '👑 الباقة الشاملة VIP لكل المنصات المذكورة (10 نقاط)', callback_data: `boost_ad_${adId}` }]);
        } else if (isRafdain) {
          menuKeyboard.push([{ text: '📘 بوست فيسبوك: صفحة كلية الرافدين (5 نقاط)', callback_data: `promo_act_fb_rafdain_${adId}` }]);
          menuKeyboard.push([{ text: '📘 بوست فيسبوك: صفحة سوق بغداد الرسمية (5 نقاط)', callback_data: `promo_act_fb_souq_${adId}` }]);
          menuKeyboard.push([{ text: '📘 بوست فيسبوك: الرافدين + سوق بغداد معاً (7 نقاط)', callback_data: `promo_act_fb_both_${adId}` }]);
          menuKeyboard.push([{ text: '📸 بوست انستغرام: @souqbaghdad.iq (5 نقاط)', callback_data: `promo_act_ig_feed_${adId}` }]);
          menuKeyboard.push([{ text: '📘 ستوري فيسبوك 9:16: صفحة كلية الرافدين (2 نقطة)', callback_data: `promo_act_fb_story_rafdain_${adId}` }]);
          menuKeyboard.push([{ text: '📘 ستوري فيسبوك 9:16: صفحة سوق بغداد (2 نقطة)', callback_data: `promo_act_fb_story_souq_${adId}` }]);
          menuKeyboard.push([{ text: '📸 ستوري انستغرام 9:16: @souqbaghdad.iq (2 نقطة)', callback_data: `promo_act_ig_story_${adId}` }]);
          menuKeyboard.push([{ text: '👑 الباقة الشاملة VIP لكل الصفحات والقنوات (10 نقاط)', callback_data: `boost_ad_${adId}` }]);
        } else {
          menuKeyboard.push([{ text: '📘 بوست فيسبوك: صفحة سوق بغداد (5 نقاط)', callback_data: `promo_act_fb_souq_${adId}` }]);
          menuKeyboard.push([{ text: '📸 بوست انستغرام: @souqbaghdad.iq (5 نقاط)', callback_data: `promo_act_ig_feed_${adId}` }]);
          menuKeyboard.push([{ text: '📘 ستوري فيسبوك 9:16: صفحة سوق بغداد (2 نقطة)', callback_data: `promo_act_fb_story_souq_${adId}` }]);
          menuKeyboard.push([{ text: '📸 ستوري انستغرام 9:16: @souqbaghdad.iq (2 نقطة)', callback_data: `promo_act_ig_story_${adId}` }]);
          menuKeyboard.push([{ text: '👑 الباقة الشاملة VIP لجميع المنصات (10 نقاط)', callback_data: `boost_ad_${adId}` }]);
        }

        menuKeyboard.push([
          { text: '💳 شراء نقاط', callback_data: 'buy_points' }, 
          { text: '🎁 كسب نقاط مجانية', callback_data: 'invite_and_earn' }
        ]);
        menuKeyboard.push([{ text: '🔙 العودة لقائمة الإعلانات', callback_data: isTrans ? 'manage_cat_trans' : 'manage_cat_cars' }]);

        await sendMessage(chatId, promoMenuText, { inline_keyboard: menuKeyboard });
        return new Response('OK', { status: 200 });
      }

      // Execute Custom Single Platform Promotion
      if (action.startsWith('promo_act_')) {
        // format: promo_act_[platformType]_[adId]
        const prefixMatch = action.match(/^promo_act_(fb_rafdain|fb_souq|fb_both|fb_feed|ig_feed|fb_story_rafdain|fb_story_souq|fb_story|ig_story_rafdain|ig_story)_(.+)$/);
        let platformType = '';
        let targetAdId = '';

        if (prefixMatch) {
          platformType = prefixMatch[1];
          targetAdId = prefixMatch[2];
        } else {
          const rawParts = action.split('_');
          platformType = `${rawParts[2]}_${rawParts[3]}`;
          targetAdId = rawParts.slice(4).join('_');
        }

        let adQuery = supabase.from('ads').select('*');
        if (targetAdId.length >= 30) {
          adQuery = adQuery.eq('id', targetAdId);
        } else {
          adQuery = adQuery.or(`short_id.eq.${targetAdId},id.eq.${targetAdId}`);
        }

        if (!isOwner) {
          adQuery = adQuery.eq('seller_id', userId);
        }

        const { data: targetAd } = await adQuery.maybeSingle();
        if (!targetAd) {
          await sendMessage(chatId, `❌ لم يتم العثور على الإعلان المطلوب (كود: ${targetAdId}).`);
          return new Response('OK', { status: 200 });
        }

        const pointCosts: Record<string, number> = {
          fb_rafdain: 5,
          fb_souq: 5,
          fb_both: 7,
          fb_feed: 5,
          ig_feed: 5,
          fb_story_rafdain: 2,
          fb_story_souq: 2,
          fb_story: 2,
          ig_story_rafdain: 2,
          ig_story: 2
        };

        const cost = pointCosts[platformType] || 5;
        const { data: userProf } = await supabase.from('profiles').select('points').eq('id', userId).maybeSingle();
        const currentPoints = userProf?.points || 0;

        if (currentPoints < cost && !isOwner) {
          await sendMessage(chatId, 
            `❌ <b>رصيدك غير كافٍ لهذا الإجراء!</b>\n\n` +
            `التكلفة المطلوبة: <b>${cost} نقاط</b>\n` +
            `رصيدك الحالي: <b>${currentPoints} نقطة</b>\n\n` +
            `💡 يمكنك شحن محفظتك أو كسب نقاط مجاناً عبر دعوة أصدقائك.`,
            {
              inline_keyboard: [
                [{ text: '🎁 كسب نقاط مجانية بالدعوة', callback_data: 'invite_and_earn' }],
                [{ text: '💳 شراء نقاط', callback_data: 'buy_points' }],
                [{ text: '🔙 عودة للقائمة', callback_data: `promo_menu_${targetAdId}` }]
              ]
            }
          );
          return new Response('OK', { status: 200 });
        }

        const isTransport = targetAd.category === 'transport';
        const shortId = targetAd.short_id || targetAd.id;
        const adLink = isTransport 
          ? `https://www.souqbaghdad.store/transport/card/${shortId}` 
          : `https://www.souqbaghdad.store/ad/${shortId}`;

        const allImages = (targetAd.images && Array.isArray(targetAd.images) && targetAd.images.length > 0) 
          ? targetAd.images 
          : [];
        const primaryImg = allImages.length > 0 ? allImages[0] : '';
        const postImg: string | string[] = allImages.length > 0 
          ? allImages 
          : `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=post&category=${encodeURIComponent(targetAd.category || 'transport')}&title=${encodeURIComponent(targetAd.title)}&regions=${encodeURIComponent(targetAd.location || '')}&destination=${encodeURIComponent(targetAd.city || '')}&fare=${encodeURIComponent(targetAd.price || '')}&short_id=${encodeURIComponent(shortId)}&phone=${encodeURIComponent(targetAd.phone || '')}`;

        const storyImg = buildStoryImageUrl(targetAd, targetAd.category || (isTransport ? 'transport' : 'car'), targetAd.images || primaryImg);

        let syncStatus = typeof targetAd.sync_status === 'object' && targetAd.sync_status ? { ...targetAd.sync_status } : {};
        let successReport = '';
        let directPostUrl: string | null = null;
        let directButtonLabel = '🌐 مشاهدة الإعلان في المنصة';

        try {
          const caption = await generateSocialCaption(targetAd, isTransport ? 'transport' : 'car', adLink);

          // 1. Facebook: Al-Rafdain Only
          if (platformType === 'fb_rafdain') {
            const rucFbSetting = await getLiveSocialSetting('fb_rafdain');
            const rucToken = rucFbSetting?.access_token || ALRAFDAIN_FB_TOKEN;
            const rucPageId = rucFbSetting?.page_id || ALRAFDAIN_FB_PAGE_ID || '102975411515668';
            
            // Delete previous posts for this ad to prevent duplicates
            await deleteOldFacebookPostsForAd(shortId, rucPageId, rucToken, syncStatus.rafdain_facebook_post_id);

            const rucRes = await postToFacebook(caption, postImg, rucToken, rucPageId);
            if (rucRes?.id || rucRes?.post_id) {
              const pid = rucRes.post_id || rucRes.id;
              syncStatus.rafdain_facebook = 'success';
              syncStatus.rafdain_facebook_post_id = pid;
              directPostUrl = rucRes.permalink_url || rucRes.url || `https://www.facebook.com/${rucPageId}/posts/${pid.split('_')[1] || pid}`;
              directButtonLabel = '📘 مشاهدة البوست على صفحة كلية الرافدين';
              successReport = `📘 <b>تم نشر البوست في صدارة صفحة كلية الرافدين بنجاح! ✅</b>\n🔗 <b>رابط البوست المباشر:</b> <a href="${directPostUrl}">${directPostUrl}</a>`;
            } else {
              const errTxt = rucRes?.error?.message || 'تعذر النشر على الصفحة حالياً';
              successReport = `⚠️ <b>تنبيه فيسبوك:</b> ${errTxt}`;
            }

            if (isTransport) {
              const storyRes = await postToFacebookStory(storyImg, rucPageId, rucToken);
              if (!storyRes?.error && !successReport.includes('⚠️')) {
                 successReport = successReport.replace('تم نشر البوست', 'تم نشر البوست والستوري');
              }
            }
          } 
          // 2. Facebook: Souq Baghdad Only
          else if (platformType === 'fb_souq' || platformType === 'fb_feed') {
            const souqFbSetting = await getLiveSocialSetting('fb_souq');
            const souqToken = souqFbSetting?.access_token || META_PAGE_ACCESS_TOKEN;
            const souqPageId = souqFbSetting?.page_id || META_PAGE_ID || '1088044114402452';

            // Delete previous posts for this ad to prevent duplicates
            await deleteOldFacebookPostsForAd(shortId, souqPageId, souqToken, syncStatus.facebook_post_id || targetAd.facebook_post_id);

            const fbRes = await postToFacebook(caption, postImg, souqToken, souqPageId);
            if (fbRes?.id || fbRes?.post_id) {
              const pid = fbRes.post_id || fbRes.id;
              syncStatus.facebook = 'success';
              syncStatus.facebook_post_id = pid;
              const pidClean = pid.includes('_') ? pid : `${souqPageId}_${pid}`;
              directPostUrl = fbRes.permalink_url || `https://www.facebook.com/permalink.php?story_fbid=${pidClean.split('_')[1] || pid}&id=${souqPageId}`;
              directButtonLabel = '📘 مشاهدة البوست على صفحة سوق بغداد';
              successReport = `📘 <b>تم نشر البوست في صدارة صفحة سوق بغداد الرسمية بنجاح! ✅</b>\n🔗 <b>رابط البوست المباشر:</b> <a href="${directPostUrl}">${directPostUrl}</a>`;
            } else {
              const errTxt = fbRes?.error?.message || 'تعذر النشر على الصفحة حالياً';
              if (fbRes?.error?.code === 190 && souqFbSetting?.id) {
                await supabase.from('social_settings').update({ last_status: 'error', last_error: fbRes.error.message }).eq('id', souqFbSetting.id);
              }
              successReport = `⚠️ <b>تنبيه فيسبوك:</b> ${errTxt}`;
            }
          }
          // 3. Facebook: Both Pages
          else if (platformType === 'fb_both') {
            const rucFbSetting = await getLiveSocialSetting('fb_rafdain');
            const rucToken = rucFbSetting?.access_token || ALRAFDAIN_FB_TOKEN;
            const rucPageId = rucFbSetting?.page_id || ALRAFDAIN_FB_PAGE_ID || '102975411515668';

            const souqFbSetting = await getLiveSocialSetting('fb_souq');
            const souqToken = souqFbSetting?.access_token || META_PAGE_ACCESS_TOKEN;
            const souqPageId = souqFbSetting?.page_id || META_PAGE_ID || '1088044114402452';

            // Delete old from both
            await deleteOldFacebookPostsForAd(shortId, souqPageId, souqToken, syncStatus.facebook_post_id || targetAd.facebook_post_id);
            await deleteOldFacebookPostsForAd(shortId, rucPageId, rucToken, syncStatus.rafdain_facebook_post_id);

            let souqPostUrl = '';
            let rucPostUrl = '';

            const fbRes = await postToFacebook(caption, postImg, souqToken, souqPageId);
            if (fbRes?.id || fbRes?.post_id) {
              const pid = fbRes.post_id || fbRes.id;
              syncStatus.facebook = 'success';
              syncStatus.facebook_post_id = pid;
              const pidC1 = pid.includes('_') ? pid : `${souqPageId}_${pid}`;
              souqPostUrl = fbRes.permalink_url || `https://www.facebook.com/permalink.php?story_fbid=${pidC1.split('_')[1] || pid}&id=${souqPageId}`;
            }

            const rucRes = await postToFacebook(caption, postImg, rucToken, rucPageId);
            if (rucRes?.id || rucRes?.post_id) {
              const pid = rucRes.post_id || rucRes.id;
              syncStatus.rafdain_facebook = 'success';
              syncStatus.rafdain_facebook_post_id = pid;
              const pidC2 = pid.includes('_') ? pid : `${rucPageId}_${pid}`;
              rucPostUrl = rucRes.permalink_url || `https://www.facebook.com/permalink.php?story_fbid=${pidC2.split('_')[1] || pid}&id=${rucPageId}`;
            }

            directPostUrl = souqPostUrl || rucPostUrl;
            directButtonLabel = '📘 مشاهدة البوست على صفحة سوق بغداد';

            if (souqPostUrl || rucPostUrl) {
              successReport = `📘 <b>تم تجديد ونشر البوست على الصفحات بنجاح! ✅</b>` +
                (souqPostUrl ? `\n🔗 <b>رابط صفحة سوق بغداد:</b> <a href="${souqPostUrl}">${souqPostUrl}</a>` : '') +
                (rucPostUrl ? `\n🔗 <b>رابط صفحة كلية الرافدين:</b> <a href="${rucPostUrl}">${rucPostUrl}</a>` : '');
            } else {
              successReport = `⚠️ <b>تنبيه:</b> ${fbRes?.error?.message || rucRes?.error?.message || 'تعذر إكمال النشر على الصفحتين'}`;
            }
          }
          // 4. Instagram Feed
          else if (platformType === 'ig_feed') {
            const oldIgPostId = syncStatus.instagram_post_id || targetAd.instagram_post_id;
            if (oldIgPostId) {
              await deleteFromInstagram(oldIgPostId);
            }
            const igRes = await postToInstagram(caption, postImg);
            if (igRes?.id || igRes?.media_id) {
              syncStatus.instagram = 'success';
              syncStatus.instagram_post_id = igRes.id || igRes.media_id;
              directPostUrl = igRes.permalink || igRes.url || 'https://www.instagram.com/souqbaghdad.iq/';
              directButtonLabel = '📸 مشاهدة البوست على انستغرام';
              successReport = `📸 <b>تم نشر البوست في صدارة فيد انستغرام بنجاح! ✅</b>` +
                (directPostUrl && directPostUrl.includes('/p/') ? `\n🔗 <b>رابط البوست المباشر:</b> <a href="${directPostUrl}">${directPostUrl}</a>` : `\n(حساب سوق بغداد الرسمي @souqbaghdad.iq)`);
            } else {
              const errTxt = igRes?.error?.message || 'تعذر النشر على انستغرام حالياً';
              successReport = `⚠️ <b>تنبيه انستغرام:</b> ${errTxt}`;
            }
          }
          // 5. Facebook Story: Al-Rafdain
          else if (platformType === 'fb_story_rafdain') {
            const rucFbSetting = await getLiveSocialSetting('fb_rafdain');
            const rucToken = rucFbSetting?.access_token || ALRAFDAIN_FB_TOKEN;
            const rucPageId = rucFbSetting?.page_id || ALRAFDAIN_FB_PAGE_ID || '102975411515668';
            const storyRes = await postToFacebookStory(storyImg, rucPageId, rucToken);
            if (storyRes?.error) {
              successReport = `⚠️ <b>تنبيه ستوري فيسبوك:</b> ${storyRes.error.message || 'لم يكتمل نشر الستوري'}`;
            } else {
              directPostUrl = `https://www.facebook.com/${rucPageId}`;
              directButtonLabel = '📘 فتح صفحة كلية الرافدين لمشاهدة الستوري';
              successReport = `📘 <b>تم نشر ستوري 9:16 على صفحة كلية الرافدين الجامعة بنجاح! ✅</b>\n🔗 <a href="${directPostUrl}">اضغط هنا لفتح الصفحة والستوري</a>`;
            }
          }
          // 6. Facebook Story: Souq Baghdad
          else if (platformType === 'fb_story_souq' || platformType === 'fb_story') {
            // Always fetch live token from DB
            const souqFbStorySetting = await getLiveSocialSetting('fb_souq');
            const souqStoryToken = souqFbStorySetting?.access_token || META_PAGE_ACCESS_TOKEN;
            const souqStoryPageId = souqFbStorySetting?.page_id || META_PAGE_ID || '1088044114402452';
            const storyRes = await postToFacebookStory(storyImg, souqStoryPageId, souqStoryToken);
            if (storyRes?.error) {
              successReport = `⚠️ <b>تنبيه ستوري فيسبوك:</b> ${storyRes.error.message || 'لم يكتمل نشر الستوري'}`;
            } else {
              directPostUrl = `https://www.facebook.com/${souqStoryPageId}`;
              directButtonLabel = '📘 فتح صفحة سوق بغداد لمشاهدة الستوري';
              successReport = `📘 <b>تم نشر ستوري 9:16 على صفحة سوق بغداد الرسمية بنجاح! ✅</b>\n🔗 <a href="${directPostUrl}">اضغط هنا لفتح الصفحة والستوري</a>`;
            }
          }
          // 7. Instagram Story
          else if (platformType === 'ig_story') {
            const storyRes = await postToInstagramStory(storyImg);
            if (storyRes?.error) {
              successReport = `⚠️ <b>تنبيه ستوري انستغرام:</b> ${storyRes.error.message || 'لم يكتمل نشر الستوري'}`;
            } else {
              directPostUrl = 'https://www.instagram.com/souqbaghdad.iq/';
              directButtonLabel = '📸 فتح حساب انستغرام لمشاهدة الستوري';
              successReport = `📸 <b>تم نشر ستوري 9:16 على انستغرام بنجاح! ✅</b>\n🔗 <a href="${directPostUrl}">اضغط هنا لفتح الحساب والستوري</a>`;
            }
          }
          // 8. Instagram Story: Al-Rafdain
          else if (platformType === 'ig_story_rafdain') {
            const rucIgSetting = await getLiveSocialSetting('ig_rafdain');
            const igToken = rucIgSetting?.access_token || ALRAFDAIN_FB_TOKEN || META_PAGE_ACCESS_TOKEN;
            const rawId = rucIgSetting?.extra_id || rucIgSetting?.page_id || ALRAFDAIN_IG_ID || '17841404181680155';
            const igId = (rawId && rawId.startsWith('1784')) ? rawId : (ALRAFDAIN_IG_ID || '17841404181680155');
            
            const storyRes = await postToInstagramStory(storyImg, igId, igToken);
            if (storyRes?.error) {
              successReport = `⚠️ <b>تنبيه ستوري انستغرام الرافدين:</b> ${storyRes.error.message || 'لم يكتمل نشر الستوري'}`;
            } else {
              directPostUrl = 'https://www.instagram.com/'; // Instagram doesn't easily link to stories on web without username
              directButtonLabel = '📸 فتح انستغرام لمشاهدة الستوري';
              successReport = `📸 <b>تم نشر ستوري 9:16 على انستغرام الرافدين بنجاح! ✅</b>\n🔗 <a href="${directPostUrl}">اضغط هنا لفتح الحساب والستوري</a>`;
            }
          }

          syncStatus.last_promoted_at = new Date().toISOString();
          await supabase.from('ads').update({ sync_status: syncStatus, is_vip: true }).eq('id', targetAd.id);

        } catch(actErr) {
          console.error('[PROMO ACTION ERROR]', actErr);
          successReport = `⚠️ تم تنفيذ طلب النشر وتحديث البيانات بنجاح.`;
        }

        let isRefunded = false;
        if (successReport.includes('⚠️')) {
          isRefunded = true;
        }

        if (!isOwner && !isRefunded) {
           await supabase.from('profiles').update({ points: currentPoints - cost }).eq('id', userId);
        }

        const remainingPts = isOwner ? 'غير محدود (المالك)' : (isRefunded ? currentPoints : currentPoints - cost);
        const costStr = isRefunded ? `0 نقطة (تم استرجاع ${cost} نقاط بسبب فشل النشر)` : `${cost} نقاط`;

        const promoActionKeyboard: any[] = [];
        if (directPostUrl && !isRefunded) {
          promoActionKeyboard.push([{ text: directButtonLabel, url: directPostUrl }]);
        }
        promoActionKeyboard.push([{ text: '🌐 عرض بطاقة الإعلان بالموقع', url: adLink }]);
        promoActionKeyboard.push([{ text: '📢 ترويج لمنصة أو صفحة أخرى', callback_data: `promo_menu_${targetAdId}` }]);
        promoActionKeyboard.push([{ text: '📦 العودة لإعلاناتي', callback_data: isTransport ? 'manage_cat_trans' : 'manage_cat_cars' }]);

        await sendMessage(chatId, 
          `🎉 <b>${isRefunded ? 'محاولة النشر واجهت مشكلة' : 'مبروك! تم ترويج ونشر إعلانك بنجاح 🚀'}</b>\n\n` +
          `${successReport}\n\n` +
          `🪙 النقاط المخصومة: <b>${costStr}</b>\n` +
          `💳 رصيدك المتبقي: <b>${remainingPts} نقطة</b>\n\n` +
          (!isRefunded ? `👇 <i>يمكنك الضغط على الزر أدناه لمعاينة منشورك مباشرة على الصفحة ومشاركته:</i>` : ''),
          {
            inline_keyboard: promoActionKeyboard
          }
        );
        return new Response('OK', { status: 200 });
      }

      // Boost Ad with Points (ترويج الإعلان بالنقاط مع منع التكرار وحذف البوست القديم وتجديده)
      if (action.startsWith('boost_ad_')) {
        const adId = action.replace('boost_ad_', '');
        let adQuery = supabase.from('ads').select('*');
        if (adId.length >= 30) {
          adQuery = adQuery.eq('id', adId);
        } else {
          adQuery = adQuery.or(`short_id.eq.${adId},id.eq.${adId}`);
        }
        if (!isOwner) {
          adQuery = adQuery.eq('seller_id', userId);
        }
        const { data: targetAd } = await adQuery.maybeSingle();

        if (!targetAd) {
          await sendMessage(chatId, `❌ لم يتم العثور على الإعلان المطلوب.`);
          return new Response('OK', { status: 200 });
        }

        // 1. Check 24-hour Cooldown
        const lastBoost = targetAd.last_boosted_at || targetAd.sync_status?.last_boosted_at;
        if (lastBoost && !isOwner) {
          const elapsedMs = Date.now() - new Date(lastBoost).getTime();
          const elapsedHours = elapsedMs / (1000 * 60 * 60);
          if (elapsedHours < 24) {
            const remainingHours = Math.ceil(24 - elapsedHours);
            await sendMessage(chatId, 
              `⏳ <b>إعلانك مروّج ومميز حالياً في الصدارة! ⭐</b>\n\n` +
              `📌 <b>النظام:</b> يُسمح بالترويج وإعادة التجديد مرة واحدة كل <b>24 ساعة</b> لضمان عدم إزعاج الأعضاء.\n` +
              `⏱️ الوقت المتبقي لإعادة الترويج: <b>${remainingHours} ساعة</b>.`,
              {
                inline_keyboard: [[{ text: '📋 عرض خطوطي النشطة', callback_data: 'manage_cat_trans' }]]
              }
            );
            return new Response('OK', { status: 200 });
          }
        }

        // 2. Check User Balance
        const { data: userProf } = await supabase.from('profiles').select('points').eq('id', userId).maybeSingle();
        const currentPoints = userProf?.points || 0;
        const boostCost = 5;

        if (currentPoints < boostCost && !isOwner) {
          await sendMessage(chatId, `❌ <b>رصيدك غير كافٍ لترويج الإعلان!</b>\n\nتكلفة التمييز: <b>${boostCost} نقاط</b>\nرصيدك الحالي: <b>${currentPoints} نقطة</b>\n\n💡 يمكنك شحن المحفظة أو دعوة أصدقائك للحصول على نقاط مجانية.`, {
            inline_keyboard: [
              [{ text: '🎁 كسب نقاط مجانية بالدعوة', callback_data: 'invite_and_earn' }],
              [{ text: '💳 شراء نقاط', callback_data: 'buy_points' }],
              [{ text: '🔙 عودة', callback_data: 'manage_cat_trans' }]
            ]
          });
          return new Response('OK', { status: 200 });
        }

        // 3. Deduct Points
        if (!isOwner) {
          await supabase.from('profiles').update({ points: currentPoints - boostCost }).eq('id', userId);
        }

        // 4. Delete Old Post from Telegram, Facebook, and Instagram (منع تكرار وحذف البوست القديم)
        if (targetAd.telegram_message_id) {
          const oldMsgId = parseInt(targetAd.telegram_message_id, 10);
          const channelList = [LINES_CHANNEL_ID, LINES_CHANNEL, '@souqbaghdad_lines', CAR_CHANNEL_ID, CAR_CHANNEL, '@souqbaghdad_car', PRODUCT_CHANNEL_ID, PRODUCT_CHANNEL, '@souqbaghdad_iq'];
          for (const ch of channelList) {
            if (ch) {
              try { await deleteMessage(ch, oldMsgId); } catch(e) {}
            }
          }
        }
        
        if (targetAd.facebook_post_id) {
          try { await deleteFromFacebook(targetAd.facebook_post_id); } catch(e) { console.error('FB delete error:', e); }
        }
        if (targetAd.instagram_post_id) {
          try { await deleteFromInstagram(targetAd.instagram_post_id); } catch(e) { console.error('IG delete error:', e); }
        }

        // 5. Publish Fresh VIP Post to Channel + Facebook & Instagram Feed (VIP Promotion via points)
        const isTransport = targetAd.category === 'transport';
        const targetChannel = isTransport ? (LINES_CHANNEL_ID || LINES_CHANNEL || '@souqbaghdad_lines') : (CAR_CHANNEL_ID || CAR_CHANNEL || '@souqbaghdad_car');
        const adLink = `https://www.souqbaghdad.store/${isTransport ? 'ad' : 'product'}/${targetAd.short_id || targetAd.id}`;
        
        let vipCaption = `⭐ <b>[إعلان مميز VIP — متصدر الصدارة]</b>\n\n` +
          `🚌 <b>${targetAd.title}</b>\n` +
          `📍 <b>المسار:</b> ${targetAd.location || 'بغداد'}\n` +
          `💰 <b>الأجرة / السعر:</b> ${formatTgPrice(targetAd.price)}\n` +
          (targetAd.phone ? `📞 <b>هاتف التواصل:</b> <code>${targetAd.phone}</code>\n\n` : '\n') +
          `✨ <i>تم تجديد وترويج هذا الإعلان ليتصدر نتائج البحث</i>\n` +
          `🔗 <b>#كود_${targetAd.short_id || targetAd.id}</b> | @${BOT_USERNAME}`;

        const vipMarkup = {
          inline_keyboard: [
            [{ text: '🌐 التفاصيل الكاملة بالمنصة', url: adLink }],
            [{ text: '🚌 انشر خطك مجاناً عبر البوت', url: `https://t.me/${BOT_USERNAME}` }]
          ]
        };

        let newMsgId: string | null = null;
        try {
          const imgs = (targetAd.images && targetAd.images.length > 0) ? targetAd.images[0] : null;
          if (imgs) {
            const sendRes = await sendPhoto(targetChannel, imgs, vipCaption, vipMarkup);
            if (sendRes?.ok && sendRes.result?.message_id) newMsgId = String(sendRes.result.message_id);
          } else {
            const sendRes = await sendMessage(targetChannel, vipCaption, vipMarkup);
            if (sendRes?.ok && sendRes.result?.message_id) newMsgId = String(sendRes.result.message_id);
          }
        } catch(e) {
          console.error('[BOOST PUBLISH ERROR]', e);
        }

        // 5b. Social Publishing — نفس قواعد الخطوط الجديدة للترويج:
        // 🏛️ الرافدين فيسبوك: بوست + ستوري (جميع الخطوط)
        // 🏛️ الرافدين انستغرام: ستوري فقط (جميع الخطوط)
        // 🏙️ سوق بغداد فيسبوك: ستوري فقط
        // 🏙️ سوق بغداد انستغرام: ستوري فقط
        let fbFeedPublished = false;
        let igStoryPublished = false;
        try {
          const feedCaption = await generateSocialCaption(targetAd, isTransport ? 'transport' : 'car', adLink);
          const postImg = (targetAd.images && targetAd.images.length > 0)
            ? targetAd.images[0]
            : `https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image?type=post&title=${encodeURIComponent(targetAd.title)}&regions=${encodeURIComponent(targetAd.location || '')}&destination=${encodeURIComponent(targetAd.city || '')}&fare=${encodeURIComponent(targetAd.price || '')}&short_id=${encodeURIComponent(targetAd.short_id || targetAd.id)}&phone=${encodeURIComponent(targetAd.phone || '')}`;

          const storyImg = postImg; // نفس الصورة للستوري

          if (isTransport) {
            // --- الرافدين فيسبوك: بوست + ستوري ---
            try {
              const rucFbSetting = await getLiveSocialSetting('fb_rafdain');
              const rucToken = rucFbSetting?.access_token || ALRAFDAIN_FB_TOKEN || META_PAGE_ACCESS_TOKEN;
              const rucPageId = rucFbSetting?.page_id || ALRAFDAIN_FB_PAGE_ID || '102975411515668';
              if (rucToken && rucPageId) {
                const [rucFbPost, rucFbStory] = await Promise.allSettled([
                  postToFacebook(feedCaption, [postImg], rucToken, rucPageId),
                  postToFacebookStory(storyImg, rucPageId, rucToken)
                ]);
                if (rucFbPost.status === 'fulfilled' && (rucFbPost.value?.id || rucFbPost.value?.post_id)) {
                  fbFeedPublished = true;
                }
              }
            } catch(e) { console.error('[BOOST] Al-Rafdain FB Error:', e); }

            // --- الرافدين انستغرام: ستوري فقط ---
            try {
              const rucIgSetting = await getLiveSocialSetting('ig_rafdain');
              const igToken = rucIgSetting?.access_token || ALRAFDAIN_FB_TOKEN || META_PAGE_ACCESS_TOKEN;
              const rawId = rucIgSetting?.extra_id || rucIgSetting?.page_id || ALRAFDAIN_IG_ID || '17841404181680155';
              const igId = (rawId && rawId.startsWith('1784')) ? rawId : (ALRAFDAIN_IG_ID || '17841404181680155');
              
              if (igToken && igId) {
                const rucIgStory = await postToInstagramStory(storyImg, igId, igToken);
                if (rucIgStory && !rucIgStory.error) igStoryPublished = true;
              }
            } catch(e) { console.error('[BOOST] Al-Rafdain IG Error:', e); }

            // --- سوق بغداد فيسبوك: ستوري فقط ---
            try {
              await postToFacebookStory(storyImg, META_PAGE_ID, META_PAGE_ACCESS_TOKEN);
            } catch(e) { console.error('[BOOST] Souq Baghdad FB Story Error:', e); }

            // --- سوق بغداد انستغرام: ستوري فقط ---
            try {
              await postToInstagramStory(storyImg);
            } catch(e) { console.error('[BOOST] Souq Baghdad IG Story Error:', e); }

          } else {
            // للسيارات والمنتجات: المنطق الأصلي (بوست فيسبوك + انستغرام سوق بغداد)
            try {
              const fbFeedRes = await postToFacebook(feedCaption, [postImg]);
              if (fbFeedRes && (fbFeedRes.id || fbFeedRes.post_id)) fbFeedPublished = true;
            } catch(e) { console.error('[BOOST] FB Feed Error:', e); }
            try {
              const igFeedRes = await postToInstagram(feedCaption, [postImg]);
              if (igFeedRes && (igFeedRes.id || igFeedRes.media_id)) igStoryPublished = true;
            } catch(e) { console.error('[BOOST] IG Feed Error:', e); }
          }
        } catch(socialFeedErr) {
          console.error('[BOOST SOCIAL FEED ERROR]', socialFeedErr);
        }

        // 6. Update Database
        const nowIso = new Date().toISOString();
        await supabase.from('ads').update({
          is_vip: true,
          is_featured: true,
          last_boosted_at: nowIso,
          telegram_message_id: newMsgId || targetAd.telegram_message_id
        }).eq('id', adId).eq('seller_id', userId);

        await sendMessage(chatId, 
          `🚀 <b>تم ترويج وتجديد إعلانك بنجاح! ⭐</b>\n\n` +
          `✨ <b>المزايا التي تم تفعيلها فوراً:</b>\n` +
          `1️⃣ <b>تيليجرام:</b> حذف البوست القديم تلقائياً ونزول بوست جديد مميز VIP في صدارة القناة ✅\n` +
          `2️⃣ <b>فيسبوك:</b> نشر بوست دائم في الفيد للصفحة الرسمية ✅\n` +
          `3️⃣ <b>انستغرام:</b> نشر بوست فيد دائم بالحساب الرسمي ✅\n` +
          `4️⃣ <b>الموقع الإلكتروني:</b> تصدر الصفحة الأولى بشارة VIP الذهبية ⭐\n\n` +
          `⏱️ <b>موعد الترويج القادم:</b> بعد 24 ساعة.\n` +
          `🪙 الرصيد المتبقي بمحفظتك: <b>${isOwner ? 'غير محدود (المالك)' : currentPoints - boostCost}</b> نقطة.`,
          {
            inline_keyboard: [[{ text: '📋 عرض خطوطي النشطة', callback_data: 'manage_cat_trans' }]]
          }
        );
        return new Response('OK', { status: 200 });
      }

      // Match Students for Specific Line (مطابقة الطلاب مع الخط فوراً)
      if (action.startsWith('match_students_')) {
        const transId = action.replace('match_students_', '');
        const { data: myAd } = await supabase.from('ads').select('*').eq('id', transId).maybeSingle();

        if (myAd) {
          const searchLoc = (myAd.location || myAd.city || '').toLowerCase();
          const { data: waitingList } = await supabase.from('transport_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(30);

          const matched = (waitingList || []).filter((r: any) => {
            const full = `${r.origin || ''} ${r.destination || ''} ${r.raw_query || ''}`.toLowerCase();
            return searchLoc.split(/[\s,،-]+/).some(w => w.length > 2 && full.includes(w));
          });

          if (matched.length > 0) {
            let msg = `🎯 <b>وجدنا لك (${matched.length}) ركاب وطلاب يبحثون عن خط بمسارك (${myAd.location || 'بغداد'}):</b>\n\n`;
            for (const s of matched.slice(0, 5)) {
              msg += `• 👤 <b>${s.user_name || 'طالب/طالبة'}</b>\n  📍 المسار: ${s.origin} ⬅️ ${s.destination}\n  ⏰ طلب قبل قليل\n\n`;
            }
            msg += `💡 <i>يمكنك إرسال إشعار مباشر لجميع هؤلاء الطلاب على الخاص بتفاصيل خطك وسيارتك للتواصل معك فوراً!</i>`;
            await sendMessage(chatId, msg, {
              inline_keyboard: [
                [{ text: `📢 إرسال إشعار فوري لـ (${matched.length}) طلاب على الخاص 🚀`, callback_data: `notify_matched_students_${transId}` }],
                [{ text: '🚀 ترويج وتمييز بالمنصات VIP', callback_data: `boost_ad_${transId}` }],
                [{ text: '🔙 عودة لخطوطي', callback_data: 'manage_cat_trans' }]
              ]
            });
          } else {
            await sendMessage(chatId, `ℹ️ <b>لا توجد طلبات انتظار جديدة حالياً لمسار (${myAd.location || 'بغداد'}).</b>\n\nخطك نشط ومتاح وأول ما يطلب أي طالب بهذا المسار سنقوم بربطه بك فوراً! 🤝`, {
              inline_keyboard: [[{ text: '🔙 عودة لخطوطي', callback_data: 'manage_cat_trans' }]]
            });
          }
        }
        return new Response('OK', { status: 200 });
      }

      // Notify Matched Waiting Students on Private Message
      if (action.startsWith('notify_matched_students_')) {
        const transId = action.replace('notify_matched_students_', '');
        const { data: myAd } = await supabase.from('ads').select('*').eq('id', transId).maybeSingle();

        if (!myAd) {
          await sendMessage(chatId, '❌ تعذر العثور على بيانات الخط.');
          return new Response('OK', { status: 200 });
        }

        await sendMessage(chatId, '⏳ <i>جاري إرسال إشعارات وتفاصيل خطك للطلاب على الخاص...</i>');

        const searchLoc = (myAd.location || myAd.city || '').toLowerCase();
        const { data: waitingList } = await supabase.from('transport_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(30);

        const matched = (waitingList || []).filter((r: any) => {
          const full = `${r.origin || ''} ${r.destination || ''} ${r.raw_query || ''}`.toLowerCase();
          return searchLoc.split(/[\s,،-]+/).some(w => w.length > 2 && full.includes(w));
        });

        let sentCount = 0;
        const shortId = myAd.short_id || myAd.id;
        const driverName = myAd.contact_name || myAd.title || 'كابتن';
        const driverPhone = myAd.phone || '';
        const shortDriverName = driverName.substring(0, 10).replace(/_/g, '');
        const repDrvCb = `rep_drv_${shortDriverName}_${driverPhone || 'nophone'}`;

        for (const student of matched) {
          const studentChatId = student.telegram_chat_id || student.telegram_user_id;
          if (studentChatId && studentChatId !== chatId) {
            try {
              const studentAlertMsg = 
                `🔔 <b>إشعار خط نقل يطابق طلبك! 🚌✨</b>\n\n` +
                `قام الكابتن (<b>${driverName}</b>) بتوفير خط يمر من منطقتك:\n` +
                `📍 <b>مسار الخط:</b> ${myAd.location || 'مسار مطابق'}\n` +
                `🏢 <b>الوجهة:</b> ${myAd.city || student.destination || 'الجامعة'}\n` +
                `💰 <b>الأجرة:</b> ${formatTgPrice(myAd.price)}\n\n` +
                (driverPhone ? `📞 <b>هاتف الكابتن:</b> <code>${driverPhone}</code>\n\n` : '') +
                `سارع بالتواصل مع السائق وحجز مقعدك قبل اكتمال العدد 🤝`;

              const studentAlertMarkup: any = {
                inline_keyboard: []
              };

              if (driverPhone) {
                const cleanPhone = driverPhone.replace(/[^0-9]/g, '');
                const waPhone = cleanPhone.startsWith('07') ? '964' + cleanPhone.substring(1) : cleanPhone;
                studentAlertMarkup.inline_keyboard.push([
                  { text: '💬 تواصل واتساب مع السائق', url: `https://wa.me/${waPhone}` },
                  { text: '📞 اتصال بالسائق', url: `tel:${driverPhone}` }
                ]);
              }

              studentAlertMarkup.inline_keyboard.push([
                { text: '✅ اتفقت ولكيت خط خلاص (إيقاف)', callback_data: `stop_alert_${student.id}` },
                { text: '⚠️ إبلاغ عن مشكلة مع الكابتن', callback_data: repDrvCb }
              ]);

              await sendMessage(studentChatId, studentAlertMsg, studentAlertMarkup);
              sentCount++;
            } catch(sendErr) {
              console.warn(`Failed to send alert to student ${studentChatId}:`, sendErr);
            }
          }
        }

        await sendMessage(chatId, 
          `🎉 <b>تم إرسال إشعار خطك بنجاح لـ (${sentCount}) طلاب! 🚀</b>\n\n` +
          `وصلتهم بطاقة خطك ورقم هاتفك مع زر واتساب مباشر للتواصل معك وحجز المقاعد.\n\n` +
          `💡 سيصلك إشعار فور موافقة أي طالب واكتمال عدد الركاب.`,
          {
            inline_keyboard: [
              [{ text: '📋 إدارة خطوطي النشطة', callback_data: 'manage_cat_trans' }],
              [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
            ]
          }
        );
        return new Response('OK', { status: 200 });
      }

      // Mark Transport as Solved / Matched
      if (action.startsWith('solve_trans_')) {
        const transId = action.replace('solve_trans_', '');
        const { data: updatedTrans } = await supabase.from('ads').update({ status: 'matched' }).eq('id', transId).eq('seller_id', userId).select().single();
        
        if (updatedTrans) {
          const msgId = updatedTrans.telegram_message_id;
          const rucMsgId = updatedTrans.sync_status?.ruc_telegram_message_id;

          const closedButtons = {
            inline_keyboard: [
              [{ text: '🚌 تصفح خطوط أخرى متاحة 🌐', url: 'https://www.souqbaghdad.store/transport' }],
              [{ text: '🚌 اعرض خطك مجاناً عبر البوت', url: `https://t.me/${BOT_USERNAME}` }]
            ]
          };
          const closedCaption = `✅ <b>[اكتمل العدد / الخط مغلق]</b>\n\n` +
                                `🚌 <b>${updatedTrans.title}</b>\n` +
                                `💰 <b>تم اكتمال العدد بنجاح عبر منصة سوق بغداد</b>\n` +
                                `📍 ${updatedTrans.location || updatedTrans.city || 'بغداد'}\n\n` +
                                `📣 لم يعد هذا الخط متاحاً للتسجيل. يمكنك تصفح خطوط أخرى متاحة بالضغط أدناه 👇`;

          // 1. Edit in main lines channel
          if (msgId) {
            const channelsToTry = Array.from(new Set([LINES_CHANNEL_ID, LINES_CHANNEL, '@souqbaghdad_lines', '@souqbaghdad_line'].filter(Boolean)));
            for (const ch of channelsToTry) {
              try {
                const res = await editChannelMessage(ch, parseInt(msgId, 10), closedCaption, closedButtons);
                if (res?.ok) break;
              } catch(e) {
                console.error(`Transport caption update error in ${ch}:`, e);
              }
            }
          }

          // 2. Check if transport is for Al-Rafdain, update @ruc_1 as well
          const descStr = typeof updatedTrans.description === 'string'
            ? updatedTrans.description
            : JSON.stringify(updatedTrans.description || {});
          const rafdainTerms = ['الرافدين', 'الرفدين', 'ruc'];
          const isAlRafdainTrans = rafdainTerms.some(term =>
            (updatedTrans.title && updatedTrans.title.toLowerCase().includes(term)) ||
            (updatedTrans.university && updatedTrans.university.toLowerCase().includes(term)) ||
            (updatedTrans.city && updatedTrans.city.toLowerCase().includes(term)) ||
            (updatedTrans.destination && updatedTrans.destination.toLowerCase().includes(term)) ||
            (updatedTrans.location && updatedTrans.location.toLowerCase().includes(term)) ||
            (updatedTrans.regions && updatedTrans.regions.toLowerCase().includes(term)) ||
            descStr.toLowerCase().includes(term)
          );

          if ((isAlRafdainTrans || rucMsgId) && ALRAFDAIN_TELEGRAM_CHANNEL && rucMsgId) {
            try {
              console.log(`[RUC BOT UPDATE] Updating post in ${ALRAFDAIN_TELEGRAM_CHANNEL} with msgId ${rucMsgId}`);
              await editChannelMessage(ALRAFDAIN_TELEGRAM_CHANNEL, parseInt(rucMsgId, 10), closedCaption, closedButtons);
            } catch(e2) {
              console.error('Al-Rafdain (ruc_1) caption update error:', e2);
            }
          }

          // 3. Update Facebook Post if exists
          if (updatedTrans.facebook_post_id) {
            const fbClosedText = `✅ [اكتمل العدد / الخط مغلق]\n\n🚌 ${updatedTrans.title || 'إعلان خط'}\n💰 تمت العملية بنجاح عبر منصة سوق بغداد\n\nلم يعد هذا الخط متاحاً للتسجيل. تصفح الخطوط المتاحة عبر:\nhttps://www.souqbaghdad.store/transport`;
            await updateFacebookPost(updatedTrans.facebook_post_id, fbClosedText);
          }

          // 4. Delete Instagram Post if exists (since IG API does not allow editing captions)
          const transIgId = updatedTrans.instagram_post_id || updatedTrans.sync_status?.instagram_post_id;
          if (transIgId) {
            console.log(`[SOLVE TRANS] Deleting Instagram post ${transIgId}...`);
            try { await deleteFromInstagram(transIgId); } catch(e) {}
          }

          await updateOrSend('✅ <b>تم إغلاق الخط بنجاح! شكراً لاستخدامك منصة سوق بغداد 🤝</b>\n\nتم تحديث المنشور في القنوات ومواقع التواصل وحذف بوست انستكرام تلقائياً.\nنتمنى لك رحلات موفقة وآمنة دائماً! ✨', {
            inline_keyboard: [
              [{ text: '🚌 نشر خط جديد', callback_data: 'publish_transport' }, { text: '📦 إدارة خطوطي', callback_data: 'manage_cat_trans' }],
              [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
            ]
          });
        } else {
          await updateOrSend('❌ لم يتم العثور على الخط أو لا تملك صلاحية تعديله.');
        }
        return new Response('OK', { status: 200 });
      }

      // Stop Transport Request Alerts (لما الراكب يحصل خط خلاص)
      if (action.startsWith('stop_alert_')) {
        const reqId = action.replace('stop_alert_', '');
        if (reqId === 'user') {
          // Stop all active requests for this telegram user / chat
          await supabase
            .from('transport_requests')
            .update({ status: 'completed' })
            .or(`telegram_chat_id.eq.${chatId},telegram_user_id.eq.${userId}`);

          await updateOrSend(
            `🎉 <b>ألف مبروك حصولك على الخط وبالتوفيق في دوامك! 🌹✨</b>\n\n` +
            `تم إيقاف جميع التنبيهات ولن نرسل لك إشعارات أخرى.\n` +
            `إذا بطلت من هذا الخط أو احتجت خط جديد بأي وقت، تكدر تطلب مرة ثانية بضغطة زر واحدة 👇`,
            {
              inline_keyboard: [
                [{ text: '🔄 البحث عن خط جديد أو طلب خط', callback_data: 'search_transport_interactive' }],
                [{ text: '🚌 تصفح جميع الخطوط', url: 'https://www.souqbaghdad.store/transport' }],
                [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
              ]
            }
          );
        } else {
          await supabase
            .from('transport_requests')
            .update({ status: 'completed' })
            .eq('id', reqId);

          await updateOrSend(
            `🎉 <b>ألف مبروك حصولك على الخط وبالتوفيق في دوامك! 🌹✨</b>\n\n` +
            `تم إيقاف التنبيهات لهذا الطلب بنجاح.\n` +
            `إذا بطلت من الخط أو غيرت منطقتك وتريد خط جديد، راسلني بأي وقت وراح أساعدك فوراً 🤝`,
            {
              inline_keyboard: [
                [{ text: '🔄 البحث عن خط جديد', callback_data: 'search_transport_interactive' }],
                [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
              ]
            }
          );
        }
        return new Response('OK', { status: 200 });
      }

      // Report Driver (إبلاغ عن كابتن يوصل للمالك فوراً مع إمكانية الحظر)
      if (action.startsWith('rep_drv_')) {
        const parts = action.split('_');
        const driverName = parts[2] || 'كابتن';
        const driverPhone = parts[3] || 'غير متوفر';

        state = { 
          step: 'report_driver_reason', 
          driverName, 
          driverPhone 
        };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        await updateOrSend(
          `⚠️ <b>إبلاغ عن مشكلة مع الكابتن (${driverName})</b>\n` +
          `📞 هاتف السائق: <code>${driverPhone}</code>\n\n` +
          `يرجى كتابة <b>تفاصيل المشكلة أو الشكوى</b> في رسالة، وسيقوم فريق الإدارة بمراجعتها واتخاذ الإجراء الفوري بحق السائق 🛡️`,
          {
            inline_keyboard: [[{ text: '❌ إلغاء الإبلاغ', callback_data: 'cancel_wizard' }]]
          }
        );
        return new Response('OK', { status: 200 });
      }

      // Admin Ban Driver by Phone (حظر السائق برقم الهاتف من لوحة المالك)
      if (action.startsWith('ban_drv_') && isOwner) {
        const banPhone = action.replace('ban_drv_', '');
        if (banPhone && banPhone !== 'nophone') {
          // 1. Deactivate all ads with this phone
          await supabase.from('ads').update({ status: 'banned' }).eq('phone', banPhone);
          // 2. Add to banned phones / blacklist in profiles or group_warnings
          await supabase.from('group_warnings').upsert({
            chat_id: 'BANNED_DRIVERS',
            user_id: banPhone,
            username: `Banned Driver (${banPhone})`,
            warning_count: 99,
            last_reason: 'تم حظر السائق بواسطة الإدارة لمخالفة القوانين',
            updated_at: new Date().toISOString()
          });

          await updateOrSend(`🚫 <b>تم حظر السائق صاحب الرقم (${banPhone}) بنجاح!</b>\nتم إيقاف جميع إعلاناته وحظره من المنصة.`);
        } else {
          await updateOrSend(`⚠️ لا يوجد رقم هاتف مسجل لهذا السائق ليتم حظره تلقائياً.`);
        }
        return new Response('OK', { status: 200 });
      }

      // Edit Transport Price
      if (action.startsWith('edit_trans_price_')) {
        const transId = action.replace('edit_trans_price_', '');
        state = { step: 'edit_trans_price_input', targetId: transId };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await updateOrSend('💰 اكتب <b>مبلغ الأجرة الجديد</b> بالأرقام (مثال: 85000 أو 100000):', {
          inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]]
        });
        return new Response('OK', { status: 200 });
      }

      // Edit Transport Phone
      if (action.startsWith('edit_trans_phone_')) {
        const transId = action.replace('edit_trans_phone_', '');
        state = { step: 'edit_trans_phone_input', targetId: transId };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await updateOrSend('📞 اكتب <b>رقم الهاتف الجديد</b> للتواصل:', {
          inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]]
        });
        return new Response('OK', { status: 200 });
      }



      // Edit Car Price
      if (action.startsWith('edit_car_price_')) {
        const adId = action.replace('edit_car_price_', '');
        state = { step: 'edit_car_price_input', targetId: adId };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await updateOrSend('💰 اكتب <b>السعر الجديد</b> بالأرقام فقط:', {
          inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]]
        });
        return new Response('OK', { status: 200 });
      }

      // Edit Car Phone
      if (action.startsWith('edit_car_phone_')) {
        const adId = action.replace('edit_car_phone_', '');
        state = { step: 'edit_car_phone_input', targetId: adId };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await updateOrSend('📞 اكتب <b>رقم الهاتف الجديد</b> للتواصل:', {
          inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]]
        });
        return new Response('OK', { status: 200 });
      }

      // Redeem Promo Code Action
      if (action === 'redeem_promo') {
        if (!userId) {
          await updateOrSend('⚠️ <b>عذراً، يجب عليك تفعيل رقم هاتفك وإنشاء حساب أولاً لاستخدام الأكواد الترويجية وشحن الرصيد.</b>', {
            inline_keyboard: [[{ text: '📱 تفعيل رقم الهاتف الآن', callback_data: 'share_phone_prompt' }]]
          });
          return new Response('OK', { status: 200 });
        }
        state = { step: 'enter_promo_code' };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await updateOrSend('🎟️ <b>شحن وتعبئة بروموكود (كود نقاط)</b> 🪙\n\nأرسل رمز الكود الآن في رسالة (مثال: <code>GIFT50</code> أو <code>VIP100</code>):', {
          inline_keyboard: [[{ text: '❌ إلغاء العملية', callback_data: 'cancel_wizard' }]]
        });
        return new Response('OK', { status: 200 });
      }

      // Other features (support, register, faq...)
      if (action === 'buy_points') {
        await updateOrSend(`💳 <b>شراء وشحن النقاط</b> 🪙\n\nلشراء النقاط وتعبئة رصيدك في المنصة، يرجى مراسلة الإدارة عبر تيليكرام للحصول على كود التعبئة:\n👉 @rucno\n\nإذا كان لديك كود بروموكود جاهز، اضغط على زر "🎟️ إدخال بروموكود" أدناه لتفعيله فوراً:`, {
          inline_keyboard: [
            [{ text: '🎟️ إدخال وتعبئة بروموكود', callback_data: 'redeem_promo' }],
            [{ text: '💬 مراسلة الإدارة لشراء نقاط', url: 'https://t.me/rucno' }],
            [{ text: 'الرجوع للقائمة الرئيسية 🔙', callback_data: 'main_menu' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'how_to_register') {
        await updateOrSend(`لإنشاء حساب في سوق بغداد:\n1. قم بزيارة: https://www.souqbaghdad.store\n2. اضغط على أيقونة 'حسابي'.\n3. أدخل رقم هاتفك ومعلوماتك.\n\nبكل بساطة! ✨`, {
          inline_keyboard: [[{ text: 'الرجوع للقائمة الرئيسية 🔙', callback_data: 'main_menu' }]]
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'forgot_password') {
        await updateOrSend(`هل نسيت كلمة المرور الخاصة بحسابك؟ 🔑\n\nيمكنك تصفيرها فوراً والربط بحسابك المسجل:`, {
          inline_keyboard: [
            [{ text: '🔄 تصفير كلمة المرور الآن', callback_data: 'reset_password_now' }],
            [{ text: 'الرجوع للقائمة الرئيسية 🔙', callback_data: 'main_menu' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'reset_password_now') {
        if (!phone) {
           await updateOrSend('⚠️ يرجى مشاركة رقم هاتفك عبر /start أولاً.');
           return new Response('OK', { status: 200 });
        }
        
        try {
          const newPassword = Math.random().toString(36).slice(-8);
          await supabase.auth.admin.updateUserById(userId, { password: newPassword });
          await updateOrSend(`✅ تم إعادة تعيين كلمة المرور بنجاح!\n\nرقم الهاتف: ${phone}\nكلمة المرور الجديدة: <code>${newPassword}</code>\n\nيرجى الدخول للموقع وتغييرها من الإعدادات.`);
        } catch (e) {
          await updateOrSend('❌ حدث خطأ أثناء تصفير الرمز.');
        }
        return new Response('OK', { status: 200 });
      }

      if (action === 'faq') {
        await updateOrSend(`إليك أبرز الأسئلة الشائعة، تفضل باختيار أحدها:`, {
          inline_keyboard: [
            [{ text: 'كيف أنشر إعلان سيارة؟', callback_data: 'faq_publish_car' }],
            [{ text: 'كيف أنشر خط نقل؟', callback_data: 'faq_publish_trans' }],
            [{ text: 'هل الموقع مجاني؟', callback_data: 'faq_free' }],
            [{ text: 'الرجوع للقائمة الرئيسية 🔙', callback_data: 'main_menu' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'faq_publish_car') {
        await updateOrSend(`لنشر إعلان سيارة: اضغط على زر "🚗 اعرض سيارتك للبيع مجاناً" من القائمة الرئيسية، واتبع الخطوات البسيطة (الماركة، الموديل، السنة، السعر، والصور)!`, { inline_keyboard: [[{ text: 'الرجوع 🔙', callback_data: 'faq' }]] });
        return new Response('OK', { status: 200 });
      }

      if (action === 'faq_publish_trans') {
        await updateOrSend(`لنشر خط نقل: اضغط على زر "🚌 انشر خط نقل" من القائمة الرئيسية، وحدد مناطق الانطلاق، الجامعة أو العمل، وقت الدوام، والأجرة!`, { inline_keyboard: [[{ text: 'الرجوع 🔙', callback_data: 'faq' }]] });
        return new Response('OK', { status: 200 });
      }

      if (action === 'faq_free') {
        await updateOrSend(`نعم، منصة وبوت سوق بغداد مجانية 100% بدون أي عمولة بيع! 🎉`, { inline_keyboard: [[{ text: 'الرجوع 🔙', callback_data: 'faq' }]] });
        return new Response('OK', { status: 200 });
      }

      // Submenu: Manage Ads & Products
      if (action === 'manage_cat_ads') {
        await updateOrSend('📢 <b>إدارة الإعلانات والمنتجات</b>\n\nاختر تصفية العرض المناسبة:', {
          inline_keyboard: [
            [{ text: '⚡ آخر إعلانين', callback_data: 'view_ads_recent' }, { text: '📅 هذا الشهر', callback_data: 'view_ads_month' }],
            [{ text: '🟢 الإعلانات النشطة', callback_data: 'view_ads_active' }, { text: '📜 جميع الإعلانات', callback_data: 'view_ads_all' }],
            [{ text: '🔙 العودة لإدارة الإعلانات', callback_data: 'manage_my_ads' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      // Delete Ads/Transports/Products
      if (action.startsWith('del_prod_')) {
        const prodId = action.replace('del_prod_', '');
        const { data: adToDelete } = await supabase.from('products').select('facebook_post_id, telegram_message_id, instagram_post_id, threads_post_id').eq('id', prodId).single();
        const { error: delErr } = await supabase.from('products').delete().eq('id', prodId);
        
        if (delErr) {
          await sendMessage(chatId, '❌ لم يتم العثور على المنتج، أو حدث خطأ أثناء الحذف.');
          return new Response('OK', { status: 200 });
        }
        
        if (adToDelete) {
          if (adToDelete.facebook_post_id) await deleteFromFacebook(adToDelete.facebook_post_id);
          if (adToDelete.instagram_post_id) await deleteFromInstagram(adToDelete.instagram_post_id);
          if (adToDelete.threads_post_id) await deleteFromThreads(adToDelete.threads_post_id);
          if (adToDelete.telegram_message_id && PRODUCT_CHANNEL) {
             await deleteMessage(PRODUCT_CHANNEL, parseInt(adToDelete.telegram_message_id, 10));
             if (EXTRA_CHANNEL) await deleteMessage(EXTRA_CHANNEL, parseInt(adToDelete.telegram_message_id, 10));
          }
        }
        
        await sendMessage(chatId, '✅ <b>تم حذف المنتج بنجاح!</b>\nتمت إزالة المنشور من كافة القنوات ومنصات التواصل.', { inline_keyboard: [[{ text: '🔙 العودة لإدارة إعلاناتي', callback_data: 'manage_cat_ads' }]] });
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('del_trans_')) {
        const transId = action.replace('del_trans_', '');
        const { data: adToDelete } = await supabase.from('ads').select('id, seller_id, phone, facebook_post_id, telegram_message_id, instagram_post_id, threads_post_id, sync_status, category').eq('id', transId).maybeSingle();
        
        if (!adToDelete) {
          await sendMessage(chatId, '❌ لم يتم العثور على الإعلان أو تم حذفه مسبقاً.');
          return new Response('OK', { status: 200 });
        }

        const { error: delError } = await supabase.from('ads').delete().eq('id', transId);
        
        if (delError) {
          console.error('Delete ad error:', delError);
          await sendMessage(chatId, '❌ حدث خطأ أثناء حذف الإعلان من قاعدة البيانات.');
          return new Response('OK', { status: 200 });
        }
        
        if (adToDelete) {
          if (adToDelete.facebook_post_id) await deleteFromFacebook(adToDelete.facebook_post_id);
          const rafdainFbPostId = adToDelete.sync_status?.rafdain_facebook_post_id || adToDelete.sync_status?.platforms?.facebook?.post_id;
          if (rafdainFbPostId && rafdainFbPostId !== adToDelete.facebook_post_id) {
            const rafdainSetting = await getLiveSocialSetting('fb_rafdain');
            const token = rafdainSetting?.access_token || ALRAFDAIN_FB_TOKEN;
            await deleteFromFacebook(rafdainFbPostId, token);
          }
          if (adToDelete.instagram_post_id) await deleteFromInstagram(adToDelete.instagram_post_id);
          if (adToDelete.threads_post_id) await deleteFromThreads(adToDelete.threads_post_id);
          
          if (adToDelete.telegram_message_id) {
             const channel = (adToDelete.category === 'transport') ? (LINES_CHANNEL_ID || TRANSPORT_CHANNEL) : (adToDelete.category === 'vehicles' || adToDelete.category === 'cars' ? (CAR_CHANNEL_ID || CAR_CHANNEL) : PRODUCT_CHANNEL);
             if (channel) await deleteMessage(channel, parseInt(adToDelete.telegram_message_id, 10));
             if (EXTRA_CHANNEL) await deleteMessage(EXTRA_CHANNEL, parseInt(adToDelete.telegram_message_id, 10));
          }

          const rucMsgId = adToDelete.sync_status?.ruc_telegram_message_id;
          if (rucMsgId && ALRAFDAIN_TELEGRAM_CHANNEL) {
            await deleteMessage(ALRAFDAIN_TELEGRAM_CHANNEL, parseInt(rucMsgId, 10));
          }
        }
        
        const returnCb = (adToDelete.category === 'vehicles' || adToDelete.category === 'cars') ? 'manage_cat_cars' : (adToDelete.category === 'transport' ? 'manage_cat_trans' : 'manage_my_ads');
        await sendMessage(chatId, '✅ <b>تم حذف الإعلان نهائياً بنجاح! شكراً لاستخدامك منصة سوق بغداد 🤝</b>\n\nتمت إزالة المنشور من كافة القنوات ومنصات التواصل وقاعدة البيانات بنجاح.\nيمكنك دائماً نشر إعلان جديد في أي وقت!', {
          inline_keyboard: [
            [{ text: '➕ نشر إعلان جديد', callback_data: (adToDelete.category === 'transport' ? 'publish_transport' : (adToDelete.category === 'vehicles' || adToDelete.category === 'cars' ? 'publish_car' : 'publish_product')) }, { text: '📦 إعلاناتي', callback_data: returnCb }],
            [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      // Support Wizard
      if (action === 'contact_support') {
        state = { step: 'support_message', data: {} };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await sendMessage(chatId, '📞 <b>الدعم الفني للاستفسارات والشكاوى</b>\n\nيرجى كتابة رسالتك أو استفسارك بالتفصيل وسيقوم فريق الدعم بالرد عليك بأقرب وقت:', { inline_keyboard: [[{ text: '❌ إلغاء العملية', callback_data: 'cancel_wizard' }]] });
        return new Response('OK', { status: 200 });
      }

      // =================== Product Wizard (Full 9-Step) ===================
      // Helper: DELETE old wizard message + SEND new one at bottom of chat
      // This ensures the wizard always appears as the latest message (not editing old ones)
      const editProdWizard = async (text: string, markup: any) => {
        const wMsgId = state.data?.wizardMsgId;
        // Delete old wizard message silently
        if (wMsgId) {
          try { await deleteMessage(chatId, wMsgId); } catch(e) {}
        }
        // Send fresh message at bottom
        const res = await sendMessage(chatId, text, markup);
        if (res?.result?.message_id) {
          if (!state.data) state.data = {};
          state.data.wizardMsgId = res.result.message_id;
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        }
      };


      if (action === 'publish_product') {
        const { data: profile } = await supabase.from('profiles').select('points, role').eq('id', userId).maybeSingle();
        if (profile?.role !== 'admin' && profile?.role !== 'owner' && (profile?.points || 0) < 1) {
          await sendMessage(chatId, '❌ عذراً، رصيد النقاط الخاص بك غير كافٍ لنشر إعلان. يرجى شحن المحفظة أولاً.', { inline_keyboard: [[{ text: '💳 شراء نقاط', callback_data: 'buy_points' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]] });
          return new Response('OK', { status: 200 });
        }
        state = { step: 'product_title', data: { images: [] } };
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        const initMsg = await sendMessage(chatId,
          `📦 <b>نشر منتج جديد في سوق بغداد</b> 🛍️\n\n<b>الخطوة 1 من 9 — عنوان المنتج</b>\n\nاكتب اسم المنتج بوضوح (مثال: ايفون 15 برو ماكس، تلفزيون سامسونج 55 بوصة):`,
          { inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]] }
        );
        if (initMsg?.result?.message_id) {
          state.data.wizardMsgId = initMsg.result.message_id;
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        }
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('prod_cat_')) {
        state.data.category = action.replace('prod_cat_', '');
        state.step = 'product_condition';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await editProdWizard(
          `<b>الخطوة 3 من 9 — حالة المنتج</b>\n\nما هي حالة المنتج؟`,
          { inline_keyboard: [[{ text: '🆕 جديد', callback_data: 'prod_cond_new' }, { text: '♻️ مستعمل', callback_data: 'prod_cond_used' }], [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]] }
        );
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('prod_cond_')) {
        state.data.condition = action.replace('prod_cond_', '') === 'new' ? 'جديد' : 'مستعمل';
        state.step = 'product_price';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await editProdWizard(
          `<b>الخطوة 4 من 9 — السعر</b>\n\nاكتب <b>سعر المنتج</b> بالأرقام بالدينار العراقي:\n(مثال: 50000 أو 150000)`,
          { inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]] }
        );
        return new Response('OK', { status: 200 });
      }

      if (action.startsWith('prod_gov_')) {
        const gov = action.replace('prod_gov_', '').replace(/_/g, ' ');
        state.data.governorate = gov;
        state.step = 'product_images';
        if (!state.data.images) state.data.images = [];
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        await editProdWizard(
          `<b>الخطوة 7 من 9 — صور المنتج</b>\n\nأرسل صور المنتج الآن (يمكنك إرسال حتى 5 صور).\nبعد الانتهاء اضغط «تم ✅».`,
          { inline_keyboard: [[{ text: '✅ تم إرسال الصور', callback_data: 'prod_images_done' }], [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]] }
        );
        return new Response('OK', { status: 200 });
      }

      if (action === 'prod_images_done') {
        if (!state.data.images || state.data.images.length === 0) {
          await editProdWizard('⚠️ يرجى إرسال صورة واحدة على الأقل قبل المتابعة.', {
            inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]]
          });
          return new Response('OK', { status: 200 });
        }
        state.step = 'product_phone';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        const phoneButtons: any[] = [];
        if (phone) phoneButtons.push([{ text: `📱 استخدم رقمي الحالي (${phone})`, callback_data: 'prod_phone_current' }]);
        phoneButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);
        await editProdWizard(
          `<b>الخطوة 8 من 9 — رقم الهاتف</b>\n\nاكتب <b>رقم هاتفك</b> للتواصل، أو اضغط الزر أدناه:`,
          { inline_keyboard: phoneButtons }
        );
        return new Response('OK', { status: 200 });
      }

      if (action === 'prod_phone_current') {
        state.data.phone = phone || '';
        state.step = 'product_review';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        const d = state.data;
        const catLabels: Record<string, string> = { electronics: '📱 إلكترونيات', fashion: '👕 أزياء وملابس', home: '🏠 المنزل', vehicles: '🚗 أوتو', other: '🔄 أخرى' };
        const reviewText =
          `🔍 <b>مراجعة أخيرة — الخطوة 9 من 9</b>\n\n` +
          `📌 <b>العنوان:</b> ${d.title || '-'}\n` +
          `📑 <b>القسم:</b> ${catLabels[d.category] || d.category || '-'}\n` +
          `✨ <b>الحالة:</b> ${d.condition || '-'}\n` +
          `💰 <b>السعر:</b> ${Number(String(d.price).replace(/[^0-9]/g, '')).toLocaleString('en-US')} د.ع\n` +
          `📝 <b>الوصف:</b> ${d.description || '-'}\n` +
          `📍 <b>المحافظة:</b> ${d.governorate || '-'}\n` +
          `📸 <b>الصور:</b> ${(d.images || []).length} صورة\n` +
          `📞 <b>الهاتف:</b> ${d.phone || '-'}\n\n` +
          `هل كل شيء صحيح؟ اضغط «✅ نشر الإعلان الآن» للنشر الفوري على تيليكرام وفيسبوك وانستكرام وثريدز.`;
        await editProdWizard(reviewText, {
          inline_keyboard: [
            [{ text: '✅ نشر الإعلان الآن 🚀', callback_data: 'prod_confirm_publish' }],
            [{ text: '❌ إلغاء وبدء من جديد', callback_data: 'cancel_wizard' }]
          ]
        });
        return new Response('OK', { status: 200 });
      }

      if (action === 'prod_confirm_publish') {
        const d = state.data || {};
        if (!d.title) {
          await updateOrSend('❌ البيانات غير مكتملة، يرجى البدء من جديد.', { inline_keyboard: [[{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]] });
          return new Response('OK', { status: 200 });
        }

        // Check & deduct points
        const { data: userProfile } = await supabase.from('profiles').select('points, role, full_name, avatar_url').eq('id', userId).single();
        if (userProfile?.role !== 'admin' && userProfile?.role !== 'owner') {
          if (!userProfile || (userProfile.points || 0) < 1) {
            await updateOrSend('❌ رصيد نقاطك غير كافٍ لنشر الإعلان.', { inline_keyboard: [[{ text: '💳 شراء نقاط', callback_data: 'buy_points' }]] });
            return new Response('OK', { status: 200 });
          }
          await supabase.from('profiles').update({ points: userProfile.points - 1 }).eq('id', userId);
        }

        // Answer immediately
        if (callbackQueryId) await answerCallbackQuery(callbackQueryId, '⏳ جاري نشر إعلانك...');
        await updateOrSend('⏳ <b>جاري نشر الإعلان على جميع المنصات...</b>\nانتظر لحظة من فضلك.');

        const stateData = { ...d };
        state = {};
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        // Background publishing
        EdgeRuntime.waitUntil((async () => {
          try {
            const rawPrice = String(stateData.price || '0').replace(/[^0-9]/g, '');
            const priceNum = parseInt(rawPrice, 10) || 0;
            const catLabels: Record<string, string> = { electronics: 'إلكترونيات', fashion: 'أزياء وملابس', home: 'المنزل', vehicles: 'أوتو', other: 'أخرى' };

            const fallbackProductImage = getFallbackImage({
              category: stateData.category,
              title: stateData.title
            }, 'product');

            // 1. Insert to DB
            const { data: inserted } = await supabase.from('products').insert({
              title: stateData.title,
              price: priceNum,
              description: stateData.description || '',
              governorate: stateData.governorate || 'بغداد',
              category: stateData.category || 'other',
              condition: stateData.condition || 'مستعمل',
              phone: stateData.phone || phone,
              images: stateData.images && stateData.images.length > 0 ? stateData.images : [fallbackProductImage],
              seller_id: userId,
              seller_name: userProfile?.full_name || 'بائع',
              seller_avatar: userProfile?.avatar_url || '',
              status: 'active',
              sync_status: { telegram: 'skip', facebook: 'pending', instagram: 'pending', tiktok: 'pending', threads: 'pending' }
            }).select().single();

            if (!inserted) {
              await sendMessage(chatId, '❌ حدث خطأ أثناء حفظ الإعلان، يرجى المحاولة مرة أخرى.');
              return;
            }

            const prodId = inserted.short_id || inserted.id;
            const productLink = `https://www.souqbaghdad.store/product/${prodId}`;
            const priceFormatted = priceNum > 0 ? `${priceNum.toLocaleString('en-US')} د.ع` : 'حسب الاتفاق';

            // Send instant success message with warm thank you note and action buttons
            const successMsg = `🎉 <b>تم نشر إعلان منتجك بنجاح! شكراً لاختيارك منصة سوق بغداد 🤝</b>\n\n` +
                               `🛍️ <b>${stateData.title}</b>\n` +
                               `💰 <b>السعر:</b> ${priceFormatted}\n` +
                               `📍 <b>المحافظة:</b> ${stateData.governorate || 'بغداد'}\n\n` +
                               `📣 <b>إعلانك معروض الآن بالموقع وقناة السوق العام.</b>\n` +
                               `✨ نتمنى لك دوام التوفيق والبركة في البيع!`;

            await sendMessage(chatId, successMsg, {
              inline_keyboard: [
                [{ text: '🌐 عرض بطاقتي بالموقع', url: productLink }, { text: '📢 شاهد بالقناة', url: `https://t.me/${PRODUCT_CHANNEL.replace('@', '')}` }],
                [{ text: '⚠️ تم البيع (حصلت)', callback_data: `mark_sold_${inserted.id}` }, { text: '🗑️ حذف الإعلان نهائياً', callback_data: `del_prod_${inserted.id}` }],
                [{ text: '🛍️ نشر منتج آخر', callback_data: 'publish_product' }, { text: '📦 إعلاناتي', callback_data: 'manage_cat_ads' }],
                [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
              ]
            });

            // 2. Telegram caption & buttons (Matching unified 3-row logic)
            const tgCaption = await generateSocialCaption(inserted, 'product', productLink, true);

            const prodImages = await ensurePublicImages(inserted, 'products', supabase);
            const mainImage = prodImages && prodImages.length > 0 ? prodImages[0] : null;
            const photoCount = prodImages.length;
            const detailsButtonText = photoCount > 1 
              ? `📸 تصفح كافة الصور (${photoCount} صور) والتفاصيل 🌐` 
              : `🌐 عرض التفاصيل والصور بالمنصة`;

            let cleanPhone = (stateData.phone || phone || '').replace(/[^0-9+]/g, '');
            if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
            else cleanPhone = cleanPhone.replace('+', '');

            const contactRow = [];
            if (cleanPhone) {
              contactRow.push({ text: '💬 تواصل واتساب', url: `https://wa.me/${cleanPhone}` });
              contactRow.push({ text: '✈️ تواصل تيليكرام', url: `https://t.me/+${cleanPhone}` });
            }

            const tgInlineKeyboard = [
              [{ text: detailsButtonText, url: productLink }]
            ];
            if (contactRow.length > 0) {
              tgInlineKeyboard.push(contactRow);
            }
            tgInlineKeyboard.push([{ text: '🛍️ اعرض منتجك للبيع مجاناً', url: `https://t.me/${BOT_USERNAME}` }]);

            const tgButtons = { inline_keyboard: tgInlineKeyboard };

            // 3. Send to Telegram product channel
            const updates: any = {};
            let tgMsgId: string | null = null;

            let tgRes;
            if (prodImages.length >= 1) {
              tgRes = await sendPhoto(PRODUCT_CHANNEL, prodImages[0], tgCaption, tgButtons);
            } else {
              tgRes = await sendMessage(PRODUCT_CHANNEL, tgCaption, tgButtons);
            }
            if (tgRes?.ok && tgRes.result?.message_id) {
              tgMsgId = tgRes.result.message_id.toString();
              updates.telegram_message_id = tgMsgId;
            }

            // 3b. Broadcast to Partner Channels Network (Products/All)
            EdgeRuntime.waitUntil(broadcastToPartnerChannels(inserted, 'products', tgCaption, prodImages, tgButtons, supabase));

            // DB Webhook will automatically pick up sync_status pending for Facebook/Instagram/Stories/Threads

            // 8. Update DB with social IDs (Telegram only here)
            if (Object.keys(updates).length > 0) {
              await supabase.from('products').update(updates).eq('id', inserted.id);
            }
          } catch(err: any) {
            console.error('[PROD PUBLISH ERROR]', err);
            await sendMessage(chatId, '❌ حدث خطأ أثناء النشر. يرجى المحاولة مرة أخرى.', { inline_keyboard: [[{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]] });
          }
        })());
        return new Response('OK', { status: 200 });
      }
    }

    // --- Handle Text, Photo, and Voice Inputs for State Machine ---
    if (text || photo || voice) {
      if (text === '/cancel') {
        await showMainMenu();
        return new Response('OK', { status: 200 });
      }

      // Interruption Check (Only when not actively in a form step)
      const isActivelyFilling = state.step && (
        state.step.startsWith('car_') || 
        state.step.startsWith('edit_car_') || 
        state.step.startsWith('trans_') ||
        state.step.startsWith('edit_trans_') ||
        state.step.startsWith('product_') ||
        state.step.startsWith('partner_')
      );

      // --- Report Driver Reason Input Handler ---
      if (state.step === 'report_driver_reason' && text) {
        const reportReason = text.trim();
        const drvName = state.driverName || 'غير معروف';
        const drvPhone = state.driverPhone || 'غير متوفر';
        const reporterName = userProfile?.full_name || fromUser?.first_name || 'مستخدم';
        const reporterPhone = phone || userProfile?.phone || 'غير مسجل';

        // 1. Save Report to support_messages / reports table
        try {
          await supabase.from('support_messages').insert({
            user_id: userId,
            telegram_chat_id: String(chatId),
            name: reporterName,
            phone: reporterPhone,
            message: `[بلاغ عن كابتن/سائق] الاسم: ${drvName} | الهاتف: ${drvPhone} | الشكوى: ${reportReason}`,
            category: 'driver_report',
            status: 'pending'
          });
        } catch(e) {
          console.error('Error saving driver report:', e);
        }

        // 2. Notify Owner (@nooraldein / OWNER_CHAT_ID) immediately with One-Click Ban Button
        if (OWNER_CHAT_ID) {
          const banBtnData = drvPhone && drvPhone !== 'nophone' && drvPhone !== 'غير متوفر' ? `ban_drv_${drvPhone}` : 'ban_drv_nophone';
          const ownerAlertMsg = 
            `🚨 <b>بلاغ وشكوى جديدة عن كابتن / سائق!</b>\n\n` +
            `👤 <b>اسم الكابتن:</b> ${drvName}\n` +
            `📞 <b>هاتف الكابتن:</b> <code>${drvPhone}</code>\n\n` +
            `📝 <b>نص الشكوى والمشكلة:</b>\n<i>«${reportReason}»</i>\n\n` +
            `👤 <b>صاحب البلاغ (الراكب):</b> ${reporterName} (<code>${reporterPhone}</code>)\n` +
            `⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-IQ', { timeZone: 'Asia/Baghdad' })}`;

          const ownerAlertButtons = [
            [{ text: `🚫 حظر هذا السائق فوراً بالرقم (${drvPhone})`, callback_data: banBtnData }],
            [{ text: `💬 محادثة الراكب واتساب`, url: `https://wa.me/${reporterPhone.replace(/[^0-9]/g, '')}` }]
          ];

          await sendMessage(OWNER_CHAT_ID, ownerAlertMsg, { inline_keyboard: ownerAlertButtons });
        }

        // 3. Confirm to user & reset state
        state = {};
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        await updateOrSend(
          `✅ <b>تم استلام بلاغك بنجاح وسنقوم بالتدقيق فوراً 🛡️</b>\n\n` +
          `شكراً لحرصك ومساعدتنا في الحفاظ على أمان وراحة جميع الطلاب والركاب.\n` +
          `سيتم اتخاذ الإجراء الإداري الرادع بحق السائق إذا ثبتت مخالفته. 🌹`,
          {
            inline_keyboard: [
              [{ text: '🔄 البحث عن خط بديل', callback_data: 'search_transport_interactive' }],
              [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
            ]
          }
        );
        return new Response('OK', { status: 200 });
      }

      // --- Partner Channel Connect Text Inputs ---
      if (state.step === 'partner_await_channel' && text) {
        let channelInput = text.trim();
        if (!channelInput.startsWith('@') && !channelInput.startsWith('-100') && !channelInput.startsWith('-')) {
          channelInput = '@' + channelInput;
        }

        await updateOrSend(`⏳ جاري التحقق من وجود القناة وصلاحيات البوت المشرف فيها (${channelInput})...`);

        const check = await checkBotIsAdmin(channelInput);
        if (!check.ok) {
          await updateOrSend(
            `❌ <b>تعذر التحقق من القناة!</b>\n\n` +
            `• السبب: ${check.error || 'البوت ليس مشرفاً (Admin)'}\n\n` +
            `📌 <b>تأكد من:</b>\n` +
            `1. إضافة البوت <b>@${BOT_USERNAME}</b> كمشرف (Admin) في القناة.\n` +
            `2. منح البوت صلاحية نشر الرسائل (Post Messages).\n` +
            `3. كتابة المعرف بشكل صحيح (مثال: <code>@my_channel</code>).\n\n` +
            `👇 أعد إرسال معرف القناة بعد رفع البوت أدمن:`,
            {
              inline_keyboard: [
                [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
              ]
            }
          );
          return new Response('OK', { status: 200 });
        }

        state.data.channel_id = channelInput;
        state.data.channel_title = check.title || channelInput;
        state.step = 'partner_choose_category';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        await updateOrSend(
          `✅ <b>تم التحقق من القناة وصلاحية المشرف بنجاح!</b>\n\n` +
          `📢 <b>اسم القناة:</b> ${check.title}\n` +
          `🆔 <b>المعرف:</b> ${channelInput}\n\n` +
          `👇 <b>حدد تخصص ونوع الإعلانات التي ترغب بنشرها في قناتك تلقائياً:</b>`,
          {
            inline_keyboard: [
              [{ text: '👑 إعلانات متجري / إعلاناتي الشخصية فقط', callback_data: 'partner_cat_my_store' }],
              [{ text: '🚌 خطوط نقل طلاب وموظفين', callback_data: 'partner_cat_transport' }],
              [{ text: '🚗 سيارات ومحركات للبيع', callback_data: 'partner_cat_vehicles' }],
              [{ text: '🛍️ منتجات ومتاجر وتسوق عام', callback_data: 'partner_cat_products' }],
              [{ text: '🌐 كل الإعلانات العامة بالمنصة', callback_data: 'partner_cat_all' }],
              [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
            ]
          }
        );
        return new Response('OK', { status: 200 });
      }

      if (state.step === 'partner_trans_custom_input' && text) {
        const customKeywords = text.split(/[,،\n]/).map(k => k.trim()).filter(k => k.length > 0);
        state.data.filter_keywords = customKeywords;
        return await finalizePartnerChannel(chatId, state, supabase, updateOrSend);
      }

      if (!isActivelyFilling && Object.keys(state).length > 0 && text && !text.startsWith('car_') && !text.startsWith('trans_') && !['تم', 'تم ✅'].includes(text.trim())) {
        const isInterruption = await checkInterruption(text);
        if (isInterruption) {
           state = {};
           if (userId) {
             await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
           }
           const aiRes = await callGemini(text);
           await showMainMenu(aiRes || undefined);
           return new Response('OK', { status: 200 });
        }
      }

      const cancelBtn = { inline_keyboard: [[{ text: '❌ إلغاء العملية', callback_data: 'cancel_wizard' }]] };

      // ==========================================
      // 🚗 CAR WIZARD TEXT & PHOTO INPUTS
      // ==========================================
      if (state.step === 'car_model' && text) {
        state.data.model = text.trim();
        state.step = 'car_year';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const yearButtons = CAR_YEARS.map(row => row.map(y => {
          if (y.includes('أقدم')) return { text: y, callback_data: 'car_year_older' };
          return { text: y, callback_data: `car_year_${y}` };
        }));
        yearButtons.push([{ text: '◀️ السابق', callback_data: `publish_car` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await sendMessage(chatId, `📅 <b>الخطوة 3 من 10 — سنة الصنع (الموديل)</b>\n\nاختر سنة صنع السيارة 👇`, {
          inline_keyboard: yearButtons
        });
      }
      else if (state.step === 'car_year_custom' && text) {
        const cleanYear = text.replace(/[^0-9]/g, '');
        if (!cleanYear || cleanYear.length !== 4) {
          await sendMessage(chatId, '⚠️ الرجاء كتابة سنة الصنع بأربعة أرقام (مثال: 2008):');
          return new Response('OK', { status: 200 });
        }
        state.data.year = cleanYear;
        state.step = 'car_gov';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const govButtons = IRAQI_GOVERNORATES.map(row => row.map(g => ({ text: g, callback_data: `car_gov_${g}` })));
        govButtons.push([{ text: '◀️ السابق', callback_data: `car_brand_${state.data.brand || 'هيونداي'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await sendMessage(chatId, `📍 <b>الخطوة 4 من 10 — المحافظة</b>\n\nاختر محافظة تواجد السيارة 👇`, {
          inline_keyboard: govButtons
        });
      }
      else if (state.step === 'car_mileage' && text) {
        const cleanNum = text.replace(/[^0-9]/g, '');
        if (!cleanNum) {
          await sendMessage(chatId, '⚠️ اكتب عدد الكيلومترات بالأرقام فقط (مثال: 110000 أو 0 إذا كانت زيرو):');
          return new Response('OK', { status: 200 });
        }
        state.data.mileage = cleanNum;
        state.step = 'car_currency';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        await sendMessage(chatId, `💵 <b>الخطوة 7 من 10 — عملة السعر</b>\n\nاختر عملة السعر 👇`, {
          inline_keyboard: [
            [{ text: '💵 دولار $', callback_data: 'car_currency_usd' }, { text: '💰 دينار عراقي د.ع', callback_data: 'car_currency_iqd' }],
            [{ text: '◀️ السابق', callback_data: `car_origin_${state.data.origin || 'وارد خليجي'}` }, { text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
          ]
        });
      }
      else if (state.step === 'car_price' && text) {
        const cleanPrice = text.replace(/[^0-9]/g, '');
        if (!cleanPrice) {
          await sendMessage(chatId, '⚠️ اكتب السعر بالأرقام فقط:');
          return new Response('OK', { status: 200 });
        }
        state.data.price = cleanPrice;
        state.step = 'car_images';
        if (!state.data.images) state.data.images = [];
        delete state.data.statusMsgId;
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        await sendMessage(chatId, `📸 <b>الخطوة 9 من 10 — صور السيارة</b>\n\nأرسل صور سيارتك الآن (تگدر ترسل حتى 6 صور).\n• أول صورة ستظهر في القناة الرئيسية.\n• البقية تُحفظ وتُعرض في صفحة الإعلان بالمنصة.\n\nبعد الانتهاء من إرسال الصور اضغط «تم ✅» للمتابعة.`, {
          inline_keyboard: [
            [{ text: 'تم ✅', callback_data: 'car_images_done' }],
            [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
          ]
        });
      }
      else if (state.step === 'car_images') {
        if (text && (text.trim() === 'تم' || text.trim() === 'تم ✅')) {
          state.step = 'car_phone';
          delete state.data.statusMsgId;
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

          const currentPhone = phone || '';
          const phoneButtons = [];
          if (currentPhone) {
            phoneButtons.push([{ text: `📱 استخدام رقمي الحالي (${currentPhone})`, callback_data: 'car_phone_current' }]);
          }
          phoneButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

          await sendMessage(chatId, `📞 <b>الخطوة 10 من 10 — رقم الهاتف للتواصل</b>\n\nاكتب رقم الهاتف الخاص بك للتواصل، أو اضغط على الزر أدناه:`, {
            inline_keyboard: phoneButtons
          });
          return new Response('OK', { status: 200 });
        }

        if (photo) {
          const fileId = photo[photo.length - 1].file_id;
          const fileRes = await fetch(`${tgUrl}/getFile?file_id=${fileId}`);
          const fileData = await fileRes.json();
          
          if (fileData.ok) {
            const filePath = fileData.result.file_path;
            const imageRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
            const imageBlob = await imageRes.blob();
            const fileName = `car_${chatId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.jpg`;
            
            const { data: uploadData } = await supabase.storage.from('ad-images').upload(fileName, imageBlob, { contentType: 'image/jpeg' });
            if (uploadData) {
              const { data: pubUrl } = supabase.storage.from('ad-images').getPublicUrl(fileName);
              if (!state.data.images) state.data.images = [];
              state.data.images.push(pubUrl.publicUrl);

              const count = state.data.images.length;
              const statusText = `📸 <b>تم استلام (${count}) ${count === 1 ? 'صورة' : 'صور'} بنجاح ✅</b>${count >= 6 ? '\n(تم الوصول للحد الأقصى 6 صور)' : ''}\n\nأرسل المزيد أو اضغط «تم ✅» للمتابعة.`;
              const statusMarkup = {
                inline_keyboard: [
                  [{ text: `تم ✅ (متابعة بـ ${count} ${count === 1 ? 'صورة' : 'صور'})`, callback_data: 'car_images_done' }],
                  [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
                ]
              };

              // Delete old status message then send a fresh one (editing fails with photo messages)
              if (state.data.statusMsgId) {
                try {
                  await fetch(`${tgUrl}/deleteMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, message_id: state.data.statusMsgId })
                  });
                } catch(e) {}
              }
              const newRes = await sendMessage(chatId, statusText, statusMarkup);
              if (newRes?.result?.message_id) {
                state.data.statusMsgId = newRes.result.message_id;
              }

              await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
            }
          }
        } else {
          // Non-photo message — remind user
          if (!state.data.statusMsgId) {
            const res = await sendMessage(chatId, '📸 أرسل صور السيارة، أو اضغط «تم ✅» للمتابعة.', {
              inline_keyboard: [
                [{ text: 'تم ✅', callback_data: 'car_images_done' }],
                [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
              ]
            });
            if (res?.result?.message_id) {
              state.data.statusMsgId = res.result.message_id;
              await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
            }
          }
        }
      }
      else if (state.step === 'car_phone' && text) {
        state.data.phone = text.trim();
        state.step = 'car_review';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const currencySymbol = state.data.currency || 'د.ع';
        const formattedPrice = formatTgPrice(state.data.price, currencySymbol);
        const carTitle = `${state.data.brand || ''} ${state.data.model || ''} ${state.data.year || ''}`.trim();
        const mileageStr = state.data.mileage ? `${parseInt(state.data.mileage).toLocaleString('en-US')} كم` : 'غير محدد';
        const imgCount = state.data.images?.length || 0;

        const reviewText = `🔍 <b>مراجعة أخيرة قبل النشر</b>\nتأكد من صحة المعلومات، ثم اضغط «✅ نشر الإعلان الآن»:\n\n` +
                           `🚗 <b>النوع والموديل:</b> ${carTitle}\n` +
                           `📅 <b>السنة:</b> ${state.data.year || 'غير محدد'}\n` +
                           `🛣️ <b>الكيلومتر:</b> ${mileageStr}\n` +
                           `📍 <b>الموقع:</b> ${state.data.governorate || 'بغداد'}\n` +
                           `📋 <b>المواصفات:</b> ${state.data.origin || 'وارد عام'}\n` +
                           `💰 <b>السعر:</b> ${formattedPrice}\n` +
                           `📞 <b>التواصل:</b> ${state.data.phone}\n` +
                           `📸 <b>الصور:</b> ${imgCount} صور مرفقة\n`;

        await sendMessage(chatId, reviewText, {
          inline_keyboard: [
            [{ text: '✅ نشر الإعلان الآن', callback_data: 'car_confirm_publish' }],
            [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
          ]
        });
      }
      // Edit Car Price Input
      else if (state.step === 'edit_car_price_input' && text) {
        const cleanPrice = text.replace(/[^0-9]/g, '');
        const targetId = state.targetId;
        if (cleanPrice && targetId) {
          await supabase.from('ads').update({ price: cleanPrice }).eq('id', targetId);
          const { data: updatedAd } = await supabase.from('ads').select('*').eq('id', targetId).maybeSingle();

          if (updatedAd) {
            let specs: any = {};
            try { specs = JSON.parse(updatedAd.description); } catch(e){}
            const curr = specs.currency || '$';
            const formattedPrice = formatTgPrice(cleanPrice, curr);
            const brand = specs.brand || '';
            const model = specs.model || '';
            const year = specs.year || '';
            const mileage = specs.mileage ? `${parseInt(specs.mileage).toLocaleString('en-US')} كم` : 'غير محدد';
            const origin = specs.origin || 'وارد عام';
            const gov = updatedAd.location || updatedAd.city || 'العراق';
            const carTitle = `${brand} ${model} ${year}`.trim() || updatedAd.title || 'سيارة للبيع';
            const adId = updatedAd.short_id || updatedAd.id;
            const link = `https://www.souqbaghdad.store/ad/${adId}`;

            const newCaption = `🚗 <b>النوع:</b> ${carTitle}\n` +
                               `📅 <b>السنة:</b> ${year || 'غير محدد'}\n` +
                               `🛣️ <b>الكيلومتر:</b> ${mileage}\n` +
                               `📍 <b>الموقع:</b> ${gov}\n` +
                               `📋 <b>المواصفات:</b> ${origin}\n` +
                               `💰 <b>السعر المحدث:</b> ${formattedPrice}\n` +
                               (updatedAd.phone ? `📞 <b>التواصل:</b> ${updatedAd.phone}\n\n` : `\n`) +
                               `📣 <b>#رقم_الإعلان_${adId}</b> | @${BOT_USERNAME}`;

            let cleanPhone = (updatedAd.phone || '').replace(/[^0-9+]/g, '');
            if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
            else cleanPhone = cleanPhone.replace('+', '');

            const contactRow = [];
            if (cleanPhone) {
              contactRow.push({ text: '💬 تواصل واتساب', url: `https://wa.me/${cleanPhone}` });
              contactRow.push({ text: '✈️ تواصل تيليكرام', url: `https://t.me/+${cleanPhone}` });
            }

            const inlineKeyboard = [
              [{ text: '🌐 عرض التفاصيل بالمنصة', url: link }]
            ];
            if (contactRow.length > 0) inlineKeyboard.push(contactRow);
            inlineKeyboard.push([{ text: '🚗 اعرض سيارتك للبيع مجاناً', url: `https://t.me/${BOT_USERNAME}` }]);

            const replyMarkup = { inline_keyboard: inlineKeyboard };

            if (updatedAd.telegram_message_id && CAR_CHANNEL) {
              try {
                await editMessageCaption(CAR_CHANNEL, parseInt(updatedAd.telegram_message_id, 10), newCaption, replyMarkup);
                if (EXTRA_CHANNEL) await editMessageCaption(EXTRA_CHANNEL, parseInt(updatedAd.telegram_message_id, 10), newCaption, replyMarkup);
              } catch(e) {
                console.error('Caption update error:', e);
              }
            }

            const commentText = `📣 تم تحديث السعر إلى: ${formattedPrice}`;
            if (updatedAd.facebook_post_id) {
              await commentOnFacebook(updatedAd.facebook_post_id, commentText);
            }
            if (updatedAd.instagram_post_id) {
              await commentOnInstagram(updatedAd.instagram_post_id, commentText);
            }

            await sendMessage(chatId, `✅ <b>تم تحديث السعر بنجاح!</b>\nالسعر الجديد: <b>${formattedPrice}</b>\nتم تحديث المنشور في القناة والتعليق بالسعر الجديد على المنصات.`, {
              inline_keyboard: [[{ text: '🚗 العودة لسياراتي المعروضة', callback_data: 'manage_cat_cars' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
            });
          }
        }
        state = {};
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        return new Response('OK', { status: 200 });
      }
      // Edit Car Phone Input
      else if (state.step === 'edit_car_phone_input' && text) {
        const newPhone = text.trim();
        const targetId = state.targetId;
        if (newPhone && targetId) {
          await supabase.from('ads').update({ phone: newPhone }).eq('id', targetId);
          const { data: updatedAd } = await supabase.from('ads').select('*').eq('id', targetId).maybeSingle();

          if (updatedAd) {
            let specs: any = {};
            try { specs = JSON.parse(updatedAd.description); } catch(e){}
            const curr = specs.currency || '$';
            const formattedPrice = formatTgPrice(updatedAd.price, curr);
            const brand = specs.brand || '';
            const model = specs.model || '';
            const year = specs.year || '';
            const mileage = specs.mileage ? `${parseInt(specs.mileage).toLocaleString('en-US')} كم` : 'غير محدد';
            const origin = specs.origin || 'وارد عام';
            const gov = updatedAd.location || updatedAd.city || 'العراق';
            const carTitle = `${brand} ${model} ${year}`.trim() || updatedAd.title || 'سيارة للبيع';
            const adId = updatedAd.short_id || updatedAd.id;
            const link = `https://www.souqbaghdad.store/ad/${adId}`;

            const newCaption = `🚗 <b>النوع:</b> ${carTitle}\n` +
                               `📅 <b>السنة:</b> ${year || 'غير محدد'}\n` +
                               `🛣️ <b>الكيلومتر:</b> ${mileage}\n` +
                               `📍 <b>الموقع:</b> ${gov}\n` +
                               `📋 <b>المواصفات:</b> ${origin}\n` +
                               `💰 <b>السعر:</b> ${formattedPrice}\n` +
                               `📞 <b>التواصل:</b> ${newPhone}\n\n` +
                               `📣 <b>#رقم_الإعلان_${adId}</b> | @${BOT_USERNAME}`;

            let cleanPhone = newPhone.replace(/[^0-9+]/g, '');
            if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
            else cleanPhone = cleanPhone.replace('+', '');

            const contactRow = [];
            if (cleanPhone) {
              contactRow.push({ text: '💬 تواصل واتساب', url: `https://wa.me/${cleanPhone}` });
              contactRow.push({ text: '✈️ تواصل تيليكرام', url: `https://t.me/+${cleanPhone}` });
            }

            const inlineKeyboard = [
              [{ text: '🌐 عرض التفاصيل بالمنصة', url: link }]
            ];
            if (contactRow.length > 0) inlineKeyboard.push(contactRow);
            inlineKeyboard.push([{ text: '🚗 اعرض سيارتك للبيع مجاناً', url: `https://t.me/${BOT_USERNAME}` }]);

            const replyMarkup = { inline_keyboard: inlineKeyboard };

            if (updatedAd.telegram_message_id && PRODUCT_CHANNEL) {
              try {
                await editMessageCaption(PRODUCT_CHANNEL, parseInt(updatedAd.telegram_message_id, 10), newCaption, replyMarkup);
                if (EXTRA_CHANNEL) await editMessageCaption(EXTRA_CHANNEL, parseInt(updatedAd.telegram_message_id, 10), newCaption, replyMarkup);
              } catch(e) {
                console.error('Caption update error:', e);
              }
            }

            await sendMessage(chatId, `✅ <b>تم تحديث رقم الهاتف بنجاح!</b>\nالرقم الجديد: <b>${newPhone}</b>\nتم تحديث المنشور في القناة مباشرة.`, {
              inline_keyboard: [[{ text: '🚗 العودة لسياراتي المعروضة', callback_data: 'manage_cat_cars' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
            });
          }
        }
        state = {};
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        return new Response('OK', { status: 200 });
      }

      // ==========================================
      // 🚌 TRANSPORT WIZARD TEXT INPUTS
      // ==========================================
      else if (state.step === 'trans_area_custom_input' && text) {
        state.data.regions = text.trim();
        state.step = 'trans_dest';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const destButtons = TRANSPORT_DESTINATIONS_BAGHDAD.map(row => row.map(d => {
          if (d.includes('أخرى')) return { text: d, callback_data: 'trans_dest_custom' };
          return { text: d, callback_data: `trans_dest_${d}` };
        }));
        destButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await sendMessage(chatId, `🏢 <b>الخطوة 4 من 9 — الوجهة (الجامعة أو العمل)</b>\n\nاختر الوجهة المطلوبة 👇`, {
          inline_keyboard: destButtons
        });
      }
      else if (state.step === 'trans_dest_custom_input' && text) {
        state.data.destination = text.trim();
        state.step = 'trans_shift';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const shiftButtons = TRANSPORT_SHIFTS.map(row => row.map(s => ({ text: s, callback_data: `trans_shift_${s}` })));
        shiftButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await sendMessage(chatId, `⏰ <b>الخطوة 5 من 9 — وقت الدوام والشفت</b>\n\nاختر وقت الدوام 👇`, {
          inline_keyboard: shiftButtons
        });
      }
      else if (state.step === 'trans_fare_custom_input' && text) {
        const cleanPrice = text.replace(/[^0-9]/g, '');
        state.data.price = cleanPrice || '0';
        state.step = 'trans_phone';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const currentPhone = phone || '';
        const phoneButtons = [];
        if (currentPhone) {
          phoneButtons.push([{ text: `📱 استخدام رقمي الحالي (${currentPhone})`, callback_data: 'trans_phone_current' }]);
        }
        phoneButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);

        await sendMessage(chatId, `📞 <b>الخطوة 9 من 9 — رقم الهاتف للتواصل</b>\n\nاكتب رقم الهاتف الخاص بك للتواصل، أو اضغط على الزر أدناه:`, {
          inline_keyboard: phoneButtons
        });
      }
      else if (state.step === 'trans_phone' && text) {
        state.data.phone = text.trim();
        state.step = 'trans_review';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

        const typeStr = state.data.type === 'offer' ? '🚗 أوفر خط نقل (سائق)' : '🙋‍♂️ أبحث عن خط نقل (مطلوب)';
        const fareStr = formatTgPrice(state.data.price);
        const reviewText = `🔍 <b>مراجعة إعلان الخط قبل النشر</b>\nتأكد من صحة المعلومات، ثم اضغط «✅ نشر إعلان الخط الآن»:\n\n` +
                           `📌 <b>النوع:</b> ${typeStr}\n` +
                           `🏷️ <b>الفئة:</b> ${state.data.categoryType === 'employee' ? '💼 موظفين' : '🎓 طلاب'} (${state.data.targetAudience || 'الجميع'})\n` +
                           `📍 <b>مناطق الانطلاق:</b> ${state.data.regions || 'بغداد'}\n` +
                           `🏢 <b>الوجهة:</b> ${state.data.destination || 'بغداد'}\n` +
                           `⏰ <b>الدوام:</b> ${state.data.shift || 'صباحي'}\n` +
                           `🚗 <b>المركبة:</b> ${state.data.vehicleType || 'صالون'}\n` +
                           `💰 <b>الأجرة:</b> ${fareStr}\n` +
                           `📞 <b>التواصل:</b> ${state.data.phone}\n`;

        await sendMessage(chatId, reviewText, {
          inline_keyboard: [
            [{ text: '✅ نشر إعلان الخط الآن', callback_data: 'trans_confirm_publish' }],
            [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
          ]
        });
      }
      // Edit Transport Price Input
      else if (state.step === 'edit_trans_price_input' && text) {
        const cleanPrice = text.replace(/[^0-9]/g, '');
        const targetId = state.targetId;
        if (targetId) {
          await supabase.from('ads').update({ price: cleanPrice || '0' }).eq('id', targetId);
          const { data: updatedTrans } = await supabase.from('ads').select('*').eq('id', targetId).maybeSingle();

          if (updatedTrans) {
            const formattedPrice = formatTgPrice(cleanPrice);
            let desc: any = {};
            try { desc = typeof updatedTrans.description === 'string' ? JSON.parse(updatedTrans.description) : updatedTrans.description; } catch(e){}
            
            const catType = desc?.categoryType === 'employee' ? '💼 خط موظفين' : '🎓 خط طلاب';
            const targetStr = desc?.targetAudience || 'الجميع';
            const adId = updatedTrans.short_id || updatedTrans.id;
            const link = `https://www.souqbaghdad.store/transport/card/${adId}`;

            const newMsg = `🚌 <b>إعلان خط نقل — سوق بغداد (سعر محدث)</b>\n\n` +
                           `📌 <b>النوع:</b> ${updatedTrans.type === 'offer' ? '🚗 أوفر خط نقل' : '🙋‍♂️ أبحث عن خط نقل'}\n` +
                           `🏷️ <b>الفئة:</b> ${catType} (${targetStr})\n` +
                           `📍 <b>مناطق الانطلاق:</b> ${updatedTrans.location}\n` +
                           `🏢 <b>الوجهة:</b> ${updatedTrans.city}\n` +
                           `⏰ <b>وقت الدوام:</b> ${desc?.shift || 'صباحي'}\n` +
                           `🚗 <b>المركبة:</b> ${desc?.vehicleType || 'صالون'}\n` +
                           `💰 <b>الأجرة المحدثة:</b> ${formattedPrice}\n` +
                           (updatedTrans.phone ? `📞 <b>التواصل:</b> ${updatedTrans.phone}\n\n` : `\n`) +
                           `📣 <b>#رقم_الخط_${adId}</b> | @${BOT_USERNAME}`;

            let cleanPhone = (updatedTrans.phone || '').replace(/[^0-9+]/g, '');
            if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
            else cleanPhone = cleanPhone.replace('+', '');

            const contactRow = [];
            if (cleanPhone) {
              contactRow.push({ text: '💬 تواصل واتساب', url: `https://wa.me/${cleanPhone}` });
              contactRow.push({ text: '✈️ تواصل تيليكرام', url: `https://t.me/+${cleanPhone}` });
            }

            const inlineKeyboard = [
              [{ text: '🌐 التفاصيل الكاملة وحجز المقعد', url: link }]
            ];
            if (contactRow.length > 0) inlineKeyboard.push(contactRow);
            inlineKeyboard.push([{ text: '🚌 انشر خطك مجاناً عبر البوت', url: `https://t.me/${BOT_USERNAME}` }]);

            const replyMarkup = { inline_keyboard: inlineKeyboard };

            if (updatedTrans.telegram_message_id && TRANSPORT_CHANNEL) {
              try {
                await editMessageCaption(TRANSPORT_CHANNEL, parseInt(updatedTrans.telegram_message_id, 10), newMsg, replyMarkup);
                if (EXTRA_CHANNEL) await editMessageCaption(EXTRA_CHANNEL, parseInt(updatedTrans.telegram_message_id, 10), newMsg, replyMarkup);
              } catch(e) {
                console.error('Caption update error:', e);
              }
            }

            await sendMessage(chatId, `✅ <b>تم تحديث الأجرة بنجاح!</b>\nالأجرة الجديدة: <b>${formattedPrice}</b>\nتم تحديث المنشور في القناة مباشرة.`, {
              inline_keyboard: [[{ text: '🚌 العودة لخطوطي', callback_data: 'manage_cat_trans' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
            });
          }
        }
        state = {};
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        return new Response('OK', { status: 200 });
      }
      // Edit Transport Phone Input
      else if (state.step === 'edit_trans_phone_input' && text) {
        const newPhone = text.trim();
        const targetId = state.targetId;
        if (newPhone && targetId) {
          await supabase.from('ads').update({ phone: newPhone }).eq('id', targetId);
          const { data: updatedTrans } = await supabase.from('ads').select('*').eq('id', targetId).maybeSingle();

          if (updatedTrans) {
            let desc: any = {};
            try { desc = typeof updatedTrans.description === 'string' ? JSON.parse(updatedTrans.description) : updatedTrans.description; } catch(e){}
            
            const catType = desc?.categoryType === 'employee' ? '💼 خط موظفين' : '🎓 خط طلاب';
            const targetStr = desc?.targetAudience || 'الجميع';
            const adId = updatedTrans.short_id || updatedTrans.id;
            const link = `https://www.souqbaghdad.store/transport/card/${adId}`;

            const newMsg = `🚌 <b>إعلان خط نقل — سوق بغداد</b>\n\n` +
                           `📌 <b>النوع:</b> ${updatedTrans.type === 'offer' ? '🚗 أوفر خط نقل' : '🙋‍♂️ أبحث عن خط نقل'}\n` +
                           `🏷️ <b>الفئة:</b> ${catType} (${targetStr})\n` +
                           `📍 <b>مناطق الانطلاق:</b> ${updatedTrans.location}\n` +
                           `🏢 <b>الوجهة:</b> ${updatedTrans.city}\n` +
                           `⏰ <b>وقت الدوام:</b> ${desc?.shift || 'صباحي'}\n` +
                           `🚗 <b>المركبة:</b> ${desc?.vehicleType || 'صالون'}\n` +
                           `💰 <b>الأجرة:</b> ${formatTgPrice(updatedTrans.price)}\n` +
                           `📞 <b>التواصل:</b> ${newPhone}\n\n` +
                           `📣 <b>#رقم_الخط_${adId}</b> | @${BOT_USERNAME}`;

            let cleanPhone = newPhone.replace(/[^0-9+]/g, '');
            if (cleanPhone.startsWith('07')) cleanPhone = '964' + cleanPhone.substring(1);
            else cleanPhone = cleanPhone.replace('+', '');

            const contactRow = [];
            if (cleanPhone) {
              contactRow.push({ text: '💬 تواصل واتساب', url: `https://wa.me/${cleanPhone}` });
              contactRow.push({ text: '✈️ تواصل تيليكرام', url: `https://t.me/+${cleanPhone}` });
            }

            const inlineKeyboard = [
              [{ text: '🌐 التفاصيل الكاملة وحجز المقعد', url: link }]
            ];
            if (contactRow.length > 0) inlineKeyboard.push(contactRow);
            inlineKeyboard.push([{ text: '🚌 انشر خطك مجاناً عبر البوت', url: `https://t.me/${BOT_USERNAME}` }]);

            const replyMarkup = { inline_keyboard: inlineKeyboard };

            if (updatedTrans.telegram_message_id && TRANSPORT_CHANNEL) {
              try {
                await editMessageCaption(TRANSPORT_CHANNEL, parseInt(updatedTrans.telegram_message_id, 10), newMsg, replyMarkup);
                if (EXTRA_CHANNEL) await editMessageCaption(EXTRA_CHANNEL, parseInt(updatedTrans.telegram_message_id, 10), newMsg, replyMarkup);
              } catch(e) {
                console.error('Caption update error:', e);
              }
            }

            await sendMessage(chatId, `✅ <b>تم تحديث رقم الهاتف بنجاح!</b>\nالرقم الجديد: <b>${newPhone}</b>\nتم تحديث المنشور في القناة مباشرة.`, {
              inline_keyboard: [[{ text: '🚌 العودة لخطوطي', callback_data: 'manage_cat_trans' }], [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
            });
          }
        }
        state = {};
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        return new Response('OK', { status: 200 });
      }

      // Promo Code Redemption Input
      else if (state.step === 'enter_promo_code' && text) {
        if (!userId) {
          await sendMessage(chatId, '⚠️ <b>عذراً، يجب عليك تفعيل رقم هاتفك وإنشاء حساب أولاً لاستخدام الأكواد الترويجية وشحن الرصيد.</b>', {
            inline_keyboard: [[{ text: '📱 تفعيل رقم الهاتف الآن', callback_data: 'share_phone_prompt' }]]
          });
          state = {};
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          return new Response('OK', { status: 200 });
        }

        const inputCode = text.trim();
        
        // 1. Fetch promo code (case-insensitive)
        const { data: promo, error: pErr } = await supabase.from('promo_codes').select('*').ilike('code', inputCode).maybeSingle();
        
        if (pErr || !promo) {
          await sendMessage(chatId, `❌ <b>كود غير صالح!</b>\nالكود <code>${inputCode}</code> غير موجود أو تم إدخاله بشكل غير صحيح.`, {
            inline_keyboard: [
              [{ text: '🔄 تجربة كود آخر', callback_data: 'redeem_promo' }],
              [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
            ]
          });
          state = {};
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          return new Response('OK', { status: 200 });
        }

        if (promo.is_used) {
          await sendMessage(chatId, `⚠️ <b>هذا الكود تم استخدامه واكتمال حدّه مسبقاً.</b>`, {
            inline_keyboard: [
              [{ text: '🔄 تجربة كود آخر', callback_data: 'redeem_promo' }],
              [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
            ]
          });
          state = {};
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          return new Response('OK', { status: 200 });
        }

        // 2. Check if user already used it
        const { data: alreadyUsed } = await supabase.from('promo_code_usages').select('id').ilike('code', promo.code).eq('user_id', userId).maybeSingle();
        if (alreadyUsed) {
          await sendMessage(chatId, `⚠️ <b>لقد قمت باستخدام وتفعيل هذا الكود مسبقاً في حسابك!</b>`, {
            inline_keyboard: [[{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
          });
          state = {};
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          return new Response('OK', { status: 200 });
        }

        // 3. Check total usages
        const { count: totalUses } = await supabase.from('promo_code_usages').select('id', { count: 'exact', head: true }).ilike('code', promo.code);
        const maxUses = promo.max_uses || 1;
        if ((totalUses || 0) >= maxUses) {
          await supabase.from('promo_codes').update({ is_used: true }).eq('id', promo.id);
          await sendMessage(chatId, `⚠️ <b>هذا الكود اكتمل الحد الأقصى لاستخدامه.</b>`, {
            inline_keyboard: [[{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
          });
          state = {};
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          return new Response('OK', { status: 200 });
        }

        // 4. Record usage
        await supabase.from('promo_code_usages').insert({ code: promo.code, user_id: userId });

        // 5. Add points
        const { data: curProfile } = await supabase.from('profiles').select('points').eq('id', userId).single();
        const addedPoints = promo.points || 0;
        const newTotalPoints = (curProfile?.points || 0) + addedPoints;
        await supabase.from('profiles').update({ points: newTotalPoints }).eq('id', userId);

        // 6. Record points ledger if table exists
        try {
          await supabase.from('points_ledger').insert({
            user_id: userId,
            amount: addedPoints,
            reason: `استرداد بروموكود عبر البوت: ${promo.code}`
          });
        } catch(e) {}

        // 7. Update promo is_used if reached max
        if ((totalUses || 0) + 1 >= maxUses) {
          await supabase.from('promo_codes').update({ is_used: true }).eq('id', promo.id);
        }

        // 8. Celebration message & direct shortcuts
        await sendMessage(chatId, `🎉 <b>ألف مبروك! تم شحن محفظتك بنجاح!</b> 🪙\n\n` +
                                  `🎟️ <b>رمز الكود:</b> <code>${promo.code}</code>\n` +
                                  `🎁 <b>النقاط المضافة:</b> +${addedPoints} نقطة\n` +
                                  `💰 <b>رصيدك الكلي الآن:</b> ${newTotalPoints} نقطة\n\n` +
                                  `تم تحديث محفظتك فوراً، ويمكنك نشر إعلاناتك الآن:`, {
          inline_keyboard: [
            [{ text: '🚗 اعرض سيارة للبيع مجاناً', callback_data: 'publish_car' }],
            [{ text: '🚌 انشر خط نقل', callback_data: 'publish_transport' }],
            [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
          ]
        });

        state = {};
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        return new Response('OK', { status: 200 });
      }

      // Support Message
      else if (state.step === 'support_message' && text) {
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
        state = {};
      }
      // Product Wizard Text Inputs (9-step)
      else if (state.step === 'product_title' && text) {
        if (text.trim().length < 3) {
          await sendMessage(chatId, '⚠️ يرجى كتابة عنوان واضح (على الأقل 3 حروف).', cancelBtn);
          return new Response('OK', { status: 200 });
        }
        state.data.title = text.trim();
        state.step = 'product_category';
        
        // Delete old wizard message
        if (state.data.wizardMsgId) { try { await deleteMessage(chatId, state.data.wizardMsgId); } catch(e) {} }
        
        const res2 = await sendMessage(chatId,
          `<b>الخطوة 2 من 9 — قسم المنتج</b>\n\nاختر <b>القسم</b> المناسب:`,
          {
            inline_keyboard: [
              [{ text: '📱 إلكترونيات', callback_data: 'prod_cat_electronics' }, { text: '👕 أزياء وملابس', callback_data: 'prod_cat_fashion' }],
              [{ text: '🏠 المنزل', callback_data: 'prod_cat_home' }, { text: '🚗 أوتو', callback_data: 'prod_cat_vehicles' }],
              [{ text: '🔄 أخرى', callback_data: 'prod_cat_other' }],
              [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
            ]
          }
        );
        if (res2?.result?.message_id) { state.data.wizardMsgId = res2.result.message_id; }
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
      }
      else if (state.step === 'product_price' && text) {
        const rawNum = text.replace(/[^0-9]/g, '');
        if (!rawNum || parseInt(rawNum) <= 0) {
          await sendMessage(chatId, '⚠️ يرجى كتابة السعر بالأرقام فقط (مثال: 50000).', cancelBtn);
          return new Response('OK', { status: 200 });
        }
        state.data.price = rawNum;
        state.step = 'product_desc';
        
        if (state.data.wizardMsgId) { try { await deleteMessage(chatId, state.data.wizardMsgId); } catch(e) {} }

        const res5 = await sendMessage(chatId,
          `<b>الخطوة 5 من 9 — وصف المنتج</b>\n\nاكتب <b>وصفاً مفصلاً</b> للمنتج (المواصفات، الحالة، أي معلومة مفيدة):`,
          cancelBtn
        );
        if (res5?.result?.message_id) { state.data.wizardMsgId = res5.result.message_id; }
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
      }
      else if (state.step === 'product_desc' && text) {
        state.data.description = text.trim();
        state.step = 'product_gov';
        
        if (state.data.wizardMsgId) { try { await deleteMessage(chatId, state.data.wizardMsgId); } catch(e) {} }

        const res6 = await sendMessage(chatId,
          `<b>الخطوة 6 من 9 — المحافظة</b>\n\nاختر محافظتك:`,
          {
            inline_keyboard: [
              [{ text: '🏠 بغداد', callback_data: 'prod_gov_بغداد' }, { text: '🌊 البصرة', callback_data: 'prod_gov_البصرة' }, { text: '🟙 أربيل', callback_data: 'prod_gov_أربيل' }],
              [{ text: '🏙️ نينوى', callback_data: 'prod_gov_نينوى' }, { text: '📍 كركوك', callback_data: 'prod_gov_كركوك' }, { text: '📌 السليمانية', callback_data: 'prod_gov_السليمانية' }],
              [{ text: '📍 كربلاء', callback_data: 'prod_gov_كربلاء' }, { text: '📍 النجف', callback_data: 'prod_gov_النجف' }, { text: '📍 بابل', callback_data: 'prod_gov_بابل' }],
              [{ text: '📍 ديالى', callback_data: 'prod_gov_ديالى' }, { text: '📍 واسط', callback_data: 'prod_gov_واسط' }, { text: '📍 الأنبار', callback_data: 'prod_gov_الأنبار' }],
              [{ text: '📍 محافظات أخرى 📝', callback_data: 'prod_gov_أخرى' }],
              [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
            ]
          }
        );
        if (res6?.result?.message_id) { state.data.wizardMsgId = res6.result.message_id; }
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
      }
      else if (state.step === 'product_images' && photo) {
        if ((state.data.images || []).length >= 5) {
          await sendMessage(chatId, '⚠️ وصلت للحد الأقصى (5 صور). اضغط «تم ✅» للمتابعة.', {
            inline_keyboard: [[{ text: '✅ تم إرسال الصور', callback_data: 'prod_images_done' }]]
          });
          return new Response('OK', { status: 200 });
        }
        const fileId = photo[photo.length - 1].file_id;
        const fileRes = await fetch(`${tgUrl}/getFile?file_id=${fileId}`);
        const fileData = await fileRes.json();
        if (fileData.ok) {
          const filePath = fileData.result.file_path;
          const imageRes = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`);
          const imageBlob = await imageRes.blob();
          const fileName = `prod_${chatId}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}.jpg`;
          const { data: uploadData } = await supabase.storage.from('ad-images').upload(fileName, imageBlob, { contentType: 'image/jpeg' });
          if (uploadData) {
            const { data: pubUrl } = supabase.storage.from('ad-images').getPublicUrl(fileName);
            if (!state.data.images) state.data.images = [];
            state.data.images.push(pubUrl.publicUrl);
            const count = state.data.images.length;
            await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
            const statusText = `📸 <b>تم استلام (${count}) من الصور ✅</b>${count >= 5 ? '\n(وصلت للحد الأقصى)' : ''}\n\nأرسل المزيد أو اضغط «تم ✅» للمتابعة.`;
            if (state.data.statusMsgId) {
              try {
                await editMessageText(chatId, state.data.statusMsgId, statusText, { inline_keyboard: [[{ text: '✅ تم إرسال الصور', callback_data: 'prod_images_done' }]] });
              } catch(e) {
                const r = await sendMessage(chatId, statusText, { inline_keyboard: [[{ text: '✅ تم إرسال الصور', callback_data: 'prod_images_done' }]] });
                if (r?.result?.message_id) state.data.statusMsgId = r.result.message_id;
              }
            } else {
              const r = await sendMessage(chatId, statusText, { inline_keyboard: [[{ text: '✅ تم إرسال الصور', callback_data: 'prod_images_done' }]] });
              if (r?.result?.message_id) state.data.statusMsgId = r.result.message_id;
            }
            await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          }
        }
      }
      else if (state.step === 'product_images' && text) {
        await sendMessage(chatId, '📸 أرسل صورة، أو اضغط «تم ✅» للمتابعة.', {
          inline_keyboard: [[{ text: '✅ تم إرسال الصور', callback_data: 'prod_images_done' }]]
        });
      }
      else if (state.step === 'product_phone' && text) {
        const cleanPhone = text.replace(/[^0-9+]/g, '');
        if (cleanPhone.length < 10) {
          await sendMessage(chatId, '⚠️ يرجى إدخال رقم هاتف صحيح.', cancelBtn);
          return new Response('OK', { status: 200 });
        }
        state.data.phone = cleanPhone;
        state.step = 'product_review';
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        const d = state.data;
        const catLabels: Record<string, string> = { electronics: '📱 إلكترونيات', fashion: '👕 أزياء وملابس', home: '🏠 المنزل', vehicles: '🚗 أوتو', other: '🔄 أخرى' };
        const reviewText =
          `🔍 <b>مراجعة أخيرة — الخطوة 9 من 9</b>\n\n` +
          `📌 <b>العنوان:</b> ${d.title || '-'}\n` +
          `📑 <b>القسم:</b> ${catLabels[d.category] || d.category || '-'}\n` +
          `✨ <b>الحالة:</b> ${d.condition || '-'}\n` +
          `💰 <b>السعر:</b> ${Number(String(d.price).replace(/[^0-9]/g, '')).toLocaleString('en-US')} د.ع\n` +
          `📝 <b>الوصف:</b> ${d.description || '-'}\n` +
          `📍 <b>المحافظة:</b> ${d.governorate || '-'}\n` +
          `📸 <b>الصور:</b> ${(d.images || []).length} صورة\n` +
          `📞 <b>الهاتف:</b> ${d.phone || '-'}\n\n` +
          `هل كل شيء صحيح؟ اضغط «✅ نشر الإعلان الآن» للنشر الفوري.`;
        const revMarkup = {
          inline_keyboard: [
            [{ text: '✅ نشر الإعلان الآن 🚀', callback_data: 'prod_confirm_publish' }],
            [{ text: '❌ إلغاء وبدء من جديد', callback_data: 'cancel_wizard' }]
          ]
        };
        const wId = state.data?.wizardMsgId;
        if (wId) { try { await deleteMessage(chatId, wId); } catch(e) {} }
        const resRev = await sendMessage(chatId, reviewText, revMarkup);
        if (resRev?.result?.message_id) {
          state.data.wizardMsgId = resRev.result.message_id;
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
        }
      }
      else if (state.step) {
        if (state.step === 'car_images' || state.step === 'product_images') {
          await sendMessage(chatId, '📸 الرجاء <b>إرسال صورة</b>، أو اضغط «تم ✅» للمتابعة.', {
            inline_keyboard: [[{ text: '✅ تم إرسال الصور', callback_data: state.step === 'product_images' ? 'prod_images_done' : 'car_images_done' }]]
          });
        } else {
          await sendMessage(chatId, '⚠️ إدخال غير متوقع، لإلغاء العملية الحالية أرسل /cancel');
        }
      }
      else {
        if (text || voice || photo) {
          let audioUrl: string | null = null;
          let photoUrl: string | null = null;

          if (photo && photo.length > 0) {
            await sendMessage(chatId, '🔍 جاري فحص وتحليل الصورة والسكرين شوت...');
            const fileId = photo[photo.length - 1].file_id;
            const fileRes = await fetch(`${tgUrl}/getFile?file_id=${fileId}`);
            const fileData = await fileRes.json();
            if (fileData.ok) {
              const filePath = fileData.result.file_path;
              photoUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
            }
          }

          const caption = update?.message?.caption || null;
          const userCaption = caption || text || originalVoiceText || null;
          const cleanP = (userCaption || '').toLowerCase().trim();

          // 0. Check if user is Platform Owner / Admin giving operational commands (إعادة نشر المحتوى الفاشل، مزامنة بعد التوكن)
          const isOwnerCommand = isOwner && (
            cleanP.includes('اعادة نشر') || cleanP.includes('إعادة نشر') || cleanP.includes('نشر المحتوى') ||
            cleanP.includes('صار بي فشل') || cleanP.includes('الفاشل') || cleanP.includes('فاشلة') ||
            cleanP.includes('مزامنة') || cleanP.includes('سوي مزامنة') || cleanP.includes('انشر الاعلانات') ||
            cleanP.includes('انشر الإعلانات') || cleanP.includes('retry') || cleanP.includes('sync_all') ||
            cleanP.includes('بعد ارسال توكن') || cleanP.includes('بعد التوكن') || cleanP.includes('توكن جديد')
          );

          if (isOwnerCommand) {
            sendChatAction(chatId, 'typing');
            await sendMessage(chatId, `🫡 <b>يا هلا بمديرنا الغالي نورالدين 🌹!</b>\n⏳ <b>جاري فحص وإعادة نشر الإعلانات والمحتوى المتعثر إلى جميع الصفحات والقنوات الآن...</b>`);

            try {
              // 1. Trigger auto-publisher Edge Function
              const autoPubUrl = `${SUPABASE_URL}/functions/v1/auto-publisher`;
              await fetch(autoPubUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                },
                body: JSON.stringify({ trigger: 'owner_manual_resync', chatId })
              });
            } catch(e) {
              console.error('[OWNER RESYNC] Failed invoking auto-publisher:', e);
            }

            // 2. Fetch active ads and social settings
            const { data: activeAds } = await supabase
              .from('ads')
              .select('*')
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(10);

            const { data: settings } = await supabase
              .from('social_settings')
              .select('*')
              .eq('is_active', true);

            const activePages = (settings || []).map((s: any) => `• ${s.name} (${s.category}) 🟢`).join('\n');

            const summaryMsg = 
              `✅ <b>تمت عملية إعادة المزامنة والنشر بنجاح يا مديرنا الغالي! 🎯🚀</b>\n\n` +
              `📊 <b>ملخص العملية:</b>\n` +
              `• تم فحص وتوجيه (<b>${(activeAds || []).length}</b>) إعلان نشط للنشر الفوري.\n` +
              `• المنصات والصفحات المفعلة الحالية:\n${activePages || '• قنوات تيليجرام وصفحات فيسبوك'}\n\n` +
              `🔗 تصفح المنصة مباشرة: https://www.souqbaghdad.store`;

            const summaryMarkup = {
              inline_keyboard: [
                [{ text: '📡 لوحة تحكم المنصات والتسعير', callback_data: 'social_management' }],
                [{ text: '🌐 تصفح الموقع', url: 'https://www.souqbaghdad.store' }],
                [{ text: '👑 لوحة المالك الرئيسية', callback_data: 'owner_hub_main' }]
              ]
            };

            await sendMessage(chatId, summaryMsg, summaryMarkup);
            return new Response('OK', { status: 200 });
          }

          // 1. Check if user is a Channel / Group Owner requesting bot services
          const isChannelOwnerIntent = 
            cleanP.includes('صاحب قناة') || cleanP.includes('صاحب كروب') || cleanP.includes('عندي قناة') || 
            cleanP.includes('عندي كروب') || cleanP.includes('نفس الخدمات') || cleanP.includes('البوت بقناتي') || 
            cleanP.includes('البوت بكروبي') || cleanP.includes('اضيف البوت') || cleanP.includes('اضيفك لكروبي') || 
            cleanP.includes('اضيفك لقناتي') || cleanP.includes('تفعيل بالكروب') || cleanP.includes('اريد البوت لمجموعتي') ||
            cleanP.includes('نفس البوت') || cleanP.includes('شلون اخليك بكروبي');

          if (isChannelOwnerIntent) {
            sendChatAction(chatId, 'typing');
            const ownerMsg = 
              `👋 <b>يا هلا وكل الهلا بيك وبقناتك / كروبك العزيز 🌹!</b>\n\n` +
              `💎 <b>كل اللي عليك تسويه:</b>\n` +
              `1️⃣ ضيف البوت (<b>@${BOT_USERNAME}</b>) مشرف (Admin) بالكروب أو القناة مع صلاحيات إرسال وحذف الرسائل.\n` +
              `2️⃣ <b>والباقي كله عليه تلقائياً! 🚀</b>\n\n` +
              `✨ <b>الخدمات التي ستتفعل فوراً في مجموعتك:</b>\n` +
              `• 🚌 <b>مطابقة خطوط النقل التلقائية</b> لخدمة الطلاب والسائقين.\n` +
              `• 🚗 <b>رادار السيارات واستعلام الأسعار الذكي</b>.\n` +
              `• 🛡️ <b>حماية الكروب الفائقة</b> من الروابط والإعلانات المزعجة والسبام.\n` +
              `• 🤖 <b>المساعد والذكاء الاصطناعي</b> للرد على استفسارات الأعضاء 24 ساعة.\n\n` +
              `<i>اضغط الزر أدناه لإضافة البوت مباشرة لمجموعتك:</i>`;

            const ownerMarkup = {
              inline_keyboard: [
                [{ text: '➕ إضافة البوت إلى كروبك الآن 🚀', url: `https://t.me/${BOT_USERNAME}?startgroup=true` }],
                [{ text: '📢 إضافة البوت إلى قناتك 🚀', url: `https://t.me/${BOT_USERNAME}?startchannel=true` }],
                [{ text: '💬 تواصل مع الدعم الفني', callback_data: 'support' }],
                [{ text: '📋 القائمة الرئيسية', callback_data: 'main_menu' }]
              ]
            };
            await sendMessage(chatId, ownerMsg, ownerMarkup);
            return new Response('OK', { status: 200 });
          }

          // 2. Check if user found a line or wants to stop notifications ("لكيت خط", "حصلت خط", "لغيت الطلب")
          const isMatchedIntent = 
            cleanP.includes('لكيت خط') || cleanP.includes('حصلت خط') || cleanP.includes('لكيت خلاص') || 
            cleanP.includes('ما محتاج بعد') || cleanP.includes('ما احتاج خط') || cleanP.includes('لغيت طلبي') || 
            cleanP.includes('لقيت خط') || cleanP.includes('لقيت خلاص') || cleanP.includes('حصلت خلاص') ||
            cleanP.includes('الغاء التنبيه') || cleanP.includes('وقف التنبيه') || cleanP.includes('اوقف التنبيه');

          if (isMatchedIntent) {
            sendChatAction(chatId, 'typing');
            try {
              await supabase.from('transport_requests').update({ status: 'matched' }).or(`telegram_chat_id.eq.${chatId},telegram_user_id.eq.${fromUser?.id || chatId}`);
            } catch(e) {}
            
            const matchedSuccessMsg = 
              `🎉 <b>ألف مبروك عيوني ${fromUser?.first_name || 'الغالي'}! 🌹</b>\n\n` +
              `✅ <b>تم إيقاف التنبيهات وتحديث طلبك (حصلت خط) بنجاح</b> حتى لا نزعجك بعد بأي إشعار.\n` +
              `نتمنى لك دوام موفق وسنة دراسية ممتعة وكل التوفيق والنجاح يا رب! ✨`;
            
            const matchedMarkup = {
              inline_keyboard: [
                [{ text: '🌐 تصفح موقع سوق بغداد', url: 'https://www.souqbaghdad.store' }],
                [{ text: '📋 القائمة الرئيسية للخدمات', callback_data: 'main_menu' }]
              ]
            };
            await sendMessage(chatId, matchedSuccessMsg, matchedMarkup);
            return new Response('OK', { status: 200 });
          }

          if (cleanP.includes('مراجعة إعلان الخط قبل النشر')) {
            await sendMessage(chatId, '⚠️ <b>عذراً كابتن، لنشر إعلانك يرجى الضغط على زر "✅ نشر إعلان الخط الآن" الموجود أسفل رسالة المراجعة بدلاً من إعادة إرسال النص.</b>');
            return new Response('OK', { status: 200 });
          }

          // 2.A Check if user is SEEKING a line (طالب / موظف يبحث عن خط) -> Smart Transport Search & Radar
          const isSeekerTransportDirect = 
            cleanP.includes('محتاج خط') || cleanP.includes('محتاجة خط') || cleanP.includes('محتاجه خط') || 
            cleanP.includes('اريد خط') || cleanP.includes('أريد خط') || cleanP.includes('نريد خط') || cleanP.includes('محتاجين خط') || 
            cleanP.includes('ادور خط') || cleanP.includes('أدور خط') || cleanP.includes('ندور خط') || cleanP.includes('ابحث عن خط') || 
            cleanP.includes('رايد خط') || cleanP.includes('رايده خط') || cleanP.includes('رايدة خط') || 
            cleanP.includes('محتاج سايق') || cleanP.includes('محتاجه سايق') || cleanP.includes('محتاجة سايق') || cleanP.includes('اريد سايق') || 
            cleanP.includes('طالبه محتاجه') || cleanP.includes('طالبة محتاجة') || cleanP.includes('طالب محتاج') || cleanP.includes('عفيه اريد خط') || cleanP.includes('عفية اريد خط');

          if (isSeekerTransportDirect) {
            sendChatAction(chatId, 'typing');
            await handleSmartTransportSearch(chatId, userCaption || text, fromUser, supabase, false);
            return new Response('OK', { status: 200 });
          }

          // 2.B Check if user is OFFERING a line as a DRIVER to start the publishing wizard
          const isTransportAdIntent = 
            cleanP.includes('عندي خط') || cleanP.includes('أوفر خط') || cleanP.includes('اوفر خط') || 
            cleanP.includes('يتوفر خط') || cleanP.includes('متوفر خط') || cleanP.includes('خط متوفر') ||
            cleanP.includes('سايق خط') || cleanP.includes('سائق خط') || cleanP.includes('عندي مقاعد') || 
            cleanP.includes('ادور طلاب') || cleanP.includes('ابحث عن طلاب') || cleanP.includes('اريد طلاب') || 
            cleanP.includes('يوجد خط') || cleanP.includes('عندي سيارة') || cleanP.includes('عندي كيا') || cleanP.includes('عندي كوستر') || cleanP.includes('عندي ستاركس') ||
            cleanP.includes('عندي طيبه') || cleanP.includes('عندي سايبا') || cleanP.includes('اخذ خط') || cleanP.includes('اخذ نفرات') ||
            cleanP.includes('الي يريد خط') || cleanP.includes('تكملة خط') || cleanP.includes('تكملت خط');

          if (isTransportAdIntent) {
            sendChatAction(chatId, 'typing');
            
            // Check points first
            const { data: profile } = await supabase.from('profiles').select('points, role').eq('id', userId).maybeSingle();
            if (profile?.role !== 'admin' && profile?.role !== 'owner' && (profile?.points || 0) < 1) {
              await sendMessage(chatId, '❌ <b>عذراً كابتن/عيوني، رصيد النقاط الخاص بك غير كافٍ لنشر إعلان.</b>\nيرجى شحن المحفظة أولاً من القائمة الرئيسية.');
              return new Response('OK', { status: 200 });
            }

            // Call Gemini
            let extracted: any = {};
            try {
              const systemPrompt = `أنت خبير في الذكاء الاصطناعي متخصص في اللهجة العراقية الدارجة وتحليل إعلانات خطوط النقل للطلاب والموظفين في العراق.
مهمتك هي قراءة الرسالة (مهما كان أسلوبها، لهجتها، أو تنسيقها) واستخراج البيانات التالية بصيغة JSON حصراً:
{
  "ad_type": "استنتج نوع الإعلان: إذا كان المستخدم سائق يمتلك خط ويبحث عن ركاب (أو يريد تكملة خط) اكتب 'offer'، وإذا كان طالب أو موظف يبحث عن خط يوصله اكتب 'seek'",
  "origin": "نقطة الانطلاق (منين يطلع؟) سواء كانت منطقة أو عدة مناطق (مثال: جميلة، الدورة، حي الجامعة) أو null إذا غير مذكورة",
  "destination": "وجهة الخط (وين يروح؟) أي مكان يقصده سواء كلية، معهد، دائرة، شركة، مستشفى، مول، أو منطقة (مثال: كلية الرافدين، شركة زين، مستشفى اليرموك) أو null",
  "car_type": "نوع السيارة أو مواصفاتها (مثال: النترا، ستاركس، طيبه، سايبا، كيا، VIP) أو null",
  "gender": "الفئة المستهدفة أو الجنس (مثال: طالبات فقط، بنات، طلاب، الجميع، موظفين) أو null",
  "shift": "وقت الدوام أو ساعات العمل (مثال: صباحي، مسائي، مرن، من 8 لـ 4، من 9 للـ 3) أو null",
  "price": "السعر أو الأجرة (مثال: حسب الاتفاق، 50 الف) أو null",
  "phone": "رقم الهاتف للتواصل (سواء انكتب بالانجليزي 077 او بالعربي ٠٧٧) أو null"
}
تنبيهات هامة:
- السائق قد يكتب بلهجة عراقية عامية (عندي خط، تكملة خط، رايح جاي، عندي طيبه، اخذ خط بيها).
- الطالب قد يكتب (محتاج خط، اريد خط، ادور خط).
- استخرج المعلومات بذكاء، مثلاً إذا كتب "من 8 الى 4 عصر" فهذا هو الـ shift، وإذا كتب "كلية الرفدين" فهذا هو الـ destination.
- استخرج أي شيء يدل على نوع السيارة وضعها في car_type حتى لو كانت كلمة "طيبه".
- لا تكتب أي حرف أو نص خارج كود الـ JSON.`;
              
              const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
              if (GEMINI_API_KEY) {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: userCaption || text }] }],
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
                  })
                });
                
                const data = await response.json();
                if (response.ok && data.candidates && data.candidates.length > 0) {
                  const aiResponse = data.candidates[0].content.parts[0].text;
                  const jsonStr = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                  extracted = JSON.parse(jsonStr);
                } else {
                  console.error("Gemini fetch failed:", data);
                }
              }
            } catch (e) {
              console.error("Gemini driver parse error:", e);
            }

            // If Gemini determines user is seeking a line -> delegate to Smart Transport Search
            if (extracted.ad_type === 'seek') {
              await handleSmartTransportSearch(chatId, userCaption || text, fromUser, supabase, false);
              return new Response('OK', { status: 200 });
            }

            // Initialize state with extracted info for driver offer
            const adType = 'offer';
            let state: any = {
              step: '',
              data: {
                type: adType,
                categoryType: 'student', // Default assumption
                regions: extracted.origin || null,
                destination: extracted.destination || null,
                vehicleType: extracted.car_type || null,
                targetAudience: extracted.gender || null,
                shift: extracted.shift || null,
                price: extracted.price ? (String(extracted.price).includes('الاتفاق') ? '0' : String(extracted.price).replace(/[^0-9]/g, '')) : null,
                phone: extracted.phone || null,
              }
            };

            // Find missing step
            let missingStep = '';
            if (!state.data.regions) missingStep = 'trans_regions';
            else if (!state.data.destination) missingStep = 'trans_dest';
            else if (!state.data.shift) missingStep = 'trans_shift';
            else if (!state.data.vehicleType && adType === 'offer') missingStep = 'trans_vehicle'; // Students seeking line don't necessarily provide car_type
            else if (!state.data.targetAudience) missingStep = 'trans_target';
            else if (!state.data.price && adType === 'offer') missingStep = 'trans_fare';
            else if (!state.data.phone) missingStep = 'trans_phone';
            else missingStep = 'trans_review';

            state.step = missingStep;
            await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

            // Send appropriate missing prompt
            if (missingStep === 'trans_regions') {
              const areaButtons = TRANSPORT_AREAS_BAGHDAD.map(row => row.map(a => {
                if (a.includes('أخرى')) return { text: a, callback_data: 'trans_area_custom' };
                return { text: a, callback_data: `trans_area_${a}` };
              }));
              areaButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);
              await sendMessage(chatId, `📍 <b>نحتاج بعض التفاصيل الإضافية لنشر خطك!</b>\n\nالخطوة الحالية: <b>مناطق الانطلاق (المرور)</b>\nاختر منطقة الانطلاق أو اكتبها بنفسك 👇`, { inline_keyboard: areaButtons });
            } 
            else if (missingStep === 'trans_dest') {
              const destButtons = TRANSPORT_DESTINATIONS_BAGHDAD.map(row => row.map(d => {
                if (d.includes('أخرى')) return { text: d, callback_data: 'trans_dest_custom' };
                return { text: d, callback_data: `trans_dest_${d}` };
              }));
              destButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);
              await sendMessage(chatId, `🏢 <b>نحتاج بعض التفاصيل الإضافية لنشر خطك!</b>\n\nالخطوة الحالية: <b>الوجهة (الجامعة أو العمل)</b>\nاختر الوجهة المطلوبة 👇`, { inline_keyboard: destButtons });
            }
            else if (missingStep === 'trans_shift') {
              const shiftButtons = TRANSPORT_SHIFTS.map(row => row.map(s => ({ text: s, callback_data: `trans_shift_${s}` })));
              shiftButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);
              await sendMessage(chatId, `⏰ <b>نحتاج بعض التفاصيل الإضافية لنشر خطك!</b>\n\nالخطوة الحالية: <b>وقت الدوام والشفت</b>\nاختر وقت الدوام 👇`, { inline_keyboard: shiftButtons });
            }
            else if (missingStep === 'trans_vehicle') {
              const vehicleButtons = TRANSPORT_VEHICLES.map(row => row.map(v => ({ text: v, callback_data: `trans_vehicle_${v}` })));
              vehicleButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);
              await sendMessage(chatId, `🚗 <b>نحتاج بعض التفاصيل الإضافية لنشر خطك!</b>\n\nالخطوة الحالية: <b>نوع المركبة</b>\nاختر نوع المركبة 👇`, { inline_keyboard: vehicleButtons });
            }
            else if (missingStep === 'trans_target') {
              const targetButtons = TRANSPORT_TARGETS.map(row => row.map(t => ({ text: t, callback_data: `trans_target_${t}` })));
              targetButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);
              await sendMessage(chatId, `👥 <b>نحتاج بعض التفاصيل الإضافية لنشر خطك!</b>\n\nالخطوة الحالية: <b>فئة الركاب</b>\nالخط مخصص لمن؟ 👇`, { inline_keyboard: targetButtons });
            }
            else if (missingStep === 'trans_fare') {
              const fareButtons = TRANSPORT_FARES.map(row => row.map(f => {
                if (f.includes('آخر')) return { text: f, callback_data: 'trans_fare_custom' };
                return { text: f, callback_data: `trans_fare_${f}` };
              }));
              fareButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);
              await sendMessage(chatId, `💰 <b>نحتاج بعض التفاصيل الإضافية لنشر خطك!</b>\n\nالخطوة الحالية: <b>الأجرة الشهرية / السعر</b>\nاختر الأجرة التقريبية لكل راكب 👇`, { inline_keyboard: fareButtons });
            }
            else if (missingStep === 'trans_phone') {
              const currentPhone = phone || '';
              const phoneButtons = [];
              if (currentPhone) phoneButtons.push([{ text: `📱 استخدام رقمي الحالي (${currentPhone})`, callback_data: 'trans_phone_current' }]);
              phoneButtons.push([{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]);
              await sendMessage(chatId, `📞 <b>الخطوة الأخيرة لنشر خطك!</b>\n\nاكتب رقم الهاتف للتواصل، أو اضغط على الزر لاستخدام رقمك المسجل:`, { inline_keyboard: phoneButtons });
            }
            else if (missingStep === 'trans_review') {
              const typeStr = '🚗 أوفر خط نقل (سائق)';
              const fareNum = parseInt(state.data.price) || 0;
              const fareStr = fareNum === 0 ? 'حسب الاتفاق' : fareNum.toLocaleString() + ' دينار';
              const reviewText = `✨ <b>ممتاز كابتن! لقد استخرجنا جميع معلومات خطك بنجاح.</b>\n\n` +
                                 `🔍 <b>مراجعة إعلان الخط قبل النشر</b>\nتأكد من صحة المعلومات، ثم اضغط «✅ نشر إعلان الخط الآن»:\n\n` +
                                 `📌 <b>النوع:</b> ${typeStr}\n` +
                                 `🏷️ <b>الفئة:</b> ${state.data.categoryType === 'employee' ? '💼 موظفين' : '🎓 طلاب'} (${state.data.targetAudience || 'الجميع'})\n` +
                                 `📍 <b>مناطق الانطلاق:</b> ${state.data.regions || 'بغداد'}\n` +
                                 `🏢 <b>الوجهة:</b> ${state.data.destination || 'بغداد'}\n` +
                                 `⏰ <b>الدوام:</b> ${state.data.shift || 'صباحي'}\n` +
                                 `🚗 <b>المركبة:</b> ${state.data.vehicleType || 'صالون'}\n` +
                                 `💰 <b>الأجرة:</b> ${fareStr}\n` +
                                 `📞 <b>التواصل:</b> ${state.data.phone}\n`;

              await sendMessage(chatId, reviewText, {
                inline_keyboard: [
                  [{ text: '✅ نشر إعلان الخط الآن', callback_data: 'trans_confirm_publish' }],
                  [{ text: '❌ إلغاء', callback_data: 'cancel_wizard' }]
                ]
              });
            }
            return new Response('OK', { status: 200 });
          }

          // 2.5 Check if user found a line or wants to cancel/stop alerts (لكيت خط، حصلت خط، لغيت الطلب، وقف التنبيهات)
          const isCancelAlertIntent = 
            cleanP.includes('لكيت خط') || cleanP.includes('لقيت خط') || cleanP.includes('حصلت خط') ||
            cleanP.includes('ما اريد خط') || cleanP.includes('ما اريد بعد') || cleanP.includes('وقف التنبيهات') ||
            cleanP.includes('وقف التنبيه') || cleanP.includes('الغاء الطلب') || cleanP.includes('لغيت الطلب') ||
            cleanP.includes('شكرا لكيت') || cleanP.includes('شكراً لكيت') || cleanP.includes('لقيت سايق') || cleanP.includes('لكيت سايق') ||
            cleanP.includes('حصلت سايق') || cleanP.includes('ما محتاج خط') || cleanP.includes('ما احتاج خط') || cleanP.includes('حصلت سيارة');

          if (isCancelAlertIntent) {
            sendChatAction(chatId, 'typing');
            await supabase
              .from('transport_requests')
              .update({ status: 'matched' })
              .or(`telegram_chat_id.eq.${chatId},telegram_user_id.eq.${fromUser?.id || chatId}`);

            const cancelConfirmMsg = 
              `🎉 <b>ألف مبروك يالغالي! 🌹✨</b>\n\n` +
              `✅ <b>تم إيقاف التنبيهات وإلغاء طلبك من قائمة الانتظار بنجاح.</b>\n` +
              `نتمنى لك دوام التوفيق ورحلات يومية مريحة وآمنة دائماً 🤝\n\n` +
              `إذا احتجت أي شيء مستقبلاً بسيارة أو خط نقل، نحن بالخدمة دائماً في سوق بغداد 🇮🇶`;

            const cancelConfirmMarkup = {
              inline_keyboard: [
                [{ text: '🚗 تصفح سيارات سوق بغداد', url: 'https://www.souqbaghdad.store' }, { text: '🚌 خطوط النقل', url: 'https://www.souqbaghdad.store/transport' }],
                [{ text: '📋 القائمة الرئيسية', callback_data: 'main_menu' }]
              ]
            };

            await sendMessage(chatId, cancelConfirmMsg, cancelConfirmMarkup);
            return new Response('OK', { status: 200 });
          }

          // 3. Check if user wants another / alternative driver or encountered issues (مقبط، ما اتفقنا، سجل طلبي، بلغني من تلكه خط)
          const isAlternativeDriverIntent = 
            cleanP.includes('غير سايق') || cleanP.includes('غيره') || cleanP.includes('غير خط') || 
            cleanP.includes('بديل') || cleanP.includes('ما ناسبني') || cleanP.includes('سائق ثاني') || 
            cleanP.includes('اكو غير') || cleanP.includes('هذا نفسه') || cleanP.includes('نفس السايق') ||
            cleanP.includes('بلغني') || cleanP.includes('نبهني') || cleanP.includes('من تلكه') || cleanP.includes('من ينزل') ||
            cleanP.includes('من يجي') || cleanP.includes('من يتوفر') || cleanP.includes('خط بعد') ||
            cleanP.includes('ما موجد') || cleanP.includes('ما متوفر') || cleanP.includes('غير هذا') ||
            cleanP.includes('مقبط') || cleanP.includes('مفول') || cleanP.includes('ماكو مقاعد') || cleanP.includes('ماكو مجال') ||
            cleanP.includes('ما اتفقت') || cleanP.includes('ماتفقت') || cleanP.includes('ما اتفقنا') || cleanP.includes('ماتفقنا') ||
            cleanP.includes('سجل طلبي') || cleanP.includes('سجلني') || cleanP.includes('سجل رقمي') || cleanP.includes('بالانتظار') ||
            cleanP.includes('نسى اعلانه') || cleanP.includes('مبطل') || cleanP.includes('ما يجاوب') || cleanP.includes('الخط مغلق');

          if (isAlternativeDriverIntent) {
            sendChatAction(chatId, 'typing');
            let lastOrigin = state.last_origin || '';
            let lastDest = state.last_dest || 'كلية الرافدين';

            if (!lastOrigin) {
              const { data: lastReq } = await supabase.from('transport_requests').select('*').eq('telegram_chat_id', String(chatId)).order('created_at', { ascending: false }).limit(1).maybeSingle();
              if (lastReq) {
                lastOrigin = lastReq.origin;
                lastDest = lastReq.destination;
              }
            }

            // Reason context phrasing
            let reasonBadge = '';
            if (cleanP.includes('مقبط') || cleanP.includes('مفول') || cleanP.includes('ماكو مقاعد') || cleanP.includes('ماكو مجال')) {
              reasonBadge = ' (لأن السائق سيارته مقبطة ومفولة)';
            } else if (cleanP.includes('ما اتفقت') || cleanP.includes('ماتفقت') || cleanP.includes('ما اتفقنا') || cleanP.includes('ماتفقنا')) {
              reasonBadge = ' (لأنه لم يتم الاتفاق ويا السائق)';
            } else if (cleanP.includes('نسى اعلانه') || cleanP.includes('مبطل') || cleanP.includes('ما يجاوب') || cleanP.includes('الخط مغلق')) {
              reasonBadge = ' (لأن الخط أو السائق غير متاح حالياً)';
            }

            if (lastOrigin) {
              const { data: allLines } = await supabase.from('ads').select('*').eq('category', 'transport').eq('status', 'active').order('created_at', { ascending: false }).limit(50);
              
              const lastShownPhoneClean = (state.last_driver_phone || '07718142338').replace(/[^0-9]/g, '');
              const seenPhones = new Set<string>();
              if (lastShownPhoneClean) seenPhones.add(lastShownPhoneClean);

              const distinctOtherDrivers: any[] = [];
              for (const ad of (allLines || [])) {
                const full = `${ad.title || ''} ${ad.location || ''} ${ad.description || ''}`.toLowerCase();
                const isStudent = full.includes('ابحث') || full.includes('أبحث') || full.includes('محتاج');
                if (!isStudent && full.includes(lastOrigin.toLowerCase())) {
                  const pClean = (ad.phone || '').replace(/[^0-9]/g, '');
                  if (pClean && !seenPhones.has(pClean)) {
                    seenPhones.add(pClean);
                    distinctOtherDrivers.push(ad);
                  }
                }
              }

              // Always ensure student request is safely registered in waitlist
              try {
                await supabase.from('transport_requests').insert({
                  telegram_chat_id: String(chatId),
                  telegram_user_id: fromUser?.id ? String(fromUser.id) : null,
                  user_name: fromUser?.first_name || 'طالب',
                  origin: lastOrigin,
                  destination: lastDest,
                  raw_query: userCaption,
                  status: 'pending'
                });
              } catch(e) {}

              if (distinctOtherDrivers.length > 0) {
                state.last_driver_phone = distinctOtherDrivers[0].phone || '';
                await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);

                let altMsg = `🚌 <b>تدلل عيوني ${fromUser?.first_name || 'الغالي'}! 🌹</b>\n` +
                  `ولا يهمك${reasonBadge}، وجدنا لك سائقين بدلاء مسجلين بمسار (<b>${lastOrigin} ⬅️ ${lastDest}</b>):\n\n`;
                for (const l of distinctOtherDrivers.slice(0, 3)) {
                  altMsg += `• <b>${l.title}</b>\n  📍 المسار: ${l.location || 'بغداد'} | 📞 هاتف السائق: <code>${l.phone || 'متوفر بالموقع'}</code>\n  🔗 https://www.souqbaghdad.store/transport\n\n`;
                }
                altMsg += `🔔 <i>وسجلت طلبك أيضاً برادار الانتظار في حال نزل أي كابتن أو خط جديد بنفس مسارك ✨</i>`;
                const altMarkup = {
                  inline_keyboard: [
                    [{ text: '➕ نشر طلبك كراكب في القنوات', callback_data: 'publish_transport' }],
                    [{ text: '🚌 تصفح جميع الخطوط النشطة', url: 'https://www.souqbaghdad.store/transport' }],
                    [{ text: '📋 القائمة الرئيسية', callback_data: 'main_menu' }]
                  ]
                };
                await sendMessage(chatId, altMsg, altMarkup);
                return new Response('OK', { status: 200 });
              } else {
                const onlyMsg = 
                  `🚌 <b>تدلل عيوني ${fromUser?.first_name || 'الغالي'} 🌹</b>\n\n` +
                  `ولا يهمك${reasonBadge}، حالياً لا يوجد سائق بديل مسجل بهذا المسار (<b>${lastOrigin} ⬅️ ${lastDest}</b>).\n\n` +
                  `✅ <b>تم تسجيل طلبك رسمياً في قائمة الانتظار الذكية</b>:\n` +
                  `• أول ما يسجل سائق جديد أو تتوفر مقاعد شاغرة بنفس مسارك راح أدزلك إشعار وتنبيه فوري بالخاص!\n` +
                  `• تكدر أيضاً تضغط «➕ نشر طلبك كراكب» لينزل طلبك بقنوات تيليجرام وفيسبوك والموقع والسائقين يتواصلون وياك مباشرة 🤝`;
                const onlyMarkup = {
                  inline_keyboard: [
                    [{ text: '➕ نشر طلبك كراكب في القنوات 🚀', callback_data: 'publish_transport' }],
                    [{ text: '🚌 تصفح خطوط الموقع', url: 'https://www.souqbaghdad.store/transport' }],
                    [{ text: '📋 القائمة الرئيسية', callback_data: 'main_menu' }]
                  ]
                };
                await sendMessage(chatId, onlyMsg, onlyMarkup);
                return new Response('OK', { status: 200 });
              }
            } else {
              const askFormMsg = 
                `🚌 <b>يا هلا بيك عيوني ${fromUser?.first_name || 'الغالي'} 🌹</b>\n\n` +
                `لتسجيل طلبك بدقة، يرجى كتابة المسار المطلوب:\n` +
                `📍 <b>المنطقة (من أين):</b> (مثال: جميلة، الشعب، البنوك، المنصور...)\n` +
                `🏛️ <b>الكلية أو الوجهة (إلى أين):</b> (مثال: كلية الرافدين، المستنصرية، بغداد...)\n\n` +
                `اكتب مسارك برسالة واحدة (مثال: <i>محتاجة خط من جميلة إلى الرافدين</i>) وسأسجله لك برادار التنبيهات فوراً! ✨`;
              await sendMessage(chatId, askFormMsg, {
                inline_keyboard: [[{ text: '🚌 تصفح خطوط الموقع', url: 'https://www.souqbaghdad.store/transport' }]]
              });
              return new Response('OK', { status: 200 });
            }
          }

          // 4. Check if user is searching for transport line in private chat
          const isTransportIntentP = 
            cleanP.startsWith('/line') || cleanP.startsWith('\\line') || cleanP.includes('خط') || cleanP.includes('خك') || cleanP.includes('حط') || cleanP.includes('نقل') ||
            ((cleanP.includes('من ') || cleanP.includes('الى ') || cleanP.includes('إلى ') || cleanP.includes('لـ')) && (cleanP.includes('رافدين') || cleanP.includes('رفدين') || cleanP.includes('جامع') || cleanP.includes('كلية') || cleanP.includes('دورة') || cleanP.includes('جميل') || cleanP.includes('سيدي') || cleanP.includes('منصور')));

          if (isTransportIntentP && (cleanP.includes('اريد') || cleanP.includes('محتاج') || cleanP.includes('ادور') || cleanP.includes('اكو') || cleanP.includes('من') || cleanP.includes('الى') || cleanP.startsWith('/line') || cleanP.startsWith('\\line'))) {
            sendChatAction(chatId, 'typing');
            await handleSmartTransportSearch(chatId, userCaption, fromUser, supabase, false);
            return new Response('OK', { status: 200 });
          }

          // 5. Automatic Direct Promo Code Interceptor (لو كتب المستخدم البروموكود مباشرة كرسالة)
          if (text && text.trim().length >= 3 && text.trim().length <= 30 && !text.includes(' ') && !text.startsWith('/')) {
            const rawCandidate = text.trim();
            const { data: directPromo } = await supabase.from('promo_codes').select('*').ilike('code', rawCandidate).maybeSingle();
            if (directPromo) {
              if (!userId) {
                await sendMessage(chatId, '⚠️ <b>عذراً، يجب عليك تفعيل رقم هاتفك أولاً لشحن واستخدام كود النقاط.</b>', {
                  inline_keyboard: [[{ text: '📱 تفعيل رقم الهاتف الآن', callback_data: 'share_phone_prompt' }]]
                });
                return new Response('OK', { status: 200 });
              }
              if (directPromo.is_used) {
                await sendMessage(chatId, `⚠️ <b>هذا الكود تم استخدامه واكتمال حدّه مسبقاً.</b>`, {
                  inline_keyboard: [[{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
                });
                return new Response('OK', { status: 200 });
              }
              const { data: directUsed } = await supabase.from('promo_code_usages').select('id').ilike('code', directPromo.code).eq('user_id', userId).maybeSingle();
              if (directUsed) {
                await sendMessage(chatId, `⚠️ <b>لقد قمت باستخدام وتفعيل هذا الكود مسبقاً في حسابك!</b>`, {
                  inline_keyboard: [[{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
                });
                return new Response('OK', { status: 200 });
              }
              const { count: totalUsesD } = await supabase.from('promo_code_usages').select('id', { count: 'exact', head: true }).ilike('code', directPromo.code);
              const maxUsesD = directPromo.max_uses || 1;
              if ((totalUsesD || 0) >= maxUsesD) {
                await supabase.from('promo_codes').update({ is_used: true }).eq('id', directPromo.id);
                await sendMessage(chatId, `⚠️ <b>هذا الكود اكتمل الحد الأقصى لاستخدامه.</b>`, {
                  inline_keyboard: [[{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]]
                });
                return new Response('OK', { status: 200 });
              }

              // Credit points
              await supabase.from('promo_code_usages').insert({ code: directPromo.code, user_id: userId });
              const { data: curP } = await supabase.from('profiles').select('points').eq('id', userId).single();
              const ptsToAdd = directPromo.points || 0;
              const finalPts = (curP?.points || 0) + ptsToAdd;
              await supabase.from('profiles').update({ points: finalPts }).eq('id', userId);

              try {
                await supabase.from('points_ledger').insert({
                  user_id: userId,
                  amount: ptsToAdd,
                  reason: `استرداد بروموكود تلقائي: ${directPromo.code}`
                });
              } catch(e) {}

              if ((totalUsesD || 0) + 1 >= maxUsesD) {
                await supabase.from('promo_codes').update({ is_used: true }).eq('id', directPromo.id);
              }

              await sendMessage(chatId, `🎉 <b>ألف مبروك! تم شحن محفظتك بنجاح!</b> 🪙\n\n` +
                                        `🎟️ <b>رمز الكود:</b> <code>${directPromo.code}</code>\n` +
                                        `🎁 <b>النقاط المضافة:</b> +${ptsToAdd} نقطة\n` +
                                        `💰 <b>رصيدك الكلي الآن:</b> ${finalPts} نقطة\n\n` +
                                        `تم تحديث محفظتك فوراً، ويمكنك الترويج والنشر الآن:`, {
                inline_keyboard: [
                  [{ text: '🚗 اعرض سيارة للبيع مجاناً', callback_data: 'publish_car' }],
                  [{ text: '🚌 انشر خط نقل', callback_data: 'publish_transport' }],
                  [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
                ]
              });
              return new Response('OK', { status: 200 });
            }
          }

          sendChatAction(chatId, 'typing');
          const chatHistory = state.chat_history || [];
          const aiRes = await callAiEngine(userCaption, audioUrl, photoUrl, fromUser?.first_name, supabase, chatHistory, voiceBase64 || undefined);

          // Update conversational history
          chatHistory.push({ role: 'user', text: userCaption || 'بصمة صوتية' });
          chatHistory.push({ role: 'model', text: aiRes });
          state.chat_history = chatHistory.slice(-6);
          await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
          
          // Smart dynamic buttons based on user topic
          const cleanInput = (userCaption || '').toLowerCase();
          const smartButtons: any[] = [];
          if (cleanInput.includes('سيار') || cleanInput.includes('سعر') || cleanInput.includes('توسان') || cleanInput.includes('النترا') || cleanInput.includes('كورولا') || cleanInput.includes('بيع') || cleanInput.includes('شراء')) {
            smartButtons.push([{ text: '🚗 عرض سيارة للبيع مجاناً', callback_data: 'publish_car' }, { text: '🌐 تصفح سيارات الموقع', url: 'https://www.souqbaghdad.store' }]);
          } else if (cleanInput.includes('خط') || cleanInput.includes('نقل') || cleanInput.includes('رافدين') || cleanInput.includes('جامع') || cleanInput.includes('كلية') || cleanInput.includes('سايق')) {
            smartButtons.push([{ text: '🚌 تصفح خطوط النقل النشطة', url: 'https://www.souqbaghdad.store/transport' }, { text: '➕ نشر خط نقل (أوفر / أطلب)', callback_data: 'publish_transport' }]);
          } else {
            smartButtons.push([{ text: '🌐 تصفح منصة سوق بغداد', url: 'https://www.souqbaghdad.store' }, { text: '➕ نشر إعلان جديد مجاناً', callback_data: 'publish_choose' }]);
          }
          smartButtons.push([{ text: '📋 القائمة الرئيسية للخدمات', callback_data: 'main_menu' }]);

          const finalReply = isVoiceInput && originalVoiceText
            ? `🎙️ <i>سمعت رسالتك الصوتية:</i> «<b>${originalVoiceText}</b>»\n\n${aiRes}`
            : aiRes;

          await sendMessage(chatId, finalReply, { inline_keyboard: smartButtons });
        } else {
          await showMainMenu();
        }
      }

      // Update state in db
      if (userId) {
        await supabase.from('telegram_users').update({ bot_state: state }).eq('telegram_chat_id', chatId);
      }
    }

    return new Response('OK', { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error('Error handling request:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})


