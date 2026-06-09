-- RRI BudgetFlow v3 — Registrasi, profil lengkap, manajemen pengguna
-- Jalankan di Supabase SQL Editor (setelah schema.sql dasar)

-- ─── Perluas tabel profiles (setara users) ───
alter table public.profiles add column if not exists no_hp text default '';
alter table public.profiles add column if not exists status text not null default 'aktif';
alter table public.profiles add column if not exists updated_at timestamptz;

alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check
  check (status in ('aktif', 'nonaktif'));

-- Username boleh null (login pakai email saja)
alter table public.profiles alter column username drop not null;

-- ─── Cek ketersediaan email / username (registrasi) ───
create or replace function public.check_registration_available(p_email text, p_username text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_username text := lower(trim(coalesce(p_username, '')));
  email_taken boolean := false;
  username_taken boolean := false;
begin
  if v_email = '' then
    return jsonb_build_object('ok', false, 'message', 'Email wajib diisi');
  end if;

  select exists(
    select 1 from auth.users where lower(email) = v_email
    union all
    select 1 from public.profiles where lower(email) = v_email
  ) into email_taken;

  if v_username <> '' then
    select exists(
      select 1 from public.profiles where lower(trim(username)) = v_username
    ) into username_taken;
  end if;

  return jsonb_build_object(
    'ok', not email_taken and not username_taken,
    'email_taken', email_taken,
    'username_taken', username_taken,
    'message', case
      when email_taken then 'Email sudah terdaftar'
      when username_taken then 'Username sudah digunakan'
      else 'Tersedia'
    end
  );
end;
$$;

grant execute on function public.check_registration_available(text, text) to anon;
grant execute on function public.check_registration_available(text, text) to authenticated;

-- ─── Kode registrasi admin (samakan dengan js/config.js ADMIN_REGISTRATION_CODE) ───
create or replace function public.get_admin_registration_code()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select 'LPPRRI_KENDARI';
$$;

-- ─── Trigger: buat profil otomatis saat user mendaftar ───
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_nama text;
  v_no_hp text;
  v_role text := 'user';
  v_admin_code text;
begin
  v_username := nullif(trim(coalesce(new.raw_user_meta_data->>'username', '')), '');
  v_nama := coalesce(nullif(trim(new.raw_user_meta_data->>'nama'), ''), 'Pengguna Baru');
  v_no_hp := coalesce(new.raw_user_meta_data->>'no_hp', '');
  v_admin_code := trim(coalesce(new.raw_user_meta_data->>'admin_code', ''));

  if v_admin_code <> '' and v_admin_code = public.get_admin_registration_code() then
    v_role := 'admin';
  end if;

  if v_username is null then
    v_username := split_part(lower(new.email), '@', 1);
  end if;

  insert into public.profiles (id, username, email, nama, no_hp, role, status, created_at, updated_at)
  values (
    new.id,
    v_username,
    lower(new.email),
    v_nama,
    v_no_hp,
    v_role,
    'aktif',
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (id) do update set
    nama = excluded.nama,
    no_hp = excluded.no_hp,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Update profil sendiri (tanpa ubah role/status) ───
create or replace function public.update_own_profile(p_nama text, p_no_hp text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row_data public.profiles%rowtype;
begin
  if uid is null then
    raise exception 'Tidak ada session';
  end if;
  update public.profiles
  set
    nama = trim(p_nama),
    no_hp = coalesce(trim(p_no_hp), no_hp),
    updated_at = timezone('utc', now())
  where id = uid;
  select * into row_data from public.profiles where id = uid;
  return to_jsonb(row_data);
end;
$$;

grant execute on function public.update_own_profile(text, text) to authenticated;

-- ─── Admin: kelola role & status pengguna ───
create or replace function public.admin_update_user(
  p_user_id uuid,
  p_role text default null,
  p_status text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data public.profiles%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat mengubah data pengguna';
  end if;
  if p_user_id = auth.uid() and p_role is not null and p_role <> 'admin' then
    raise exception 'Admin tidak dapat menurunkan role diri sendiri';
  end if;
  if p_user_id = auth.uid() and p_status = 'nonaktif' then
    raise exception 'Admin tidak dapat menonaktifkan akun sendiri';
  end if;

  update public.profiles
  set
    role = coalesce(p_role, role),
    status = coalesce(p_status, status),
    updated_at = timezone('utc', now())
  where id = p_user_id;

  if not found then
    raise exception 'Pengguna tidak ditemukan';
  end if;

  select * into row_data from public.profiles where id = p_user_id;
  return to_jsonb(row_data);
end;
$$;

grant execute on function public.admin_update_user(uuid, text, text) to authenticated;

-- ─── Perbarui sync_profile_for_auth ───
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
  insert into public.profiles (id, username, email, nama, role, status, created_at, updated_at)
  values (
    uid,
    split_part(lower(uemail), '@', 1),
    lower(uemail),
    'Pengguna',
    'user',
    'aktif',
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = timezone('utc', now());
  select * into row_data from public.profiles where id = uid;
  return to_jsonb(row_data);
end;
$$;

-- ─── RLS: profil ───
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;

create policy "profiles_update_self" on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_admin_update" on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── Lookup login: email atau username ───
create or replace function public.get_login_email(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email from public.profiles
  where lower(trim(username)) = lower(trim(p_username))
     or lower(trim(email)) = lower(trim(p_username))
  limit 1;
$$;

grant execute on function public.get_login_email(text) to anon;
grant execute on function public.get_login_email(text) to authenticated;
