-- Anfragen löschen: fehlende RLS-Delete-Policies (im Supabase SQL Editor ausführen)

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'inquiries'
      and policyname = 'inquiries_delete_admin'
  ) then
    create policy "inquiries_delete_admin"
      on public.inquiries for delete
      to authenticated
      using (public.is_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contact_inquiries'
      and policyname = 'contact_inquiries_delete_admin'
  ) then
    create policy "contact_inquiries_delete_admin"
      on public.contact_inquiries for delete
      to authenticated
      using (public.is_admin());
  end if;
end $$;
