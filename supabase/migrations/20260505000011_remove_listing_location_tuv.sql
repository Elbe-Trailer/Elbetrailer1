alter table public.listings
  drop column if exists location,
  drop column if exists tuv_until;
