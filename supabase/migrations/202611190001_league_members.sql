-- Look up public standings identities without granting access to private profiles.
create or replace function public.ballclub_league_members(league_code text)
returns table(device text, member_key text, screen_name text)
language sql stable security definer set search_path = ''
as $$
 with posted as (
   select s.device::text from public.ballclub_scores s
   where league_code ~ '^[A-Z2-9]{5}$' and league_code = any(s.leagues)
   union
   select r.device::text from public.ballclub_series r
   where league_code ~ '^[A-Z2-9]{5}$' and league_code = any(r.leagues)
 ), linked as (
   select distinct d.device, p.user_id::text as owner, p.screen_name::text as handle
   from public.ballclub_profiles p
   cross join lateral jsonb_array_elements_text(to_jsonb(p.devices)) d(device)
   join posted on posted.device = d.device
 )
 select device, 'account:' || md5(league_code || min(owner)), min(handle)
 from linked group by device having count(*) = 1
$$;
revoke all on function public.ballclub_league_members(text) from public;
grant execute on function public.ballclub_league_members(text) to anon, authenticated;
