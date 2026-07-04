alter table support_messages 
add column if not exists user_id uuid references auth.users(id);

-- Trigger for support_messages table to use telegram-bot
drop trigger if exists on_support_message_created on support_messages;
create trigger on_support_message_created
  after insert on support_messages
  for each row execute function invoke_telegram_bot();
