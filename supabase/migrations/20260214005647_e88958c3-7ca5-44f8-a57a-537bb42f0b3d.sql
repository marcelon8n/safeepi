
-- Create setores table
CREATE TABLE public.setores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email_encarregado TEXT,
  empresa_id UUID REFERENCES public.empresas(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company setores"
  ON public.setores FOR SELECT TO authenticated
  USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can insert own company setores"
  ON public.setores FOR INSERT TO authenticated
  WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can update own company setores"
  ON public.setores FOR UPDATE TO authenticated
  USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can delete own company setores"
  ON public.setores FOR DELETE TO authenticated
  USING (empresa_id = get_user_empresa_id());

-- Add setor_id to colaboradores
ALTER TABLE public.colaboradores
  ADD COLUMN setor_id UUID REFERENCES public.setores(id);
