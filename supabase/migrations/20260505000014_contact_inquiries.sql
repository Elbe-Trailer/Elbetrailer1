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

create policy "contact_inquiries_insert_public"
  on public.contact_inquiries for insert
  to anon, authenticated
  with check (true);

create policy "contact_inquiries_select_admin"
  on public.contact_inquiries for select
  to authenticated
  using (public.is_admin());
