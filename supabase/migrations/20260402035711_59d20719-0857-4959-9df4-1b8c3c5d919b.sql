
-- 1. Remove public SELECT policy on convites (exposes all invite data to anonymous users)
DROP POLICY IF EXISTS "Permitir leitura de convites por e-mail" ON public.convites;

-- 2. Remove overly permissive INSERT policies on empresas
DROP POLICY IF EXISTS "Users can insert own company" ON public.empresas;
DROP POLICY IF EXISTS "Permitir_Criar_Empresa_Onboarding" ON public.empresas;

-- Re-create onboarding insert restricted to authenticated users only
CREATE POLICY "Authenticated users can create empresa during onboarding"
ON public.empresas FOR INSERT TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND empresa_id IS NOT NULL
  )
);

-- 3. Change get_user_empresa_id to SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- 4. Add role-based write RLS on colaboradores
DROP POLICY IF EXISTS "Users can insert own company colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Users can update own company colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Users can delete own company colaboradores" ON public.colaboradores;

CREATE POLICY "Admins can insert colaboradores"
ON public.colaboradores FOR INSERT TO authenticated
WITH CHECK (
  empresa_id = get_user_empresa_id() AND
  get_my_role() IN ('super_admin'::user_role, 'owner'::user_role, 'admin'::user_role)
);

CREATE POLICY "Admins can update colaboradores"
ON public.colaboradores FOR UPDATE TO authenticated
USING (empresa_id = get_user_empresa_id())
WITH CHECK (
  empresa_id = get_user_empresa_id() AND
  get_my_role() IN ('super_admin'::user_role, 'owner'::user_role, 'admin'::user_role)
);

CREATE POLICY "Admins can delete colaboradores"
ON public.colaboradores FOR DELETE TO authenticated
USING (
  empresa_id = get_user_empresa_id() AND
  get_my_role() IN ('super_admin'::user_role, 'owner'::user_role, 'admin'::user_role)
);

-- 5. Add role-based write RLS on epis
DROP POLICY IF EXISTS "Users can insert own company epis" ON public.epis;
DROP POLICY IF EXISTS "Users can update own company epis" ON public.epis;
DROP POLICY IF EXISTS "Users can delete own company epis" ON public.epis;

CREATE POLICY "Admins can insert epis"
ON public.epis FOR INSERT TO authenticated
WITH CHECK (
  empresa_id = get_user_empresa_id() AND
  get_my_role() IN ('super_admin'::user_role, 'owner'::user_role, 'admin'::user_role)
);

CREATE POLICY "Admins can update epis"
ON public.epis FOR UPDATE TO authenticated
USING (empresa_id = get_user_empresa_id())
WITH CHECK (
  empresa_id = get_user_empresa_id() AND
  get_my_role() IN ('super_admin'::user_role, 'owner'::user_role, 'admin'::user_role)
);

CREATE POLICY "Admins can delete epis"
ON public.epis FOR DELETE TO authenticated
USING (
  empresa_id = get_user_empresa_id() AND
  get_my_role() IN ('super_admin'::user_role, 'owner'::user_role, 'admin'::user_role)
);

-- 6. Add role-based write RLS on entregas_epi (editors can insert/update, admins can delete)
DROP POLICY IF EXISTS "Users can insert own company entregas" ON public.entregas_epi;
DROP POLICY IF EXISTS "Users can update own company entregas" ON public.entregas_epi;
DROP POLICY IF EXISTS "Users can delete own company entregas" ON public.entregas_epi;

CREATE POLICY "Editors can insert entregas"
ON public.entregas_epi FOR INSERT TO authenticated
WITH CHECK (
  empresa_id = get_user_empresa_id() AND
  get_my_role() IN ('super_admin'::user_role, 'owner'::user_role, 'admin'::user_role, 'editor'::user_role)
);

CREATE POLICY "Editors can update entregas"
ON public.entregas_epi FOR UPDATE TO authenticated
USING (empresa_id = get_user_empresa_id())
WITH CHECK (
  empresa_id = get_user_empresa_id() AND
  get_my_role() IN ('super_admin'::user_role, 'owner'::user_role, 'admin'::user_role, 'editor'::user_role)
);

CREATE POLICY "Admins can delete entregas"
ON public.entregas_epi FOR DELETE TO authenticated
USING (
  empresa_id = get_user_empresa_id() AND
  get_my_role() IN ('super_admin'::user_role, 'owner'::user_role, 'admin'::user_role)
);

-- 7. Add role-based write RLS on setores
DROP POLICY IF EXISTS "Users can insert own company setores" ON public.setores;
DROP POLICY IF EXISTS "Users can update own company setores" ON public.setores;
DROP POLICY IF EXISTS "Users can delete own company setores" ON public.setores;

CREATE POLICY "Admins can insert setores"
ON public.setores FOR INSERT TO authenticated
WITH CHECK (
  empresa_id = get_user_empresa_id() AND
  get_my_role() IN ('super_admin'::user_role, 'owner'::user_role, 'admin'::user_role)
);

CREATE POLICY "Admins can update setores"
ON public.setores FOR UPDATE TO authenticated
USING (empresa_id = get_user_empresa_id())
WITH CHECK (
  empresa_id = get_user_empresa_id() AND
  get_my_role() IN ('super_admin'::user_role, 'owner'::user_role, 'admin'::user_role)
);

CREATE POLICY "Admins can delete setores"
ON public.setores FOR DELETE TO authenticated
USING (
  empresa_id = get_user_empresa_id() AND
  get_my_role() IN ('super_admin'::user_role, 'owner'::user_role, 'admin'::user_role)
);

-- 8. Remove always-true INSERT policy on auditoria and restrict to trigger/system
DROP POLICY IF EXISTS "Insert liberado via trigger" ON public.auditoria;

-- 9. Add CNPJ format constraint
ALTER TABLE public.empresas ADD CONSTRAINT cnpj_format_check
CHECK (cnpj ~ '^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$');

-- 10. Make storage bucket private if it exists
UPDATE storage.buckets SET public = false WHERE id = 'obras-documentos';
