import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', '33bee09a-51ab-4d56-ba55-c23e37968735').single();
  return new Response(JSON.stringify({ profile, error }), { headers: { 'Content-Type': 'application/json' } })
})
