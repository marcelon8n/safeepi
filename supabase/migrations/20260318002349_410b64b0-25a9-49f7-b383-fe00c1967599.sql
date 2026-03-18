
CREATE OR REPLACE FUNCTION public.create_empresa_onboarding(p_nome_fantasia text, p_cnpj text, p_razao_social text DEFAULT NULL)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  INSERT INTO public.empresas (nome_fantasia, cnpj, razao_social)
  VALUES (p_nome_fantasia, p_cnpj, p_razao_social)
  RETURNING id INTO v_empresa_id;

  UPDATE public.profiles
  SET empresa_id = v_empresa_id, role = 'owner'
  WHERE user_id = auth.uid();

  RETURN v_empresa_id;
END;
$$;
