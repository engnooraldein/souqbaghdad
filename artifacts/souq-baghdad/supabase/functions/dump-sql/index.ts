import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as postgres from 'https://deno.land/x/postgres@v0.17.0/mod.ts'

serve(async (req) => {
  try {
    const pool = new postgres.Pool(Deno.env.get('SUPABASE_DB_URL') || Deno.env.get('DATABASE_URL') || '', 3, true);
    const connection = await pool.connect();
    
    // Check if there are RLS policies on profiles preventing insert
    const policies = await connection.queryObject`SELECT * FROM pg_policies WHERE tablename = 'profiles'`;
    
    connection.release();
    return new Response(JSON.stringify({ policies: policies.rows }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { headers: { 'Content-Type': 'application/json' } });
  }
})
