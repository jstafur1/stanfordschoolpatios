-- Allow students to see classmates in the same group and read peer/teacher profiles.
-- Fix teacher student-name policy to use group_teachers instead of course_teachers.

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
      AND EXISTS (
        SELECT 1
        FROM public.course_enrollments mine
        WHERE mine.student_id = auth.uid()
          AND mine.group_id = course_enrollments.group_id
          AND mine.status = 'active'
      )
    )
  );

DROP POLICY IF EXISTS "profiles_teacher_students" ON public.profiles;
CREATE POLICY "profiles_teacher_students" ON public.profiles
  FOR SELECT USING (
    public.is_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.course_enrollments ce
      INNER JOIN public.group_teachers gt ON gt.group_id = ce.group_id
      WHERE ce.student_id = profiles.id
        AND gt.teacher_id = auth.uid()
        AND ce.group_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "profiles_group_peers" ON public.profiles;
CREATE POLICY "profiles_group_peers" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.course_enrollments ce_me
      INNER JOIN public.course_enrollments ce_peer
        ON ce_peer.group_id = ce_me.group_id
        AND ce_peer.student_id = profiles.id
      WHERE ce_me.student_id = auth.uid()
        AND ce_me.group_id IS NOT NULL
        AND ce_me.status = 'active'
        AND ce_peer.status = 'active'
    )
    OR EXISTS (
      SELECT 1
      FROM public.course_enrollments ce
      INNER JOIN public.group_teachers gt ON gt.group_id = ce.group_id
      WHERE ce.student_id = auth.uid()
        AND gt.teacher_id = profiles.id
        AND ce.group_id IS NOT NULL
        AND ce.status = 'active'
    )
  );
