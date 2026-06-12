-- =============================================================================
-- Nur fehlende SEO-Änderungen (bestehendes Projekt, kein Reset)
--
-- RICHTIGES PROJEKT (laut .env.local):
--   Ref:  hwssdonggtwsfgothiwm
--   URL:  https://hwssdonggtwsfgothiwm.supabase.co
--   SQL:  https://supabase.com/dashboard/project/hwssdonggtwsfgothiwm/sql/new
--
-- Zuerst diagnose_project.sql ausführen — listings_table_exists muss 1 sein.
-- =============================================================================

do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'listings'
  ) then
    raise exception
      'Falsches Supabase-Projekt: public.listings fehlt. '
      'Öffne den SQL Editor für hwssdonggtwsfgothiwm '
      '(siehe Link oben in dieser Datei) und führe diagnose_project.sql aus.';
  end if;
end $$;

-- ---- Listing-Slugs (20260611000022) ----
alter table public.listings add column if not exists slug text;

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

-- Leere Tabelle: slug-Spalte trotzdem NOT NULL-fähig machen (keine Zeilen betroffen)
alter table public.listings alter column slug set not null;

create unique index if not exists listings_slug_unique on public.listings (slug);

-- ---- Datenschutz GA4-Abschnitt (20260611000023) ----
update public.site_pages
set
  content = content || '
<h2 id="webanalyse">8. Webanalyse (Google Analytics 4)</h2>
<p>Wenn Sie im Cookie-Banner „Alle akzeptieren“ wählen, setzen wir Google Analytics 4 ein, einen Webanalysedienst der Google Ireland Limited (Gordon House, Barrow Street, Dublin 4, Irland) bzw. Google LLC (USA).</p>
<p><strong>Zweck:</strong> Reichweitenmessung und Analyse des Nutzungsverhaltens, um unser Angebot zu verbessern.</p>
<p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO (Einwilligung). Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen — über „Cookie-Einstellungen“ im Footer oder durch Löschen der gespeicherten Einwilligung im Browser.</p>
<p><strong>Verarbeitete Daten:</strong> u. a. gekürzte IP-Adresse, Seitenaufrufe, Verweildauer, Geräte- und Browserinformationen, ungefährer Standort (Land/Region). Die IP-Anonymisierung ist aktiviert.</p>
<p><strong>Speicherdauer:</strong> gemäß den Einstellungen in Google Analytics (standardmäßig begrenzte Aufbewahrungsfristen).</p>
<p><strong>Drittlandtransfer:</strong> Daten können in die USA übermittelt werden. Google stützt sich u. a. auf Standardvertragsklauseln der EU-Kommission.</p>
<p><strong>Widerspruch:</strong> Browser-Plugin zur Deaktivierung von Google Analytics: <a href="https://tools.google.com/dlpage/gaoptout" rel="noopener noreferrer" target="_blank">https://tools.google.com/dlpage/gaoptout</a></p>',
  updated_at = timezone('utc', now())
where slug = 'datenschutz'
  and content not like '%id="webanalyse"%';

-- ---- Listing-Aufruf-Statistik (20260611000027) ----
-- Vollständig auch in apply_listing_analytics.sql
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
