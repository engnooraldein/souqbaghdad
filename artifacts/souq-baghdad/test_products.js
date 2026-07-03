import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lyhqnccpudwgvexqinxa.supabase.co';
const supabaseAnonKey = 'sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const actualId = '21869397-5347-48bd-9ebe-94c5512cf5b3';
  
  console.log('1. Testing general connection to products table...');
  const { data: list, error: listError } = await supabase
    .from('products')
    .select('id, title, short_id')
    .limit(3);
    
  if (listError) {
    console.error('Failed to list products:', listError.message, listError.details);
  } else {
    console.log('Successfully listed products:', list);
  }

  console.log(`\n2. Querying product by ID: ${actualId}...`);
  const { data: prod, error: prodError } = await supabase
    .from('products')
    .select('*')
    .eq('id', actualId)
    .maybeSingle();

  if (prodError) {
    console.error('Failed to query product by ID:', prodError.message, prodError.details);
  } else if (!prod) {
    console.log('Product NOT found in database (no match for this ID).');
  } else {
    console.log('Product FOUND successfully!', {
      id: prod.id,
      title: prod.title,
      short_id: prod.short_id,
      status: prod.status
    });
  }
}

test();
