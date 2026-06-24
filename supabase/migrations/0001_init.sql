-- Supabase database schema for Souq Baghdad

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  phone text,
  role text not null default 'user',
  avatar_url text,
  created_at timestamptz not null default now(),
  ads_count int not null default 0,
  favorites_count int not null default 0,
  views_count int not null default 0
);

create table if not exists ads (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null,
  title text not null,
  description text,
  price text not null,
  category text not null,
  location text,
  city text,
  images text[],
  created_at timestamptz not null default now(),
  views int not null default 0,
  likes int not null default 0,
  status text not null default 'active'
);

create table if not exists favorites (
  user_id uuid not null,
  ad_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, ad_id)
);

create index if not exists ads_category_idx on ads(category);
create index if not exists ads_location_idx on ads(location);

alter table ads enable row level security;

drop policy if exists "Allow public read access on ads" on ads;
drop policy if exists "Allow public insert access on ads" on ads;
drop policy if exists "Allow public update access on ads" on ads;
drop policy if exists "Allow public delete access on ads" on ads;

create policy "Allow public read access on ads"
  on ads for select using (true);

create policy "Allow public insert access on ads"
  on ads for insert with check (true);

create policy "Allow public update access on ads"
  on ads for update using (true);

create policy "Allow public delete access on ads"
  on ads for delete using (true);
