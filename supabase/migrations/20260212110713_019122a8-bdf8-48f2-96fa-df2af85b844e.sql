
-- Fix ALL restrictive policies to be permissive

-- === EMPRESAS ===
DROP POLICY IF EXISTS "Users can insert empresa during onboarding" ON public.empresas;
DROP POLICY IF EXISTS "Users can view own company" ON public.empresas;
DROP POLICY IF EXISTS "Users can update own company" ON public.empresas;

CREATE POLICY "Users can insert empresa during onboarding"
  ON public.empresas FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view own company"
  ON public.empresas FOR SELECT TO authenticated
  USING (id = get_user_empresa_id());

CREATE POLICY "Users can update own company"
  ON public.empresas FOR UPDATE TO authenticated
  USING (id = get_user_empresa_id());

-- === PROFILES ===
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- === COLABORADORES ===
DROP POLICY IF EXISTS "Users can view own company colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Users can insert own company colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Users can update own company colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Users can delete own company colaboradores" ON public.colaboradores;

CREATE POLICY "Users can view own company colaboradores"
  ON public.colaboradores FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can insert own company colaboradores"
  ON public.colaboradores FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can update own company colaboradores"
  ON public.colaboradores FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can delete own company colaboradores"
  ON public.colaboradores FOR DELETE TO authenticated
  USING (empresa_id = get_user_empresa_id());

-- === EPIS ===
DROP POLICY IF EXISTS "Users can view own company epis" ON public.epis;
DROP POLICY IF EXISTS "Users can insert own company epis" ON public.epis;
DROP POLICY IF EXISTS "Users can update own company epis" ON public.epis;
DROP POLICY IF EXISTS "Users can delete own company epis" ON public.epis;

CREATE POLICY "Users can view own company epis"
  ON public.epis FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can insert own company epis"
  ON public.epis FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can update own company epis"
  ON public.epis FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can delete own company epis"
  ON public.epis FOR DELETE TO authenticated
  USING (empresa_id = get_user_empresa_id());

-- === ENTREGAS_EPI ===
DROP POLICY IF EXISTS "Users can view own company entregas" ON public.entregas_epi;
DROP POLICY IF EXISTS "Users can insert own company entregas" ON public.entregas_epi;
DROP POLICY IF EXISTS "Users can update own company entregas" ON public.entregas_epi;
DROP POLICY IF EXISTS "Users can delete own company entregas" ON public.entregas_epi;

CREATE POLICY "Users can view own company entregas"
  ON public.entregas_epi FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can insert own company entregas"
  ON public.entregas_epi FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can update own company entregas"
  ON public.entregas_epi FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can delete own company entregas"
  ON public.entregas_epi FOR DELETE TO authenticated
  USING (empresa_id = get_user_empresa_id());
