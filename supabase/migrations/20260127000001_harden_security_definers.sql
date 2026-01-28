-- HARDENING: Revoke PUBLIC execute permissions from all critical functions
-- Directives:
-- 1. REVOKE ALL ON FUNCTION ... FROM PUBLIC
-- 2. GRANT EXECUTE ON FUNCTION ... TO service_role
-- 3. GRANT EXECUTE ON FUNCTION ... TO authenticated (Only if strictly required)

BEGIN;

-- 1. Admin & Security
REVOKE ALL ON FUNCTION public.claim_admin_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_admin_role() TO authenticated; -- Required for user self-promotion check

REVOKE ALL ON FUNCTION public.enable_emergency_lockdown() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enable_emergency_lockdown() TO service_role;

REVOKE ALL ON FUNCTION public.lift_emergency_lockdown() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lift_emergency_lockdown() TO service_role;

-- 2. MAN Mode & Governance
REVOKE ALL ON FUNCTION public.create_man_task(jsonb, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_man_task(jsonb, text, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_man_task(jsonb, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_man_task(jsonb, text, text, int) TO service_role;

REVOKE ALL ON FUNCTION public.resolve_man_task(uuid, text, text, jsonb, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_man_task(uuid, text, text, jsonb, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.resolve_man_task(uuid, text, text, jsonb, uuid) TO authenticated; -- Approvers are users

-- 3. Audit Logging
REVOKE ALL ON FUNCTION public.create_audit_log(text, text, text, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_audit_log(text, text, text, jsonb, text) TO service_role;

-- 4. Device Registry
REVOKE ALL ON FUNCTION public.register_device(text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_device(text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.register_device(text, text, jsonb) TO authenticated; -- Users register devices

-- 5. Data Access
-- Revoke any generic helper functions if they exist here
-- (None identified as strictly critical beyond RLS, but safe measure)

COMMIT;
