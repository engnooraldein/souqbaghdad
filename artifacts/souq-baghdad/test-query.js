import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lyhqnccpudwgvexqinxa.supabase.co';
const supabaseAnonKey = 'sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const actualId = 'a6434f93-28ce-44d1-88b4-b6c851f00697';
  
  // Test 1: UUID Query
  console.log('Running UUID query...');
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .eq('is_demo', false)
    .eq('id', actualId)
    .single();
    
  if (error) {
    console.error('UUID Query Error:', error.message, error.details);
  } else {
    console.log('UUID Query Success! short_id:', data.short_id, 'title:', data.title);
  }
}

test();
