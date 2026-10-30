-- Hide is_correct from students querying exam_question_options directly.
-- Teachers and admins retain full table access via RLS.
-- Apply: npx supabase db push

ALTER TABLE public.exam_question_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exam_options_read" ON public.exam_question_options;
DROP POLICY IF EXISTS "exam_options_write" ON public.exam_question_options;
DROP POLICY IF EXISTS "exam_options_admin" ON public.exam_question_options;
DROP POLICY IF EXISTS "exam_question_options_teacher_admin" ON public.exam_question_options;
DROP POLICY IF EXISTS "exam_question_options_admin" ON public.exam_question_options;

CREATE POLICY "exam_question_options_teacher_admin" ON public.exam_question_options
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.exam_questions q
      JOIN public.exams e ON e.id = q.exam_id
      WHERE q.id = exam_question_options.question_id
        AND public.is_teacher_of_course(e.course_id)
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.exam_questions q
      JOIN public.exams e ON e.id = q.exam_id
      WHERE q.id = exam_question_options.question_id
        AND public.is_teacher_of_course(e.course_id)
    )
  );

CREATE OR REPLACE VIEW public.exam_question_options_student AS
  SELECT id, question_id, text, sort_order
  FROM public.exam_question_options;

GRANT SELECT ON public.exam_question_options_student TO anon, authenticated;

-- Allow anonymous landing page to read active languages for catalog labels
DROP POLICY IF EXISTS "languages_read_public" ON public.languages;
CREATE POLICY "languages_read_public" ON public.languages
  FOR SELECT
  USING (is_active = true);

NOTIFY pgrst, 'reload schema';
