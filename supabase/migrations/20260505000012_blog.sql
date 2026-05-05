-- Blog: categories, posts, RLS, storage

create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text not null default '',
  author text,
  cover_image_path text,
  category_id uuid references public.blog_categories (id) on delete set null,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index blog_posts_published_published_at_idx
  on public.blog_posts (published, published_at desc nulls last);

create index blog_posts_category_id_idx on public.blog_posts (category_id);

alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;

create policy "blog_categories_public_read"
  on public.blog_categories for select
  to anon, authenticated
  using (is_active = true);

create policy "blog_categories_admin_all"
  on public.blog_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "blog_posts_public_read"
  on public.blog_posts for select
  to anon, authenticated
  using (published = true);

create policy "blog_posts_admin_all"
  on public.blog_posts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('blog', 'blog', true)
on conflict (id) do nothing;

create policy "storage_public_read_blog"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'blog');

create policy "storage_admin_insert_blog"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'blog' and public.is_admin());

create policy "storage_admin_update_blog"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'blog' and public.is_admin());

create policy "storage_admin_delete_blog"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'blog' and public.is_admin());
