
-- Create a SECURITY DEFINER function to safely get current user's email
CREATE OR REPLACE FUNCTION public.get_my_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- Drop the problematic policy that directly references auth.users
DROP POLICY IF EXISTS "Users can view invites sent to their email" ON public.convites;

-- Recreate it using the safe function
CREATE POLICY "Users can view invites sent to their email"
ON public.convites
FOR SELECT
TO authenticated
USING (email = get_my_email());
