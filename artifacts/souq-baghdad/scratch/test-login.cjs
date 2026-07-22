const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lyhqnccpudwgvexqinxa.supabase.co';
const supabaseAnonKey = 'sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  const phone = '07700000000';
  const email = `${phone}@souqbaghdad.com`;
  const password = '12345678';

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('Test login failed:', error.message);
  } else {
    console.log('Test login succeeded! User ID:', data.user?.id);
  }
}

testLogin().catch(err => {
  console.error(err);
});
