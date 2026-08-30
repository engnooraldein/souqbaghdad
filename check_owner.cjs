const fs = require('fs');

// Read .env
let anonKey = '';
try {
  const envContent = fs.readFileSync('C:/Users/hp/Documents/GitHub/souqbaghdad/.env', 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      anonKey = line.split('=')[1].trim();
    }
  });
} catch(e) {}

const supabaseUrl = 'https://lyhqnccpudwgvexqinxa.supabase.co';

async function query(table, select = '*', filter = '') {
  const url = `${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}${filter ? '&' + filter : ''}`;
  const res = await fetch(url, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    }
  });
  return await res.json();
}

async function run() {
  console.log('--- 1. telegram_users by phone ---');
  const tgByPhone = await query('telegram_users', '*', 'phone_number=ilike.*7701109692*');
  console.log(tgByPhone);

  console.log('--- 2. profiles by phone ---');
  const profByPhone = await query('profiles', '*', 'phone=ilike.*7701109692*');
  console.log(profByPhone);

  console.log('--- 3. All telegram_users ---');
  const allTg = await query('telegram_users', '*', 'order=created_at.desc&limit=10');
  console.log(allTg);

  console.log('--- 4. banned_identifiers ---');
  const banned = await query('banned_identifiers', '*');
  console.log(banned);
}

run();
