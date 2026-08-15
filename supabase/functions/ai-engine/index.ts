import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = (Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) ?? "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SYSTEM_PROMPT = `أنت المساعد الذكي الخبير والممثل الرسمي لمنصة "سوق بغداد" (سوق رقمي عراقي متكامل للسيارات، خطوط النقل، والمنتجات - موقعنا: https://www.souqbaghdad.store).
شخصيتك:
- تتحدث بلهجة عراقية بغدادية لطيفة ومحترمة وذكية جداً (مثل: تدلل عيوني، يا هلا بيك يالغالي، تأمر أمر، حياك الله، من عيوني).
- تجيب بذكاء ووضوح مع تزويد المستخدم بالأسعار والموديلات وأرقام الهواتف من قاعدة البيانات عند توفرها.
- تفهم كل استفسارات السيارات وخطوط النقل والمنتجات.`;

async function fetchDatabaseContext(queryText: string): Promise<string> {
  try {
    const clean = queryText.toLowerCase().trim();
    let adsContext = '';

    // 1. إذا طلب المستخدم آخر الإعلانات
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

    // 2. البحث عن سيارة محددة أو خط نقل
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

function getLocalIraqiFallback(text: string, isComment: boolean = false, dbContext: string = ''): string {
  if (dbContext) {
    return `يا هلا بيك عيوني! 🚗 بخصوص طلبك، هاي بعض الإعلانات المعروضة حالياً بالمنصة:\n${dbContext}\nوتكدر تشوف كل التفاصيل والصور من موقعنا: https://www.souqbaghdad.store`;
  }
  const clean = text.toLowerCase().trim();
  if (clean.includes("سعر") || clean.includes("بكم") || clean.includes("شكد") || clean.includes("بيش")) {
    return isComment 
      ? "أهلاً بك عيوني 🌹 التفاصيل والأسعار معروضة بالكامل، وتكدر تتواصل مباشرة مع البائع عبر موقعنا: https://www.souqbaghdad.store"
      : "يا هلا بيك يالغالي! تكدر تشوف كل الأسعار وتفاصيل الإعلانات والتواصل مع البائعين مباشرة من خلال منصتنا: https://www.souqbaghdad.store";
  }
  if (clean.includes("سيار") || clean.includes("ابيع") || clean.includes("أبيع") || clean.includes("اعرض")) {
    return "🚗 تدلل عيوني! تكدر تنشر سيارتك مجاناً وبدقائق عبر منصة سوق بغداد: https://www.souqbaghdad.store أو عبر بوت التليكرام @SouqBaghdad_bot وتوصل لآلاف المشترين فوراً.";
  }
  if (clean.includes("خط") || clean.includes("نقل") || clean.includes("جامع") || clean.includes("سايق")) {
    return "🚌 يا هلا بيك! عدنا قسم مخصص لخطوط نقل الجامعات والموظفين، تكدر تبحث عن خط أو تنشر خطك مجاناً عبر المنصة: https://www.souqbaghdad.store/transport";
  }
  if (clean.includes("رابط") || clean.includes("موقع") || clean.includes("لينك") || clean.includes("وين")) {
    return "تفضل رابط منصة سوق بغداد للتصفح والنشر المباشر: https://www.souqbaghdad.store 🌐 نورتنا يالغالي!";
  }
  if (clean.includes("متوفر") || clean.includes("موجود")) {
    return "نعم عيوني متوفر ✅ تكدر تطلع على كامل التفاصيل والتواصل مباشرة عبر المنصة: https://www.souqbaghdad.store";
  }
  return isComment
    ? "أهلاً بك في سوق بغداد 🇮🇶 نورتنا عيوني! للتفاصيل وزيارة المنصة: https://www.souqbaghdad.store"
    : "يا هلا بيك عيوني نورت سوق بغداد! 🇮🇶 شلون أقدر أساعدك بخصوص السيارات أو خطوط النقل أو المنتجات؟";
}

async function generateAIResponse(prompt: string, userText: string, isComment: boolean = false, imageUrl?: string): Promise<string> {
  const dbContext = await fetchDatabaseContext(userText);
  const fullInstruction = `${SYSTEM_PROMPT}\n\n${dbContext ? `معلومات حقيقية من قاعدة بيانات سوق بغداد:\n${dbContext}\n` : ''}`;

  // 1. Google Gemini
  if (GEMINI_API_KEY) {
    try {
      const parts: any[] = [];
      if (userText) parts.push({ text: `${prompt}\n\nنص المستخدم: "${userText}"` });

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
            parts.push({ text: "حلل هذه الصورة أو السكرين شوت واستخرج تفاصيل السيارة ورقم الهاتف أو الإعلان." });
          }
        } catch (e) {
          console.error("Image processing error:", e);
        }
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
        if (candidate) return candidate.replace(/[*#]/g, '');
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
    const { action, platform, sender_id, text, image_url } = await req.json();

    if (action === "process_message") {
      const userText = (text || "").trim();
      let prompt = "رسالة خاصة من مستخدم في المحادثة.";

      const aiReply = await generateAIResponse(prompt, userText, false, image_url);

      if (sender_id && platform) {
        try {
          await supabase.from("bot_conversations").upsert({
            platform,
            sender_id,
            last_message: userText,
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
