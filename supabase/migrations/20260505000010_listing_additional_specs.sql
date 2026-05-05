alter table public.listings
  add column if not exists exterior_length_mm int,
  add column if not exists exterior_width_mm int,
  add column if not exists loading_length_mm int,
  add column if not exists loading_width_mm int,
  add column if not exists gross_weight_kg int,
  add column if not exists empty_weight_kg int,
  add column if not exists tire_size_inch numeric(4,1),
  add column if not exists braked boolean,
  add column if not exists tip_function text,
  add column if not exists lighting text,
  add column if not exists loading_ramps text,
  add column if not exists loading_area text;
