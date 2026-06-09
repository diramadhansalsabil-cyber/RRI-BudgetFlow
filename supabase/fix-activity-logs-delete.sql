-- Izinkan admin menghapus log aktivitas (untuk menu Bersihkan Histori)
drop policy if exists "logs_admin_delete" on public.activity_logs;
create policy "logs_admin_delete" on public.activity_logs for delete to authenticated
  using (public.is_admin());
