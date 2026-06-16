create policy "inquiries_delete_admin"
  on public.inquiries for delete
  to authenticated
  using (public.is_admin());

create policy "contact_inquiries_delete_admin"
  on public.contact_inquiries for delete
  to authenticated
  using (public.is_admin());
