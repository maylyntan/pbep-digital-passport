-- Kaplan "Find Your Voice" — My Voice Passport
-- Run this whole file in Supabase Dashboard > SQL Editor.
--
-- Before students can register, also enable:
--   Authentication > Providers > Anonymous Sign-Ins
-- The realtime publication statements at the bottom are safe to re-run; if
-- Supabase reports a table is already in the publication, ignore that message.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per student passport.
create table if not exists public.students (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid not null unique references auth.users(id) on delete cascade,
  student_name    text not null check (char_length(student_name) between 1 and 80),
  student_id      text check (char_length(student_id) <= 40),
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

drop policy if exists "student can request own checkin" on public.checkin_requests;
create policy "student can request own checkin" on public.checkin_requests
for insert to authenticated
with check (
  status = 'pending'
  and decided_by is null
  and exists (
    select 1 from public.students s
    where s.id = student_id and s.auth_user_id = auth.uid()
  )
);

drop policy if exists "student or teacher can read checkins" on public.checkin_requests;
create policy "student or teacher can read checkins" on public.checkin_requests
for select to authenticated
using (
  exists (
    select 1 from public.students s
    where s.id = student_id and s.auth_user_id = auth.uid()
  )
  or public.is_teacher()
);

-- No update policy: decisions go through teacher_decide_checkin().

-- Stamps ---------------------------------------------------------------------

drop policy if exists "student or teacher can read stamps" on public.stamps;
create policy "student or teacher can read stamps" on public.stamps
for select to authenticated
using (
  exists (
    select 1 from public.students s
    where s.id = student_id and s.auth_user_id = auth.uid()
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
-- Realtime
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.checkin_requests;
alter publication supabase_realtime add table public.stamps;
