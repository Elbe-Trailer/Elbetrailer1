alter table public.inquiries
  add column if not exists status text not null default 'neu'
  check (status in ('neu', 'in_bearbeitung', 'abgeschlossen'));

alter table public.contact_inquiries
  add column if not exists status text not null default 'neu'
  check (status in ('neu', 'in_bearbeitung', 'abgeschlossen'));

create index if not exists inquiries_status_idx on public.inquiries (status);
create index if not exists contact_inquiries_status_idx on public.contact_inquiries (status);
