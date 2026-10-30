-- Break RLS recursion: policies on course_enrollments and profiles must not
-- query course_enrollments directly (Postgres detects infinite recursion).

CREATE OR REPLACE FUNCTION public.is_enrolled_in_group(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.course_enrollments
    WHERE student_id = auth.uid()
      AND group_id = p_group_id
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.shares_active_group_with_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.course_enrollments ce_me
    INNER JOIN public.course_enrollments ce_peer
      ON ce_peer.group_id = ce_me.group_id
      AND ce_peer.student_id = p_profile_id
    WHERE ce_me.student_id = auth.uid()
      AND ce_me.group_id IS NOT NULL
      AND ce_me.status = 'active'
      AND ce_peer.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_of_my_group(p_teacher_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.course_enrollments ce
    INNER JOIN public.group_teachers gt ON gt.group_id = ce.group_id
    WHERE ce.student_id = auth.uid()
      AND gt.teacher_id = p_teacher_id
      AND ce.group_id IS NOT NULL
      AND ce.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_student_via_group(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.course_enrollments ce
    INNER JOIN public.group_teachers gt ON gt.group_id = ce.group_id
    WHERE ce.student_id = p_student_id
      AND gt.teacher_id = auth.uid()
      AND ce.group_id IS NOT NULL
  );
$$;

DROP POLICY IF EXISTS "enrollments_read" ON public.course_enrollments;
CREATE POLICY "enrollments_read" ON public.course_enrollments
  FOR SELECT USING (
    student_id = auth.uid()
    OR public.is_admin()
    OR (
      group_id IS NOT NULL
      AND public.is_teacher_of_group(group_id)
    )
    OR (
      group_id IS NULL
      AND public.is_teacher_of_course(course_id)
    )
    OR (
      group_id IS NOT NULL
      AND public.is_enrolled_in_group(group_id)
    )
  );

DROP POLICY IF EXISTS "profiles_teacher_students" ON public.profiles;
CREATE POLICY "profiles_teacher_students" ON public.profiles
  FOR SELECT USING (
    public.is_teacher()
    AND public.is_teacher_student_via_group(profiles.id)
  );

DROP POLICY IF EXISTS "profiles_group_peers" ON public.profiles;
CREATE POLICY "profiles_group_peers" ON public.profiles
  FOR SELECT USING (
    public.shares_active_group_with_profile(profiles.id)
    OR public.is_teacher_of_my_group(profiles.id)
  );
