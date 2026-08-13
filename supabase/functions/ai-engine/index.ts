import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = (Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) ?? "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SYSTEM_PROMPT = `
أنت "موظف رقمي احترافي" وسفير الذكاء الاصطناعي لمنصة "سوق بغداد" (souqbaghdad.store).
شخصيتك:
- ودود، خدوم، محترف، وتتحدث باللهجة العراقية اللطيفة والمفهومة (أو الفصحى إذا طلب المستخدم).
- تسعى دائماً لمساعدة المستخدم سواء كان مشترياً يبحث عن منتج/سيارة/عقار/خط نقل، أو بائعاً يريد نشر إعلان، أو مستخدماً يحتاج دعماً فنياً.
- تفهم الأخطاء الإملائية مثل ("تلفن" -> "تلفون", "سياره" -> "سيارة", "اريد" -> "أريد").

وظائفك الرئيسية:
1. فهم نية المستخدم:
   - هل يبحث عن شراء منتج مع ميزانية أو بدونها؟
   - هل يريد نشر إعلان؟
   - هل يواجه مشكلة ويريد رفع شكوى للأدمن؟
   - هل يستفسر عن النقاط أو الحساب؟
2. إذا تم استخراج نية بحث، حدد الأوصاف التالية إن وجدت:
   - query: الكلمة المفتاحية للبحث
   - max_price: السعر الأقصى بالدينار العراقي (مثلاً 400 الف = 400000)
   - category: الفئة (سيارات، إلكترونيات، عقارات، خدمات، transport...)
3. استجب دائماً بإجابة جذابة ومنسقة تحتوي على إيموجيات عراقية ومناسبة.
`;

serve(async (req) => {
  try {
    const { action, platform, sender_id, text, image_url, audio_url } = await req.json();

    if (action === "process_message") {
      // 1. استرجاع أو إنشاء سياق المحادثة
      let { data: conv } = await supabase
        .from("bot_conversations")
        .select("*")
        .eq("platform", platform)
        .eq("sender_id", sender_id)
        .maybeSingle();

      if (!conv) {
        const { data: newConv } = await supabase
          .from("bot_conversations")
          .insert({ platform, sender_id, context: { history: [] } })
          .select()
          .single();
        conv = newConv;
      }

      let userQueryText = text || "";

      // 2. تحليل الصورة بـ Gemini Vision إن وجدت
      if (image_url && GEMINI_API_KEY) {
        try {
          const imgAnalysisRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [
                      { text: "تعرف على هذا المنتج واكتب اسمه وفئته باللغة العربية باختصار شديد للبحث عنه في المتاجر." },
                      { image_url: image_url }
                    ]
                  }
                ]
              })
            }
          );
          const imgData = await imgAnalysisRes.json();
          const detectedName = imgData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (detectedName) {
            userQueryText += ` (صورة منتج: ${detectedName})`;
          }
        } catch (e) {
          console.error("Error analyzing image:", e);
        }
      }

      // 3. تحليل النية ورغبة البحث بواسطة Gemini
      let geminiReply = "";
      let parsedIntent: any = { type: "chat", query: "", max_price: null, category: null };

      if (GEMINI_API_KEY) {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `${SYSTEM_PROMPT}\n\nرسالة المستخدم الحالية: "${userQueryText}"\n\nقم بالتحليل ورد بصيغة JSON تحتوي على:\n1. reply: الرد المباشر باللهجة العراقية.\n2. intent: نوع النية ('search', 'sell', 'support', 'points', 'chat')\n3. search_params: { query, max_price, category } (إذا كان نوع النية search)\n4. is_complaint: true/false`
                    }
                  ]
                }
              ],
              generationConfig: { response_mime_type: "application/json" }
            })
          }
        );

        const geminiData = await geminiRes.json();
        const jsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          try {
            const parsed = JSON.parse(jsonText);
            geminiReply = parsed.reply;
            parsedIntent = parsed;
          } catch (e) {
            geminiReply = "أهلاً بك عيوني! شلون أقدر أساعدك اليوم؟";
          }
        }
      } else {
        geminiReply = "أهلاً بك في سوق بغداد! كيف يمكنني مساعدتك اليوم؟";
      }

      // 4. تنفيذ البحث في قاعدة البيانات إذا كانت النية search
      let searchResults: any[] = [];
      if (parsedIntent.intent === "search" || parsedIntent.search_params?.query) {
        const q = parsedIntent.search_params?.query || userQueryText;
        let queryBuilder = supabase.from("ads").select("*").eq("status", "active");

        if (parsedIntent.search_params?.max_price) {
          queryBuilder = queryBuilder.lte("price", parsedIntent.search_params.max_price);
        }

        if (q) {
          queryBuilder = queryBuilder.ilike("title", `%${q}%`);
        }

        const { data: ads } = await queryBuilder.limit(3);
        searchResults = ads || [];
      }

      // 5. التحديث الحفظ في سياق المحادثة
      const updatedHistory = [
        ...(conv?.context?.history || []).slice(-10),
        { role: "user", message: userQueryText },
        { role: "bot", message: geminiReply }
      ];

      await supabase
        .from("bot_conversations")
        .update({
          last_message: userQueryText,
          last_reply: geminiReply,
          context: { ...conv?.context, history: updatedHistory },
          updated_at: new Date().toISOString()
        })
        .eq("id", conv.id);

      return new Response(
        JSON.stringify({
          reply: geminiReply,
          intent: parsedIntent,
          searchResults: searchResults
        }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
  } catch (error: any) {
    console.error("AI Engine error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
