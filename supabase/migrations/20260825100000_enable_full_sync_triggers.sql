-- Enable pg_net extension
create extension if not exists "pg_net";

-- Update invoke_telegram_bot function to handle INSERT, UPDATE, and DELETE with both NEW and OLD records
create or replace function invoke_telegram_bot()
returns trigger as $$
declare
  rec_json jsonb;
  old_rec_json jsonb;
begin
  if (TG_OP = 'DELETE') then
    rec_json := null;
    old_rec_json := row_to_json(OLD)::jsonb;
  elsif (TG_OP = 'UPDATE') then
    rec_json := row_to_json(NEW)::jsonb;
    old_rec_json := row_to_json(OLD)::jsonb;
  else
    rec_json := row_to_json(NEW)::jsonb;
    old_rec_json := null;
  end if;

  perform net.http_post(
    url := 'https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/telegram-bot',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf"}'::jsonb,
    body := json_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', rec_json,
      'old_record', old_rec_json
    )::jsonb,
    timeout_milliseconds := 30000
  );
  
  if (TG_OP = 'DELETE') then
    return OLD;
  else
    return NEW;
  end if;
end;
$$ language plpgsql security definer;

-- Trigger for ads table (INSERT, UPDATE, DELETE)
drop trigger if exists on_ad_created on ads;
drop trigger if exists on_ad_changed on ads;
create trigger on_ad_changed
  after insert or update or delete on ads
  for each row execute function invoke_telegram_bot();

-- Trigger for products table (INSERT, UPDATE, DELETE)
drop trigger if exists on_product_created on products;
drop trigger if exists on_product_changed on products;
create trigger on_product_changed
  after insert or update or delete on products
  for each row execute function invoke_telegram_bot();
