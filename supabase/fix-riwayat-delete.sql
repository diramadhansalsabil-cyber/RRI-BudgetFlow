-- Izinkan hapus arsip riwayat (status disetujui / ditolak)
-- Admin: semua arsip | Karyawan: arsip milik sendiri

drop policy if exists "pengajuan_delete_riwayat" on public.pengajuan;
create policy "pengajuan_delete_riwayat" on public.pengajuan for delete to authenticated
  using (
    status in ('approved', 'rejected')
    and (public.is_admin() or user_id = auth.uid())
  );
