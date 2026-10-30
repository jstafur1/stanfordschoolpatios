-- Pending enrollments + per-student approval flag (part 1: schema only).

ALTER TYPE public.enrollment_status ADD VALUE IF NOT EXISTS 'pending';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS requires_enrollment_approval boolean NOT NULL DEFAULT true;

-- Existing students can join courses immediately.
UPDATE public.profiles
SET requires_enrollment_approval = false
WHERE role = 'student';
