import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lyhq চ্যালেঞ্জnccpudwgvexqinxa.supabase.co',
  'sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf'
);

async function run() {
  const { data, error } = await supabase.rpc('get_function_source', { func_name: 'deduct_points' });
  console.log(data, error);
}

run();
