const fs = require('fs');
const content = fs.readFileSync('C:/Users/hp/Documents/GitHub/souqbaghdad/supabase/functions/telegram-bot/index.ts', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('handleSmartTransportSearch') || line.includes('generateAiResponse') || line.includes('askGemini') || line.includes('callGemini') || line.includes('gemini-')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
