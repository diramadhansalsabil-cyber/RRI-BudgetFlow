-- RRI BudgetFlow — Supabase (PostgreSQL)
-- Jalankan di: Supabase Dashboard → SQL Editor → Run

create extension if not exists "pgcrypto";

-- ─── Profiles (terhubung Supabase Auth) ───
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  email text unique not null,
  nama text not null,
  no_hp text default '',
  role text not null check (role in ('admin', 'user')),
  status text not null default 'aktif' check (status in ('aktif', 'nonaktif')),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- ─── Template RAB ───
create table if not exists public.templates (
  id text primary key,
  nama_template text not null,
  deskripsi text default '',
  rab_type text not null default 'simple' check (rab_type in ('simple', 'sections')),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- ─── Pengajuan ───
create table if not exists public.pengajuan (
  id uuid primary key default gen_random_uuid(),
  kode text unique not null,
  user_id uuid not null references public.profiles (id) on delete restrict,
  template_id text not null references public.templates (id) on delete restrict,
  data_rab jsonb not null default '{}',
  total_anggaran numeric not null default 0,
  tanggal date,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  pesan_admin text default '',
  approved_amount numeric,
  tanggal_keputusan timestamptz,
  bukti_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists idx_pengajuan_status on public.pengajuan (status);
create index if not exists idx_pengajuan_user on public.pengajuan (user_id);
create index if not exists idx_pengajuan_created on public.pengajuan (created_at desc);

-- ─── Helper: role dari JWT ───
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- ─── RLS ───
alter table public.profiles enable row level security;
alter table public.templates enable row level security;
alter table public.pengajuan enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "templates_select" on public.templates;
create policy "templates_select" on public.templates for select to authenticated using (true);

drop policy if exists "templates_insert" on public.templates;
create policy "templates_insert" on public.templates for insert to authenticated
  with check (public.is_admin());

drop policy if exists "templates_update" on public.templates;
create policy "templates_update" on public.templates for update to authenticated
  using (public.is_admin());

drop policy if exists "templates_delete" on public.templates;
create policy "templates_delete" on public.templates for delete to authenticated
  using (public.is_admin());

drop policy if exists "pengajuan_select" on public.pengajuan;
create policy "pengajuan_select" on public.pengajuan for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "pengajuan_insert" on public.pengajuan;
create policy "pengajuan_insert" on public.pengajuan for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "pengajuan_update" on public.pengajuan;
create policy "pengajuan_update" on public.pengajuan for update to authenticated
  using (public.is_admin());

-- ─── Storage bucket: bukti ───
insert into storage.buckets (id, name, public)
values ('bukti', 'bukti', true)
on conflict (id) do update set public = true;

drop policy if exists "bukti_read" on storage.objects;
create policy "bukti_read" on storage.objects for select using (bucket_id = 'bukti');

drop policy if exists "bukti_upload" on storage.objects;
create policy "bukti_upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'bukti' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "bukti_delete" on storage.objects;
create policy "bukti_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'bukti' and (storage.foldername(name))[1] = auth.uid()::text);

-- ─── Seed template (tanpa user — buat user lewat Auth Dashboard) ───
insert into public.templates (id, nama_template, deskripsi, rab_type, payload)
values (
  'TMP-RAB',
  'Rencana Anggaran Belanja',
  'Format RAB resmi: Peralatan, Perlengkapan, dan Rekapitulasi otomatis',
  'sections',
  '{
    "judul": "Rencana Anggaran Belanja",
    "sections": [
      {"id": "peralatan", "label": "A. Peralatan", "footerLabel": "Jumlah", "fields": [
        {"label": "Peralatan", "type": "text", "required": true},
        {"label": "Banyak", "type": "number", "required": true},
        {"label": "Satuan", "type": "text", "required": true},
        {"label": "Harga Satuan", "type": "number", "required": true},
        {"label": "Jumlah Harga", "type": "calculated", "formula": "banyak * harga"}
      ]},
      {"id": "perlengkapan", "label": "B. Perlengkapan", "footerLabel": "Total", "fields": [
        {"label": "Perlengkapan", "type": "text", "required": true},
        {"label": "Banyak", "type": "number", "required": true},
        {"label": "Satuan", "type": "text", "required": true},
        {"label": "Harga", "type": "number", "required": true},
        {"label": "Jumlah Harga", "type": "calculated", "formula": "banyak * harga"}
      ]}
    ],
    "rekapitulasi": {"label": "C. Rekapitulasi"},
    "footer": {"lokasi": "Cikupa", "bidang": "Bidang BP/BK", "showTandaTangan": true}
  }'::jsonb
)
on conflict (id) do nothing;

insert into public.templates (id, nama_template, deskripsi, rab_type, payload)
values (
  'TMP-001',
  'RAB Pengadaan Barang (Sederhana)',
  'Template satu tabel — barang kantor',
  'simple',
  '{"fields": [
    {"label": "Nama Barang", "type": "text", "required": true},
    {"label": "Spesifikasi", "type": "textarea", "required": true},
    {"label": "Jumlah Unit", "type": "number", "required": true},
    {"label": "Harga Satuan", "type": "number", "required": true},
    {"label": "Total Harga", "type": "calculated", "formula": "jumlah * harga"}
  ]}'::jsonb
)
on conflict (id) do nothing;

-- Lookup email untuk login berbasis username (anon boleh panggil)
create or replace function public.get_login_email(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email from public.profiles where lower(trim(username)) = lower(trim(p_username)) limit 1;
$$;

grant execute on function public.get_login_email(text) to anon;
grant execute on function public.get_login_email(text) to authenticated;
