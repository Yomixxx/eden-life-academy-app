-- Per-level Google Meet links for the three ELA classes (100/200/300), with a
-- manual "go live" toggle admins flip when they actually start the meeting,
-- and a self-reported attendance log students can only insert into while
-- their level is live.

create table if not exists public.class_links (
  level text primary key check (level in ('100', '200', '300')),
  meet_url text,
  schedule_label text,
  is_live boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.class_links (level, schedule_label) values
  ('100', 'Saturdays 8:30–9:30AM'),
  ('200', 'Saturdays 8:30–9:30AM'),
  ('300', 'Saturdays 8:30–9:30AM')
on conflict (level) do nothing;

alter table public.class_links enable row level security;

create policy "Anyone authenticated can view class links"
  on public.class_links for select
  to authenticated
  using (true);

create policy "Admins can manage class links"
  on public.class_links for all
  using (is_admin())
  with check (is_admin());

create table if not exists public.class_attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  level text not null references public.class_links(level),
  class_date date not null default current_date,
  marked_at timestamptz not null default now(),
  unique (user_id, level, class_date)
);

alter table public.class_attendance enable row level security;

create policy "Users can view own attendance"
  on public.class_attendance for select
  using (user_id = auth.uid());

create policy "Admins can view all attendance"
  on public.class_attendance for select
  using (is_admin());

create policy "Users can self-report attendance while their class is live"
  on public.class_attendance for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.class_links cl
      where cl.level = class_attendance.level and cl.is_live
    )
    and exists (
      select 1 from public.enrollments e
      where e.user_id = auth.uid() and e.academy_level = class_attendance.level
    )
  );
