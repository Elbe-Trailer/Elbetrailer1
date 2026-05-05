-- Optional demo listing (only if no listing with this title exists)

insert into public.listings (
  title,
  description,
  category_id,
  listing_type,
  published,
  price_cents,
  payload_kg,
  length_mm,
  width_mm,
  height_mm,
  axle_count,
  condition,
  location,
  gallery_paths
)
select
  'Demo PKW-Anhänger (Beispiel)',
  'Dieses Inserat kann im Admin bearbeitet oder gelöscht werden.',
  c.id,
  'kauf',
  true,
  189900,
  750,
  3010,
  1500,
  350,
  2,
  'gebraucht, gepflegt',
  'Beispielstadt',
  '{}'
from public.categories c
where c.slug = 'pkw-koffer'
  and not exists (
    select 1 from public.listings l where l.title = 'Demo PKW-Anhänger (Beispiel)'
  )
limit 1;
