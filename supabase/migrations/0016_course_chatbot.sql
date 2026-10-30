-- Per-course practice chatbot: config + persisted student messages
-- Idempotent: Drizzle may have already created schema objects.

DO $$ BEGIN
  CREATE TYPE public.chat_message_role AS ENUM ('user', 'assistant');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.course_chatbot_configs (
  course_id uuid PRIMARY KEY REFERENCES public.courses(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  system_instructions text NOT NULL DEFAULT '',
  welcome_message text,
  model text NOT NULL DEFAULT 'microsoft/phi-4-mini-instruct',
  temperature real NOT NULL DEFAULT 0.1,
  top_p real NOT NULL DEFAULT 0.7,
  max_tokens integer NOT NULL DEFAULT 1024,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.chat_message_role NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS course_chat_messages_course_user_created_idx
  ON public.course_chat_messages(course_id, user_id, created_at);

ALTER TABLE public.course_chatbot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chatbot_configs_admin" ON public.course_chatbot_configs;
DROP POLICY IF EXISTS "chatbot_configs_teacher_read" ON public.course_chatbot_configs;
DROP POLICY IF EXISTS "chatbot_configs_teacher_write" ON public.course_chatbot_configs;
DROP POLICY IF EXISTS "chatbot_configs_teacher_update" ON public.course_chatbot_configs;
DROP POLICY IF EXISTS "chat_messages_admin" ON public.course_chat_messages;
DROP POLICY IF EXISTS "chat_messages_teacher_read" ON public.course_chat_messages;
DROP POLICY IF EXISTS "chat_messages_student_select" ON public.course_chat_messages;
DROP POLICY IF EXISTS "chat_messages_student_insert" ON public.course_chat_messages;
DROP POLICY IF EXISTS "chat_messages_student_delete" ON public.course_chat_messages;

CREATE POLICY "chatbot_configs_admin" ON public.course_chatbot_configs
  FOR ALL USING (public.is_admin());

CREATE POLICY "chatbot_configs_teacher_read" ON public.course_chatbot_configs
  FOR SELECT USING (public.is_teacher_of_course(course_id));

CREATE POLICY "chatbot_configs_teacher_write" ON public.course_chatbot_configs
  FOR INSERT WITH CHECK (public.is_teacher_of_course(course_id));

CREATE POLICY "chatbot_configs_teacher_update" ON public.course_chatbot_configs
  FOR UPDATE USING (public.is_teacher_of_course(course_id));

CREATE POLICY "chat_messages_admin" ON public.course_chat_messages
  FOR ALL USING (public.is_admin());

CREATE POLICY "chat_messages_teacher_read" ON public.course_chat_messages
  FOR SELECT USING (public.is_teacher_of_course(course_id));

CREATE POLICY "chat_messages_student_select" ON public.course_chat_messages
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "chat_messages_student_insert" ON public.course_chat_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND public.is_student_enrolled_in_course(course_id)
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.published = true
    )
  );

CREATE POLICY "chat_messages_student_delete" ON public.course_chat_messages
  FOR DELETE USING (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
