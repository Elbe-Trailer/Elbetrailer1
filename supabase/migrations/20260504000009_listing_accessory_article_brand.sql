-- Artikelnummer und Marke für Inserate und Zubehör
alter table public.listings add column if not exists article_number text;
alter table public.listings add column if not exists brand text;

alter table public.accessories add column if not exists article_number text;
alter table public.accessories add column if not exists brand text;
