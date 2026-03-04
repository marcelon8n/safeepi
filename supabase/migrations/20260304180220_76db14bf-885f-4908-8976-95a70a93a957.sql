
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
  v_usuario_nome TEXT;
  v_resumo TEXT;
BEGIN
  v_usuario_id := auth.uid();

  -- Resolve user name and empresa_id
  SELECT nome, empresa_id INTO v_usuario_nome, v_empresa_id
  FROM public.profiles
  WHERE user_id = v_usuario_id;

  -- Base record ID and raw data
  IF TG_OP = 'DELETE' THEN
    v_registro_id := OLD.id;
  ELSE
    v_registro_id := NEW.id;
  END IF;

  -- Build human-readable summary per table
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

      IF TG_OP = 'INSERT' THEN
        v_resumo := 'Entrega de ' || COALESCE(v_epi_nome, 'EPI desconhecido') || ' para ' || COALESCE(v_colab_nome, 'colaborador desconhecido');
      ELSIF TG_OP = 'UPDATE' THEN
        v_resumo := 'Atualização de entrega de ' || COALESCE(v_epi_nome, 'EPI desconhecido') || ' para ' || COALESCE(v_colab_nome, 'colaborador desconhecido');
      ELSE
        v_resumo := 'Exclusão de entrega de ' || COALESCE(v_epi_nome, 'EPI desconhecido') || ' para ' || COALESCE(v_colab_nome, 'colaborador desconhecido');
      END IF;
    END;

  ELSIF TG_TABLE_NAME = 'colaboradores' THEN
    DECLARE
      v_nome TEXT;
      v_status TEXT;
    BEGIN
      IF TG_OP = 'DELETE' THEN
        v_nome := OLD.nome_completo;
      ELSE
        v_nome := NEW.nome_completo;
      END IF;

      IF TG_OP = 'INSERT' THEN
        v_resumo := 'Cadastro do colaborador ' || COALESCE(v_nome, '');
      ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
          v_resumo := 'Alteração de status de ' || COALESCE(v_nome, '') || ' para ' || COALESCE(NEW.status, '');
        ELSIF OLD.nome_completo IS DISTINCT FROM NEW.nome_completo THEN
          v_resumo := 'Alteração do nome de ' || COALESCE(OLD.nome_completo, '') || ' para ' || COALESCE(NEW.nome_completo, '');
        ELSE
          v_resumo := 'Atualização do colaborador ' || COALESCE(v_nome, '');
        END IF;
      ELSE
        v_resumo := 'Exclusão do colaborador ' || COALESCE(v_nome, '');
      END IF;
    END;

  ELSIF TG_TABLE_NAME = 'epis' THEN
    DECLARE
      v_nome TEXT;
    BEGIN
      IF TG_OP = 'DELETE' THEN
        v_nome := OLD.nome_epi;
      ELSE
        v_nome := NEW.nome_epi;
      END IF;

      IF TG_OP = 'INSERT' THEN
        v_resumo := 'Novo EPI cadastrado: ' || COALESCE(v_nome, '');
      ELSIF TG_OP = 'UPDATE' THEN
        v_resumo := 'Atualização do EPI ' || COALESCE(v_nome, '');
      ELSE
        v_resumo := 'Exclusão do EPI ' || COALESCE(v_nome, '');
      END IF;
    END;

  ELSIF TG_TABLE_NAME = 'obras' THEN
    DECLARE
      v_nome TEXT;
    BEGIN
      IF TG_OP = 'DELETE' THEN
        v_nome := OLD.nome;
      ELSE
        v_nome := NEW.nome;
      END IF;

      IF TG_OP = 'INSERT' THEN
        v_resumo := 'Nova obra cadastrada: ' || COALESCE(v_nome, '');
      ELSIF TG_OP = 'UPDATE' THEN
        v_resumo := 'Atualização da obra ' || COALESCE(v_nome, '');
      ELSE
        v_resumo := 'Exclusão da obra ' || COALESCE(v_nome, '');
      END IF;
    END;

  ELSE
    IF TG_OP = 'INSERT' THEN
      v_resumo := 'Criação em ' || TG_TABLE_NAME;
    ELSIF TG_OP = 'UPDATE' THEN
      v_resumo := 'Atualização em ' || TG_TABLE_NAME;
    ELSE
      v_resumo := 'Exclusão em ' || TG_TABLE_NAME;
    END IF;
  END IF;

  -- Build detalhes JSONB with raw data + enriched fields
  IF TG_OP = 'UPDATE' THEN
    v_detalhes := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    v_detalhes := to_jsonb(OLD);
  ELSE
    v_detalhes := to_jsonb(NEW);
  END IF;

  v_detalhes := v_detalhes || jsonb_build_object(
    '_resumo', v_resumo,
    '_usuario_nome', COALESCE(v_usuario_nome, 'Sistema')
  );

  INSERT INTO public.auditoria (usuario_id, acao, tabela, registro_id, detalhes, empresa_id, created_at)
  VALUES (v_usuario_id, TG_OP, TG_TABLE_NAME, v_registro_id, v_detalhes, v_empresa_id, now() AT TIME ZONE 'America/Sao_Paulo');

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;
