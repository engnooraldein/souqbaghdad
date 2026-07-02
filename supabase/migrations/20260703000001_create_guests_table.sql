create table if not exists public.guests (
  id text primary key,
  last_seen timestamp with time zone default timezone('utc'::text, now()),
  user_agent text,
  is_banned boolean default false
);

alter table public.guests enable row level security;

drop policy if exists "Guests are viewable by everyone." on public.guests;
create policy "Guests are viewable by everyone." on public.guests for select using (true);

drop policy if exists "Guests can insert/update themselves." on public.guests;
create policy "Guests can insert/update themselves." on public.guests for insert with check (true);

drop policy if exists "Guests can update themselves." on public.guests;
create policy "Guests can update themselves." on public.guests for update using (true);
