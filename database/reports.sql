-- U7/U8: ตารางรายงานเนื้อหาไม่เหมาะสม (reports) และคิวตรวจของแอดมิน
create table if not exists reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references profiles(id) on delete cascade,
  post_id          uuid references posts(id) on delete set null,
  post_author_id   uuid references profiles(id) on delete set null,
  post_excerpt     text,
  reason           text not null check (reason in ('wrong_info', 'copyright', 'spam', 'inappropriate', 'privacy')),
  detail           text check (detail is null or char_length(detail) <= 500),
  status           text not null default 'pending' check (status in ('pending', 'actioned', 'dismissed')),
  action           text check (action in ('hide', 'delete', 'dismiss')),
  resolution_note  text check (resolution_note is null or char_length(resolution_note) <= 500),
  resolved_by      uuid references profiles(id) on delete set null,
  resolved_at      timestamptz,
  created_at       timestamptz not null default now()
);

-- รายงานโพสต์เดิมซ้ำไม่ได้ ระหว่างที่เคสเดิมยังรอตรวจ
create unique index if not exists reports_one_pending_idx
  on reports(reporter_id, post_id) where status = 'pending';
create index if not exists reports_status_idx on reports(status, created_at desc);
create index if not exists reports_post_idx   on reports(post_id);

alter table reports enable row level security;
revoke all on table reports from anon, authenticated;

notify pgrst, 'reload schema';
