-- Voice Passport database setup
-- Run this whole file in Supabase Dashboard > SQL Editor.
-- IMPORTANT: also enable Authentication > Providers > Anonymous Sign-Ins.

create extension if not exists pgcrypto;

create table if not exists public.students (
  id uuid primary key,
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 80),
  student_code text not null check (char_length(student_code) between 1 and 80),
  class_name text not null check (char_length(class_name) between 1 and 80),
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.checkin_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  booth_slug text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id)
);

create unique index if not exists one_pending_checkin_per_booth_idx
on public.checkin_requests(student_id, booth_slug)
where status = 'pending';

create table if not exists public.stamps (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  booth_slug text not null,
  confirmed_at timestamptz not null default now(),
  confirmed_by uuid not null references auth.users(id),
  unique(student_id, booth_slug)
);

create index if not exists checkin_requests_status_idx on public.checkin_requests(status, requested_at);
create index if not exists stamps_student_idx on public.stamps(student_id, confirmed_at);

alter table public.students enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.checkin_requests enable row level security;
alter table public.stamps enable row level security;

-- Helper used by policies.
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

-- Student rows: anonymous-auth student owns exactly their row; teachers may read all.
drop policy if exists "student can insert own profile" on public.students;
create policy "student can insert own profile" on public.students
for insert to authenticated
with check (auth_user_id = auth.uid());

drop policy if exists "student or teacher can read profiles" on public.students;
create policy "student or teacher can read profiles" on public.students
for select to authenticated
using (auth_user_id = auth.uid() or public.is_teacher());

-- Teacher profile: user can only read their own marker row.
drop policy if exists "teacher can read own profile" on public.teacher_profiles;
create policy "teacher can read own profile" on public.teacher_profiles
for select to authenticated
using (user_id = auth.uid());

-- Check-in requests: student can insert/read their own; teacher can read every pending request.
drop policy if exists "student can submit own checkin" on public.checkin_requests;
create policy "student can submit own checkin" on public.checkin_requests
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

-- Stamps: student can read their own; teacher can read all. No direct client writes.
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

-- Teacher decision function performs the protected write and issues the stamp.
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
    raise exception 'Not authorized as a teacher';
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
    values(req.student_id, req.booth_slug, auth.uid())
    on conflict (student_id, booth_slug) do nothing;
  end if;
end;
$$;

revoke all on function public.teacher_decide_checkin(uuid, text) from public;
grant execute on function public.teacher_decide_checkin(uuid, text) to authenticated;

-- Realtime for automatic student/teacher page updates.
-- If Supabase reports this table is already in the publication, you can ignore that message.
alter publication supabase_realtime add table public.checkin_requests;
