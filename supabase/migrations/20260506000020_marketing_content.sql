create table if not exists public.marketing_content (
  key text primary key,
  label text not null,
  content text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.marketing_content enable row level security;

drop policy if exists marketing_content_public_read on public.marketing_content;
create policy marketing_content_public_read
  on public.marketing_content
  for select
  using (true);

drop policy if exists marketing_content_admin_all on public.marketing_content;
create policy marketing_content_admin_all
  on public.marketing_content
  for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.marketing_content (key, label, content)
values
  ('home.hero.brand', 'Landingpage: Hero Brand', 'elbe-trailer'),
  ('home.hero.title', 'Landingpage: Hero Titel', 'Was auch immer Sie transportieren — hier finden Sie die passende Lösung.'),
  ('home.hero.subtitle', 'Landingpage: Hero Untertitel', 'Kaufen oder mieten, Kategorien und Zubehör in der Übersicht, unverbindliche Anfrage in wenigen Schritten.'),
  ('home.categories.intro.title', 'Landingpage: Kategorien Intro Titel', 'Alles im Blick — strukturiert wie auf Herstellerseiten'),
  ('home.categories.intro.body', 'Landingpage: Kategorien Intro Text', 'Stöbern Sie in Kategorien, vergleichen Sie Inserate und stellen Sie auf der Detailseite Ihr Zubehör zusammen. So bleibt der Weg von der Idee bis zur Anfrage klar und übersichtlich.'),
  ('home.categories.heading', 'Landingpage: Kategorien Überschrift', 'Kategorien'),
  ('home.categories.rental_link', 'Landingpage: Kategorien Miet-Link', 'Oder direkt zu Miet-Angeboten →'),
  ('home.categories.card_cta', 'Landingpage: Kategorien Karten-CTA', 'Kauf-Inserate ansehen'),
  ('home.highlights.heading', 'Landingpage: Highlights Überschrift', 'Ausgewählte Angebote'),
  ('home.highlights.empty_state', 'Landingpage: Highlights Leerstand', 'Noch keine Highlights gesetzt. Im Admin-Bereich können Sie Inserate für die Startseite auswählen.'),
  ('home.cta.discover.title', 'Landingpage: CTA Entdecken Titel', 'Anhänger entdecken'),
  ('home.cta.discover.body', 'Landingpage: CTA Entdecken Text', 'Wählen Sie eine Kategorie und filtern Sie auf der Übersicht. Technische Daten und Bilder sehen Sie auf jeder Inserat-Detailseite.'),
  ('home.cta.discover.button', 'Landingpage: CTA Entdecken Button', 'Zu den Inseraten'),
  ('home.cta.rent.title', 'Landingpage: CTA Mieten Titel', 'Mieten'),
  ('home.cta.rent.body', 'Landingpage: CTA Mieten Text', 'Tages- und Wochenpreise, Verfügbarkeit und Anfrage — gebündelt auf der Miet-Übersicht.'),
  ('home.cta.rent.button', 'Landingpage: CTA Mieten Button', 'Miet-Angebote anzeigen'),
  ('header.brand', 'Header: Markenname', 'elbe-trailer'),
  ('header.menu.trailers', 'Header: Menü Anhänger', 'Anhänger'),
  ('header.menu.all_trailers', 'Header: Menü Alle Anhänger', 'Alle Anhänger'),
  ('header.menu.no_categories', 'Header: Menü Keine Kategorien', 'Keine Kategorien — bitte im Admin anlegen.'),
  ('header.menu.rent', 'Header: Menü Mieten', 'Mieten'),
  ('header.nav.about', 'Header: Navigation Über uns', 'Über uns'),
  ('header.nav.service', 'Header: Navigation Service', 'Service'),
  ('header.nav.rent_trailers', 'Header: Navigation Anhänger mieten', 'Anhänger mieten'),
  ('header.nav.blog', 'Header: Navigation Blog', 'Blog'),
  ('header.nav.contact', 'Header: Navigation Kontakt', 'Kontakt'),
  ('header.mobile.categories_title', 'Header Mobile: Kategorien Titel', 'Anhänger — Kategorien'),
  ('header.mobile.no_categories', 'Header Mobile: Keine Kategorien', 'Noch keine Kategorien in der Datenbank.'),
  ('header.mobile.menu_open', 'Header Mobile: Menü öffnen', 'Menü öffnen'),
  ('header.mobile.menu_close', 'Header Mobile: Menü schließen', 'Menü schließen'),
  ('footer.brand', 'Footer: Markenname', 'elbe-trailer'),
  ('footer.description', 'Footer: Beschreibung', 'Inserate mit technischen Angaben, Zubehör-Auswahl und unverbindlicher Anfrage — orientiert an bewährter Branchen-Information, übersichtlich aufgebaut.'),
  ('footer.section.categories', 'Footer: Abschnitt Kategorien', 'Kategorien'),
  ('footer.section.offer', 'Footer: Abschnitt Angebot', 'Angebot'),
  ('footer.section.legal', 'Footer: Abschnitt Rechtliches', 'Rechtliches & Kontakt'),
  ('footer.categories.empty', 'Footer: Keine Kategorien', 'Keine Kategorien'),
  ('footer.link.rent', 'Footer: Link Mieten', 'Mieten'),
  ('footer.link.highlights', 'Footer: Link Ausgewählte Angebote', 'Ausgewählte Angebote'),
  ('footer.link.category_overview', 'Footer: Link Kategorieüberblick', 'Kategorieüberblick'),
  ('footer.link.blog', 'Footer: Link Blog', 'Blog'),
  ('footer.link.about', 'Footer: Link Über uns', 'Über uns'),
  ('footer.link.contact', 'Footer: Link Kontakt', 'Kontakt'),
  ('footer.link.imprint', 'Footer: Link Impressum', 'Impressum'),
  ('footer.note.inquiries', 'Footer: Hinweis Anfragen', 'Hinweis: Unverbindliche Anfragen über die Inserate.')
on conflict (key) do nothing;
