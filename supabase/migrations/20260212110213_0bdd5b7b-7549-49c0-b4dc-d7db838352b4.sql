
DROP POLICY "Users can insert empresa during onboarding" ON public.empresas;

CREATE POLICY "Users can insert empresa during onboarding"
  ON public.empresas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
