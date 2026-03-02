
-- Allow admins/super_admins to view all profiles in their empresa
CREATE POLICY "Admins can view company profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (empresa_id = get_user_empresa_id());

-- Allow super_admins to update roles of users in same empresa (not their own role for safety)
CREATE POLICY "Super admins can update company profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  empresa_id = get_user_empresa_id()
  AND get_my_role() = 'super_admin'
);
