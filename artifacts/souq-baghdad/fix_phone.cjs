const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPhone() {
  console.log('Searching for duplicate phone...');
  const phoneToFix = '07701109692';
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('phone', phoneToFix);

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log(`Found ${profiles.length} profile(s) with phone ${phoneToFix}.`);

  for (const profile of profiles) {
    if (profile.email !== 'nooraldeinsbah@gmail.com') {
      console.log(`Updating duplicate profile ID: ${profile.id} (Email: ${profile.email || 'None'})`);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ phone: null })
        .eq('id', profile.id);

      if (updateError) {
        console.error(`Failed to update profile ${profile.id}:`, updateError);
      } else {
        console.log(`Successfully removed phone from profile ${profile.id}`);
      }
    } else {
      console.log(`Skipping owner profile ID: ${profile.id}`);
    }
  }
}

fixPhone();
