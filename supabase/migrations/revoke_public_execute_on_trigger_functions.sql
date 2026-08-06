-- These are internal trigger/event-trigger functions, never meant to be
-- called directly via PostgREST RPC (they reference NEW/OLD, which only
-- exist in trigger context). Postgres grants EXECUTE to the implicit
-- PUBLIC pseudo-role by default on function creation, so anon/authenticated
-- could otherwise call them directly at /rest/v1/rpc/<name>.
--
-- is_admin() is deliberately left alone: RLS policies on courses/lessons/
-- announcements/sermons/pastoral_alerts invoke it in the querying role's
-- context, so revoking its EXECUTE grant would break those policies for
-- anon/authenticated.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.prevent_role_self_escalation() from public;
revoke execute on function public.rls_auto_enable() from public;
