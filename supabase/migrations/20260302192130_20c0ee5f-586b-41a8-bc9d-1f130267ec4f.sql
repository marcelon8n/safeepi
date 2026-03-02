-- Fix broken RLS policies on obras that compare empresa_id to auth.uid() (should be get_user_empresa_id())
DROP POLICY IF EXISTS "Select obras da propria empresa" ON public.obras;
DROP POLICY IF EXISTS "Delete obras da propria empresa" ON public.obras;
DROP POLICY IF EXISTS "Update obras da propria empresa" ON public.obras;