-- =============================================================================
-- Listing-Aufruf-Statistik (Migration 20260611000027)
-- Im Supabase SQL Editor ausführen, wenn Admin → Statistik immer 0 zeigt.
-- =============================================================================

create table if not exists public.listing_view_daily (
  listing_id uuid not null references public.listings (id) on delete cascade,
  view_date date not null default (timezone('utc', now()))::date,
  view_count integer not null default 0 check (view_count >= 0),
  primary key (listing_id, view_date)
);

create index if not exists listing_view_daily_view_date_idx
  on public.listing_view_daily (view_date);

alter table public.listing_view_daily enable row level security;

drop policy if exists "listing_view_daily_admin_read" on public.listing_view_daily;
create policy "listing_view_daily_admin_read"
  on public.listing_view_daily
  for select
  using (public.is_admin());

create or replace function public.increment_listing_view(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.listing_view_daily (listing_id, view_date, view_count)
  values (p_listing_id, (timezone('utc', now()))::date, 1)
  on conflict (listing_id, view_date)
  do update set view_count = listing_view_daily.view_count + 1;
end;
$$;

revoke all on function public.increment_listing_view(uuid) from public;
grant execute on function public.increment_listing_view(uuid) to service_role;
