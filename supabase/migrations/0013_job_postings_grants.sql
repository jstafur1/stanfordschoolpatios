-- Allow anon/authenticated API access to published job listings

GRANT SELECT ON public.job_postings TO anon, authenticated;

DROP POLICY IF EXISTS "job_postings_public_read" ON public.job_postings;

CREATE POLICY "job_postings_public_read" ON public.job_postings
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND (
      application_deadline IS NULL
      OR application_deadline > now()
    )
  );

NOTIFY pgrst, 'reload schema';
