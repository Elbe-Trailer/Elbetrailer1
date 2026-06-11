-- =============================================================================
-- DIAGNOSE: Welches Supabase-Projekt ist der SQL Editor gerade?
-- Erwartet für diese App (.env.local): hwssdonggtwsfgothiwm
-- Direktlink SQL Editor:
-- https://supabase.com/dashboard/project/hwssdonggtwsfgothiwm/sql/new
-- =============================================================================

select
  current_database() as database_name,
  (
    select count(*)::int
    from information_schema.tables
    where table_schema = 'public' and table_name = 'listings'
  ) as listings_table_exists,
  (
    select count(*)::int
    from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles'
  ) as profiles_table_exists,
  (
    select count(*)::int
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'listings'
      and column_name = 'slug'
  ) as listings_slug_column_exists;

-- Wenn listings_table_exists = 1 → richtiges Projekt, apply_missing_seo_only.sql ausführen
-- Wenn listings_table_exists = 0 → falsches/leeres Projekt (URL oben prüfen)

select id, title from public.listings limit 3;
