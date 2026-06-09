-- Kolom nama pengusul (editable di form, tidak selalu sama dengan akun login)
alter table public.pengajuan add column if not exists nama_pengusul text;

-- Isi data lama dari profil pemilik pengajuan
update public.pengajuan p
set nama_pengusul = pr.nama
from public.profiles pr
where p.user_id = pr.id
  and (p.nama_pengusul is null or trim(p.nama_pengusul) = '');
