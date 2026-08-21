-- Lets an enrollment that started bare (no cohort — e.g. someone who
-- explored first) get a matric number the moment it's later tagged with a
-- cohort via an UPDATE, not just on initial INSERT. The function's existing
-- "only if matric_number IS NULL" check makes this safe to add to UPDATE
-- without touching already-numbered rows.
DROP TRIGGER IF EXISTS trg_assign_academy_matric_number ON public.enrollments;
CREATE TRIGGER trg_assign_academy_matric_number
BEFORE INSERT OR UPDATE ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION public.assign_academy_matric_number();
