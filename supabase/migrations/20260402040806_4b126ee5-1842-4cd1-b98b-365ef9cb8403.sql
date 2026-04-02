
-- 1. Fix auditoria public role policy → authenticated only
DROP POLICY IF EXISTS "Empresas veem apenas seus logs" ON public.auditoria;
CREATE POLICY "Empresas veem apenas seus logs"
  ON public.auditoria
  FOR SELECT
  TO authenticated
  USING (empresa_id = get_user_empresa_id());

-- 2. Fix profile self-update to prevent role/empresa_id escalation
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid())
    AND empresa_id IS NOT DISTINCT FROM (SELECT p.empresa_id FROM public.profiles p WHERE p.user_id = auth.uid())
  );

-- 3. Fix profile insert to prevent role injection at signup
-- Note: handle_new_user() trigger creates profiles as SECURITY DEFINER, so it bypasses RLS.
-- This policy protects against direct client-side INSERT attempts.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND (role IS NULL OR role = 'viewer'));

-- 4. Fix Owners can update company profiles to also be authenticated-only
DROP POLICY IF EXISTS "Owners can update company profiles" ON public.profiles;
CREATE POLICY "Owners can update company profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    empresa_id = get_user_empresa_id()
    AND get_my_role() IN ('owner', 'super_admin')
  );

-- 5. Fix function search_path for all functions missing it
ALTER FUNCTION public.calcular_vencimento_epi() SET search_path = public;
ALTER FUNCTION public.fn_capture_ca_on_delivery() SET search_path = public;
ALTER FUNCTION public.get_epi_durability(uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.handle_pgrst_role_change() SET search_path = public;
ALTER FUNCTION public.inativar_epi_anterior() SET search_path = public;
ALTER FUNCTION public.preencher_email_encarregado() SET search_path = public;
ALTER FUNCTION public.processar_entrega_epi() SET search_path = public;
