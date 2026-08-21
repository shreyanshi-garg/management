-- Google auth + per-space allowlist: schema.
-- Run this in the Supabase SQL editor (superuser, bypasses RLS).
-- Already applied if `space_members` exists; every statement is idempotent.

create table if not exists space_members (
  id         uuid primary key default gen_random_uuid(),
  space_id   text not null references spaces(id) on delete cascade,
  email      text not null,
  role       text not null default 'member' check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  unique (space_id, email)
);

create index if not exists space_members_email_idx on space_members (email);

-- Membership for the pre-existing spaces. Emails MUST be the real Google
-- addresses, lowercased -- that is what auth.jwt() ->> 'email' contains, and the
-- comparison in is_space_member() is literal. Once RLS is on (002), a space with
-- no matching member row is invisible to everyone.
--
-- This backfill has already been applied to the live project with the real
-- addresses. It is left here as a template rather than a record of who owns what,
-- so that rebuilding from scratch is possible without this file naming anyone.
-- Substitute the real Google addresses before running it on a fresh database.
--
insert into space_members (space_id, email, role) values
  ('shreyanshi', lower('OWNER_ADDRESS@gmail.com'), 'owner'),
  ('sambhav',    lower('OWNER_ADDRESS@gmail.com'), 'owner')
on conflict (space_id, email) do nothing;

-- To correct an address that was seeded wrong:
--   update space_members set email = lower('REAL_ADDRESS@gmail.com') where space_id = 'shreyanshi';

-- Must return zero rows before applying 002, or that space is unreachable.
--   select s.id, s.name from spaces s
--     left join space_members m on m.space_id = s.id and m.role = 'owner'
--    where m.id is null;

-- The client-side password gate and its OTP recovery flow are gone; Google auth
-- replaces them. The hash was shipped to every browser before any check anyway.
alter table spaces drop column if exists password_hash;
alter table spaces drop column if exists recovery_email;
drop table if exists space_otps;
