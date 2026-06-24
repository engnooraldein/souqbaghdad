-- ============================================================
-- قم بتشغيل هذا الكود في Supabase > SQL Editor
-- ============================================================

-- جدول المنتجات (Products)
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null,
  title text not null,
  description text,
  price text not null,
  category text not null,
  governorate text,
  phone text,
  images text[],
  condition text default 'used',
  stock int not null default 1,
  seller_name text,
  seller_avatar text,
  views int not null default 0,
  created_at timestamptz not null default now(),
  status text not null default 'active'
);

-- إضافة أعمدة مفقودة لجدول ads
alter table ads
  add column if not exists phone text,
  add column if not exists seller_name text,
  add column if not exists seller_avatar text,
  add column if not exists is_demo boolean not null default false,
  add column if not exists seller_rating numeric(3,2) default 4.8,
  add column if not exists type text default 'sell';

-- تمكين RLS للمنتجات مع صلاحيات مفتوحة (للتطوير)
alter table products enable row level security;

-- حذف السياسات القديمة إن وجدت ثم إعادة إنشائها
drop policy if exists "Allow public read on products" on products;
drop policy if exists "Allow public insert on products" on products;
drop policy if exists "Allow public update on products" on products;
drop policy if exists "Allow public delete on products" on products;

create policy "Allow public read on products"
  on products for select using (true);

create policy "Allow public insert on products"
  on products for insert with check (true);

create policy "Allow public update on products"
  on products for update using (true);

create policy "Allow public delete on products"
  on products for delete using (true);

-- فهارس للأداء
create index if not exists products_seller_id_idx on products(seller_id);
create index if not exists products_category_idx on products(category);
create index if not exists ads_seller_id_idx on ads(seller_id);
create index if not exists ads_is_demo_idx on ads(is_demo);
