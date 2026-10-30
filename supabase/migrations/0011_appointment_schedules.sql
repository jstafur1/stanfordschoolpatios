-- Asesorías: recurring schedules + appointment bookings

CREATE TYPE public.appointment_modality AS ENUM ('in_person', 'virtual');
CREATE TYPE public.schedule_modality_default AS ENUM (
  'in_person',
  'virtual',
  'student_choice'
);
CREATE TYPE public.appointment_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'cancelled'
);

CREATE TABLE public.course_appointment_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_duration_minutes integer NOT NULL DEFAULT 30 CHECK (slot_duration_minutes > 0),
  default_modality public.schedule_modality_default NOT NULL DEFAULT 'student_choice',
  default_room text,
  default_meeting_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE INDEX course_appointment_schedules_course_id_idx
  ON public.course_appointment_schedules(course_id);
CREATE INDEX course_appointment_schedules_teacher_id_idx
  ON public.course_appointment_schedules(teacher_id);
CREATE INDEX course_appointment_schedules_course_teacher_day_idx
  ON public.course_appointment_schedules(course_id, teacher_id, day_of_week);

CREATE TABLE public.course_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  schedule_id uuid REFERENCES public.course_appointment_schedules(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  modality public.appointment_modality NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'pending',
  room text,
  meeting_url text,
  student_note text,
  teacher_note text,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  cancel_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX course_appointments_course_id_idx ON public.course_appointments(course_id);
CREATE INDEX course_appointments_teacher_id_idx ON public.course_appointments(teacher_id);
CREATE INDEX course_appointments_student_id_idx ON public.course_appointments(student_id);
CREATE INDEX course_appointments_starts_at_idx ON public.course_appointments(starts_at);
CREATE INDEX course_appointments_status_idx ON public.course_appointments(status);

CREATE UNIQUE INDEX course_appointments_teacher_starts_active_uidx
  ON public.course_appointments(teacher_id, starts_at)
  WHERE status IN ('pending', 'approved');

CREATE OR REPLACE FUNCTION public.is_student_enrolled_in_course(p_course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.course_enrollments e
    WHERE e.course_id = p_course_id
      AND e.student_id = auth.uid()
      AND e.status = 'active'
  );
$$;

ALTER TABLE public.course_appointment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointment_schedules_admin" ON public.course_appointment_schedules
  FOR ALL USING (public.is_admin());

CREATE POLICY "appointment_schedules_teacher_read" ON public.course_appointment_schedules
  FOR SELECT USING (public.is_teacher_of_course(course_id));

CREATE POLICY "appointment_schedules_student_read" ON public.course_appointment_schedules
  FOR SELECT USING (
    is_active = true
    AND public.is_student_enrolled_in_course(course_id)
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.published = true
    )
  );

CREATE POLICY "appointments_admin" ON public.course_appointments
  FOR ALL USING (public.is_admin());

CREATE POLICY "appointments_teacher_read" ON public.course_appointments
  FOR SELECT USING (
    teacher_id = auth.uid()
    OR public.is_teacher_of_course(course_id)
  );

CREATE POLICY "appointments_teacher_update" ON public.course_appointments
  FOR UPDATE USING (teacher_id = auth.uid());

CREATE POLICY "appointments_student_select" ON public.course_appointments
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "appointments_student_insert" ON public.course_appointments
  FOR INSERT WITH CHECK (
    student_id = auth.uid()
    AND public.is_student_enrolled_in_course(course_id)
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.published = true
    )
  );

NOTIFY pgrst, 'reload schema';
