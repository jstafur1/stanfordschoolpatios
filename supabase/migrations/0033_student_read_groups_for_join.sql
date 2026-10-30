-- Students must read course groups before they are enrolled (self-join flow).

DROP POLICY IF EXISTS "course_groups_student_read" ON public.course_groups;
CREATE POLICY "course_groups_student_read" ON public.course_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'student'
    )
    AND (
      EXISTS (
        SELECT 1
        FROM public.course_enrollments ce
        WHERE ce.group_id = course_groups.id
          AND ce.student_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.courses c
        WHERE c.id = course_groups.course_id
          AND c.published = true
      )
    )
  );
