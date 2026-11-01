-- Admin allowlist: only student IDs listed here (and enabled) get the admin role.
-- Run in Supabase SQL Editor. Safe to re-run.

create table if not exists admin_allowlist (
  student_id text primary key,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  constraint admin_allowlist_student_id_format check (student_id ~ '^\d{10}$')
);

alter table admin_allowlist enable row level security;
revoke all on table admin_allowlist from anon, authenticated;

insert into admin_allowlist (student_id)
values
  ('6809650382')
on conflict (student_id) do update set enabled = true;
