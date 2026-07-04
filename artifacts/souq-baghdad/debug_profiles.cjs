const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://lyhqnccpudwgvexqinxa.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.from('profiles').select('*').eq('phone', '07700028170');
  console.log("PROFILES:", data);
  fs.writeFileSync('debug_profiles.json', JSON.stringify({data, error}, null, 2));
}

main();
