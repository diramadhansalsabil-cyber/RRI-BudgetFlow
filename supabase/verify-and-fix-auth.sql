-- ═══ DIAGNOSA + PERBAIKAN LOGIN ═══
-- Jalankan seluruh file ini di SQL Editor (satu kali)

-- 1) Cek user di Authentication (auth.users)
select id, email, email_confirmed_at, created_at
from auth.users
order by email;

-- 2) Cek profiles
select id, username, email, role from public.profiles order by username;

-- 3) Paksa email terkonfirmasi (sering penyebab login gagal)
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, timezone('utc', now()))
where lower(email) in (
  'admin@rribudgetflow.test',
  'user@rribudgetflow.test'
);

-- 4) Perbaiki fungsi lookup username
create or replace function public.get_login_email(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email from public.profiles
  where lower(trim(username)) = lower(trim(p_username))
  limit 1;
$$;

grant execute on function public.get_login_email(text) to anon;
grant execute on function public.get_login_email(text) to authenticated;

-- 5) Sinkron profiles ← auth.users
delete from public.profiles p
where exists (select 1 from auth.users limit 1)
  and p.id not in (select id from auth.users);

insert into public.profiles (id, username, email, nama, role)
select
  u.id,
  case when lower(u.email) like '%admin%' then 'admin' else 'user' end,
  lower(u.email),
  case when lower(u.email) like '%admin%' then 'Administrator' else 'Karyawan' end,
  case when lower(u.email) like '%admin%' then 'admin' else 'user' end
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

-- 6) Setelah login: sinkron profil dari session Auth
create or replace function public.sync_profile_for_auth()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  uemail text;
  row_data public.profiles%rowtype;
begin
  if uid is null then
    raise exception 'Tidak ada session Auth';
  end if;
  select email into uemail from auth.users where id = uid;
  insert into public.profiles (id, username, email, nama, role)
  values (
    uid,
    case when lower(uemail) like '%admin%' then 'admin' else 'user' end,
    lower(uemail),
    case when lower(uemail) like '%admin%' then 'Administrator' else 'Karyawan' end,
    case when lower(uemail) like '%admin%' then 'admin' else 'user' end
  )
  on conflict (id) do update set
    email = excluded.email,
    username = excluded.username,
    nama = excluded.nama,
    role = excluded.role;
  select * into row_data from public.profiles where id = uid;
  return to_jsonb(row_data);
end;
$$;

grant execute on function public.sync_profile_for_auth() to authenticated;

-- 7) Verifikasi akhir
select
  u.email,
  u.email_confirmed_at is not null as email_ok,
  p.username,
  p.role,
  u.id = p.id as id_match
from auth.users u
left join public.profiles p on p.id = u.id
where lower(u.email) like '%rribudgetflow.test%';
