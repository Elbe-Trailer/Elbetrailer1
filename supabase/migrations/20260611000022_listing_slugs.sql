alter table public.listings add column if not exists slug text;

-- Backfill slugs from title (ASCII-ish normalization; admin can refine later)
do $$
declare
  r record;
  base_slug text;
  candidate text;
  suffix int;
begin
  for r in select id, title from public.listings where slug is null or slug = '' loop
    base_slug := lower(trim(r.title));
    base_slug := replace(base_slug, 'ä', 'ae');
    base_slug := replace(base_slug, 'ö', 'oe');
    base_slug := replace(base_slug, 'ü', 'ue');
    base_slug := replace(base_slug, 'ß', 'ss');
    base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    if base_slug = '' then
      base_slug := 'inserat';
    end if;

    candidate := base_slug;
    suffix := 2;
    while exists (
      select 1 from public.listings l
      where l.slug = candidate and l.id <> r.id
    ) loop
      candidate := base_slug || '-' || suffix::text;
      suffix := suffix + 1;
    end loop;

    update public.listings set slug = candidate where id = r.id;
  end loop;
end $$;

alter table public.listings alter column slug set not null;

create unique index if not exists listings_slug_unique on public.listings (slug);
