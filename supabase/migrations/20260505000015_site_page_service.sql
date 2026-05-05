insert into public.site_pages (slug, title, content)
values
  (
    'service',
    'Service',
    '<p>Hier können Sie Ihre Serviceleistungen beschreiben, z. B. Wartung, Ersatzteile, Zulassung oder Beratung.</p>'
  )
on conflict (slug) do nothing;
