-- Teachers need student names on course dashboards, grades, and appointments.
-- Without this, nested profile selects return null and server components crash.

CREATE POLICY "profiles_teacher_students" ON public.profiles
  FOR SELECT USING (
    public.is_teacher()
    AND EXISTS (
      SELECT 1
      FROM public.course_enrollments ce
      INNER JOIN public.course_teachers ct ON ct.course_id = ce.course_id
      WHERE ce.student_id = profiles.id
        AND ct.teacher_id = auth.uid()
    )
  );
