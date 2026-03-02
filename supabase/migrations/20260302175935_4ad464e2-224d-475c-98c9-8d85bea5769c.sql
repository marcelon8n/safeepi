
-- Add RLS policies for requisitos_colaboradores
ALTER TABLE public.requisitos_colaboradores ENABLE ROW LEVEL SECURITY;

-- We need to join through colaboradores to get empresa_id
CREATE POLICY "Users can view own company requisitos"
ON public.requisitos_colaboradores
FOR SELECT
USING (
  colaborador_id IN (
    SELECT id FROM public.colaboradores WHERE empresa_id = get_user_empresa_id()
  )
);

CREATE POLICY "Users can insert own company requisitos"
ON public.requisitos_colaboradores
FOR INSERT
WITH CHECK (
  colaborador_id IN (
    SELECT id FROM public.colaboradores WHERE empresa_id = get_user_empresa_id()
  )
);

CREATE POLICY "Users can update own company requisitos"
ON public.requisitos_colaboradores
FOR UPDATE
USING (
  colaborador_id IN (
    SELECT id FROM public.colaboradores WHERE empresa_id = get_user_empresa_id()
  )
);

CREATE POLICY "Users can delete own company requisitos"
ON public.requisitos_colaboradores
FOR DELETE
USING (
  colaborador_id IN (
    SELECT id FROM public.colaboradores WHERE empresa_id = get_user_empresa_id()
  )
);
