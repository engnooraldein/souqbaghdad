create extension if not exists "pg_net";

create or replace function invoke_telegram_bot()
returns trigger as $$
begin
  perform net.http_post(
    url := 'https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/telegram-bot',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf"}'::jsonb,
    body := json_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW)
    )::jsonb
  );
  return NEW;
end;
$$ language plpgsql security definer;

-- Trigger for ads table
drop trigger if exists on_ad_created on ads;
create trigger on_ad_created
  after insert on ads
  for each row execute function invoke_telegram_bot();

-- Trigger for products table
drop trigger if exists on_product_created on products;
create trigger on_product_created
  after insert on products
  for each row execute function invoke_telegram_bot();
