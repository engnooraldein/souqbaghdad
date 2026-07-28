const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();

async function checkAds() {
  const res = await fetch(`${supabaseUrl}/rest/v1/ads?category=eq.transport&order=created_at.desc&limit=3`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  const data = await res.json();
  console.log(JSON.stringify(data.map(d => ({id: d.id, status: d.status, description: d.description})), null, 2));
}
checkAds();
