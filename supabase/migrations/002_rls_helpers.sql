-- Google auth + per-space allowlist: row level security.
-- Run in the Supabase SQL editor AFTER 001, and after fixing the backfill emails.
--
-- Effect: the anon key stops being a skeleton key. An unauthenticated request sees
-- nothing at all; a signed-in request sees only rows belonging to spaces its email
-- is a member of, and only for the first 24h after it actually logged in.

-- ---------------------------------------------------------------------------
-- Helpers
--
-- These are `security definer` on purpose. A policy on space_members that queried
-- space_members would recurse infinitely; running as the function owner skips RLS
-- on the helper's own reads and breaks the cycle.
-- ---------------------------------------------------------------------------

create or replace function public.auth_email() returns text
language sql stable as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

-- 24h session cap, enforced in the database. Supabase access tokens carry a
-- `session_id` claim; auth.sessions.created_at is the real login time and is NOT
-- bumped by token refresh, so a refreshed token cannot extend the window. This
-- replaces the Pro-only "time-box user sessions" dashboard setting, and unlike a
-- client-side check it cannot be bypassed by a tampered client.
--
-- Verify the claim exists before trusting this -- if `session_id` is absent on
-- your Supabase version this returns false and locks everyone out:
--   select auth.jwt() ->> 'session_id';
create or replace function public.session_is_fresh() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from auth.sessions s
    where s.id = nullif(auth.jwt() ->> 'session_id', '')::uuid
      and s.created_at > now() - interval '24 hours'
  )
$$;

create or replace function public.is_space_member(p_space_id text) returns boolean
language sql security definer stable set search_path = public as $$
  select public.session_is_fresh() and exists (
    select 1 from space_members m
    where m.space_id = p_space_id and m.email = public.auth_email()
  )
$$;

create or replace function public.is_space_owner(p_space_id text) returns boolean
language sql security definer stable set search_path = public as $$
  select public.session_is_fresh() and exists (
    select 1 from space_members m
    where m.space_id = p_space_id
      and m.email = public.auth_email()
      and m.role = 'owner'
  )
$$;

-- ---------------------------------------------------------------------------
-- New spaces own themselves
--
-- Runs in the same transaction as the insert, so there is no window where a
-- freshly created space has no owner -- and the app never writes a member row.
-- ---------------------------------------------------------------------------

create or replace function public.claim_new_space() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into space_members (space_id, email, role)
  values (new.id, public.auth_email(), 'owner')
  on conflict (space_id, email) do nothing;
  return new;
end $$;

drop trigger if exists spaces_claim_owner on spaces;
create trigger spaces_claim_owner after insert on spaces
  for each row execute function public.claim_new_space();


-- ---------------------------------------------------------------------------
-- PRE-FLIGHT TEST -- run this before applying 003.
--
-- Nothing above enables RLS, so at this point the helpers exist but change
-- nothing. This block fakes a JWT for your most recent login and asks the
-- helpers what they would decide. If it reports ok = true, 003 is safe to run.
--
-- Note you cannot check this with a bare `select auth.jwt() ->> 'session_id'`:
-- the SQL editor runs as postgres with no JWT, so auth.jwt() is always null here.
-- Hence set_config, which is what PostgREST does per request.
--
-- Confirmed present on this project: the access token carries a `session_id`
-- claim, so session_is_fresh() has something real to check against.
-- ---------------------------------------------------------------------------

begin;

select set_config(
  'request.jwt.claims',
  json_build_object(
    'email',      lower('YOUR_ADDRESS@gmail.com'),
    'session_id', (select s.id::text from auth.sessions s order by s.created_at desc limit 1)
  )::text,
  true
);

select
  public.auth_email()                      as sees_email,
  public.session_is_fresh()                as session_fresh,
  public.is_space_member('shreyanshi')     as member_of_shreyanshi,
  public.is_space_owner('shreyanshi')      as owner_of_shreyanshi,
  (public.session_is_fresh()
     and public.is_space_member('shreyanshi')) as ok;

rollback;

-- All false with sees_email correct?  -> auth.sessions has no recent row; sign in again.
-- session_fresh true, member false?   -> the backfill email does not match. Fix 001.
-- sees_email empty?                   -> the claims block above did not apply.
