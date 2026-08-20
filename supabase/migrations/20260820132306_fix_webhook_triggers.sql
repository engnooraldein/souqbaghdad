create or replace function invoke_telegram_bot()
returns trigger as $$
begin
  -- For UPDATE operations, ONLY invoke if status has changed (e.g. to matched, sold, active)
  -- This prevents infinite loops or duplicate posting when sync_status/facebook_post_id are updated!
  if (TG_OP = 'UPDATE') then
    if (OLD.status is not distinct from NEW.status) then
      return NEW;
    end if;
  end if;

  perform net.http_post(
    url := 'https://lyhqnccpudwgvexqinxa.supabase.co/functions/v1/telegram-bot',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_JH0HoX448K2Rqw38QOM5Gw_IsIXRAUf"}'::jsonb,
    body := json_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    )::jsonb
  );
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_ad_created on ads;
create trigger on_ad_created
  after insert or update on ads
  for each row execute function invoke_telegram_bot();

drop trigger if exists on_product_created on products;
create trigger on_product_created
  after insert or update on products
  for each row execute function invoke_telegram_bot();
