const fs = require('fs');

async function scan() {
  console.log('=== 1. Check Telegram Bot Token & Webhook Info ===');
  
  // Read BOT_TOKEN
  const botToken = '7774900135:AAE-5U_8n9a6V127Lh4jZ-YV1n9i_wGg4X8'; // let's check what token is in edge function or env
  
  // Read index.ts for BOT_TOKEN
  const content = fs.readFileSync('C:/Users/hp/Documents/GitHub/souqbaghdad/supabase/functions/telegram-bot/index.ts', 'utf8');
  let extractedToken = '';
  const tokenMatch = content.match(/BOT_TOKEN\s*=\s*['"]([^'"]+)['"]/);
  if (tokenMatch) {
    extractedToken = tokenMatch[1];
  } else {
    const envTokenMatch = content.match(/Deno\.env\.get\(['"]TELEGRAM_BOT_TOKEN['"]\)\s*\|\|\s*['"]([^'"]+)['"]/);
    if (envTokenMatch) extractedToken = envTokenMatch[1];
  }
  
  console.log('Extracted BOT_TOKEN:', extractedToken ? extractedToken.substring(0, 15) + '...' : 'none');

  if (extractedToken) {
    const res = await fetch(`https://api.telegram.org/bot${extractedToken}/getWebhookInfo`);
    const data = await res.json();
    console.log('Telegram getWebhookInfo:', data);

    const meRes = await fetch(`https://api.telegram.org/bot${extractedToken}/getMe`);
    const meData = await meRes.json();
    console.log('Telegram getMe:', meData);
  }

  console.log('=== 2. Direct Test Invoke to Supabase Edge Function ===');
  const functionUrl = 'https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/telegram-bot';
  
  // Simulate /start from owner
  const testPayload = {
    update_id: 999999991,
    message: {
      message_id: 12345,
      from: {
        id: 777557036,
        is_bot: false,
        first_name: 'Noor',
        username: 'nooraldeinsbah'
      },
      chat: {
        id: 777557036,
        first_name: 'Noor',
        username: 'nooraldeinsbah',
        type: 'private'
      },
      date: Math.floor(Date.now() / 1000),
      text: '/start'
    }
  };

  try {
    const t0 = Date.now();
    const fnRes = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    const elapsed = Date.now() - t0;
    const resText = await fnRes.text();
    console.log(`Function Response (${elapsed}ms): Status=${fnRes.status}, Body=${resText}`);
  } catch (err) {
    console.error('Function Invoke Error:', err);
  }
}

scan();
