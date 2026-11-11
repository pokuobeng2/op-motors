
create policy "Members read vehicle photos" on storage.objects for select to authenticated
  using (bucket_id = 'vehicle-photos' and public.is_active_member(auth.uid()));
create policy "Permitted members upload vehicle photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'vehicle-photos' and (public.has_permission(auth.uid(), 'manage_photos') or public.has_permission(auth.uid(), 'add_vehicles')));
create policy "Permitted members update vehicle photos" on storage.objects for update to authenticated
  using (bucket_id = 'vehicle-photos' and (public.has_permission(auth.uid(), 'manage_photos') or public.has_permission(auth.uid(), 'add_vehicles')));
create policy "Permitted members delete vehicle photos" on storage.objects for delete to authenticated
  using (bucket_id = 'vehicle-photos' and (public.has_permission(auth.uid(), 'manage_photos') or public.has_permission(auth.uid(), 'add_vehicles')));
