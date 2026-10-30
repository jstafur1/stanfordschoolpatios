-- In-flight chat locks + idempotent user message inserts for practice chat

CREATE TABLE IF NOT EXISTS public.course_chat_inflight_locks (
  id uuid PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS course_chat_inflight_locks_course_user_uidx
  ON public.course_chat_inflight_locks(course_id, user_id);

CREATE INDEX IF NOT EXISTS course_chat_inflight_locks_expires_idx
  ON public.course_chat_inflight_locks(expires_at);

ALTER TABLE public.course_chat_messages
  ADD COLUMN IF NOT EXISTS client_request_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS course_chat_messages_client_request_uidx
  ON public.course_chat_messages(course_id, user_id, client_request_id)
  WHERE client_request_id IS NOT NULL;

ALTER TABLE public.course_chat_inflight_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_inflight_admin" ON public.course_chat_inflight_locks;
DROP POLICY IF EXISTS "chat_inflight_student_select" ON public.course_chat_inflight_locks;

CREATE POLICY "chat_inflight_admin" ON public.course_chat_inflight_locks
  FOR ALL USING (public.is_admin());

CREATE POLICY "chat_inflight_student_select" ON public.course_chat_inflight_locks
  FOR SELECT USING (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
