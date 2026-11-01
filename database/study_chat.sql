-- U14: แชทกลุ่มของนัดติว สมาชิก = เจ้าของนัด + คนที่ได้รับอนุมัติใน study_members
-- ปิดรับข้อความหลังเวลานัด 7 วัน (เช็คในโค้ดฝั่ง server) รันใน Supabase SQL Editor ได้ซ้ำ

create table if not exists study_messages (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  body        text,
  image_id    uuid references files(id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint study_messages_body_len check (body is null or char_length(body) between 1 and 2000),
  constraint study_messages_not_empty check (body is not null or image_id is not null)
);

create index if not exists study_messages_post_idx on study_messages(post_id, created_at desc);

-- เข้าถึงผ่าน server (service role) เท่านั้น
alter table study_messages enable row level security;
revoke all on table study_messages from anon, authenticated;
