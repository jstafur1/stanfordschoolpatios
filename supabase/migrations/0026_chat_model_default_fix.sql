-- Switch chatbot configs away from phi-4, which hangs on NVIDIA NIM.

UPDATE public.course_chatbot_configs
SET model = 'meta/llama-3.1-8b-instruct'
WHERE model = 'microsoft/phi-4-mini-instruct';

ALTER TABLE public.course_chatbot_configs
  ALTER COLUMN model SET DEFAULT 'meta/llama-3.1-8b-instruct';

NOTIFY pgrst, 'reload schema';
