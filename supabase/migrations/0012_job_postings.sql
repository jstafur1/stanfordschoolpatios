-- Job postings and public applications

CREATE TYPE public.employment_type AS ENUM (
  'full_time',
  'part_time',
  'contract',
  'internship',
  'temporary'
);

CREATE TYPE public.work_mode AS ENUM ('on_site', 'remote', 'hybrid');

CREATE TYPE public.job_status AS ENUM ('draft', 'published', 'closed');

CREATE TYPE public.application_status AS ENUM (
  'new',
  'reviewed',
  'rejected',
  'hired'
);

CREATE TABLE public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  requirements text,
  benefits text,
  employment_type public.employment_type NOT NULL,
  work_mode public.work_mode NOT NULL,
  location text,
  salary_min numeric(12, 2),
  salary_max numeric(12, 2),
  salary_currency text DEFAULT 'EUR',
  show_salary boolean NOT NULL DEFAULT false,
  contact_email text,
  contact_phone text,
  application_deadline timestamptz,
  status public.job_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX job_postings_status_idx ON public.job_postings(status);
CREATE INDEX job_postings_application_deadline_idx
  ON public.job_postings(application_deadline)
  WHERE status = 'published';

CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  years_of_experience integer,
  linkedin_url text,
  portfolio_url text,
  availability_start_date date,
  cover_letter text,
  cv_storage_path text,
  cv_original_filename text,
  status public.application_status NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX job_applications_job_posting_id_idx
  ON public.job_applications(job_posting_id);
CREATE INDEX job_applications_status_idx ON public.job_applications(status);
CREATE INDEX job_applications_created_at_idx ON public.job_applications(created_at);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_postings_public_read" ON public.job_postings
  FOR SELECT
  USING (
    status = 'published'
    AND (
      application_deadline IS NULL
      OR application_deadline > now()
    )
  );

CREATE POLICY "job_postings_admin" ON public.job_postings
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "job_applications_admin" ON public.job_applications
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO storage.buckets (id, name, public)
VALUES ('job-applications', 'job-applications', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "job_applications_storage_admin"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'job-applications' AND public.is_admin()
)
WITH CHECK (
  bucket_id = 'job-applications' AND public.is_admin()
);
