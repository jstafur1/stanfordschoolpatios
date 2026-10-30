-- Pending enrollments + per-student approval flag (part 2: policies).

-- Students may request enrollment for themselves (active or pending based on profile flag).
CREATE OR REPLACE FUNCTION public.student_may_self_enroll(p_status public.enrollment_status)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'student'
      AND (
        (p_status = 'pending'::public.enrollment_status AND p.requires_enrollment_approval = true)
        OR (p_status = 'active'::public.enrollment_status AND p.requires_enrollment_approval = false)
      )
  );
$$;

DROP POLICY IF EXISTS "enrollments_student_insert" ON public.course_enrollments;
CREATE POLICY "enrollments_student_insert" ON public.course_enrollments
  FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND status IN ('active'::public.enrollment_status, 'pending'::public.enrollment_status)
    AND public.student_may_self_enroll(status)
    AND EXISTS (
      SELECT 1
      FROM public.courses c
      WHERE c.id = course_id
        AND c.published = true
    )
  );

-- Tighten content views to active enrollments only.
DROP POLICY IF EXISTS "content_views_student" ON public.content_views;
CREATE POLICY "content_views_student" ON public.content_views
  FOR ALL USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.course_enrollments e
      WHERE e.id = content_views.enrollment_id
        AND e.student_id = auth.uid()
        AND e.status = 'active'::public.enrollment_status
    )
  );
