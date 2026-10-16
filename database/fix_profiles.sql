alter table profiles drop constraint if exists profiles_id_fkey;
alter table sessions drop constraint if exists sessions_user_id_fkey;

drop table if exists users cascade;

alter table profiles alter column id set default gen_random_uuid();
alter table profiles add column if not exists tu_username text;
alter table profiles add column if not exists email text;
alter table profiles add column if not exists last_login_at timestamptz;

update profiles set tu_username = lower(username) where tu_username is null;
alter table profiles alter column tu_username set not null;

do $$ begin
  alter table profiles add constraint profiles_tu_username_key unique (tu_username);
exception when duplicate_object or duplicate_table then null; end $$;

do $$ begin
  alter table profiles add constraint profiles_tu_username_lower check (tu_username = lower(tu_username));
exception when duplicate_object then null; end $$;

alter table sessions
  add constraint sessions_user_id_fkey foreign key (user_id) references profiles(id) on delete cascade;

notify pgrst, 'reload schema';
