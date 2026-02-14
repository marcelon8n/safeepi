
-- Tabela de convites para vincular novos usuários a empresas existentes
CREATE TABLE public.convites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company invites"
ON public.convites FOR SELECT
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can insert own company invites"
ON public.convites FOR INSERT
WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can update own company invites"
ON public.convites FOR UPDATE
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can delete own company invites"
ON public.convites FOR DELETE
USING (empresa_id = get_user_empresa_id());

-- Permitir que usuários sem empresa vejam convites destinados a eles (para aceitar no onboarding)
CREATE POLICY "Users can view invites sent to their email"
ON public.convites FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Função para aceitar convite: vincula o usuário à empresa do convite
CREATE OR REPLACE FUNCTION public.accept_invite(p_convite_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_empresa_id UUID;
  v_email TEXT;
  v_user_email TEXT;
BEGIN
  -- Buscar dados do convite
  SELECT empresa_id, email INTO v_empresa_id, v_email
  FROM public.convites
  WHERE id = p_convite_id AND status = 'pendente';

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Convite não encontrado ou já utilizado';
  END IF;

  -- Verificar se o email do convite corresponde ao usuário logado
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  IF v_user_email != v_email THEN
    RAISE EXCEPTION 'Este convite não pertence ao seu e-mail';
  END IF;

  -- Vincular usuário à empresa
  UPDATE public.profiles
  SET empresa_id = v_empresa_id
  WHERE user_id = auth.uid();

  -- Marcar convite como aceito
  UPDATE public.convites
  SET status = 'aceito'
  WHERE id = p_convite_id;

  RETURN v_empresa_id;
END;
$$;
