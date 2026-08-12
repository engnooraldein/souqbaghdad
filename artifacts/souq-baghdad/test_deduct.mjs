import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lyhqnccpudwgvexqinxa.supabase.co',
  'sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf'
);

async function run() {
  const email = 'test_deduct_' + Date.now() + '@example.com';
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'password123',
  });
  
  if (authError) {
    console.log('Signup error:', authError);
    return;
  }
  
  const userId = authData.user.id;
  console.log('Created user:', userId);
  
  // Wait for trigger to create profile
  await new Promise(r => setTimeout(r, 2000));
  
  // They start with 10 points usually. Let's check.
  const { data: profile } = await supabase.from('profiles').select('points').eq('id', userId).single();
  console.log('Initial points:', profile?.points);
  
  // Try to deduct 5 points
  const { data: deduct, error: deductError } = await supabase.rpc('deduct_points', {
    p_user_id: userId,
    p_amount: 5,
    p_reason: 'test'
  });
  
  console.log('Deduct result:', deduct, deductError);
}

run();
