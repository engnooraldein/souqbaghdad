import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = (Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) ?? "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SYSTEM_PROMPT = `أنت المساعد والموظف الذكي الرسمي لمنصة "سوق بغداد" (سوق العراق الرقمي المفتوح للسيارات، خطوط النقل، والمنتجات - موقعنا: https://www.souqbaghdad.store).

🎯 هويتك وأسلوبك:
- تتصرف كموظف خدمة عملاء ومبيعات عراقي بغدادي محترف، فطن، وودود جداً (تستخدم كلمات مثل: تدلل عيوني، يا هلا بيك يالغالي، تأمر أمر، نورتنا، خادمك).
- تفهم سياق كلام الزبون بدقة وتجيب على سؤاله تحديداً بدون تكرار رسائل الترحيب إذا كان الزبون يسأل عن شيء محدد.
- إذا طلب الزبون "رابط البوت" أو "البوت": أعطه رابط ومعرف بوت التليكرام الرسمي: https://t.me/souqbaghda_bot والمعرف @souqbaghda_bot.
- إذا كتب الزبون "سيارات" أو "سيارة" أو "اريد سيارة": اسأله عن الموديل والميزانية أو اعرض عليه أحدث السيارات وروابطها من المنصة.
- إذا كتب الزبون "نشر" أو "اريد ابيع": أعطه رابط النشر المباشر: https://www.souqbaghdad.store/post-ad وأخبره أنه مجاني وسريع.
- إذا كتب الزبون "خطوط" أو "نقل": أعطه رابط قسم النقل: https://www.souqbaghdad.store/transport.
- لا تكرر إرسال الرابط الرئيسي إذا كان طلب الزبون خاصاً (مثل رابط البوت أو إعلان معين).
- اجعل ردودك مختصرة، لبقة، ومباشرة في صلب الموضوع مع الروابط الدقيقة.`;

async function fetchDatabaseContext(queryText: string): Promise<string> {
  try {
    const clean = queryText.toLowerCase().trim();
    let adsContext = '';

    // 1. إذا طلب المستخدم آخر الإعلانات أو سيارات أو خطوط
    if (clean.includes('اخر') || clean.includes('اخير') || clean.includes('أحدث') || clean.includes('جديد') || clean.includes('شنو نزل') || clean.includes('اعلانات') || clean.includes('سيار') || clean.includes('خط')) {
      const { data: latestAds } = await supabase
        .from('ads')
        .select('title, price, year, location, city, phone, short_id, category, type, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(4);

      if (latestAds && latestAds.length > 0) {
        adsContext += `\n[إعلانات حية معروضة حالياً بالمنصة]:\n`;
        latestAds.forEach((ad, i) => {
          adsContext += `${i + 1}. ${ad.title} (موديل: ${ad.year || 'غير محدد'}) | السعر: ${ad.price} | الموقع: ${ad.city || ad.location || 'بغداد'} | رقم هاتف البائع: ${ad.phone || 'تواصل عبر الموقع'} | رقم الإعلان: #${ad.short_id || ad.title} | الرابط: https://www.souqbaghdad.store/product/${ad.short_id}\n`;
        });
      }
    }

    // 2. البحث عن سيارة محددة أو خط نقل أو سلعة
    const keywords = queryText.replace(/[\?\؟\!\,]/g, '').trim().split(/\s+/).filter(w => w.length >= 2 && !['شنو', 'اكو', 'عندكم', 'ناشرين', 'اريد', 'أريد', 'ادور', 'أدور', 'شكد', 'بكم', 'سعر', 'هل', 'منو', 'على', 'في', 'عن', 'رابط'].includes(w));
    
    if (keywords.length > 0) {
      const searchTerms = keywords.slice(0, 3);
      let query = supabase.from('ads').select('title, price, year, location, city, phone, short_id, category, description, created_at').eq('status', 'active');
      
      const orConditions = searchTerms.map(t => `title.ilike.%${t}%,description.ilike.%${t}%,location.ilike.%${t}%`).join(',');
      const { data: searchAds } = await query.or(orConditions).order('created_at', { ascending: false }).limit(4);

      if (searchAds && searchAds.length > 0) {
        adsContext += `\n[إعلانات مطابقة لبحث الزبون]:\n`;
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

function getLocalIraqiFallback(text: string, isComment: boolean = false, dbContext: string = ''): string {
  if (dbContext) {
    return `يا هلا بيك عيوني! 🚗 بخصوص طلبك، هاي بعض الإعلانات المعروضة حالياً بالمنصة:\n${dbContext}\nوتكدر تشوف كل التفاصيل والصور من موقعنا: https://www.souqbaghdad.store`;
  }
  const clean = (text || "").toLowerCase().trim();

  // 1. طلب رابط البوت
  if (clean.includes("بوت") || clean.includes("تليكرام") || clean.includes("تيليجرام") || clean.includes("تليجرام") || clean.includes("تلي")) {
    return `🤖 تفضل عيوني، هذا الرابط المباشر لبوت سوق بغداد على التيليكرام:
👉 https://t.me/souqbaghda_bot
المعرف: @souqbaghda_bot
تكدر من خلاله تتصفح وتنشر إعلاناتك بكل سهولة وبشكل مجاني 🌹`;
  }

  // 2. نية النشر أو العرض أو البيع
  if (clean.includes("نشر") || clean.includes("انشر") || clean.includes("أنشر") || clean.includes("ابيع") || clean.includes("أبيع") || clean.includes("اعرض") || clean.includes("أعرض") || clean.includes("اعلان") || clean.includes("إعلان")) {
    return `🚗 تدلل عيوني! تكدر تنشر إعلانك (سيارة، خط نقل، أو منتج) مجاناً وبأقل من دقيقة:
🔗 رابط النشر المباشر عبر الموقع: https://www.souqbaghdad.store/post-ad
🤖 أو تكدر تنشر مباشرة عبر بوت التليكرام: @souqbaghda_bot`;
  }

  // 3. الاستفسار عن السيارات
  if (clean.includes("سيار") || clean.includes("سياره") || clean.includes("سيارات")) {
    return `🚗 يا هلا بيك يالغالي! عدنا قسم كامل للسيارات المعروضة للبيع في بغداد والعراق.
تكدر تتصفح أحدث السيارات وأسعارها وأرقام هواتف أصحابها من هنا:
🔗 https://www.souqbaghdad.store
أو اكتبلي نوع السيارة والموديل اللي تدور عليه واني أساعدك من عيوني 🌹`;
  }

  // 4. الاستفسار عن الأسعار
  if (clean.includes("سعر") || clean.includes("بكم") || clean.includes("شكد") || clean.includes("بيش") || clean.includes("السعر") || clean.includes("فلوس") || clean.includes("قسط")) {
    return isComment 
      ? "أهلاً بك عيوني 🌹 التفاصيل والأسعار معروضة بالكامل، وتكدر تتواصل مباشرة مع البائع عبر موقعنا: https://www.souqbaghdad.store"
      : "يا هلا بيك يالغالي! تكدر تشوف كل الأسعار الحية وتفاصيل الإعلانات وأرقام هواتف البائعين مباشرة من خلال منصتنا: https://www.souqbaghdad.store";
  }

  // 5. خطوط النقل والتوصيل للجامعات والموظفين
  if (clean.includes("خط") || clean.includes("نقل") || clean.includes("جامع") || clean.includes("سايق") || clean.includes("طالب") || clean.includes("كوسية") || clean.includes("رافدين") || clean.includes("دجلة") || clean.includes("بغداد")) {
    return "🚌 يا هلا بيك! عدنا قسم كامل مخصص لخطوط نقل الجامعات والمدارس والموظفين ببغداد، تكدر تبحث عن خط أو تنشر خطك كسايق مجاناً عبر الرابط:\nhttps://www.souqbaghdad.store/transport";
  }

  // 6. طلب الروابط العامة للموقع
  if (clean.includes("رابط") || clean.includes("موقع") || clean.includes("لينك") || clean.includes("وين") || clean.includes("عنوان") || clean.includes("صفحة")) {
    return "تفضل رابط منصة سوق بغداد للتصفح المباشر ونشر الإعلانات مجاناً: https://www.souqbaghdad.store 🌐 نورتنا يالغالي!";
  }

  // 7. الاستفسار عن التوفر
  if (clean.includes("متوفر") || clean.includes("موجود") || clean.includes("بعده") || clean.includes("اكو")) {
    return "نعم عيوني متوفر ✅ تكدر تطلع على كامل التفاصيل والتواصل مباشرة مع صاحب الإعلان عبر المنصة: https://www.souqbaghdad.store";
  }

  // 8. التحيات
  if (clean.includes("مرحبا") || clean.includes("مرحباً") || clean.includes("هلو") || clean.includes("سلام") || clean.includes("السلام") || clean.includes("مساء") || clean.includes("صباح")) {
    return isComment
      ? "أهلاً بك عيوني 🇮🇶 نورتنا في سوق بغداد! تفضل بزيارة المنصة: https://www.souqbaghdad.store"
      : "يا هلا وكل الهلا بيك عيوني! نورت سوق بغداد 🇮🇶\nشلون أقدر أخدمك اليوم؟\n1️⃣ تبحث عن سيارة أو خط نقل أو منتج؟\n2️⃣ تحب تنشر إعلانك مجاناً وبسرعة؟\n(اكتبلي طلبك وتدلل من عيوني 🌹)";
  }

  return isComment
    ? "أهلاً بك في سوق بغداد 🇮🇶 نورتنا عيوني! للتفاصيل وزيارة المنصة: https://www.souqbaghdad.store"
    : "يا هلا بيك عيوني نورت سوق بغداد! 🇮🇶 اكتبلي شنو طلبك (شراء، بيع، خط نقل، أو نشر إعلان) وحاضر أساعدك فوراً.";
}

async function generateAIResponse(prompt: string, userText: string, isComment: boolean = false, imageUrl?: string, audioUrl?: string): Promise<string> {
  const dbContext = await fetchDatabaseContext(userText);
  const fullInstruction = `${SYSTEM_PROMPT}

${dbContext ? `معلومات حقيقية ومحدثة من قاعدة بيانات سوق بغداد:\n${dbContext}\n` : ''}`;

  // 1. Google Gemini (2.0 Flash with 1.5 Flash fallback)
  if (GEMINI_API_KEY) {
    try {
      const parts: any[] = [];
      if (userText) parts.push({ text: `${prompt}\n\nرسالة الزبون: "${userText}"` });

      // معالجة الصور
      if (imageUrl) {
        try {
          const imgRes = await fetch(imageUrl);
          const mimeType = imgRes.headers.get("content-type") || "image/jpeg";
          const arrayBuffer = await imgRes.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binaryString = "";
          const chunkSize = 8192;
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            binaryString += String.fromCharCode.apply(null, Array.from(uint8Array.slice(i, i + chunkSize)));
          }
          parts.push({
            inlineData: { mimeType, data: btoa(binaryString) }
          });
          if (!userText) {
            parts.push({ text: "حلل هذه الصورة واستخرج تفاصيل السيارة أو المنتج وأجب الزبون بدقة بلهجة عراقية لطيفة." });
          }
        } catch (e) {
          console.error("Image processing error:", e);
        }
      }

      // معالجة البصمات والملفات الصوتية
      if (audioUrl) {
        try {
          const audioRes = await fetch(audioUrl);
          const mimeType = audioRes.headers.get("content-type") || "audio/mp4";
          const arrayBuffer = await audioRes.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binaryString = "";
          const chunkSize = 8192;
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            binaryString += String.fromCharCode.apply(null, Array.from(uint8Array.slice(i, i + chunkSize)));
          }
          parts.push({
            inlineData: { mimeType, data: btoa(binaryString) }
          });
          parts.push({ text: "استمع للبصمة الصوتية للزبون وافهم طلبه العراقي بدقة، ثم أجب عليه كأفضل موظف مبيعات وخدمة عملاء." });
        } catch (e) {
          console.error("Audio processing error:", e);
        }
      }

      // محاولة استدعاء gemini-2.0-flash أولاً ثم gemini-1.5-flash
      const geminiModels = ["gemini-2.0-flash", "gemini-1.5-flash"];
      for (const model of geminiModels) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts }],
                systemInstruction: { parts: [{ text: fullInstruction }] }
              })
            }
          );
          if (res.ok) {
            const data = await res.json();
            const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (candidate && candidate.length > 0) return candidate.replace(/[*#]/g, '');
          }
        } catch(err) {
          console.error(`Gemini model ${model} error:`, err);
        }
      }
    } catch (e) {
      console.error("Gemini call exception:", e);
    }
  }

  // 2. OpenAI Fallback
  if (OPENAI_API_KEY && userText) {
    try {
      const oRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: fullInstruction },
            { role: "user", content: `${prompt}\n\nنص المستخدم: "${userText}"` }
          ],
          max_tokens: 350,
          temperature: 0.7
        })
      });
      if (oRes.ok) {
        const oData = await oRes.json();
        const oText = oData.choices?.[0]?.message?.content?.trim();
        if (oText) return oText.replace(/[*#]/g, '');
      }
    } catch (e) {
      console.error("OpenAI call exception:", e);
    }
  }

  // 3. Local Fallback
  return getLocalIraqiFallback(userText, isComment, dbContext);
}

serve(async (req) => {
  try {
    const { action, platform, sender_id, text, image_url, audio_url } = await req.json();

    if (action === "process_message") {
      const userText = (text || "").trim();
      let prompt = "رسالة خاصة من زبون أو متابع في المحادثة.";

      const aiReply = await generateAIResponse(prompt, userText, false, image_url, audio_url);

      if (sender_id && platform) {
        try {
          await supabase.from("bot_conversations").upsert({
            platform,
            sender_id,
            last_message: userText || (audio_url ? "[تسجيل صوتي]" : "[صورة]"),
            last_reply: aiReply,
            updated_at: new Date().toISOString()
          });
        } catch(e) {}
      }

      return new Response(
        JSON.stringify({ reply: aiReply }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (action === "process_comment") {
      const commentText = (text || "").trim();
      const prompt = `هذا تعليق من متابع على منشور في صفحتنا على مواقع التواصل.
قواعد الرد على التعليق:
1. أجب بلهجة عراقية بغدادية لطيفة ومحترمة وذكية جداً (مثل: تدلل عيوني، يا هلا بيك يالغالي، نورتنا).
2. إذا كان المتابع يسأل عن السعر أو الرابط أو رقم الهاتف أو التفاصيل أو سيارة معينة:
   - أجب علناً في التعليق وأخبره أنك أرسلت له رابط الإعلان وكافة التفاصيل على الخاص 📩 (مثال: "تدلل عيوني 🌹 دزيتلك رابط الإعلان وكامل التفاصيل على الخاص 📩 وتكدر تتصفح منصة سوق بغداد مباشرة: https://www.souqbaghdad.store").
3. إذا كان تعليق ترحيب أو تشجيع:
   - رحب به بلطف وشجعه على متابعة المنصة.
4. اجعل الرد مختصراً في سطرين ولبقاً.`;

      const commentReply = await generateAIResponse(prompt, commentText, true);

      return new Response(
        JSON.stringify({ reply: commentReply }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
  } catch (error: any) {
    console.error("AI Engine error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
