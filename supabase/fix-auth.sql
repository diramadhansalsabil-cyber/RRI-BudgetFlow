-- Perbaikan login: profiles harus sama dengan auth.users
-- WAJIB: buat dulu user di Authentication → Users (lihat SETUP.md)

-- Cek user Auth (harus ada 2 baris)
select id, email, email_confirmed_at, created_at from auth.users
where email in ('admin@rribudgetflow.test', 'user@rribudgetflow.test');

-- Perbaiki role
update public.profiles p
set role = case when lower(trim(p.username)) = 'admin' then 'admin' else 'user' end
where p.role is null or trim(p.role) = '';

-- Hapus profil yang id-nya tidak ada di auth (hanya jika auth.users sudah ada)
delete from public.profiles p
where exists (select 1 from auth.users limit 1)
  and p.id not in (select id from auth.users);

-- Sinkron dari auth.users
insert into public.profiles (id, username, email, nama, role)
select
  u.id,
  case when u.email ilike '%admin%' then 'admin' else 'user' end,
  lower(u.email),
  case when u.email ilike '%admin%' then 'Administrator' else 'Karyawan' end,
  case when u.email ilike '%admin%' then 'admin' else 'user' end
from auth.users u
where lower(u.email) in (
  'admin@rribudgetflow.test',
  'user@rribudgetflow.test'
)
on conflict (id) do update set
  username = excluded.username,
  email = excluded.email,
  nama = excluded.nama,
  role = excluded.role;

-- Verifikasi
select id, username, email, role from public.profiles order by username;
