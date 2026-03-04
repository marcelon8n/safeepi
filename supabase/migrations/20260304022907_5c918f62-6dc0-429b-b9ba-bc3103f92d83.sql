
ALTER TABLE public.entregas_epi
ADD COLUMN ca_numero_entregue text,
ADD COLUMN data_validade_ca_entregue date;

COMMENT ON COLUMN public.entregas_epi.ca_numero_entregue IS 'CA number frozen at delivery time for legal audit trail';
COMMENT ON COLUMN public.entregas_epi.data_validade_ca_entregue IS 'CA expiry date frozen at delivery time for legal audit trail';
