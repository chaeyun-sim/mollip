-- Korean source columns remain canonical. Missing translations stay NULL.
ALTER TABLE public.museums
  ADD COLUMN IF NOT EXISTS address_en text,
  ADD COLUMN IF NOT EXISTS "rstdeInfo_en" text,
  ADD COLUMN IF NOT EXISTS open_hours_en text;
