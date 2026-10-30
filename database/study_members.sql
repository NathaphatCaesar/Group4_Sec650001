-- U14: สมาชิกนัดติว (study_members) ขอเข้าร่วม / อนุมัติ / ปฏิเสธ พร้อมตรวจจำนวนที่นั่ง
-- นัดติวคือโพสต์แท็ก studybuddy; posts.capacity = จำนวนที่นั่ง (null = ไม่จำกัด, ไม่นับเจ้าของ)
create table if not exists study_members (
  post_id     uuid not null references posts(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by  uuid references profiles(id) on delete set null,
  decided_at  timestamptz,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists study_members_post_status_idx on study_members(post_id, status);
create index if not exists study_members_user_idx        on study_members(user_id, created_at desc);

alter table study_members enable row level security;
revoke all on table study_members from anon, authenticated;

-- ที่นั่งต้องมีอย่างน้อย 1 ถ้าระบุ
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'posts_capacity_positive') then
    alter table posts add constraint posts_capacity_positive check (capacity is null or capacity > 0);
  end if;
end;
$$;

-- ขอเข้าร่วมนัดติว: ล็อกแถวโพสต์ก่อนนับที่นั่ง กันสองคนกดพร้อมกันแล้วเกินจำนวน
-- ถ้านัดติวไม่ต้องอนุมัติ จะได้สถานะ approved ทันที
create or replace function public.study_request_join(p_post_id uuid, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_post     posts%rowtype;
  v_existing study_members%rowtype;
  v_approved int;
  v_status   text;
begin
  if exists (select 1 from profiles where id = p_user_id and is_suspended) then
    raise exception using message = 'profile_suspended';
  end if;

  select * into v_post from posts where id = p_post_id for update;
  if not found or v_post.tag <> 'studybuddy' or v_post.is_hidden then
    raise exception using message = 'study_not_found';
  end if;
  if v_post.author_id = p_user_id then
    raise exception using message = 'study_is_owner';
  end if;
  if v_post.ended_at is not null or (v_post.meet_at is not null and v_post.meet_at < now()) then
    raise exception using message = 'study_closed';
  end if;

  select * into v_existing from study_members where post_id = p_post_id and user_id = p_user_id;
  if found then
    raise exception using message = case v_existing.status
      when 'rejected' then 'request_rejected'
      else 'already_requested'
    end;
  end if;

  select count(*) into v_approved from study_members where post_id = p_post_id and status = 'approved';
  if v_post.capacity is not null and v_approved >= v_post.capacity then
    raise exception using message = 'seats_full';
  end if;

  v_status := case when v_post.requires_approval then 'pending' else 'approved' end;
  insert into study_members (post_id, user_id, status, decided_at)
  values (p_post_id, p_user_id, v_status, case when v_status = 'approved' then now() end);

  return jsonb_build_object(
    'status', v_status,
    'owner_id', v_post.author_id,
    'title', v_post.title,
    'capacity', v_post.capacity,
    'signup_count', v_approved + (case when v_status = 'approved' then 1 else 0 end)
  );
end;
$$;

-- เจ้าของนัดติวอนุมัติ / ปฏิเสธคำขอที่รออยู่ (อนุมัติต้องยังมีที่นั่งว่าง)
create or replace function public.study_decide_request(
  p_post_id uuid,
  p_owner_id uuid,
  p_user_id uuid,
  p_approve boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_post     posts%rowtype;
  v_member   study_members%rowtype;
  v_approved int;
  v_status   text := case when p_approve then 'approved' else 'rejected' end;
begin
  select * into v_post from posts where id = p_post_id for update;
  if not found or v_post.tag <> 'studybuddy' then
    raise exception using message = 'study_not_found';
  end if;
  if v_post.author_id <> p_owner_id then
    raise exception using message = 'not_owner';
  end if;

  select * into v_member from study_members
  where post_id = p_post_id and user_id = p_user_id
  for update;
  if not found then
    raise exception using message = 'request_not_found';
  end if;
  if v_member.status <> 'pending' then
    raise exception using message = 'request_not_pending';
  end if;

  select count(*) into v_approved from study_members where post_id = p_post_id and status = 'approved';
  if p_approve then
    if v_post.ended_at is not null or (v_post.meet_at is not null and v_post.meet_at < now()) then
      raise exception using message = 'study_closed';
    end if;
    if v_post.capacity is not null and v_approved >= v_post.capacity then
      raise exception using message = 'seats_full';
    end if;
    v_approved := v_approved + 1;
  end if;

  update study_members
  set status = v_status, decided_by = p_owner_id, decided_at = now()
  where post_id = p_post_id and user_id = p_user_id;

  return jsonb_build_object(
    'status', v_status,
    'title', v_post.title,
    'capacity', v_post.capacity,
    'signup_count', v_approved
  );
end;
$$;

revoke all on function public.study_request_join(uuid, uuid) from public, anon, authenticated;
revoke all on function public.study_decide_request(uuid, uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.study_request_join(uuid, uuid) to service_role;
grant execute on function public.study_decide_request(uuid, uuid, uuid, boolean) to service_role;

notify pgrst, 'reload schema';
