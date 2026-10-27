alter table profiles
  add column if not exists username_changed_at timestamptz;

create or replace function public.update_profile_edit(
  p_user_id uuid,
  p_display_name text,
  p_username text,
  p_bio text,
  p_avatar_url text,
  p_update_avatar boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_profile profiles%rowtype;
begin
  select * into current_profile
  from profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception using message = 'profile_not_found';
  end if;
  if current_profile.is_suspended then
    raise exception using message = 'profile_suspended';
  end if;
  if char_length(btrim(coalesce(p_display_name, ''))) not between 1 and 40 then
    raise exception using message = 'invalid_display_name';
  end if;
  if coalesce(p_username, '') !~ '^[a-z0-9._]{3,30}$' then
    raise exception using message = 'invalid_username';
  end if;
  if p_bio is not null and char_length(p_bio) > 300 then
    raise exception using message = 'invalid_bio';
  end if;
  if p_username <> current_profile.username
    and current_profile.username_changed_at > clock_timestamp() - interval '15 days'
  then
    raise exception using message = 'username_cooldown';
  end if;

  update profiles
  set display_name = btrim(p_display_name),
      username = p_username,
      username_changed_at = case
        when p_username <> current_profile.username then clock_timestamp()
        else current_profile.username_changed_at
      end,
      bio = p_bio,
      avatar_url = case when p_update_avatar then p_avatar_url else avatar_url end
  where id = p_user_id
  returning * into current_profile;

  return jsonb_build_object(
    'username', current_profile.username,
    'display_name', current_profile.display_name,
    'bio', current_profile.bio,
    'avatar_url', current_profile.avatar_url,
    'username_changed_at', current_profile.username_changed_at
  );
end;
$$;

revoke all on function public.update_profile_edit(uuid, text, text, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.update_profile_edit(uuid, text, text, text, text, boolean)
  to service_role;

notify pgrst, 'reload schema';
