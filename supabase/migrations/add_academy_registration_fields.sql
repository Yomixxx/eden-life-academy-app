-- Supports the Cohort 3 central-registration flow (/register): which
-- in-person level (100/200/300) a registrant picked at signup, which
-- cohort they belong to, and an auto-assigned matric number so the
-- ministry team can export a proper roll for the ministry team.
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS academy_level text CHECK (academy_level IN ('100', '200', '300'));
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS cohort text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS matric_number text UNIQUE;

CREATE SEQUENCE IF NOT EXISTS public.cohort3_2026_matric_seq;

-- Only fires for enrollments tagged with a cohort (i.e. Academy
-- registrations) and only on insert, so re-saving an existing row (e.g.
-- updating the chosen level) never reassigns a fresh number.
CREATE OR REPLACE FUNCTION public.assign_academy_matric_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.cohort IS NOT NULL AND NEW.matric_number IS NULL THEN
    NEW.matric_number := 'ELA/' || replace(NEW.cohort, ' ', '') || '/' || lpad(nextval('public.cohort3_2026_matric_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_academy_matric_number ON public.enrollments;
CREATE TRIGGER trg_assign_academy_matric_number
BEFORE INSERT ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.assign_academy_matric_number();
