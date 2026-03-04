
-- Função genérica de auditoria
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_acao TEXT;
  v_registro_id UUID;
  v_detalhes JSONB;
  v_empresa_id UUID;
  v_usuario_id UUID;
BEGIN
  v_usuario_id := auth.uid();

  -- Buscar empresa_id do perfil do usuário
  SELECT empresa_id INTO v_empresa_id
  FROM public.profiles
  WHERE user_id = v_usuario_id;

  -- Determinar ação
  v_acao := TG_OP;

  -- Determinar registro_id e detalhes
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

  INSERT INTO public.auditoria (usuario_id, acao, tabela, registro_id, detalhes, empresa_id)
  VALUES (v_usuario_id, v_acao, TG_TABLE_NAME, v_registro_id, v_detalhes, v_empresa_id);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Triggers para colaboradores
CREATE TRIGGER trg_audit_colaboradores
AFTER INSERT OR UPDATE OR DELETE ON public.colaboradores
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Triggers para epis
CREATE TRIGGER trg_audit_epis
AFTER INSERT OR UPDATE OR DELETE ON public.epis
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Triggers para entregas_epi
CREATE TRIGGER trg_audit_entregas_epi
AFTER INSERT OR UPDATE OR DELETE ON public.entregas_epi
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Triggers para obras
CREATE TRIGGER trg_audit_obras
AFTER INSERT OR UPDATE OR DELETE ON public.obras
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
