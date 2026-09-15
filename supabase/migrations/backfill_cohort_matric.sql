-- Repair cohort enrollments that were created without a cohort tag and/or
-- matric number (older paths, explore-first users who later enrolled with a
-- half-complete row, etc.). Level still cannot be invented — students pick it
-- at /register, or an admin sets it on Registrations.
--
-- 1) Tag every enrollment in the current Cohort 3 course with the cohort label
--    when it is missing, so the matric trigger has something to key off.
-- 2) Re-touch every cohort-tagged row that still has no matric so the existing
--    BEFORE INSERT OR UPDATE trigger assigns one (function only writes when
--    matric_number IS NULL, so already-numbered rows stay put).

UPDATE public.enrollments
SET cohort = 'Cohort 3 2026'
WHERE course_id = '4b69dd08-a1ce-4f50-8a91-e35aa1d755e0'
  AND cohort IS NULL;

-- Force the assign_academy_matric_number trigger to run on incomplete rows.
UPDATE public.enrollments
SET cohort = cohort
WHERE cohort IS NOT NULL
  AND matric_number IS NULL;
