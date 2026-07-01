const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lyhqnccpudwgvexqinxa.supabase.co';
const supabaseAnonKey = 'sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tables = [
  'ads',
  'products',
  'profiles',
  'guests',
  'ad_viewers',
  'verification_requests',
  'recovery_requests',
  'support_messages',
  'user_notifications',
  'password_recovery_requests'
];

async function test() {
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      console.log(`Table: ${table} | Rows: ${data ? data.length : null} | Error:`, error ? error.message : "None");
    } catch (e) {
      console.log(`Table: ${table} | Exception:`, e.message);
    }
  }
}

test();
