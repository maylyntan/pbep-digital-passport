-- Kaplan "Find Your Voice" — My Voice Passport
-- Run this whole file in Supabase Dashboard > SQL Editor.
--
-- Before students can register, also enable:
--   Authentication > Providers > Anonymous Sign-Ins
--
-- The whole file is idempotent: re-run it any time to apply changes. The SQL
-- editor runs it as a single transaction, so any error rolls back everything —
-- if a run fails, nothing was half-applied.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per student passport.
create table if not exists public.students (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid not null unique references auth.users(id) on delete cascade,
  student_name    text not null check (char_length(student_name) between 1 and 80),
  -- School ID: the letters CT followed by digits, e.g. CT1234. Stored uppercase.
  student_id      text not null check (student_id ~ '^CT[0-9]+$'),
  class_name      text not null check (char_length(class_name) between 1 and 40),
  -- Personal learning record
  reflection      text check (char_length(reflection) <= 1000),
  new_vocabulary  text check (char_length(new_vocabulary) <= 1000),
  favourite_booth text check (char_length(favourite_booth) <= 120),
  speaking_goal   text check (char_length(speaking_goal) <= 300),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Marks an auth user as a facilitator. Created only by /api/teacher/claim.
create table if not exists public.teacher_profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

-- Student taps "Request my stamp" -> pending row for a facilitator to decide.
create table if not exists public.checkin_requests (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students(id) on delete cascade,
  booth_slug   text not null,
  status       text not null default 'pending'
               check (status in ('pending', 'confirmed', 'rejected')),
  requested_at timestamptz not null default now(),
  decided_at   timestamptz,
  decided_by   uuid references auth.users(id)
);

create unique index if not exists one_pending_checkin_per_booth_idx
  on public.checkin_requests(student_id, booth_slug)
  where status = 'pending';

create index if not exists checkin_requests_status_idx
  on public.checkin_requests(status, requested_at);

-- Confirmed stamps. Written only by teacher_decide_checkin().
create table if not exists public.stamps (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students(id) on delete cascade,
  booth_slug   text not null,
  confirmed_at timestamptz not null default now(),
  confirmed_by uuid not null references auth.users(id),
  unique(student_id, booth_slug)
);

create index if not exists stamps_student_idx
  on public.stamps(student_id, confirmed_at);

-- One passport per school ID, compared case-insensitively.
create unique index if not exists students_student_id_key
  on public.students (upper(student_id));

-- ---------------------------------------------------------------------------
-- Upgrades for projects created before the school ID was required
-- ---------------------------------------------------------------------------
-- Safe to re-run. If the ALTERs fail, existing rows break the new rules —
-- fix or delete those rows first (during setup the table is normally empty).

alter table public.students alter column student_id set not null;

alter table public.students drop constraint if exists students_student_id_format;
alter table public.students
  add constraint students_student_id_format check (student_id ~ '^CT[0-9]+$');

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.students enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.checkin_requests enable row level security;
alter table public.stamps enable row level security;

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.teacher_profiles where user_id = auth.uid());
$$;

revoke all on function public.is_teacher() from public;
grant execute on function public.is_teacher() to authenticated;

-- Students -------------------------------------------------------------------

drop policy if exists "student can insert own passport" on public.students;
create policy "student can insert own passport" on public.students
for insert to authenticated
with check (auth_user_id = auth.uid());

drop policy if exists "student or teacher can read passports" on public.students;
create policy "student or teacher can read passports" on public.students
for select to authenticated
using (auth_user_id = auth.uid() or public.is_teacher());

-- Only the learning record is ever updated, and only by its owner.
drop policy if exists "student can update own passport" on public.students;
create policy "student can update own passport" on public.students
for update to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

-- Teacher profiles -----------------------------------------------------------

drop policy if exists "teacher can read own profile" on public.teacher_profiles;
create policy "teacher can read own profile" on public.teacher_profiles
for select to authenticated
using (user_id = auth.uid());

-- No insert/update/delete policy: rows are created by the service role only.

-- Check-in requests ----------------------------------------------------------

-- NOTE: the outer column is written as checkin_requests.student_id on purpose.
-- public.students has its own text column called student_id (the school ID), so
-- an unqualified `student_id` inside these subqueries resolves to students.student_id
-- and Postgres rejects the policy with "operator does not exist: uuid = text".

drop policy if exists "student can request own checkin" on public.checkin_requests;
create policy "student can request own checkin" on public.checkin_requests
for insert to authenticated
with check (
  status = 'pending'
  and decided_by is null
  and exists (
    select 1 from public.students s
    where s.id = checkin_requests.student_id and s.auth_user_id = auth.uid()
  )
);

drop policy if exists "student or teacher can read checkins" on public.checkin_requests;
create policy "student or teacher can read checkins" on public.checkin_requests
for select to authenticated
using (
  exists (
    select 1 from public.students s
    where s.id = checkin_requests.student_id and s.auth_user_id = auth.uid()
  )
  or public.is_teacher()
);

-- No update policy: decisions go through teacher_decide_checkin().

-- Stamps ---------------------------------------------------------------------

-- Same qualification rule as above: stamps.student_id, never bare student_id.
drop policy if exists "student or teacher can read stamps" on public.stamps;
create policy "student or teacher can read stamps" on public.stamps
for select to authenticated
using (
  exists (
    select 1 from public.students s
    where s.id = stamps.student_id and s.auth_user_id = auth.uid()
  )
  or public.is_teacher()
);

-- No insert/update/delete policy at all: students can never issue a stamp.

-- ---------------------------------------------------------------------------
-- Facilitator decision
-- ---------------------------------------------------------------------------

create or replace function public.teacher_decide_checkin(request_id uuid, decision text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.checkin_requests%rowtype;
begin
  if not public.is_teacher() then
    raise exception 'Not authorised as a facilitator';
  end if;

  if decision not in ('confirmed', 'rejected') then
    raise exception 'Invalid decision';
  end if;

  select * into req from public.checkin_requests where id = request_id for update;
  if req.id is null then raise exception 'Request not found'; end if;
  if req.status <> 'pending' then raise exception 'Request already decided'; end if;

  update public.checkin_requests
     set status = decision, decided_at = now(), decided_by = auth.uid()
   where id = request_id;

  if decision = 'confirmed' then
    insert into public.stamps(student_id, booth_slug, confirmed_by)
    values (req.student_id, req.booth_slug, auth.uid())
    on conflict (student_id, booth_slug) do nothing;
  end if;
end;
$$;

revoke all on function public.teacher_decide_checkin(uuid, text) from public;
grant execute on function public.teacher_decide_checkin(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Returning students
-- ---------------------------------------------------------------------------
-- A student on a new device gets a new anonymous session, so RLS hides their
-- existing passport. This function re-links the passport to the current device
-- when the school ID is found AND the first name matches, so a student cannot
-- take over someone else's record by guessing their CT number.
--
-- Returns the passport row, or null when the school ID has never been used.

create or replace function public.claim_passport(
  p_student_id   text,
  p_student_name text
)
returns public.students
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.students%rowtype;
begin
  if auth.uid() is null then
    raise exception 'NOT_SIGNED_IN';
  end if;

  select * into rec
    from public.students
   where upper(student_id) = upper(trim(p_student_id))
     for update;

  -- Unknown school ID: the caller should register a new passport.
  if rec.id is null then
    return null;
  end if;

  if lower(trim(rec.student_name)) is distinct from lower(trim(p_student_name)) then
    raise exception 'NAME_MISMATCH';
  end if;

  if rec.auth_user_id <> auth.uid() then
    -- This device must not already be linked to a different passport.
    if exists (
      select 1 from public.students s
       where s.auth_user_id = auth.uid() and s.id <> rec.id
    ) then
      raise exception 'DEVICE_HAS_PASSPORT';
    end if;

    update public.students
       set auth_user_id = auth.uid(), updated_at = now()
     where id = rec.id
      returning * into rec;
  end if;

  return rec;
end;
$$;

revoke all on function public.claim_passport(text, text) from public;
grant execute on function public.claim_passport(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

-- Adding a table that is already published raises 42710, which would abort the
-- whole script, so only add what is missing.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'checkin_requests'
  ) then
    alter publication supabase_realtime add table public.checkin_requests;
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'stamps'
  ) then
    alter publication supabase_realtime add table public.stamps;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Granting facilitator access
-- ---------------------------------------------------------------------------
-- Facilitators cannot sign themselves up. For each one:
--
--   1. Authentication > Users > Add user
--        Email:    their school email
--        Password: the shared festival access code
--        Tick "Auto Confirm User"
--
--   2. Run the statement below with their email to authorise the account.
--      Without this row they can sign in but see "Not a facilitator account".
--
-- insert into public.teacher_profiles (user_id, display_name)
-- select id, coalesce(raw_user_meta_data ->> 'name', email)
--   from auth.users
--  where email = 'facilitator@kaplan.edu.sg'
--     on conflict (user_id) do nothing;
--
-- To authorise several at once, swap the where clause for:
--  where email in ('one@kaplan.edu.sg', 'two@kaplan.edu.sg');
--
-- To revoke access:
-- delete from public.teacher_profiles
--  where user_id = (select id from auth.users where email = 'facilitator@kaplan.edu.sg');
--
-- Also switch OFF Authentication > Providers > Email > "Allow new users to sign up",
-- so the access code alone cannot be used to create an account.
