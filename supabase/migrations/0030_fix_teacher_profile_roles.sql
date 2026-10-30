-- Backfill profiles.role and teacher_profiles for accounts provisioned with
-- role only in app_metadata while the auth trigger still read user_metadata.

UPDATE public.profiles p
SET role = resolved.role
FROM (
  SELECT
    u.id,
    CASE
      WHEN u.raw_app_meta_data->>'role' IN ('admin', 'teacher', 'student')
      THEN (u.raw_app_meta_data->>'role')::public.user_role
      WHEN u.raw_user_meta_data->>'role' IN ('admin', 'teacher', 'student')
      THEN (u.raw_user_meta_data->>'role')::public.user_role
      ELSE NULL
    END AS role
  FROM auth.users u
) resolved
WHERE p.id = resolved.id
  AND resolved.role IS NOT NULL
  AND p.role IS DISTINCT FROM resolved.role;

INSERT INTO public.teacher_profiles (profile_id, language_id)
SELECT
  p.id,
  CASE
    WHEN (u.raw_user_meta_data->>'language_id') ~ '^[0-9a-fA-F-]{36}$'
    THEN (u.raw_user_meta_data->>'language_id')::uuid
    ELSE NULL
  END
FROM public.profiles p
INNER JOIN auth.users u ON u.id = p.id
WHERE p.role = 'teacher'
ON CONFLICT (profile_id) DO NOTHING;
