-- Storage bucket `courses` — path convention: {courseId}/{contentId}/{filename}

INSERT INTO storage.buckets (id, name, public)
VALUES ('courses', 'courses', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "courses_storage_admin"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'courses' AND public.is_admin()
)
WITH CHECK (
  bucket_id = 'courses' AND public.is_admin()
);

CREATE POLICY "courses_storage_student_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'courses'
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.course_enrollments e
      JOIN public.courses c ON c.id = e.course_id
      WHERE e.student_id = auth.uid()
        AND (storage.foldername(name))[1] = c.id::text
    )
  )
);
