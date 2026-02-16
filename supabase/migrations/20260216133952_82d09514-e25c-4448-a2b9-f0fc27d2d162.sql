
-- 1. Recriar view v_alertas_vencimento com SECURITY INVOKER
DROP VIEW IF EXISTS public.v_alertas_vencimento;
CREATE VIEW public.v_alertas_vencimento WITH (security_invoker = true) AS
SELECT e.id AS entrega_id,
    e.data_vencimento,
    e.empresa_id,
    c.nome_completo AS colaborador_nome,
    s.nome AS setor_nome,
    s.email_encarregado,
    e.epi_id
FROM ((entregas_epi e
    JOIN colaboradores c ON ((e.colaborador_id = c.id)))
    JOIN setores s ON ((c.setor_id = s.id)))
WHERE ((e.status_troca = 'pendente'::text) OR (e.status_troca IS NULL));

-- 2. Restringir politica INSERT de empresas
DROP POLICY IF EXISTS "Permitir_Criar_Empresa_Onboarding" ON public.empresas;
CREATE POLICY "Permitir_Criar_Empresa_Onboarding" ON public.empresas
FOR INSERT WITH CHECK (
  NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND empresa_id IS NOT NULL)
);

-- 3. Remover politicas ALL duplicadas
DROP POLICY IF EXISTS "Gestao Colaboradores Empresa" ON public.colaboradores;
DROP POLICY IF EXISTS "Gestao EPIs Empresa" ON public.epis;
DROP POLICY IF EXISTS "Gestao Entregas Empresa" ON public.entregas_epi;

-- 4. Adicionar coluna email em profiles e atualizar trigger
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'nome', NEW.email);
  RETURN NEW;
END;
$function$;

-- 5. Preencher emails existentes a partir de auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;

-- 6. Constraint UNIQUE para evitar convites duplicados por empresa+email
ALTER TABLE public.convites ADD CONSTRAINT convites_empresa_email_unique UNIQUE (empresa_id, email);
