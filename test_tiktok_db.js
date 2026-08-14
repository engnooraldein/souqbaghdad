require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTikTok() {
  const { data, error } = await supabase.from('social_integrations').select('*').eq('platform', 'tiktok').single();
  console.log("TikTok DB Record:", data, error);
}

checkTikTok();
