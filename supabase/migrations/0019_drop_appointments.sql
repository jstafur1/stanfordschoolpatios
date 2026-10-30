-- Remove appointments / asesorías scheduling feature.
-- Keep is_student_enrolled_in_course() — used by course chatbot RLS (0016).

DROP POLICY IF EXISTS "appointments_student_insert" ON public.course_appointments;
DROP POLICY IF EXISTS "appointments_student_select" ON public.course_appointments;
DROP POLICY IF EXISTS "appointments_teacher_update" ON public.course_appointments;
DROP POLICY IF EXISTS "appointments_teacher_read" ON public.course_appointments;
DROP POLICY IF EXISTS "appointments_admin" ON public.course_appointments;

DROP POLICY IF EXISTS "appointment_schedules_student_read" ON public.course_appointment_schedules;
DROP POLICY IF EXISTS "appointment_schedules_teacher_read" ON public.course_appointment_schedules;
DROP POLICY IF EXISTS "appointment_schedules_admin" ON public.course_appointment_schedules;

DROP TABLE IF EXISTS public.course_appointments;
DROP TABLE IF EXISTS public.course_appointment_schedules;

DROP TYPE IF EXISTS public.appointment_status;
DROP TYPE IF EXISTS public.schedule_modality_default;
DROP TYPE IF EXISTS public.appointment_modality;

NOTIFY pgrst, 'reload schema';
