CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, nome, role, terms_accepted)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nome', 'Usuário Novo'),
    'admin',
    false
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$function$;