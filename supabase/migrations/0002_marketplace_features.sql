-- Marketplace feature scaffolding for Souq Baghdad

create extension if not exists "pgcrypto";

create table if not exists feature_flags (
  key text primary key,
  enabled boolean not null default true,
  label text not null,
  description text,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

create table if not exists ad_reviews (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null,
  seller_id uuid not null,
  reviewer_id uuid not null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists ad_follows (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null,
  follower_id uuid not null,
  created_at timestamptz not null default now(),
  unique (seller_id, follower_id)
);

create table if not exists content_reports (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('ad', 'user', 'comment')),
  reporter_id uuid not null,
  reported_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved')),
  created_at timestamptz not null default now()
);

create table if not exists user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  audience text not null default 'user',
  type text not null default 'system',
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists chat_threads (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid,
  participant_a uuid not null,
  participant_b uuid not null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (participant_a, participant_b, ad_id)
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references chat_threads(id) on delete cascade,
  sender_id uuid not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  query text not null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists feature_flags_enabled_idx on feature_flags(enabled);
create index if not exists ad_reviews_ad_id_idx on ad_reviews(ad_id);
create index if not exists ad_follows_seller_id_idx on ad_follows(seller_id);
create index if not exists content_reports_status_idx on content_reports(status);
create index if not exists user_notifications_user_id_idx on user_notifications(user_id);
create index if not exists activity_logs_actor_id_idx on activity_logs(actor_id);
create index if not exists chat_messages_thread_id_idx on chat_messages(thread_id);
create index if not exists search_history_user_id_idx on search_history(user_id);

alter table ads
  add column if not exists seller_name text,
  add column if not exists seller_avatar text,
  add column if not exists seller_rating numeric(3,2) default 4.8,
  add column if not exists seller_followers int not null default 0,
  add column if not exists image text,
  add column if not exists type text default 'sell',
  add column if not exists currency text default 'IQD',
  add column if not exists visibility text default 'public',
  add column if not exists interested_count int not null default 0,
  add column if not exists published_at timestamptz,
  add column if not exists last_updated timestamptz,
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_demo boolean not null default false,
  add column if not exists video_url text;

insert into feature_flags (key, enabled, label, description) values
  ('reviews', true, 'Reviews & Ratings', 'Show buyer reviews for sellers'),
  ('follows', true, 'Seller Follow', 'Let users follow sellers'),
  ('reports', true, 'Content Reports', 'Allow reporting ads and users'),
  ('verification', true, 'Account Verification', 'Show verification badges'),
  ('featured_ads', true, 'Featured Ads', 'Allow promoted ads'),
  ('games', true, 'Games', 'Enable the games section'),
  ('chat', true, 'Internal Chat', 'Enable on-platform messaging'),
  ('notifications', true, 'In-app Notifications', 'Enable notification center'),
  ('push_notifications', false, 'Push Notifications', 'Enable browser push'),
  ('share', true, 'Social Sharing', 'Show share actions'),
  ('search_history', true, 'Search History', 'Save recent searches'),
  ('compare', true, 'Compare Products', 'Enable comparison tools'),
  ('nearby', true, 'Nearby Listings', 'Show nearby ads'),
  ('similar_ads', true, 'Similar Suggestions', 'Show similar ads'),
  ('video_upload', true, 'Video Upload', 'Allow ad video uploads'),
  ('map_location', true, 'Map Location', 'Allow map coordinates'),
  ('qr_code', true, 'QR Codes', 'Generate ad QR codes'),
  ('points_rewards', false, 'Points & Rewards', 'Enable rewards system'),
  ('orders', true, 'Orders & Cart', 'Enable commerce orders'),
  ('coupons', true, 'Coupons', 'Enable coupon discounts'),
  ('subscriptions', false, 'Seller Subscriptions', 'Enable seller plans'),
  ('otp_login', true, 'Phone OTP', 'Enable OTP verification'),
  ('google_login', true, 'Google Login', 'Enable Google login'),
  ('facebook_login', true, 'Facebook Login', 'Enable Facebook login'),
  ('pwa', true, 'PWA', 'Enable installable app mode'),
  ('analytics', true, 'Analytics', 'Enable analytics widgets'),
  ('ai_assist', true, 'AI Assist', 'Enable AI copy suggestions'),
  ('duplicate_detection', true, 'Duplicate Detection', 'Detect duplicate or fake ads'),
  ('audit_log', true, 'Audit Log', 'Keep admin activity history'),
  ('backup_restore', true, 'Backup & Restore', 'Enable backups'),
  ('2fa', false, 'Two-factor Auth', 'Enable additional login security')
on conflict (key) do update
set enabled = excluded.enabled,
    label = excluded.label,
    description = excluded.description,
    updated_at = now();
