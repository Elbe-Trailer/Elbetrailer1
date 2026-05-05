alter table public.accessories
  add column if not exists category_id uuid references public.categories (id) on delete set null;

create index if not exists accessories_category_idx on public.accessories (category_id);
