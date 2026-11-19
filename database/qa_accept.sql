-- ถาม-ตอบ: คำตอบที่ดีที่สุด
-- comments.id เป็น bigint แต่ posts.accepted_comment_id เดิมเป็น uuid -> เก็บ id คอมเมนต์ไม่ได้ ต้องเปลี่ยนชนิด
alter table public.posts
  alter column accepted_comment_id type bigint using null;

alter table public.posts
  drop constraint if exists posts_accepted_comment_id_fkey;
alter table public.posts
  add constraint posts_accepted_comment_id_fkey
    foreign key (accepted_comment_id) references public.comments(id) on delete set null;
