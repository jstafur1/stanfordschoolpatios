-- Audit trail for course-critical events

CREATE TABLE public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  event_type text NOT NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_type text NOT NULL,
  target_id uuid,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX audit_events_course_id_idx ON public.audit_events (course_id);
CREATE INDEX audit_events_actor_id_idx ON public.audit_events (actor_id);
CREATE INDEX audit_events_created_at_idx ON public.audit_events (created_at DESC);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_events_admin" ON public.audit_events
  FOR ALL USING (public.is_admin());

CREATE POLICY "audit_events_teacher_read" ON public.audit_events
  FOR SELECT USING (
    public.is_teacher()
    AND course_id IS NOT NULL
    AND public.is_teacher_of_course(course_id)
  );

CREATE POLICY "audit_events_insert_authenticated" ON public.audit_events
  FOR INSERT WITH CHECK (actor_id = auth.uid() OR public.is_admin());
