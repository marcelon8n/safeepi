
-- ===========================================
-- FIX 1: Audit table - remove write access from authenticated users
-- The process_audit_log trigger runs as SECURITY DEFINER, so it bypasses RLS.
-- We only need SELECT for authenticated users.
-- ===========================================

-- Drop the ALL-command policies that grant write access
DROP POLICY IF EXISTS "Isolamento por empresa auditoria" ON public.auditoria;
DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.auditoria;

-- Keep only the existing SELECT policy "Empresas veem apenas seus logs"
-- (already exists, no change needed)

-- Revoke direct write permissions from authenticated role as defense-in-depth
REVOKE INSERT, UPDATE, DELETE ON public.auditoria FROM authenticated;

-- ===========================================
-- FIX 2: Profiles - remove tenant_isolation_policy that bypasses role restriction on INSERT
-- ===========================================

DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.profiles;

-- Re-create a scoped SELECT policy for company members (replacing tenant_isolation_policy's SELECT function)
-- Note: "Admins can view company profiles" already covers this, so no new policy needed.

-- ===========================================
-- FIX 3: Empresas - remove the OR branch that exposes all companies to unassociated users
-- ===========================================

DROP POLICY IF EXISTS "Permitir_Ver_Empresa_Logada" ON public.empresas;

-- Recreate without the dangerous OR branch. During onboarding, the create_empresa_onboarding
-- function (SECURITY DEFINER) handles empresa creation, so users don't need to read all empresas.
CREATE POLICY "Permitir_Ver_Empresa_Logada" ON public.empresas
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT profiles.empresa_id FROM profiles WHERE profiles.user_id = auth.uid())
  );
