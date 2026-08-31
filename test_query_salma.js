const https = require('https');

async function testQuery(chatId, chatType, text) {
  const payload = {
    update_id: Date.now(),
    message: {
      message_id: Math.floor(Math.random() * 100000),
      from: { id: 777557036, first_name: "سلمى علي محمود", username: "salma_ali" },
      chat: { id: chatId, type: chatType, title: chatType !== 'private' ? "تجمع طلاب كلية الرافدين" : undefined },
      date: Math.floor(Date.now() / 1000),
      text: text
    }
  };

  const body = JSON.stringify(payload);
  const req = https.request('https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/telegram-bot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  }, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      console.log(`[${chatType}] Status: ${res.statusCode}, Body: ${data}`);
    });
  });

  req.on('error', e => console.error('Request error:', e));
  req.write(body);
  req.end();
}

console.log('Testing Group Chat query with Salma...');
testQuery(-1002361660601, 'supergroup', 'مرحبة اريد خط من البنوك للجامعة التكنولوجية');
