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

-- เพิ่มคอลัมน์ stars และ bio ให้กับตาราง profiles
alter table profiles add column if not exists stars int not null default 0;
alter table profiles add column if not exists bio text;

create table if not exists subjects (
  code        text primary key,
  name_th     text not null,
  faculty_id  text references faculties(id) on delete set null,
  group_code  text
);

alter table subjects enable row level security;
drop policy if exists subjects_read on subjects;
create policy subjects_read on subjects
  for select to anon, authenticated
  using (true);
revoke insert, update, delete on table subjects from anon, authenticated;

insert into subjects (code, name_th, faculty_id, group_code) values
  ('MATH101', 'แคลคูลัสพื้นฐาน', 'sci', 'MATH'),
  ('MATH102', 'แคลคูลัส 1', 'sci', 'MATH'),
  ('MATH103', 'แคลคูลัส 2', 'sci', 'MATH'),
  ('MATH216', 'พีชคณิตเชิงเส้น', 'sci', 'MATH'),
  ('MA211',   'สถิติเบื้องต้น', 'sci', 'MATH'),
  ('PHY101',  'ฟิสิกส์ 1', 'sci', 'SCI'),
  ('PHY102',  'ฟิสิกส์ 2', 'sci', 'SCI'),
  ('CHM103',  'เคมีพื้นฐาน', 'sci', 'SCI'),
  ('BIO101',  'ชีววิทยาทั่วไป', 'sci', 'SCI'),
  ('CS101',   'ความรู้พื้นฐานคอมพิวเตอร์', 'sci', 'CS'),
  ('CS102',   'การเขียนโปรแกรมเบื้องต้น', 'sci', 'CS'),
  ('CS213',   'โครงสร้างข้อมูล', 'sci', 'CS'),
  ('CS261',   'วิศวกรรมซอฟต์แวร์เบื้องต้น', 'sci', 'CS'),
  ('CS284',   'ระบบฐานข้อมูล', 'sci', 'CS'),
  ('TU100',   'พลเมืองกับความรับผิดชอบต่อสังคม', null, 'GEN'),
  ('TU101',   'โลก อาเซียน และไทย', null, 'GEN'),
  ('TU102',   'ทักษะชีวิตทางสังคม', null, 'GEN'),
  ('TU103',   'ชีวิตกับความยั่งยืน', null, 'GEN'),
  ('TU104',   'สังคมกับการใช้เหตุผล', null, 'GEN'),
  ('TU105',   'ทักษะการสื่อสารด้วยภาษาอังกฤษ', null, 'ENG'),
  ('TU106',   'ความคิดสร้างสรรค์และการสื่อสาร', null, 'GEN'),
  ('EL070',   'ภาษาอังกฤษพื้นฐาน 1', 'arts', 'ENG'),
  ('EL171',   'ภาษาอังกฤษ 1', 'arts', 'ENG'),
  ('EL172',   'ภาษาอังกฤษ 2', 'arts', 'ENG'),
  ('ENG230',  'การอ่านเชิงวิชาการ', 'arts', 'ENG'),
  ('AC201',   'การบัญชีชั้นต้น', 'comm', 'BUS'),
  ('FN201',   'การเงินธุรกิจ', 'comm', 'BUS'),
  ('MK201',   'หลักการตลาด', 'comm', 'BUS'),
  ('EC210',   'เศรษฐศาสตร์จุลภาค', 'econ', 'ECON'),
  ('EC211',   'เศรษฐศาสตร์มหภาค', 'econ', 'ECON'),
  ('LA200',   'กฎหมายแพ่งหลักทั่วไป', 'law', 'LAW'),
  ('LA201',   'กฎหมายอาญาภาคทั่วไป', 'law', 'LAW'),
  ('EG101',   'กลศาสตร์วิศวกรรม', 'engr', 'ENGR'),
  ('EG102',   'เขียนแบบวิศวกรรม', 'engr', 'ENGR')
on conflict (code) do update set
  name_th    = excluded.name_th,
  faculty_id = excluded.faculty_id,
  group_code = excluded.group_code;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments',
  'attachments',
  true,
  52428800,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists attachments_public_read on storage.objects;
create policy attachments_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'attachments');

create table if not exists files (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references profiles(id) on delete cascade,
  bucket         text not null default 'attachments',
  storage_path   text not null unique,
  public_url     text not null,
  file_name      text not null,
  mime_type      text not null,
  size_bytes     bigint not null check (size_bytes > 0 and size_bytes <= 52428800),
  kind           text not null default 'file' check (kind in ('file', 'image')),
  download_count int not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists files_owner_idx   on files(owner_id);
create index if not exists files_created_idx on files(created_at desc);
alter table files enable row level security;
revoke all on table files from anon, authenticated;

create table if not exists posts (
  id                  uuid primary key default gen_random_uuid(),
  author_id           uuid not null references profiles(id) on delete cascade,
  tag                 text not null default 'sheet' check (tag in ('sheet', 'studybuddy', 'qa', 'poll', 'announce', 'general')),
  visibility          text not null default 'public' check (visibility in ('public', 'close', 'private')),
  announce_until      timestamptz,
  title               text,
  body                text not null default '',
  subject_code        text references subjects(code) on delete set null,
  faculty_id          text references faculties(id) on delete set null,
  meet_at             timestamptz,
  meet_place          text,
  capacity            int,
  requires_approval   bool not null default false,
  ended_at            timestamptz,
  chat_expires_at     timestamptz,
  conversation_id     uuid,
  accepted_comment_id uuid,
  like_count          int not null default 0,
  comment_count       int not null default 0,
  share_count         int not null default 0,
  is_pinned           bool not null default false,
  is_hidden           bool not null default false,
  created_at          timestamptz not null default now()
);

create index if not exists posts_author_idx  on posts(author_id, created_at desc);
create index if not exists posts_tag_idx     on posts(tag, created_at desc);
create index if not exists posts_subject_idx on posts(subject_code, created_at desc);
create index if not exists posts_faculty_idx on posts(faculty_id, created_at desc);
create index if not exists posts_created_idx on posts(created_at desc);
alter table posts enable row level security;
revoke all on table posts from anon, authenticated;

create table if not exists post_attachments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts(id) on delete cascade,
  file_id     uuid not null references files(id) on delete cascade,
  kind        text not null default 'file' check (kind in ('file', 'image')),
  file_name   text not null,
  mime_type   text,
  size_bytes  bigint not null default 0,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  unique (post_id, file_id)
);

create index if not exists post_attachments_post_idx on post_attachments(post_id, sort_order);
create index if not exists post_attachments_file_idx on post_attachments(file_id);
alter table post_attachments enable row level security;
revoke all on table post_attachments from anon, authenticated;

create table if not exists star_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  post_id     uuid references posts(id) on delete set null,
  reason      text not null,
  delta       int not null,
  created_at  timestamptz not null default now()
);

create index if not exists star_events_user_idx on star_events(user_id, created_at desc);
alter table star_events enable row level security;
revoke all on table star_events from anon, authenticated;

notify pgrst, 'reload schema';