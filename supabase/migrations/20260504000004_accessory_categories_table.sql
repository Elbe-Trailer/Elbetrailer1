create table if not exists public.accessory_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.accessory_categories enable row level security;

drop policy if exists "accessory_categories_public_read" on public.accessory_categories;
create policy "accessory_categories_public_read"
  on public.accessory_categories for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "accessory_categories_admin_all" on public.accessory_categories;
create policy "accessory_categories_admin_all"
  on public.accessory_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

alter table public.accessories
  drop constraint if exists accessories_category_id_fkey;

update public.accessories
set category_id = null;

alter table public.accessories
  add constraint accessories_category_id_fkey
  foreign key (category_id)
  references public.accessory_categories (id)
  on delete set null;
