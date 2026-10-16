do $$ begin
  create type user_role as enum ('student', 'instructor', 'staff', 'admin');
exception when duplicate_object then null; end $$;

create table if not exists faculties (
  id          text primary key,
  name_th     text not null,
  name_en     text,
  icon        text,
  sort_order  int  not null default 100
);

create table if not exists profiles (
  id               uuid primary key default gen_random_uuid(),
  username         text not null unique,
  tu_username      text not null unique,
  student_id       text unique,
  display_name     text not null,
  display_name_th  text,
  display_name_en  text,
  email            text,
  role             user_role not null default 'student',
  role_override    user_role,
  faculty_id       text references faculties(id) on delete set null,
  faculty_name     text,
  department       text,
  level_name       text,
  entry_year_be    int,
  tu_status        text,
  avatar_url       text,
  is_verified      bool not null default false,
  is_suspended     bool not null default false,
  onboarded_at     timestamptz,
  last_login_at    timestamptz,
  created_at       timestamptz not null default now(),
  constraint profiles_tu_username_lower check (tu_username = lower(tu_username)),
  constraint profiles_student_id_format check (student_id is null or student_id ~ '^\d{10}$'),
  constraint profiles_display_name_len check (char_length(display_name) between 1 and 40)
);

create index if not exists profiles_role_idx    on profiles(role);
create index if not exists profiles_faculty_idx on profiles(faculty_id);

create table if not exists sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  token_hash  text not null unique,
  user_agent  text,
  ip          text,
  expires_at  timestamptz not null default now() + interval '90 days',
  created_at  timestamptz not null default now()
);

create index if not exists sessions_user_idx    on sessions(user_id);
create index if not exists sessions_expires_idx on sessions(expires_at);

alter table faculties enable row level security;
alter table profiles  enable row level security;
alter table sessions  enable row level security;

drop policy if exists faculties_read on faculties;
create policy faculties_read on faculties
  for select to anon, authenticated
  using (true);

revoke all on table sessions from anon, authenticated;
revoke all on table profiles from anon, authenticated;
revoke insert, update, delete on table faculties from anon, authenticated;

insert into faculties (id, name_th, name_en, icon, sort_order) values
  ('law',       'คณะนิติศาสตร์',                          'Faculty of Law',                        '⚖️', 10),
  ('comm',      'คณะพาณิชยศาสตร์และการบัญชี',              'Thammasat Business School',             '📊', 20),
  ('polsci',    'คณะรัฐศาสตร์',                           'Faculty of Political Science',          '🏛️', 30),
  ('econ',      'คณะเศรษฐศาสตร์',                         'Faculty of Economics',                  '💹', 40),
  ('socadmin',  'คณะสังคมสงเคราะห์ศาสตร์',                 'Faculty of Social Administration',      '🤝', 50),
  ('arts',      'คณะศิลปศาสตร์',                          'Faculty of Liberal Arts',               '🎨', 60),
  ('jc',        'คณะวารสารศาสตร์และสื่อสารมวลชน',          'Faculty of Journalism',                 '📰', 70),
  ('sociology', 'คณะสังคมวิทยาและมานุษยวิทยา',             'Faculty of Sociology and Anthropology', '🌏', 80),
  ('sci',       'คณะวิทยาศาสตร์และเทคโนโลยี',              'Faculty of Science and Technology',     '🔬', 90),
  ('engr',      'คณะวิศวกรรมศาสตร์',                      'Faculty of Engineering',                '⚙️', 100),
  ('med',       'คณะแพทยศาสตร์',                          'Faculty of Medicine',                   '🩺', 110),
  ('allied',    'คณะสหเวชศาสตร์',                         'Faculty of Allied Health Sciences',     '🧪', 120),
  ('dent',      'คณะทันตแพทยศาสตร์',                      'Faculty of Dentistry',                  '🦷', 130),
  ('nurse',     'คณะพยาบาลศาสตร์',                        'Faculty of Nursing',                    '💉', 140),
  ('fineart',   'คณะศิลปกรรมศาสตร์',                      'Faculty of Fine and Applied Arts',      '🎭', 150),
  ('arch',      'คณะสถาปัตยกรรมศาสตร์และการผังเมือง',      'Faculty of Architecture',               '🏗️', 160),
  ('pubhealth', 'คณะสาธารณสุขศาสตร์',                     'Faculty of Public Health',              '🏥', 170),
  ('pharm',     'คณะเภสัชศาสตร์',                         'Faculty of Pharmacy',                   '💊', 180),
  ('lsed',      'คณะวิทยาการเรียนรู้และศึกษาศาสตร์',        'Faculty of Learning Sciences',          '📚', 190),
  ('ci',        'วิทยาลัยสหวิทยาการ',                      'College of Interdisciplinary Studies',  '🧩', 200),
  ('citu',      'วิทยาลัยนวัตกรรม',                        'College of Innovation',                 '💡', 210),
  ('psds',      'วิทยาลัยพัฒนศาสตร์ ป๋วย อึ๊งภากรณ์',        'Puey Ungphakorn School of Development', '🌱', 220),
  ('sgs',       'วิทยาลัยโลกคดีศึกษา',                     'School of Global Studies',              '🌐', 230),
  ('cicm',      'วิทยาลัยแพทยศาสตร์นานาชาติจุฬาภรณ์',       'Chulabhorn International College',      '🫀', 240),
  ('siit',      'สถาบันเทคโนโลยีนานาชาติสิรินธร',           'SIIT',                                  '🛠️', 250),
  ('pridi',     'วิทยาลัยปรีดี พนมยงค์',                    'Pridi Banomyong College',               '🕊️', 260),
  ('tu-office', 'สำนักงานมหาวิทยาลัย',                     'Office of the University',              '🏢', 900)
on conflict (id) do update set
  name_th    = excluded.name_th,
  name_en    = excluded.name_en,
  icon       = excluded.icon,
  sort_order = excluded.sort_order;
