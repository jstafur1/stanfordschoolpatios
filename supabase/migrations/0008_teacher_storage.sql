-- Optional: allow teachers to upload/manage files for assigned courses.
-- Apply when ready: npx supabase db push

CREATE POLICY "courses_storage_teacher"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'courses'
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.courses c
      WHERE (storage.foldername(name))[1] = c.id::text
        AND public.is_teacher_of_course(c.id)
    )
  )
)
WITH CHECK (
  bucket_id = 'courses'
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.courses c
      WHERE (storage.foldername(name))[1] = c.id::text
        AND public.is_teacher_of_course(c.id)
    )
  )
);

-- Optional: hide is_correct from students on exam_question_options.
-- Students should use server actions that strip correct flags.
-- Uncomment when ready to enforce at the DB layer:
--
-- REVOKE SELECT ON public.exam_question_options FROM authenticated;
-- CREATE VIEW public.exam_question_options_student AS
--   SELECT id, question_id, text, sort_order
--   FROM public.exam_question_options;
-- GRANT SELECT ON public.exam_question_options_student TO authenticated;
