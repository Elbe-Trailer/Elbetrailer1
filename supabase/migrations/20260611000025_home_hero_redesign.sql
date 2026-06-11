-- Landing page hero redesign: new marketing keys + updated defaults

insert into public.marketing_content (key, label, content)
values
  ('home.hero.cta_buy', 'Landingpage: Hero CTA Kaufen', 'Anhänger kaufen'),
  ('home.hero.cta_rent', 'Landingpage: Hero CTA Mieten', 'Anhänger mieten'),
  ('home.trust.item1', 'Landingpage: Trust USP 1', 'Kaufen & mieten'),
  ('home.trust.item2', 'Landingpage: Trust USP 2', 'Zubehör passend'),
  ('home.trust.item3', 'Landingpage: Trust USP 3', 'Anfrage in Minuten'),
  ('home.trust.item4', 'Landingpage: Trust USP 4', 'Anhänger Service und Reparatur'),
  ('home.categories.overline', 'Landingpage: Kategorien Overline', 'ANHÄNGER KAUFEN')
on conflict (key) do nothing;

update public.marketing_content
set
  content = 'STARKE ANHÄNGER.',
  updated_at = timezone('utc', now())
where key = 'home.hero.brand';

update public.marketing_content
set
  content = 'DIE PASSENDE TRANSPORTLÖSUNG FÜR JEDE ANFORDERUNG.',
  updated_at = timezone('utc', now())
where key = 'home.hero.title';

update public.marketing_content
set
  content = 'Kaufen oder mieten – hochwertige Anhänger für Privat und Gewerbe.',
  updated_at = timezone('utc', now())
where key = 'home.hero.subtitle';

update public.marketing_content
set
  content = 'Für jeden Einsatz der richtige Anhänger.',
  updated_at = timezone('utc', now())
where key = 'home.categories.heading';
