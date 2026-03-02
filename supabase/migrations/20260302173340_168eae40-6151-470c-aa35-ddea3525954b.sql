
-- Add new columns to obras table
ALTER TABLE public.obras
ADD COLUMN IF NOT EXISTS cliente text,
ADD COLUMN IF NOT EXISTS endereco text,
ADD COLUMN IF NOT EXISTS alvara_url text;

-- Create diario_obra table
CREATE TABLE public.diario_obra (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id uuid NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id),
  descricao text NOT NULL,
  foto_url text,
  autor_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.diario_obra ENABLE ROW LEVEL SECURITY;

-- RLS policies for diario_obra
CREATE POLICY "Users can view own company diario"
ON public.diario_obra FOR SELECT
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can insert own company diario"
ON public.diario_obra FOR INSERT
WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can update own company diario"
ON public.diario_obra FOR UPDATE
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can delete own company diario"
ON public.diario_obra FOR DELETE
USING (empresa_id = get_user_empresa_id());

-- Create storage bucket for obras documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('obras-documentos', 'obras-documentos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload obras documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'obras-documentos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view obras documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'obras-documentos');

CREATE POLICY "Users can delete own obras documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'obras-documentos' AND auth.uid() IS NOT NULL);
