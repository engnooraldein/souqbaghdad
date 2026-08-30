const fs = require('fs');
const content = fs.readFileSync('C:/Users/hp/Documents/GitHub/souqbaghdad/supabase/functions/telegram-bot/index.ts', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('phone_number') || line.includes('message.contact') || line.includes('msg.contact')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
