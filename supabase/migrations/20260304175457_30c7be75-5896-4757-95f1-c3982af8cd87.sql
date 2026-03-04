
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_registro_id UUID;
  v_detalhes JSONB;
  v_empresa_id UUID;
  v_usuario_id UUID;
BEGIN
  v_usuario_id := auth.uid();

  SELECT empresa_id INTO v_empresa_id
  FROM public.profiles
  WHERE user_id = v_usuario_id;

  IF TG_OP = 'DELETE' THEN
    v_registro_id := OLD.id;
    v_detalhes := to_jsonb(OLD);
  ELSIF TG_OP = 'UPDATE' THEN
    v_registro_id := NEW.id;
    v_detalhes := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSE
    v_registro_id := NEW.id;
    v_detalhes := to_jsonb(NEW);
  END IF;

  -- Enrich entregas_epi with EPI name and colaborador name
  IF TG_TABLE_NAME = 'entregas_epi' THEN
    DECLARE
      v_epi_nome TEXT;
      v_colab_nome TEXT;
      v_epi_id UUID;
      v_colab_id UUID;
    BEGIN
      IF TG_OP = 'DELETE' THEN
        v_epi_id := OLD.epi_id;
        v_colab_id := OLD.colaborador_id;
      ELSE
        v_epi_id := NEW.epi_id;
        v_colab_id := NEW.colaborador_id;
      END IF;

      SELECT nome_epi INTO v_epi_nome FROM public.epis WHERE id = v_epi_id;
      SELECT nome_completo INTO v_colab_nome FROM public.colaboradores WHERE id = v_colab_id;

      v_detalhes := v_detalhes || jsonb_build_object(
        'nome_epi', COALESCE(v_epi_nome, 'Desconhecido'),
        'nome_colaborador', COALESCE(v_colab_nome, 'Desconhecido')
      );
    END;
  END IF;

  -- Enrich colaboradores with name
  IF TG_TABLE_NAME = 'colaboradores' THEN
    DECLARE
      v_nome TEXT;
    BEGIN
      IF TG_OP = 'DELETE' THEN
        v_nome := OLD.nome_completo;
      ELSE
        v_nome := NEW.nome_completo;
      END IF;
      v_detalhes := v_detalhes || jsonb_build_object('nome_colaborador', COALESCE(v_nome, ''));
    END;
  END IF;

  -- Store user name for display
  DECLARE
    v_usuario_nome TEXT;
  BEGIN
    SELECT nome INTO v_usuario_nome FROM public.profiles WHERE user_id = v_usuario_id;
    v_detalhes := v_detalhes || jsonb_build_object('_usuario_nome', COALESCE(v_usuario_nome, ''));
  END;

  INSERT INTO public.auditoria (usuario_id, acao, tabela, registro_id, detalhes, empresa_id, created_at)
  VALUES (v_usuario_id, TG_OP, TG_TABLE_NAME, v_registro_id, v_detalhes, v_empresa_id, now() AT TIME ZONE 'America/Sao_Paulo');

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;
