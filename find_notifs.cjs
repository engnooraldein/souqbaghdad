const fs = require('fs');
const content = fs.readFileSync('C:/Users/hp/Documents/GitHub/souqbaghdad/supabase/functions/telegram-bot/index.ts', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('raw_query') || line.includes('rawText') || line.includes('norm') || line.includes('userCaption')) {
    if (line.includes('sendMessage') || line.includes('notify') || line.includes('chatId') || line.includes('insert') || line.includes('targetChatId')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});
