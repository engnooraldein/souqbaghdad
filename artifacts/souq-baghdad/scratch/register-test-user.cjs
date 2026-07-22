const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lyhqnccpudwgvexqinxa.supabase.co';
const supabaseAnonKey = 'sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function register() {
  console.log('Starting registration for test user...');
  const phone = '07700000000';
  const email = `${phone}@souqbaghdad.com`;
  const password = '12345678';

  // 1. Sign up the user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'مراجع جوجل',
        phone: phone,
        city: 'بغداد',
        role: 'user'
      }
    }
  });

  if (signUpError) {
    console.error('Sign up error (user might already exist):', signUpError.message);
  } else {
    console.log('User signed up successfully:', signUpData.user?.id);
  }

  // 2. Ensure profile exists in profiles table
  // Check if profile exists
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();

  if (profile) {
    console.log('Profile already exists for phone:', phone);
  } else {
    console.log('Creating profile record...');
    const userId = signUpData.user?.id;
    if (!userId) {
      console.error('Cannot create profile: userId is missing');
      return;
    }
    const { error: insertErr } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: 'مراجع جوجل',
        phone: phone,
        role: 'user',
        avatar_url: null
      });
    if (insertErr) {
      console.error('Error inserting profile:', insertErr.message);
    } else {
      console.log('Profile created successfully!');
    }
  }
}

register().catch(err => {
  console.error('Execution failed:', err);
});
