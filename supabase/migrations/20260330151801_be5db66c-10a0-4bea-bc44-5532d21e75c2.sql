ALTER TABLE public.colaboradores ADD COLUMN pin_assinatura text;

ALTER TABLE public.colaboradores ADD CONSTRAINT pin_assinatura_format CHECK (pin_assinatura IS NULL OR pin_assinatura ~ '^\d{4}$');