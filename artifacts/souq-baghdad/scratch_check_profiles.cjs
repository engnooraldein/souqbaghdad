const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();

async function checkProfiles() {
  const res = await fetch(`${supabaseUrl}/rest/v1/profiles?limit=1`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  const data = await res.json();
  console.log("Columns:", Object.keys(data[0]));
}
checkProfiles();
