-- ==========================================
-- Add columns to existing comments table
-- ==========================================

alter table public.comments
  add column if not exists post_id uuid,
  add column if not exists author_id uuid,
  add column if not exists parent_id bigint,
  add column if not exists body text,
  add column if not exists like_count integer not null default 0;

-- ==========================================
-- Add columns to existing comment_likes table
-- ==========================================

alter table public.comment_likes
  add column if not exists comment_id bigint,
  add column if not exists user_id uuid;

-- ==========================================
-- Foreign Keys and Constraints
-- ==========================================

alter table public.comments
  alter column post_id set not null,
  alter column author_id set not null,
  alter column body set not null;

alter table public.comments
  add constraint comments_post_id_fkey
    foreign key (post_id) references public.posts(id) on delete cascade,
  add constraint comments_author_id_fkey
    foreign key (author_id) references public.profiles(id) on delete cascade,
  add constraint comments_parent_id_fkey
    foreign key (parent_id) references public.comments(id) on delete cascade,
  add constraint comments_body_length
    check (char_length(trim(body)) between 1 and 2000),
  add constraint comments_no_self_parent
    check (parent_id is null or parent_id <> id);

alter table public.comment_likes
  alter column comment_id set not null,
  alter column user_id set not null;

alter table public.comment_likes
  add constraint comment_likes_comment_id_fkey
    foreign key (comment_id) references public.comments(id) on delete cascade,
  add constraint comment_likes_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade,
  add constraint comment_likes_user_comment_unique
    unique (comment_id, user_id);

-- ==========================================
-- Indexes
-- ==========================================

create index if not exists comments_post_created_idx
  on public.comments(post_id, created_at asc);

create index if not exists comments_author_idx
  on public.comments(author_id);

create index if not exists comments_parent_idx
  on public.comments(parent_id);

create index if not exists comment_likes_comment_idx
  on public.comment_likes(comment_id);

-- ==========================================
-- Row Level Security
-- ==========================================

alter table public.comments enable row level security;
alter table public.comment_likes enable row level security;

revoke all on table public.comments from anon, authenticated;
revoke all on table public.comment_likes from anon, authenticated;

-- ==========================================
-- Update posts.comment_count automatically
-- ==========================================

create or replace function public.update_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts
    set comment_count = comment_count + 1
    where id = new.post_id;
    return new;

  elsif tg_op = 'DELETE' then
    update public.posts
    set comment_count = greatest(comment_count - 1, 0)
    where id = old.post_id;
    return old;
  end if;

  return null;
end;
$$;

revoke all on function public.update_post_comment_count()
from public, anon, authenticated;

drop trigger if exists comments_update_count
  on public.comments;

create trigger comments_update_count
after insert or delete on public.comments
for each row
execute function public.update_post_comment_count();

notify pgrst, 'reload schema';