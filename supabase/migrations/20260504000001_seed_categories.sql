-- Seed default categories (idempotent)

insert into public.categories (slug, name, sort_order, is_active)
values
  ('pkw-koffer', 'PKW- / Kofferanhänger', 10, true),
  ('pferde', 'Pferdeanhänger', 20, true),
  ('boot', 'Bootstrailer', 30, true),
  ('maschinen', 'Maschinentransporter', 40, true),
  ('kipper', 'Kipper / Dreiseitenkipper', 50, true),
  ('planen', 'Planenanhänger', 60, true),
  ('tieflader', 'Tieflader', 70, true),
  ('sonstiges', 'Sonstiges', 90, true)
on conflict (slug) do nothing;
