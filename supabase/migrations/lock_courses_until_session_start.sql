-- Adds a manual lock switch to courses so lesson content stays inaccessible
-- until the admin flips it once the live session actually begins.
-- Registration/enrollment is unaffected — only lesson content and progress
-- writes are gated. Defaults to locked (true) for existing and new courses.

alter table public.courses
  add column is_locked boolean not null default true;

drop policy if exists "Enrolled users can view lessons" on public.lessons;
create policy "Enrolled users can view lessons" on public.lessons
for select
using (
  is_published = true
  and exists (
    select 1 from public.enrollments e
    where e.course_id = lessons.course_id and e.user_id = auth.uid()
  )
  and exists (
    select 1 from public.courses c
    where c.id = lessons.course_id and c.is_locked = false
  )
);

-- Defense in depth: block lesson-progress writes for a locked course even
-- via a direct API call that bypasses the client-side lock UI.
drop policy if exists "Users can update own progress" on public.lesson_progress;
create policy "Users can update own progress" on public.lesson_progress
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.courses c
    where c.id = lesson_progress.course_id and c.is_locked = false
  )
);

drop policy if exists "Users can modify own progress" on public.lesson_progress;
create policy "Users can modify own progress" on public.lesson_progress
for update
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.courses c
    where c.id = lesson_progress.course_id and c.is_locked = false
  )
);
