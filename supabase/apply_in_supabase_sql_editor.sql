-- =============================================================================
-- Anhänger Marktplatz: ALLES IN EINEM (Schema + Seeds)
-- Supabase → SQL Editor → New query → Einfügen → Run
-- NUR auf leerem Projekt / Erst-Setup. Sonst ggf. nur fehlende Teile.
-- =============================================================================

-- Anhänger Marktplatz — initial schema, RLS, storage

create extension if not exists "pgcrypto";

-- ---- Types ----
do $$ begin
  create type public.listing_type as enum ('kauf', 'miete');
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

-- ---- 20260504000008: Zubehör-Kategorie Mehrfach vs. Einzelauswahl ----
alter table public.accessory_categories
  add column if not exists allows_multiple boolean not null default true;

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
