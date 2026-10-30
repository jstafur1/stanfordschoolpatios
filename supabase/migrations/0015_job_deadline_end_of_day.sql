-- Treat application_deadline as inclusive through the deadline calendar day (UTC)

DROP POLICY IF EXISTS "job_postings_public_read" ON public.job_postings;

CREATE POLICY "job_postings_public_read" ON public.job_postings
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND (
      application_deadline IS NULL
      OR application_deadline::date >= (timezone('utc', now()))::date
    )
  );

NOTIFY pgrst, 'reload schema';
