const SUPABASE_URL = 'https://lyhqnccpudwgvexqinxa.supabase.co';
const ANON_KEY = 'sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf';

async function main() {
  const fetchRes = await fetch(`${SUPABASE_URL}/rest/v1/ads?select=*&order=created_at.desc&limit=5`, {
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`
    }
  });

  const ads = await fetchRes.json();
  if (!Array.isArray(ads) || ads.length === 0) {
    console.error('No ads found:', ads);
    return;
  }

  const latestCar = ads.find(a => a.category === 'vehicles' || a.category === 'cars') || ads[0];
  console.log('Target Ad to republish:', latestCar.id, latestCar.title);

  const res = await fetch(`${SUPABASE_URL}/functions/v1/telegram-bot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({
      type: 'INSERT',
      table: 'ads',
      record: latestCar
    })
  });

  const text = await res.text();
  console.log('Edge function response:', text);
}

main();
