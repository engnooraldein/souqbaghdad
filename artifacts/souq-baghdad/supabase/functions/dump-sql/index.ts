import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Create a user
  const email = 'test_deduct_' + Date.now() + '@example.com';
  const { data: user, error: userError } = await supabase.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true
  });
  
  if (userError) return new Response(JSON.stringify(userError));
  
  // Wait for trigger
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Add 100 points
  await supabase.from('profiles').update({ points: 100 }).eq('id', user.user.id);
  
  // Login to get JWT
  const { data: authData } = await supabase.auth.signInWithPassword({
    email,
    password: 'password123'
  });
  
  const clientSupabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } } }
  );
  
  const { data: deduct, error: deductError } = await clientSupabase.rpc('deduct_points', {
    p_user_id: user.user.id,
    p_amount: 5,
    p_reason: 'test'
  });
  
  return new Response(JSON.stringify({ userId: user.user.id, deduct, deductError }), { headers: { 'Content-Type': 'application/json' } })
})
