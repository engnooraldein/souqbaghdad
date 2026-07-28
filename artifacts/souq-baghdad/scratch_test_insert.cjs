const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();

async function testEdgeFunction() {
  const ad = {
    title: 'Test Ad for Telegram Bot',
    category: 'transport',
    description: JSON.stringify({ shift: 'test' }),
    status: 'published',
    price: 1000,
    seller_id: '93a8326a-cc44-427b-a71c-0bf21e3c0ffa', // Ahmad Anwar's profile ID
    location: 'Test Location',
    city: 'Test City'
  };

  console.log("Inserting ad...");
  const res = await fetch(`${supabaseUrl}/rest/v1/ads`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(ad)
  });
  
  if (!res.ok) {
    console.error("Failed to insert", await res.text());
    return;
  }
  const data = await res.json();
  const id = data[0].id;
  console.log("Inserted ID:", id);

  console.log("Waiting 3 seconds for webhook and edge function...");
  await new Promise(r => setTimeout(r, 3000));

  console.log("Fetching ad back...");
  const res2 = await fetch(`${supabaseUrl}/rest/v1/ads?id=eq.${id}`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  const data2 = await res2.json();
  console.log("Ad after edge function:", JSON.stringify(data2, null, 2));
}

testEdgeFunction();
