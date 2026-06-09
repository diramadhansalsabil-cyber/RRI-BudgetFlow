-- Email .local DITOLAK Supabase Auth — ganti ke domain .test
-- LANGKAH MANUAL DULU di Authentication → Users:
--   1. Hapus user admin@rri-budgetflow.local dan user@rri-budgetflow.local (jika ada)
--   2. Add user: admin@rribudgetflow.test / admin123 (Auto Confirm ON)
--   3. Add user: user@rribudgetflow.test / user123 (Auto Confirm ON)
-- Lalu jalankan script ini:

-- confirmed_at di Supabase adalah generated column — jangan di-UPDATE
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, timezone('utc', now()))
where lower(email) in ('admin@rribudgetflow.test', 'user@rribudgetflow.test');

delete from public.profiles
where lower(email) like '%rri-budgetflow.local%';

insert into public.profiles (id, username, email, nama, role)
select
  u.id,
  case when lower(u.email) like '%admin%' then 'admin' else 'user' end,
  lower(u.email),
  case when lower(u.email) like '%admin%' then 'Administrator' else 'Karyawan' end,
  case when lower(u.email) like '%admin%' then 'admin' else 'user' end
from auth.users u
where lower(u.email) in ('admin@rribudgetflow.test', 'user@rribudgetflow.test')
on conflict (id) do update set
  username = excluded.username,
  email = excluded.email,
  nama = excluded.nama,
  role = excluded.role;

select id, email, email_confirmed_at from auth.users where lower(email) like '%rribudgetflow.test%';
select username, email, role from public.profiles;
