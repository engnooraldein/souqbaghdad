const fs = require('fs');
const content = fs.readFileSync('C:/Users/hp/Documents/GitHub/souqbaghdad/supabase/functions/telegram-bot/index.ts', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('const showMainMenu') || line.includes('function showMainMenu') || line.includes('let showMainMenu')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
