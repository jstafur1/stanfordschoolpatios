-- Course groups with group-level teacher assignments

CREATE TABLE public.course_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  max_students integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT course_groups_course_name_unique UNIQUE (course_id, name)
);

CREATE TABLE public.group_teachers (
  group_id uuid NOT NULL REFERENCES public.course_groups(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, teacher_id)
);

ALTER TABLE public.course_enrollments
  ADD COLUMN group_id uuid REFERENCES public.course_groups(id) ON DELETE SET NULL;

-- Backfill default group per course
INSERT INTO public.course_groups (course_id, name, sort_order)
SELECT id, 'Group 1', 0
FROM public.courses;

UPDATE public.course_enrollments ce
SET group_id = cg.id
FROM public.course_groups cg
WHERE ce.course_id = cg.course_id
  AND cg.name = 'Group 1';

-- Migrate course teachers to default group assignments
INSERT INTO public.group_teachers (group_id, teacher_id)
SELECT cg.id, ct.teacher_id
FROM public.course_teachers ct
JOIN public.course_groups cg
  ON cg.course_id = ct.course_id
  AND cg.name = 'Group 1'
ON CONFLICT DO NOTHING;

CREATE INDEX course_groups_course_id_idx ON public.course_groups (course_id);
CREATE INDEX course_enrollments_group_id_idx ON public.course_enrollments (group_id);
CREATE INDEX group_teachers_teacher_id_idx ON public.group_teachers (teacher_id);

-- Update teacher-of-course helper to use group assignments
CREATE OR REPLACE FUNCTION public.is_teacher_of_course(p_course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_teachers gt
    JOIN public.course_groups cg ON cg.id = gt.group_id
    WHERE cg.course_id = p_course_id
      AND gt.teacher_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_of_group(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_teachers
    WHERE group_id = p_group_id AND teacher_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_student_in_course_group(
  p_course_id uuid,
  p_student_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_enrollments
    WHERE course_id = p_course_id
      AND student_id = p_student_id
      AND status = 'active'
  );
$$;

-- RLS for course_groups
ALTER TABLE public.course_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_groups_admin" ON public.course_groups
  FOR ALL USING (public.is_admin());

CREATE POLICY "course_groups_teacher_read" ON public.course_groups
  FOR SELECT USING (
    public.is_admin()
    OR public.is_teacher_of_course(course_id)
    OR EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.group_id = course_groups.id
        AND ce.student_id = auth.uid()
    )
  );

CREATE POLICY "course_groups_student_read" ON public.course_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.group_id = course_groups.id
        AND ce.student_id = auth.uid()
    )
  );

-- RLS for group_teachers
ALTER TABLE public.group_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_teachers_admin" ON public.group_teachers
  FOR ALL USING (public.is_admin());

CREATE POLICY "group_teachers_teacher_read" ON public.group_teachers
  FOR SELECT USING (
    teacher_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.course_groups cg
      WHERE cg.id = group_teachers.group_id
        AND public.is_teacher_of_course(cg.course_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.course_enrollments ce
      WHERE ce.group_id = group_teachers.group_id
        AND ce.student_id = auth.uid()
    )
  );

-- Teachers see enrollments only for their groups
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
  );

-- Teachers can read content views for students in their groups
DROP POLICY IF EXISTS "content_views_student" ON public.content_views;
CREATE POLICY "content_views_read" ON public.content_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.id = content_views.enrollment_id
        AND ce.student_id = auth.uid()
    )
    OR public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.course_enrollments ce
      WHERE ce.id = content_views.enrollment_id
        AND ce.group_id IS NOT NULL
        AND public.is_teacher_of_group(ce.group_id)
    )
  );

CREATE POLICY "content_views_student_insert" ON public.content_views
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.id = content_views.enrollment_id
        AND ce.student_id = auth.uid()
    )
  );

CREATE POLICY "content_views_student_update" ON public.content_views
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.id = content_views.enrollment_id
        AND ce.student_id = auth.uid()
    )
  );

-- Student exam answer updates (in-progress attempts only)
DROP POLICY IF EXISTS "exam_answers_student_write" ON public.exam_answers;
CREATE POLICY "exam_answers_student_insert" ON public.exam_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.exam_attempts ea
      WHERE ea.id = exam_answers.attempt_id
        AND ea.student_id = auth.uid()
        AND ea.status = 'in_progress'
    )
  );

CREATE POLICY "exam_answers_student_update" ON public.exam_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.exam_attempts ea
      WHERE ea.id = exam_answers.attempt_id
        AND ea.student_id = auth.uid()
        AND ea.status = 'in_progress'
    )
  );
