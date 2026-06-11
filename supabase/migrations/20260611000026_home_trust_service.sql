insert into public.marketing_content (key, label, content)
values
  ('home.trust.item4', 'Landingpage: Trust USP 4', 'Anhänger Service und Reparatur')
on conflict (key) do nothing;
