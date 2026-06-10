-- Admin-Hilfsfunktion (falls noch nicht angelegt)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- Statische Seiten (falls noch nicht angelegt)
create table if not exists public.site_pages (
  slug text primary key,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_pages enable row level security;

drop policy if exists "site_pages_public_read" on public.site_pages;
create policy "site_pages_public_read"
  on public.site_pages for select
  to anon, authenticated
  using (true);

drop policy if exists "site_pages_admin_all" on public.site_pages;
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
  ),
  (
    'service',
    'Service',
    '<p>Hier können Sie Ihre Serviceleistungen beschreiben, z. B. Wartung, Ersatzteile, Zulassung oder Beratung.</p>'
  ),
  (
    'datenschutz',
    'Datenschutz',
    '<p>Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Nachfolgend informieren wir Sie über die Verarbeitung personenbezogener Daten auf dieser Website. Bitte passen Sie diesen Beispieltext an Ihre tatsächlichen Gegebenheiten an und ergänzen Sie fehlende Angaben (z. B. Verantwortlicher, Kontaktdaten des Datenschutzbeauftragten).</p>
<h2>1. Verantwortlicher</h2>
<p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br>[Firmenname]<br>[Straße und Hausnummer]<br>[PLZ Ort]<br>E-Mail: [kontakt@beispiel.de]</p>
<h2>2. Erhebung und Speicherung personenbezogener Daten</h2>
<p>Beim Besuch unserer Website werden durch den auf Ihrem Endgerät zum Einsatz kommenden Browser automatisch Informationen an den Server unserer Website gesendet. Diese Informationen werden temporär in einem sogenannten Logfile gespeichert. Erfasst werden u. a. IP-Adresse, Datum und Uhrzeit des Zugriffs, Name und URL der abgerufenen Datei, Website, von der aus der Zugriff erfolgt, verwendeter Browser und ggf. das Betriebssystem Ihres Rechners.</p>
<h2>3. Anfragen über Inserate und Kontaktformular</h2>
<p>Wenn Sie über ein Inserat oder unser Kontaktformular eine Anfrage stellen, verarbeiten wir die von Ihnen angegebenen Daten (z. B. Name, E-Mail-Adresse, Telefonnummer, Nachricht) zur Bearbeitung Ihres Anliegens. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung) bzw. Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von Anfragen).</p>
<h2>4. Cookies und technisch notwendige Funktionen</h2>
<p>Wir setzen Cookies ein, soweit dies für den Betrieb der Website erforderlich ist (z. B. Anmeldesitzung für Administratoren, Darstellungseinstellungen). Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert werden und Cookies nur im Einzelfall erlauben.</p>
<h2>5. Hosting und Auftragsverarbeitung</h2>
<p>Diese Website wird bei einem externen Dienstleister gehostet. Personenbezogene Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert. Mit dem Hoster wurde ein Vertrag zur Auftragsverarbeitung gemäß Art. 28 DSGVO geschlossen, soweit erforderlich.</p>
<h2>6. Ihre Rechte</h2>
<p>Sie haben gegenüber uns folgende Rechte hinsichtlich der Sie betreffenden personenbezogenen Daten:</p>
<ul>
<li>Recht auf Auskunft (Art. 15 DSGVO)</li>
<li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
<li>Recht auf Löschung (Art. 17 DSGVO)</li>
<li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
<li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
<li>Recht auf Widerspruch (Art. 21 DSGVO)</li>
</ul>
<p>Sie haben zudem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.</p>
<h2>7. Aktualität und Änderung dieser Datenschutzerklärung</h2>
<p>Diese Datenschutzerklärung ist aktuell gültig. Durch die Weiterentwicklung unserer Website oder aufgrund geänderter gesetzlicher bzw. behördlicher Vorgaben kann es notwendig werden, diese Datenschutzerklärung anzupassen.</p>'
  )
on conflict (slug) do nothing;

-- Footer-Link (falls marketing_content noch nicht existiert)
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
  ('footer.link.privacy', 'Footer: Link Datenschutz', 'Datenschutz')
on conflict (key) do nothing;
