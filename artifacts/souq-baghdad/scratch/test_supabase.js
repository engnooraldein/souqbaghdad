const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lyhqnccpudwgvexqinxa.supabase.co';
const supabaseAnonKey = 'sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Fetching ads...");
  const { data: ads, error: adsError } = await supabase.from('ads').select('*').limit(2);
  console.log("Ads:", ads ? ads.length : null, "Error:", adsError);

  console.log("Fetching products...");
  const { data: products, error: prodError } = await supabase.from('products').select('*').limit(2);
  console.log("Products:", products ? products.length : null, "Error:", prodError);
}

test();
