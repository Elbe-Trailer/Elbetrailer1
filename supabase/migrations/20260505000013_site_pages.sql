-- CMS-like static pages (about, contact, legal)

create table if not exists public.site_pages (
  slug text primary key,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_pages enable row level security;

create policy "site_pages_public_read"
  on public.site_pages for select
  to anon, authenticated
  using (true);

create policy "site_pages_admin_all"
  on public.site_pages for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.site_pages (slug, title, content)
values
  (
    'ueber-uns',
    'Über uns',
    '<p>Wir sind Ihr Ansprechpartner rund um Anhänger — vom kompakten PKW-Anhänger bis zu Speziallösungen für Boot, Pferd oder Maschinen.</p>
<h2>Häufig gestellte Fragen</h2>
<p>Inserate enthalten technische Angaben; auf der Detailseite können Sie Zubehör wählen und eine unverbindliche Anfrage senden. Wir melden uns bei Ihnen zu Verfügbarkeit und nächsten Schritten.</p>
<h2>Anhänger registrieren</h2>
<p>Haben Sie ein Fahrzeug erworben und möchten es dokumentieren oder verkaufen? Kontaktieren Sie uns — wir helfen bei der Darstellung im Marktplatz.</p>
<h2>Händler werden</h2>
<p>Gewerbliche Anbieter können Inserate pflegen und Anfragen über das System entgegennehmen. Schreiben Sie uns für Zugang und Ablauf.</p>'
  ),
  (
    'kontakt',
    'Kontakt',
    '<p>Nutzen Sie die Anfragefunktion auf den Inseraten oder schreiben Sie uns mit Ihrem Anliegen — z. B. zu Verfügbarkeit, Ausstattung oder Händlerkooperation.</p>'
  ),
  (
    'impressum',
    'Impressum',
    '<p>Bitte hinterlegen Sie hier Ihre vollständigen Impressumsangaben gemäß § 5 TMG.</p>'
  )
on conflict (slug) do nothing;
