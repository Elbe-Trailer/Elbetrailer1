drop policy if exists "rental_units_public_read" on public.rental_units;
drop policy if exists "rental_calendar_blocks_public_read" on public.rental_calendar_blocks;
drop policy if exists "rental_bookings_public_read" on public.rental_bookings;

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
