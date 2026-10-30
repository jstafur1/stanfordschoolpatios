-- Baseline RLS for Phase 1. Refine when building admin/student UIs.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Profiles
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (public.is_admin());

-- Categories & tags (read all authenticated; admin write)
CREATE POLICY "categories_read" ON public.categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "categories_admin" ON public.categories
  FOR ALL USING (public.is_admin());

CREATE POLICY "tags_read" ON public.tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "tags_admin" ON public.tags
  FOR ALL USING (public.is_admin());

-- Courses
CREATE POLICY "courses_read_published" ON public.courses
  FOR SELECT USING (published = true OR public.is_admin());

CREATE POLICY "courses_admin" ON public.courses
  FOR ALL USING (public.is_admin());

CREATE POLICY "course_tags_read" ON public.course_tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "course_tags_admin" ON public.course_tags
  FOR ALL USING (public.is_admin());

CREATE POLICY "course_content_read" ON public.course_content
  FOR SELECT TO authenticated USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_content.course_id AND c.published = true
    )
  );

CREATE POLICY "course_content_admin" ON public.course_content
  FOR ALL USING (public.is_admin());

-- Enrollments & progress
CREATE POLICY "enrollments_student" ON public.course_enrollments
  FOR SELECT USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "enrollments_admin" ON public.course_enrollments
  FOR ALL USING (public.is_admin());

CREATE POLICY "content_views_student" ON public.content_views
  FOR ALL USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.course_enrollments e
      WHERE e.id = content_views.enrollment_id AND e.student_id = auth.uid()
    )
  );

-- Exams
CREATE POLICY "exams_read" ON public.exams
  FOR SELECT TO authenticated USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = exams.course_id AND c.published = true
    )
  );

CREATE POLICY "exams_admin" ON public.exams
  FOR ALL USING (public.is_admin());

CREATE POLICY "exam_questions_read" ON public.exam_questions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "exam_questions_admin" ON public.exam_questions
  FOR ALL USING (public.is_admin());

CREATE POLICY "exam_options_read" ON public.exam_question_options
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "exam_options_admin" ON public.exam_question_options
  FOR ALL USING (public.is_admin());

CREATE POLICY "exam_attempts_student" ON public.exam_attempts
  FOR ALL USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "exam_answers_student" ON public.exam_answers
  FOR ALL USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.exam_attempts a
      WHERE a.id = exam_answers.attempt_id AND a.student_id = auth.uid()
    )
  );
