-- Add teacher role and new tables

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'teacher';

CREATE TABLE IF NOT EXISTS public.languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  profile_id uuid PRIMARY KEY NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  language_id uuid REFERENCES public.languages(id) ON DELETE SET NULL,
  bio text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.course_teachers (
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (course_id, teacher_id)
);

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS language_id uuid REFERENCES public.languages(id) ON DELETE SET NULL;

-- Only one admin allowed
CREATE UNIQUE INDEX IF NOT EXISTS profiles_one_admin_idx
  ON public.profiles ((true))
  WHERE role = 'admin';

-- Updated auth trigger: role from metadata, optional teacher_profiles
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
    (NEW.raw_user_meta_data->>'role')::public.user_role,
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
