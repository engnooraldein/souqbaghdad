const fs = require('fs');
const content = fs.readFileSync('C:/Users/hp/Documents/GitHub/souqbaghdad/supabase/functions/telegram-bot/index.ts', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('isOwner') || line.includes('OWNER_ID') || line.includes('777557036') || line.includes('admin') || line.includes('notifyAdmins') || line.includes('sendAdmin') || line.includes('push_notification') || line.includes('🔔')) {
    if (line.includes('sendMessage') || line.includes('owner') || line.includes('Admin') || line.includes('alert') || line.includes('chatId')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});
