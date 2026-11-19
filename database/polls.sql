-- โพลล์: ตัวเลือกของโพสต์แท็ก poll และโหวต (1 คน 1 โหวตต่อโพสต์)
create table if not exists poll_options (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts(id) on delete cascade,
  label       text not null check (char_length(label) between 1 and 80),
  sort_order  integer not null default 0
);
create index if not exists poll_options_post_idx on poll_options(post_id, sort_order);

create table if not exists poll_votes (
  post_id     uuid not null references posts(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  option_id   uuid not null references poll_options(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists poll_votes_option_idx on poll_votes(option_id);

alter table poll_options enable row level security;
alter table poll_votes enable row level security;
