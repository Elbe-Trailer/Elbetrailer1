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

create policy "rental_discount_tiers_public_read"
  on public.rental_discount_tiers for select
  to anon, authenticated
  using (true);

create policy "rental_discount_tiers_admin_all"
  on public.rental_discount_tiers for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
