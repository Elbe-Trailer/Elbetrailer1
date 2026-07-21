-- Einkaufspreise (netto, Cent) für Inserate und Zubehör + Admin-Preis-UI-Zustand.
-- Bewusst separate Tabellen statt Spalten auf listings/accessories:
-- listings_public_read/accessories_public_read geben anon SELECT auf alle Spalten
-- (RLS ist zeilenbasiert), und Spalten-Grants können Admins nicht von anderen
-- authenticated-Nutzern unterscheiden. Diese Tabellen haben ausschließlich
-- eine Admin-Policy und keinerlei anon-Zugriff.

create table if not exists public.listing_costs (
  listing_id uuid primary key references public.listings (id) on delete cascade,
  purchase_price_net_cents integer
    check (purchase_price_net_cents is null or purchase_price_net_cents >= 0),
  vk_input_mode text not null default 'brutto'
    check (vk_input_mode in ('brutto', 'netto')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accessory_costs (
  accessory_id uuid primary key references public.accessories (id) on delete cascade,
  purchase_price_net_cents integer
    check (purchase_price_net_cents is null or purchase_price_net_cents >= 0),
  vk_input_mode text not null default 'brutto'
    check (vk_input_mode in ('brutto', 'netto')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listing_costs enable row level security;
alter table public.accessory_costs enable row level security;

-- Keine anon-/public-Policy: Nicht-Admins sehen keine Zeilen.
drop policy if exists "listing_costs_admin_all" on public.listing_costs;
create policy "listing_costs_admin_all"
  on public.listing_costs
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "accessory_costs_admin_all" on public.accessory_costs;
create policy "accessory_costs_admin_all"
  on public.accessory_costs
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Defense in depth: Standard-Grants für anon entziehen, damit selbst ein
-- versehentliches "disable row level security" keine EK-Daten freigibt.
revoke all on table public.listing_costs from anon;
revoke all on table public.accessory_costs from anon;
