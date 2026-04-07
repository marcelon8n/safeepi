
-- ===========================================
-- FIX 1: Create server-side PIN validation function
-- This prevents exposing pin_assinatura to all company users
-- ===========================================

CREATE OR REPLACE FUNCTION public.validar_pin_colaborador(p_colaborador_id uuid, p_pin text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pin text;
  v_empresa_id uuid;
BEGIN
  -- Verify the colaborador belongs to the user's company
  SELECT pin_assinatura, empresa_id INTO v_pin, v_empresa_id
  FROM public.colaboradores
  WHERE id = p_colaborador_id;

  IF v_empresa_id IS NULL OR v_empresa_id != get_user_empresa_id() THEN
    RETURN false;
  END IF;

  IF v_pin IS NULL THEN
    RAISE EXCEPTION 'Colaborador não possui PIN cadastrado';
  END IF;

  RETURN v_pin = p_pin;
END;
$$;

-- ===========================================
-- FIX 2: Restrict profile UPDATE policies to prevent role escalation
-- Owners should only assign roles below their level (admin, editor, viewer)
-- Super admins can assign any role
-- ===========================================

DROP POLICY IF EXISTS "Owners can update company profiles" ON public.profiles;
CREATE POLICY "Owners can update company profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    empresa_id = get_user_empresa_id()
    AND get_my_role() = 'owner'::user_role
  )
  WITH CHECK (
    empresa_id = get_user_empresa_id()
    AND role IN ('admin'::user_role, 'editor'::user_role, 'viewer'::user_role)
  );

DROP POLICY IF EXISTS "Super admins can update company profiles" ON public.profiles;
CREATE POLICY "Super admins can update company profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    empresa_id = get_user_empresa_id()
    AND get_my_role() = 'super_admin'::user_role
  )
  WITH CHECK (
    empresa_id = get_user_empresa_id()
  );
