-- Anhänger-Miete: rental units, calendar blocks and bookings

create table public.rental_units (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references public.listings (id) on delete cascade,
  active boolean not null default true,
  min_rental_days int not null default 1 check (min_rental_days >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rental_calendar_blocks (
  id uuid primary key default gen_random_uuid(),
  rental_unit_id uuid not null references public.rental_units (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint rental_calendar_blocks_valid_range check (end_date >= start_date)
);

create index rental_calendar_blocks_unit_range_idx
  on public.rental_calendar_blocks (rental_unit_id, start_date, end_date);

do $$ begin
  create type public.rental_booking_status as enum ('pending', 'confirmed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

create table public.rental_bookings (
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

create index rental_bookings_unit_status_range_idx
  on public.rental_bookings (rental_unit_id, status, start_date, end_date);

alter table public.inquiries
  add column if not exists rental_unit_id uuid references public.rental_units (id) on delete set null,
  add column if not exists start_date date,
  add column if not exists end_date date;

alter table public.inquiries
  add constraint inquiries_valid_date_range
  check (
    (start_date is null and end_date is null)
    or (start_date is not null and end_date is not null and end_date >= start_date)
  );

create index if not exists inquiries_rental_unit_idx on public.inquiries (rental_unit_id);
create index if not exists inquiries_start_end_idx on public.inquiries (start_date, end_date);

alter table public.rental_units enable row level security;
alter table public.rental_calendar_blocks enable row level security;
alter table public.rental_bookings enable row level security;

create policy "rental_units_public_read"
  on public.rental_units for select
  to anon, authenticated
  using (
    active = true
    and exists (
      select 1 from public.listings l
      where l.id = rental_units.listing_id
        and l.published = true
        and l.listing_type = 'miete'
    )
  );

create policy "rental_units_admin_all"
  on public.rental_units for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

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
        and l.listing_type = 'miete'
    )
  );

create policy "rental_calendar_blocks_admin_all"
  on public.rental_calendar_blocks for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

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
        and l.listing_type = 'miete'
    )
  );

create policy "rental_bookings_admin_all"
  on public.rental_bookings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
