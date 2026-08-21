-- Google auth + per-space allowlist: the policies themselves.
-- Run in the Supabase SQL editor AFTER 002, and only once the pre-flight test at
-- the bottom of 002 reports ok = true.
--
-- Effect: the anon key stops being a skeleton key. An unauthenticated request sees
-- nothing at all; a signed-in request sees only rows belonging to spaces its email
-- is a member of, and only for the first 24h after it actually logged in.
--
-- Locked out? See 004_rollback.sql -- the SQL editor bypasses RLS, so recovery is
-- always possible from here.

alter table spaces enable row level security;

drop policy if exists spaces_select on spaces;
create policy spaces_select on spaces for select to authenticated
  using (public.is_space_member(id));

-- Anyone signed in may create a space; the trigger immediately makes them its
-- owner, so this cannot be used to write into someone else's space.
drop policy if exists spaces_insert on spaces;
create policy spaces_insert on spaces for insert to authenticated
  with check (true);

drop policy if exists spaces_update on spaces;
create policy spaces_update on spaces for update to authenticated
  using (public.is_space_owner(id)) with check (public.is_space_owner(id));

drop policy if exists spaces_delete on spaces;
create policy spaces_delete on spaces for delete to authenticated
  using (public.is_space_owner(id));

alter table space_members enable row level security;

-- Members can see who else is in their spaces; only owners can change the list.
drop policy if exists members_select on space_members;
create policy members_select on space_members for select to authenticated
  using (public.is_space_member(space_id));

drop policy if exists members_write on space_members;
create policy members_write on space_members for all to authenticated
  using (public.is_space_owner(space_id))
  with check (public.is_space_owner(space_id));

-- ---------------------------------------------------------------------------
-- The ten tables that carry space_id directly
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'tasks', 'goals', 'habits', 'health_logs', 'nutrition_logs',
    'time_blocks', 'expenses', 'expense_categories', 'money_lent', 'money_settings'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_all', t);
    execute format(
      'create policy %I on %I for all to authenticated
         using (public.is_space_member(space_id))
         with check (public.is_space_member(space_id))',
      t || '_all', t
    );
    -- Every policy check filters on space_id.
    execute format('create index if not exists %I on %I (space_id)', t || '_space_id_idx', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- The four tables that reach space_id through a parent FK
--
-- These matter for reads, not just writes: the app fetches them as embedded
-- selects (`select('*, goal_milestones(*)')` etc), and embedded rows are filtered
-- by the child's own policy -- so a missing policy here silently returns goals
-- with no milestones rather than an error.
--
-- No cycles: the parent lookups resolve through is_space_member(), which is
-- security definer and reads nothing RLS-protected.
-- ---------------------------------------------------------------------------

do $$
declare
  child  text;
  parent text;
  fk     text;
  pairs  text[][] := array[
    ['goal_milestones',       'goals',              'goal_id'],
    ['expense_subcategories', 'expense_categories', 'category_id'],
    ['money_lent_repayments', 'money_lent',         'lent_id'],
    ['time_logs',             'time_blocks',        'time_block_id']
  ];
  i int;
begin
  for i in 1 .. array_length(pairs, 1) loop
    child  := pairs[i][1];
    parent := pairs[i][2];
    fk     := pairs[i][3];

    execute format('alter table %I enable row level security', child);
    execute format('drop policy if exists %I on %I', child || '_all', child);
    execute format(
      'create policy %I on %I for all to authenticated
         using (exists (select 1 from %I p
                         where p.id = %I.%I and public.is_space_member(p.space_id)))
         with check (exists (select 1 from %I p
                              where p.id = %I.%I and public.is_space_member(p.space_id)))',
      child || '_all', child,
      parent, child, fk,
      parent, child, fk
    );
    execute format('create index if not exists %I on %I (%I)', child || '_' || fk || '_idx', child, fk);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Verify: this must return zero rows.
-- Cross-check in the dashboard at Database -> Advisors -> Security.
-- ---------------------------------------------------------------------------
--   select tablename from pg_tables
--    where schemaname = 'public' and rowsecurity = false;
