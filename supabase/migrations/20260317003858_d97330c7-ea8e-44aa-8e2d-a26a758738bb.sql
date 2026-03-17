
CREATE OR REPLACE FUNCTION public.create_empresa_onboarding(p_nome_fantasia text, p_cnpj text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  INSERT INTO public.empresas (nome_fantasia, cnpj)
  VALUES (p_nome_fantasia, p_cnpj)
  RETURNING id INTO v_empresa_id;

  UPDATE public.profiles
  SET empresa_id = v_empresa_id, role = 'owner'
  WHERE user_id = auth.uid();

  RETURN v_empresa_id;
END;
$$;
