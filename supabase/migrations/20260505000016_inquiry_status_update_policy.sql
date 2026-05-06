create policy "inquiries_update_admin"
  on public.inquiries for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "contact_inquiries_update_admin"
  on public.contact_inquiries for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
