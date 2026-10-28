
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- ตารางเดิมใน Supabase มีแค่ id กับ created_at จึงเพิ่มคอลัมน์ที่ขาดให้
alter table push_subscriptions
  add column if not exists user_id uuid references profiles(id) on delete cascade,
  add column if not exists endpoint text,
  add column if not exists p256dh text,
  add column if not exists auth text,
  add column if not exists user_agent text;

delete from push_subscriptions where user_id is null or endpoint is null;

alter table push_subscriptions
  alter column user_id set not null,
  alter column endpoint set not null,
  alter column p256dh set not null,
  alter column auth set not null;

create unique index if not exists push_subscriptions_endpoint_key
  on push_subscriptions (endpoint);

create index if not exists push_subscriptions_user_idx
  on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

revoke all on table push_subscriptions from anon, authenticated;
