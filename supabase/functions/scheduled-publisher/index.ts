// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

// Meta credentials
const META_PAGE_ID = Deno.env.get("META_PAGE_ID")!;
const META_PAGE_ACCESS_TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN")!;
const META_IG_ACCOUNT_ID = Deno.env.get("META_IG_ACCOUNT_ID")!;
const ALRAFDAIN_FB_PAGE_ID = Deno.env.get("ALRAFDAIN_FB_PAGE_ID") || "102975411515668";
const ALRAFDAIN_FB_TOKEN = Deno.env.get("ALRAFDAIN_FB_TOKEN")!;
const ALRAFDAIN_IG_ID = Deno.env.get("ALRAFDAIN_IG_ID") || "17841404181680155";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Helpers ──────────────────────────────────────────────────────────────────

async function tgSend(chatId: string, text: string, extra?: any) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
}

async function postFbStory(imageUrl: string, pageId: string, token: string) {
  const r = await fetch(
    `https://graph.facebook.com/v20.0/${pageId}/photo_stories`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: imageUrl, access_token: token }),
    }
  );
  return r.json();
}

async function postFbFeed(caption: string, imageUrl: string, pageId: string, token: string) {
  const r = await fetch(
    `https://graph.facebook.com/v20.0/${pageId}/photos`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: imageUrl, caption, access_token: token }),
    }
  );
  return r.json();
}

async function postIgStory(imageUrl: string, igId: string, token: string) {
  // Step 1: create container
  const c = await fetch(
    `https://graph.facebook.com/v20.0/${igId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, media_type: "IMAGE", is_stories: true, access_token: token }),
    }
  ).then(r => r.json());
  if (!c.id) return { error: c };
  // Step 2: publish
  const p = await fetch(
    `https://graph.facebook.com/v20.0/${igId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: c.id, access_token: token }),
    }
  ).then(r => r.json());
  return p;
}

function buildStoryUrl(ad: any): string {
  const base = "https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image";
  const p = new URLSearchParams({
    type: "story",
    title: ad.title || "",
    regions: ad.location || "",
    destination: ad.city || ad.destination || "",
    fare: String(ad.price || ""),
    short_id: ad.short_id || ad.id,
    phone: ad.phone || "",
    category: ad.category || "",
  });
  return `${base}?${p.toString()}`;
}

function buildPostUrl(ad: any): string {
  const base = "https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/generate-story-image";
  const p = new URLSearchParams({
    type: "post",
    title: ad.title || "",
    regions: ad.location || "",
    destination: ad.city || ad.destination || "",
    fare: String(ad.price || ""),
    short_id: ad.short_id || ad.id,
    phone: ad.phone || "",
    category: ad.category || "",
  });
  return `${base}?${p.toString()}`;
}

function caption(ad: any): string {
  const link = `https://www.souqbaghdad.store/${ad.category === 'transport' ? 'ad' : 'product'}/${ad.short_id || ad.id}`;
  if (ad.category === "transport") {
    return `🚌 خط نقل: ${ad.location || ""} ← ${ad.city || ""}\n💰 الأجرة: ${ad.price || ""}\n📞 ${ad.phone || ""}\n🔗 ${link}`;
  }
  return `${ad.title || ""}\n💰 ${ad.price || ""}\n📞 ${ad.phone || ""}\n🔗 ${link}`;
}

// ── Main publisher ────────────────────────────────────────────────────────────

async function publishAdToTargets(ad: any, job: any): Promise<{ ok: boolean; isRateLimit: boolean; error?: string }> {
  const publishType = job.publish_type; // 'story' | 'post' | 'both'
  const targetPage = job.target_page;   // 'rafdain_fb' | 'rafdain_ig' | 'souq_fb' | 'souq_ig' | 'all'
  const isTransport = ad.category === "transport";

  const storyImg = buildStoryUrl(ad);
  const postImg = buildPostUrl(ad);
  const cap = caption(ad);

  const wantStory = publishType === "story" || publishType === "both";
  const wantPost = publishType === "post" || publishType === "both";

  try {
    // ── الرافدين فيسبوك ──────────────────────────
    if (targetPage === "rafdain_fb" || targetPage === "all") {
      if (isTransport || !isTransport) { // كل الإعلانات
        if (wantPost) {
          const r = await postFbFeed(cap, postImg, ALRAFDAIN_FB_PAGE_ID, ALRAFDAIN_FB_TOKEN);
          if (r?.error?.code === 32 || r?.error?.code === 4) return { ok: false, isRateLimit: true, error: JSON.stringify(r.error) };
        }
        if (wantStory) {
          await postFbStory(storyImg, ALRAFDAIN_FB_PAGE_ID, ALRAFDAIN_FB_TOKEN);
        }
      }
    }

    // ── الرافدين انستغرام ─────────────────────────
    if (targetPage === "rafdain_ig" || targetPage === "all") {
      if (wantStory) {
        const r = await postIgStory(storyImg, ALRAFDAIN_IG_ID, ALRAFDAIN_FB_TOKEN);
        if (r?.error?.code === 32 || r?.error?.code === 4) return { ok: false, isRateLimit: true, error: JSON.stringify(r.error) };
      }
    }

    // ── سوق بغداد فيسبوك ─────────────────────────
    if (targetPage === "souq_fb" || targetPage === "all") {
      if (isTransport) {
        // خطوط: ستوري فقط على سوق بغداد
        if (wantStory) await postFbStory(storyImg, META_PAGE_ID, META_PAGE_ACCESS_TOKEN);
      } else {
        if (wantPost) await postFbFeed(cap, postImg, META_PAGE_ID, META_PAGE_ACCESS_TOKEN);
        if (wantStory) await postFbStory(storyImg, META_PAGE_ID, META_PAGE_ACCESS_TOKEN);
      }
    }

    // ── سوق بغداد انستغرام ───────────────────────
    if (targetPage === "souq_ig" || targetPage === "all") {
      if (isTransport) {
        // خطوط: ستوري فقط على سوق بغداد
        if (wantStory) await postIgStory(storyImg, META_IG_ACCOUNT_ID, META_PAGE_ACCESS_TOKEN);
      } else {
        if (wantStory) await postIgStory(storyImg, META_IG_ACCOUNT_ID, META_PAGE_ACCESS_TOKEN);
      }
    }

    return { ok: true, isRateLimit: false };
  } catch (err: any) {
    const msg = String(err?.message || err);
    const isRateLimit = msg.includes("429") || msg.includes("rate") || msg.includes("spam");
    return { ok: false, isRateLimit, error: msg };
  }
}

// ── Entry Point ───────────────────────────────────────────────────────────────

serve(async (req) => {
  try {
    const now = new Date().toISOString();

    // 1. جلب أول عنصر pending / retry جاهز
    const { data: item, error: qErr } = await supabase
      .from("bulk_publish_queue")
      .select("*, bulk_publish_jobs(*)")
      .or(`status.eq.pending,and(status.eq.retry,retry_after.lte.${now})`)
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (qErr || !item) {
      return new Response("no pending items", { status: 200 });
    }

    const job = item.bulk_publish_jobs;

    // 2. تحقق أن الجلسة لا تزال running
    if (!job || job.status !== "running") {
      await supabase.from("bulk_publish_queue").update({ status: "skipped" }).eq("id", item.id);
      return new Response("job stopped", { status: 200 });
    }

    // 3. جلب بيانات الإعلان
    const { data: ad } = await supabase.from("ads").select("*").eq("id", item.ad_id).maybeSingle();

    if (!ad || ad.status !== "active") {
      // الإعلان غير نشط → تخطي
      await supabase.from("bulk_publish_queue").update({ status: "skipped", attempted_at: now }).eq("id", item.id);
      await supabase.from("bulk_publish_jobs").update({ skipped_count: (job.skipped_count || 0) + 1 }).eq("id", job.id);
    } else {
      // 4. حماية من التكرار: إذا نُشر منذ أقل من 6 ساعات
      const lastBoosted = ad.last_boosted_at || ad.sync_status?.last_social_publish_at;
      if (lastBoosted) {
        const hoursAgo = (Date.now() - new Date(lastBoosted).getTime()) / 3600000;
        if (hoursAgo < 6) {
          await supabase.from("bulk_publish_queue").update({ status: "skipped", attempted_at: now, error_msg: "نُشر مؤخراً" }).eq("id", item.id);
          await supabase.from("bulk_publish_jobs").update({ skipped_count: (job.skipped_count || 0) + 1 }).eq("id", job.id);

          // تحقق إذا انتهت القائمة
          await checkJobCompletion(job);
          return new Response("skipped (too recent)", { status: 200 });
        }
      }

      // 5. النشر الفعلي
      const result = await publishAdToTargets(ad, job);
      await supabase.from("bulk_publish_queue").update({
        status: result.ok ? "done" : (result.isRateLimit ? "retry" : "failed"),
        attempted_at: now,
        retry_after: result.isRateLimit ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null,
        error_msg: result.error || null,
      }).eq("id", item.id);

      // تحديث عداد الجلسة
      if (result.ok) {
        await supabase.from("bulk_publish_jobs").update({
          published_count: (job.published_count || 0) + 1,
          "sync_status->>last_social_publish_at": now,
        }).eq("id", job.id);
        // تحديث آخر نشر للإعلان
        await supabase.from("ads").update({ last_boosted_at: now }).eq("id", ad.id);
      } else if (!result.isRateLimit) {
        await supabase.from("bulk_publish_jobs").update({ failed_count: (job.failed_count || 0) + 1 }).eq("id", job.id);
      }
    }

    // 6. تحقق إذا انتهت القائمة → أرسل تقرير نهائي
    await checkJobCompletion(job);

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("[scheduled-publisher] Error:", e);
    return new Response("error", { status: 500 });
  }
});

async function checkJobCompletion(job: any) {
  const { count } = await supabase
    .from("bulk_publish_queue")
    .select("*", { count: "exact", head: true })
    .eq("job_id", job.id)
    .in("status", ["pending", "retry"]);

  if ((count || 0) === 0) {
    // كل الإعلانات انتهت
    const finishedAt = new Date().toISOString();
    await supabase.from("bulk_publish_jobs").update({ status: "done", finished_at: finishedAt }).eq("id", job.id);

    // إعادة جلب الأرقام المحدّثة
    const { data: finalJob } = await supabase.from("bulk_publish_jobs").select("*").eq("id", job.id).maybeSingle();

    const typeLabel = finalJob?.publish_type === "story" ? "ستوري فقط" : finalJob?.publish_type === "post" ? "بوست فقط" : "بوست + ستوري";
    const pageLabel = finalJob?.target_page === "all" ? "جميع الصفحات" :
      finalJob?.target_page === "rafdain_fb" ? "الرافدين فيسبوك" :
      finalJob?.target_page === "rafdain_ig" ? "الرافدين انستغرام" :
      finalJob?.target_page === "souq_fb" ? "سوق بغداد فيسبوك" : "سوق بغداد انستغرام";

    const endTime = new Date(finalJob?.finished_at).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });

    const report =
      `📊 <b>تقرير النشر الجماعي — اكتمل ✅</b>\n\n` +
      `الفئة: ${finalJob?.category === "all" ? "جميع الفئات" : finalJob?.category} | النوع: ${typeLabel}\n` +
      `الصفحة: ${pageLabel}\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `✅ نُشر بنجاح:  ${finalJob?.published_count || 0} إعلان\n` +
      `❌ فشل:          ${finalJob?.failed_count || 0} إعلان\n` +
      `⏭️ تخطّى:        ${finalJob?.skipped_count || 0} إعلان\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `📅 انتهى: ${endTime}`;

    await tgSend(finalJob?.owner_chat_id, report);
  }
}
