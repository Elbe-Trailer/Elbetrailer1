-- =============================================================================
-- Anhänger Marktplatz: ALLES IN EINEM (Schema + Seeds)
-- Supabase → SQL Editor → New query → Einfügen → Run
-- NUR auf leerem Projekt / Erst-Setup. Sonst ggf. nur fehlende Teile.
-- =============================================================================

-- Anhänger Marktplatz — initial schema, RLS, storage

create extension if not exists "pgcrypto";

-- ---- Types ----
do $$ begin
  create type public.listing_type as enum ('kauf', 'miete', 'kauf_und_miete');
exception
  when duplicate_object then null;
end $$;

-- ---- Profiles (linked to auth.users) ----
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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

-- ---- Categories ----
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---- Accessory categories ----
create table public.accessory_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---- Accessories ----
create table public.accessories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  article_number text,
  brand text,
  description text,
  category_id uuid references public.accessory_categories (id) on delete set null,
  price_adjustment_cents int not null default 0,
  image_path text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accessories_category_idx on public.accessories (category_id);

-- ---- Listings ----
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  article_number text,
  brand text,
  description text,
  price_cents int,
  daily_rate_cents int,
  condition text,
  payload_kg int,
  length_mm int,
  width_mm int,
  height_mm int,
  axle_count int,
  category_id uuid not null references public.categories (id) on delete restrict,
  listing_type public.listing_type not null,
  published boolean not null default false,
  gallery_paths text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_category_idx on public.listings (category_id);
create index listings_type_published_idx on public.listings (listing_type, published);

-- ---- Listing ↔ Accessories ----
create table public.listing_accessories (
  listing_id uuid not null references public.listings (id) on delete cascade,
  accessory_id uuid not null references public.accessories (id) on delete cascade,
  max_quantity int not null default 1 check (max_quantity >= 1),
  primary key (listing_id, accessory_id)
);

-- ---- Banner slides ----
create table public.banner_slides (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  sort_order int not null default 0,
  link_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---- Homepage highlights ----
create table public.listing_highlights (
  listing_id uuid primary key references public.listings (id) on delete cascade,
  position int not null unique check (position >= 0)
);

-- ---- Inquiries ----
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  message text,
  accessory_selections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index inquiries_listing_idx on public.inquiries (listing_id);
create index inquiries_created_idx on public.inquiries (created_at desc);

-- ---- RLS ----
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.accessory_categories enable row level security;
alter table public.accessories enable row level security;
alter table public.listings enable row level security;
alter table public.listing_accessories enable row level security;
alter table public.banner_slides enable row level security;
alter table public.listing_highlights enable row level security;
alter table public.inquiries enable row level security;

-- profiles: own row read
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- categories: public read active; admin all
create policy "categories_public_read"
  on public.categories for select
  to anon, authenticated
  using (is_active = true);

create policy "categories_admin_all"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- accessory_categories: public read active; admin all
create policy "accessory_categories_public_read"
  on public.accessory_categories for select
  to anon, authenticated
  using (is_active = true);

create policy "accessory_categories_admin_all"
  on public.accessory_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- accessories: public read active; admin all
create policy "accessories_public_read"
  on public.accessories for select
  to anon, authenticated
  using (active = true);

create policy "accessories_admin_all"
  on public.accessories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- listings: public read published; admin all
create policy "listings_public_read"
  on public.listings for select
  to anon, authenticated
  using (published = true);

create policy "listings_admin_all"
  on public.listings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- listing_accessories: inherit via listings — public can read links for published listings
create policy "listing_accessories_public_read"
  on public.listing_accessories for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_accessories.listing_id and l.published = true
    )
  );

create policy "listing_accessories_admin_all"
  on public.listing_accessories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- banner_slides: public read active; admin all
create policy "banner_slides_public_read"
  on public.banner_slides for select
  to anon, authenticated
  using (active = true);

create policy "banner_slides_admin_all"
  on public.banner_slides for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- listing_highlights: public read if listing published
create policy "listing_highlights_public_read"
  on public.listing_highlights for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_highlights.listing_id and l.published = true
    )
  );

create policy "listing_highlights_admin_all"
  on public.listing_highlights for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- inquiries: anyone can insert; admin can read
create policy "inquiries_insert_public"
  on public.inquiries for insert
  to anon, authenticated
  with check (true);

create policy "inquiries_select_admin"
  on public.inquiries for select
  to authenticated
  using (public.is_admin());

-- ---- Storage buckets ----
insert into storage.buckets (id, name, public)
values
  ('banners', 'banners', true),
  ('listings', 'listings', true),
  ('accessories', 'accessories', true)
on conflict (id) do nothing;

-- Public read objects in shop buckets
create policy "storage_public_read_banners"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'banners');

create policy "storage_public_read_listings"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'listings');

create policy "storage_public_read_accessories"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'accessories');

-- Upload / delete: admins only
create policy "storage_admin_insert_banners"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'banners' and public.is_admin());

create policy "storage_admin_update_banners"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'banners' and public.is_admin());

create policy "storage_admin_delete_banners"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'banners' and public.is_admin());

create policy "storage_admin_insert_listings"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'listings' and public.is_admin());

create policy "storage_admin_update_listings"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'listings' and public.is_admin());

create policy "storage_admin_delete_listings"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'listings' and public.is_admin());

create policy "storage_admin_insert_accessories"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'accessories' and public.is_admin());

create policy "storage_admin_update_accessories"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'accessories' and public.is_admin());

create policy "storage_admin_delete_accessories"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'accessories' and public.is_admin());

-- ----- Seed: Kategorien -----
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

-- ----- Seed: Demo-Inserat (optional) -----
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
  '{}'
from public.categories c
where c.slug = 'pkw-koffer'
  and not exists (
    select 1 from public.listings l where l.title = 'Demo PKW-Anhänger (Beispiel)'
  )
  limit 1;

-- ---- 20260504000008: Zubehör-Kategorie Mehrfach vs. Einzelauswahl ----
alter table public.accessory_categories
  add column if not exists allows_multiple boolean not null default true;

-- ---- 20260504000005: Anhänger-Miete ----
create table if not exists public.rental_units (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references public.listings (id) on delete cascade,
  active boolean not null default true,
  min_rental_days int not null default 1 check (min_rental_days >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rental_calendar_blocks (
  id uuid primary key default gen_random_uuid(),
  rental_unit_id uuid not null references public.rental_units (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint rental_calendar_blocks_valid_range check (end_date >= start_date)
);

create index if not exists rental_calendar_blocks_unit_range_idx
  on public.rental_calendar_blocks (rental_unit_id, start_date, end_date);

do $$ begin
  create type public.rental_booking_status as enum ('pending', 'confirmed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.rental_bookings (
  id uuid primary key default gen_random_uuid(),
  rental_unit_id uuid not null references public.rental_units (id) on delete cascade,
  inquiry_id uuid references public.inquiries (id) on delete set null,
  status public.rental_booking_status not null default 'pending',
  start_date date not null,
  end_date date not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  customer_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rental_bookings_valid_range check (end_date >= start_date)
);

create index if not exists rental_bookings_unit_status_range_idx
  on public.rental_bookings (rental_unit_id, status, start_date, end_date);

alter table public.inquiries
  add column if not exists rental_unit_id uuid references public.rental_units (id) on delete set null,
  add column if not exists start_date date,
  add column if not exists end_date date;

do $$ begin
  alter table public.inquiries
    add constraint inquiries_valid_date_range
    check (
      (start_date is null and end_date is null)
      or (start_date is not null and end_date is not null and end_date >= start_date)
    );
exception
  when duplicate_object then null;
end $$;

create index if not exists inquiries_rental_unit_idx on public.inquiries (rental_unit_id);
create index if not exists inquiries_start_end_idx on public.inquiries (start_date, end_date);

alter table public.rental_units enable row level security;
alter table public.rental_calendar_blocks enable row level security;
alter table public.rental_bookings enable row level security;

drop policy if exists "rental_units_public_read" on public.rental_units;
create policy "rental_units_public_read"
  on public.rental_units for select
  to anon, authenticated
  using (
    active = true
    and exists (
      select 1 from public.listings l
      where l.id = rental_units.listing_id
        and l.published = true
        and l.listing_type in ('miete', 'kauf_und_miete')
    )
  );

drop policy if exists "rental_units_admin_all" on public.rental_units;
create policy "rental_units_admin_all"
  on public.rental_units for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "rental_calendar_blocks_public_read" on public.rental_calendar_blocks;
create policy "rental_calendar_blocks_public_read"
  on public.rental_calendar_blocks for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.rental_units ru
      join public.listings l on l.id = ru.listing_id
      where ru.id = rental_calendar_blocks.rental_unit_id
        and ru.active = true
        and l.published = true
        and l.listing_type in ('miete', 'kauf_und_miete')
    )
  );

drop policy if exists "rental_calendar_blocks_admin_all" on public.rental_calendar_blocks;
create policy "rental_calendar_blocks_admin_all"
  on public.rental_calendar_blocks for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "rental_bookings_public_read" on public.rental_bookings;
create policy "rental_bookings_public_read"
  on public.rental_bookings for select
  to anon, authenticated
  using (
    status in ('pending', 'confirmed')
    and exists (
      select 1
      from public.rental_units ru
      join public.listings l on l.id = ru.listing_id
      where ru.id = rental_bookings.rental_unit_id
        and ru.active = true
        and l.published = true
        and l.listing_type in ('miete', 'kauf_und_miete')
    )
  );

drop policy if exists "rental_bookings_admin_all" on public.rental_bookings;
create policy "rental_bookings_admin_all"
  on public.rental_bookings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- 20260505000010: Weitere technische Anhänger-Daten ----
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

-- ---- 20260505000011: Standort und TÜV aus Listings entfernen ----
alter table public.listings
  drop column if exists location,
  drop column if exists tuv_until;

-- ---- 20260505000012: Blog (Kategorien, Beiträge, RLS, Storage) ----
create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text not null default '',
  author text,
  cover_image_path text,
  category_id uuid references public.blog_categories (id) on delete set null,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blog_posts_published_published_at_idx
  on public.blog_posts (published, published_at desc nulls last);

create index blog_posts_category_id_idx on public.blog_posts (category_id);

alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;

create policy "blog_categories_public_read"
  on public.blog_categories for select
  to anon, authenticated
  using (is_active = true);

create policy "blog_categories_admin_all"
  on public.blog_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "blog_posts_public_read"
  on public.blog_posts for select
  to anon, authenticated
  using (published = true);

create policy "blog_posts_admin_all"
  on public.blog_posts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('blog', 'blog', true)
on conflict (id) do nothing;

create policy "storage_public_read_blog"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'blog');

create policy "storage_admin_insert_blog"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'blog' and public.is_admin());

create policy "storage_admin_update_blog"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'blog' and public.is_admin());

create policy "storage_admin_delete_blog"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'blog' and public.is_admin());

-- ---- 20260505000013: Statische Seiten ----
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

-- ---- 20260505000014: Kontaktanfragen ----
create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists contact_inquiries_created_idx
  on public.contact_inquiries (created_at desc);

alter table public.contact_inquiries enable row level security;

drop policy if exists "contact_inquiries_insert_public" on public.contact_inquiries;
create policy "contact_inquiries_insert_public"
  on public.contact_inquiries for insert
  to anon, authenticated
  with check (true);

drop policy if exists "contact_inquiries_select_admin" on public.contact_inquiries;
create policy "contact_inquiries_select_admin"
  on public.contact_inquiries for select
  to authenticated
  using (public.is_admin());

-- ---- 20260505000015: Service-Seite ----
insert into public.site_pages (slug, title, content)
values
  (
    'service',
    'Service',
    '<p>Hier können Sie Ihre Serviceleistungen beschreiben, z. B. Wartung, Ersatzteile, Zulassung oder Beratung.</p>'
  )
on conflict (slug) do nothing;

-- ---- 20260505000015: inquiry status workflow ----
alter table public.inquiries
  add column if not exists status text not null default 'neu'
  check (status in ('neu', 'in_bearbeitung', 'abgeschlossen'));

alter table public.contact_inquiries
  add column if not exists status text not null default 'neu'
  check (status in ('neu', 'in_bearbeitung', 'abgeschlossen'));

create index if not exists inquiries_status_idx on public.inquiries (status);
create index if not exists contact_inquiries_status_idx on public.contact_inquiries (status);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'inquiries'
      and policyname = 'inquiries_update_admin'
  ) then
    create policy "inquiries_update_admin"
      on public.inquiries for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contact_inquiries'
      and policyname = 'contact_inquiries_update_admin'
  ) then
    create policy "contact_inquiries_update_admin"
      on public.contact_inquiries for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

-- ---- 20260505000018: Globale Miet-Rabatt-Einstellungen ----
create table if not exists public.rental_pricing_settings (
  id boolean primary key default true,
  discount_from_days int,
  discount_percent int not null default 0,
  updated_at timestamptz not null default now(),
  constraint rental_pricing_settings_singleton check (id = true),
  constraint rental_pricing_settings_discount_from_days_check
    check (discount_from_days is null or discount_from_days >= 2),
  constraint rental_pricing_settings_discount_percent_check
    check (discount_percent >= 0 and discount_percent <= 100)
);

insert into public.rental_pricing_settings (id, discount_from_days, discount_percent)
values (true, null, 0)
on conflict (id) do nothing;

alter table public.rental_pricing_settings enable row level security;

drop policy if exists "rental_pricing_settings_public_read" on public.rental_pricing_settings;
create policy "rental_pricing_settings_public_read"
  on public.rental_pricing_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "rental_pricing_settings_admin_all" on public.rental_pricing_settings;
create policy "rental_pricing_settings_admin_all"
  on public.rental_pricing_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- 20260505000019: Miet-Rabatt-Stufen ----
create table if not exists public.rental_discount_tiers (
  id uuid primary key default gen_random_uuid(),
  min_days int not null check (min_days >= 2),
  discount_percent int not null check (discount_percent > 0 and discount_percent <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (min_days)
);

insert into public.rental_discount_tiers (min_days, discount_percent)
select discount_from_days, discount_percent
from public.rental_pricing_settings
where id = true and discount_from_days is not null and discount_percent > 0
on conflict (min_days) do update
set discount_percent = excluded.discount_percent,
    updated_at = now();

alter table public.rental_discount_tiers enable row level security;

drop policy if exists "rental_discount_tiers_public_read" on public.rental_discount_tiers;
create policy "rental_discount_tiers_public_read"
  on public.rental_discount_tiers for select
  to anon, authenticated
  using (true);

drop policy if exists "rental_discount_tiers_admin_all" on public.rental_discount_tiers;
create policy "rental_discount_tiers_admin_all"
  on public.rental_discount_tiers for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- 20260506000020: Marketing-Content ----
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
  ('footer.link.privacy', 'Footer: Link Datenschutz', 'Datenschutz'),
  ('footer.note.inquiries', 'Footer: Hinweis Anfragen', 'Hinweis: Unverbindliche Anfragen über die Inserate.')
on conflict (key) do nothing;
