
-- =============================================
-- 1. Enable RLS on alocacoes_obras + add policies
-- =============================================
ALTER TABLE public.alocacoes_obras ENABLE ROW LEVEL SECURITY;

-- alocacoes_obras references obras and colaboradores which are empresa-scoped.
-- Use a subquery via obras to get empresa_id.
CREATE POLICY "Users can view own company alocacoes"
ON public.alocacoes_obras FOR SELECT TO authenticated
USING (
  obra_id IN (SELECT id FROM public.obras WHERE empresa_id = get_user_empresa_id())
);

CREATE POLICY "Users can insert own company alocacoes"
ON public.alocacoes_obras FOR INSERT TO authenticated
WITH CHECK (
  obra_id IN (SELECT id FROM public.obras WHERE empresa_id = get_user_empresa_id())
);

CREATE POLICY "Users can update own company alocacoes"
ON public.alocacoes_obras FOR UPDATE TO authenticated
USING (
  obra_id IN (SELECT id FROM public.obras WHERE empresa_id = get_user_empresa_id())
);

CREATE POLICY "Users can delete own company alocacoes"
ON public.alocacoes_obras FOR DELETE TO authenticated
USING (
  obra_id IN (SELECT id FROM public.obras WHERE empresa_id = get_user_empresa_id())
);

-- =============================================
-- 2. Enable RLS on planos (public read-only)
-- =============================================
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Planos are publicly readable"
ON public.planos FOR SELECT
USING (true);

-- =============================================
-- 3. Recreate views with security_invoker = true
-- =============================================

-- v_alertas_vencimento
CREATE OR REPLACE VIEW public.v_alertas_vencimento
WITH (security_invoker = true) AS
SELECT c.nome_completo AS colaborador_nome,
    e.nome_epi AS epi_nome,
    en.data_vencimento,
    s.email_encarregado,
    en.empresa_id
   FROM entregas_epi en
     JOIN colaboradores c ON en.colaborador_id = c.id
     JOIN epis e ON en.epi_id = e.id
     LEFT JOIN setores s ON c.setor_id = s.id
  WHERE en.status = 'ativa';

-- view_conformidade_colaboradores
CREATE OR REPLACE VIEW public.view_conformidade_colaboradores
WITH (security_invoker = true) AS
SELECT id AS colaborador_id,
    nome_completo AS nome_colaborador,
    cargo,
    status AS status_colaborador,
    (SELECT requisitos_colaboradores.data_validade
       FROM requisitos_colaboradores
      WHERE requisitos_colaboradores.colaborador_id = c.id AND requisitos_colaboradores.tipo_requisito = 'ASO'
      ORDER BY requisitos_colaboradores.data_validade DESC
     LIMIT 1) AS validade_aso,
    (EXISTS (SELECT 1
       FROM requisitos_colaboradores
      WHERE requisitos_colaboradores.colaborador_id = c.id AND requisitos_colaboradores.tipo_requisito = 'Integração')) AS integracao_concluida,
    COALESCE((EXISTS (SELECT 1
       FROM entregas_epi
      WHERE entregas_epi.colaborador_id = c.id AND entregas_epi.status = ANY(ARRAY['entregue', 'Ativo']))), false) AS possui_epis
   FROM colaboradores c;

-- view_dashboard_conformidade
CREATE OR REPLACE VIEW public.view_dashboard_conformidade
WITH (security_invoker = true) AS
SELECT empresa_id,
    count(*) FILTER (WHERE status = 'ativa' AND data_vencimento < CURRENT_DATE) AS epis_vencidos,
    count(DISTINCT colaborador_id) FILTER (WHERE status = 'ativa' AND data_vencimento < CURRENT_DATE) AS colaboradores_irregulares,
    (SELECT count(*) FROM epis e WHERE e.empresa_id = ent.empresa_id AND e.data_validade_ca < CURRENT_DATE) AS cas_vencidos
   FROM entregas_epi ent
  GROUP BY empresa_id;

-- vw_epis_para_escalacao
CREATE OR REPLACE VIEW public.vw_epis_para_escalacao
WITH (security_invoker = true) AS
SELECT e.id AS entrega_id,
    e.empresa_id,
    emp.nome_fantasia,
    c.nome_completo,
    ep.nome_epi,
    e.data_vencimento,
    (CURRENT_DATE - e.data_vencimento) AS dias_atraso
   FROM entregas_epi e
     JOIN colaboradores c ON c.id = e.colaborador_id
     JOIN epis ep ON ep.id = e.epi_id
     JOIN empresas emp ON emp.id = e.empresa_id
  WHERE e.status = 'ativa' AND e.status_troca = 'pendente' AND e.data_vencimento < (CURRENT_DATE - '15 days'::interval);

-- vw_epis_vencendo_7_dias
CREATE OR REPLACE VIEW public.vw_epis_vencendo_7_dias
WITH (security_invoker = true) AS
SELECT e.empresa_id,
    emp.nome_fantasia AS empresa_nome,
    COALESCE(c.email_encarregado, s.email_encarregado) AS email_notificacao,
    json_agg(json_build_object('colaborador', c.nome_completo, 'epi', ep.nome_epi, 'data_vencimento', e.data_vencimento)) AS lista_epis,
    count(*) AS total_epis
   FROM entregas_epi e
     JOIN colaboradores c ON c.id = e.colaborador_id
     JOIN epis ep ON ep.id = e.epi_id
     JOIN empresas emp ON emp.id = e.empresa_id
     LEFT JOIN setores s ON s.id = c.setor_id
  WHERE e.status = 'ativa' AND e.status_troca = 'pendente'
    AND e.data_vencimento >= CURRENT_DATE AND e.data_vencimento <= (CURRENT_DATE + '7 days'::interval)
  GROUP BY e.empresa_id, emp.nome_fantasia, COALESCE(c.email_encarregado, s.email_encarregado);

-- vw_epis_vencidos
CREATE OR REPLACE VIEW public.vw_epis_vencidos
WITH (security_invoker = true) AS
SELECT e.id AS entrega_id,
    e.empresa_id,
    emp.nome_fantasia AS empresa_nome,
    c.nome_completo,
    ep.nome_epi,
    e.data_vencimento,
    COALESCE(c.email_encarregado, s.email_encarregado) AS email_notificacao
   FROM entregas_epi e
     JOIN colaboradores c ON c.id = e.colaborador_id
     JOIN epis ep ON ep.id = e.epi_id
     JOIN empresas emp ON emp.id = e.empresa_id
     LEFT JOIN setores s ON s.id = c.setor_id
  WHERE e.status = 'ativa' AND e.status_troca = 'pendente' AND e.data_vencimento < CURRENT_DATE;

-- vw_relatorio_mensal_resumo
CREATE OR REPLACE VIEW public.vw_relatorio_mensal_resumo
WITH (security_invoker = true) AS
SELECT e.empresa_id,
    emp.nome_fantasia,
    count(*) FILTER (WHERE date_trunc('month', e.data_entrega::timestamp with time zone) = date_trunc('month', CURRENT_DATE::timestamp with time zone)) AS total_entregues_mes,
    count(*) FILTER (WHERE e.data_vencimento < CURRENT_DATE AND e.status_troca = 'pendente') AS total_vencidos,
    count(*) FILTER (WHERE e.status_troca = 'pendente') AS total_pendentes
   FROM entregas_epi e
     JOIN empresas emp ON emp.id = e.empresa_id
  GROUP BY e.empresa_id, emp.nome_fantasia;
