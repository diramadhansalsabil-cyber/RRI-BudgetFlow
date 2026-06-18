-- Perbaikan: karyawan tidak bisa kirim ulang pengajuan revisi
-- Error: new row violates row-level security policy for table "pengajuan"
-- Penyebab: policy update hanya mengizinkan status 'revisi', tetapi setelah kirim ulang status berubah ke 'pending'

drop policy if exists "pengajuan_update" on public.pengajuan;

create policy "pengajuan_update" on public.pengajuan
  for update to authenticated
  using (
    public.is_admin()
    or (user_id = auth.uid() and status = 'revisi')
  )
  with check (
    public.is_admin()
    or (user_id = auth.uid() and status = 'pending')
  );
