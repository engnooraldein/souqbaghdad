import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lyhqnccpudwgvexqinxa.supabase.co',
  'sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf'
);

async function check() {
  const { data, error } = await supabase
    .from('ads')
    .select('id, seller_name, title, status, facebook_post_id, telegram_message_id')
    .order('created_at', { ascending: false })
    .limit(20);
  
  console.log(data, error);
}

check();
