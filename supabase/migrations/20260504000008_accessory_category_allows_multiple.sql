-- Per Zubehör-Kategorie: Mehrfachauswahl oder nur eine Option innerhalb der Gruppe.
alter table public.accessory_categories
  add column if not exists allows_multiple boolean not null default true;

comment on column public.accessory_categories.allows_multiple is
  'Wenn false: innerhalb dieser Kategorie höchstens ein Zubehör-Artikel pro Konfiguration wählbar.';
