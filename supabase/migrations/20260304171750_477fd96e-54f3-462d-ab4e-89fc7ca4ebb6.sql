
CREATE OR REPLACE FUNCTION public.verificar_limite_colaboradores(empresa_uuid uuid)
RETURNS TABLE(pode_ativar boolean, total_ativos bigint, limite_maximo integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (COUNT(c.id) < p.limite_colaboradores) AS pode_ativar,
    COUNT(c.id) AS total_ativos,
    p.limite_colaboradores AS limite_maximo
  FROM public.empresas e
  JOIN public.planos p ON e.plano_id = p.id
  LEFT JOIN public.colaboradores c ON c.empresa_id = e.id AND c.status = 'ativo'
  WHERE e.id = empresa_uuid
  GROUP BY p.limite_colaboradores;
END;
$$;
