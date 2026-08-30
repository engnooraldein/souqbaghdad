const fs = require('fs');
const content = fs.readFileSync('C:/Users/hp/Documents/GitHub/souqbaghdad/supabase/functions/telegram-bot/index.ts', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes("text === '/start'") || line.includes("text.startsWith('/start'") || line.includes("text.trim() === '/start'")) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
