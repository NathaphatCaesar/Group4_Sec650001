
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  type text not null check (
    type in (
      'like', 'comment', 'reply', 'follow', 'mention',
      'answer_accepted', 'study_reminder', 'study_signup',
      'study_approved', 'study_rejected', 'study_ended',
      'report_resolved', 'star_awarded', 'message',
      'follow_request', 'follow_accepted', 'announce'
    )
  ),
  post_id uuid references posts(id) on delete cascade,
  comment_id uuid,
  conversation_id uuid,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
  on notifications (recipient_id, created_at desc);

create index if not exists notifications_unread_idx
  on notifications (recipient_id, created_at desc)
  where read_at is null;

alter table notifications enable row level security;

revoke all on table notifications from anon, authenticated;
