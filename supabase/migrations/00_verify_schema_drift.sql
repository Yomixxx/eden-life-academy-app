-- ============================================================================
-- Is Supabase actually in sync with the code? — one-shot diagnostic
-- ============================================================================
-- WHY THIS EXISTS
--   We have twice chased "the new UI isn't showing up" and found the real
--   cause was a stale Vercel production build, not the database. This script
--   answers the database half of the question in ~10 seconds so we stop
--   guessing: it compares the live schema against every table/column/function/
--   trigger/policy/bucket the app code actually reads and writes.
--
-- HOW TO RUN IT
--   Supabase dashboard → project `rpkxyuohbmbbzoqkulgn` → SQL Editor → paste
--   this whole file → Run. It is READ ONLY (no DDL, no writes) — safe to run
--   any time, including during a service.
--
-- HOW TO READ THE RESULT
--   * MISSING TABLES / MISSING COLUMNS / MISSING FUNCTIONS / MISSING TRIGGERS /
--     MISSING POLICIES / MISSING SEED ROWS → any row returned here is a real
--     drift bug. The "fix_hint" column tells you which file in
--     supabase/migrations/ to run to repair it.
--   * No rows returned from a section = that section is in sync.
--   * RLS DISABLED → the table is readable/writable by anyone with the anon
--     key. Fix immediately.
--   * The last statement prints a one-line VERDICT.
--
-- IMPORTANT: migrations in this repo are NOT applied automatically — there is
-- no CI step and no supabase/config.toml. Every .sql file here only takes
-- effect once a human runs it in the SQL Editor against production. That is
-- exactly how drift happens, so re-run this check after every migration.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. MISSING TABLES
-- ---------------------------------------------------------------------------
select
  'MISSING TABLE'::text            as problem,
  t.table_name                     as detail,
  case t.table_name
    when 'class_links'      then 'run supabase/migrations/add_live_classes.sql'
    when 'class_attendance' then 'run supabase/migrations/add_live_classes.sql'
    when 'pastoral_alerts'  then 'run supabase/migrations/add_pastoral_alerts.sql'
    else 'base table — never captured in a repo migration; restore from a database backup'
  end                              as fix_hint
from (values
  ('profiles'), ('courses'), ('lessons'), ('enrollments'), ('lesson_progress'),
  ('certificates'), ('sermons'), ('announcements'), ('daily_devotions'),
  ('prayer_requests'), ('prayer_supporters'),
  ('class_links'), ('class_attendance'), ('pastoral_alerts')
) as t(table_name)
where not exists (
  select 1 from information_schema.tables p
  where p.table_schema = 'public' and p.table_name = t.table_name
)
order by t.table_name;

-- ---------------------------------------------------------------------------
-- 2. MISSING COLUMNS
--    A single missing column silently blanks a whole screen: PostgREST rejects
--    the entire select with "column does not exist", the page gets null data
--    and renders its empty state with no error shown to the user. This is the
--    #1 way "Supabase out of sync" actually looks in this app.
-- ---------------------------------------------------------------------------
select
  'MISSING COLUMN'::text                                        as problem,
  c.table_name || '.' || c.column_name                          as detail,
  coalesce(
    (select string_agg(distinct 'supabase/migrations/' || f.file, ', ')
       from (values
         ('academy_level',            'add_academy_registration_fields.sql'),
         ('cohort',                   'add_academy_registration_fields.sql'),
         ('matric_number',            'add_academy_registration_fields.sql'),
         ('last_reminder_sent_at',    'add_course_reminder_tracking.sql'),
         ('emailed_at',               'add_devotion_emailed_at.sql'),
         ('email',                    'add_email_to_profiles.sql'),
         ('phone',                    'add_phone.sql'),
         ('is_locked',                'lock_courses_until_session_start.sql'),
         ('meet_url',                 'add_live_classes.sql'),
         ('schedule_label',           'add_live_classes.sql'),
         ('is_live',                  'add_live_classes.sql'),
         ('updated_at',               'add_live_classes.sql'),
         ('class_date',               'add_live_classes.sql'),
         ('marked_at',                'add_live_classes.sql'),
         ('reviewed',                 'add_pastoral_alerts.sql'),
         ('reviewed_by',              'add_pastoral_alerts.sql'),
         ('reviewed_at',              'add_pastoral_alerts.sql')
       ) as f(column_name, file)
      where f.column_name = c.column_name),
    'base column — add it manually, e.g. alter table public.' || c.table_name
      || ' add column if not exists ' || c.column_name || ' ...;'
  )                                                             as fix_hint
from (values
  -- profiles
  ('profiles', 'id'), ('profiles', 'full_name'), ('profiles', 'phone'),
  ('profiles', 'campus'), ('profiles', 'avatar_url'), ('profiles', 'role'),
  ('profiles', 'bio'), ('profiles', 'email'), ('profiles', 'created_at'),
  -- courses
  ('courses', 'id'), ('courses', 'title'), ('courses', 'description'),
  ('courses', 'category'), ('courses', 'level'), ('courses', 'thumbnail_url'),
  ('courses', 'total_lessons'), ('courses', 'duration_minutes'),
  ('courses', 'is_published'), ('courses', 'is_locked'), ('courses', 'sort_order'),
  ('courses', 'created_at'),
  -- lessons
  ('lessons', 'id'), ('lessons', 'course_id'), ('lessons', 'title'),
  ('lessons', 'description'), ('lessons', 'content'), ('lessons', 'video_url'),
  ('lessons', 'audio_url'), ('lessons', 'pdf_url'), ('lessons', 'attachment_label'),
  ('lessons', 'duration_minutes'), ('lessons', 'sort_order'), ('lessons', 'is_published'),
  -- enrollments
  ('enrollments', 'id'), ('enrollments', 'user_id'), ('enrollments', 'course_id'),
  ('enrollments', 'enrolled_at'), ('enrollments', 'academy_level'),
  ('enrollments', 'cohort'), ('enrollments', 'matric_number'),
  ('enrollments', 'last_activity_date'), ('enrollments', 'streak_days'),
  ('enrollments', 'last_reminder_sent_at'),
  -- lesson_progress
  ('lesson_progress', 'id'), ('lesson_progress', 'user_id'),
  ('lesson_progress', 'lesson_id'), ('lesson_progress', 'course_id'),
  ('lesson_progress', 'completed'), ('lesson_progress', 'watch_seconds'),
  -- certificates
  ('certificates', 'id'), ('certificates', 'user_id'), ('certificates', 'course_id'),
  ('certificates', 'issued_at'), ('certificates', 'certificate_number'),
  -- sermons
  ('sermons', 'id'), ('sermons', 'title'), ('sermons', 'speaker'), ('sermons', 'series'),
  ('sermons', 'scripture_reference'), ('sermons', 'description'), ('sermons', 'video_url'),
  ('sermons', 'campus'), ('sermons', 'preached_at'), ('sermons', 'duration_minutes'),
  ('sermons', 'sort_order'), ('sermons', 'youtube_video_id'),
  -- announcements
  ('announcements', 'id'), ('announcements', 'title'), ('announcements', 'body'),
  ('announcements', 'category'), ('announcements', 'campus'), ('announcements', 'is_pinned'),
  ('announcements', 'is_published'), ('announcements', 'published_at'),
  ('announcements', 'expires_at'), ('announcements', 'created_by'), ('announcements', 'created_at'),
  -- daily_devotions
  ('daily_devotions', 'id'), ('daily_devotions', 'date'),
  ('daily_devotions', 'scripture_reference'), ('daily_devotions', 'scripture_text'),
  ('daily_devotions', 'body'), ('daily_devotions', 'emailed_at'),
  -- prayer wall
  ('prayer_requests', 'id'), ('prayer_requests', 'user_id'), ('prayer_requests', 'request'),
  ('prayer_requests', 'is_anonymous'), ('prayer_requests', 'prayer_count'),
  ('prayer_requests', 'is_answered'), ('prayer_requests', 'is_public'),
  ('prayer_requests', 'created_at'),
  ('prayer_supporters', 'prayer_request_id'), ('prayer_supporters', 'user_id'),
  -- live classes
  ('class_links', 'level'), ('class_links', 'meet_url'), ('class_links', 'schedule_label'),
  ('class_links', 'is_live'), ('class_links', 'updated_at'),
  ('class_attendance', 'id'), ('class_attendance', 'user_id'), ('class_attendance', 'level'),
  ('class_attendance', 'class_date'), ('class_attendance', 'marked_at'),
  -- pastoral care
  ('pastoral_alerts', 'id'), ('pastoral_alerts', 'user_id'), ('pastoral_alerts', 'source'),
  ('pastoral_alerts', 'category'), ('pastoral_alerts', 'message'), ('pastoral_alerts', 'reviewed'),
  ('pastoral_alerts', 'reviewed_by'), ('pastoral_alerts', 'reviewed_at'),
  ('pastoral_alerts', 'created_at')
) as c(table_name, column_name)
where exists (
  select 1 from information_schema.tables t
  where t.table_schema = 'public' and t.table_name = c.table_name
)
and not exists (
  select 1 from information_schema.columns k
  where k.table_schema = 'public'
    and k.table_name = c.table_name
    and k.column_name = c.column_name
)
order by c.table_name, c.column_name;

-- ---------------------------------------------------------------------------
-- 3. MISSING FUNCTIONS (RLS and triggers depend on these — if is_admin() is
--    gone, every admin write fails with a permissions error)
-- ---------------------------------------------------------------------------
select
  'MISSING FUNCTION'::text  as problem,
  'public.' || f.fn || '()' as detail,
  f.fix                     as fix_hint
from (values
  ('is_admin',                        'recreate from the base schema — used by class_links/class_attendance RLS policies'),
  ('handle_new_user',                 'recreate from the base schema — auth signup trigger that creates the profiles row'),
  ('assign_academy_matric_number',    'run supabase/migrations/add_academy_registration_fields.sql then supabase/migrations/assign_matric_on_enrollment_update.sql'),
  ('prevent_role_self_escalation',    'run supabase/migrations/prevent_profile_role_self_escalation.sql')
) as f(fn, fix)
where not exists (
  select 1 from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = f.fn
)
order by f.fn;

-- ---------------------------------------------------------------------------
-- 4. MISSING / MISCONFIGURED TRIGGERS
--    No matric trigger = students register and never get a matric number, with
--    no error anywhere.
-- ---------------------------------------------------------------------------
select
  'MISSING TRIGGER'::text  as problem,
  t.tg                     as detail,
  t.fix                    as fix_hint
from (values
  ('trg_assign_academy_matric_number ON public.enrollments',
   'run supabase/migrations/assign_matric_on_enrollment_update.sql (fires on INSERT *and* UPDATE)'),
  ('trg_prevent_role_self_escalation ON public.profiles',
   'run supabase/migrations/prevent_profile_role_self_escalation.sql')
) as t(tg, fix)
where not exists (
  select 1
  from pg_trigger tr
  join pg_class c on c.oid = tr.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and tr.tgname = split_part(t.tg, ' ON ', 1)
    and c.relname = split_part(split_part(t.tg, ' ON ', 2), '.', 2)
    and not tr.tgisinternal
)
order by t.tg;

-- The matric trigger must fire on UPDATE too, not just INSERT — otherwise the
-- admin "Set level" repair path saves the level but never assigns a matric.
select
  'TRIGGER ONLY FIRES ON INSERT'::text                       as problem,
  'trg_assign_academy_matric_number (needs INSERT OR UPDATE)' as detail,
  'run supabase/migrations/assign_matric_on_enrollment_update.sql'::text as fix_hint
where exists (
  select 1 from pg_trigger tr
  join pg_class c on c.oid = tr.tgrelid
  where c.relname = 'enrollments'
    and tr.tgname = 'trg_assign_academy_matric_number'
    -- bit 0x10 (16) of tgtype = UPDATE
    and (tr.tgtype::int & 16) = 0
);

-- ---------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY DISABLED (data exposure — fix before anything else)
-- ---------------------------------------------------------------------------
select
  'RLS DISABLED'::text        as problem,
  'public.' || c.relname      as detail,
  'alter table public.' || c.relname || ' enable row level security;'::text as fix_hint
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and not c.relrowsecurity
order by c.relname;

-- ---------------------------------------------------------------------------
-- 6. MISSING POLICIES on the tables added by migrations
-- ---------------------------------------------------------------------------
select
  'MISSING POLICY'::text       as problem,
  p.tbl || ' → ' || p.pol      as detail,
  p.fix                        as fix_hint
from (values
  ('class_links',      'Anyone authenticated can view class links',            'run supabase/migrations/add_live_classes.sql'),
  ('class_links',      'Admins can manage class links',                        'run supabase/migrations/add_live_classes.sql'),
  ('class_attendance', 'Users can view own attendance',                        'run supabase/migrations/add_live_classes.sql'),
  ('class_attendance', 'Admins can view all attendance',                       'run supabase/migrations/add_live_classes.sql'),
  ('class_attendance', 'Users can self-report attendance while their class is live', 'run supabase/migrations/add_live_classes.sql'),
  ('pastoral_alerts',  'Admins can view pastoral alerts',                      'run supabase/migrations/add_pastoral_alerts.sql'),
  ('pastoral_alerts',  'Admins can update pastoral alerts',                    'run supabase/migrations/add_pastoral_alerts.sql')
) as p(tbl, pol, fix)
where exists (
  select 1 from information_schema.tables t
  where t.table_schema = 'public' and t.table_name = p.tbl
)
and not exists (
  select 1 from pg_policies pol
  where pol.schemaname = 'public'
    and pol.tablename = p.tbl
    and pol.policyname = p.pol
)
order by p.tbl, p.pol;

-- ---------------------------------------------------------------------------
-- 7. MISSING SEED ROWS — the three Academy levels must exist in class_links or
--    Admin → Live Classes has nothing to save a Meet link against ("Go Live"
--    then looks like it works and persists nothing).
-- ---------------------------------------------------------------------------
select
  'MISSING CLASS_LINKS ROW'::text                 as problem,
  'level ' || l.level || ' has no class_links row' as detail,
  'insert into public.class_links (level, schedule_label) values (''' || l.level
    || ''', ''Saturdays 8:30–9:30AM'') on conflict (level) do nothing;'::text as fix_hint
from (values ('100'), ('200'), ('300')) as l(level)
where exists (select 1 from information_schema.tables t
              where t.table_schema = 'public' and t.table_name = 'class_links')
  and not exists (select 1 from public.class_links cl where cl.level = l.level)
order by l.level;

-- ---------------------------------------------------------------------------
-- 8. STORAGE BUCKET — lesson uploads fail outright if it is missing or private
-- ---------------------------------------------------------------------------
select
  'MISSING STORAGE BUCKET'::text as problem,
  'lesson-files'                 as detail,
  'Supabase dashboard → Storage → New bucket → name "lesson-files", public' as fix_hint
where not exists (
  select 1 from storage.buckets b where b.id = 'lesson-files'
);

select
  'BUCKET NOT PUBLIC'::text                                              as problem,
  'lesson-files (public = false)'                                        as detail,
  'Supabase dashboard → Storage → lesson-files → make public, otherwise lesson PDFs/videos 400 for students' as fix_hint
where exists (
  select 1 from storage.buckets b where b.id = 'lesson-files' and b.public is not true
);

-- ---------------------------------------------------------------------------
-- 9. THE COHORT COURSE the code points at (lib/academy.ts
--    CURRENT_COHORT_COURSE_ID). If this row is missing or unpublished, every
--    registration/matric/live-class flow no-ops on real data even though the
--    schema is perfect.
-- ---------------------------------------------------------------------------
select
  'COHORT COURSE PROBLEM'::text                       as problem,
  case
    when c.id is null then 'no course with id 4b69dd08-a1ce-4f50-8a91-e35aa1d755e0'
    when not c.is_published then 'cohort course "' || c.title || '" exists but is_published = false'
    else 'cohort course "' || c.title || '" is locked (is_locked = true)'
  end                                                 as detail,
  'Admin → Courses: publish (and unlock) the Cohort 3 course, or update CURRENT_COHORT_COURSE_ID in lib/academy.ts to the real course id and redeploy' as fix_hint
from (values ('4b69dd08-a1ce-4f50-8a91-e35aa1d755e0'::uuid)) as v(id)
left join public.courses c on c.id = v.id
where c.id is null or c.is_published is not true or c.is_locked is true;

-- ---------------------------------------------------------------------------
-- 10. VERDICT (single row: how many drift problems were found in total)
-- ---------------------------------------------------------------------------
with expected_tables(tbl) as (values
  ('profiles'), ('courses'), ('lessons'), ('enrollments'), ('lesson_progress'),
  ('certificates'), ('sermons'), ('announcements'), ('daily_devotions'),
  ('prayer_requests'), ('prayer_supporters'),
  ('class_links'), ('class_attendance'), ('pastoral_alerts')),
missing_tables as (
  select e.tbl from expected_tables e
  where not exists (select 1 from information_schema.tables t
                    where t.table_schema = 'public' and t.table_name = e.tbl)),
missing_functions as (
  select f.fn from (values ('is_admin'), ('handle_new_user'),
                         ('assign_academy_matric_number'),
                         ('prevent_role_self_escalation')) as f(fn)
  where not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                    where n.nspname = 'public' and p.proname = f.fn)),
rls_off as (
  select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
    and c.relname in (select tbl from expected_tables)),
bucket as (
  select count(*) as ok from storage.buckets b where b.id = 'lesson-files' and b.public is true)
select
  'VERDICT'::text as problem,
  case
    when (select count(*) from missing_tables)
       + (select count(*) from missing_functions)
       + (select count(*) from rls_off)
       + case when (select ok from bucket) = 0 then 1 else 0 end = 0
    then 'schema-level sync OK — if the UI still looks old, the problem is the DEPLOYMENT, not Supabase. Open /api/build-version and compare its commit with the newest Production deployment on GitHub → Environments (see RUNBOOK §3).'
    else 'DRIFT FOUND — read the sections above; every row is a real bug with its fix_hint.'
  end as detail,
  (select count(*) from missing_tables)    as missing_tables,
  (select count(*) from missing_functions) as missing_functions,
  (select count(*) from rls_off)           as tables_with_rls_off,
  (select ok from bucket)                  as lesson_files_bucket_ok;
