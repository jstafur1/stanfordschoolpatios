-- Ensure i18n columns exist (idempotent) and refresh PostgREST schema cache.

ALTER TABLE public.languages
  ADD COLUMN IF NOT EXISTS name_es text,
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS name_fr text;

UPDATE public.languages
SET
  name_es = COALESCE(name_es, name),
  name_en = COALESCE(name_en, name),
  name_fr = COALESCE(name_fr, name)
WHERE name_es IS NULL OR name_en IS NULL OR name_fr IS NULL;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS title_es text,
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS title_fr text,
  ADD COLUMN IF NOT EXISTS description_es text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS description_fr text;

UPDATE public.courses
SET
  title_es = COALESCE(title_es, title),
  title_en = COALESCE(title_en, title),
  title_fr = COALESCE(title_fr, title),
  description_es = COALESCE(description_es, description),
  description_en = COALESCE(description_en, description),
  description_fr = COALESCE(description_fr, description)
WHERE title_es IS NULL OR title_en IS NULL OR title_fr IS NULL;

NOTIFY pgrst, 'reload schema';
