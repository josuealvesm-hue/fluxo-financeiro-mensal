
ALTER TABLE public.budget_templates
  ADD COLUMN IF NOT EXISTS active_from_month integer,
  ADD COLUMN IF NOT EXISTS active_from_year integer,
  ADD COLUMN IF NOT EXISTS active_to_month integer,
  ADD COLUMN IF NOT EXISTS active_to_year integer;
