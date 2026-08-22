-- 005_symbols_and_done.sql
--
-- Three additive columns. Existing RLS policies are table-wide, so nothing
-- here needs a policy change.
--
--   tasks.emoji        — per-task symbol. Holds an emoji, a kaomoji, or a
--                        128px data-URL for a custom image.
--   tasks.completed_at — when a task moved into 'done'. Cleared when it
--                        moves back out.
--   time_blocks.done   — real, persisted completion. Previously the ✓ button
--                        wrote a `progress` field that mapped to no column,
--                        so it never survived a reload.
--
-- Apply by pasting into the Supabase SQL editor.

alter table tasks       add column if not exists emoji text;
alter table tasks       add column if not exists completed_at timestamptz;
alter table time_blocks add column if not exists done boolean not null default false;

-- Backfill: anything already marked done gets a completion stamp so it does
-- not vanish from the task history browser.
update tasks set completed_at = coalesce(completed_at, created_at)
where status = 'done' and completed_at is null;
