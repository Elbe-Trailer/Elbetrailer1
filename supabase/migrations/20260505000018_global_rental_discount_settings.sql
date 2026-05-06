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

create policy "rental_pricing_settings_public_read"
  on public.rental_pricing_settings for select
  to anon, authenticated
  using (true);

create policy "rental_pricing_settings_admin_all"
  on public.rental_pricing_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
