-- Harden role assignment: only trust role from app_metadata (service-role provisioning).
-- Public signups always receive the student role.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role public.user_role;
  lang_id uuid;
BEGIN
  user_role := COALESCE(
    (NEW.raw_app_meta_data->>'role')::public.user_role,
    'student'::public.user_role
  );

  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  IF user_role = 'teacher' THEN
    lang_id := (NEW.raw_user_meta_data->>'language_id')::uuid;
    IF lang_id IS NOT NULL THEN
      INSERT INTO public.teacher_profiles (profile_id, language_id)
      VALUES (NEW.id, lang_id);
    ELSE
      INSERT INTO public.teacher_profiles (profile_id)
      VALUES (NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
