-- U13: ตารางบันทึกโพสต์ (bookmarks) — ผู้ใช้หนึ่งคนบันทึกโพสต์เดียวกันได้ครั้งเดียว
create table if not exists bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  post_id     uuid not null references posts(id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint bookmarks_pair_key unique (user_id, post_id)
);

create index if not exists bookmarks_user_idx on bookmarks(user_id, created_at desc);
create index if not exists bookmarks_post_idx on bookmarks(post_id);
alter table bookmarks enable row level security;
revoke all on table bookmarks from anon, authenticated;

notify pgrst, 'reload schema';
