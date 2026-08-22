-- Escape hatches. Nothing here needs to be run in the happy path.
--
-- The SQL editor runs as postgres and bypasses RLS, so you can always get back in
-- from here even when the app shows you nothing.

-- ---------------------------------------------------------------------------
-- 1. Diagnose: what does the database think of your login?
-- ---------------------------------------------------------------------------

-- Does a recent session row exist at all?
--   select id, created_at, not_after from auth.sessions order by created_at desc limit 5;

-- Who is on the allowlist?
--   select space_id, email, role from space_members order by space_id;

-- Any space nobody owns? (must return zero rows)
--   select s.id, s.name from spaces s
--     left join space_members m on m.space_id = s.id and m.role = 'owner'
--    where m.id is null;

-- ---------------------------------------------------------------------------
-- 2. Neuter just the 24h check, keeping the allowlist.
--
-- Use this if the app goes blank right after applying 003 and you suspect the
-- `session_id` claim is missing on this Supabase version. Policies stay in force;
-- only the freshness gate stops applying. Sessions then live as long as Supabase
-- keeps refreshing them.
-- ---------------------------------------------------------------------------

-- create or replace function public.session_is_fresh() returns boolean
-- language sql stable as $$ select true $$;

-- To restore the 24h limit afterwards, re-run 002_rls_helpers.sql.

-- ---------------------------------------------------------------------------
-- 3. Grant yourself access to a space you cannot see.
-- ---------------------------------------------------------------------------

-- insert into space_members (space_id, email, role)
-- values ('shreyanshi', lower('you@gmail.com'), 'owner')
-- on conflict (space_id, email) do update set role = 'owner';

-- ---------------------------------------------------------------------------
-- 4. Full rollback: turn RLS back off everywhere.
--
-- This reopens the database to anyone holding the anon key -- it is a debugging
-- step, not a resting state.
-- ---------------------------------------------------------------------------

-- do $$
-- declare t text;
-- begin
--   for t in select tablename from pg_tables where schemaname = 'public'
--   loop
--     execute format('alter table %I disable row level security', t);
--   end loop;
-- end $$;

-- ---------------------------------------------------------------------------
-- 5. Undo 005_symbols_and_done.sql.
--
-- Drops the per-task symbol, the completion stamp, and persisted time-block
-- completion. The app falls back to category emoji and loses done-state on
-- reload again, so only run this if 005 caused a problem.
-- ---------------------------------------------------------------------------

-- alter table tasks       drop column if exists emoji;
-- alter table tasks       drop column if exists completed_at;
-- alter table time_blocks drop column if exists done;
