
-- ===========================================
-- Move pin_assinatura to a separate restricted table
-- ===========================================

-- 1. Create the new table
CREATE TABLE public.colaborador_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL UNIQUE REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL,
  pin text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.colaborador_pins ENABLE ROW LEVEL SECURITY;

-- 3. Only admins+ can manage PINs (no SELECT for regular users)
CREATE POLICY "Admins can manage pins" ON public.colaborador_pins
  FOR ALL TO authenticated
  USING (
    empresa_id = get_user_empresa_id()
    AND get_my_role() IN ('super_admin'::user_role, 'owner'::user_role, 'admin'::user_role)
  )
  WITH CHECK (
    empresa_id = get_user_empresa_id()
    AND get_my_role() IN ('super_admin'::user_role, 'owner'::user_role, 'admin'::user_role)
  );

-- 4. Migrate existing PINs
INSERT INTO public.colaborador_pins (colaborador_id, empresa_id, pin)
SELECT id, empresa_id, pin_assinatura
FROM public.colaboradores
WHERE pin_assinatura IS NOT NULL AND pin_assinatura != '';

-- 5. Update the validar_pin_colaborador function to use new table
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
  SELECT cp.pin, cp.empresa_id INTO v_pin, v_empresa_id
  FROM public.colaborador_pins cp
  WHERE cp.colaborador_id = p_colaborador_id;

  IF v_empresa_id IS NULL OR v_empresa_id != get_user_empresa_id() THEN
    RETURN false;
  END IF;

  IF v_pin IS NULL THEN
    RAISE EXCEPTION 'Colaborador não possui PIN cadastrado';
  END IF;

  RETURN v_pin = p_pin;
END;
$$;

-- 6. Create RPC to set/update PIN (admin only, via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.set_colaborador_pin(p_colaborador_id uuid, p_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  -- Verify the colaborador belongs to caller's company
  SELECT empresa_id INTO v_empresa_id
  FROM public.colaboradores
  WHERE id = p_colaborador_id;

  IF v_empresa_id IS NULL OR v_empresa_id != get_user_empresa_id() THEN
    RAISE EXCEPTION 'Colaborador não encontrado na sua empresa';
  END IF;

  -- Verify caller has admin+ role
  IF get_my_role() NOT IN ('super_admin'::user_role, 'owner'::user_role, 'admin'::user_role) THEN
    RAISE EXCEPTION 'Permissão insuficiente para gerenciar PINs';
  END IF;

  -- Validate PIN format
  IF p_pin IS NULL OR length(p_pin) != 4 OR p_pin !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'PIN deve conter exatamente 4 dígitos numéricos';
  END IF;

  INSERT INTO public.colaborador_pins (colaborador_id, empresa_id, pin)
  VALUES (p_colaborador_id, v_empresa_id, p_pin)
  ON CONFLICT (colaborador_id)
  DO UPDATE SET pin = EXCLUDED.pin, updated_at = now();
END;
$$;

-- 7. Create RPC to check if a colaborador has a PIN set (no value exposed)
CREATE OR REPLACE FUNCTION public.colaborador_has_pin(p_colaborador_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.colaborador_pins
    WHERE colaborador_id = p_colaborador_id
    AND empresa_id = get_user_empresa_id()
  );
END;
$$;

-- 8. Drop the column from colaboradores
ALTER TABLE public.colaboradores DROP COLUMN pin_assinatura;
