-- Remove jobs / employment / careers feature.

DROP POLICY IF EXISTS "job_applications_storage_admin" ON storage.objects;

-- Hosted Supabase blocks raw DELETE on storage tables; use the same flag as the Storage API.
SELECT set_config('storage.allow_delete_query', 'true', true);
DELETE FROM storage.objects WHERE bucket_id = 'job-applications';
DELETE FROM storage.buckets WHERE id = 'job-applications';

DROP POLICY IF EXISTS "job_applications_admin" ON public.job_applications;
DROP POLICY IF EXISTS "job_postings_admin" ON public.job_postings;
DROP POLICY IF EXISTS "job_postings_public_read" ON public.job_postings;

REVOKE SELECT ON public.job_postings FROM anon, authenticated;

DROP TABLE IF EXISTS public.job_applications;
DROP TABLE IF EXISTS public.job_postings;

DROP TYPE IF EXISTS public.application_status;
DROP TYPE IF EXISTS public.job_status;
DROP TYPE IF EXISTS public.work_mode;
DROP TYPE IF EXISTS public.employment_type;

NOTIFY pgrst, 'reload schema';
