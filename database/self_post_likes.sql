create or replace function public.toggle_self_post_like(
  p_post_id uuid,
  p_user_id uuid,
  p_liked boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  post_author_id uuid;
  next_like_count integer;
  like_changed boolean := false;
begin
  select author_id, like_count
  into post_author_id, next_like_count
  from public.posts
  where id = p_post_id
  for update;

  if not found then
    raise exception using message = 'post_not_found';
  end if;

  if post_author_id <> p_user_id then
    raise exception using message = 'not_own_post';
  end if;

  if p_liked then
    insert into public.post_likes (post_id, user_id)
    values (p_post_id, p_user_id)
    on conflict do nothing;
    like_changed := found;
  else
    delete from public.post_likes
    where post_id = p_post_id
      and user_id = p_user_id;
    like_changed := found;
  end if;

  if like_changed then
    update public.posts
    set like_count = greatest(like_count + case when p_liked then 1 else -1 end, 0)
    where id = p_post_id
    returning like_count into next_like_count;
  end if;

  return jsonb_build_object(
    'liked', p_liked,
    'changed', like_changed,
    'like_count', next_like_count
  );
end;
$$;

revoke all on function public.toggle_self_post_like(uuid, uuid, boolean)
from public, anon, authenticated;

grant execute on function public.toggle_self_post_like(uuid, uuid, boolean)
to service_role;

notify pgrst, 'reload schema';
