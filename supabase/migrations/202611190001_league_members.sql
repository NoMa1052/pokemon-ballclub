-- Store a league-specific player key and the screen name on the posted result.
-- The insert trigger reads only the signed-in player's own profile under normal RLS.
alter table public.ballclub_scores add column league_players jsonb;
alter table public.ballclub_series add column league_players jsonb;

create function public.ballclub_stamp_player() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare owner_id uuid := auth.uid();
begin
  new.league_players := null;
  if owner_id is not null and cardinality(new.leagues) > 0 then
    select jsonb_object_agg(code, jsonb_build_object('key',md5(code || owner_id::text),'name',p.screen_name))
      into new.league_players
      from public.ballclub_profiles p cross join unnest(new.leagues) as l(code)
      where p.user_id = owner_id and code is not null;
  end if;
  return new;
end $$;

create trigger stamp_league_player before insert on public.ballclub_scores
for each row execute function public.ballclub_stamp_player();
create trigger stamp_league_player before insert on public.ballclub_series
for each row execute function public.ballclub_stamp_player();

-- Attribute existing league posts only when exactly one account links the device.
with owners as (
  select d.device,min(p.user_id::text) owner,min(p.screen_name) handle
  from public.ballclub_profiles p cross join lateral jsonb_array_elements_text(to_jsonb(p.devices)) d(device)
  group by d.device having count(distinct p.user_id) = 1
)
update public.ballclub_scores r set league_players = (
  select jsonb_object_agg(code,jsonb_build_object('key',md5(code || o.owner),'name',o.handle))
  from unnest(r.leagues) l(code) where code is not null
) from owners o where r.device = o.device and cardinality(r.leagues) > 0;
with owners as (
  select d.device,min(p.user_id::text) owner,min(p.screen_name) handle
  from public.ballclub_profiles p cross join lateral jsonb_array_elements_text(to_jsonb(p.devices)) d(device)
  group by d.device having count(distinct p.user_id) = 1
)
update public.ballclub_series r set league_players = (
  select jsonb_object_agg(code,jsonb_build_object('key',md5(code || o.owner),'name',o.handle))
  from unnest(r.leagues) l(code) where code is not null
) from owners o where r.device = o.device and cardinality(r.leagues) > 0;