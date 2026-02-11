
-- Create helper function to get user's empresa_id
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- =============================================
-- COLABORADORES: replace permissive policy
-- =============================================
DROP POLICY IF EXISTS "permitir acesso total para usuarios logados" ON public.colaboradores;

CREATE POLICY "Users can view own company colaboradores"
ON public.colaboradores FOR SELECT
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Users can insert own company colaboradores"
ON public.colaboradores FOR INSERT
WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Users can update own company colaboradores"
ON public.colaboradores FOR UPDATE
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Users can delete own company colaboradores"
ON public.colaboradores FOR DELETE
USING (empresa_id = public.get_user_empresa_id());

-- =============================================
-- EPIS: replace permissive policy
-- =============================================
DROP POLICY IF EXISTS "criar acesso aos usuarios logados" ON public.epis;

CREATE POLICY "Users can view own company epis"
ON public.epis FOR SELECT
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Users can insert own company epis"
ON public.epis FOR INSERT
WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Users can update own company epis"
ON public.epis FOR UPDATE
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Users can delete own company epis"
ON public.epis FOR DELETE
USING (empresa_id = public.get_user_empresa_id());

-- =============================================
-- ENTREGAS_EPI: replace permissive policy
-- =============================================
DROP POLICY IF EXISTS "criar acesso aos usuarios" ON public.entregas_epi;

CREATE POLICY "Users can view own company entregas"
ON public.entregas_epi FOR SELECT
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Users can insert own company entregas"
ON public.entregas_epi FOR INSERT
WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Users can update own company entregas"
ON public.entregas_epi FOR UPDATE
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Users can delete own company entregas"
ON public.entregas_epi FOR DELETE
USING (empresa_id = public.get_user_empresa_id());

-- =============================================
-- EMPRESAS: replace permissive policy
-- =============================================
DROP POLICY IF EXISTS "permitir acesso" ON public.empresas;

CREATE POLICY "Users can view own company"
ON public.empresas FOR SELECT
USING (id = public.get_user_empresa_id());

CREATE POLICY "Users can insert empresa during onboarding"
ON public.empresas FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own company"
ON public.empresas FOR UPDATE
USING (id = public.get_user_empresa_id());
