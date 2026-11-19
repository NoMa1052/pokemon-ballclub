-- Guests can play and post global results. League participation requires a session.
alter policy "ballclub leagues create" on public.ballclub_leagues to authenticated;

create or replace function public.ballclub_stamp_player() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare owner_id uuid := auth.uid();
begin
  new.league_players := null;
  if owner_id is null and cardinality(new.leagues) > 0 then
    new.leagues := '{}';
  elsif cardinality(new.leagues) > 0 then
    select jsonb_object_agg(code, jsonb_build_object('key',md5(code || owner_id::text),'name',p.screen_name))
      into new.league_players
      from public.ballclub_profiles p cross join unnest(new.leagues) as l(code)
      where p.user_id = owner_id and code is not null;
  end if;
  return new;
end $$;