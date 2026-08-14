import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const URL = "https://lyhqnccpudwgvexqinxa.supabase.co";
const KEY = "sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf";
const supabase = createClient(URL, KEY);

async function checkTikTok() {
  const { data: integrations, error } = await supabase
    .from('social_integrations')
    .select('access_token')
    .eq('platform', 'tiktok')
    .single();

  if (error || !integrations) {
    console.error("No token found:", error);
    return;
  }

  const access_token = integrations.access_token;
  console.log("Got access token");

  const payload = {
    post_info: {
      title: "إعلان تجريبي - تيك توك",
      description: "هذا الإعلان لتجربة النشر التلقائي عبر تيك توك. يرجى التجاهل.",
      privacy_level: "PUBLIC_TO_EVERYONE",
      disable_comment: false
    },
    source_info: {
      source: "PULL_FROM_URL",
      photo_cover_index: 0,
      photo_images: ["https://souqbaghdad.store/opengraph.jpg"]
    },
    post_mode: "DIRECT_POST",
    media_type: "PHOTO"
  };

  const res = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json; charset=UTF-8'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log("INIT Response:", data);

  if (data.data && data.data.publish_id) {
     const publish_id = data.data.publish_id;
     console.log("Waiting 5 seconds to check status for", publish_id);
     await new Promise(r => setTimeout(r, 5000));
     
     const statusRes = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${access_token}`,
         'Content-Type': 'application/json; charset=UTF-8'
       },
       body: JSON.stringify({ publish_id })
     });
     
     const statusData = await statusRes.json();
     console.log("STATUS Response:", JSON.stringify(statusData, null, 2));
  }
}

checkTikTok();
