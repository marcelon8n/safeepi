
-- Create convites table
CREATE TABLE public.convites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  status TEXT NOT NULL DEFAULT 'pendente',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT convites_empresa_email_unique UNIQUE (empresa_id, email)
);

ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company invites"
ON public.convites FOR SELECT
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can view invites sent to their email"
ON public.convites FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Owners can insert company invites"
ON public.convites FOR INSERT
WITH CHECK (
  empresa_id = get_user_empresa_id()
  AND get_my_role() IN ('owner'::user_role, 'super_admin'::user_role)
);

CREATE POLICY "Owners can update company invites"
ON public.convites FOR UPDATE
USING (
  empresa_id = get_user_empresa_id()
  AND get_my_role() IN ('owner'::user_role, 'super_admin'::user_role)
);

CREATE POLICY "Owners can delete company invites"
ON public.convites FOR DELETE
USING (
  empresa_id = get_user_empresa_id()
  AND get_my_role() IN ('owner'::user_role, 'super_admin'::user_role)
);

-- Allow owners to update profiles in their own company
CREATE POLICY "Owners can update company profiles"
ON public.profiles FOR UPDATE
USING (
  empresa_id = get_user_empresa_id()
  AND get_my_role() IN ('owner'::user_role, 'super_admin'::user_role)
);

-- Update accept_invite to also set the role from the invite
CREATE OR REPLACE FUNCTION public.accept_invite(p_convite_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_empresa_id UUID;
  v_email TEXT;
  v_role user_role;
  v_user_email TEXT;
BEGIN
  SELECT empresa_id, email, role INTO v_empresa_id, v_email, v_role
  FROM public.convites
  WHERE id = p_convite_id AND status = 'pendente';

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Convite não encontrado ou já utilizado';
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  IF v_user_email != v_email THEN
    RAISE EXCEPTION 'Este convite não pertence ao seu e-mail';
  END IF;

  UPDATE public.profiles
  SET empresa_id = v_empresa_id, role = v_role
  WHERE user_id = auth.uid();

  UPDATE public.convites
  SET status = 'aceito'
  WHERE id = p_convite_id;

  RETURN v_empresa_id;
END;
$$;
