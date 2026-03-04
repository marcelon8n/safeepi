
CREATE OR REPLACE FUNCTION public.verificar_limite_obras(empresa_uuid uuid)
RETURNS TABLE(pode_criar boolean, total_atual bigint, limite_maximo integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (COUNT(o.id) < p.limite_obras AND p.permite_obras = true) AS pode_criar,
        COUNT(o.id) AS total_atual,
        p.limite_obras AS limite_maximo
    FROM public.empresas e
    JOIN public.planos p ON e.plano_id = p.id
    LEFT JOIN public.obras o ON o.empresa_id = e.id AND o.status = 'ativa'
    WHERE e.id = empresa_uuid
    GROUP BY p.limite_obras, p.permite_obras;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_invite(p_convite_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_empresa_id UUID;
  v_email TEXT;
  v_user_email TEXT;
BEGIN
  SELECT empresa_id, email INTO v_empresa_id, v_email
  FROM public.convites
  WHERE id = p_convite_id AND status = 'pendente';

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Convite não encontrado ou já utilizado';
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  IF v_user_email != v_email THEN
    RAISE EXCEPTION 'Este convite não pertence ao seu e-mail';
  END IF;

  UPDATE public.profiles
  SET empresa_id = v_empresa_id
  WHERE user_id = auth.uid();

  UPDATE public.convites
  SET status = 'aceito'
  WHERE id = p_convite_id;

  RETURN v_empresa_id;
END;
$$;
