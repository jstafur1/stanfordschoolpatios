-- Teacher role RLS helpers and policies

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'teacher'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_of_course(p_course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_teachers
    WHERE course_id = p_course_id AND teacher_id = auth.uid()
  );
$$;

-- Languages
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "languages_read_authenticated" ON public.languages
  FOR SELECT TO authenticated USING (
    public.is_admin()
    OR (public.is_teacher() AND is_active = true)
    OR (NOT public.is_teacher() AND NOT public.is_admin())
  );

CREATE POLICY "languages_admin_write" ON public.languages
  FOR ALL USING (public.is_admin());

-- Teacher profiles
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_profiles_select" ON public.teacher_profiles
  FOR SELECT USING (
    public.is_admin()
    OR profile_id = auth.uid()
  );

CREATE POLICY "teacher_profiles_update_own" ON public.teacher_profiles
  FOR UPDATE USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "teacher_profiles_admin" ON public.teacher_profiles
  FOR ALL USING (public.is_admin());

-- Course teachers
ALTER TABLE public.course_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_teachers_admin" ON public.course_teachers
  FOR ALL USING (public.is_admin());

CREATE POLICY "course_teachers_teacher_read" ON public.course_teachers
  FOR SELECT USING (teacher_id = auth.uid() OR public.is_admin());

-- Courses: teacher access to assigned courses
DROP POLICY IF EXISTS "courses_read_published" ON public.courses;
CREATE POLICY "courses_read" ON public.courses
  FOR SELECT USING (
    published = true
    OR public.is_admin()
    OR public.is_teacher_of_course(id)
  );

CREATE POLICY "courses_teacher_update" ON public.courses
  FOR UPDATE USING (public.is_teacher_of_course(id) OR public.is_admin());

-- Enrollments: teachers see students in assigned courses
DROP POLICY IF EXISTS "enrollments_student" ON public.course_enrollments;
CREATE POLICY "enrollments_read" ON public.course_enrollments
  FOR SELECT USING (
    student_id = auth.uid()
    OR public.is_admin()
    OR public.is_teacher_of_course(course_id)
  );

-- Exams: teacher CRUD on assigned courses
DROP POLICY IF EXISTS "exams_read" ON public.exams;
DROP POLICY IF EXISTS "exams_admin" ON public.exams;

CREATE POLICY "exams_read" ON public.exams
  FOR SELECT TO authenticated USING (
    public.is_admin()
    OR public.is_teacher_of_course(course_id)
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = exams.course_id AND c.published = true
    )
  );

CREATE POLICY "exams_teacher_admin_write" ON public.exams
  FOR ALL USING (
    public.is_admin() OR public.is_teacher_of_course(course_id)
  );

-- Exam questions & options: teacher on assigned course
DROP POLICY IF EXISTS "exam_questions_read" ON public.exam_questions;
DROP POLICY IF EXISTS "exam_questions_admin" ON public.exam_questions;
DROP POLICY IF EXISTS "exam_options_read" ON public.exam_question_options;
DROP POLICY IF EXISTS "exam_options_admin" ON public.exam_question_options;

CREATE POLICY "exam_questions_read" ON public.exam_questions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "exam_questions_write" ON public.exam_questions
  FOR ALL USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_questions.exam_id
        AND public.is_teacher_of_course(e.course_id)
    )
  );

CREATE POLICY "exam_options_read" ON public.exam_question_options
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "exam_options_write" ON public.exam_question_options
  FOR ALL USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.exam_questions q
      JOIN public.exams e ON e.id = q.exam_id
      WHERE q.id = exam_question_options.question_id
        AND public.is_teacher_of_course(e.course_id)
    )
  );

-- Exam attempts: teacher read for assigned courses
DROP POLICY IF EXISTS "exam_attempts_student" ON public.exam_attempts;
CREATE POLICY "exam_attempts_read" ON public.exam_attempts
  FOR SELECT USING (
    student_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_attempts.exam_id
        AND public.is_teacher_of_course(e.course_id)
    )
  );

CREATE POLICY "exam_attempts_student_write" ON public.exam_attempts
  FOR ALL USING (student_id = auth.uid() OR public.is_admin());

-- Exam answers: teacher grade open questions
DROP POLICY IF EXISTS "exam_answers_student" ON public.exam_answers;
CREATE POLICY "exam_answers_read" ON public.exam_answers
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.exam_attempts a
      WHERE a.id = exam_answers.attempt_id AND a.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.exam_attempts a
      JOIN public.exams e ON e.id = a.exam_id
      WHERE a.id = exam_answers.attempt_id
        AND public.is_teacher_of_course(e.course_id)
    )
  );

CREATE POLICY "exam_answers_teacher_grade" ON public.exam_answers
  FOR UPDATE USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.exam_attempts a
      JOIN public.exams e ON e.id = a.exam_id
      WHERE a.id = exam_answers.attempt_id
        AND public.is_teacher_of_course(e.course_id)
    )
  );

CREATE POLICY "exam_answers_student_write" ON public.exam_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exam_attempts a
      WHERE a.id = exam_answers.attempt_id AND a.student_id = auth.uid()
    )
  );

-- Course content: teacher on assigned courses
DROP POLICY IF EXISTS "course_content_read" ON public.course_content;
DROP POLICY IF EXISTS "course_content_admin" ON public.course_content;

CREATE POLICY "course_content_read" ON public.course_content
  FOR SELECT TO authenticated USING (
    public.is_admin()
    OR public.is_teacher_of_course(course_id)
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_content.course_id AND c.published = true
    )
  );

CREATE POLICY "course_content_write" ON public.course_content
  FOR ALL USING (
    public.is_admin() OR public.is_teacher_of_course(course_id)
  );
